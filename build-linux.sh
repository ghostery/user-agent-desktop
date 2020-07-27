#!/bin/bash
set -e

ROOT=`pwd`
# copy resources from mozilla source which we need for docker build
cp ./mozilla-release/taskcluster/scripts/misc/fetch-content ./build/

( cd build &&
  docker build -f Base.dockerfile -t ua-build-base:debian9 ./ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g` --build-arg DOCKER_BASE_IMAGE=debian:9 &&
  docker build -f Linux.dockerfile -t ua-build-linux ./
)

docker run -v $ROOT/mozilla-release:/builds/worker/workspace \
  --env MOZCONFIG=/builds/worker/configs/linux.mozconfig \
  -it ua-build-linux \
  /bin/bash
