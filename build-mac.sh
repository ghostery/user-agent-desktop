#!/bin/bash
set -e

ROOT=`pwd`

if [ ! -f ./build/MacOSX10.11.sdk.tar.bz2 ]; then
  echo 'MacOSX SDK must be available at build/MacOSX10.11.sdk.tar.bz2'
  exit 1
fi

( cd build &&
  docker build -f Base.dockerfile -t ua-build-base ./ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g` &&
  docker build -f MacOSX.dockerfile -t ua-build-mac ./
)

docker run -v $ROOT/mozilla-release:/builds/worker/workspace \
  -v $ROOT:$ROOT \
  --env MOZCONFIG=/builds/worker/configs/macosx.mozconfig \
  -it ua-build-mac \
  /bin/bash
