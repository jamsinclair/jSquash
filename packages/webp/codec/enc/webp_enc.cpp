#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <stdlib.h>
#include <string.h>
#include <stdexcept>
#include "src/webp/encode.h"
#include "src/webp/mux.h"

using namespace emscripten;

int version() {
  return WebPGetEncoderVersion();
}

thread_local const val Uint8Array = val::global("Uint8Array");

val encode(std::string img, int width, int height, WebPConfig config) {
  auto img_in = (uint8_t*)img.c_str();

  // A lot of this is duplicated from Encode in picture_enc.c
  WebPPicture pic;
  WebPMemoryWriter wrt;
  int ok;

  if (!WebPPictureInit(&pic)) {
    // shouldn't happen, except if system installation is broken
    return val::null();
  }

  // Allow quality to go higher than 0.
  config.qmax = 100;

  // Only use use_argb if we really need it, as it's slower.
  pic.use_argb = config.lossless || config.use_sharp_yuv || config.preprocessing > 0;
  pic.width = width;
  pic.height = height;
  pic.writer = WebPMemoryWrite;
  pic.custom_ptr = &wrt;

  WebPMemoryWriterInit(&wrt);

  ok = WebPPictureImportRGBA(&pic, img_in, width * 4) && WebPEncode(&config, &pic);
  WebPPictureFree(&pic);
  val js_result = ok ? Uint8Array.new_(typed_memory_view(wrt.size, wrt.mem)) : val::null();
  WebPMemoryWriterClear(&wrt);
  return js_result;
}

val encodeAnimated(val frames, WebPConfig config) {
  int frameCount = frames["length"].as<int>();
  if (frameCount < 1) return val::null();

  // Get dimensions from first frame
  val firstFrame = frames[0];
  val firstImageData = firstFrame["imageData"];
  int width = firstImageData["width"].as<int>();
  int height = firstImageData["height"].as<int>();

  // Allow quality to go higher than 0.
  config.qmax = 100;

  WebPAnimEncoderOptions enc_options;
  if (!WebPAnimEncoderOptionsInit(&enc_options)) return val::null();

  WebPAnimEncoder* enc = WebPAnimEncoderNew(width, height, &enc_options);
  if (!enc) return val::null();

  int timestamp_ms = 0;

  for (int i = 0; i < frameCount; i++) {
    val frame = frames[i];
    val imageData = frame["imageData"];
    int duration = frame["duration"].as<int>();
    int fw = imageData["width"].as<int>();
    int fh = imageData["height"].as<int>();

    // Get pixel data
    std::string pixels = imageData["data"]["buffer"].as<std::string>();

    WebPPicture pic;
    if (!WebPPictureInit(&pic)) {
      WebPAnimEncoderDelete(enc);
      return val::null();
    }

    pic.use_argb = config.lossless || config.use_sharp_yuv || config.preprocessing > 0;
    pic.width = fw;
    pic.height = fh;

    if (!WebPPictureImportRGBA(&pic, (const uint8_t*)pixels.c_str(), fw * 4)) {
      WebPPictureFree(&pic);
      WebPAnimEncoderDelete(enc);
      return val::null();
    }

    if (!WebPAnimEncoderAdd(enc, &pic, timestamp_ms, &config)) {
      WebPPictureFree(&pic);
      WebPAnimEncoderDelete(enc);
      return val::null();
    }

    WebPPictureFree(&pic);
    timestamp_ms += duration;
  }

  // Add NULL frame to signal end
  WebPAnimEncoderAdd(enc, NULL, timestamp_ms, NULL);

  WebPData webp_data;
  WebPDataInit(&webp_data);
  if (!WebPAnimEncoderAssemble(enc, &webp_data)) {
    WebPAnimEncoderDelete(enc);
    return val::null();
  }

  WebPAnimEncoderDelete(enc);

  // Set loop count to 0 (infinite) via mux
  WebPMux* mux = WebPMuxCreate(&webp_data, 1);
  WebPDataClear(&webp_data);
  if (!mux) return val::null();

  WebPMuxAnimParams params;
  if (WebPMuxGetAnimationParams(mux, &params) == WEBP_MUX_OK) {
    params.loop_count = 0;
    WebPMuxSetAnimationParams(mux, &params);
  }

  WebPData output;
  WebPDataInit(&output);
  if (WebPMuxAssemble(mux, &output) != WEBP_MUX_OK) {
    WebPMuxDelete(mux);
    return val::null();
  }

  val result = Uint8Array.new_(typed_memory_view(output.size, output.bytes));
  WebPDataClear(&output);
  WebPMuxDelete(mux);
  return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  enum_<WebPImageHint>("WebPImageHint")
      .value("WEBP_HINT_DEFAULT", WebPImageHint::WEBP_HINT_DEFAULT)
      .value("WEBP_HINT_PICTURE", WebPImageHint::WEBP_HINT_PICTURE)
      .value("WEBP_HINT_PHOTO", WebPImageHint::WEBP_HINT_PHOTO)
      .value("WEBP_HINT_GRAPH", WebPImageHint::WEBP_HINT_GRAPH);

  value_object<WebPConfig>("WebPConfig")
      .field("lossless", &WebPConfig::lossless)
      .field("quality", &WebPConfig::quality)
      .field("method", &WebPConfig::method)
      .field("image_hint", &WebPConfig::image_hint)
      .field("target_size", &WebPConfig::target_size)
      .field("target_PSNR", &WebPConfig::target_PSNR)
      .field("segments", &WebPConfig::segments)
      .field("sns_strength", &WebPConfig::sns_strength)
      .field("filter_strength", &WebPConfig::filter_strength)
      .field("filter_sharpness", &WebPConfig::filter_sharpness)
      .field("filter_type", &WebPConfig::filter_type)
      .field("autofilter", &WebPConfig::autofilter)
      .field("alpha_compression", &WebPConfig::alpha_compression)
      .field("alpha_filtering", &WebPConfig::alpha_filtering)
      .field("alpha_quality", &WebPConfig::alpha_quality)
      .field("pass", &WebPConfig::pass)
      .field("show_compressed", &WebPConfig::show_compressed)
      .field("preprocessing", &WebPConfig::preprocessing)
      .field("partitions", &WebPConfig::partitions)
      .field("partition_limit", &WebPConfig::partition_limit)
      .field("emulate_jpeg_size", &WebPConfig::emulate_jpeg_size)
      .field("low_memory", &WebPConfig::low_memory)
      .field("near_lossless", &WebPConfig::near_lossless)
      .field("exact", &WebPConfig::exact)
      .field("use_delta_palette", &WebPConfig::use_delta_palette)
      .field("use_sharp_yuv", &WebPConfig::use_sharp_yuv);

  function("version", &version);
  function("encode", &encode);
  function("encodeAnimated", &encodeAnimated);
}
