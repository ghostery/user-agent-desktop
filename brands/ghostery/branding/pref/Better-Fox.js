// Better-fox community driven prefs
// https://github.com/yokoffing/Better-Fox
//
/****************************************************************************
 * Better-Fox.js                                                            *
 * "Non ducor duco"                                                         *
 * priority: establish defaults for mainstream users                        *
 * version: 10 February 2021                                                *
 * url: https://github.com/yokoffing/Better-Fox                             *
****************************************************************************/

/****************************************************************************
 * SECTION: FASTFOX                                                         *
****************************************************************************/
// pref("gfx.webrender.all", true);
// pref("javascript.options.warp", true); /* removed from FF */
pref("dom.image-lazy-loading.enabled", true);
pref("browser.sessionstore.restore_tabs_lazily", true);
pref("browser.sessionstore.restore_on_demand", true);
pref("browser.sessionstore.restore_pinned_tabs_on_demand", true);
pref("browser.startup.preXulSkeletonUI", false);

/****************************************************************************
 * SECTION: SECUREFOX                                                       *
****************************************************************************/

/** TRACKING PROTECTION ***/
// pref("browser.contentblocking.category", "custom");
// pref("privacy.trackingprotection.enabled", true);
// pref("privacy.trackingprotection.pbmode.enabled", true);
// pref("privacy.trackingprotection.cryptomining.enabled", true);
// pref("privacy.trackingprotection.fingerprinting.enabled", true);
// pref("privacy.trackingprotection.socialtracking.enabled", true);
// pref("urlclassifier.trackingSkipURLs", "*.twitter.com, *.twimg.com");
// pref("urlclassifier.features.socialtracking.skipURLs", "*.instagram.com, *.twitter.com, *.twimg.com");
pref("browser.send_pings", false);
pref("browser.send_pings.require_same_host", true);
pref("beacon.enabled", false);
pref("dom.battery.enabled", false);
pref("security.pki.crlite_mode", 2);
pref("security.remote_settings.crlite_filters.enabled", true);

/** STORAGE ***/
pref("network.cookie.cookieBehavior", 5);
pref("privacy.purge_trackers.enabled", true);
pref("browser.cache.cache_isolation", true);
pref("browser.cache.disk.enable", true);
pref("browser.cache.offline.enable", true);
// pref("browser.cache.offline.storage.enable", false);
pref("privacy.partition.network_state", true);
pref("dom.storage.next_gen", true);

/** CLEARING HISTORY DEFAULTS (MANUALLY) ***/
pref("privacy.cpd.history", true);
pref("privacy.cpd.formdata", true);
pref("privacy.cpd.offlineApps", true);
pref("privacy.cpd.cache", true);
pref("privacy.cpd.cookies", true);
pref("privacy.cpd.sessions", true);
pref("privacy.cpd.siteSettings", false);
pref("privacy.sanitize.timeSpan", 0);

/*** PRELOADING ***/
pref("network.dns.disablePrefetch", true);
pref("network.dns.disablePrefetchFromHTTPS", true);
pref("browser.urlbar.speculativeConnect.enabled", false);
pref("network.prefetch-next", false);
pref("network.http.speculative-parallel-limit", 6);
pref("network.preload", true);
pref("network.predictor.enabled", true);
pref("network.predictor.enable-hover-on-ssl", true);
pref("network.predictor.enable-prefetch", false);
pref("browser.newtab.preload", true);

/** SEARCH ***/
pref("browser.search.separatePrivateDefault", true);
pref("browser.search.separatePrivateDefault.ui.enabled", true);
pref("browser.search.suggest.enabled", false);
pref("browser.search.suggest.enabled.private", false);
pref("browser.fixup.alternate.enabled", false);
pref("security.insecure_connection_text.enabled", true);
pref("security.insecure_connection_text.pbmode.enabled", true);
pref("network.IDN_show_punycode", true);

/** HTTPS-ONLY MODE ***/
pref("dom.security.https_only_mode", true);
pref("dom.security.https_only_mode_ever_enabled", true);
pref("dom.security.https_only_mode_send_http_background_request", false);
pref("dom.security.https_only_mode.upgrade_local", true);

/** DNS-over-HTTPS (DOH) ***/
pref("network.trr.send_user-agent_headers", false);
pref("network.dns.skipTRR-when-parental-control-enabled", false);

/** PASSWORDS AND AUTOFILL ***/
pref("signon.autofillForms.http", false);
pref("security.insecure_field_warning.contextual.enabled", true);
pref("signon.privateBrowsingCapture.enabled", false);
/* NOTE: Remove everything below this line if you use Firefox's password manager */
// pref("signon.management.page.breach-alerts.enabled", false); 
// pref("signon.management.page.breachAlertUrl", "");
// pref("browser.contentblocking.report.lockwise.enabled", false);
// pref("browser.contentblocking.report.lockwise.how_it_works.url", "");
// pref("signon.rememberSignons", false);
// pref("signon.rememberSignons.visibilityToggle", false);
// pref("signon.schemeUpgrades", false);
// pref("signon.showAutoCompleteFooter", false);
// pref("signon.autologin.proxy", false);
// pref("signon.debug", false);
// pref("signon.generation.available", false);
// pref("signon.generation.enabled", false);
// pref("signon.management.page.fileImport.enabled", false);
// pref("signon.importedFromSqlite", false);
// pref("signon.recipes.path", "");
// pref("signon.autofillForms", false);
// pref("signon.autofillForms.autocompleteOff", true);
// pref("signon.showAutoCompleteOrigins", false);
// pref("signon.storeWhenAutocompleteOff", false);
// pref("signon.formlessCapture.enabled", false);
// pref("extensions.fxmonitor.enabled", false);

/** ADDRESS + CREDIT CARD MANAGER ***/
/* NOTE: Remove everything below this line if you use this feature */
// pref("extensions.formautofill.addresses.enabled", false);
// pref("extensions.formautofill.available", "off");
// pref("extensions.formautofill.creditCards.available", false);
// pref("extensions.formautofill.creditCards.enabled", false);
// pref("extensions.formautofill.heuristics.enabled", false);
// pref("browser.formfill.enable", false);

/** MIXED CONTENT + CROSS-SITE ***/
pref("network.auth.subresource-http-auth-allow", 1);
pref("security.mixed_content.block_active_content", true);
pref("security.mixed_content.upgrade_display_content", true);
pref("security.mixed_content.block_object_subrequest", true);
pref("dom.block_download_insecure", true);
pref("extensions.postDownloadThirdPartyPrompt", false);
pref("permissions.delegation.enabled", false);
pref("security.tls.version.enable-deprecated", false);
pref("dom.targetBlankNoOpener.enabled", true);
pref("privacy.window.name.update.enabled", true);
pref("network.http.referer.XOriginPolicy", 0);
pref("network.http.referer.XOriginTrimmingPolicy", 2);

/** GOOGLE SAFE BROWSING ***/
pref("browser.safebrowsing.downloads.remote.enabled", false);
// pref("browser.safebrowsing.downloads.remote.url", "");
/* WARNING: Be sure to have alternate security measures if you disable Safe Browsing! */
/* NOTE: Remove everything below this line if you use this feature */
// pref("browser.safebrowsing.malware.enabled", false);
// pref("browser.safebrowsing.phishing.enabled", false);
// pref("browser.safebrowsing.downloads.enabled", false);
// pref("browser.safebrowsing.downloads.remote.block_potentially_unwanted", false);
// pref("browser.safebrowsing.downloads.remote.block_uncommon", false);

/** MOZILLA ***/
// pref("geo.provider.network.url", "https://location.services.mozilla.com/v1/geolocate?key=%MOZILLA_API_KEY%");
pref("geo.provider.network.logging.enabled", false);
pref("extensions.blocklist.enabled", true);
pref("extensions.webextensions.tabhide.enabled", false);

/** TELEMETRY ***/
// pref("datareporting.policy.dataSubmissionEnabled", false);
// pref("datareporting.healthreport.uploadEnabled", false);
// pref("browser.ping-centre.telemetry", false);
// pref("default-browser-agent.enabled", false);
// pref("app.shield.optoutstudies.enabled", false);
// pref("app.normandy.enabled", false);
// pref("app.normandy.api_url", "");
// pref("toolkit.telemetry.unified", false);
// pref("toolkit.telemetry.enabled", false);
// pref("toolkit.telemetry.archive.enabled", false);
// pref("toolkit.telemetry.newProfilePing.enabled", false);
// pref("toolkit.telemetry.shutdownPingSender.enabled", false);
// pref("toolkit.telemetry.updatePing.enabled", false);
// pref("toolkit.telemetry.bhrPing.enabled", false);
// pref("toolkit.telemetry.firstShutdownPing.enabled", false);
// pref("toolkit.telemetry.coverage.opt-out", true);
// pref("toolkit.coverage.endpoint.base", "");
// pref("browser.discovery.enabled", false);
// pref("breakpad.reportURL", "");
// pref("browser.tabs.crashReporting.sendReport", false);
// pref("browser.crashReports.unsubmittedCheck.enabled", false);
// pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);
// pref("browser.newtabpage.activity-stream.feeds.telemetry", false);
// pref("browser.newtabpage.activity-stream.telemetry", false);
// pref("extensions.abuseReport.enabled", false);
// pref("corroborator.enabled", false)

/****************************************************************************
 * SECTION: PESKYFOX                                                        *
****************************************************************************/

/** MOZILLA UI ***/
// pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
// pref("browser.privatebrowsing.vpnpromourl", "");
// pref("extensions.getAddons.showPane", false);
// pref("extensions.htmlaboutaddons.recommendations.enabled", false);
// pref("browser.shell.checkDefaultBrowser", false);
// pref("identity.fxaccounts.enabled", false);
// pref("browser.aboutwelcome.enabled", false);
// pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons", false);
// pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features", false);
// pref("security.dialog_enable_delay", 0);
// pref("extensions.webextensions.restrictedDomains", "accounts-static.cdn.mozilla.net,accounts.firefox.com,addons.cdn.mozilla.net,api.accounts.firefox.com,content.cdn.mozilla.net,discovery.addons.mozilla.org,install.mozilla.org,oauth.accounts.firefox.com,profile.accounts.firefox.com,support.mozilla.org,sync.services.mozilla.com");

/** WARNINGS ***/
pref("browser.tabs.warnOnClose", false);
pref("browser.tabs.warnOnCloseOtherTabs", false);
pref("browser.tabs.warnOnOpen", false);
pref("browser.aboutConfig.showWarning", false);

/** FULLSCREEN ***/
pref("full-screen-api.transition-duration.enter", "0 0");
pref("full-screen-api.transition-duration.leave", "0 0");
pref("full-screen-api.warning.delay", -1);
pref("full-screen-api.warning.timeout", -1);

/** NEW TAB PAGE ***/
pref("browser.startup.page", 3);
// pref("browser.library.activity-stream.enabled", false);
// pref("browser.newtabpage.activity-stream.discoverystream.enabled", false);
// pref("browser.newtabpage.activity-stream.showSponsored", false);
// pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
// pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);
// pref("browser.newtabpage.activity-stream.feeds.topsites", false);
// pref("browser.newtabpage.activity-stream.feeds.snippets", false);
// pref("browser.newtabpage.activity-stream.feeds.section.highlights", false);
// pref("browser.newtabpage.activity-stream.section.highlights.includeBookmarks", false);
// pref("browser.newtabpage.activity-stream.section.highlights.includeDownloads", false);
// pref("browser.newtabpage.activity-stream.section.highlights.includePocket", false);
// pref("browser.newtabpage.activity-stream.section.highlights.includeVisited", false);
// pref("browser.messaging-system.whatsNewPanel.enabled", false);

/*** POCKET ***/
// pref("extensions.pocket.enabled", false);
// pref("extensions.pocket.api"," ");
// pref("extensions.pocket.oAuthConsumerKey", " ");
// pref("extensions.pocket.site", " ");

/** DOWNLOADS ***/
pref("browser.download.useDownloadDir", false);
pref("browser.download.manager.addToRecentDocs", false);
pref("browser.download.hide_plugins_without_extensions", false);

/** VARIOUS ***/
pref("browser.tabs.unloadOnLowMemory", false);
pref("browser.urlbar.suggest.bookmark", true);
pref("browser.urlbar.suggest.engines", false);
pref("browser.urlbar.suggest.history", true);
pref("browser.urlbar.suggest.openpage", false);
pref("browser.urlbar.suggest.searches", false);
pref("browser.urlbar.suggest.topsites", false);
pref("permissions.default.desktop-notification", 2);
pref("dom.push.enabled", false);
// pref("dom.push.userAgentID", "");
pref("media.autoplay.default", 1);
pref("media.block-autoplay-until-in-foreground", true);
pref("browser.backspace_action", 2);
pref("ui.key.menuAccessKey", 0);
pref("findbar.highlightAll", true);
pref("layout.spellcheckDefault", 2);
// pref("accessibility.force_disabled", 1);
pref("browser.bookmarks.max_backups", 2);
pref("browser.display.show_image_placeholders", false);
pref("view_source.wrap_long_lines", true);
pref("devtools.debugger.ui.editor-wrapping", true);

/** PDF ***/
pref("pdfjs.disabled", false);
pref("browser.helperApps.showOpenOptionForPdfJS", true);
pref("pdfjs.defaultZoomValue", "page-width");

/** TAB BEHAVIOR ***/
pref("browser.link.open_newwindow", 3);
pref("browser.link.open_newwindow.restriction", 0);
pref("dom.disable_window_move_resize", true);
pref("browser.tabs.closeWindowWithLastTab", false);
pref("browser.bookmarks.openInTabClosesMenu", false);
pref("browser.tabs.loadBookmarksInBackground", true);
pref("browser.tabs.loadBookmarksInTabs", true);
pref("image.avif.enabled", true);
pref("editor.truncate_user_pastes", false);
pref("clipboard.plainTextOnly", true);
pref("dom.popup_allowed_events", "click dblclick");
pref("dom.disable_open_during_load", true);
pref("privacy.popups.showBrowserMessage", true);

/****************************************************************************
 * END: BETTERFOX                                                           *
****************************************************************************/
