#!/bin/bash

set -e
set -x

ARTIFACT_PATH="/c/build"
package="vs2017_15.9.29"

mkdir -p $ARTIFACT_PATH

if [ ! -s "$ARTIFACT_PATH/$package" ]; then
  wget -O "${ARTIFACT_PATH}/${package}.tar.bz2" "ftp://10.180.244.36/cliqz-browser-build-artifacts/${package}.tar.bz2"
  tar xjvf ${ARTIFACT_PATH}/${package}.tar.bz2 -C $ARTIFACT_PATH
fi
