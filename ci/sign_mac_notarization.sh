#!/bin/bash

set -x
set -e

PKG_DIR=ci/pkg

ASC_USERNAME="$1"
ASC_PASSWORD="$2"

BUNDLE_ID="com.cliqz.desktopbrowser"
BUNDLE_PKG="$PKG_NAME.zip"
BROWSER_ENTITLEMENTS_FILE=mozilla-release/security/mac/hardenedruntime/browser.production.entitlements.xml
IDENTITY=$MAC_CERT_NAME

# create temporary files
NOTARIZE_APP_LOG=$(mktemp -t notarize-app)
NOTARIZE_INFO_LOG=$(mktemp -t notarize-info)

# delete temporary files on exit
function finish {
	rm "$NOTARIZE_APP_LOG" "$NOTARIZE_INFO_LOG"
}
trap finish EXIT

DMG_PATH=$(ls -t mozilla-release/obj-x86_64-apple-darwin/dist/*.dmg | head -n 1)

rm -f -rf $PKG_DIR
mkdir -p $PKG_DIR
mozilla-release/build/package/mac_osx/unpack-diskimage $DMG_PATH /Volumes/$APP_NAME $PKG_DIR

BUNDLE=$PKG_DIR/$PKG_NAME.app

# Sign the main bundle
codesign --force -o runtime --verbose --sign "$IDENTITY" \
--entitlements ${BROWSER_ENTITLEMENTS_FILE} "${BUNDLE}"

# Validate
codesign -vvv --deep --strict "${BUNDLE}"

zip -r "$BUNDLE_PKG" "$BUNDLE"

# submit app for notarization
if xcrun altool --notarize-app --primary-bundle-id "$BUNDLE_ID" --username "$ASC_USERNAME" --password "$ASC_PASSWORD" --asc-provider EvidonInc -f "$BUNDLE_PKG" > "$NOTARIZE_APP_LOG" 2>&1; then
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
