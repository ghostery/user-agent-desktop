/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// CLIQZ-SPECIAL:
// DB-2064: startup.homepage_override_url should be assigned a url address leading to Cliqz
// actual What's new page.
pref("startup.homepage_override_url","https://cliqz.com/desktop/whatsnew/?version=%VERSION%&oldversion=%OLD_VERSION%");
pref("startup.homepage_welcome_url","");
pref("startup.homepage_welcome_url.additional", "");

// Interval: Time between checks for a new version (in seconds)
pref("app.update.interval", 43200); // 12 hours
// The time interval between the downloading of mar file chunks in the
// background (in seconds)
pref("app.update.download.backgroundInterval", 60);
// Give the user x seconds to react before showing the big UI. default=48 hours
pref("app.update.promptWaitTime", 172800);
// URL user can browse to manually if for some reason all update installation
// attempts fail.
pref("app.update.url.manual", "https://www.cliqz.com/download/");
// A default value for the "More information about this update" link
// supplied in the "An update is available" page of the update wizard.
pref("app.update.url.details", "https://www.cliqz.com/%LOCALE%/browser/notes");

// The number of days a binary is permitted to be old
// without checking for an update.  This assumes that
// app.update.checkInstallTime is true.
pref("app.update.checkInstallTime.days", 63);

// Number of usages of the web console or scratchpad.
// If this is less than 5, then pasting code into the web console or scratchpad is disabled
pref("devtools.selfxss.count", 0);

// turn off special startpage on windows 10
pref("browser.usedOnWindows10", true);
pref("browser.usedOnWindows10.introURL", "about:blank");

// url for support page about how to set browser as default in Windows 10
pref("app.support.default_in_win10.URL", "https://cliqz.com/support/cliqz-als-standardbrowser-in-windows-10");

pref("browser.aboutHomeSnippets.updateUrl", "https://www.cliqz.com/");

// Cliqz distribution settings
pref("app.distributor", "cliqz");
pref("mozilla.partner.id", "cliqz");
pref("browser.cliqz.integrated", "cliqz@cliqz.com, dat@cliqz.com, https-everywhere@eff.org, gdprtool@cliqz.com, myoffrz@cliqz.com");
