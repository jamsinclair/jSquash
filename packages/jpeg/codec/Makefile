CODEC_URL := https://github.com/mozilla/mozjpeg/archive/v3.3.1.tar.gz
CODEC_DIR := node_modules/mozjpeg
CODEC_OUT_RELATIVE := .libs/libjpeg.a rdswitch.o
CODEC_OUT := $(addprefix $(CODEC_DIR)/, $(CODEC_OUT_RELATIVE))
ENVIRONMENT = web,worker

PRE_JS = pre.js
OUT_JS := enc/mozjpeg_enc.js dec/mozjpeg_dec.js
OUT_WASM := $(OUT_JS:.js=.wasm)

.PHONY: all clean

all: $(OUT_JS)

# Define dependencies for all variations of build artifacts.
$(filter enc/%,$(OUT_JS)): enc/mozjpeg_enc.cpp
$(filter dec/%,$(OUT_JS)): dec/mozjpeg_dec.cpp

%.js: $(CODEC_OUT)
	$(CXX) \
		-I $(CODEC_DIR) \
		${CXXFLAGS} \
		${LDFLAGS} \
		--pre-js $(PRE_JS) \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-s DYNAMIC_EXECUTION=0 \
		-s MODULARIZE=1 \
		-o $@ \
		$+

# This one is a bit special: there is no rule for .libs/libjpeg.a
#  so we use libjpeg.la which implicitly builds that one instead.
$(CODEC_DIR)/.libs/libjpeg.a: $(CODEC_DIR)/Makefile
	$(MAKE) -C $(CODEC_DIR) libjpeg.la

$(CODEC_DIR)/rdswitch.o: $(CODEC_DIR)/Makefile
	$(MAKE) -C $(CODEC_DIR) rdswitch.o

$(CODEC_DIR)/Makefile: $(CODEC_DIR)/configure
	cd $(CODEC_DIR) && ./configure \
		--host=wasm32 \
		--disable-shared \
		--without-turbojpeg \
		--without-simd \
		--without-arith-enc \
		--without-arith-dec \
		--with-build-date=jsquash
		# ^ If not provided with a dummy value, MozJPEG includes a build date in the
		# binary as part of the version string, making binaries different each time.

$(CODEC_DIR)/configure: $(CODEC_DIR)/configure.ac
	cd $(CODEC_DIR) && autoreconf -iv
	# MozJPEG 3.3.1 relies on autoheader putting AC_INIT's PACKAGE_NAME and
	# VERSION into the first AC_CONFIG_HEADERS file. Autoconf no longer does
	# that for its three-header layout, so both come out as `#undef` and
	# jcmaster.c fails to compile the version string it embeds.
	#
	# Patch the template autoheader has just produced, before configure turns
	# it into config.h. config.status only rewrites `#undef` lines, so these
	# defines survive the regeneration make triggers during the build.
	cd $(CODEC_DIR) && sed -i \
		-e 's|^#undef PACKAGE_NAME$$|#define PACKAGE_NAME "mozjpeg"|' \
		-e 's|^#undef PACKAGE_VERSION$$|#define PACKAGE_VERSION "3.3.1"|' \
		-e 's|^#undef VERSION$$|#define VERSION "3.3.1"|' \
		config.h.in

$(CODEC_DIR)/configure.ac: $(CODEC_DIR)

$(CODEC_DIR):
	mkdir -p $@
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_DIR) clean
