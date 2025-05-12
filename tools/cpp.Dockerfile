ARG EMSDK_VERSION=2.0.34

FROM emscripten/emsdk:${EMSDK_VERSION}

ARG DEFAULT_CFLAGS="-O3 -flto"
ARG DEFAULT_CXX_FLAGS="-std=c++17"
ARG DEFAULT_EMSCRIPTEN_SETTINGS="\
-s PTHREAD_POOL_SIZE=navigator.hardwareConcurrency \
-s FILESYSTEM=0 \
-s ALLOW_MEMORY_GROWTH=1 \
-s TEXTDECODER=0 \
"

RUN apt-get update && apt-get install -qqy autoconf libtool pkg-config

ENV CFLAGS="${DEFAULT_CFLAGS}"
ENV CXXFLAGS="${CFLAGS} ${DEFAULT_CXX_FLAGS}"
ENV LDFLAGS="${CFLAGS} ${DEFAULT_EMSCRIPTEN_SETTINGS}"

# Build and cache standard libraries with these flags + Embind.
RUN emcc ${CXXFLAGS} ${LDFLAGS} --bind -xc++ /dev/null -o /dev/null
# And another set for the pthread variant.
RUN emcc ${CXXFLAGS} ${LDFLAGS} --bind -pthread -xc++ /dev/null -o /dev/null

WORKDIR /src
CMD ["sh", "-c", "emmake make -j`nproc`"]
