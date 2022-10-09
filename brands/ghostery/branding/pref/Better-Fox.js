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
// Lazy session restore
pref("browser.sessionstore.restore_pinned_tabs_on_demand", true);

// JPEG XL
// [NIGHTLY]
pref("image.jxl.enabled", true);

// about:home startup cache
// [NIGHTLY]
pref("browser.startup.homepage.abouthome_cache.enabled", true);

// CSS Masonry
// [NIGHTLY]
pref("layout.css.grid-template-masonry-value.enabled", true);

// Prioritized Task Scheduling API
// [NIGHTLY]
pref("dom.enable_web_task_scheduling", true);

// OffscreenCanvas
// [NIGHTLY]
pref("gfx.offscreencanvas.enabled", true);

// CSS Font Loading API in workers
// [NIGHTLY]
pref("layout.css.font-loading-api.workers.enabled", true);

// Enable animation-composition
// [NIGHTLY]
pref("layout.css.animation-composition.enabled", true);

/****************************************************************************
 * SECTION: SECUREFOX                                                       *
****************************************************************************/
/** TRACKING PROTECTION ***/
// enable Query Stripping
// Ghostery doesn't do this natively
pref("privacy.query_stripping.enabled", true);
// We set the same query stripping list that Brave and LibreWolf uses:
// [1] https://gitlab.com/librewolf-community/settings/-/blob/master/librewolf.cfg#L80
pref("privacy.query_stripping.strip_list", "__hsfp __hssc __hstc __s _hsenc _openstat dclid fbclid gbraid gclid hsCtaTracking igshid mc_eid ml_subscriber ml_subscriber_hash msclkid oft_c oft_ck oft_d oft_id oft_ids oft_k oft_lk oft_sk oly_anon_id oly_enc_id rb_clickid s_cid twclid vero_conv vero_id wbraid wickedid yclid");

// Referer: ignore ‘unsafe-url’, ‘no-referrer-when-downgrade’ and ‘origin-when-cross-origin’ for cross-site requests
pref("network.http.referer.disallowCrossSiteRelaxingDefault.top_navigation", true);
// network paritioning: OCSP cache
pref("privacy.partition.network_state.ocsp_cache", true);
// enable APS (Always Partitioning Storage) [FF104+]
pref("privacy.partition.always_partition_third_party_non_cookie_storage", true);
pref("privacy.partition.always_partition_third_party_non_cookie_storage.exempt_sessionstorage", false);

// Smartblock
// Respect adblockers
// [1] https://support.mozilla.org/en-US/kb/smartblock-enhanced-tracking-protection
// [2] https://searchfox.org/mozilla-central/source/browser/extensions/webcompat/data/shims.js
pref("extensions.webcompat.enable_shims", true);

// Disable sending additional analytics to web servers
pref("beacon.enabled", false);

// Microphone and camera kill switch (#370)
// [NIGHTLY]
pref("privacy.webrtc.globalMuteToggles", true);

// Samesite Cookies
pref("network.cookie.sameSite.laxByDefault", true); // FF 105=false
pref("network.cookie.sameSite.noneRequiresSecure", true); // FF 105=false
//pref("network.cookie.sameSite.schemeful", true); // FF DEFAULT FF92+


/** OCSP & CERTS / HPKP ***/
// CRLite
// This will reduce the number of times an OCSP server needs to be contacted and therefore increase privacy.
pref("security.pki.crlite_mode", 2);
pref("security.remote_settings.crlite_filters.enabled", true);


/** TLS ***/
pref("security.ssl.treat_unsafe_negotiation_as_broken", true);
pref("browser.xul.error_pages.expert_bad_cert", true);
pref("security.tls.enable_0rtt_data", false);


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

// default 'Time range to clear' for 'Clear Recent History'.
// 0=everything, 1=last hour, 2=last two hours, 3=last four hours, 4=today
pref("privacy.sanitize.timeSpan", 0);


/** FONTS ***/
// limit font visibility (font fingerprinting)
// [1] https://searchfox.org/mozilla-central/search?path=StandardFonts*.inc
// 1=only base system fonts, 2=also fonts from optional language packs, 3=also user-installed fonts
pref("layout.css.font-visibility.private", 1); // Private Browsing windows
//pref("layout.css.font-visibility.standard", 1); // Normal Browsing windows with FF ETP disabled


/** DISK AVOIDANCE ***/
// disable media cache from writing to disk in Private Browsing
pref("browser.privatebrowsing.forceMediaMemoryCache", true);
pref("media.memory_cache_max_size", 65536); // 8x default size of 8192 [performance enhancement]

// disable storing extra session data
// Whether sites save extra session data such as form content, cookies and POST data
// 0=everywhere, 1=unencrypted sites, 2=nowhere
pref("browser.sessionstore.privacy_level", 2);
pref("browser.pagethumbnails.capturing_disabled", true);


/** SPECULATIVE CONNECTIONS ***/
// Network Predictor
// https://github.com/yokoffing/Better-Fox/blob/079be70df3e513507dc419c3cce1a413902ada13/SecureFox.js#L184-L195
pref("network.predictor.enabled", false);
pref("network.predictor.enable-prefetch", false);

// DNS pre-resolve <link rel="dns-prefetch">
// https://github.com/yokoffing/Better-Fox/blob/e9535084374c4f379bc20fda945b3236b7723c48/SecureFox.js#L201-L206
pref("network.dns.disablePrefetch", true);

// Preconnect to the autocomplete URL in the address bar
// https://github.com/yokoffing/Better-Fox/blob/079be70df3e513507dc419c3cce1a413902ada13/SecureFox.js#L209-L213
pref("browser.urlbar.speculativeConnect.enabled", false);
pref("browser.places.speculativeConnect.enabled", false);

// Link prefetching <link rel="prefetch">
// https://github.com/yokoffing/Better-Fox/blob/079be70df3e513507dc419c3cce1a413902ada13/SecureFox.js#L216-L225
pref("network.prefetch-next", false);

// Prefetch links upon hover 
// https://github.com/yokoffing/Better-Fox/blob/079be70df3e513507dc419c3cce1a413902ada13/SecureFox.js#L228-L235
pref("network.http.speculative-parallel-limit", 0);


/** SEARCH / URL BAR ***/
// Enable a seperate search engine for Private Windows
pref("browser.search.separatePrivateDefault", true);
pref("browser.search.separatePrivateDefault.ui.enabled", true);

// enable "Add" button under search engine menu
pref("browser.urlbar.update2.engineAliasRefresh", true);

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
pref("dom.security.https_only_mode", true);
pref("dom.security.https_only_mode_error_page_user_suggestions", true);


/** DNS-over-HTTPS (DOH) ***/
// DoH
// 0=off, 2=TRR preferred, 3=TRR only, 5=TRR disabled
pref("network.trr.mode", 0);
pref("network.dns.skipTRR-when-parental-control-enabled", false);


/** PASSWORDS AND AUTOFILL ***/
// disable formless login capture
// [1] https://bugzilla.mozilla.org/show_bug.cgi?id=1166947
pref("signon.formlessCapture.enabled", false);
// autofilling saved passwords on HTTP pages
pref("signon.autofillForms.http", false);
// disable capturing credentials in private browsing
pref("signon.privateBrowsingCapture.enabled", false);


/** MIXED CONTENT + CROSS-SITE ***/
// HTTP authentication credentials dialogs triggered by sub-resources
// 1=don't allow cross-origin sub-resources to open HTTP authentication credentials dialogs
pref("network.auth.subresource-http-auth-allow", 1);

// deny PDFs to load javascript
pref("pdfjs.enableScripting", false);

// 3rd party extension install prompts
pref("extensions.postDownloadThirdPartyPrompt", false);

// Applies to cross-origin geolocation, camera, mic and screen-sharing
// permissions, and fullscreen requests. Disabling delegation means any prompts
// for these will show/use their correct 3rd party origin.
// [1] https://groups.google.com/forum/#!topic/mozilla.dev.platform/BdFOMAuCGW8/discussion
pref("permissions.delegation.enabled", false);


/** HEADERS / REFERERS ***/
// Downgrade Cross-Origin Referers
// Control the amount of information to send.
// 0=send full URI (default), 1=scheme+host+port+path, 2=scheme+host+port
pref("network.http.referer.XOriginTrimmingPolicy", 2);


/** CONTAINERS ***/
// enable Containers UI
pref("privacy.userContext.ui.enabled", true);


/** WEBRTC ***/
// force WebRTC inside the proxy, if one is used
pref("media.peerconnection.ice.proxy_only_if_behind_proxy", true);
// when using a system-wide proxy, it uses the proxy interface
pref("media.peerconnection.ice.default_address_only", true);


/** GOOGLE SAFE BROWSING (GSB) ***/
// GSB checks for downloads (remote)
// To verify the safety of certain executable files, Firefox may submit some information about the
// file, including the name, origin, size and a cryptographic hash of the contents, to the Google
// Safe Browsing service which helps Firefox determine whether or not the file should be blocked.
pref("browser.safebrowsing.downloads.remote.enabled", false);


/** MOZILLA ***/
// SITE PERMISSIONS
// 0=always ask (default), 1=allow, 2=block
pref("permissions.default.desktop-notification", 2);

// GEOLOCATION
// Geolocation URL (see #187, #405)
//pref("geo.provider.network.url", "https://location.services.mozilla.com/v1/geolocate?key=%MOZILLA_API_KEY%");
//pref("geo.provider.ms-windows-location", false); // WINDOWS
//pref("geo.provider.use_corelocation", false); // MAC
//pref("geo.provider.use_gpsd", false); // LINUX
//pref("geo.provider.use_geoclue", false); // [FF102+] LINUX
//pref("browser.region.update.enabled", false);

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


/** URL BAR ***/
// Dropdown options in the URL bar
pref("browser.urlbar.suggest.bookmark", true);
pref("browser.urlbar.suggest.engines", false);
pref("browser.urlbar.suggest.history", true);
pref("browser.urlbar.suggest.openpage", false);
pref("browser.urlbar.suggest.searches", false);
pref("browser.urlbar.suggest.topsites", false);
// enable features in URL bar
pref("browser.urlbar.suggest.calculator", true);
pref("browser.urlbar.unitConversion.enabled", true);


/** DOWNLOADS ***/
// always ask where to download
// [SETTING] General>Downloads>Always ask you where to save files
pref("browser.download.useDownloadDir", false);
// enable user interaction for security by always asking how to handle new mimetypes
// [SETTING] General>Files and Applications>What should Firefox do with other files
pref("browser.download.always_ask_before_handling_new_types", true);


** PDF ***/
pref("pdfjs.annotationEditorEnabled", true);
pref("browser.download.open_pdf_attachments_inline", true);


// Show all matches in Findbar
pref("findbar.highlightAll", true);


/** TAB BEHAVIOR ***/
// Prevent scripts from moving and resizing open windows
pref("dom.disable_window_move_resize", true);

// load bookmarks in tabs
pref("browser.tabs.loadBookmarksInTabs", true);

// Prevent password truncation when submitting form data
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
