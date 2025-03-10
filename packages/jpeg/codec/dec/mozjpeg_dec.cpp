#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "config.h"
#include "jpeglib.h"
#include <string.h>
#include <vector>

extern "C" {
#include "cdjpeg.h"
#include "jerror.h"
}

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

constexpr uint16_t EXIF_ORIENTATION_TAG = 0x0112;

inline uint16_t get_exif_short(const uint8_t *data, int offset, bool is_motorola)
{
  return is_motorola
             ? (data[offset] << 8) | data[offset + 1]
             : (data[offset + 1] << 8) | data[offset];
}

inline uint32_t get_exif_long(const uint8_t *data, int offset, bool is_motorola)
{
  return is_motorola
             ? (data[offset] << 24) | (data[offset + 1] << 16) |
                   (data[offset + 2] << 8) | data[offset + 3]
             : (data[offset + 3] << 24) | (data[offset + 2] << 16) |
                   (data[offset + 1] << 8) | data[offset];
}

int parse_exif_orientation(const uint8_t *exif_data, unsigned int data_length)
{
  if (data_length < 12)
    return 0;

  constexpr int tiff_header_offset = 6; // Skip "Exif\0\0" header

  // Check byte alignment (II=Intel, MM=Motorola)
  bool is_motorola = (exif_data[tiff_header_offset] == 'M' &&
                      exif_data[tiff_header_offset + 1] == 'M');

  if (!is_motorola && (exif_data[tiff_header_offset] != 'I' ||
                       exif_data[tiff_header_offset + 1] != 'I'))
    return 0; // Invalid byte alignment

  if (get_exif_short(exif_data, tiff_header_offset + 2, is_motorola) != 0x002A)
    return 0;

  uint32_t offset = get_exif_long(exif_data, tiff_header_offset + 4, is_motorola);

  if (offset < 8 || offset > data_length - 2)
    return 0;

  offset += tiff_header_offset;

  uint16_t number_of_tags = get_exif_short(exif_data, offset, is_motorola);
  offset += 2;

  // Scan for orientation tag
  for (uint16_t i = 0; i < number_of_tags && offset + 12 <= data_length; i++, offset += 12)
  {
    if (get_exif_short(exif_data, offset, is_motorola) == EXIF_ORIENTATION_TAG)
    {
      return get_exif_short(exif_data, offset + 8, is_motorola);
    }
  }

  return 0;
}

int extract_orientation(struct jpeg_decompress_struct *cinfo)
{
  for (jpeg_saved_marker_ptr marker = cinfo->marker_list; marker != nullptr; marker = marker->next)
  {
    if (marker->marker == JPEG_APP0 + 1 &&
        marker->data_length >= 6 &&
        memcmp(marker->data, "Exif\0\0", 6) == 0)
    {

      int orient = parse_exif_orientation(
          reinterpret_cast<const uint8_t *>(marker->data),
          marker->data_length);

      if (orient > 0)
      {
        return orient;
      }
    }
  }
  return 0;
}

void apply_orientation(uint8_t *buffer, int width, int height, int orientation)
{
  if (orientation <= 1)
    return; // No change needed

  const bool dimensions_swapped = (orientation >= 5 && orientation <= 8);
  const int dst_width = dimensions_swapped ? height : width;
  const int dst_height = dimensions_swapped ? width : height;

  std::vector<uint8_t> temp(width * height * 4);
  std::memcpy(temp.data(), buffer, width * height * 4);

  std::vector<uint8_t> rotated(dst_width * dst_height * 4, 0);

  for (int dst_y = 0; dst_y < dst_height; dst_y++)
  {
    for (int dst_x = 0; dst_x < dst_width; dst_x++)
    {
      int src_x = dst_x;
      int src_y = dst_y;

      // Apply transformation based on orientation
      switch (orientation)
      {
      case 2: // Flip horizontally
        src_x = width - 1 - dst_x;
        break;
      case 3: // Rotate 180°
        src_x = width - 1 - dst_x;
        src_y = height - 1 - dst_y;
        break;
      case 4: // Flip vertically
        src_y = height - 1 - dst_y;
        break;
      case 5: // Transpose
        src_x = dst_y;
        src_y = dst_x;
        break;
      case 6: // Rotate 90° clockwise
        src_x = dst_y;
        src_y = width - 1 - dst_x;
        break;
      case 7: // Transverse
        src_x = width - 1 - dst_y;
        src_y = height - 1 - dst_x;
        break;
      case 8: // Rotate 270° clockwise
        src_x = width - 1 - dst_y;
        src_y = dst_x;
        break;
      }

      // Check bounds and copy pixel
      if (src_x >= 0 && src_x < width && src_y >= 0 && src_y < height)
      {
        const int dst_offset = (dst_y * dst_width + dst_x) * 4;
        const int src_offset = (src_y * width + src_x) * 4;
        std::memcpy(rotated.data() + dst_offset, temp.data() + src_offset, 4);
      }
    }
  }

  std::memcpy(buffer, rotated.data(), dst_width * dst_height * 4);
}

val decode(std::string image_in, bool preserve_orientation)
{
  const uint8_t *image_buffer = reinterpret_cast<const uint8_t *>(image_in.c_str());

  jpeg_decompress_struct cinfo;
  jpeg_error_mgr jerr;
  cinfo.err = jpeg_std_error(&jerr);
  jpeg_create_decompress(&cinfo);

  jpeg_mem_src(&cinfo, image_buffer, image_in.length());
  jpeg_save_markers(&cinfo, JPEG_APP0 + 1, 0xFFFF);
  jpeg_read_header(&cinfo, TRUE);

  int orientation = preserve_orientation ? extract_orientation(&cinfo) : 1;

  cinfo.out_color_space = JCS_EXT_RGBA;
  jpeg_start_decompress(&cinfo);

  const int width = cinfo.output_width;
  const int height = cinfo.output_height;

  // Determine final dimensions based on orientation
  const int final_width = (orientation >= 5 && orientation <= 8) ? height : width;
  const int final_height = (orientation >= 5 && orientation <= 8) ? width : height;

  const size_t buffer_size = width * height * 4;
  std::vector<uint8_t> buffer(buffer_size);

  while (cinfo.output_scanline < cinfo.output_height)
  {
    uint8_t *scanline = &buffer[cinfo.output_width * 4 * cinfo.output_scanline];
    jpeg_read_scanlines(&cinfo, &scanline, 1);
  }

  jpeg_finish_decompress(&cinfo);
  jpeg_destroy_decompress(&cinfo);

  if (orientation > 1)
  {
    apply_orientation(buffer.data(), width, height, orientation);
  }

  auto data = Uint8ClampedArray.new_(typed_memory_view(buffer_size, buffer.data()));
  auto result = ImageData.new_(data, final_width, final_height);

  return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
