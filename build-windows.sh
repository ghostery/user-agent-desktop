#!/bin/bash

ROOT=`pwd`
# copy resources from mozilla source which we need for docker build
cp ./mozilla-release/taskcluster/scripts/misc/fetch-content ./
# mkdir -p docker/liblowercase
# cp -r mozilla-release/build/liblowercase/* docker/liblowercase
# cp mozilla-release/taskcluster/scripts/misc/build-liblowercase.sh docker/liblowercase

# build base image
cd docker
docker build -f Base.dockerfile -t mozbuild:base ./

# fetch windows build resources
# TODO vs2017_15.8.4.zip
# TODO makecab.exe

# build windows image
docker build -f Windows.dockerfile -t mozbuild:win64 ./

cd ../
# prepare vfat drive for case insensitive Win10 SDK volume
if [ ! -f /tmp/vfat ]; then
  truncate -s 2G /tmp/vfat
  LOOP=/dev/loop8
  sudo losetup $LOOP /tmp/vfat
  sudo mkfs.vfat $LOOP
  sudo mkdir -p /mnt/vfat
  sudo mount -o uid=$UID /dev/loop0 /mnt/vfat
fi

if [ ! -d /mnt/vfat/vs2017_15.8.4 ]; then
  cp docker/vs2017_15.8.4.zip /mnt/vfat/
  cd /mnt/vfat/
  unzip docker/vs2017_15.8.4.zip
  rm vs2017_15.8.4.zip
fi

cd $ROOT

# docker run -it mozbuild:win64 /bin/bash
docker run -v $ROOT/mozilla-release:/builds/worker/workspace -v /mnt/vfat/vs2017_15.8.4/:/builds/worker/fetches/vs2017_15.8.4 -it mozbuild:win64 /bin/bash
