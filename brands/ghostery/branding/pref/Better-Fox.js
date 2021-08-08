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
// Lazy session restore
pref("browser.sessionstore.restore_pinned_tabs_on_demand", true);

// skeleton UI
// [1] https://www.ghacks.net/2021/01/25/firefox-nightly-uses-a-new-skeleton-ui-on-start-on-windows/
pref("browser.startup.preXulSkeletonUI", false);

/****************************************************************************
 * SECTION: SECUREFOX                                                       *
****************************************************************************/

/** TRACKING PROTECTION ***/
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

// Site Isolation [aka Project Fission]
// Creates operating system process-level boundaries for all sites loaded in Firefox for Desktop. Isolating each site
// into a separate operating system process makes it harder for malicious sites to read another site’s secret or private data.
// [1] https://hacks.mozilla.org/2021/05/introducing-firefox-new-site-isolation-security-architecture/
pref("fission.autostart", true);

// State Paritioning [aka Dynamic First-Party Isolation (dFPI)]
// Firefox manages client-side state (i.e., data stored in the browser) to mitigate the ability of websites to abuse state
// for cross-site tracking. This effort aims to achieve that by providing what is effectively a "different", isolated storage
// location to every website a user visits.
// dFPI is a more web-compatible version of FPI, which double keys all third-party state by the origin of the top-level
// context. dFPI isolates user's browsing data for each top-level eTLD+1, but is flexible enough to apply web
// compatibility heuristics to address resulting breakage by dynamically modifying a frame's storage principal.
// dFPI isolates most sites while applying heuristics to allow sites through the isolation in certain circumstances for usability.
// [NOTE] dFPI partitions all of the following caches by the top-level site being visited: HTTP cache, image cache,
// favicon cache, HSTS cache, OCSP cache, style sheet cache, font cache, DNS cache, HTTP Authentication cache,
// Alt-Svc cache, and TLS certificate cache.
// [1] https://bugzilla.mozilla.org/show_bug.cgi?id=1549587
// [2] https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Privacy/State_Partitioning
// [3] https://blog.mozilla.org/security/2021/02/23/total-cookie-protection/
// [4] https://hacks.mozilla.org/2021/02/introducing-state-partitioning/
pref("network.cookie.cookieBehavior", 5);

// Network Partitioning /* default pref, but keeping here for reference */
// Networking-related APIs are not intended to be used for websites to store data, but they can be abused for
// cross-site tracking. Network APIs and caches are permanently partitioned by the top-level site.
// Network Partitioning (isolation) will allow Firefox to associate resources on a per-website basis rather than together
// in the same pool. This includes cache, favicons, CSS files, images, and even speculative connections. 
// [1] https://www.zdnet.com/article/firefox-to-ship-network-partitioning-as-a-new-anti-tracking-defense/
// [2] https://developer.mozilla.org/en-US/docs/Web/Privacy/State_Partitioning#network_partitioning
// [3] https://blog.mozilla.org/security/2021/01/26/supercookie-protections/
pref("privacy.partition.network_state", true);

// Redirect Tracking Prevention /* default pref, but keeping here for reference */
// All storage is cleared (more or less) daily from origins that are known trackers and that
// haven’t received a top-level user interaction (including scroll) within the last 45 days.
// [1] https://www.ghacks.net/2020/08/06/how-to-enable-redirect-tracking-in-firefox/
// [2] https://www.cookiestatus.com/firefox/#other-first-party-storage
// [3] https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Privacy/Redirect_tracking_protection
// [4] https://www.ghacks.net/2020/03/04/firefox-75-will-purge-site-data-if-associated-with-tracking-cookies/
// [5] https://github.com/arkenfox/user.js/issues/1089
pref("privacy.purge_trackers.enabled", true);

// Enable Local Storage Next Generation (LSNG) (DOMStorage) 
pref("dom.storage.next_gen", true);

// Samesite Cookies /* experimental */
pref("network.cookie.sameSite.laxByDefault", true);
pref("network.cookie.sameSite.noneRequiresSecure", true);
// pref("network.cookie.sameSite.schemeful", true);


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
pref("privacy.sanitize.timeSpan", 0);


/** SPECULATIVE CONNECTIONS ***/
// [NOTE] Firefox 85+ partitions (isolates) pooled connections, prefetch connections, pre-connect connections,
// speculative connections, TLS session identifiers, and other connections. We can take advantage of the speed of
// pre-connections while preserving privacy. Users may harden these settings to their preference.
// For more information, see "State Paritioning" and "Network Partitioning".

// Network Predictor
// Keeps track of components that were loaded during page visits so that the browser knows next time
// which resources to request from the server: It uses a local file to remember which resources were
// needed when the user visits a webpage (such as image.jpg and script.js), so that the next time the
// user mouseovers a link to that webpage, this history can be used to predict what resources will
// be needed rather than wait for the document to link those resources.
// [NOTE] DNS pre-resolve and TCP preconnect (which includes SSL handshake). Honors settings in Private Browsing to erase data.
// [1] https://wiki.mozilla.org/Privacy/Reviews/Necko
// [2] https://www.ghacks.net/2014/05/11/seer-disable-firefox/
// [3] https://github.com/dillbyrne/random-agent-spoofer/issues/238#issuecomment-110214518
// [4] https://www.igvita.com/posa/high-performance-networking-in-google-chrome/#predictor
pref("network.predictor.enabled", true); // default
// Fetch critical resources on the page ahead of time as determined by the local file, to accelerate rendering of the page.
pref("network.predictor.enable-hover-on-ssl", true);
pref("network.predictor.enable-prefetch", true);

// DNS pre-resolve <link rel="dns-prefetch">
// Resolve hostnames ahead of time, to avoid DNS latency.
// [1] https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
// [2] https://css-tricks.com/prefetching-preloading-prebrowsing/#dns-prefetching
// [3] http://www.mecs-press.org/ijieeb/ijieeb-v7-n5/IJIEEB-V7-N5-2.pdf
pref("network.dns.disablePrefetch", true);
pref("network.dns.disablePrefetchFromHTTPS", false);

// Preconnect to the autocomplete URL in the address bar
// Firefox preloads URLs that autocomplete when a user types into the address bar.
// Connects to destination server ahead of time, to avoid TCP handshake latency.
// [NOTE] Firefox will perform DNS lookup and TCP and TLS handshake, but will not start sending or receiving HTTP data.
// [1] https://www.ghacks.net/2017/07/24/disable-preloading-firefox-autocomplete-urls/
pref("browser.urlbar.speculativeConnect.enabled", true); // default

// Link prefetching <link rel="prefetch">
// Fetch critical resources on the page ahead of time, to accelerate rendering of the page.
// Websites can provide Firefox with hints as to which page is likely the be accessed next so that it is downloaded right away,
// even if you don't request that link. The prefetch resource hint tells the browser to go grab a resource even though it
// hasn’t been requested by the current page, and puts it into cache. Firefox will request the resource at a low
// priority and only during idle time so that the resource doesn’t compete with anything needed for the current navigation.
// When the user clicks on a link, or initiates any kind of page load, link prefetching will stop and any prefetch hints will be discarded.
// [1] https://developer.mozilla.org/en-US/docs/Web/HTTP/Link_prefetching_FAQ#Privacy_implications
// [2] http://www.mecs-press.org/ijieeb/ijieeb-v7-n5/IJIEEB-V7-N5-2.pdf
// [3] https://timkadlec.com/remembers/2020-06-17-prefetching-at-this-age/
pref("network.prefetch-next", true); // default

// Prefetch links upon hover
// When you hover over links, connections are established to linked domains and servers automatically to speed up the loading
// process should you click on the link. To improve the loading speed, Firefox will open predictive connections to sites when
// the user hovers their mouse over. In case the user follows through with the action, the page can begin loading faster since
// some of the work was already started in advance.
// [NOTE] TCP and SSL handshakes are set up in advance but page contents are not downloaded until a click on the link is registered.
// [1] https://news.slashdot.org/story/15/08/14/2321202/how-to-quash-firefoxs-silent-requests
// [2] https://www.ghacks.net/2015/08/16/block-firefox-from-connecting-to-sites-when-you-hover-over-links
pref("network.http.speculative-parallel-limit", 6); // default

// Preload <link rel=preload>
// Fetch the entire page with all of its resources ahead of time, to enable instant navigation when triggered by the user.
// Allows developers to hint to the browser to preload some resources with a higher priority and in advance, which helps the web page to
// render and get into the stable and interactive state faster. This spec assumes that sometimes it’s best to always download an asset,
// regardless of whether the browser thinks that’s a good idea or not(!). Unlike prefetching assets, which can be ignored, preloading assets
// must be requested by the browser.
// [WARNING] Interferes with content blocking extensions, even if you utilize DNS-level blocking as well. Disable this!
// [NOTE] Revisit and test to see if we can enable this in future builds.
// [1] https://www.janbambas.cz/firefox-enables-link-rel-preload-support/
// [2] https://bugzilla.mozilla.org/show_bug.cgi?id=1639607
// [3] https://css-tricks.com/prefetching-preloading-prebrowsing/#future-option-preloading
pref("network.preload", false);

// New tab preload
// [WARNING] Disabling this causes a delay when opening a new tab in Firefox.
// [NOTE] Not sure if this affects Ghostery since we use an extension for the New Tab page. Needs testing.
// [1] https://wiki.mozilla.org/Tiles/Technical_Documentation#Ping
// [2] https://gecko.readthedocs.org/en/latest/browser/browser/DirectoryLinksProvider.html#browser-newtabpage-directory-source
// [3] https://gecko.readthedocs.org/en/latest/browser/browser/DirectoryLinksProvider.html#browser-newtabpage-directory-ping
pref("browser.newtab.preload", true); // default


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

// Upgrade passive content to use HTTPS on secure pages.
pref("security.mixed_content.upgrade_display_content", true);
// Block unencrypted requests from Flash on encrypted pages to mitigate MitM attacks
pref("security.mixed_content.block_object_subrequest", true);
// Block insecure downloads from secure sites
pref("dom.block_download_insecure", true);

// 3rd party extension install prompts
// [1] https://bugzilla.mozilla.org/buglist.cgi?bug_id=1659530,1681331
pref("extensions.postDownloadThirdPartyPrompt", false);

// Downgrade Cross-Origin Referers
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
pref("full-screen-api.warning.delay", 0);
pref("full-screen-api.warning.timeout", 0);


/** DOWNLOADS ***/
// always ask where to download
pref("browser.download.useDownloadDir", false);


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

// Show all matches in Findbar
pref("findbar.highlightAll", true);

// Hide image placeholders
pref("browser.display.show_image_placeholders", false);


/** TAB BEHAVIOR ***/
// Prevent scripts from moving and resizing open windows
pref("dom.disable_window_move_resize", true);

// Hide bookmarks toolbar from new tab page (#473)
pref("browser.toolbars.bookmarks.visibility", "never");

// Prevent password truncation when submitting form data
// [1] https://www.ghacks.net/2020/05/18/firefox-77-wont-truncate-text-exceeding-max-length-to-address-password-pasting-issues/
pref("editor.truncate_user_pastes", false);

// Plain Text only when copying text
pref("clipboard.plainTextOnly", true);

// Limit events that can cause a pop-up
// Firefox provides an option to provide exceptions for sites, remembered in your Site Settings.
// (default) "change click dblclick auxclick mouseup pointerup notificationclick reset submit touchend contextmenu"
pref("dom.popup_allowed_events", "click dblclick mousedown pointerdown");

/****************************************************************************
 * END: BETTERFOX                                                           *
****************************************************************************/
