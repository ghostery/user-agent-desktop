/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

// Test whether the content of the issue list will be changed when the rules are changed
// on the rule view.

const TEST_URI = `
  <style>
  .test-class {
    border-block-color: lime;
  }
  div {
    margin-inline-start: 5px;
  }
  </style>
  <div class="test-class">test class</div>
  <div>test</div>
`;

const TEST_DATA_SELECTED = {
  fullRule: {
    expectedProperties: [
      { property: "border-block-color" },
      { property: "margin-inline-start" },
    ],
    expectedNodes: [
      {
        property: "border-block-color",
        nodes: [],
      },
      {
        property: "margin-inline-start",
        nodes: [],
      },
    ],
  },
  classRule: {
    expectedProperties: [{ property: "border-block-color" }],
    expectedNodes: [
      {
        property: "border-block-color",
        nodes: [],
      },
    ],
  },
  elementRule: {
    expectedProperties: [{ property: "margin-inline-start" }],
    expectedNodes: [
      {
        property: "margin-inline-start",
        nodes: [],
      },
    ],
  },
};

const TEST_DATA_ALL = {
  fullRule: {
    expectedProperties: [
      { property: "border-block-color" },
      { property: "margin-inline-start" },
    ],
    expectedNodes: [
      {
        property: "border-block-color",
        nodes: ["div.test-class"],
      },
      {
        property: "margin-inline-start",
        nodes: ["div.test-class", "div"],
      },
    ],
  },
  classRule: {
    expectedProperties: [{ property: "border-block-color" }],
    expectedNodes: [
      {
        property: "border-block-color",
        nodes: ["div.test-class"],
      },
    ],
  },
  elementRule: {
    expectedProperties: [{ property: "margin-inline-start" }],
    expectedNodes: [
      {
        property: "margin-inline-start",
        nodes: ["div.test-class", "div"],
      },
    ],
  },
};

const {
  COMPATIBILITY_UPDATE_NODES_COMPLETE,
} = require("devtools/client/inspector/compatibility/actions/index");

add_task(async function() {
  info("Enable 3 pane mode");
  await pushPref("devtools.inspector.three-pane-enabled", true);

  await addTab("data:text/html;charset=utf-8," + encodeURIComponent(TEST_URI));

  const {
    allElementsPane,
    inspector,
    selectedElementPane,
  } = await openCompatibilityView();
  await selectNode(".test-class", inspector);

  info("Check the initial issue");
  await assertAll(selectedElementPane, TEST_DATA_SELECTED.fullRule);
  await assertAll(allElementsPane, TEST_DATA_ALL.fullRule);

  info("Check the issue after unchecking class rule");
  await _togglePropRule(inspector, 1, 0);
  await assertAll(selectedElementPane, TEST_DATA_SELECTED.elementRule);
  await assertAll(allElementsPane, TEST_DATA_ALL.elementRule);

  info("Check the issue after unchecking div rule");
  await _togglePropRule(inspector, 2, 0);
  await assertIssueList(selectedElementPane, []);
  await assertIssueList(allElementsPane, []);

  info("Check the issue after reverting class rule");
  await _togglePropRule(inspector, 1, 0);
  await assertAll(selectedElementPane, TEST_DATA_SELECTED.classRule);
  await assertAll(allElementsPane, TEST_DATA_ALL.classRule);

  info("Check the issue after reverting div rule");
  await _togglePropRule(inspector, 2, 0);
  await assertAll(selectedElementPane, TEST_DATA_SELECTED.fullRule);
  await assertAll(allElementsPane, TEST_DATA_ALL.fullRule);
});

async function assertAll(pane, { expectedProperties, expectedNodes }) {
  await assertIssueList(pane, expectedProperties);
  await assertNodeList(pane, expectedNodes);
}

async function _togglePropRule(inspector, ruleIndex, propIndex) {
  const ruleView = inspector.getPanel("ruleview").view;
  const onNodesUpdated = waitForDispatch(
    inspector.store,
    COMPATIBILITY_UPDATE_NODES_COMPLETE
  );
  const rule = getRuleViewRuleEditor(ruleView, ruleIndex).rule;
  const textProp = rule.textProps[propIndex];
  textProp.editor.enable.click();
  await onNodesUpdated;
}
