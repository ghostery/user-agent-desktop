#!/bin/bash

cp ../mozilla-release/taskcluster/scripts/misc/fetch-content ./
docker build -f Base.dockerfile -t mozbuild:base ./
docker build -f Windows.dockerfile -t mozbuild:win64 ./
cd ../
docker run -it -v ./:/builds/worker/workspace/ mozbuild:win64