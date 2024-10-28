ARG EMSDK_VERSION=2.0.34

FROM emscripten/emsdk:${EMSDK_VERSION}

RUN apt-get update && apt-get install -qqy autoconf libtool pkg-config
ENV CFLAGS "-O3 -flto"
ENV CXXFLAGS "${CFLAGS} -std=c++17"
ENV LDFLAGS "${CFLAGS} \
-s PTHREAD_POOL_SIZE=navigator.hardwareConcurrency \
-s FILESYSTEM=0 \
-s ALLOW_MEMORY_GROWTH=1 \
-s TEXTDECODER=0 \
"

# Build and cache standard libraries with these flags + Embind.
RUN emcc ${CXXFLAGS} ${LDFLAGS} --bind -xc++ /dev/null -o /dev/null
# And another set for the pthread variant.
RUN emcc ${CXXFLAGS} ${LDFLAGS} --bind -pthread -xc++ /dev/null -o /dev/null

WORKDIR /src
CMD ["sh", "-c", "emmake make -j`nproc`"]
