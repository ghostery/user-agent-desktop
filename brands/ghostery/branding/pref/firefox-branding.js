/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This file contains branding-specific prefs.

/****************************************************************************
 * SECTION: ENABLE GHOSTERY-SPECIFIC PREFS                                  *
****************************************************************************/

/** UPDATES ***/
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
// The number of days a binary is permitted to be old
// without checking for an update.  This assumes that
// app.update.checkInstallTime is true.
pref("app.update.checkInstallTime.days", 63);
// Give the user x seconds to reboot before showing a badge on the hamburger
// button. default=immediately
pref("app.update.badgeWaitTime", 0);

/** VARIOUS ***/
// Fetch shavar updates from Ghostery endpoint
pref("browser.safebrowsing.provider.mozilla.updateURL", "https://get.ghosterybrowser.com/shavar/downloads?client=SAFEBROWSING_ID&pver=2.2");

// UA compat mode - Adds Firefox/VER to the UA string in addition to the APP_NAME. (https://github.com/ghostery/user-agent-desktop/issues/114)
pref("general.useragent.compatMode.firefox", true);

// Support and feedback URLs
pref("app.support.baseURL", "https://get.ghosterybrowser.com/support/");
pref("app.feedback.baseURL", "https://www.ghostery.com/support/");

// Override settings server to Ghostery
pref("services.settings.server", "https://get.ghosterybrowser.com/settings/v1");


/****************************************************************************
 * SECTION: DISABLE MOZILLA FIREFOX-SPECIFIC PREFS                          *
****************************************************************************/

/** TRACKING ***/
// Disable Firefox's native tracking protection blocking
pref("browser.contentblocking.category", "custom");
pref("privacy.trackingprotection.enabled", false);
pref("privacy.trackingprotection.pbmode.enabled", false);
pref("privacy.trackingprotection.cryptomining.enabled", false);
pref("privacy.trackingprotection.fingerprinting.enabled", false);
pref("privacy.trackingprotection.socialtracking.enabled", false);
pref("privacy.socialtracking.block_cookies.enabled", false);
pref("browser.contentblocking.database.enabled", false);
pref("browser.contentblocking.allowlist.storage.enabled", false);
pref("browser.contentblocking.cryptomining.preferences.ui.enabled", false);
pref("browser.contentblocking.fingerprinting.preferences.ui.enabled", false);

// Remove addons.mozilla.org from set of domains that extensions cannot access
pref("extensions.webextensions.restrictedDomains", "accounts-static.cdn.mozilla.net,accounts.firefox.com,addons.cdn.mozilla.net,api.accounts.firefox.com,content.cdn.mozilla.net,discovery.addons.mozilla.org,install.mozilla.org,oauth.accounts.firefox.com,profile.accounts.firefox.com,support.mozilla.org,sync.services.mozilla.com");

// Disable System Addon updates
// [NOTE] We use partial updates instead of system addon updates.
pref("extensions.systemAddon.update.url", "");

/** TELEMETRY ***/
// Telemtry
pref("toolkit.telemetry.unified", false);
pref("toolkit.telemetry.enabled", false);
pref("toolkit.telemetry.server", "data:,");
pref("toolkit.telemetry.archive.enabled", false);
pref("toolkit.telemetry.newProfilePing.enabled", false);
pref("toolkit.telemetry.shutdownPingSender.enabled", false);
pref("toolkit.telemetry.updatePing.enabled", false);
pref("toolkit.telemetry.bhrPing.enabled", false);
pref("toolkit.telemetry.firstShutdownPing.enabled", false);

// Nimbus
pref("messaging-system.rsexperimentloader.enabled", false);
pref("browser.privatebrowsing.promoEnabled", false);

// Corroborator (#141)
pref("corroborator.enabled", false);

// Telemetry Coverage
pref("toolkit.telemetry.coverage.opt-out", true);
pref("toolkit.coverage.opt-out", true);

// Health Reports
// [SETTING] Privacy & Security>Firefox Data Collection & Use>Allow Firefox to send technical data.
pref("datareporting.healthreport.uploadEnabled", false);

// New data submission, master kill switch
// If disabled, no policy is shown or upload takes place, ever
// [1] https://bugzilla.mozilla.org/1195552 ***/
pref("datareporting.policy.dataSubmissionEnabled", false);

// Studies
// [SETTING] Privacy & Security>Firefox Data Collection & Use>Allow Firefox to install and run studies
pref("app.shield.optoutstudies.enabled", false);

// Personalized Extension Recommendations in about:addons and AMO
// [NOTE] This pref has no effect when Health Reports are disabled.
// [SETTING] Privacy & Security>Firefox Data Collection & Use>Allow Firefox to make personalized extension recommendations
pref("browser.discovery.enabled", false);

// Crash Reports
pref("breakpad.reportURL", "");
pref("browser.tabs.crashReporting.sendReport", false);
// backlogged crash reports
pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);

// disable Captive Portal detection
// [1] https://www.eff.org/deeplinks/2017/08/how-captive-portals-interfere-wireless-security-and-privacy
// [2] https://wiki.mozilla.org/Necko/CaptivePortal
// user_pref("captivedetect.canonicalURL", "");
// user_pref("network.captive-portal-service.enabled", false);

// disable Network Connectivity checks
// [1] https://bugzilla.mozilla.org/1460537
// user_pref("network.connectivity-service.enabled", false);

// Software that continually reports what default browser you are using
pref("default-browser-agent.enabled", false);

// Report extensions for abuse
pref("extensions.abuseReport.enabled", false);

// Normandy/Shield [extensions tracking]
// Shield is an telemetry system (including Heartbeat) that can also push and test "recipes"
pref("app.normandy.enabled", false);
pref("app.normandy.api_url", "");

// disable PingCentre telemetry (used in several System Add-ons)
// Currently blocked by 'datareporting.healthreport.uploadEnabled'
pref("browser.ping-centre.telemetry", false);

// disable Activity Stream telemetry
pref("browser.newtabpage.activity-stream.feeds.telemetry", false);
pref("browser.newtabpage.activity-stream.telemetry", false);

// Disable Firefox-specifc menus and products
pref("browser.privatebrowsing.vpnpromourl", ""); // Mozilla VPN
pref("browser.messaging-system.whatsNewPanel.enabled", false); // What's New
pref("extensions.pocket.enabled", false); // Pocket Account
pref("extensions.pocket.api"," ");
pref("extensions.pocket.oAuthConsumerKey", " ");
pref("extensions.pocket.site", " ");
pref("identity.fxaccounts.enabled", false); // Firefox Accounts & Sync
pref("extensions.fxmonitor.enabled", false); // Firefox Monitor
pref("signon.management.page.breach-alerts.enabled", false); // Firefox Lockwise
pref("signon.management.page.breachAlertUrl", "");
pref("browser.contentblocking.report.lockwise.enabled", false);
pref("browser.contentblocking.report.lockwise.how_it_works.url", "");
pref("signon.generation.available", false); // Password Generator (doesn't work without Lockwise)
pref("signon.generation.enabled", false); // [SETTING] "Suggest and generate strong passwords"
// Disable Extension Recommendations (CFR: "Contextual Feature Recommender")
pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons", false);
pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features", false);
pref("extensions.htmlaboutaddons.recommendations.enabled", false);
pref("extensions.getAddons.showPane", false);

/** HOMEPAGE ***/
pref("startup.homepage_override_url", "");
pref("startup.homepage_welcome_url", "");
pref("startup.homepage_welcome_url.additional", "");
pref("browser.aboutwelcome.enabled", false);

/** NEW TAB PAGE & ACTIVITY STREAM ***/
pref("browser.startup.page", 3);
pref("browser.newtabpage.activity-stream.discoverystream.enabled", false);
pref("browser.newtabpage.activity-stream.showSponsored", false);
pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);
pref("browser.newtabpage.activity-stream.feeds.topsites", false);
pref("browser.newtabpage.activity-stream.feeds.snippets", false);
pref("browser.newtabpage.activity-stream.feeds.section.highlights", false);
pref("browser.newtabpage.activity-stream.section.highlights.includeBookmarks", false);
pref("browser.newtabpage.activity-stream.section.highlights.includeDownloads", false);
pref("browser.newtabpage.activity-stream.section.highlights.includePocket", false);
pref("browser.newtabpage.activity-stream.section.highlights.includeVisited", false);

// Number of usages of the web console.
// If this is less than 5, then pasting code into the web console is disabled
pref("devtools.selfxss.count", 0);

// Disable "Firefox Suggest"
pref("browser.urlbar.groupLabels.enabled", false);
pref("browser.urlbar.quicksuggest.enabled", false);
