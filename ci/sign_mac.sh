#!/bin/bash

set -e
set -x

INPUT="$1"
OUTPUT="$2"
BUNDLE=$OUTPUT/$APP_NAME/$PKG_NAME.app
BROWSER_ENTITLEMENTS_FILE=mozilla-release/security/mac/hardenedruntime/v2/production/firefox.browser.xml
PLUGINCONTAINER_ENTITLEMENTS_FILE=mozilla-release/security/mac/hardenedruntime/v2/production/plugin-container.xml


echo "Processing $OUTPUT..."

rm -f -rf $OUTPUT
mkdir -p $OUTPUT/$APP_NAME

mozilla-release/build/package/mac_osx/unpack-diskimage $INPUT /Volumes/$APP_NAME $OUTPUT/$APP_NAME

ls -la $OUTPUT

echo "***** SIGNING *****"

security unlock-keychain -p ci ci

# Clear extended attributes which cause codesign to fail
xattr -cr "${BUNDLE}"

# Sign these binaries first. Signing of some binaries has an ordering
# requirement where other binaries must be signed first.
codesign --force -o runtime --verbose --sign "$APPLE_TEAM_ID" \
  "${BUNDLE}/Contents/MacOS/XUL" \
  "${BUNDLE}/Contents/MacOS/pingsender" \
  "${BUNDLE}"/Contents/MacOS/*.dylib

codesign --force -o runtime --verbose --sign "$APPLE_TEAM_ID" --deep \
  "${BUNDLE}"/Contents/MacOS/updater.app

# Sign the updater
codesign --force -o runtime --verbose --sign "$APPLE_TEAM_ID" \
  --entitlements ${BROWSER_ENTITLEMENTS_FILE} \
  "${BUNDLE}"/Contents/Library/LaunchServices/org.mozilla.updater

# Sign main exectuable
codesign --force -o runtime --verbose --sign "$APPLE_TEAM_ID" --deep \
  --entitlements ${BROWSER_ENTITLEMENTS_FILE} \
  "${BUNDLE}"/Contents/MacOS/$APP_NAME

# Sign gmp-clearkey files
find "${BUNDLE}"/Contents/Resources/gmp-clearkey -type f -exec \
  codesign --force -o runtime --verbose --sign "$APPLE_TEAM_ID" {} \;

# Sign the main bundle
codesign --force -o runtime --verbose --sign "$APPLE_TEAM_ID" \
  --entitlements ${BROWSER_ENTITLEMENTS_FILE} "${BUNDLE}"

# Sign the plugin-container bundle with deep
codesign --force -o runtime --verbose --sign "$APPLE_TEAM_ID" --deep \
  --entitlements ${PLUGINCONTAINER_ENTITLEMENTS_FILE} \
  "${BUNDLE}"/Contents/MacOS/plugin-container.app

# Validate
codesign -vvv --deep --strict "${BUNDLE}"
