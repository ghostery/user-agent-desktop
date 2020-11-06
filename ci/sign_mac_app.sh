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


# Notarization

BUNDLE_ID="com.cliqz.desktopbrowser"
BUNDLE_PKG="$PKG_NAME.zip"

# create temporary files
NOTARIZE_APP_LOG=$(mktemp -t notarize-app)
NOTARIZE_INFO_LOG=$(mktemp -t notarize-info)

# delete temporary files on exit
function finish {
	rm "$NOTARIZE_APP_LOG" "$NOTARIZE_INFO_LOG"
}
trap finish EXIT

rm -rf "$BUNDLE_PKG"
zip -r "$BUNDLE_PKG" \
  "${BUNDLE}/Contents/MacOS/XUL" \
  "${BUNDLE}/Contents/MacOS/pingsender" \
  "${BUNDLE}"/Contents/MacOS/*.dylib \
  "${BUNDLE}"/Contents/MacOS/updater.app \
  "${BUNDLE}"/Contents/Library/LaunchServices/org.mozilla.updater \
  "${BUNDLE}"/Contents/MacOS/$APP_NAME-bin \
  "${BUNDLE}"/Contents/MacOS/$APP_NAME \
  "${BUNDLE}"/Contents/Resources/gmp-clearkey/0.1/libclearkey.dylib \
  "${BUNDLE}"/Contents/MacOS/plugin-container.app

# submit app for notarization
if xcrun altool --notarize-app --primary-bundle-id "$BUNDLE_ID" --username "$MAC_NOTARY_USER" --password "$MAC_NOTARY_PASS" --asc-provider EvidonInc -f "$BUNDLE_PKG" > "$NOTARIZE_APP_LOG" 2>&1; then
	cat "$NOTARIZE_APP_LOG"
	RequestUUID=$(awk -F ' = ' '/RequestUUID/ {print $2}' "$NOTARIZE_APP_LOG")

	# check status periodically
	while sleep 60 && date; do
		# check notarization status
		if xcrun altool --notarization-info "$RequestUUID" --username "$ASC_USERNAME" --password "$ASC_PASSWORD" > "$NOTARIZE_INFO_LOG" 2>&1; then
			cat "$NOTARIZE_INFO_LOG"

			# once notarization is complete, run stapler and exit
			if ! grep -q "Status: in progress" "$NOTARIZE_INFO_LOG"; then
				xcrun stapler staple "$PKG_DIR/$PKG_NAME.app"
				exit $?
			fi
		else
			cat "$NOTARIZE_INFO_LOG" 1>&2
			exit 1
		fi
	done
else
	cat "$NOTARIZE_APP_LOG" 1>&2
	exit 1
fi
