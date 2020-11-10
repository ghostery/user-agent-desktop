#!/bin/bash
set -ex

version=$1
dest=$2
oldmar=$3
newmar=$4

workdir="$(mktemp -d)"
mkdir -p $workdir
wget -nv -O $workdir/from.mar $oldmar
wget -nv -O $workdir/to.mar $newmar
mkdir -p $workdir/from
mar --chdir $workdir/from -x $workdir/from.mar
mkdir -p $workdir/to
mar --chdir $workdir/to -x $workdir/to.mar

export MAR_CHANNEL_ID=firefox-ghostery-release
export MOZ_PRODUCT_VERSION=$version

mozilla-release/tools/update-packaging/make_incremental_update.sh $dest $workdir/from $workdir/to
mv output.mar $dest
