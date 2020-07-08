/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";
const {
  getUrlBaseName,
} = require("devtools/client/netmonitor/src/utils/request-utils");
/**
 * Tests if request initiator is reported correctly.
 */

const INITIATOR_FILE_NAME = "html_cause-test-page.html";
const INITIATOR_URL = EXAMPLE_URL + INITIATOR_FILE_NAME;

const EXPECTED_REQUESTS = [
  {
    method: "GET",
    url: INITIATOR_URL,
    causeType: "document",
    causeUri: null,
    stack: false,
  },
  {
    method: "GET",
    url: EXAMPLE_URL + "stylesheet_request",
    causeType: "stylesheet",
    causeUri: INITIATOR_URL,
    stack: false,
  },
  {
    method: "GET",
    url: EXAMPLE_URL + "img_request",
    causeType: "img",
    causeUri: INITIATOR_URL,
    stack: false,
  },
  {
    method: "GET",
    url: EXAMPLE_URL + "xhr_request",
    causeType: "xhr",
    causeUri: INITIATOR_URL,
    stack: [
      { fn: "performXhrRequestCallback", file: INITIATOR_FILE_NAME, line: 26 },
    ],
  },
  {
    method: "GET",
    url: EXAMPLE_URL + "fetch_request",
    causeType: "fetch",
    causeUri: INITIATOR_URL,
    stack: [{ fn: "performFetchRequest", file: INITIATOR_FILE_NAME, line: 31 }],
  },
  {
    method: "GET",
    url: EXAMPLE_URL + "promise_fetch_request",
    causeType: "fetch",
    causeUri: INITIATOR_URL,
    stack: [
      {
        fn: "performPromiseFetchRequestCallback",
        file: INITIATOR_FILE_NAME,
        line: 37,
      },
      {
        fn: "performPromiseFetchRequest",
        file: INITIATOR_FILE_NAME,
        line: 36,
        asyncCause: "promise callback",
      },
    ],
  },
  {
    method: "GET",
    url: EXAMPLE_URL + "timeout_fetch_request",
    causeType: "fetch",
    causeUri: INITIATOR_URL,
    stack: [
      {
        fn: "performTimeoutFetchRequestCallback2",
        file: INITIATOR_FILE_NAME,
        line: 44,
      },
      {
        fn: "performTimeoutFetchRequestCallback1",
        file: INITIATOR_FILE_NAME,
        line: 43,
        asyncCause: "setTimeout handler",
      },
    ],
  },
  {
    method: "POST",
    url: EXAMPLE_URL + "beacon_request",
    causeType: "beacon",
    causeUri: INITIATOR_URL,
    stack: [
      { fn: "performBeaconRequest", file: INITIATOR_FILE_NAME, line: 50 },
    ],
  },
];

add_task(async function() {
  // Async stacks aren't on by default in all builds
  await SpecialPowers.pushPrefEnv({
    set: [["javascript.options.asyncstack", true]],
  });

  // the initNetMonitor function clears the network request list after the
  // page is loaded. That's why we first load a bogus page from SIMPLE_URL,
  // and only then load the real thing from INITIATOR_URL - we want to catch
  // all the requests the page is making, not only the XHRs.
  // We can't use about:blank here, because initNetMonitor checks that the
  // page has actually made at least one request.
  const { tab, monitor } = await initNetMonitor(SIMPLE_URL, {
    requestCount: 1,
  });

  const { document, store, windowRequire } = monitor.panelWin;
  const Actions = windowRequire("devtools/client/netmonitor/src/actions/index");
  const { getSortedRequests } = windowRequire(
    "devtools/client/netmonitor/src/selectors/index"
  );

  store.dispatch(Actions.batchEnable(false));

  const wait = waitForNetworkEvents(monitor, EXPECTED_REQUESTS.length);
  BrowserTestUtils.loadURI(tab.linkedBrowser, INITIATOR_URL);
  await wait;

  // For all expected requests
  for (const [index, { stack }] of EXPECTED_REQUESTS.entries()) {
    if (!stack) {
      continue;
    }

    EventUtils.sendMouseEvent(
      { type: "mousedown" },
      document.querySelectorAll(".request-list-item .requests-list-initiator")[
        index
      ]
    );

    // Clicking on the initiator column should open the Stack Trace panel
    const onStackTraceRendered = waitUntil(() =>
      document.querySelector("#stack-trace-panel .stack-trace .frame-link")
    );
    await onStackTraceRendered;
  }

  is(
    store.getState().requests.requests.length,
    EXPECTED_REQUESTS.length,
    "All the page events should be recorded."
  );

  validateRequests(EXPECTED_REQUESTS, monitor);

  // Sort the requests by initiator and check the order
  EventUtils.sendMouseEvent(
    { type: "click" },
    document.querySelector("#requests-list-initiator-button")
  );
  const expectedOrder = EXPECTED_REQUESTS.map(r => {
    if (r.stack) {
      const { file, line } = r.stack[0];
      return getUrlBaseName(file) + ":" + line;
    }
    return "";
  }).sort();
  expectedOrder.forEach((expectedInitiator, i) => {
    const request = getSortedRequests(store.getState())[i];
    if (request.cause.stacktraceAvailable) {
      const { fileName, lineNumber } = request.cause.lastFrame;
      const initiator = getUrlBaseName(fileName) + ":" + lineNumber;
      is(
        initiator,
        expectedInitiator,
        `The request #${i} has the expected initiator after sorting`
      );
    }
  });

  await teardown(monitor);
});
