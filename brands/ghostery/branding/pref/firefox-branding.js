/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This file contains branding-specific prefs.

pref("startup.homepage_override_url", "");
pref("startup.homepage_welcome_url", "");
pref("startup.homepage_welcome_url.additional", "");
// The time interval between checks for a new version (in seconds)
pref("app.update.interval", 86400); // 24 hours
// Give the user x seconds to react before showing the big UI. default=24 hours
pref("app.update.promptWaitTime", 86400);
// URL user can browse to manually if for some reason all update installation
// attempts fail.
pref("app.update.url.manual", "https://www.ghostery.com/download/");
// A default value for the "More information about this update" link
// supplied in the "An update is available" page of the update wizard.
pref("app.update.url.details", "https://www.ghostery.com/%LOCALE%/browser/notes");

// Disable System Addon updates
pref("extensions.systemAddon.update.url", "");

// The number of days a binary is permitted to be old
// without checking for an update.  This assumes that
// app.update.checkInstallTime is true.
pref("app.update.checkInstallTime.days", 63);

// Give the user x seconds to reboot before showing a badge on the hamburger
// button. default=immediately
pref("app.update.badgeWaitTime", 0);

// Number of usages of the web console.
// If this is less than 5, then pasting code into the web console is disabled
pref("devtools.selfxss.count", 5);

/** Anti-tracking settings */
// tracker storage partitioning - currently undocumented setting to partition browser storage for trackers in 3rd party contexts.
// See https://bugzilla.mozilla.org/show_bug.cgi?id=1549587
pref("network.cookie.cookieBehavior", 5);
// origin trimming - controls how much referrer to send across origins, 2 = only send the origin
// https://wiki.mozilla.org/Security/Referrer
pref("network.http.referer.XOriginTrimmingPolicy", 2);
// samesite cookies - lax by default. Protects against CSRF attacks
// https://hacks.mozilla.org/2020/08/changes-to-samesite-cookie-behavior/
pref("network.cookie.sameSite.laxByDefault", true);
pref("network.cookie.sameSite.noneRequiresSecure", true);
// redirect tracking protection - purges tracker cookies for domains with no first-party interactions.
// https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Privacy/Redirect_Tracking_Protection
pref("privacy.purge_trackers.enabled", true);

// disable tracking protection blocking
pref("browser.contentblocking.category", "custom");
pref("privacy.trackingprotection.enabled", false);
pref("privacy.trackingprotection.pbmode.enabled", false);
pref("privacy.trackingprotection.cryptomining.enabled", false);
pref("privacy.trackingprotection.fingerprinting.enabled", false);
pref("privacy.trackingprotection.socialtracking.enabled", false);
pref("privacy.socialtracking.block_cookies.enabled", false);

/* 0320: disable about:addons' Recommendations pane (uses Google Analytics) ***/
pref("extensions.getAddons.showPane", false); // [HIDDEN PREF]
// Recommendations in about:addons' addons pane.
pref("extensions.htmlaboutaddons.recommendations.enabled", false);

/* 0330: disable telemetry
 * the pref (.unified) affects the behaviour of the pref (.enabled)
 * IF unified=false then .enabled controls the telemetry module
 * IF unified=true then .enabled ONLY controls whether to record extended data
 * so make sure to have both set as false
 * [NOTE] FF58+ 'toolkit.telemetry.enabled' is now LOCKED to reflect prerelease
 * or release builds (true and false respectively), see [2]
 * [1] https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/internals/preferences.html
 * [2] https://medium.com/georg-fritzsche/data-preference-changes-in-firefox-58-2d5df9c428b5 ***/
pref("toolkit.telemetry.unified", false);
pref("toolkit.telemetry.enabled", false); // see [NOTE] above FF58+
pref("toolkit.telemetry.server", "data:,");
pref("toolkit.telemetry.archive.enabled", false);
pref("toolkit.telemetry.newProfilePing.enabled", false); // [FF55+]
pref("toolkit.telemetry.shutdownPingSender.enabled", false); // [FF55+]
pref("toolkit.telemetry.updatePing.enabled", false); // [FF56+]
pref("toolkit.telemetry.bhrPing.enabled", false); // [FF57+] Background Hang Reporter
pref("toolkit.telemetry.firstShutdownPing.enabled", false); // [FF57+]
 /* 0331: disable Telemetry Coverage
  * [1] https://blog.mozilla.org/data/2018/08/20/effectively-measuring-search-in-firefox/ ***/
pref("toolkit.telemetry.coverage.opt-out", true); // [HIDDEN PREF]
pref("toolkit.coverage.opt-out", true); // [FF64+] [HIDDEN PREF]
pref("toolkit.coverage.endpoint.base", "");
 /* 0340: disable Health Reports
  * [SETTING] Privacy & Security>Firefox Data Collection & Use>Allow Firefox to send technical... data ***/
pref("datareporting.healthreport.uploadEnabled", false);
 /* 0341: disable new data submission, master kill switch [FF41+]
  * If disabled, no policy is shown or upload takes place, ever
  * [1] https://bugzilla.mozilla.org/1195552 ***/
pref("datareporting.policy.dataSubmissionEnabled", false);
 /* 0342: disable Studies (see 0503)
  * [SETTING] Privacy & Security>Firefox Data Collection & Use>Allow Firefox to install and run studies ***/
pref("app.shield.optoutstudies.enabled", false);
 /* 0343: disable personalized Extension Recommendations in about:addons and AMO [FF65+]
  * [NOTE] This pref has no effect when Health Reports (0340) are disabled
  * [SETTING] Privacy & Security>Firefox Data Collection & Use>Allow Firefox to make personalized extension recommendations
  * [1] https://support.mozilla.org/kb/personalized-extension-recommendations ***/
pref("browser.discovery.enabled", false);
 /* 0350: disable Crash Reports ***/
pref("breakpad.reportURL", "");
pref("browser.tabs.crashReporting.sendReport", false); // [FF44+]
pref("browser.crashReports.unsubmittedCheck.enabled", false); // [FF51+]
 /* 0351: disable backlogged Crash Reports
  * [SETTING] Privacy & Security>Firefox Data Collection & Use>Allow Firefox to send backlogged crash reports  ***/
pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false); // [FF58+]

/* Disable Firefox-specifc menus: Pocket, Sync, What's new */
pref("browser.messaging-system.whatsNewPanel.enabled", false); // What's New [FF69+]
pref("extensions.pocket.enabled", false); // Pocket Account [FF46+]
pref("identity.fxaccounts.enabled", false); // Firefox Accounts & Sync [FF60+] [RESTART]

// UA compat mode - Adds Firefox/VER to the UA string in addition to the APP_NAME. (https://github.com/ghostery/user-agent-desktop/issues/114)
pref("general.useragent.compatMode.firefox", true);
