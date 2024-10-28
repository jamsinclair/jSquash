#!/bin/bash
set -e

BUILD_DIR=$(pwd)
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "BUILD_DIR: $BUILD_DIR"
echo "SCRIPTDIR: $SCRIPTDIR"
docker build -t jsquash-cpp-build - < $SCRIPTDIR/cpp.Dockerfile
docker run --rm -v $BUILD_DIR:/src jsquash-cpp-build "$@"
