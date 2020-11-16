#!/bin/bash
set -ex

version=$1
dest=$2
oldmar=$3
newmar=$4

export MAR_CHANNEL_ID=firefox-ghostery-release
export MOZ_PRODUCT_VERSION=$version
export MAR=/builds/worker/bin/mar

MOZILLA_RELEASE=`pwd`/mozilla-release
workdir="$(mktemp -d)"
mkdir -p $workdir
wget -nv -O $workdir/from.mar $oldmar
wget -nv -O $workdir/to.mar $newmar
mkdir -p $workdir/from
(cd $workdir/from && perl $MOZILLA_RELEASE/tools/update-packaging/unwrap_full_update.pl ../from.mar)
mkdir -p $workdir/to
(cd $workdir/to && perl $MOZILLA_RELEASE/tools/update-packaging/unwrap_full_update.pl ../to.mar)

$MOZILLA_RELEASE/tools/update-packaging/make_incremental_update.sh $dest $workdir/from $workdir/to
mv output.mar $dest
