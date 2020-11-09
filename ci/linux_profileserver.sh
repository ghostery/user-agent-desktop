#! /bin/bash -vex

set -x -e

export JARLOG_FILE="en-US.log"
export LLVM_PROFDATA=$MOZ_FETCHES_DIR/clang/bin/llvm-profdata

# run XVfb in the background
. taskcluster/docker/recipes/xvfb.sh

cleanup() {
    local rv=$?
    cleanup_xvfb
    exit $rv
}
trap cleanup EXIT INT

start_xvfb '1024x768x24' 2

./mach python build/pgo/profileserver.py --binary $BINARY
