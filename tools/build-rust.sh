#!/bin/bash
set -e

SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ ! -z "$RUST_IMG" ]
then
  # Get part after ":" (https://stackoverflow.com/a/15149278/439965).
  IMG_SUFFIX=-${RUST_IMG#*:}
fi
IMG_NAME=squoosh-rust$IMG_SUFFIX
docker build -t $IMG_NAME --build-arg RUST_IMG - < "$SCRIPTDIR/rust.Dockerfile"
docker run -it --rm -v $PWD:/src $IMG_NAME "$@"
