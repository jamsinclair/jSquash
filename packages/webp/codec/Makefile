CODEC_VERSION = 1.6.0
CODEC_URL = https://github.com/webmproject/libwebp/archive/refs/tags/v$(CODEC_VERSION).tar.gz
CODEC_DIR = node_modules/libwebp
CODEC_BUILD_ROOT := $(CODEC_DIR)/build
CODEC_BASELINE_BUILD_DIR := $(CODEC_BUILD_ROOT)/baseline
CODEC_SIMD_BUILD_DIR := $(CODEC_BUILD_ROOT)/simd
ENVIRONMENT = web,worker

PRE_JS = pre.js
OUT_JS = enc/webp_enc.js enc/webp_enc_simd.js dec/webp_dec.js
OUT_WASM := $(OUT_JS:.js=.wasm)

.PHONY: all clean

all: $(OUT_JS)

# Define dependencies for all variations of build artifacts.
$(filter enc/%,$(OUT_JS)): enc/webp_enc.o
$(filter dec/%,$(OUT_JS)): dec/webp_dec.o
enc/webp_enc.js dec/webp_dec.js: $(CODEC_BASELINE_BUILD_DIR)/libwebp.a
enc/webp_enc_simd.js: $(CODEC_SIMD_BUILD_DIR)/libwebp.a
# Sharp YUV moved out into its own library in libwebp 1.2.1, and the encoder
# references it unconditionally from picture_csp_enc.c. It has to come after
# libwebp.a on the link line. The decoder never pulls those symbols in, so it
# does not need it.
enc/webp_enc.js: $(CODEC_BASELINE_BUILD_DIR)/libsharpyuv.a
enc/webp_enc_simd.js: $(CODEC_SIMD_BUILD_DIR)/libsharpyuv.a

$(OUT_JS):
	$(LD) \
		$(LDFLAGS) \
		--pre-js $(PRE_JS) \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-s DYNAMIC_EXECUTION=0 \
		-s MODULARIZE=1 \
		-o $@ \
		$+

%.o: %.cpp $(CODEC_DIR)/CMakeLists.txt
	$(CXX) -c \
		$(CXXFLAGS) \
		-I $(CODEC_DIR) \
		-o $@ \
		$<

# One CMake invocation produces both archives.
%/libwebp.a %/libsharpyuv.a: %/Makefile
	$(MAKE) -C $(@D)

# Enable SIMD on a SIMD build.
#
# The extension set is pinned by hand rather than left to libwebp's probing.
# wasm is a fixed target - we know exactly which extensions exist - and 1.6.0's
# detection gets it wrong here in two separate ways.
#
# AVX2 is masked off with -U__AVX2__, which makes libwebp's probe for it fail.
# 1.6.0 added AVX2 lossless paths, but Emscripten emulates 256-bit intrinsics
# as pairs of 128-bit wasm SIMD ops, so they cost binary size without buying
# throughput - and the sources pass `__m256i*` into intrinsics Emscripten
# declares as taking `__m256i_u*`, which current clang rejects outright.
#
# SSE2 has to be asserted by hand. cpu.cmake stops probing at the third entry
# of its extension list under Emscripten; 1.6.0 prepended AVX2 to that list,
# pushing SSE2 out of range, so it is never detected and lands in config.h
# undefined. That silently empties every *_sse2.c - which is most of the SIMD
# win - and breaks enc_sse41.c, which needs the inline helpers in common_sse2.h.
SIMD_CFLAGS = -msimd128 -msse4.1 -DWEBP_HAVE_SSE2 -U__AVX2__
$(CODEC_SIMD_BUILD_DIR)/Makefile: CMAKE_FLAGS+=-DWEBP_ENABLE_SIMD=1 -DCMAKE_C_FLAGS="$(CFLAGS) $(SIMD_CFLAGS)"

# Threads are off because the modules are built for `web,worker` without
# pthreads. This says so directly; the CMAKE_DISABLE_FIND_PACKAGE_Threads=1 it
# replaces got there by making libwebp's find_package(Threads) fail, which
# libwebp no longer even reaches once WEBP_USE_THREAD is off.
%/Makefile: $(CODEC_DIR)/CMakeLists.txt
	emcmake cmake \
		$(CMAKE_FLAGS) \
		-DWEBP_USE_THREAD=0 \
		-DWEBP_BUILD_ANIM_UTILS=0 \
		-DWEBP_BUILD_CWEBP=0 \
		-DWEBP_BUILD_DWEBP=0 \
		-DWEBP_BUILD_GIF2WEBP=0 \
		-DWEBP_BUILD_IMG2WEBP=0 \
		-DWEBP_BUILD_VWEBP=0 \
		-DWEBP_BUILD_WEBPINFO=0 \
		-DWEBP_BUILD_WEBPMUX=0 \
		-DWEBP_BUILD_EXTRAS=0 \
		-B $(@D) \
		$(<D)

$(CODEC_DIR)/CMakeLists.txt:
	mkdir -p $(CODEC_DIR)
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $(CODEC_DIR)

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_BASELINE_BUILD_DIR) clean
	$(MAKE) -C $(CODEC_SIMD_BUILD_DIR) clean
