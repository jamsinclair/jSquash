# using libheif from https://github.com/strukturag/libheif
# and libde265 for H.265/HEVC decoding (used by iPhone HEIC photos)
LIBHEIF_URL = https://github.com/strukturag/libheif/archive/refs/tags/v1.19.7.tar.gz
LIBHEIF_PACKAGE = node_modules/libheif.tar.gz

LIBDE265_URL = https://github.com/strukturag/libde265/archive/refs/tags/v1.0.15.tar.gz
LIBDE265_PACKAGE = node_modules/libde265.tar.gz

export CODEC_DIR = node_modules/libheif
export BUILD_DIR = node_modules/build
export LIBDE265_DIR = node_modules/libde265

OUT_DEC_JS = dec/heic_dec.js
OUT_DEC_CPP = dec/heic_dec.cpp
OUT_DEC_WASM = dec/heic_dec.wasm
ENVIRONMENT = web,worker

PRE_JS = pre.js

LIBDE265_BUILD_DIR = $(BUILD_DIR)/libde265
LIBDE265_OUT = $(LIBDE265_BUILD_DIR)/libde265/libde265.a

LIBHEIF_BUILD_DIR = $(BUILD_DIR)/libheif
LIBHEIF_OUT = $(LIBHEIF_BUILD_DIR)/libheif/libheif.a

STACK_SIZE = 5242880
INITIAL_MEMORY_SIZE = 16777216

.PHONY: all clean

all: $(OUT_DEC_JS)

# Build the final decoder JS+WASM
$(OUT_DEC_JS): $(OUT_DEC_CPP) $(LIBHEIF_OUT) $(LIBDE265_OUT)
	$(CXX) \
		-I $(CODEC_DIR)/libheif \
		-I $(CODEC_DIR)/libheif/api \
		-I $(LIBHEIF_BUILD_DIR) \
		$(CXXFLAGS) \
		$(LDFLAGS) \
		--pre-js $(PRE_JS) \
		--bind \
		-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-s DYNAMIC_EXECUTION=0 \
		-s MODULARIZE=1 \
		-s STACK_SIZE=$(STACK_SIZE) \
		-s INITIAL_MEMORY=$(INITIAL_MEMORY_SIZE) \
		-o $@ \
		$+

# Build libde265
$(LIBDE265_OUT): $(LIBDE265_DIR)/CMakeLists.txt
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=Release \
		-DBUILD_SHARED_LIBS=OFF \
		-DENABLE_SDL=OFF \
		-DENABLE_ENCODER=OFF \
		-DENABLE_DECODER=ON \
		-B $(LIBDE265_BUILD_DIR) \
		$(LIBDE265_DIR) && \
	$(MAKE) -C $(LIBDE265_BUILD_DIR) && \
	cp $(LIBDE265_BUILD_DIR)/libde265/de265-version.h $(LIBDE265_DIR)/libde265/

# Build libheif (decode-only, with libde265)
$(LIBHEIF_OUT): $(CODEC_DIR)/CMakeLists.txt $(LIBDE265_OUT)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=Release \
		-DBUILD_SHARED_LIBS=OFF \
		-DWITH_EXAMPLES=OFF \
		-DWITH_GDK_PIXBUF=OFF \
		-DENABLE_MULTITHREADING_SUPPORT=OFF \
		-DWITH_AOM_DECODER=OFF \
		-DWITH_AOM_ENCODER=OFF \
		-DWITH_X265=OFF \
		-DWITH_DAV1D=OFF \
		-DWITH_RAV1E=OFF \
		-DWITH_SvtEnc=OFF \
		-DWITH_KVAZAAR=OFF \
		-DWITH_OpenJPEG_DECODER=OFF \
		-DWITH_OpenJPEG_ENCODER=OFF \
		-DWITH_JPEG_DECODER=OFF \
		-DWITH_JPEG_ENCODER=OFF \
		-DWITH_OpenH264_DECODER=OFF \
		-DWITH_OpenH264_ENCODER=OFF \
		-DWITH_FFMPEG_DECODER=OFF \
		-DWITH_UNCOMPRESSED_CODEC=OFF \
		-DWITH_DEFLATE_HEADER_COMPRESSION=OFF \
		-DBUILD_TESTING=OFF \
		-DWITH_LIBDE265=ON \
		-DLIBDE265_INCLUDE_DIR=$(LIBDE265_DIR) \
		-DLIBDE265_LIBRARY=$(LIBDE265_OUT) \
		-B $(LIBHEIF_BUILD_DIR) \
		$(CODEC_DIR) && \
	$(MAKE) -C $(LIBHEIF_BUILD_DIR)

# Download and extract libheif
$(LIBHEIF_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(LIBHEIF_URL) -o $@

$(CODEC_DIR)/CMakeLists.txt: $(LIBHEIF_PACKAGE)
	mkdir -p $(@D)
	tar xzm --strip 1 -C $(@D) -f $(LIBHEIF_PACKAGE)

# Download and extract libde265
$(LIBDE265_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(LIBDE265_URL) -o $@

$(LIBDE265_DIR)/CMakeLists.txt: $(LIBDE265_PACKAGE)
	mkdir -p $(@D)
	tar xzm --strip 1 -C $(@D) -f $(LIBDE265_PACKAGE)

clean:
	$(RM) $(OUT_DEC_JS) $(OUT_DEC_WASM)
	$(RM) -r $(BUILD_DIR)
