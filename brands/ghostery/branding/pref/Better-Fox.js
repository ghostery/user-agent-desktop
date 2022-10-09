// Better-Fox community driven prefs
// https://github.com/yokoffing/Betterfox
//
/****************************************************************************
 * Betterfox.js                                                             *
 * "Non ducor duco"                                                         *
 * priority: establish defaults for mainstream users                        *
 * url: https://github.com/yokoffing/Betterfox                              *
****************************************************************************/

/****************************************************************************
 * SECTION: FASTFOX                                                         *
****************************************************************************/
// JPEG XL
// [EXPERIMENTAL]
pref("image.jxl.enabled", true);

// Lazy session restore
pref("browser.sessionstore.restore_pinned_tabs_on_demand", true);

// about:home startup cache
pref("browser.startup.homepage.abouthome_cache.enabled", true);

// CSS Masonry
// [EXPERIMENTAL]
pref("layout.css.grid-template-masonry-value.enabled", true);

/****************************************************************************
 * SECTION: SECUREFOX                                                       *
****************************************************************************/
/** TRACKING PROTECTION ***/
// Disable sending additional analytics to web servers
pref("beacon.enabled", false);

// CRLite
// This will reduce the number of times an OCSP server needs to be contacted and therefore increase privacy.
pref("security.pki.crlite_mode", 2);
pref("security.remote_settings.crlite_filters.enabled", true);

// Microphone and camera kill switch (#370)
// [EXPERIMENTAL]
pref("privacy.webrtc.globalMuteToggles", true);

// Redirect Tracking Prevention
// Doesn't due anything since Dawn disables FF ETP
// https://github.com/yokoffing/Better-Fox/blob/77128d3d49ba371cb428209c053c35135ba3e4b8/SecureFox.js#L79-L86
pref("privacy.purge_trackers.enabled", false);

// Samesite Cookies
pref("network.cookie.sameSite.laxByDefault", true); // FF 105=false
pref("network.cookie.sameSite.noneRequiresSecure", true); // FF 105=false
pref("network.cookie.sameSite.schemeful", true);


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
// Reset default 'Time range to clear' for 'Clear Recent History'.
// Firefox remembers your last choice. This will reset the value when you start Firefox.
// 0=everything, 1=last hour, 2=last two hours, 3=last four hours, 4=today
pref("privacy.sanitize.timeSpan", 0);


/** SPECULATIVE CONNECTIONS ***/
// Network Predictor
// https://github.com/yokoffing/Better-Fox/blob/079be70df3e513507dc419c3cce1a413902ada13/SecureFox.js#L184-L195
pref("network.predictor.enabled", false);

// DNS pre-resolve <link rel="dns-prefetch">
// https://github.com/yokoffing/Better-Fox/blob/e9535084374c4f379bc20fda945b3236b7723c48/SecureFox.js#L201-L206
pref("network.dns.disablePrefetch", true);

// Preconnect to the autocomplete URL in the address bar
// https://github.com/yokoffing/Better-Fox/blob/079be70df3e513507dc419c3cce1a413902ada13/SecureFox.js#L209-L213
pref("browser.urlbar.speculativeConnect.enabled", false);

// Link prefetching <link rel="prefetch">
// https://github.com/yokoffing/Better-Fox/blob/079be70df3e513507dc419c3cce1a413902ada13/SecureFox.js#L216-L225
pref("network.prefetch-next", false);

// Prefetch links upon hover 
// https://github.com/yokoffing/Better-Fox/blob/079be70df3e513507dc419c3cce1a413902ada13/SecureFox.js#L228-L235
pref("network.http.speculative-parallel-limit", 0);


/** SEARCH ***/
// Enable a seperate search engine for Private Windows
pref("browser.search.separatePrivateDefault", true);
pref("browser.search.separatePrivateDefault.ui.enabled", true);

// Live search engine suggestions (Google, Bing, etc.)
// Search engines keylog every character you type from the URL bar
pref("browser.search.suggest.enabled", false);

// URL bar domain guessing
// https://github.com/yokoffing/Better-Fox/blob/079be70df3e513507dc419c3cce1a413902ada13/SecureFox.js#L276-L281
pref("browser.fixup.alternate.enabled", false);

// Enforce Punycode for Internationalized Domain Names to eliminate possible spoofing
// https://github.com/yokoffing/Better-Fox/blob/b713c0662f01aa2fe81fb1e2cfb8e41c24e5d293/SecureFox.js#L293-L300
pref("network.IDN_show_punycode", true);


/** HTTPS-ONLY MODE ***/
// HTTPS-only connections (#367)
// Enable HTTPS-only Mode
// add pref HERE


/** DNS-over-HTTPS (DOH) ***/
// DoH
// 0=off, 2=TRR preferred, 3=TRR only, 5=TRR disabled
pref("network.trr.mode", 0);
pref("network.dns.skipTRR-when-parental-control-enabled", false);


/** PASSWORDS AND AUTOFILL ***/
// Autofilling saved passwords on HTTP pages
pref("signon.autofillForms.http", false);
// Capturing credentials in private browsing
pref("signon.privateBrowsingCapture.enabled", false);


/** MIXED CONTENT + CROSS-SITE ***/
// HTTP authentication credentials dialogs triggered by sub-resources
// 0=don't allow sub-resources to open HTTP authentication credentials dialogs
// 1=don't allow cross-origin sub-resources to open HTTP authentication credentials dialogs
// 2=allow sub-resources to open HTTP authentication credentials dialogs (default)
pref("network.auth.subresource-http-auth-allow", 1);

// 3rd party extension install prompts
// [1] https://bugzilla.mozilla.org/buglist.cgi?bug_id=1659530,1681331
pref("extensions.postDownloadThirdPartyPrompt", false);

// Downgrade Cross-Origin Referers
// Control the amount of information to send.
// 0=send full URI (default), 1=scheme+host+port+path, 2=scheme+host+port
pref("network.http.referer.XOriginTrimmingPolicy", 2);


/** GOOGLE SAFE BROWSING (GSB) ***/
// GSB checks for downloads (remote)
// To verify the safety of certain executable files, Firefox may submit some information about the
// file, including the name, origin, size and a cryptographic hash of the contents, to the Google
// Safe Browsing service which helps Firefox determine whether or not the file should be blocked.
pref("browser.safebrowsing.downloads.remote.enabled", false);


/** MOZILLA ***/
// Geolocation URL (see #187, #405)
// pref("geo.provider.network.url", "https://location.services.mozilla.com/v1/geolocate?key=%MOZILLA_API_KEY%");
pref("geo.provider.network.logging.enabled", false);


/****************************************************************************
 * SECTION: PESKYFOX                                                        *
****************************************************************************/
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

// Show all matches in Findbar
pref("findbar.highlightAll", true);

/** TAB BEHAVIOR ***/
// Prevent scripts from moving and resizing open windows
pref("dom.disable_window_move_resize", true);

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
