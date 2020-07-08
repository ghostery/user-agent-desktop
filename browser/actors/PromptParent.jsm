/* vim: set ts=2 sw=2 et tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var EXPORTED_SYMBOLS = ["PromptParent"];

ChromeUtils.defineModuleGetter(
  this,
  "PromptUtils",
  "resource://gre/modules/SharedPromptUtils.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "Services",
  "resource://gre/modules/Services.jsm"
);

/**
 * @typedef {Object} Prompt
 * @property {Function} resolver
 *           The resolve function to be called with the data from the Prompt
 *           after the user closes it.
 * @property {Object} tabModalPrompt
 *           The TabModalPrompt being shown to the user.
 */

/**
 * gBrowserPrompts weakly maps BrowsingContexts to a Map of their currently
 * active Prompts.
 *
 * @type {WeakMap<BrowsingContext, Prompt>}
 */
let gBrowserPrompts = new WeakMap();

class PromptParent extends JSWindowActorParent {
  didDestroy() {
    // In the event that the subframe or tab crashed, make sure that
    // we close any active Prompts.
    this.forceClosePrompts(this.browsingContext);
  }

  /**
   * Registers a new Prompt to be tracked for a particular BrowsingContext.
   * We need to track a Prompt so that we can, for example, force-close the
   * TabModalPrompt if the originating subframe or tab unloads or crashes.
   *
   * @param {BrowsingContext} browsingContext
   *        The BrowsingContext from which the request to open the Prompt came.
   * @param {Object} tabModalPrompt
   *        The TabModalPrompt that will be shown to the user.
   * @param {string} id
   *        A unique ID to differentiate multiple Prompts coming from the same
   *        BrowsingContext.
   * @return {Promise}
   * @resolves {Object}
   *           Resolves with the arguments returned from the TabModalPrompt when it
   *           is dismissed.
   */
  registerPrompt(browsingContext, tabModalPrompt, id) {
    let prompts = gBrowserPrompts.get(browsingContext);
    if (!prompts) {
      prompts = new Map();
      gBrowserPrompts.set(browsingContext, prompts);
    }

    let promise = new Promise(resolve => {
      prompts.set(id, {
        tabModalPrompt,
        resolver: resolve,
      });
    });

    return promise;
  }

  /**
   * Removes a Prompt for a BrowsingContext with a particular ID from the registry.
   * This needs to be done to avoid leaking <xul:browser>'s.
   *
   * @param {BrowsingContext} browsingContext
   *        The BrowsingContext from which the request to open the Prompt came.
   * @param {string} id
   *        A unique ID to differentiate multiple Prompts coming from the same
   *        BrowsingContext.
   */
  unregisterPrompt(browsingContext, id) {
    let prompts = gBrowserPrompts.get(browsingContext);
    if (prompts) {
      prompts.delete(id);
    }
  }

  /**
   * Programmatically closes a Prompt, without waiting for the TabModalPrompt to
   * return with any arguments.
   *
   * @param {BrowsingContext} browsingContext
   *        The BrowsingContext from which the request to open the Prompt came.
   * @param {string} id
   *        A unique ID to differentiate multiple Prompts coming from the same
   *        BrowsingContext.
   */
  forceClosePrompt(browsingContext, id) {
    let prompts = gBrowserPrompts.get(browsingContext);
    let prompt = prompts.get(id);
    if (prompt && prompt.tabModalPrompt) {
      prompt.tabModalPrompt.abortPrompt();
    }
  }

  /**
   * Programmatically closes all Prompts for a BrowsingContext.
   *
   * @param {BrowsingContext} browsingContext
   *        The BrowsingContext from which the request to open the Prompts came.
   */
  forceClosePrompts(browsingContext) {
    let prompts = gBrowserPrompts.get(browsingContext) || [];

    for (let prompt of prompts) {
      if (prompt.tabModalPrompt) {
        prompt.tabModalPrompt.abortPrompt();
      }
    }
  }

  receiveMessage(message) {
    let browsingContext = this.browsingContext;
    let args = message.data;
    let id = args._remoteId;

    switch (message.name) {
      case "Prompt:Open": {
        const COMMON_DIALOG = "chrome://global/content/commonDialog.xhtml";
        const SELECT_DIALOG = "chrome://global/content/selectDialog.xhtml";

        let topPrincipal =
          browsingContext.top.currentWindowGlobal.documentPrincipal;
        args.showAlertOrigin = topPrincipal.equals(args.promptPrincipal);

        if (message.data.tabPrompt) {
          return this.openTabPrompt(message.data, browsingContext, id);
        }
        let uri =
          message.data.promptType == "select" ? SELECT_DIALOG : COMMON_DIALOG;

        let browser = browsingContext.top.embedderElement;
        return this.openModalWindow(uri, message.data, browser);
      }
      case "Prompt:ForceClose": {
        this.forceClosePrompt(browsingContext, id);
        break;
      }
    }

    return undefined;
  }

  /**
   * Opens a TabModalPrompt for a BrowsingContext, and puts the associated browser
   * in the modal state until the TabModalPrompt is closed.
   *
   * @param {Object} args
   *        The arguments passed up from the BrowsingContext to be passed directly
   *        to the TabModalPrompt.
   * @param {BrowsingContext} browsingContext
   *        The BrowsingContext from which the request to open the Prompts came.
   * @param {string} id
   *        A unique ID to differentiate multiple Prompts coming from the same
   *        BrowsingContext.
   * @return {Promise}
   * @resolves {Object}
   *           Resolves with the arguments returned from the TabModalPrompt when it
   *           is dismissed.
   */
  openTabPrompt(args, browsingContext, id) {
    let browser = browsingContext.top.embedderElement;
    let window = browser.ownerGlobal;
    let tabPrompt = window.gBrowser.getTabModalPromptBox(browser);
    let newPrompt;
    let needRemove = false;

    let onPromptClose = forceCleanup => {
      let promptData = gBrowserPrompts.get(browsingContext);
      if (!promptData || !promptData.has(id)) {
        throw new Error(
          "Failed to close a prompt since it wasn't registered for some reason."
        );
      }

      let { resolver, tabModalPrompt } = promptData.get(id);
      // It's possible that we removed the prompt during the
      // appendPrompt call below. In that case, newPrompt will be
      // undefined. We set the needRemove flag to remember to remove
      // it right after we've finished adding it.
      if (tabModalPrompt) {
        tabPrompt.removePrompt(tabModalPrompt);
      } else {
        needRemove = true;
      }

      this.unregisterPrompt(browsingContext, id);

      PromptUtils.fireDialogEvent(window, "DOMModalDialogClosed", browser);
      resolver(args);
      browser.leaveModalState();
    };

    try {
      browser.enterModalState();
      let eventDetail = {
        tabPrompt: true,
        promptPrincipal: args.promptPrincipal,
        inPermitUnload: args.inPermitUnload,
      };
      PromptUtils.fireDialogEvent(
        window,
        "DOMWillOpenModalDialog",
        browser,
        eventDetail
      );

      args.promptActive = true;

      newPrompt = tabPrompt.appendPrompt(args, onPromptClose);
      let promise = this.registerPrompt(browsingContext, newPrompt, id);

      if (needRemove) {
        tabPrompt.removePrompt(newPrompt);
      }

      return promise;
    } catch (ex) {
      Cu.reportError(ex);
      onPromptClose(true);
    }

    return null;
  }

  /**
   * Opens a window-modal prompt for a BrowsingContext, and puts the associated
   * browser in the modal state until the prompt is closed.
   *
   * @param {string} uri
   *        The URI to a XUL document to be loaded in a modal window.
   * @param {Object} args
   *        The arguments passed up from the BrowsingContext to be passed
   *        directly to the modal window.
   * @param {Element} browser
   *        The <xul:browser> from which the request to open the window-modal
   *        prompt came.
   * @return {Promise}
   * @resolves {Object}
   *           Resolves with the arguments returned from the window-modal
   *           prompt when it is dismissed.
   */
  openModalWindow(uri, args, browser) {
    let window = browser.ownerGlobal;
    try {
      browser.enterModalState();
      PromptUtils.fireDialogEvent(window, "DOMWillOpenModalDialog", browser);
      let bag = PromptUtils.objectToPropBag(args);

      Services.ww.openWindow(
        window,
        uri,
        "_blank",
        "centerscreen,chrome,modal,titlebar",
        bag
      );

      PromptUtils.propBagToObject(bag, args);
    } finally {
      browser.leaveModalState();
      PromptUtils.fireDialogEvent(window, "DOMModalDialogClosed", browser);
    }
    return Promise.resolve(args);
  }
}
