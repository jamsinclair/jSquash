#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "JXRGlue.h"

#ifdef min
#undef min
#endif

#ifdef max
#undef max
#endif

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

namespace {
enum class OutputKind {
  RGBA8,
  PRGBA8,
  BGRA8,
  PBGRA8,
  RGB8,
  BGR8,
  RGBX8,
  BGRX8,
  GRAY8,
  RGBA16,
  PRGBA16,
  RGB16,
  RGB16X,
  GRAY16,
  RGBAFloat,
  PRGBAFloat,
  RGBFloat,
  RGBFloatX,
  GRAYFloat,
  RGBAHalf,
  RGBHalf,
  RGBHalfX,
  GRAYHalf,
  RGBAFixed16,
  RGBFixed16,
  RGBFixed16X,
  GRAYFixed16,
  RGBAFixed32,
  RGBFixed32,
  RGBFixed32X,
  GRAYFixed32,
  RGB101010,
  RGBE,
};

struct DecodeTarget {
  PKPixelFormatGUID guid;
  OutputKind kind;
  int bytes_per_pixel;
};

struct ToneMapSettings {
  bool enabled;
  float white;
};

constexpr size_t kToneMapSampleCount = 16384;
constexpr float kToneMapWhitePercentile = 0.99f;

const DecodeTarget kTargets[] = {
    {GUID_PKPixelFormat32bppRGBA, OutputKind::RGBA8, 4},
    {GUID_PKPixelFormat32bppPRGBA, OutputKind::PRGBA8, 4},
    {GUID_PKPixelFormat32bppBGRA, OutputKind::BGRA8, 4},
    {GUID_PKPixelFormat32bppPBGRA, OutputKind::PBGRA8, 4},
    {GUID_PKPixelFormat24bppRGB, OutputKind::RGB8, 3},
    {GUID_PKPixelFormat24bppBGR, OutputKind::BGR8, 3},
    {GUID_PKPixelFormat32bppRGB, OutputKind::RGBX8, 4},
    {GUID_PKPixelFormat32bppBGR, OutputKind::BGRX8, 4},
    {GUID_PKPixelFormat8bppGray, OutputKind::GRAY8, 1},
    {GUID_PKPixelFormat64bppRGBA, OutputKind::RGBA16, 8},
    {GUID_PKPixelFormat64bppPRGBA, OutputKind::PRGBA16, 8},
    {GUID_PKPixelFormat48bppRGB, OutputKind::RGB16, 6},
    {GUID_PKPixelFormat64bppRGBFixedPoint, OutputKind::RGBFixed16X, 8},
    {GUID_PKPixelFormat16bppGray, OutputKind::GRAY16, 2},
    {GUID_PKPixelFormat128bppRGBAFloat, OutputKind::RGBAFloat, 16},
    {GUID_PKPixelFormat128bppPRGBAFloat, OutputKind::PRGBAFloat, 16},
    {GUID_PKPixelFormat96bppRGBFloat, OutputKind::RGBFloat, 12},
    {GUID_PKPixelFormat128bppRGBFloat, OutputKind::RGBFloatX, 16},
    {GUID_PKPixelFormat32bppGrayFloat, OutputKind::GRAYFloat, 4},
    {GUID_PKPixelFormat64bppRGBAHalf, OutputKind::RGBAHalf, 8},
    {GUID_PKPixelFormat48bppRGBHalf, OutputKind::RGBHalf, 6},
    {GUID_PKPixelFormat64bppRGBHalf, OutputKind::RGBHalfX, 8},
    {GUID_PKPixelFormat16bppGrayHalf, OutputKind::GRAYHalf, 2},
    {GUID_PKPixelFormat64bppRGBAFixedPoint, OutputKind::RGBAFixed16, 8},
    {GUID_PKPixelFormat48bppRGBFixedPoint, OutputKind::RGBFixed16, 6},
    {GUID_PKPixelFormat16bppGrayFixedPoint, OutputKind::GRAYFixed16, 2},
    {GUID_PKPixelFormat128bppRGBAFixedPoint, OutputKind::RGBAFixed32, 16},
    {GUID_PKPixelFormat96bppRGBFixedPoint, OutputKind::RGBFixed32, 12},
    {GUID_PKPixelFormat128bppRGBFixedPoint, OutputKind::RGBFixed32X, 16},
    {GUID_PKPixelFormat32bppGrayFixedPoint, OutputKind::GRAYFixed32, 4},
    {GUID_PKPixelFormat32bppRGB101010, OutputKind::RGB101010, 4},
    {GUID_PKPixelFormat32bppRGBE, OutputKind::RGBE, 4},
};

const DecodeTarget* find_decode_target(const PKPixelFormatGUID& guid) {
  for (const DecodeTarget& candidate : kTargets) {
    if (IsEqualGUID(candidate.guid, guid)) {
      return &candidate;
    }
  }

  return nullptr;
}

bool is_hdr_linear_target(OutputKind kind) {
  switch (kind) {
    case OutputKind::RGBAFloat:
    case OutputKind::PRGBAFloat:
    case OutputKind::RGBFloat:
    case OutputKind::RGBFloatX:
    case OutputKind::GRAYFloat:
    case OutputKind::RGBAHalf:
    case OutputKind::RGBHalf:
    case OutputKind::RGBHalfX:
    case OutputKind::GRAYHalf:
    case OutputKind::RGBAFixed16:
    case OutputKind::RGBFixed16:
    case OutputKind::RGBFixed16X:
    case OutputKind::GRAYFixed16:
    case OutputKind::RGBAFixed32:
    case OutputKind::RGBFixed32:
    case OutputKind::RGBFixed32X:
    case OutputKind::GRAYFixed32:
      return true;
    default:
      return false;
  }
}

bool is_alpha_target(OutputKind kind) {
  switch (kind) {
    case OutputKind::RGBA8:
    case OutputKind::PRGBA8:
    case OutputKind::BGRA8:
    case OutputKind::PBGRA8:
    case OutputKind::RGBA16:
    case OutputKind::PRGBA16:
    case OutputKind::RGBAFloat:
    case OutputKind::PRGBAFloat:
    case OutputKind::RGBAHalf:
    case OutputKind::RGBAFixed16:
    case OutputKind::RGBAFixed32:
      return true;
    default:
      return false;
  }
}

uint8_t unpremultiply_channel(uint8_t value, uint8_t alpha) {
  if (alpha == 0) {
    return 0;
  }

  const int scaled = (static_cast<int>(value) * 255 + alpha / 2) / alpha;
  return static_cast<uint8_t>(std::min(scaled, 255));
}

uint16_t unpremultiply_channel_16(uint16_t value, uint16_t alpha) {
  if (alpha == 0) {
    return 0;
  }

  const uint32_t scaled =
      (static_cast<uint32_t>(value) * 65535u + alpha / 2u) / alpha;
  return static_cast<uint16_t>(std::min<uint32_t>(scaled, 65535u));
}

float unpremultiply_channel_float(float value, float alpha) {
  if (alpha <= 0.0f) {
    return 0.0f;
  }

  return value / alpha;
}

template <typename T>
T read_value(const uint8_t* ptr) {
  T value;
  std::memcpy(&value, ptr, sizeof(T));
  return value;
}

float bitcast_float(uint32_t bits) {
  float value;
  std::memcpy(&value, &bits, sizeof(value));
  return value;
}

float convert_half_to_float(uint16_t value) {
  const uint32_t sign = (value >> 15) & 0x0001;
  const uint32_t exponent = (value >> 10) & 0x001f;
  const uint32_t mantissa = value & 0x03ff;

  if (exponent == 0) {
    return bitcast_float(sign << 31);
  }

  if (exponent == 0x1f) {
    return bitcast_float((sign << 31) | (0xffu << 23) | (mantissa << 13));
  }

  return bitcast_float(
      (sign << 31) | ((exponent - 15 + 127) << 23) | (mantissa << 13));
}

uint8_t convert_float_to_u8(float value) {
  if (value <= 0.0f) {
    return 0;
  }

  if (value <= 0.0031308f) {
    return static_cast<uint8_t>((255.0f * value * 12.92f) + 0.5f);
  }

  if (value < 1.0f) {
    return static_cast<uint8_t>(
        (255.0f * ((1.055f * std::pow(value, 1.0f / 2.4f)) - 0.055f)) +
        0.5f);
  }

  return 255;
}

uint8_t convert_alpha_float_to_u8(float value) {
  if (value <= 0.0f) {
    return 0;
  }

  if (value < 1.0f) {
    return static_cast<uint8_t>((255.0f * value) + 0.5f);
  }

  return 255;
}

float fixed16_to_float(int16_t value) {
  return static_cast<float>(value) * (1.0f / static_cast<float>(1 << 13));
}

float fixed32_to_float(int32_t value) {
  return static_cast<float>(value) * (1.0f / static_cast<float>(1 << 24));
}

float luma_rgb(float r, float g, float b) {
  return r * 0.2126f + g * 0.7152f + b * 0.0722f;
}

void scale_rgb(float& r, float& g, float& b, float luma_out) {
  const float luma_in = luma_rgb(r, g, b);
  if (luma_in <= 0.0f) {
    r = 0.0f;
    g = 0.0f;
    b = 0.0f;
    return;
  }

  const float scale = luma_out / luma_in;
  r *= scale;
  g *= scale;
  b *= scale;
}

void tone_map_reinhard_luma(
    float& r,
    float& g,
    float& b,
    const ToneMapSettings& settings) {
  r = std::max(r, 0.0f);
  g = std::max(g, 0.0f);
  b = std::max(b, 0.0f);

  if (!settings.enabled) {
    return;
  }

  const float white = std::max(settings.white, 1.0f);
  const float white2 = white * white;
  const float luma_in = luma_rgb(r, g, b);
  const float luma_out =
      luma_in * (1.0f + luma_in / white2) / (1.0f + luma_in);
  scale_rgb(r, g, b, luma_out);
}

void read_linear_rgb(
    const uint8_t* pixel,
    const DecodeTarget& target,
    float& r,
    float& g,
    float& b) {
  switch (target.kind) {
    case OutputKind::RGBAFloat:
      r = read_value<float>(pixel + 0);
      g = read_value<float>(pixel + 4);
      b = read_value<float>(pixel + 8);
      return;
    case OutputKind::PRGBAFloat: {
      const float alpha = read_value<float>(pixel + 12);
      r = unpremultiply_channel_float(read_value<float>(pixel + 0), alpha);
      g = unpremultiply_channel_float(read_value<float>(pixel + 4), alpha);
      b = unpremultiply_channel_float(read_value<float>(pixel + 8), alpha);
      return;
    }
    case OutputKind::RGBFloat:
    case OutputKind::RGBFloatX:
      r = read_value<float>(pixel + 0);
      g = read_value<float>(pixel + 4);
      b = read_value<float>(pixel + 8);
      return;
    case OutputKind::GRAYFloat:
      r = g = b = read_value<float>(pixel);
      return;
    case OutputKind::RGBAHalf:
      r = convert_half_to_float(read_value<uint16_t>(pixel + 0));
      g = convert_half_to_float(read_value<uint16_t>(pixel + 2));
      b = convert_half_to_float(read_value<uint16_t>(pixel + 4));
      return;
    case OutputKind::RGBHalf:
    case OutputKind::RGBHalfX:
      r = convert_half_to_float(read_value<uint16_t>(pixel + 0));
      g = convert_half_to_float(read_value<uint16_t>(pixel + 2));
      b = convert_half_to_float(read_value<uint16_t>(pixel + 4));
      return;
    case OutputKind::GRAYHalf:
      r = g = b = convert_half_to_float(read_value<uint16_t>(pixel));
      return;
    case OutputKind::RGBAFixed16:
      r = fixed16_to_float(read_value<int16_t>(pixel + 0));
      g = fixed16_to_float(read_value<int16_t>(pixel + 2));
      b = fixed16_to_float(read_value<int16_t>(pixel + 4));
      return;
    case OutputKind::RGBFixed16:
    case OutputKind::RGBFixed16X:
      r = fixed16_to_float(read_value<int16_t>(pixel + 0));
      g = fixed16_to_float(read_value<int16_t>(pixel + 2));
      b = fixed16_to_float(read_value<int16_t>(pixel + 4));
      return;
    case OutputKind::GRAYFixed16:
      r = g = b = fixed16_to_float(read_value<int16_t>(pixel));
      return;
    case OutputKind::RGBAFixed32:
      r = fixed32_to_float(read_value<int32_t>(pixel + 0));
      g = fixed32_to_float(read_value<int32_t>(pixel + 4));
      b = fixed32_to_float(read_value<int32_t>(pixel + 8));
      return;
    case OutputKind::RGBFixed32:
    case OutputKind::RGBFixed32X:
      r = fixed32_to_float(read_value<int32_t>(pixel + 0));
      g = fixed32_to_float(read_value<int32_t>(pixel + 4));
      b = fixed32_to_float(read_value<int32_t>(pixel + 8));
      return;
    case OutputKind::GRAYFixed32:
      r = g = b = fixed32_to_float(read_value<int32_t>(pixel));
      return;
    default:
      r = 0.0f;
      g = 0.0f;
      b = 0.0f;
      return;
  }
}

float read_alpha_sample(const uint8_t* pixel, const DecodeTarget& target) {
  switch (target.kind) {
    case OutputKind::RGBA8:
    case OutputKind::PRGBA8:
    case OutputKind::BGRA8:
    case OutputKind::PBGRA8:
      return static_cast<float>(pixel[3]) * (1.0f / 255.0f);
    case OutputKind::RGBA16:
    case OutputKind::PRGBA16:
      return static_cast<float>(read_value<uint16_t>(pixel + 6)) *
          (1.0f / 65535.0f);
    case OutputKind::RGBAFloat:
    case OutputKind::PRGBAFloat:
      return read_value<float>(pixel + 12);
    case OutputKind::RGBAHalf:
      return convert_half_to_float(read_value<uint16_t>(pixel + 6));
    case OutputKind::RGBAFixed16:
      return fixed16_to_float(read_value<int16_t>(pixel + 6));
    case OutputKind::RGBAFixed32:
      return fixed32_to_float(read_value<int32_t>(pixel + 12));
    default:
      return 1.0f;
  }
}

bool should_preserve_alpha(
    const uint8_t* decoded_pixels,
    size_t pixel_count,
    const DecodeTarget& target,
    bool has_alpha) {
  if (!has_alpha || !is_alpha_target(target.kind)) {
    return false;
  }

  if (!is_hdr_linear_target(target.kind) || pixel_count == 0) {
    return true;
  }

  const size_t sample_stride =
      std::max<size_t>(1, pixel_count / kToneMapSampleCount);
  for (size_t i = 0; i < pixel_count; i += sample_stride) {
    const float alpha = read_alpha_sample(
        decoded_pixels + (i * target.bytes_per_pixel), target);
    if (std::isfinite(alpha) && alpha > 0.000001f) {
      return true;
    }
  }

  return false;
}

void assign_rgba(
    std::vector<uint8_t>& rgba_pixels,
    size_t offset,
    uint8_t r,
    uint8_t g,
    uint8_t b,
    uint8_t a) {
  rgba_pixels[offset + 0] = r;
  rgba_pixels[offset + 1] = g;
  rgba_pixels[offset + 2] = b;
  rgba_pixels[offset + 3] = a;
}

void assign_rgba(
    uint8_t* rgba_pixels,
    size_t offset,
    uint8_t r,
    uint8_t g,
    uint8_t b,
    uint8_t a) {
  rgba_pixels[offset + 0] = r;
  rgba_pixels[offset + 1] = g;
  rgba_pixels[offset + 2] = b;
  rgba_pixels[offset + 3] = a;
}

void assign_linear_rgba(
    uint8_t* rgba_pixels,
    size_t offset,
    float r,
    float g,
    float b,
    float a,
    bool has_alpha,
    const ToneMapSettings& tone_map) {
  tone_map_reinhard_luma(r, g, b, tone_map);
  if (!has_alpha) {
    a = 1.0f;
  }
  assign_rgba(
      rgba_pixels, offset,
      convert_float_to_u8(r),
      convert_float_to_u8(g),
      convert_float_to_u8(b),
      convert_alpha_float_to_u8(a));
}

val create_image_data(const std::vector<uint8_t>& rgba, int width, int height) {
  return ImageData.new_(
      Uint8ClampedArray.new_(typed_memory_view(rgba.size(), rgba.data())),
      width, height);
}

ToneMapSettings compute_tone_map_settings(
    const uint8_t* decoded_pixels,
    size_t pixel_count,
    const DecodeTarget& target) {
  if (!is_hdr_linear_target(target.kind) || pixel_count == 0) {
    return {false, 1.0f};
  }

  const size_t sample_stride =
      std::max<size_t>(1, pixel_count / kToneMapSampleCount);
  std::vector<float> luminance_samples;
  luminance_samples.reserve((pixel_count + sample_stride - 1) / sample_stride);

  float max_channel = 0.0f;
  for (size_t i = 0; i < pixel_count; i += sample_stride) {
    float r = 0.0f;
    float g = 0.0f;
    float b = 0.0f;
    read_linear_rgb(
        decoded_pixels + (i * target.bytes_per_pixel), target, r, g, b);
    r = std::max(r, 0.0f);
    g = std::max(g, 0.0f);
    b = std::max(b, 0.0f);
    max_channel = std::max(max_channel, std::max(r, std::max(g, b)));
    luminance_samples.push_back(luma_rgb(r, g, b));
  }

  if (luminance_samples.empty()) {
    return {false, 1.0f};
  }

  std::sort(luminance_samples.begin(), luminance_samples.end());
  const size_t white_index = static_cast<size_t>(
      (luminance_samples.size() - 1) * kToneMapWhitePercentile);
  const float white = luminance_samples[white_index];

  if ((!std::isfinite(white) || white <= 1.0f) && max_channel <= 1.0f) {
    return {false, 1.0f};
  }

  return {true, std::max(white, 1.0f)};
}

void convert_decoded_pixels_to_rgba(
    const uint8_t* decoded_pixels,
    size_t pixel_count,
    const DecodeTarget& target,
    bool has_alpha,
    uint8_t* rgba_pixels) {
  const ToneMapSettings tone_map =
      compute_tone_map_settings(decoded_pixels, pixel_count, target);
  const bool use_alpha =
      should_preserve_alpha(decoded_pixels, pixel_count, target, has_alpha);

  for (size_t i = 0; i < pixel_count; ++i) {
    const uint8_t* pixel = decoded_pixels + (i * target.bytes_per_pixel);
    const size_t dst = i * 4;

    switch (target.kind) {
      case OutputKind::RGBA8:
        rgba_pixels[dst + 0] = pixel[0];
        rgba_pixels[dst + 1] = pixel[1];
        rgba_pixels[dst + 2] = pixel[2];
        rgba_pixels[dst + 3] = use_alpha ? pixel[3] : 255;
        break;
      case OutputKind::PRGBA8: {
        const uint8_t alpha = use_alpha ? pixel[3] : 255;
        assign_rgba(
            rgba_pixels, dst,
            unpremultiply_channel(pixel[0], alpha),
            unpremultiply_channel(pixel[1], alpha),
            unpremultiply_channel(pixel[2], alpha),
            alpha);
        break;
      }
      case OutputKind::BGRA8:
        assign_rgba(
            rgba_pixels, dst, pixel[2], pixel[1], pixel[0], use_alpha ? pixel[3] : 255);
        break;
      case OutputKind::PBGRA8: {
        const uint8_t alpha = use_alpha ? pixel[3] : 255;
        assign_rgba(
            rgba_pixels, dst,
            unpremultiply_channel(pixel[2], alpha),
            unpremultiply_channel(pixel[1], alpha),
            unpremultiply_channel(pixel[0], alpha),
            alpha);
        break;
      }
      case OutputKind::RGB8:
        assign_rgba(rgba_pixels, dst, pixel[0], pixel[1], pixel[2], 255);
        break;
      case OutputKind::BGR8:
        assign_rgba(rgba_pixels, dst, pixel[2], pixel[1], pixel[0], 255);
        break;
      case OutputKind::RGBX8:
        assign_rgba(rgba_pixels, dst, pixel[0], pixel[1], pixel[2], 255);
        break;
      case OutputKind::BGRX8:
        assign_rgba(rgba_pixels, dst, pixel[2], pixel[1], pixel[0], 255);
        break;
      case OutputKind::GRAY8:
        assign_rgba(rgba_pixels, dst, pixel[0], pixel[0], pixel[0], 255);
        break;
      case OutputKind::RGBA16:
        assign_rgba(
            rgba_pixels, dst,
            read_value<uint16_t>(pixel + 0) >> 8,
            read_value<uint16_t>(pixel + 2) >> 8,
            read_value<uint16_t>(pixel + 4) >> 8,
            use_alpha ? (read_value<uint16_t>(pixel + 6) >> 8) : 255);
        break;
      case OutputKind::PRGBA16: {
        const uint16_t alpha = use_alpha ? read_value<uint16_t>(pixel + 6) : 65535u;
        assign_rgba(
            rgba_pixels, dst,
            unpremultiply_channel_16(read_value<uint16_t>(pixel + 0), alpha) >> 8,
            unpremultiply_channel_16(read_value<uint16_t>(pixel + 2), alpha) >> 8,
            unpremultiply_channel_16(read_value<uint16_t>(pixel + 4), alpha) >> 8,
            alpha >> 8);
        break;
      }
      case OutputKind::RGB16:
        assign_rgba(
            rgba_pixels, dst,
            read_value<uint16_t>(pixel + 0) >> 8,
            read_value<uint16_t>(pixel + 2) >> 8,
            read_value<uint16_t>(pixel + 4) >> 8,
            255);
        break;
      case OutputKind::RGB16X:
        assign_rgba(
            rgba_pixels, dst,
            read_value<uint16_t>(pixel + 0) >> 8,
            read_value<uint16_t>(pixel + 2) >> 8,
            read_value<uint16_t>(pixel + 4) >> 8,
            255);
        break;
      case OutputKind::GRAY16: {
        const uint8_t gray = read_value<uint16_t>(pixel) >> 8;
        assign_rgba(rgba_pixels, dst, gray, gray, gray, 255);
        break;
      }
      case OutputKind::RGBAFloat: {
        assign_linear_rgba(
            rgba_pixels,
            dst,
            read_value<float>(pixel + 0),
            read_value<float>(pixel + 4),
            read_value<float>(pixel + 8),
            read_value<float>(pixel + 12),
            use_alpha,
            tone_map);
        break;
      }
      case OutputKind::PRGBAFloat: {
        const float alpha = use_alpha ? read_value<float>(pixel + 12) : 1.0f;
        assign_linear_rgba(
            rgba_pixels,
            dst,
            unpremultiply_channel_float(read_value<float>(pixel + 0), alpha),
            unpremultiply_channel_float(read_value<float>(pixel + 4), alpha),
            unpremultiply_channel_float(read_value<float>(pixel + 8), alpha),
            alpha,
            use_alpha,
            tone_map);
        break;
      }
      case OutputKind::RGBFloat:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            read_value<float>(pixel + 0),
            read_value<float>(pixel + 4),
            read_value<float>(pixel + 8),
            1.0f,
            use_alpha,
            tone_map);
        break;
      case OutputKind::RGBFloatX:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            read_value<float>(pixel + 0),
            read_value<float>(pixel + 4),
            read_value<float>(pixel + 8),
            1.0f,
            use_alpha,
            tone_map);
        break;
      case OutputKind::GRAYFloat: {
        const float gray = read_value<float>(pixel);
        assign_linear_rgba(
            rgba_pixels, dst, gray, gray, gray, 1.0f, use_alpha, tone_map);
        break;
      }
      case OutputKind::RGBAHalf:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            convert_half_to_float(read_value<uint16_t>(pixel + 0)),
            convert_half_to_float(read_value<uint16_t>(pixel + 2)),
            convert_half_to_float(read_value<uint16_t>(pixel + 4)),
            convert_half_to_float(read_value<uint16_t>(pixel + 6)),
            use_alpha,
            tone_map);
        break;
      case OutputKind::RGBHalf:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            convert_half_to_float(read_value<uint16_t>(pixel + 0)),
            convert_half_to_float(read_value<uint16_t>(pixel + 2)),
            convert_half_to_float(read_value<uint16_t>(pixel + 4)),
            1.0f,
            use_alpha,
            tone_map);
        break;
      case OutputKind::RGBHalfX:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            convert_half_to_float(read_value<uint16_t>(pixel + 0)),
            convert_half_to_float(read_value<uint16_t>(pixel + 2)),
            convert_half_to_float(read_value<uint16_t>(pixel + 4)),
            1.0f,
            use_alpha,
            tone_map);
        break;
      case OutputKind::GRAYHalf: {
        const float gray =
            convert_half_to_float(read_value<uint16_t>(pixel));
        assign_linear_rgba(
            rgba_pixels, dst, gray, gray, gray, 1.0f, use_alpha, tone_map);
        break;
      }
      case OutputKind::RGBAFixed16:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            fixed16_to_float(read_value<int16_t>(pixel + 0)),
            fixed16_to_float(read_value<int16_t>(pixel + 2)),
            fixed16_to_float(read_value<int16_t>(pixel + 4)),
            fixed16_to_float(read_value<int16_t>(pixel + 6)),
            use_alpha,
            tone_map);
        break;
      case OutputKind::RGBFixed16:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            fixed16_to_float(read_value<int16_t>(pixel + 0)),
            fixed16_to_float(read_value<int16_t>(pixel + 2)),
            fixed16_to_float(read_value<int16_t>(pixel + 4)),
            1.0f,
            use_alpha,
            tone_map);
        break;
      case OutputKind::RGBFixed16X:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            fixed16_to_float(read_value<int16_t>(pixel + 0)),
            fixed16_to_float(read_value<int16_t>(pixel + 2)),
            fixed16_to_float(read_value<int16_t>(pixel + 4)),
            1.0f,
            use_alpha,
            tone_map);
        break;
      case OutputKind::GRAYFixed16: {
        const float gray =
            fixed16_to_float(read_value<int16_t>(pixel));
        assign_linear_rgba(
            rgba_pixels, dst, gray, gray, gray, 1.0f, use_alpha, tone_map);
        break;
      }
      case OutputKind::RGBAFixed32:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            fixed32_to_float(read_value<int32_t>(pixel + 0)),
            fixed32_to_float(read_value<int32_t>(pixel + 4)),
            fixed32_to_float(read_value<int32_t>(pixel + 8)),
            fixed32_to_float(read_value<int32_t>(pixel + 12)),
            use_alpha,
            tone_map);
        break;
      case OutputKind::RGBFixed32:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            fixed32_to_float(read_value<int32_t>(pixel + 0)),
            fixed32_to_float(read_value<int32_t>(pixel + 4)),
            fixed32_to_float(read_value<int32_t>(pixel + 8)),
            1.0f,
            use_alpha,
            tone_map);
        break;
      case OutputKind::RGBFixed32X:
        assign_linear_rgba(
            rgba_pixels,
            dst,
            fixed32_to_float(read_value<int32_t>(pixel + 0)),
            fixed32_to_float(read_value<int32_t>(pixel + 4)),
            fixed32_to_float(read_value<int32_t>(pixel + 8)),
            1.0f,
            use_alpha,
            tone_map);
        break;
      case OutputKind::GRAYFixed32: {
        const float gray =
            fixed32_to_float(read_value<int32_t>(pixel));
        assign_linear_rgba(
            rgba_pixels, dst, gray, gray, gray, 1.0f, use_alpha, tone_map);
        break;
      }
      case OutputKind::RGB101010: {
        const uint32_t value = read_value<uint32_t>(pixel);
        assign_rgba(
            rgba_pixels, dst,
            static_cast<uint8_t>(((value >> 20) & 0x3ff) >> 2),
            static_cast<uint8_t>(((value >> 10) & 0x3ff) >> 2),
            static_cast<uint8_t>((value & 0x3ff) >> 2),
            255);
        break;
      }
      case OutputKind::RGBE: {
        const uint8_t exponent = pixel[3];
        if (exponent == 0) {
          assign_rgba(rgba_pixels, dst, 0, 0, 0, 255);
          break;
        }

        const int adjusted_exponent = static_cast<int>(exponent) - 128 - 8;
        const float scale = std::ldexp(1.0f, adjusted_exponent);
        assign_rgba(
            rgba_pixels, dst,
            convert_float_to_u8(static_cast<float>(pixel[0]) * scale),
            convert_float_to_u8(static_cast<float>(pixel[1]) * scale),
            convert_float_to_u8(static_cast<float>(pixel[2]) * scale),
            255);
        break;
      }
    }
  }
}

template <typename CopyFn>
bool decode_pixels_to_rgba(
    int width,
    int height,
    const DecodeTarget& target,
    CopyFn copy_pixels,
    bool has_alpha,
    std::vector<uint8_t>& rgba_pixels) {
  const size_t pixel_count =
      static_cast<size_t>(width) * static_cast<size_t>(height);
  const size_t row_bytes =
      static_cast<size_t>(width) * static_cast<size_t>(target.bytes_per_pixel);
  std::vector<uint8_t> decoded_pixels(pixel_count * target.bytes_per_pixel);
  PKRect rect = {0, 0, width, height};

  if (!copy_pixels(&rect, decoded_pixels.data(), row_bytes)) {
    return false;
  }

  rgba_pixels.resize(pixel_count * 4);
  convert_decoded_pixels_to_rgba(
      decoded_pixels.data(), pixel_count, target, has_alpha, rgba_pixels.data());
  return true;
}
}  // namespace

val decode(std::string jxrimage) {
  struct WMPStream* stream = nullptr;
  if (CreateWS_Memory(&stream, (void*)jxrimage.data(), jxrimage.size())) {
    return val::null();
  }

  PKImageDecode* decoder = nullptr;
  if (PKImageDecode_Create_WMP(&decoder) || !decoder) {
    if (stream) {
      stream->Close(&stream);
    }
    return val::null();
  }

  if (decoder->Initialize(decoder, stream)) {
    decoder->Release(&decoder);
    return val::null();
  }

  int width = 0;
  int height = 0;
  if (decoder->GetSize(decoder, &width, &height) || width <= 0 || height <= 0) {
    decoder->Release(&decoder);
    return val::null();
  }

  const bool has_alpha =
      decoder->WMP.bHasAlpha || decoder->WMP.wmiSCP.uAlphaMode > 0;

  PKPixelFormatGUID source_guid;
  std::vector<uint8_t> rgba_pixels;

  if (!decoder->GetPixelFormat(decoder, &source_guid)) {
    const DecodeTarget* source_target = find_decode_target(source_guid);
    if (source_target &&
        decode_pixels_to_rgba(
            width,
            height,
            *source_target,
            [&](const PKRect* rect, uint8_t* pixels, size_t row_bytes) {
              return !decoder->Copy(
                  decoder,
                  rect,
                  pixels,
                  static_cast<U32>(row_bytes));
            },
            has_alpha,
            rgba_pixels)) {
      decoder->Release(&decoder);
      return create_image_data(rgba_pixels, width, height);
    }
  }

  for (const DecodeTarget& candidate : kTargets) {
    PKFormatConverter* converter = nullptr;
    if (PKCodecFactory_CreateFormatConverter(&converter) || !converter) {
      decoder->Release(&decoder);
      return val::null();
    }

    if (converter->Initialize(converter, decoder, nullptr, candidate.guid)) {
      converter->Release(&converter);
      continue;
    }

    const bool decoded = decode_pixels_to_rgba(
        width,
        height,
        candidate,
        [&](const PKRect* rect, uint8_t* pixels, size_t row_bytes) {
          return !converter->Copy(
              converter,
              rect,
              pixels,
              static_cast<U32>(row_bytes));
        },
        has_alpha,
        rgba_pixels);
    converter->Release(&converter);

    if (decoded) {
      decoder->Release(&decoder);
      return create_image_data(rgba_pixels, width, height);
    }
  }

  decoder->Release(&decoder);
  return val::null();
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
