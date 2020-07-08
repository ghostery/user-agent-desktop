/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";
import ReactDOM from "react-dom";
import { HeroText } from "./components/HeroText";
import { FxCards } from "./components/FxCards";
import { Localized } from "./components/MSLocalized";

import {
  AboutWelcomeUtils,
  DEFAULT_WELCOME_CONTENT,
} from "../lib/aboutwelcome-utils";

class AboutWelcome extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { metricsFlowUri: null };
    this.fetchFxAFlowUri = this.fetchFxAFlowUri.bind(this);
    this.handleStartBtnClick = this.handleStartBtnClick.bind(this);
  }

  async fetchFxAFlowUri() {
    this.setState({ metricsFlowUri: await window.AWGetFxAMetricsFlowURI() });
  }

  componentDidMount() {
    let messageId =
      this.props.experiment && this.props.branchId
        ? `SIMPLIFIED_ABOUT_WELCOME_${this.props.experiment}_${this.props.branchId}`.toUpperCase()
        : "SIMPLIFIED_ABOUT_WELCOME";

    this.fetchFxAFlowUri();
    window.AWSendEventTelemetry({
      event: "IMPRESSION",
      message_id: messageId,
    });
    // Captures user has seen about:welcome by setting
    // firstrun.didSeeAboutWelcome pref to true
    window.AWSendToParent("SET_WELCOME_MESSAGE_SEEN");
  }

  handleStartBtnClick() {
    AboutWelcomeUtils.handleUserAction(this.props.startButton.action);
    const ping = {
      event: "CLICK_BUTTON",
      message_id: this.props.startButton.message_id,
      id: "ABOUT_WELCOME",
    };
    window.AWSendEventTelemetry(ping);
  }

  render() {
    const { props } = this;
    let UTMTerm =
      this.props.experiment && this.props.branchId
        ? `${this.props.experiment}-${this.props.branchId}`
        : "default";
    return (
      <div className="outer-wrapper welcomeContainer">
        <div className="welcomeContainerInner">
          <main>
            <HeroText title={props.title} subtitle={props.subtitle} />
            <FxCards
              cards={props.cards}
              metricsFlowUri={this.state.metricsFlowUri}
              sendTelemetry={window.AWSendEventTelemetry}
              utm_term={UTMTerm}
            />
            <Localized text={props.startButton.label}>
              <button
                className="start-button"
                onClick={this.handleStartBtnClick}
              />
            </Localized>
          </main>
        </div>
      </div>
    );
  }
}

AboutWelcome.defaultProps = DEFAULT_WELCOME_CONTENT;

async function mount() {
  const { slug, branch } = await window.AWGetStartupData();
  const settings = branch && branch.value ? branch.value : {};

  ReactDOM.render(
    <AboutWelcome
      experiment={slug}
      branchId={branch && branch.slug}
      {...settings}
    />,
    document.getElementById("root")
  );
}

mount();
