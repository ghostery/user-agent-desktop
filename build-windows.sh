#!/bin/bash

# copy resources from mozilla source which we need for docker build
cp ./mozilla-release/taskcluster/scripts/misc/fetch-content ./
mkdir -p docker/liblowercase
cp -r mozilla-release/build/liblowercase/* docker/liblowercase
cp mozilla-release/taskcluster/scripts/misc/build-liblowercase.sh docker/liblowercase

# build base image
cd docker
docker build -f Base.dockerfile -t mozbuild:base ./

# fetch windows build resources
# TODO vs2017_15.8.4.zip
# TODO makecab.exe

# build windows image
docker build -f Windows.dockerfile -t mozbuild:win64 ./

cd ../
# docker run -it mozbuild:win64 /bin/bash