/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const nodeConstants = require("devtools/shared/dom-node-constants");

loader.lazyGetter(this, "mdnCompatibility", () => {
  const MDNCompatibility = require("devtools/client/inspector/compatibility/lib/MDNCompatibility");
  const cssPropertiesCompatData = require("devtools/client/inspector/compatibility/lib/dataset/css-properties.json");
  return new MDNCompatibility(cssPropertiesCompatData);
});

const {
  COMPATIBILITY_APPEND_NODE,
  COMPATIBILITY_UPDATE_NODE,
  COMPATIBILITY_UPDATE_NODES_START,
  COMPATIBILITY_UPDATE_NODES_SUCCESS,
  COMPATIBILITY_UPDATE_NODES_FAILURE,
  COMPATIBILITY_UPDATE_NODES_COMPLETE,
  COMPATIBILITY_UPDATE_SELECTED_NODE_START,
  COMPATIBILITY_UPDATE_SELECTED_NODE_SUCCESS,
  COMPATIBILITY_UPDATE_SELECTED_NODE_FAILURE,
  COMPATIBILITY_UPDATE_SELECTED_NODE_COMPLETE,
  COMPATIBILITY_UPDATE_SELECTED_NODE_ISSUES,
  COMPATIBILITY_UPDATE_TARGET_BROWSERS_START,
  COMPATIBILITY_UPDATE_TARGET_BROWSERS_SUCCESS,
  COMPATIBILITY_UPDATE_TARGET_BROWSERS_FAILURE,
  COMPATIBILITY_UPDATE_TARGET_BROWSERS_COMPLETE,
  COMPATIBILITY_UPDATE_TOP_LEVEL_TARGET_START,
  COMPATIBILITY_UPDATE_TOP_LEVEL_TARGET_SUCCESS,
  COMPATIBILITY_UPDATE_TOP_LEVEL_TARGET_FAILURE,
  COMPATIBILITY_UPDATE_TOP_LEVEL_TARGET_COMPLETE,
} = require("devtools/client/inspector/compatibility/actions/index");

function updateNodes(selector) {
  return async ({ dispatch, getState }) => {
    dispatch({ type: COMPATIBILITY_UPDATE_NODES_START });

    try {
      const {
        selectedNode,
        topLevelTarget,
        targetBrowsers,
      } = getState().compatibility;
      const { walker } = await topLevelTarget.getFront("inspector");
      const nodeList = await walker.querySelectorAll(walker.rootNode, selector);

      for (const node of await nodeList.items()) {
        if (selectedNode.actorID === node.actorID) {
          await _updateSelectedNodeIssues(node, targetBrowsers, dispatch);
        }

        const issues = await _getNodeIssues(node, targetBrowsers);
        dispatch({
          type: COMPATIBILITY_UPDATE_NODE,
          node,
          issues,
        });
      }
      dispatch({ type: COMPATIBILITY_UPDATE_NODES_SUCCESS });
    } catch (error) {
      dispatch({
        type: COMPATIBILITY_UPDATE_NODES_FAILURE,
        error,
      });
    }

    dispatch({ type: COMPATIBILITY_UPDATE_NODES_COMPLETE });
  };
}

function updateSelectedNode(node) {
  return async ({ dispatch, getState }) => {
    dispatch({ type: COMPATIBILITY_UPDATE_SELECTED_NODE_START });

    try {
      const { targetBrowsers } = getState().compatibility;
      await _updateSelectedNodeIssues(node, targetBrowsers, dispatch);

      dispatch({
        type: COMPATIBILITY_UPDATE_SELECTED_NODE_SUCCESS,
        node,
      });
    } catch (error) {
      dispatch({
        type: COMPATIBILITY_UPDATE_SELECTED_NODE_FAILURE,
        error,
      });
    }

    dispatch({ type: COMPATIBILITY_UPDATE_SELECTED_NODE_COMPLETE });
  };
}

function updateTargetBrowsers(targetBrowsers) {
  return async ({ dispatch, getState }) => {
    dispatch({ type: COMPATIBILITY_UPDATE_TARGET_BROWSERS_START });

    try {
      const { selectedNode, topLevelTarget } = getState().compatibility;

      if (selectedNode) {
        await _updateSelectedNodeIssues(selectedNode, targetBrowsers, dispatch);
      }

      if (topLevelTarget) {
        await _updateTopLevelTargetIssues(
          topLevelTarget,
          targetBrowsers,
          dispatch
        );
      }

      dispatch({
        type: COMPATIBILITY_UPDATE_TARGET_BROWSERS_SUCCESS,
        targetBrowsers,
      });
    } catch (error) {
      dispatch({ type: COMPATIBILITY_UPDATE_TARGET_BROWSERS_FAILURE, error });
    }

    dispatch({ type: COMPATIBILITY_UPDATE_TARGET_BROWSERS_COMPLETE });
  };
}

function updateTopLevelTarget(target) {
  return async ({ dispatch, getState }) => {
    dispatch({ type: COMPATIBILITY_UPDATE_TOP_LEVEL_TARGET_START });

    try {
      const { targetBrowsers } = getState().compatibility;
      await _updateTopLevelTargetIssues(target, targetBrowsers, dispatch);

      dispatch({ type: COMPATIBILITY_UPDATE_TOP_LEVEL_TARGET_SUCCESS, target });
    } catch (error) {
      dispatch({ type: COMPATIBILITY_UPDATE_TOP_LEVEL_TARGET_FAILURE, error });
    }

    dispatch({ type: COMPATIBILITY_UPDATE_TOP_LEVEL_TARGET_COMPLETE });
  };
}

async function _getNodeIssues(node, targetBrowsers) {
  const pageStyle = node.inspectorFront.pageStyle;
  const styles = await pageStyle.getApplied(node, {
    skipPseudo: false,
  });

  const declarationBlocks = styles
    .map(({ rule }) => rule.declarations.filter(d => !d.commentOffsets))
    .filter(declarations => declarations.length);

  return declarationBlocks
    .map(declarationBlock =>
      mdnCompatibility.getCSSDeclarationBlockIssues(
        declarationBlock,
        targetBrowsers
      )
    )
    .flat()
    .reduce((issues, issue) => {
      // Get rid of duplicate issue
      return issues.find(
        i => i.type === issue.type && i.property === issue.property
      )
        ? issues
        : [...issues, issue];
    }, []);
}

async function _inspectNode(node, targetBrowsers, walker, dispatch) {
  if (node.nodeType !== nodeConstants.ELEMENT_NODE) {
    return;
  }

  const issues = await _getNodeIssues(node, targetBrowsers);

  if (issues.length) {
    dispatch({
      type: COMPATIBILITY_APPEND_NODE,
      node,
      issues,
    });
  }

  const { nodes: children } = await walker.children(node);
  for (const child of children) {
    await _inspectNode(child, targetBrowsers, walker, dispatch);
  }
}

async function _updateSelectedNodeIssues(node, targetBrowsers, dispatch) {
  const issues = await _getNodeIssues(node, targetBrowsers);

  dispatch({
    type: COMPATIBILITY_UPDATE_SELECTED_NODE_ISSUES,
    issues,
  });
}

async function _updateTopLevelTargetIssues(target, targetBrowsers, dispatch) {
  const { walker } = await target.getFront("inspector");
  const documentElement = await walker.documentElement();
  await _inspectNode(documentElement, targetBrowsers, walker, dispatch);
}

module.exports = {
  updateNodes,
  updateSelectedNode,
  updateTargetBrowsers,
  updateTopLevelTarget,
};
