#include <stdbool.h>
#include <emscripten.h>
#include "JXRGlue.h"

EMSCRIPTEN_KEEPALIVE
PKPixelInfo *pixel_info_from_guid(GUID* guid)
{
    PKPixelInfo *info = (PKPixelInfo *)malloc(sizeof(PKPixelInfo));
    info->pGUIDPixFmt = guid;
    if (PixelFormatLookup(info, LOOKUP_FORWARD)) {
        return NULL;
    }
    return info;
}

EMSCRIPTEN_KEEPALIVE
void pixel_info_free(PKPixelInfo* info)
{
    free(info);
}

EMSCRIPTEN_KEEPALIVE
size_t pixel_info_channels(PKPixelInfo* info)
{
    return info->cChannel;
}

EMSCRIPTEN_KEEPALIVE
const char *pixel_info_color_format(const PKPixelInfo* info)
{
    switch (info->cfColorFormat) {
        case Y_ONLY: return "YOnly";
	    case YUV_420: return "YUV420";
	    case YUV_422: return "YUV422";
	    case YUV_444: return "YUV4444";
	    case CMYK: return "CMYK";
        case NCOMPONENT: return "NComponent";
        case CF_RGB: return "RGB";
	    case CF_RGBE: return "RGBE";
        default: return NULL;
    }
}

EMSCRIPTEN_KEEPALIVE
const char *pixel_info_bit_depth(const PKPixelInfo* info)
{
    switch (info->bdBitDepth) {
        case BD_1: return "1"; //White is foreground
        case BD_8: return "8";
        case BD_16: return "16";
        case BD_16S: return "16Fixed";
        case BD_16F: return "16Float";
        case BD_32: return "32";
        case BD_32S: return "32Fixed";
        case BD_32F: return "32Float";
        case BD_5: return "5";
        case BD_10: return "10";
        case BD_565: return "565";
        case BD_1alt: return "1alt"; //Black is foreground
        default: return NULL;
    }
}

EMSCRIPTEN_KEEPALIVE
size_t pixel_info_bits_per_pixel(const PKPixelInfo* info)
{
    return info->cbitUnit;
}

EMSCRIPTEN_KEEPALIVE
bool pixel_info_has_alpha(const PKPixelInfo* info)
{
    return (info->grBit & PK_pixfmtHasAlpha) != 0;
}

EMSCRIPTEN_KEEPALIVE
bool pixel_info_premultiplied_alpha(const PKPixelInfo* info)
{
    return (info->grBit & PK_pixfmtPreMul) != 0;
}

EMSCRIPTEN_KEEPALIVE
bool pixel_info_bgr(const PKPixelInfo* info)
{
    return (info->grBit & PK_pixfmtBGR) != 0;
}


EMSCRIPTEN_KEEPALIVE
unsigned pixel_info_photometric_interpretation(const PKPixelInfo* info)
{
    // @fixme map to string
    return info->uInterpretation;
}

EMSCRIPTEN_KEEPALIVE
size_t pixel_info_samples_per_pixel(const PKPixelInfo* info)
{
    return info->uSamplePerPixel;
}

EMSCRIPTEN_KEEPALIVE
PKImageDecode *image_decode_with_memory(void *buffer, size_t bytes)
{
    struct WMPStream *stream;
    if (CreateWS_Memory(&stream, buffer, bytes)) {
        return NULL;
    }
    PKImageDecode *decode;
    if (PKImageDecode_Create_WMP(&decode)) {
        stream->Close(&stream);
        return NULL;
    }
    if (decode->Initialize(decode, stream)) {
        decode->Release(&decode);
        stream->Close(&stream);
        return NULL;
    }
    return decode;
}

EMSCRIPTEN_KEEPALIVE
PKPixelInfo* image_decode_pixel_info(PKImageDecode *decode)
{
    GUID guid;
    if (decode->GetPixelFormat(decode, &guid)) {
        return NULL;
    }
    return pixel_info_from_guid(&guid);
}

EMSCRIPTEN_KEEPALIVE
int image_decode_width(PKImageDecode *decode)
{
    int width, height;
    if (decode->GetSize(decode, &width, &height)) {
        return -1;
    }
    return width;
}

EMSCRIPTEN_KEEPALIVE
int image_decode_height(PKImageDecode *decode)
{
    int width, height;
    if (decode->GetSize(decode, &width, &height)) {
        return -1;
    }
    return height;
}

EMSCRIPTEN_KEEPALIVE
int image_decode_copy_all(PKImageDecode *decode, void *dest, size_t stride)
{
    int width, height;
    if (decode->GetSize(decode, &width, &height)) {
        return -1;
    }
    PKRect rect = { 0, 0, width, height };
    if (decode->Copy(decode, &rect, dest, stride)) {
        return -1;
    }
    return 0;
}

EMSCRIPTEN_KEEPALIVE
void image_decode_free(PKImageDecode *decode)
{
    decode->Release(&decode);
}
