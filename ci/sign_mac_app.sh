#!/bin/bash

set -e
set -x

echo "***** MAC SIGNING *****"

security unlock-keychain -p cliqz cliqz
PKG_DIR="mozilla-release/obj-x86_64-apple-darwin/dist/bin"
IDENTITY=$MAC_CERT_NAME
BROWSER_ENTITLEMENTS_FILE=mozilla-release/security/mac/hardenedruntime/browser.production.entitlements.xml
PLUGINCONTAINER_ENTITLEMENTS_FILE=mozilla-release/security/mac/hardenedruntime/plugin-container.production.entitlements.xml

# Clear extended attributes which cause codesign to fail
xattr -crs "${PKG_DIR}"

# Sign these binaries first. Signing of some binaries has an ordering
# requirement where other binaries must be signed first.
codesign --force -o runtime --verbose --sign "$IDENTITY" \
"${PKG_DIR}/XUL" \
"${PKG_DIR}/pingsender" \
"${PKG_DIR}"/*.dylib

# Sign gmp-clearkey
codesign --force -o runtime --verbose --sign "$IDENTITY" \
"${PKG_DIR}"/gmp-clearkey/0.1/libclearkey.dylib

codesign --force -o runtime --verbose --sign "$IDENTITY" --deep --entitlements ${BROWSER_ENTITLEMENTS_FILE} \
"${PKG_DIR}"/updater.app

# Sign the plugin-container bundle with deep
codesign --force -o runtime --verbose --sign "$IDENTITY" --deep --entitlements ${PLUGINCONTAINER_ENTITLEMENTS_FILE} \
"${PKG_DIR}"/plugin-container.app

# Sign main exectuable
codesign --force -o runtime --verbose --sign "$IDENTITY" --deep --entitlements ${BROWSER_ENTITLEMENTS_FILE} \
"${PKG_DIR}"/APP_NAME-bin \
"${PKG_DIR}"/$APP_NAME
