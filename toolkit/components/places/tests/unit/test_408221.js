/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim:set ts=2 sw=2 sts=2 et: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function AutoCompleteInput(aSearches) {
  this.searches = aSearches;
}
AutoCompleteInput.prototype = {
  constructor: AutoCompleteInput,

  searches: null,

  minResultsForPopup: 0,
  timeout: 10,
  searchParam: "",
  textValue: "",
  disableAutoComplete: false,
  completeDefaultIndex: false,

  get searchCount() {
    return this.searches.length;
  },

  getSearchAt(aIndex) {
    return this.searches[aIndex];
  },

  onSearchBegin() {},
  onSearchComplete() {},

  popupOpen: false,

  popup: {
    setSelectedIndex(aIndex) {},
    invalidate() {},

    // nsISupports implementation
    QueryInterface: ChromeUtils.generateQI(["nsIAutoCompletePopup"]),
  },

  // nsISupports implementation
  QueryInterface: ChromeUtils.generateQI(["nsIAutoCompleteInput"]),
};

// Get tagging service
try {
  var tagssvc = Cc["@mozilla.org/browser/tagging-service;1"].getService(
    Ci.nsITaggingService
  );
} catch (ex) {
  do_throw("Could not get tagging service\n");
}

function ensure_tag_results(uris, searchTerm) {
  var controller = Cc["@mozilla.org/autocomplete/controller;1"].getService(
    Ci.nsIAutoCompleteController
  );

  // Make an AutoCompleteInput that uses our searches
  // and confirms results on search complete
  var input = new AutoCompleteInput(["unifiedcomplete"]);

  controller.input = input;

  return new Promise(resolve => {
    var numSearchesStarted = 0;
    input.onSearchBegin = function() {
      numSearchesStarted++;
      Assert.equal(numSearchesStarted, 1);
    };

    input.onSearchComplete = function() {
      Assert.equal(numSearchesStarted, 1);
      Assert.equal(
        controller.searchStatus,
        Ci.nsIAutoCompleteController.STATUS_COMPLETE_MATCH
      );
      Assert.equal(controller.matchCount, uris.length);
      let vals = [];
      for (let i = 0; i < controller.matchCount; i++) {
        // Keep the URL for later because order of tag results is undefined
        vals.push(controller.getValueAt(i));
        Assert.equal(controller.getStyleAt(i), "bookmark-tag");
      }
      // Sort the results then check if we have the right items
      vals.sort().forEach((val, i) => Assert.equal(val, uris[i]));

      resolve();
    };

    controller.startSearch(searchTerm);
  });
}

const uri1 = "http://site.tld/1";
const uri2 = "http://site.tld/2";
const uri3 = "http://site.tld/3";
const uri4 = "http://site.tld/4";
const uri5 = "http://site.tld/5";
const uri6 = "http://site.tld/6";

/**
 * Properly tags a uri adding it to bookmarks.
 *
 * @param aURI
 *        The nsIURI to tag.
 * @param aTags
 *        The tags to add.
 */
async function tagURI(url, aTags) {
  await PlacesUtils.bookmarks.insert({
    parentGuid: PlacesUtils.bookmarks.unfiledGuid,
    title: "A title",
    url,
  });

  tagssvc.tagURI(uri(url), aTags);
}

/**
 * Test bug #408221
 */
add_task(async function test_tags_search_case_insensitivity() {
  // always search in history + bookmarks, no matter what the default is
  Services.prefs.setIntPref("browser.urlbar.search.sources", 3);
  Services.prefs.setIntPref("browser.urlbar.default.behavior", 0);

  await tagURI(uri1, ["Foo"]);
  await tagURI(uri2, ["FOO"]);
  await tagURI(uri3, ["foO"]);
  await tagURI(uri4, ["BAR"]);
  await tagURI(uri4, ["MUD"]);
  await tagURI(uri5, ["bar"]);
  await tagURI(uri5, ["mud"]);
  await tagURI(uri6, ["baR"]);
  await tagURI(uri6, ["muD"]);

  await ensure_tag_results([uri1, uri2, uri3], "foo");
  await ensure_tag_results([uri1, uri2, uri3], "Foo");
  await ensure_tag_results([uri1, uri2, uri3], "foO");
  await ensure_tag_results([uri4, uri5, uri6], "bar mud");
  await ensure_tag_results([uri4, uri5, uri6], "BAR MUD");
  await ensure_tag_results([uri4, uri5, uri6], "Bar Mud");
});
