echo 'Downloading Firefox release source'
FIREFOX_RELEASE=78.0
wget https://archive.mozilla.org/pub/firefox/releases/$FIREFOX_RELEASE/source/firefox-$FIREFOX_RELEASE.source.tar.xz -O tmp/firefox.tar.xz
tar -xf tmp/firefox.tar.xz -C ./
mv firefox-$FIREFOX_RELEASE mozilla-release
