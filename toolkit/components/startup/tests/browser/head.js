/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

function whenBrowserLoaded(browser, callback) {
  return BrowserTestUtils.browserLoaded(browser).then(callback);
}

function waitForOnBeforeUnloadDialog(browser, callback) {
  browser.addEventListener(
    "DOMWillOpenModalDialog",
    function onModalDialog(event) {
      if (Cu.isCrossProcessWrapper(event.target)) {
        // This event fires in both the content and chrome processes. We
        // want to ignore the one in the content process.
        return;
      }

      browser.removeEventListener(
        "DOMWillOpenModalDialog",
        onModalDialog,
        true
      );

      SimpleTest.waitForCondition(
        () => Services.focus.activeWindow == browser.ownerGlobal,
        function() {
          let stack = browser.parentNode;
          let dialogs = stack.getElementsByTagNameNS(XUL_NS, "tabmodalprompt");
          let { button0, button1 } = browser.tabModalPromptBox.prompts.get(
            dialogs[0]
          ).ui;
          callback(button0, button1);
        },
        "Waited too long for window with dialog to focus"
      );
    },
    true
  );
}
