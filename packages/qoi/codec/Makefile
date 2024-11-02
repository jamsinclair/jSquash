CODEC_URL = https://github.com/phoboslab/qoi/archive/8d35d93cdca85d2868246c2a8a80a1e2c16ba2a8.tar.gz

CODEC_DIR = node_modules/qoi
CODEC_BUILD_DIR:= $(CODEC_DIR)/build
ENVIRONMENT = web,worker

PRE_JS = pre.js
OUT_JS = enc/qoi_enc.js dec/qoi_dec.js
OUT_WASM := $(OUT_JS:.js=.wasm)

.PHONY: all clean

all: $(OUT_JS)

$(filter enc/%,$(OUT_JS)): enc/qoi_enc.o
$(filter dec/%,$(OUT_JS)): dec/qoi_dec.o

# ALL .js FILES
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

# ALL .o FILES
%.o: %.cpp $(CODEC_DIR)
	$(CXX) -c \
		$(CXXFLAGS) \
		-I $(CODEC_DIR) \
		-o $@ \
		$<

# CREATE DIRECTORY
$(CODEC_DIR):
	mkdir -p $(CODEC_DIR)
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $(CODEC_DIR)

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_DIR) clean
