/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

// Test to see if the cached messages are displayed when the console UI is opened.

"use strict";

// See Bug 1570524.
requestLongerTimeout(2);

const TEST_URI =
  "http://example.com/browser/devtools/client/webconsole/" +
  "test/browser/test-webconsole-error-observer.html";

add_task(async function() {
  // On e10s, the exception is triggered in child process
  // and is ignored by test harness
  if (!Services.appinfo.browserTabsRemoteAutostart) {
    expectUncaughtException();
  }
  // Enable CSS filter for the test.
  await pushPref("devtools.webconsole.filter.css", true);

  await addTab(TEST_URI);

  info("Open the console");
  let hud = await openConsole();

  await testMessagesVisibility(hud);

  info("Close the toolbox");
  await closeToolbox();

  info("Open the console again");
  hud = await openConsole();
  await testMessagesVisibility(hud);
});

async function testMessagesVisibility(hud) {
  let message = await waitFor(() =>
    findMessage(hud, "log Bazzle", ".message.log")
  );
  ok(message, "console.log message is visible");

  message = await waitFor(() =>
    findMessage(hud, "error Bazzle", ".message.error")
  );
  ok(message, "console.error message is visible");

  message = await waitFor(() =>
    findMessage(hud, "bazBug611032", ".message.error")
  );
  ok(message, "exception message is visible");

  // The CSS message arrives lazily, so spin a bit for it unless it should be
  // cached.
  message = await waitFor(() =>
    findMessage(hud, "cssColorBug611032", ".message.warn.css")
  );
  ok(message, "css warning message is visible");
}
