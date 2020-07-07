#!/bin/bash

WORKSPACE=/builds/worker/workspace/
export TOOLTOOL_DIR=$MOZ_FETCHES_DIR
# move nsis to the correct location
mkdir -p $WORKSPACE/build/src
cp ${MOZ_FETCHES_DIR}nsis.tar.xz $WORKSPACE/build/src
cd ${WORKSPACE}build/src/ && tar -xf nsis.tar.xz

export RUSTC="${TOOLTOOL_DIR}/rustc/bin/rustc"
export CARGO="${TOOLTOOL_DIR}/rustc/bin/cargo"
export RUSTFMT="${TOOLTOOL_DIR}/rustc/bin/rustfmt"
export CBINDGEN="${TOOLTOOL_DIR}/cbindgen/cbindgen"
export MOZCONFIG=${WORKSPACE}browser/config/mozconfig
cd $WORKSPACE
