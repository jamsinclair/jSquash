#!/bin/bash
set -e

if [ -z "$EMSDK_VERSION" ]; then
  EMSDK_VERSION=2.0.34
fi

if [ -z "$DEFAULT_CFLAGS" ]; then
  DEFAULT_CFLAGS="-O3 -flto"
fi

BUILD_DIR=$(pwd)
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "EMSDK_VERSION: $EMSDK_VERSION"
echo "BUILD_DIR: $BUILD_DIR"
echo "SCRIPTDIR: $SCRIPTDIR"
# Tag per toolchain and flag set. Codecs pin different Emscripten versions, so
# a single shared tag means two builds running at once hand each other the
# wrong toolchain. Lowercased because Docker rejects uppercase repository names
# and CFLAGS like -O3 would otherwise put one in.
IMG_NAME="jsquash-cpp-build-$EMSDK_VERSION-$(echo "$DEFAULT_CFLAGS" | tr -cd '[:alnum:]' | tr '[:upper:]' '[:lower:]')"

docker build --build-arg EMSDK_VERSION=$EMSDK_VERSION --build-arg DEFAULT_CFLAGS="$DEFAULT_CFLAGS" -t "$IMG_NAME" - < $SCRIPTDIR/cpp.Dockerfile
docker run --rm -v $BUILD_DIR:/src "$IMG_NAME" "$@"
