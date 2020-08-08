#!/usr/bin/env sh

set -x
set -e

./fern.js use
./fern.js reset
(
  cd mozilla-release;
  git rm gradlew.bat;
  git commit -am "Delete gradlew.bat";
)
./fern.js export-patches
./fern.js reset
./fern.js import-patches
