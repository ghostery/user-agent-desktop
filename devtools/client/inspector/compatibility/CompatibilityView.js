/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {
  createFactory,
  createElement,
} = require("devtools/client/shared/vendor/react");
const { Provider } = require("devtools/client/shared/vendor/react-redux");

loader.lazyRequireGetter(
  this,
  "browsersDataset",
  "devtools/client/inspector/compatibility/lib/dataset/browsers.json"
);

const {
  updateNodes,
  updateSelectedNode,
  updateTargetBrowsers,
  updateTopLevelTarget,
} = require("devtools/client/inspector/compatibility/actions/compatibility");

const CompatibilityApp = createFactory(
  require("devtools/client/inspector/compatibility/components/CompatibilityApp")
);

class CompatibilityView {
  constructor(inspector, window) {
    this._onChangeAdded = this._onChangeAdded.bind(this);
    this._onPanelSelected = this._onPanelSelected.bind(this);
    this._onSelectedNodeChanged = this._onSelectedNodeChanged.bind(this);
    this._onTopLevelTargetChanged = this._onTopLevelTargetChanged.bind(this);
    this.inspector = inspector;

    this._init();
  }

  destroy() {
    this.inspector.off("new-root", this._onTopLevelTargetChanged);
    this.inspector.selection.off("new-node-front", this._onSelectedNodeChanged);
    this.inspector.sidebar.off(
      "compatibilityview-selected",
      this._onPanelSelected
    );

    const changesFront = this.inspector.toolbox.target.getCachedFront(
      "changes"
    );
    if (changesFront) {
      changesFront.off("add-change", this._onChangeAdded);
    }

    this.inspector = null;
  }

  _init() {
    const {
      onShowBoxModelHighlighterForNode: showBoxModelHighlighterForNode,
      setSelectedNode,
    } = this.inspector.getCommonComponentProps();
    const {
      onHideBoxModelHighlighter: hideBoxModelHighlighter,
    } = this.inspector.getPanel("boxmodel").getComponentProps();

    const compatibilityApp = new CompatibilityApp({
      hideBoxModelHighlighter,
      showBoxModelHighlighterForNode,
      setSelectedNode,
    });

    this.provider = createElement(
      Provider,
      {
        id: "compatibilityview",
        store: this.inspector.store,
      },
      compatibilityApp
    );

    this.inspector.on("new-root", this._onTopLevelTargetChanged);
    this.inspector.selection.on("new-node-front", this._onSelectedNodeChanged);
    this.inspector.sidebar.on(
      "compatibilityview-selected",
      this._onPanelSelected
    );

    this._initTargetBrowsers();
  }

  _initTargetBrowsers() {
    this.inspector.store.dispatch(
      updateTargetBrowsers(_getDefaultTargetBrowsers())
    );
  }

  _isAvailable() {
    return (
      this.inspector &&
      this.inspector.sidebar &&
      this.inspector.sidebar.getCurrentTabID() === "compatibilityview" &&
      this.inspector.selection &&
      this.inspector.selection.isConnected()
    );
  }

  _onChangeAdded({ selector }) {
    if (!this._isAvailable()) {
      return;
    }

    // We need to debounce updating nodes since "add-change" event on changes actor is
    // fired for every typed character until fixing bug 1503036.
    if (this._previousChangedSelector === selector) {
      clearTimeout(this._updateNodesTimeoutId);
    }
    this._previousChangedSelector = selector;

    this._updateNodesTimeoutId = setTimeout(() => {
      // TODO: In case of keyframes changes, the selector given from changes actor is
      // keyframe-selector such as "from" and "100%", not selector for node. Thus,
      // we need to address this case.
      this.inspector.store.dispatch(updateNodes(selector));
    }, 500);
  }

  _onPanelSelected() {
    this._onSelectedNodeChanged();
    this._onTopLevelTargetChanged();
  }

  _onSelectedNodeChanged() {
    if (!this._isAvailable()) {
      return;
    }

    this.inspector.store.dispatch(
      updateSelectedNode(this.inspector.selection.nodeFront)
    );
  }

  async _onTopLevelTargetChanged() {
    if (!this._isAvailable()) {
      return;
    }

    this.inspector.store.dispatch(
      updateTopLevelTarget(this.inspector.toolbox.target)
    );

    const changesFront = await this.inspector.toolbox.target.getFront(
      "changes"
    );

    try {
      // Call allChanges() in order to get the add-change qevent.
      await changesFront.allChanges();
    } catch (e) {
      // The connection to the server may have been cut, for example during test teardown.
      // Here we just catch the error and silently ignore it.
    }

    changesFront.on("add-change", this._onChangeAdded);
  }
}

/**
 * Return target browsers that will be checked as default.
 * The default target browsers includes major browsers that have been releasing as `esr`,
 * `release`, `beta` or `nightly`.
 *
 * @return e.g, [{ id: "firefox", name: "Firefox", version: "70", status: "nightly"},...]
 */
function _getDefaultTargetBrowsers() {
  const TARGET_BROWSER_ID = [
    "firefox",
    "firefox_android",
    "chrome",
    "chrome_android",
    "safari",
    "safari_ios",
    "edge",
  ];
  const TARGET_BROWSER_STATUS = ["esr", "current", "beta", "nightly"];

  // Retrieve the information that matches to the browser id and the status
  // from the browsersDataset.
  // For the structure of then browsersDataset,
  // see https://github.com/mdn/browser-compat-data/blob/master/browsers/firefox.json
  const targets = [];
  for (const id of TARGET_BROWSER_ID) {
    const { name, releases } = browsersDataset[id];

    for (const version in releases) {
      const { status } = releases[version];

      if (TARGET_BROWSER_STATUS.includes(status)) {
        targets.push({ id, name, version, status });
      }
    }
  }
  return targets;
}

module.exports = CompatibilityView;
