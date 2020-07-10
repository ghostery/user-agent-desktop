#!/bin/bash
set -e

ROOT=`pwd`
# copy resources from mozilla source which we need for docker build
cp ./mozilla-release/taskcluster/scripts/misc/fetch-content ./build/

cd build
docker build -f Base.dockerfile -t ua-build-base ./
docker build -f Linux.dockerfile -t ua-build-linux ./

cd ../
docker run -v $ROOT/mozilla-release:/builds/worker/workspace \
  --env MOZCONFIG=/builds/worker/configs/linux.mozconfig \
  -it ua-build-linux \
  /bin/bash
