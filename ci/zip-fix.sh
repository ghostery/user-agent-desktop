#!/bin/bash

set -e
set -x

INPUT="$1"

# no need to fix if no forward slashes
# running the script multiple times break the zip as it's duplicates its content
7z l "$INPUT" | grep -q '\\' || exit 0

7z rn "$INPUT" $(7z l "$INPUT" | grep '\\' | awk '{ print $6, gensub(/\\/, "/", "g", $6); }' | paste -s)
