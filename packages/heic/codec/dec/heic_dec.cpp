#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "libheif/heif.h"

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

val decode(std::string heicimage) {
  heif_context* ctx = heif_context_alloc();
  heif_error error;

  error = heif_context_read_from_memory_without_copy(
      ctx, heicimage.c_str(), heicimage.length(), nullptr);

  if (error.code != heif_error_Ok) {
    heif_context_free(ctx);
    return val::null();
  }

  // Get the primary image handle
  heif_image_handle* handle;
  error = heif_context_get_primary_image_handle(ctx, &handle);
  if (error.code != heif_error_Ok) {
    heif_context_free(ctx);
    return val::null();
  }

  // Decode image to RGBA
  heif_image* image;
  error = heif_decode_image(handle, &image, heif_colorspace_RGB,
                            heif_chroma_interleaved_RGBA, nullptr);
  if (error.code != heif_error_Ok) {
    heif_image_handle_release(handle);
    heif_context_free(ctx);
    return val::null();
  }

  int width = heif_image_get_width(image, heif_channel_interleaved);
  int height = heif_image_get_height(image, heif_channel_interleaved);
  int stride;
  const uint8_t* data =
      heif_image_get_plane_readonly(image, heif_channel_interleaved, &stride);

  // Copy pixel data row by row (stride may differ from width * 4)
  size_t row_bytes = width * 4;
  size_t total_bytes = row_bytes * height;

  val result = val::null();

  if (stride == (int)row_bytes) {
    result = ImageData.new_(
        Uint8ClampedArray.new_(typed_memory_view(total_bytes, data)),
        width, height);
  } else {
    // Need to remove stride padding
    val pixel_data = Uint8ClampedArray.new_(total_bytes);
    for (int y = 0; y < height; y++) {
      pixel_data.call<void>("set", val(typed_memory_view(row_bytes, data + y * stride)), y * row_bytes);
    }
    result = ImageData.new_(pixel_data, width, height);
  }

  heif_image_release(image);
  heif_image_handle_release(handle);
  heif_context_free(ctx);

  return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
