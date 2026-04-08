// Override the default return value with a cleaner API
Module.readyOrig = Module.ready;
Module.ready = Module.readyOrig.then(() => {
    return {
        decode: function(bytesIn) {
            if (!(bytesIn instanceof Uint8Array)) {
                throw new Error("Expected Uint8Array")
            }

            let sizeIn = bytesIn.length;
            let bufferIn = Module._malloc(sizeIn);
            if (bufferIn == 0) {
                throw new Error("Failed to allocate buffer");
            }
            try {
                HEAPU8.set(bytesIn, bufferIn);

                let imageDecode = Module._image_decode_with_memory(bufferIn, sizeIn);
                if (imageDecode == 0) {
                    throw new Error("Failed to initialize ImageDecode");
                }
                try {
                    let width = Module._image_decode_width(imageDecode);
                    let height = Module._image_decode_height(imageDecode);
                    let pixelInfo = Module._image_decode_pixel_info(imageDecode);
                    if (pixelInfo == 0) {
                        throw new Error("Failed to get PixelInfo")
                    }
                    try {
                        let channels = Module._pixel_info_channels(pixelInfo);
                        let colorFormat = UTF8ToString(Module._pixel_info_color_format(pixelInfo));
                        let bitDepth = UTF8ToString(Module._pixel_info_bit_depth(pixelInfo));
                        let bitsPerPixel = Module._pixel_info_bits_per_pixel(pixelInfo);
                        let hasAlpha = !!Module._pixel_info_has_alpha(pixelInfo);
                        let premultipledAlpha = !!Module._pixel_info_premultiplied_alpha(pixelInfo);
                        let bgr = !!Module._pixel_info_bgr(pixelInfo);

                        let sizeOut = width * height * bitsPerPixel / 8;
                        let bufferOut = Module._malloc(sizeOut);
                        if (bufferOut == 0) {
                            throw new Error("Failed to allocate output buffer");
                        }
                        try {
                            if (Module._image_decode_copy_all(imageDecode, bufferOut, width * bitsPerPixel / 8) < 0) {
                                throw new Error("Failed to decode image");
                            }
                            // Copy the output bytes to a fresh Uint8Array
                            let bytesOut = HEAPU8.slice(bufferOut, bufferOut + sizeOut);
                            return {
                                width,
                                height,
                                pixelInfo: {
                                    channels,
                                    colorFormat,
                                    bitDepth,
                                    bitsPerPixel,
                                    hasAlpha,
                                    premultipledAlpha,
                                    bgr,
                                },
                                bytes: bytesOut,
                            };
                        } finally {
                            Module._free(bufferOut);
                        }
                    } finally {
                        Module._pixel_info_free(pixelInfo);
                    }
                } finally {
                    Module._image_decode_free(imageDecode);
                }
            } finally {
                Module._free(bufferIn);
            }
        }
    };
});
