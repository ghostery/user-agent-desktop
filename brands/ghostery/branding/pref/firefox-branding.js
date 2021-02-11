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
// [NOTE] We currently don't use partial updates instead of system addon updates
pref("extensions.systemAddon.update.url", "");

/** TELEMETRY, STUDIES, EXPERIMENTS, CRASH REPORTS ***/
// See https://github.com/yokoffing/Better-Fox/blob/a458e14a94ff67111868178639c188a5d08f7038/SecureFox.js#L510
// for details.
// [NOTE] We may need re-enable and/or redirect some of these for Ghostery Dawn.
pref("datareporting.policy.dataSubmissionEnabled", false);
pref("datareporting.healthreport.uploadEnabled", false);
pref("browser.ping-centre.telemetry", false);
pref("default-browser-agent.enabled", false);
pref("app.shield.optoutstudies.enabled", false);
pref("app.normandy.enabled", false);
pref("app.normandy.api_url", "");
pref("toolkit.telemetry.unified", false);
pref("toolkit.telemetry.enabled", false);
pref("toolkit.telemetry.server", "data:,");
pref("toolkit.telemetry.archive.enabled", false);
pref("toolkit.telemetry.newProfilePing.enabled", false);
pref("toolkit.telemetry.shutdownPingSender.enabled", false);
pref("toolkit.telemetry.updatePing.enabled", false);
pref("toolkit.telemetry.bhrPing.enabled", false);
pref("toolkit.telemetry.firstShutdownPing.enabled", false);
pref("toolkit.telemetry.coverage.opt-out", true);
pref("toolkit.coverage.opt-out", true);
pref("toolkit.coverage.endpoint.base", "");
pref("browser.discovery.enabled", false);
pref("breakpad.reportURL", "");
pref("browser.tabs.crashReporting.sendReport", false);
pref("browser.crashReports.unsubmittedCheck.enabled", false);
pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);
pref("browser.newtabpage.activity-stream.feeds.telemetry", false);
pref("browser.newtabpage.activity-stream.telemetry", false);
pref("extensions.abuseReport.enabled", false);
pref("corroborator.enabled", false)

// Disable Firefox-specifc menus and products
pref("browser.privatebrowsing.vpnpromourl", ""); // Mozilla VPN
pref("browser.messaging-system.whatsNewPanel.enabled", false); // What's New
pref("extensions.pocket.enabled", false); // Pocket Account
pref("extensions.pocket.api"," ");
pref("extensions.pocket.oAuthConsumerKey", " ");
pref("extensions.pocket.site", " ");
pref("identity.fxaccounts.enabled", false); // Firefox Accounts & Sync [FF60+] [RESTART]
pref("extensions.fxmonitor.enabled", false); // Firefox Monitor
pref("signon.management.page.breach-alerts.enabled", false); // Firefox Lockwise
pref("signon.management.page.breachAlertUrl", "");
// PREF: Disable Extension Recommendations (CFR: "Contextual Feature Recommender")
// [1] https://support.mozilla.org/en-US/kb/extension-recommendations
pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons", false);
pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features", false);
pref("extensions.htmlaboutaddons.recommendations.enabled", false);
pref("extensions.getAddons.showPane", false);

// Disable System Addon updates
pref("extensions.systemAddon.update.url", "");

/** HOMEPAGE ***/
pref("startup.homepage_override_url", "");
pref("startup.homepage_welcome_url", "");
pref("startup.homepage_welcome_url.additional", "");
pref("browser.aboutwelcome.enabled", false);

/** NEW TAB PAGE & ACTIVITY STREAM ***/
pref("browser.startup.page", 3);
pref("browser.library.activity-stream.enabled", false);
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
