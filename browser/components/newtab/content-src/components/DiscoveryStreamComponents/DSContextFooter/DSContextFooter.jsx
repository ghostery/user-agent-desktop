/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { cardContextTypes } from "../../Card/types.js";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import React from "react";

// Animation time is mirrored in DSContextFooter.scss
const ANIMATION_DURATION = 3000;

export const StatusMessage = ({ icon, fluentID }) => (
  <div className="status-message">
    <span
      aria-haspopup="true"
      className={`story-badge-icon icon icon-${icon}`}
    />
    <div className="story-context-label" data-l10n-id={fluentID} />
  </div>
);

export class DSContextFooter extends React.PureComponent {
  render() {
    // display_engagement_labels is based on pref `browser.newtabpage.activity-stream.discoverystream.engagementLabelEnabled`
    const {
      context,
      context_type,
      engagement,
      display_engagement_labels,
    } = this.props;
    const { icon, fluentID } = cardContextTypes[context_type] || {};

    return (
      <div className="story-footer">
        {context && <p className="story-sponsored-label clamp">{context}</p>}
        <TransitionGroup component={null}>
          {!context &&
            (context_type || (display_engagement_labels && engagement)) && (
              <CSSTransition
                key={fluentID}
                timeout={ANIMATION_DURATION}
                classNames="story-animate"
              >
                {engagement && !context_type ? (
                  <div className="story-view-count">{engagement}</div>
                ) : (
                  <StatusMessage icon={icon} fluentID={fluentID} />
                )}
              </CSSTransition>
            )}
        </TransitionGroup>
      </div>
    );
  }
}
