#!/bin/bash
set -x
set -e

export PATH=$MOZ_FETCHES_DIR/cctools/bin:$PATH
export MOZ_FETCHES="{}"
export UPLOAD_DIR=pkg/tmp
export GECKO_PATH=`pwd`/mozilla-release

INPUT_ARM_PATH="$1"
INPUT_X86_PATH="$2"
OUTPUT_PATH="$3"

rm -rf pkg/tmp
mkdir -p pkg/tmp
mkdir -p $MOZ_FETCHES_DIR/aarch64
mkdir -p $MOZ_FETCHES_DIR/x64

rm -rf ./aarch64
rm -rf ./x64
cp $INPUT_ARM_PATH $MOZ_FETCHES_DIR/aarch64/target.dmg
cp $INPUT_X86_PATH $MOZ_FETCHES_DIR/x64/target.dmg
./mozilla-release/taskcluster/scripts/misc/unify.sh
mv $UPLOAD_DIR/target.dmg $OUTPUT_PATH

ls -la ./aarch64

rm -rf ./aarch64
rm -rf ./x64
