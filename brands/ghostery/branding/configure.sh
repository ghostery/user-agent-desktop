# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

MOZ_APP_VENDOR=Ghostery
MOZ_APP_BASENAME=Ghostery
MOZ_APP_DISPLAYNAME="Ghostery Dawn"
MOZ_MACBUNDLE_ID=com.ghostery.browser
MOZ_DISTRIBUTION_ID=com.ghostery
if [[ -v MOZ_AUTOMATION ]]; then
  MOZ_SOURCE_REPO="https://github.com/ghostery/user-agent-desktop"
fi
