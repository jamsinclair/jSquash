CODEC_URL=https://code.videolan.org/videolan/dav1d/-/archive/1.5.0/dav1d-1.5.0.tar.gz
CODEC_DIR = node_modules/dav1d
CODEC_OUT := $(CODEC_DIR)/build
CODEC_STATIC_BUILD = $(CODEC_OUT)/src/libdav1d.a

ENVIRONMENT = web,worker

PRE_JS = pre.js
OUT_JS = dec/avif_dec.js
OUT_WASM := $(OUT_JS:.js=.wasm)

.PHONY: all clean

all: $(OUT_JS)

# Define dependencies for all variations of build artifacts.
$(filter dec/%,$(OUT_JS)): dec/avif_dec.o
dec/webp_dec.js: $(CODEC_OUT)/src/dav1d.a

$(OUT_JS): $(CODEC_STATIC_BUILD)
	emcc \
		$(LDFLAGS) \
		-L$(CODEC_OUT)/src \
		-ldav1d \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-s DYNAMIC_EXECUTION=0 \
		-s MODULARIZE=1 \
		-o $@ \
		$+

%.o: %.cpp $(CODEC_OUT)/build.ninja
	em++ -c \
		$(CXXFLAGS) \
		-I $(CODEC_DIR)/include \
		-o $@ \
		$<

$(CODEC_STATIC_BUILD): $(CODEC_OUT)/build.ninja
	cd $(CODEC_DIR) && ninja -C build

$(CODEC_OUT)/build.ninja: $(CODEC_DIR)/meson.build
	cd /src/$(CODEC_DIR) && meson setup build --buildtype release \
		--werror \
		--default-library static \
		--cross-file package/crossfiles/wasm32.meson

$(CODEC_DIR)/meson.build:
	mkdir -p $(CODEC_DIR)
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $(CODEC_DIR)

clean:
	$(RM) -rf $(CODEC_OUT)
	$(RM) $(OUT_JS) $(OUT_WASM) **/*.o
