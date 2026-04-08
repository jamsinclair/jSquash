CFLAGS := \
	-O2 \
	-D__ANSI__ \
	-DDISABLE_PERF_MEASUREMENT \
	-Ijxrlib/jxrgluelib \
    -Ijxrlib/common/include \
    -Ijxrlib/image/sys \
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
    -Wno-sign-compare

LINK_FLAGS := \
	-s SUPPORT_BIG_ENDIAN=1 \
	-s MODULARIZE=1 \
	-s EXPORT_NAME=jpegxr \
	-s SINGLE_FILE=1 \
	--no-entry \
	--post-js=wasm/wasm_api.js \
	-s EXPORTED_FUNCTIONS='["_malloc","_free"]' \
	-s ALLOW_MEMORY_GROWTH=1


SOURCES := \
	jxrlib/image/sys/adapthuff.c \
	jxrlib/image/sys/image.c \
	jxrlib/image/sys/strcodec.c \
	jxrlib/image/sys/strPredQuant.c \
	jxrlib/image/sys/strTransform.c \
	jxrlib/image/sys/perfTimerANSI.c \
	jxrlib/image/decode/decode.c \
	jxrlib/image/decode/postprocess.c \
	jxrlib/image/decode/segdec.c \
	jxrlib/image/decode/strdec.c \
	jxrlib/image/decode/strInvTransform.c \
	jxrlib/image/decode/strPredQuantDec.c \
	jxrlib/image/decode/JXRTranscode.c \
	jxrlib/image/encode/encode.c \
	jxrlib/image/encode/segenc.c \
	jxrlib/image/encode/strenc.c \
	jxrlib/image/encode/strFwdTransform.c \
	jxrlib/image/encode/strPredQuantEnc.c \
	jxrlib/jxrgluelib/JXRGlue.c \
	jxrlib/jxrgluelib/JXRGlueJxr.c \
	jxrlib/jxrgluelib/JXRGluePFC.c \
	jxrlib/jxrgluelib/JXRMeta.c \
	wasm/wasm_api.c

OBJECTS := ${SOURCES:.c=.o}

OUTPUT := wasm/jpegxr.js

.PHONY: all clean

all: ${OUTPUT} ${DIS}

clean:
	rm -f ${OBJECTS} ${OUTPUT}

test: ${OUTPUT}
	node wasm/test.js

${OUTPUT} : ${OBJECTS} Makefile
	emcc ${CFLAGS} ${LINK_FLAGS} -o ${OUTPUT} ${OBJECTS}

%.o : %.c Makefile
	emcc ${CFLAGS} -o $@ -c $<
