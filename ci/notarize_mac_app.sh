#!/bin/bash

PKG_DIR="$1"

BUNDLE_ID="com.cliqz.desktopbrowser"
BUNDLE_PKG="$PKG_NAME.zip"

# create temporary files
NOTARIZE_APP_LOG=$(mktemp -t notarize-app)
NOTARIZE_INFO_LOG=$(mktemp -t notarize-info)

# delete temporary files on exit
function finish {
	rm "$NOTARIZE_APP_LOG" "$NOTARIZE_INFO_LOG"
	rm "$BUNDLE_PKG"
}
trap finish EXIT

zip -r "$BUNDLE_PKG" "$PKG_DIR/$APP_NAME/$PKG_NAME.app"
# submit app for notarization
if xcrun notarytool submit --team-id HPY23A294X --apple-id "$MAC_NOTARY_USER" --password "$MAC_NOTARY_PASS" "$BUNDLE_PKG" > "$NOTARIZE_APP_LOG" 2>&1; then
	cat "$NOTARIZE_APP_LOG"
	RequestUUID=$(grep id: $NOTARIZE_APP_LOG | head -1 | sed -e 's/.*id: //')

	# check status periodically
	while sleep 60 && date; do
		# check notarization status
		if xcrun notarytool info --team-id HPY23A294X --apple-id "$MAC_NOTARY_USER" --password "$MAC_NOTARY_PASS" "$RequestUUID" > "$NOTARIZE_INFO_LOG" 2>&1; then
			cat "$NOTARIZE_INFO_LOG"

			# once notarization is complete, run stapler and exit
			if ! grep -q "Status: in progress" "$NOTARIZE_INFO_LOG"; then
				xcrun stapler staple "$PKG_DIR/$APP_NAME/$PKG_NAME.app"
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
