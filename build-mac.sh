#!/bin/bash
set -e

ROOT=`pwd`
# copy resources from mozilla source which we need for docker build
cp ./mozilla-release/taskcluster/scripts/misc/fetch-content ./build/

cd build
docker build -f Base.dockerfile -t ua-build-base:debian10 ./ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g` --build-arg DOCKER_BASE_IMAGE=debian:10
docker build -f MacOSX.dockerfile -t ua-build-mac ./
