/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

// Tests that any output created from calls to the console API comes before the
// echoed JavaScript.

"use strict";

const TEST_URI =
  "http://example.com/browser/devtools/client/webconsole/" +
  "test/browser/test-console.html";

add_task(async function() {
  const hud = await openNewTabAndConsole(TEST_URI);

  const messages = ["console.log('foo', 'bar');", "foo bar", "undefined"];
  const onMessages = waitForMessages({
    hud,
    messages: messages.map(text => ({ text })),
  });

  execute(hud, "console.log('foo', 'bar');");

  const [fncallNode, consoleMessageNode, resultNode] = (await onMessages).map(
    msg => msg.node
  );

  is(
    fncallNode.nextElementSibling,
    consoleMessageNode,
    "console.log() is followed by 'foo' 'bar'"
  );
  is(
    consoleMessageNode.nextElementSibling,
    resultNode,
    "'foo' 'bar' is followed by undefined"
  );
});
