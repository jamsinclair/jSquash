#include <string>
#include "emscripten/bind.h"
#include "emscripten/val.h"
#include "src/webp/decode.h"
#include "src/webp/demux.h"

using namespace emscripten;

int version() {
  return WebPGetDecoderVersion();
}

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

val decode(std::string buffer) {
  int width, height;
  std::unique_ptr<uint8_t[]> rgba(
      WebPDecodeRGBA((const uint8_t*)buffer.c_str(), buffer.size(), &width, &height));
  return rgba ? ImageData.new_(
                    Uint8ClampedArray.new_(typed_memory_view(width * height * 4, rgba.get())),
                    width, height)
              : val::null();
}

struct Frame {
  val imageData;
  int duration;
};

val decodeAnimated(std::string buffer) {
  WebPData webp_data;
  webp_data.bytes = reinterpret_cast<const uint8_t*>(buffer.c_str());
  webp_data.size = buffer.size();
  
  WebPDemuxer* demux = WebPDemux(&webp_data);
  if (!demux) return val::null();
  
  // Get canvas dimensions from container
  int canvas_width = WebPDemuxGetI(demux, WEBP_FF_CANVAS_WIDTH);
  int canvas_height = WebPDemuxGetI(demux, WEBP_FF_CANVAS_HEIGHT);
  
  // Buffer to store the current complete canvas state
  std::vector<uint8_t> canvas_buffer(canvas_width * canvas_height * 4, 0);
  
  val frames = val::array();
  WebPIterator iter;
  if (!WebPDemuxGetFrame(demux, 1, &iter)) {
    WebPDemuxDelete(demux);
    return val::null();
  }
  
  do {
    int frame_width, frame_height;
    uint8_t* frame_rgba = WebPDecodeRGBA(iter.fragment.bytes, iter.fragment.size, 
                                        &frame_width, &frame_height);
    
    if (frame_rgba) {
      int x_offset = iter.x_offset;
      int y_offset = iter.y_offset;
      
      // Handle disposal method
      if (iter.dispose_method == WEBP_MUX_DISPOSE_BACKGROUND) {
        // Clear the region of the previous frame
        for (int y = y_offset; y < y_offset + frame_height && y < canvas_height; y++) {
          for (int x = x_offset; x < x_offset + frame_width && x < canvas_width; x++) {
            size_t canvas_idx = (y * canvas_width + x) * 4;
            canvas_buffer[canvas_idx + 0] = 0;
            canvas_buffer[canvas_idx + 1] = 0;
            canvas_buffer[canvas_idx + 2] = 0;
            canvas_buffer[canvas_idx + 3] = 0;
          }
        }
      }
      
      // Blend new frame onto canvas
      for (int y = 0; y < frame_height; y++) {
        for (int x = 0; x < frame_width; x++) {
          int canvas_x = x + x_offset;
          int canvas_y = y + y_offset;
          
          if (canvas_x >= canvas_width || canvas_y >= canvas_height) continue;
          
          size_t frame_idx = (y * frame_width + x) * 4;
          size_t canvas_idx = (canvas_y * canvas_width + canvas_x) * 4;
          
          // Handle alpha blending
          uint8_t frame_alpha = frame_rgba[frame_idx + 3];
          if (frame_alpha == 255) {
            // Opaque pixel, just copy
            canvas_buffer[canvas_idx + 0] = frame_rgba[frame_idx + 0];
            canvas_buffer[canvas_idx + 1] = frame_rgba[frame_idx + 1];
            canvas_buffer[canvas_idx + 2] = frame_rgba[frame_idx + 2];
            canvas_buffer[canvas_idx + 3] = frame_rgba[frame_idx + 3];
          } else if (frame_alpha > 0) {
            // Semi-transparent pixel, blend with existing
            float alpha = frame_alpha / 255.0f;
            canvas_buffer[canvas_idx + 0] = frame_rgba[frame_idx + 0] * alpha + canvas_buffer[canvas_idx + 0] * (1 - alpha);
            canvas_buffer[canvas_idx + 1] = frame_rgba[frame_idx + 1] * alpha + canvas_buffer[canvas_idx + 1] * (1 - alpha);
            canvas_buffer[canvas_idx + 2] = frame_rgba[frame_idx + 2] * alpha + canvas_buffer[canvas_idx + 2] * (1 - alpha);
            canvas_buffer[canvas_idx + 3] = frame_alpha + canvas_buffer[canvas_idx + 3] * (1 - alpha);
          }
        }
      }

      val imageData = ImageData.new_(
          Uint8ClampedArray.new_(typed_memory_view(canvas_width * canvas_height * 4, canvas_buffer.data())),
          canvas_width, canvas_height);
      
      val frame = val::object();
      frame.set("imageData", imageData);
      frame.set("duration", iter.duration);
      frames.call<void>("push", frame);
      
      free(frame_rgba);
    }
  } while (WebPDemuxNextFrame(&iter));
  
  WebPDemuxReleaseIterator(&iter);
  WebPDemuxDelete(demux);
  
  return frames;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
  function("decodeAnimated", &decodeAnimated);
  function("version", &version);
}
