#include <emscripten/val.h>
#include <emscripten/bind.h>
#include <dav1d/dav1d.h>
#include <vector>
#include <string>
#include <iostream>

using namespace emscripten;

// Helper function to convert YUV to RGB
void yuv_to_rgb(uint8_t* rgb, const uint8_t* y_plane, const uint8_t* u_plane, const uint8_t* v_plane,
                int width, int height, int stride_y, int stride_uv) {
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            int y_index = y * stride_y + x;
            int uv_index = (y / 2) * stride_uv + (x / 2);

            int Y = y_plane[y_index] - 16;
            int U = u_plane[uv_index] - 128;
            int V = v_plane[uv_index] - 128;

            int C = Y * 298;
            int D = U * 409;
            int E = V * 208;
            int F = U * 100;
            int G = V * 516;

            int r = (C + E) >> 8;
            int g = (C - F - G) >> 8;
            int b = (C + D) >> 8;

            r = r < 0 ? 0 : (r > 255 ? 255 : r);
            g = g < 0 ? 0 : (g > 255 ? 255 : g);
            b = b < 0 ? 0 : (b > 255 ? 255 : b);

            rgb[(y * width + x) * 3 + 0] = r;
            rgb[(y * width + x) * 3 + 1] = g;
            rgb[(y * width + x) * 3 + 2] = b;
        }
    }
}

void free_callback(const uint8_t *buf, void *cookie) {
    // no-op
}

// Decode function that accepts AVIF image data and returns JavaScript ImageData
val decode_avif_to_image_data(std::string avifimage) {
    Dav1dContext* ctx;
    Dav1dSettings settings;
    dav1d_default_settings(&settings);

    if (dav1d_open(&ctx, &settings) < 0) {
        throw std::runtime_error("Failed to open dav1d decoder");
    }

    // Prepare dav1d data input
    Dav1dData data;
    dav1d_data_wrap(&data, (const uint8_t*)avifimage.c_str(), avifimage.size(), free_callback, nullptr);

    // Decode to picture
    Dav1dPicture picture;
    if (dav1d_send_data(ctx, &data) < 0 || dav1d_get_picture(ctx, &picture) < 0) {
        dav1d_data_unref(&data);
        dav1d_close(&ctx);
        throw std::runtime_error("Failed to decode AVIF image");
    }

    // Extract picture information
    int width = picture.p.w;
    int height = picture.p.h;
    std::vector<uint8_t> rgb_data(width * height * 3);

    // Convert YUV to RGB
    yuv_to_rgb(rgb_data.data(),
               reinterpret_cast<const uint8_t*>(picture.data[0]),
               reinterpret_cast<const uint8_t*>(picture.data[1]),
               reinterpret_cast<const uint8_t*>(picture.data[2]),
               width, height, picture.stride[0], picture.stride[1]);

    // Free decoded picture and input data
    dav1d_picture_unref(&picture);
    dav1d_data_unref(&data);
    dav1d_close(&ctx);

    // Create ImageData in JavaScript
    val Uint8ClampedArray = val::global("Uint8ClampedArray");
    val ImageData = val::global("ImageData");
    val js_rgba_array = Uint8ClampedArray.new_(typed_memory_view(rgb_data.size(), rgb_data.data()));
    return ImageData.new_(js_rgba_array, width, height);
}

// Bind the decode function to be called from JavaScript
EMSCRIPTEN_BINDINGS(decode_module) {
    function("decode", &decode_avif_to_image_data);
}
