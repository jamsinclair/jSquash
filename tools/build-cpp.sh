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
docker build --build-arg EMSDK_VERSION=$EMSDK_VERSION --build-arg DEFAULT_CFLAGS="$DEFAULT_CFLAGS" -t jsquash-cpp-build - < $SCRIPTDIR/cpp.Dockerfile
docker run --rm -v $BUILD_DIR:/src jsquash-cpp-build "$@"
