#!/bin/bash

VERSION=v8.5.2

wget https://github.com/ghostery/ghostery-extension/releases/download/$VERSION/ghostery-firefox-$VERSION.zip
mkdir -p mozilla-release/browser/extensions/ghostery
mv ghostery-firefox-$VERSION.zip mozilla-release/browser/extensions/ghostery/
( cd mozilla-release/browser/extensions/ghostery/ && \
  unzip ghostery-firefox-$VERSION.zip && \
  rm ghostery-firefox-$VERSION.zip
)
