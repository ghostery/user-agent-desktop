/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
"use strict";

/**
 * This file controls the logic of the profiler popup view.
 */

/**
 * @typedef {ReturnType<typeof selectElementsInPanelview>} Elements
 * @typedef {ReturnType<typeof createViewControllers>} ViewController
 */

/**
 * @typedef {Object} State - The mutable state of the popup.
 * @property {Array<() => void>} cleanup - Functions to cleanup once the view is hidden.
 * @property {boolean} isInfoCollapsed
 */

/**
 * TS-TODO
 *
 * This function replaces lazyRequireGetter, and TypeScript can understand it. It's
 * currently duplicated until we have consensus that TypeScript is a good idea.
 *
 * @template T
 * @type {(callback: () => T) => () => T}
 */
function requireLazy(callback) {
  /** @type {T | undefined} */
  let cache;
  return () => {
    if (cache === undefined) {
      cache = callback();
    }
    return cache;
  };
}

// Provide an exports object for the JSM to be properly read by TypeScript.
/** @type {any} */ (this).module = {};

const lazyServices = requireLazy(() =>
  /** @type {import("resource://gre/modules/Services.jsm")} */
  (ChromeUtils.import("resource://gre/modules/Services.jsm"))
);
const lazyPanelMultiView = requireLazy(() =>
  /** @type {import("resource:///modules/PanelMultiView.jsm")} */
  (ChromeUtils.import("resource:///modules/PanelMultiView.jsm"))
);
const lazyBackground = requireLazy(() =>
  /** @type {import("resource://devtools/client/performance-new/popup/background.jsm.js")} */
  (ChromeUtils.import(
    "resource://devtools/client/performance-new/popup/background.jsm.js"
  ))
);

/**
 * This function collects all of the selection of the elements inside of the panel.
 *
 * @param {XULElement} panelview
 */
function selectElementsInPanelview(panelview) {
  const document = panelview.ownerDocument;
  /**
   * Get an element or throw an error if it's not found. This is more friendly
   * for TypeScript.
   *
   * @param {string} id
   * @return {HTMLElement}
   */
  function getElementById(id) {
    /** @type {HTMLElement | null} */
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Could not find the element from the ID "${id}"`);
    }
    return element;
  }

  return {
    document,
    panelview,
    window: /** @type {ChromeWindow} */ (document.defaultView),
    inactive: getElementById("PanelUI-profiler-inactive"),
    active: getElementById("PanelUI-profiler-active"),
    presetDescription: getElementById("PanelUI-profiler-content-description"),
    presetCustom: getElementById("PanelUI-profiler-content-custom"),
    presetsCustomButton: getElementById(
      "PanelUI-profiler-content-custom-button"
    ),
    presetsMenuList: /** @type {MenuListElement} */ (getElementById(
      "PanelUI-profiler-presets"
    )),
    header: getElementById("PanelUI-profiler-header"),
    info: getElementById("PanelUI-profiler-info"),
    menupopup: getElementById("PanelUI-profiler-presets-menupopup"),
    infoButton: getElementById("PanelUI-profiler-info-button"),
    learnMore: getElementById("PanelUI-profiler-learn-more"),
    startRecording: getElementById("PanelUI-profiler-startRecording"),
    stopAndDiscard: getElementById("PanelUI-profiler-stopAndDiscard"),
    stopAndCapture: getElementById("PanelUI-profiler-stopAndCapture"),
  };
}

/**
 * This function returns an interface that can be used to control the view of the
 * panel based on the current mutable State.
 *
 * @param {State} state
 * @param {Elements} elements
 */
function createViewControllers(state, elements) {
  return {
    updateInfoCollapse() {
      const { header, info } = elements;
      header.setAttribute(
        "isinfocollapsed",
        state.isInfoCollapsed ? "true" : "false"
      );

      if (state.isInfoCollapsed) {
        const { height } = info.getBoundingClientRect();
        info.style.marginBlockEnd = `-${height}px`;
      } else {
        info.style.marginBlockEnd = "0";
      }
    },

    updatePresets() {
      const { Services } = lazyServices();
      const { presets, getRecordingPreferences } = lazyBackground();
      const { presetName } = getRecordingPreferences(
        "aboutprofiling",
        Services.profiler.GetFeatures()
      );
      const preset = presets[presetName];
      if (preset) {
        elements.presetDescription.style.display = "block";
        elements.presetCustom.style.display = "none";
        elements.presetDescription.textContent = preset.description;
        elements.presetsMenuList.value = presetName;
      } else {
        elements.presetDescription.style.display = "none";
        elements.presetCustom.style.display = "block";
      }
      const { PanelMultiView } = lazyPanelMultiView();
      // Update the description height sizing.
      PanelMultiView.forNode(elements.panelview).descriptionHeightWorkaround();
    },

    updateProfilerActive() {
      const { Services } = lazyServices();
      const isProfilerActive = Services.profiler.IsActive();
      elements.inactive.setAttribute(
        "hidden",
        isProfilerActive ? "true" : "false"
      );
      elements.active.setAttribute(
        "hidden",
        isProfilerActive ? "false" : "true"
      );
      elements.presetsMenuList.disabled = isProfilerActive;
    },

    createPresetsList() {
      // Check the DOM if the presets were built or not. We can't cache this value
      // in the `State` object, as the `State` object will be removed if the
      // button is removed from the toolbar, but the DOM changes will still persist.
      if (elements.menupopup.getAttribute("presetsbuilt") === "true") {
        // The presets were already built.
        return;
      }
      const { Services } = lazyServices();
      const { presets } = lazyBackground();
      const currentPreset = Services.prefs.getCharPref(
        "devtools.performance.recording.preset"
      );

      const menuitems = Object.entries(presets).map(([id, preset]) => {
        const menuitem = elements.document.createXULElement("menuitem");
        menuitem.setAttribute("label", preset.label);
        menuitem.setAttribute("value", id);
        if (id === currentPreset) {
          elements.presetsMenuList.setAttribute("value", id);
        }
        return menuitem;
      });

      elements.menupopup.prepend(...menuitems);
      elements.menupopup.setAttribute("presetsbuilt", "true");
    },

    hidePopup() {
      const panel = elements.panelview.closest("panel");
      if (!panel) {
        throw new Error("Could not find the panel from the panelview.");
      }
      /** @type {any} */ (panel).hidePopup();
    },
  };
}

/**
 * Perform all of the business logic to present the popup view once it is open.
 *
 * @param {State} state
 * @param {Elements} elements
 * @param {ViewController} view
 */
function initializePopup(state, elements, view) {
  view.createPresetsList();

  state.cleanup.push(() => {
    // The UI should be collapsed by default for the next time the popup
    // is open.
    state.isInfoCollapsed = true;
    view.updateInfoCollapse();
  });

  // Turn off all animations while initializing the popup.
  elements.header.setAttribute("animationready", "false");

  elements.window.requestAnimationFrame(() => {
    // Allow the elements to layout once, the updateInfoCollapse implementation measures
    // the size of the container. It needs to wait a second before the bounding box
    // returns an actual size.
    view.updateInfoCollapse();
    view.updateProfilerActive();
    view.updatePresets();

    // XUL <description> elements don't vertically size correctly, this is
    // the workaround for it.
    const { PanelMultiView } = lazyPanelMultiView();
    PanelMultiView.forNode(elements.panelview).descriptionHeightWorkaround();

    // Now wait for another rAF, and turn the animations back on.
    elements.window.requestAnimationFrame(() => {
      elements.header.setAttribute("animationready", "true");
    });
  });
}

/**
 * This function is in charge of settings all of the events handlers for the view.
 * The handlers must also add themselves to the `state.cleanup` for them to be
 * properly cleaned up once the view is destroyed.
 *
 * @param {State} state
 * @param {Elements} elements
 * @param {ViewController} view
 */
function addPopupEventHandlers(state, elements, view) {
  const {
    changePreset,
    startProfiler,
    stopProfiler,
    captureProfile,
  } = lazyBackground();

  /**
   * Adds a handler that automatically is removed once the panel is hidden.
   *
   * @param {HTMLElement} element
   * @param {string} type
   * @param {(event: Event) => void} handler
   */
  function addHandler(element, type, handler) {
    element.addEventListener(type, handler);
    state.cleanup.push(() => {
      element.removeEventListener(type, handler);
    });
  }

  addHandler(elements.infoButton, "click", event => {
    // Any button command event in the popup will cause it to close. Prevent this
    // from happening on click.
    event.preventDefault();

    state.isInfoCollapsed = !state.isInfoCollapsed;
    view.updateInfoCollapse();
  });

  addHandler(elements.startRecording, "click", () => {
    startProfiler("aboutprofiling");
  });

  addHandler(elements.stopAndDiscard, "click", () => {
    stopProfiler();
  });

  addHandler(elements.stopAndCapture, "click", () => {
    captureProfile();
    view.hidePopup();
  });

  addHandler(elements.learnMore, "click", () => {
    elements.window.openWebLinkIn("https://profiler.firefox.com/docs/", "tab");
    view.hidePopup();
  });

  addHandler(elements.presetsMenuList, "command", () => {
    changePreset(
      "aboutprofiling",
      elements.presetsMenuList.value,
      Services.profiler.GetFeatures()
    );
    view.updatePresets();
  });

  addHandler(elements.presetsMenuList, "popuphidden", event => {
    // Changing a preset makes the popup autohide, this handler stops the
    // propagation of that event, so that only the menulist's popup closes,
    // and not the rest of the popup.
    event.stopPropagation();
  });

  addHandler(elements.presetsMenuList, "click", event => {
    // Clicking on a preset makes the popup autohide, this preventDefault stops
    // the CustomizableUI from closing the popup.
    event.preventDefault();
  });

  addHandler(elements.presetsCustomButton, "click", () => {
    elements.window.openTrustedLinkIn("about:profiling", "tab");
    view.hidePopup();
  });

  // Update the view when the profiler starts/stops.
  const { Services } = lazyServices();
  Services.obs.addObserver(view.updateProfilerActive, "profiler-started");
  Services.obs.addObserver(view.updateProfilerActive, "profiler-stopped");
  state.cleanup.push(() => {
    Services.obs.removeObserver(view.updateProfilerActive, "profiler-started");
    Services.obs.removeObserver(view.updateProfilerActive, "profiler-stopped");
  });
}

module.exports = {
  selectElementsInPanelview,
  createViewControllers,
  addPopupEventHandlers,
  initializePopup,
};

// Object.keys() confuses the linting which expects a static array expression.
// eslint-disable-next-line
var EXPORTED_SYMBOLS = Object.keys(module.exports);
