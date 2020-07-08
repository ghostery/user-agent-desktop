/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var EXPORTED_SYMBOLS = ["SessionMigration"];

ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm", this);
ChromeUtils.import("resource://gre/modules/osfile.jsm", this);

ChromeUtils.defineModuleGetter(
  this,
  "E10SUtils",
  "resource://gre/modules/E10SUtils.jsm"
);

// An encoder to UTF-8.
XPCOMUtils.defineLazyGetter(this, "gEncoder", function() {
  return new TextEncoder();
});

// A decoder.
XPCOMUtils.defineLazyGetter(this, "gDecoder", function() {
  return new TextDecoder();
});

var SessionMigrationInternal = {
  /**
   * Convert the original session restore state into a minimal state. It will
   * only contain:
   * - open windows
   *   - with tabs
   *     - with history entries with only title, url, triggeringPrincipal
   *     - with pinned state
   *     - with tab group info (hidden + group id)
   *     - with selected tab info
   *   - with selected window info
   *
   * The complete state is then wrapped into the "about:welcomeback" page as
   * form field info to be restored when restoring the state.
   */
  convertState(aStateObj, aRestorePageURL) {
    let state = {
      selectedWindow: aStateObj.selectedWindow,
      _closedWindows: [],
    };
    state.windows = aStateObj.windows.map(function(oldWin) {
      var win = { extData: {} };
      // CLIQZ-SPECIAL: filter out all moz-extension URL before map,
      // we do not want any extension URLs to restore
      // win.tabs = oldWin.tabs.map(function(oldTab) {
      win.tabs = oldWin.tabs
      .filter(t => {
        let isWebExtURL = false;
        if (t.entries.length > 0) {
          const lastEntry = t.entries[t.entries.length - 1];
          if (lastEntry.url && lastEntry.url.startsWith("moz-extension")) {
            isWebExtURL = true;
          }
        }
        return !isWebExtURL;
      })
      .map(function(oldTab) {
        var tab = {};
        // Keep only titles, urls and triggeringPrincipals for history entries
        tab.entries = oldTab.entries.map(function(entry) {
          return {
            url: entry.url,
            triggeringPrincipal_base64: entry.triggeringPrincipal_base64,
            title: entry.title,
          };
        });
        tab.index = oldTab.index;
        tab.hidden = oldTab.hidden;
        tab.pinned = oldTab.pinned;
        return tab;
      });
      win.selected = oldWin.selected;
      win._closedTabs = [];
      return win;
    });
    let url = aRestorePageURL;
    let formdata = { id: { sessionData: state }, url };
    let entry = {
      url,
      triggeringPrincipal_base64: E10SUtils.SERIALIZED_SYSTEMPRINCIPAL,
    };
    return { windows: [{ tabs: [{ entries: [entry], formdata }] }] };
  },
  /**
   * Asynchronously read session restore state (JSON) from a path
   */
  readState(aPath) {
    return (async function() {
      let bytes = await OS.File.read(aPath, { compression: "lz4" });
      let text = gDecoder.decode(bytes);
      let state = JSON.parse(text);
      return state;
    })();
  },
  /**
   * Asynchronously write session restore state as JSON to a path
   */
  writeState(aPath, aState) {
    let bytes = gEncoder.encode(JSON.stringify(aState));
    return OS.File.writeAtomic(aPath, bytes, {
      tmpPath: aPath + ".tmp",
      compression: "lz4",
    });
  },
};

var SessionMigration = {
  /**
   * Migrate a limited set of session data from one path to another.
   */
  migrate(aFromPath, aToPath, aRestorePageURL) {
    return (async function() {
      let inState = await SessionMigrationInternal.readState(aFromPath);
      let outState =
          SessionMigrationInternal.convertState(inState, aRestorePageURL);
      // Unfortunately, we can't use SessionStore's own SessionFile to
      // write out the data because it has a dependency on the profile dir
      // being known. When the migration runs, there is no guarantee that
      // that's true.
      await SessionMigrationInternal.writeState(aToPath, outState);
    })();
  },
};
