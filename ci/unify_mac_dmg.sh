#!/bin/bash
set -x
set -e

export PATH=$MOZ_FETCHES_DIR/cctools/bin:$PATH
export MOZ_FETCHES="{}"
export MACH_USE_SYSTEM_PYTHON=1
export UPLOAD_DIR=mozilla-release/obj-x86_64-apple-darwin/dist/
export GECKO_PATH=`pwd`/mozilla-release

mkdir -p $MOZ_FETCHES_DIR/aarch64
mkdir -p $MOZ_FETCHES_DIR/x64

for DMG_PATH in ${UPLOAD_DIR}*.dmg
do
  DMG=$(basename $DMG_PATH)
  cp mozilla-release/obj-aarch64-apple-darwin/dist/$DMG $MOZ_FETCHES_DIR/aarch64/target.dmg
  cp mozilla-release/obj-x86_64-apple-darwin/dist/$DMG $MOZ_FETCHES_DIR/x64/target.dmg
  ./mozilla-release/taskcluster/scripts/misc/unify.sh
  mv $UPLOAD_DIR/target.dmg $DMG_PATH
done
