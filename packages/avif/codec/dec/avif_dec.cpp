#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "avif/avif.h"

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val Uint16Array = val::global("Uint16Array");
thread_local const val ImageData = val::global("ImageData");
thread_local const val Object = val::global("Object");

val decode(std::string avifimage, uint32_t bitDepth = 8) {
  avifImage* image = avifImageCreateEmpty();
  avifDecoder* decoder = avifDecoderCreate();
  avifResult decodeResult =
      avifDecoderReadMemory(decoder, image, (uint8_t*)avifimage.c_str(), avifimage.length());

  // image is an independent copy of decoded data, decoder may be destroyed here
  avifDecoderDestroy(decoder);

  val result = val::null();
  if (decodeResult == AVIF_RESULT_OK) {
    avifRGBImage rgb;
    avifRGBImageSetDefaults(&rgb, image);

    rgb.depth = bitDepth;

    avifRGBImageAllocatePixels(&rgb);
    avifImageYUVToRGB(image, &rgb);

    if (bitDepth != 8) {
      const size_t pixelCount = rgb.width * rgb.height;
      const size_t channelCount = 4;
      const size_t totalElements = pixelCount * channelCount;

      auto pixelData = Uint16Array.new_(typed_memory_view(totalElements,
                                        reinterpret_cast<uint16_t*>(rgb.pixels)));

      auto pixelArray = pixelData.call<val>("slice");

      result = Object.new_();
      result.set("data", pixelArray);
      result.set("width", rgb.width);
      result.set("height", rgb.height);
    } else {
      result = ImageData.new_(
          Uint8ClampedArray.new_(typed_memory_view(rgb.rowBytes * rgb.height, rgb.pixels)),
          rgb.width,
          rgb.height);
    }

    // Now we can safely free the RGB pixels:
    avifRGBImageFreePixels(&rgb);
  }

  avifImageDestroy(image);
  return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}