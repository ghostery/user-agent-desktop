// Better-Fox community driven prefs
// https://github.com/yokoffing/Better-Fox
//
/****************************************************************************
 * Better-Fox.js                                                            *
 * "Non ducor duco"                                                         *
 * priority: establish defaults for mainstream users                        *
 * url: https://github.com/yokoffing/Better-Fox                             *
****************************************************************************/

/****************************************************************************
 * SECTION: FASTFOX                                                         *
****************************************************************************/

// Lazy Loading
pref("dom.image-lazy-loading.enabled", true);

// Lazy session restore
pref("browser.sessionstore.restore_tabs_lazily", true);
pref("browser.sessionstore.restore_on_demand", true);
pref("browser.sessionstore.restore_pinned_tabs_on_demand", true);

// skeleton UI
// [1] https://www.ghacks.net/2021/01/25/firefox-nightly-uses-a-new-skeleton-ui-on-start-on-windows/
pref("browser.startup.preXulSkeletonUI", false);

/****************************************************************************
 * SECTION: SECUREFOX                                                       *
****************************************************************************/

/** TRACKING PROTECTION ***/

// Disable Hyperlink Auditing (click tracking).
pref("browser.send_pings", false);
pref("browser.send_pings.require_same_host", true);

// Disable sending additional analytics to web servers
pref("beacon.enabled", false);

//  Disable Battery API as it's a common factor in fingerprinting
pref("dom.battery.enabled", false);

// CRLite
// This will reduce the number of times an OCSP server needs to be contacted and therefore increase privacy.
pref("security.pki.crlite_mode", 2);
pref("security.remote_settings.crlite_filters.enabled", true);

// Microphone and camera kill switch (#370) /* experimental */
pref("privacy.webrtc.globalMuteToggles", true);


/** STORAGE ***/

// Dynamic First-Party Isolation (dFPI)
// Tracker storage partitioning - currently undocumented setting to partition browser storage for trackers in 3rd party contexts.
// [1] https://bugzilla.mozilla.org/show_bug.cgi?id=1549587
pref("network.cookie.cookieBehavior", 5);

// Redirect tracking prevention + Purge site data of sites associated with tracking cookies automatically
pref("privacy.purge_trackers.enabled", true);

// Isolate cache per site
pref("browser.cache.cache_isolation", true);

// Network Partitioning
// Allows the browser to save resources like the cache, favicons, CSS files, images, and more
// on a per-website basis rather than together in the same pool.
pref("privacy.partition.network_state", true);

// Enable Local Storage Next Generation (LSNG) (DOMStorage) 
pref("dom.storage.next_gen", true);

// Samesite Cookies /* experimental */
pref("network.cookie.sameSite.laxByDefault", true);
pref("network.cookie.sameSite.noneRequiresSecure", true);
// pref("network.cookie.sameSite.schemeful", true); /* test in future builds */


/** CLEARING HISTORY DEFAULTS (MANUALLY) ***/

// Reset default items to clear with Ctrl-Shift-Del
// This dialog can also be accessed from the menu History>Clear Recent History
// Firefox remembers your last choices. This will reset them when you start Firefox.
pref("privacy.cpd.history", true); // Browsing & Download History
pref("privacy.cpd.formdata", true); // Form & Search History
pref("privacy.cpd.offlineApps", true); // Offline Website Data
pref("privacy.cpd.cache", true); // Cache
pref("privacy.cpd.cookies", true); // Cookies
pref("privacy.cpd.sessions", true); // Active Logins
pref("privacy.cpd.siteSettings", false); // Site Preferences
pref("privacy.sanitize.timeSpan", 0);

// Reset default 'Time range to clear' for 'Clear Recent History'.
// Firefox remembers your last choice. This will reset the value when you start Firefox.
// 0=everything, 1=last hour, 2=last two hours, 3=last four hours, 4=today
user_pref("privacy.sanitize.timeSpan", 0);


/*** PRELOADING ***/

// disable DNS prefetching
pref("network.dns.disablePrefetch", true);
pref("network.dns.disablePrefetchFromHTTPS", true); /* default */

// Preload the autocomplete URL in the address bar.
// Firefox preloads URLs that autocomplete when a user types into the address bar.
// NOTE: Firefox will do the server DNS lookup and TCP and TLS handshake but not start sending or receiving HTTP data.
pref("browser.urlbar.speculativeConnect.enabled", false);

// Link prefetching
// Along with the referral and URL-following implications, prefetching will generally cause the cookies of the prefetched
// site to be accessed. (For example, if you google Amazon, the Google results page will prefetch www.amazon.com, causing
// Amazon cookies to be sent back and forth.)
pref("network.prefetch-next", false);

// Link-mouseover opening connection to linked server.
// TCP and SSL handshakes are set up in advance but page contents are not downloaded until a click on the link is registered.
pref("network.http.speculative-parallel-limit", 6); /* default */

// Enable <link rel=preload>.
// Developer hints to the browser to preload some resources with a higher priority and in advance.
// Helps the web page to render and get into the stable and interactive state faster.
pref("network.preload", true); /* default */

// Network predictor
// Uses a local file to remember which resources were needed when the user visits a webpage (such as image.jpg and script.js),
// so that the next time the user mouseovers a link to that webpage, this history can be used to predict what resources will
// be needed rather than wait for the document to link those resources.
pref("network.predictor.enabled", true); /* default */
pref("network.predictor.enable-hover-on-ssl", true);
pref("network.predictor.enable-prefetch", false); /* default */

// New tab preload
pref("browser.newtab.preload", true); /* default */


/** SEARCH ***/

// Enable a seperate search engine for Private Windows
pref("browser.search.separatePrivateDefault", true);
pref("browser.search.separatePrivateDefault.ui.enabled", true);

// Live search engine suggestions (Google, Bing, etc.)
// Search engines keylog every character you type from the URL bar
pref("browser.search.suggest.enabled", false);
pref("browser.search.suggest.enabled.private", false);

// URL bar domain guessing
// Domain guessing intercepts DNS "hostname not found errors" and resends a
// request (e.g. by adding www or .com). This is inconsistent use (e.g. FQDNs), does not work
// via Proxy Servers (different error), is a flawed use of DNS (TLDs: why treat .com
// as the 411 for DNS errors?), privacy issues (why connect to sites you didn't
// intend to), can leak sensitive data (e.g. query strings: e.g. Princeton attack),
// and is a security risk (e.g. common typos & malicious sites set up to exploit this).
pref("browser.fixup.alternate.enabled", false);

// "Not Secure" text in the URL bar on HTTP sites.
pref("security.insecure_connection_text.enabled", true);
pref("security.insecure_connection_text.pbmode.enabled", true);

// Enforce Punycode for Internationalized Domain Names to eliminate possible spoofing
// Might be undesirable for non-latin alphabet users since legitimate IDN's are also punycoded.
// [TEST] https://www.xn--80ak6aa92e.com/ (www.apple.com)
pref("network.IDN_show_punycode", true);


/** HTTPS-ONLY MODE ***/

// HTTPS-only connections (#367)
pref("dom.security.https_only_mode", true);
pref("dom.security.https_only_mode_ever_enabled", true);

// HTTP background requests
// When attempting to upgrade, if the server doesn't respond within 3 seconds, Firefox
// sends HTTP requests in order to check if the server supports HTTPS or not.
// This is done to avoid waiting for a timeout which takes 90 seconds.
// [1] https://bugzilla.mozilla.org/buglist.cgi?bug_id=1642387,1660945
pref("dom.security.https_only_mode_send_http_background_request", false);

// HTTPS-Only mode for local resources
pref("dom.security.https_only_mode.upgrade_local", true);


/** DNS-over-HTTPS (DOH) ***/

// DoH
// 0=off, 2=TRR preferred, 3=TRR only, 5=TRR disabled
pref("network.trr.mode", 0); /* for now??? */
pref("network.trr.send_user-agent_headers", false); /* default */
pref("network.dns.skipTRR-when-parental-control-enabled", false);


/** PASSWORDS AND AUTOFILL ***/

// Autofilling saved passwords on HTTP pages
pref("signon.autofillForms.http", false);
// Show warning
pref("security.insecure_field_warning.contextual.enabled", true);
// Capturing credentials in private browsing
pref("signon.privateBrowsingCapture.enabled", false);


/** MIXED CONTENT + CROSS-SITE ***/

// HTTP authentication credentials dialogs triggered by sub-resources
// 0=don't allow sub-resources to open HTTP authentication credentials dialogs
// 1=don't allow cross-origin sub-resources to open HTTP authentication credentials dialogs
// 2=allow sub-resources to open HTTP authentication credentials dialogs (default)
pref("network.auth.subresource-http-auth-allow", 1);

// Block insecure active content (scripts) on HTTPS pages.
pref("security.mixed_content.block_active_content", true);
// Upgrade passive content to use HTTPS on secure pages.
pref("security.mixed_content.upgrade_display_content", true);
// Block unencrypted requests from Flash on encrypted pages to mitigate MitM attacks
pref("security.mixed_content.block_object_subrequest", true);
// Block insecure downloads from secure sites
pref("dom.block_download_insecure", true);

// 3rd party extension install prompts
// [1] https://bugzilla.mozilla.org/buglist.cgi?bug_id=1659530,1681331
pref("extensions.postDownloadThirdPartyPrompt", false);

// Permissions delegation
// Currently applies to cross-origin geolocation, camera, mic and screen-sharing
// permissions, and fullscreen requests. Disabling delegation means any prompts
// for these will show/use their correct 3rd party origin
pref("permissions.delegation.enabled", false);

// "window.name" protection
// If a new page from another domain is loaded into a tab, then window.name is set to an empty string. The original
// string is restored if the tab reverts back to the original page. This change prevents some cross-site attacks.
pref("privacy.window.name.update.enabled", true);

// Downgrade Cross-Origin Referers
// Control when to send a referer.
// 0=always (default), 1=only if base domains match, 2=only if hosts match
pref("network.http.referer.XOriginPolicy", 0); /* default */
// Control the amount of information to send.
// 0=send full URI (default), 1=scheme+host+port+path, 2=scheme+host+port
pref("network.http.referer.XOriginTrimmingPolicy", 2);


/** GOOGLE SAFE BROWSING (GSB) ***/

// GSB, master switch (see #38)
// Privacy & Security>Security>... "Block dangerous and deceptive content"
// pref("browser.safebrowsing.malware.enabled", false);
// pref("browser.safebrowsing.phishing.enabled", false);

// GSB checking downloads local + remote, master switch
// Privacy & Security>Security>... "Block dangerous downloads"
// pref("browser.safebrowsing.downloads.enabled", false);

// GSB checks for downloads (remote)
// To verify the safety of certain executable files, Firefox may submit some information about the
// file, including the name, origin, size and a cryptographic hash of the contents, to the Google
// Safe Browsing service which helps Firefox determine whether or not the file should be blocked.
pref("browser.safebrowsing.downloads.remote.enabled", false);

// Disable Google Safe Browsing checks for unwanted software
// Privacy & Security>Security>... "Warn you about unwanted and uncommon software"
// pref("browser.safebrowsing.downloads.remote.block_potentially_unwanted", false);
// pref("browser.safebrowsing.downloads.remote.block_uncommon", false);


/** MOZILLA ***/

// Geolocation URL (see #187, #405)
// pref("geo.provider.network.url", "https://location.services.mozilla.com/v1/geolocate?key=%MOZILLA_API_KEY%");
pref("geo.provider.network.logging.enabled", false);

// Enforce Firefox blocklist for extensions + no hiding tabs
// This includes updates for "revoked certificates".
pref("extensions.blocklist.enabled", true);
pref("extensions.webextensions.tabhide.enabled", false);


/****************************************************************************
 * SECTION: PESKYFOX                                                        *
****************************************************************************/

/** TAB WARNINGS ***/

pref("browser.tabs.warnOnClose", false);
pref("browser.tabs.warnOnCloseOtherTabs", false);
pref("browser.tabs.warnOnOpen", false);


/** FULLSCREEN ***/

// transition time (instant)
pref("full-screen-api.transition-duration.enter", "0 0");
pref("full-screen-api.transition-duration.leave", "0 0");
// fullscreen notice (disable)
pref("full-screen-api.warning.delay", -1);
pref("full-screen-api.warning.timeout", -1);


/** DOWNLOADS ***/

// always ask where to download
pref("browser.download.useDownloadDir", false);
// adding downloads to the system's "recent documents" list
pref("browser.download.manager.addToRecentDocs", false);
// hide mime types (Options>General>Applications) not associated with a plugin
pref("browser.download.hide_plugins_without_extensions", false);


/** VARIOUS ***/

// Dropdown options in the URL bar
pref("browser.urlbar.suggest.bookmark", true);
pref("browser.urlbar.suggest.engines", false);
pref("browser.urlbar.suggest.history", true);
pref("browser.urlbar.suggest.openpage", false);
pref("browser.urlbar.suggest.searches", false);
pref("browser.urlbar.suggest.topsites", false);

// Default permission for Notifications
// To add site exceptions: Page Info>Permissions>Receive Notifications.
// To manage site exceptions: Options>Privacy & Security>Permissions>Notifications>Settings.
// 0=always ask (default), 1=allow, 2=block
pref("permissions.default.desktop-notification", 2);

// Push API
// Push is an API that allows websites to send you (subscribed) messages even when the site
// isn't loaded, by pushing messages to your userAgentID through Mozilla's Push Server.
pref("dom.push.enabled", false);

// Autoplay
pref("media.block-autoplay-until-in-foreground", true);

// Disable ALT key toggling the menu bar
// default=18
pref("ui.key.menuAccessKey", 0);

// Show all matches in Findbar
pref("findbar.highlightAll", true);

// Spell-check
// 0=none, 1-multi-line, 2=multi-line & single-line
pref("layout.spellcheckDefault", 2);

// Limit the number of bookmark backups Firefox keeps
pref("browser.bookmarks.max_backups", 2);

// Hide image placeholders
pref("browser.display.show_image_placeholders", false);

// Text wrap
pref("view_source.wrap_long_lines", true);
pref("devtools.debugger.ui.editor-wrapping", true);


/** TAB BEHAVIOR ***/

// Open links targeting new windows in a new tab instead
// Pop-up windows are treated like regular tabs. You can still right-click
// a link and open in a new window
pref("browser.link.open_newwindow", 3);
pref("browser.link.open_newwindow.restriction", 0);

// Prevent scripts from moving and resizing open windows
pref("dom.disable_window_move_resize", true);

// Leave bookmarks menu open when selecting a site
pref("browser.bookmarks.openInTabClosesMenu", false);

// Load bookmarks in the background using Bookmarks Menu
pref("browser.tabs.loadBookmarksInBackground", true);
pref("browser.tabs.loadBookmarksInTabs", true);

// AVIF images
pref("image.avif.enabled", true);

// Prevent password truncation when submitting form data
// [1] https://www.ghacks.net/2020/05/18/firefox-77-wont-truncate-text-exceeding-max-length-to-address-password-pasting-issues/
pref("editor.truncate_user_pastes", false);

// Plain Text only when copying text
pref("clipboard.plainTextOnly", true);

// Limit events that can cause a pop-up
// Firefox provides an option to provide exceptions for sites, remembered in your Site Settings.
// (default) "change click dblclick auxclick mouseup pointerup notificationclick reset submit touchend contextmenu"
pref("dom.popup_allowed_events", "click dblclick");
pref("dom.disable_open_during_load", true);

/****************************************************************************
 * END: BETTERFOX                                                           *
****************************************************************************/
