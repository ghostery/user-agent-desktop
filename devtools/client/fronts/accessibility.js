/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {
  FrontClassWithSpec,
  registerFront,
} = require("devtools/shared/protocol.js");
const {
  accessibleSpec,
  accessibleWalkerSpec,
  accessibilitySpec,
  parentAccessibilitySpec,
  simulatorSpec,
} = require("devtools/shared/specs/accessibility");
const events = require("devtools/shared/event-emitter");

class AccessibleFront extends FrontClassWithSpec(accessibleSpec) {
  constructor(client, targetFront, parentFront) {
    super(client, targetFront, parentFront);

    this.before("audited", this.audited.bind(this));
    this.before("name-change", this.nameChange.bind(this));
    this.before("value-change", this.valueChange.bind(this));
    this.before("description-change", this.descriptionChange.bind(this));
    this.before("shortcut-change", this.shortcutChange.bind(this));
    this.before("reorder", this.reorder.bind(this));
    this.before("text-change", this.textChange.bind(this));
    this.before("index-in-parent-change", this.indexInParentChange.bind(this));
    this.before("states-change", this.statesChange.bind(this));
    this.before("actions-change", this.actionsChange.bind(this));
    this.before("attributes-change", this.attributesChange.bind(this));
  }

  marshallPool() {
    return this.getParent();
  }

  get role() {
    return this._form.role;
  }

  get name() {
    return this._form.name;
  }

  get value() {
    return this._form.value;
  }

  get description() {
    return this._form.description;
  }

  get keyboardShortcut() {
    return this._form.keyboardShortcut;
  }

  get childCount() {
    return this._form.childCount;
  }

  get domNodeType() {
    return this._form.domNodeType;
  }

  get indexInParent() {
    return this._form.indexInParent;
  }

  get states() {
    return this._form.states;
  }

  get actions() {
    return this._form.actions;
  }

  get attributes() {
    return this._form.attributes;
  }

  get checks() {
    return this._form.checks;
  }

  form(form) {
    this.actorID = form.actor;
    this._form = this._form || {};
    Object.assign(this._form, form);
  }

  nameChange(name, parent) {
    this._form.name = name;
    // Name change event affects the tree rendering, we fire this event on
    // accessibility walker as the point of interaction for UI.
    const accessibilityWalkerFront = this.getParent();
    if (accessibilityWalkerFront) {
      events.emit(accessibilityWalkerFront, "name-change", this, parent);
    }
  }

  valueChange(value) {
    this._form.value = value;
  }

  descriptionChange(description) {
    this._form.description = description;
  }

  shortcutChange(keyboardShortcut) {
    this._form.keyboardShortcut = keyboardShortcut;
  }

  reorder(childCount) {
    this._form.childCount = childCount;
    // Reorder event affects the tree rendering, we fire this event on
    // accessibility walker as the point of interaction for UI.
    const accessibilityWalkerFront = this.getParent();
    if (accessibilityWalkerFront) {
      events.emit(accessibilityWalkerFront, "reorder", this);
    }
  }

  textChange() {
    // Text event affects the tree rendering, we fire this event on
    // accessibility walker as the point of interaction for UI.
    const accessibilityWalkerFront = this.getParent();
    if (accessibilityWalkerFront) {
      events.emit(accessibilityWalkerFront, "text-change", this);
    }
  }

  indexInParentChange(indexInParent) {
    this._form.indexInParent = indexInParent;
  }

  statesChange(states) {
    this._form.states = states;
  }

  actionsChange(actions) {
    this._form.actions = actions;
  }

  attributesChange(attributes) {
    this._form.attributes = attributes;
  }

  audited(checks) {
    this._form.checks = this._form.checks || {};
    Object.assign(this._form.checks, checks);
  }

  hydrate() {
    return super.hydrate().then(properties => {
      Object.assign(this._form, properties);
    });
  }
}

class AccessibleWalkerFront extends FrontClassWithSpec(accessibleWalkerSpec) {
  form(json) {
    this.actorID = json.actor;
  }

  pick(doFocus) {
    if (doFocus) {
      return this.pickAndFocus();
    }

    return super.pick();
  }
}

class AccessibilityFront extends FrontClassWithSpec(accessibilitySpec) {
  constructor(client, targetFront, parentFront) {
    super(client, targetFront, parentFront);

    this.before("init", this.init.bind(this));
    this.before("shutdown", this.shutdown.bind(this));

    // TODO: Deprecated. Remove after Fx75.
    this.before("can-be-enabled-change", this.canBeEnabled.bind(this));
    // TODO: Deprecated. Remove after Fx75.
    this.before("can-be-disabled-change", this.canBeDisabled.bind(this));

    // Attribute name from which to retrieve the actorID out of the target
    // actor's form
    this.formAttributeName = "accessibilityActor";
  }

  // We purposefully do not use initialize here and separate accessiblity
  // front/actor initialization into two parts: getting the front from target
  // and then separately bootstrapping the front. The reason for that is because
  // accessibility front is always created as part of the accessibility panel
  // startup when the toolbox is opened. If initialize was used, in rare cases,
  // when the toolbox is destroyed before the accessibility tool startup is
  // complete, the toolbox destruction would hang because the accessibility
  // front will indefinitely wait for its initialize method to complete before
  // being destroyed. With custom bootstrapping the front will be destroyed
  // correctly.
  async bootstrap() {
    this.accessibleWalkerFront = await super.getWalker();
    this.simulatorFront = await super.getSimulator();
    // TODO: Deprecated. Remove canBeEnabled and canBeDisabled after Fx75.
    ({
      enabled: this.enabled,
      canBeEnabled: this.canBeEnabled,
      canBeDisabled: this.canBeDisabled,
    } = await super.bootstrap());
  }

  init() {
    this.enabled = true;
  }

  shutdown() {
    this.enabled = false;
  }

  // TODO: Deprecated. Remove after Fx75.
  canBeEnabled(canBeEnabled) {
    this.canBeEnabled = canBeEnabled;
  }

  // TODO: Deprecated. Remove after Fx75.
  canBeDisabled(canBeDisabled) {
    this.canBeDisabled = canBeDisabled;
  }
}

class ParentAccessibilityFront extends FrontClassWithSpec(
  parentAccessibilitySpec
) {
  constructor(client, targetFront, parentFront) {
    super(client, targetFront, parentFront);
    this.before("can-be-enabled-change", this.canBeEnabled.bind(this));
    this.before("can-be-disabled-change", this.canBeDisabled.bind(this));

    // Attribute name from which to retrieve the actorID out of the target
    // actor's form
    this.formAttributeName = "parentAccessibilityActor";
  }

  async initialize() {
    ({
      canBeEnabled: this.canBeEnabled,
      canBeDisabled: this.canBeDisabled,
    } = await super.bootstrap());
  }

  canBeEnabled(canBeEnabled) {
    this.canBeEnabled = canBeEnabled;
  }

  canBeDisabled(canBeDisabled) {
    this.canBeDisabled = canBeDisabled;
  }
}

const SimulatorFront = FrontClassWithSpec(simulatorSpec);

exports.AccessibleFront = AccessibleFront;
registerFront(AccessibleFront);
exports.AccessibleWalkerFront = AccessibleWalkerFront;
registerFront(AccessibleWalkerFront);
exports.AccessibilityFront = AccessibilityFront;
registerFront(AccessibilityFront);
exports.ParentAccessibilityFront = ParentAccessibilityFront;
registerFront(ParentAccessibilityFront);
exports.SimulatorFront = SimulatorFront;
registerFront(SimulatorFront);
