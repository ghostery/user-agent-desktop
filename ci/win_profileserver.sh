#!/bin/bash
set -x -e

export WORKSPACE=`pwd`

# fetch toolchain
wget -nv -O clang.tar.gz 'http://10.180.244.30:8080/ipfs/QmchjJhoHRVuiWsM75TspdtTyiZieUkgF6MKMpzmoaHB7k'
tar -xf clang.tar.gz
rm clang.tar.gz

# Clean workspace
rm -rf firefox
rm -rf mozilla-release/Ghostery

# get Firefox source
# TODO: Use fern here
FIREFOX_VERSION=82.0.3
wget -nv -O firefox.tar.xz http://10.180.244.30:8080/ipfs/QmUajsHzRDKSTzVhz8WtPnMxqv5dqADBrxHSbbp1RathRZ/firefox/releases/${FIREFOX_VERSION}/source/firefox-${FIREFOX_VERSION}.source.tar.xz
tar -xf firefox.tar.xz
mv firefox-${FIREFOX_VERSION} firefox
rm firefox.tar.xz

export JARLOG_FILE="en-US.log"
export LLVM_PROFDATA=`pwd`/clang/bin/llvm-profdata

cd firefox

# prepare mach environment
./mach create-mach-environment

# run profileserver
unzip $WORKSPACE/mozilla-release/obj-x86_64-pc-mingw32/dist/*.win64.zip -d ./
./mach python build/pgo/profileserver.py --binary ./Ghostery/Ghostery.exe

mkdir -p $WORKSPACE/Windows64/
tar -Jcvf $WORKSPACE/Windows64/profdata.tar.xz merged.profdata en-US.log

# Cleanup
rm -rf $WORKSPACE/mozilla-release $WORKSPACE/firefox $WORKSPACE/clang
