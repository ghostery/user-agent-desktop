/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const { PureComponent } = require("devtools/client/shared/vendor/react");
const dom = require("devtools/client/shared/vendor/react-dom-factories");
const PropTypes = require("devtools/client/shared/vendor/react-prop-types");
const {
  CONNECTION_TYPES,
  DEBUG_TARGET_TYPES,
} = require("devtools/client/shared/remote-debugging/constants");

/**
 * This is header that should be displayed on top of the toolbox when using
 * about:devtools-toolbox.
 */
class DebugTargetInfo extends PureComponent {
  static get propTypes() {
    return {
      debugTargetData: PropTypes.shape({
        connectionType: PropTypes.oneOf(Object.values(CONNECTION_TYPES))
          .isRequired,
        runtimeInfo: PropTypes.shape({
          deviceName: PropTypes.string,
          icon: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          version: PropTypes.string.isRequired,
        }).isRequired,
        targetType: PropTypes.oneOf(Object.values(DEBUG_TARGET_TYPES))
          .isRequired,
      }).isRequired,
      L10N: PropTypes.object.isRequired,
      toolbox: PropTypes.object.isRequired,
    };
  }

  componentDidMount() {
    this.updateTitle();
  }

  updateTitle() {
    const { L10N, debugTargetData, toolbox } = this.props;
    const title = toolbox.target.name;
    const targetTypeStr = L10N.getStr(
      this.getAssetsForDebugTargetType().l10nId
    );

    const { connectionType } = debugTargetData;
    if (connectionType === CONNECTION_TYPES.THIS_FIREFOX) {
      toolbox.doc.title = L10N.getFormatStr(
        "toolbox.debugTargetInfo.tabTitleLocal",
        targetTypeStr,
        title
      );
    } else {
      const connectionTypeStr = L10N.getStr(
        this.getAssetsForConnectionType().l10nId
      );
      toolbox.doc.title = L10N.getFormatStr(
        "toolbox.debugTargetInfo.tabTitleRemote",
        connectionTypeStr,
        targetTypeStr,
        title
      );
    }
  }

  getRuntimeText() {
    const { debugTargetData, L10N } = this.props;
    const { name, version } = debugTargetData.runtimeInfo;
    const { connectionType } = debugTargetData;

    return connectionType === CONNECTION_TYPES.THIS_FIREFOX
      ? L10N.getFormatStr(
          "toolbox.debugTargetInfo.runtimeLabel.thisFirefox",
          version
        )
      : L10N.getFormatStr(
          "toolbox.debugTargetInfo.runtimeLabel",
          name,
          version
        );
  }

  getAssetsForConnectionType() {
    const { connectionType } = this.props.debugTargetData;

    switch (connectionType) {
      case CONNECTION_TYPES.USB:
        return {
          image: "chrome://devtools/skin/images/aboutdebugging-usb-icon.svg",
          l10nId: "toolbox.debugTargetInfo.connection.usb",
        };
      case CONNECTION_TYPES.NETWORK:
        return {
          image: "chrome://devtools/skin/images/aboutdebugging-globe-icon.svg",
          l10nId: "toolbox.debugTargetInfo.connection.network",
        };
      default:
        return {};
    }
  }

  getAssetsForDebugTargetType() {
    const { targetType } = this.props.debugTargetData;

    // TODO: https://bugzilla.mozilla.org/show_bug.cgi?id=1520723
    //       Show actual favicon (currently toolbox.target.activeTab.favicon
    //       is unpopulated)
    const favicon = "chrome://devtools/skin/images/globe.svg";

    switch (targetType) {
      case DEBUG_TARGET_TYPES.EXTENSION:
        return {
          image: "chrome://devtools/skin/images/debugging-addons.svg",
          l10nId: "toolbox.debugTargetInfo.targetType.extension",
        };
      case DEBUG_TARGET_TYPES.PROCESS:
        return {
          image: "chrome://devtools/skin/images/settings.svg",
          l10nId: "toolbox.debugTargetInfo.targetType.process",
        };
      case DEBUG_TARGET_TYPES.TAB:
        return {
          image: favicon,
          l10nId: "toolbox.debugTargetInfo.targetType.tab",
        };
      case DEBUG_TARGET_TYPES.WORKER:
        return {
          image: "chrome://devtools/skin/images/debugging-workers.svg",
          l10nId: "toolbox.debugTargetInfo.targetType.worker",
        };
      default:
        return {};
    }
  }

  shallRenderConnection() {
    const { connectionType } = this.props.debugTargetData;
    const renderableTypes = [CONNECTION_TYPES.USB, CONNECTION_TYPES.NETWORK];

    return renderableTypes.includes(connectionType);
  }

  renderConnection() {
    const { connectionType } = this.props.debugTargetData;
    const { image, l10nId } = this.getAssetsForConnectionType();

    return dom.span(
      {
        className: "iconized-label qa-connection-info",
      },
      dom.img({ src: image, alt: `${connectionType} icon` }),
      this.props.L10N.getStr(l10nId)
    );
  }

  renderRuntime() {
    if (!this.props.debugTargetData.runtimeInfo) {
      // Skip the runtime render if no runtimeInfo is available.
      // Runtime info is retrieved from the remote-client-manager, which might not be
      // setup if about:devtools-toolbox was not opened from about:debugging.
      return null;
    }

    const { icon, deviceName } = this.props.debugTargetData.runtimeInfo;

    return dom.span(
      {
        className: "iconized-label qa-runtime-info",
      },
      dom.img({ src: icon, className: "channel-icon qa-runtime-icon" }),
      dom.b({ className: "devtools-ellipsis-text" }, this.getRuntimeText()),
      dom.span({ className: "devtools-ellipsis-text" }, deviceName)
    );
  }

  renderTarget() {
    const title = this.props.toolbox.target.name;
    const url = this.props.toolbox.target.url;

    const { image, l10nId } = this.getAssetsForDebugTargetType();

    return dom.span(
      {
        className: "iconized-label",
      },
      dom.img({ src: image, alt: this.props.L10N.getStr(l10nId) }),
      title
        ? dom.b({ className: "devtools-ellipsis-text qa-target-title" }, title)
        : null,
      dom.span({ className: "devtools-ellipsis-text" }, url)
    );
  }

  render() {
    return dom.header(
      {
        className: "debug-target-info qa-debug-target-info",
      },
      this.shallRenderConnection() ? this.renderConnection() : null,
      this.renderRuntime(),
      this.renderTarget()
    );
  }
}

module.exports = DebugTargetInfo;
