#!/bin/bash

set -e
set -x

echo "***** MAC SIGNING AND NOTARY *****"

security unlock-keychain -p cliqz cliqz
PKG_DIR="mozilla-release/obj-x86_64-apple-darwin/dist"
PKG_NAME="Ghostery Browser"
BUNDLE=$PKG_DIR/$PKG_NAME.app
IDENTITY=$MAC_CERT_NAME
BROWSER_ENTITLEMENTS_FILE=mozilla-release/security/mac/hardenedruntime/browser.production.entitlements.xml
PLUGINCONTAINER_ENTITLEMENTS_FILE=mozilla-release/security/mac/hardenedruntime/plugin-container.production.entitlements.xml

# Clear extended attributes which cause codesign to fail
# NOT SURE IF NEEDED
xattr -crs "${BUNDLE}"

# Sign these binaries first. Signing of some binaries has an ordering
# requirement where other binaries must be signed first.
codesign --force -o runtime --verbose --sign "$IDENTITY" \
"${BUNDLE}/Contents/MacOS/XUL" \
"${BUNDLE}/Contents/MacOS/pingsender" \
"${BUNDLE}"/Contents/MacOS/*.dylib

codesign --force -o runtime --verbose --sign "$IDENTITY" --deep \
"${BUNDLE}"/Contents/MacOS/updater.app

# Sign the updater
codesign --force -o runtime --verbose --sign "$IDENTITY" \
--entitlements ${BROWSER_ENTITLEMENTS_FILE} "${BUNDLE}"/Contents/Library/LaunchServices/org.mozilla.updater

# Sign main exectuable
codesign --force -o runtime --verbose --sign "$IDENTITY" --deep \
--entitlements ${BROWSER_ENTITLEMENTS_FILE} \
"${BUNDLE}"/Contents/MacOS/$APP_NAME-bin \
"${BUNDLE}"/Contents/MacOS/$APP_NAME

# Sign gmp-clearkey
codesign --force -o runtime --verbose --sign "$IDENTITY" \
"${BUNDLE}"/Contents/Resources/gmp-clearkey/0.1/libclearkey.dylib

# Sign the plugin-container bundle with deep
codesign --force -o runtime --verbose --sign "$IDENTITY" --deep \
--entitlements ${PLUGINCONTAINER_ENTITLEMENTS_FILE} \
"${BUNDLE}"/Contents/MacOS/plugin-container.app

# Sign the main bundle
codesign --force -o runtime --verbose --sign "$IDENTITY" \
--entitlements ${BROWSER_ENTITLEMENTS_FILE} "${BUNDLE}"

# Validate
codesign -vvv --deep --strict "${BUNDLE}"
