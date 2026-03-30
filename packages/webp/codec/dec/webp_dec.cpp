#include <string>
#include <cstring>
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
thread_local const val Array = val::global("Array");
thread_local const val Object = val::global("Object");

// Helper: compose a single frame onto a canvas
void compositeFrame(uint8_t* canvas, int canvasWidth, int canvasHeight,
                    const WebPIterator& iter) {
  int fw, fh;
  uint8_t* frameRgba = WebPDecodeRGBA(iter.fragment.bytes, iter.fragment.size, &fw, &fh);
  if (!frameRgba) return;

  for (int y = 0; y < fh && (y + iter.y_offset) < canvasHeight; y++) {
    for (int x = 0; x < fw && (x + iter.x_offset) < canvasWidth; x++) {
      size_t srcIdx = ((size_t)y * fw + x) * 4;
      size_t dstIdx = ((size_t)(y + iter.y_offset) * canvasWidth + (x + iter.x_offset)) * 4;

      uint8_t srcA = frameRgba[srcIdx + 3];

      if (iter.blend_method == WEBP_MUX_BLEND && srcA < 255 && canvas[dstIdx + 3] > 0) {
        uint8_t dstA = canvas[dstIdx + 3];
        uint16_t outA = srcA + dstA * (255 - srcA) / 255;
        if (outA > 0) {
          canvas[dstIdx]     = (uint8_t)((frameRgba[srcIdx]     * srcA + canvas[dstIdx]     * dstA * (255 - srcA) / 255) / outA);
          canvas[dstIdx + 1] = (uint8_t)((frameRgba[srcIdx + 1] * srcA + canvas[dstIdx + 1] * dstA * (255 - srcA) / 255) / outA);
          canvas[dstIdx + 2] = (uint8_t)((frameRgba[srcIdx + 2] * srcA + canvas[dstIdx + 2] * dstA * (255 - srcA) / 255) / outA);
          canvas[dstIdx + 3] = (uint8_t)outA;
        }
      } else {
        canvas[dstIdx]     = frameRgba[srcIdx];
        canvas[dstIdx + 1] = frameRgba[srcIdx + 1];
        canvas[dstIdx + 2] = frameRgba[srcIdx + 2];
        canvas[dstIdx + 3] = srcA;
      }
    }
  }

  WebPFree(frameRgba);
}

// Decode first frame (works for both static and animated WebP)
val decode(std::string buffer) {
  // Try simple decode first (fast path for static images)
  int width, height;
  std::unique_ptr<uint8_t[]> rgba(
      WebPDecodeRGBA((const uint8_t*)buffer.c_str(), buffer.size(), &width, &height));
  if (rgba) {
    return ImageData.new_(
        Uint8ClampedArray.new_(typed_memory_view(width * height * 4, rgba.get())),
        width, height);
  }

  // Fallback: use demux API for animated WebP
  WebPData webp_data;
  webp_data.bytes = (const uint8_t*)buffer.c_str();
  webp_data.size = buffer.size();

  WebPDemuxer* demux = WebPDemux(&webp_data);
  if (!demux) return val::null();

  int canvasWidth = WebPDemuxGetI(demux, WEBP_FF_CANVAS_WIDTH);
  int canvasHeight = WebPDemuxGetI(demux, WEBP_FF_CANVAS_HEIGHT);
  size_t canvasBytes = (size_t)canvasWidth * canvasHeight * 4;

  uint8_t* canvas = (uint8_t*)malloc(canvasBytes);
  if (!canvas) { WebPDemuxDelete(demux); return val::null(); }
  memset(canvas, 0, canvasBytes);

  WebPIterator iter;
  if (WebPDemuxGetFrame(demux, 1, &iter)) {
    compositeFrame(canvas, canvasWidth, canvasHeight, iter);
    WebPDemuxReleaseIterator(&iter);
  }

  val result = ImageData.new_(
      Uint8ClampedArray.new_(typed_memory_view(canvasBytes, canvas)),
      canvasWidth, canvasHeight);

  free(canvas);
  WebPDemuxDelete(demux);
  return result;
}

bool isAnimated(std::string buffer) {
  WebPData webp_data;
  webp_data.bytes = (const uint8_t*)buffer.c_str();
  webp_data.size = buffer.size();

  WebPDemuxer* demux = WebPDemux(&webp_data);
  if (!demux) return false;

  uint32_t flags = WebPDemuxGetI(demux, WEBP_FF_FORMAT_FLAGS);
  WebPDemuxDelete(demux);
  return (flags & ANIMATION_FLAG) != 0;
}

val decodeAnimated(std::string buffer) {
  WebPData webp_data;
  webp_data.bytes = (const uint8_t*)buffer.c_str();
  webp_data.size = buffer.size();

  WebPDemuxer* demux = WebPDemux(&webp_data);
  if (!demux) return val::null();

  int canvasWidth = WebPDemuxGetI(demux, WEBP_FF_CANVAS_WIDTH);
  int canvasHeight = WebPDemuxGetI(demux, WEBP_FF_CANVAS_HEIGHT);
  size_t canvasBytes = (size_t)canvasWidth * canvasHeight * 4;

  uint8_t* canvas = (uint8_t*)malloc(canvasBytes);
  if (!canvas) { WebPDemuxDelete(demux); return val::null(); }
  memset(canvas, 0, canvasBytes);

  val frames = Array.new_();

  WebPIterator iter;
  if (WebPDemuxGetFrame(demux, 1, &iter)) {
    do {
      compositeFrame(canvas, canvasWidth, canvasHeight, iter);

      val imageData = ImageData.new_(
          Uint8ClampedArray.new_(typed_memory_view(canvasBytes, canvas)),
          canvasWidth, canvasHeight);

      val frameObj = Object.new_();
      frameObj.set("imageData", imageData);
      frameObj.set("duration", iter.duration);
      frames.call<void>("push", frameObj);

      // Apply disposal
      if (iter.dispose_method == WEBP_MUX_DISPOSE_BACKGROUND) {
        for (int y = 0; y < iter.height && (y + iter.y_offset) < canvasHeight; y++) {
          for (int x = 0; x < iter.width && (x + iter.x_offset) < canvasWidth; x++) {
            size_t idx = ((size_t)(y + iter.y_offset) * canvasWidth + (x + iter.x_offset)) * 4;
            canvas[idx] = 0;
            canvas[idx + 1] = 0;
            canvas[idx + 2] = 0;
            canvas[idx + 3] = 0;
          }
        }
      }
    } while (WebPDemuxNextFrame(&iter));

    WebPDemuxReleaseIterator(&iter);
  }

  free(canvas);
  WebPDemuxDelete(demux);
  return frames;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
  function("decodeAnimated", &decodeAnimated);
  function("isAnimated", &isAnimated);
  function("version", &version);
}
