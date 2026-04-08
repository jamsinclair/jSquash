CODEC_URL = https://github.com/bvibber/jpegxr/archive/refs/tags/0.3.1.tar.gz
CODEC_PACKAGE = node_modules/jpegxr.tar.gz
CODEC_DIR = node_modules/jpegxr
JXRLIB_DIR = $(CODEC_DIR)/jxrlib
EXTRACTED_STAMP = $(CODEC_DIR)/.extracted

ENVIRONMENT = web,worker
PRE_JS = pre.js

OUT_DEC_JS = dec/jxr_dec.js
OUT_DEC_CPP = dec/jxr_dec.cpp
OUT_DEC_WASM = dec/jxr_dec.wasm

TOTAL_STACK = 5242880
INITIAL_MEMORY_SIZE = 16777216

CODEC_SOURCES = \
	$(JXRLIB_DIR)/image/sys/adapthuff.c \
	$(JXRLIB_DIR)/image/sys/image.c \
	$(JXRLIB_DIR)/image/sys/strcodec.c \
	$(JXRLIB_DIR)/image/sys/strPredQuant.c \
	$(JXRLIB_DIR)/image/sys/strTransform.c \
	$(JXRLIB_DIR)/image/sys/perfTimerANSI.c \
	$(JXRLIB_DIR)/image/decode/decode.c \
	$(JXRLIB_DIR)/image/decode/postprocess.c \
	$(JXRLIB_DIR)/image/decode/segdec.c \
	$(JXRLIB_DIR)/image/decode/strdec.c \
	$(JXRLIB_DIR)/image/decode/strInvTransform.c \
	$(JXRLIB_DIR)/image/decode/strPredQuantDec.c \
	$(JXRLIB_DIR)/image/decode/JXRTranscode.c \
	$(JXRLIB_DIR)/jxrgluelib/JXRGlue.c \
	$(JXRLIB_DIR)/jxrgluelib/JXRGlueJxr.c \
	$(JXRLIB_DIR)/jxrgluelib/JXRGluePFC.c \
	$(JXRLIB_DIR)/jxrgluelib/JXRMeta.c

CODEC_OBJECTS = $(CODEC_SOURCES:.c=.o)
WRAPPER_OBJECT = $(OUT_DEC_CPP:.cpp=.o)

JXR_INCLUDE_FLAGS = \
	-D__ANSI__ \
	-DDISABLE_PERF_MEASUREMENT \
	-I $(JXRLIB_DIR)/jxrgluelib \
	-I $(JXRLIB_DIR)/common/include \
	-I $(JXRLIB_DIR)/image/sys \
	-Wno-constant-conversion \
	-Wno-unused-const-variable \
	-Wno-deprecated-declarations \
	-Wno-comment \
	-Wno-unused-value \
	-Wno-unused-function \
	-Wno-unknown-pragmas \
	-Wno-extra-tokens \
	-Wno-missing-field-initializers \
	-Wno-shift-negative-value \
	-Wno-dangling-else \
	-Wno-sign-compare \
	-Wno-strict-aliasing \
	-Wno-implicit-fallthrough \
	-Wno-endif-labels \
	-Wno-parentheses \
	-Wno-misleading-indentation \
	-Wno-unused-but-set-variable

.PHONY: all clean

all: $(OUT_DEC_JS)

$(OUT_DEC_JS): $(WRAPPER_OBJECT) $(CODEC_OBJECTS)
	$(CXX) \
		$(LDFLAGS) \
		-O0 \
		--pre-js $(PRE_JS) \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-s DYNAMIC_EXECUTION=0 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s TOTAL_STACK=$(TOTAL_STACK) \
		-s INITIAL_MEMORY=$(INITIAL_MEMORY_SIZE) \
		-o $@ \
		$(WRAPPER_OBJECT) $(CODEC_OBJECTS)

$(OUT_DEC_JS): $(EXTRACTED_STAMP)

$(CODEC_OBJECTS): %.o: $(EXTRACTED_STAMP)
	$(CC) -c \
		$(CFLAGS) \
		$(JXR_INCLUDE_FLAGS) \
		-o $@ \
		$(@:.o=.c)

$(WRAPPER_OBJECT): %.o: %.cpp $(EXTRACTED_STAMP)
	$(CXX) -c \
		$(CXXFLAGS) \
		$(JXR_INCLUDE_FLAGS) \
		-o $@ \
		$<

$(EXTRACTED_STAMP): $(CODEC_PACKAGE)
	mkdir -p $(CODEC_DIR)
	tar xzm --strip 1 -C $(CODEC_DIR) -f $(CODEC_PACKAGE)
	touch $@

$(CODEC_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(CODEC_URL) -o $@

clean:
	$(RM) $(WRAPPER_OBJECT) $(OUT_DEC_JS) $(OUT_DEC_WASM)
	$(RM) $(CODEC_OBJECTS)
