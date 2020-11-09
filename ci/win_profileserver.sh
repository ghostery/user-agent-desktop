#!/bin/bash
set -x -e

export WORKSPACE=`pwd`

# fetch toolchain
wget -nv -O clang.tar.gz 'http://kria.cliqz:8080/ipfs/QmchjJhoHRVuiWsM75TspdtTyiZieUkgF6MKMpzmoaHB7k'
tar -xf clang.tar.gz
rm clang.tar.gz

# Clean workspace
rm -rf firefox
rm -rf mozilla-release/Ghostery

# get Firefox source
wget -nv -O firefox.tar.xz http://kria.cliqz:8080/ipns/k2k4r8jy3h2kku2sungmzbrp2zpj3yf2js0w98bwbbyiqt2qzomkvyli/firefox/releases/82.0.2/source/firefox-82.0.2.source.tar.xz
tar -xf firefox.tar.xz
mv firefox-82.0.2 firefox
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