/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

export const AboutWelcomeUtils = {
  handleUserAction(action) {
    switch (action.type) {
      case "OPEN_AWESOME_BAR":
      case "OPEN_PRIVATE_BROWSER_WINDOW":
      case "SHOW_MIGRATION_WIZARD":
        window.AWSendToParent(action.type);
        break;
      case "OPEN_URL":
        window.open(action.data.args);
        break;
    }
  },
  sendEvent(type, detail) {
    document.dispatchEvent(
      new CustomEvent(`AWPage:${type}`, {
        bubbles: true,
        detail,
      })
    );
  },
};

export const DEFAULT_WELCOME_CONTENT = {
  title: {
    string_id: "onboarding-welcome-header",
  },
  startButton: {
    label: {
      string_id: "onboarding-start-browsing-button-label",
    },
    message_id: "START_BROWSING_BUTTON",
    action: {
      type: "OPEN_AWESOME_BAR",
    },
  },
  cards: [
    {
      content: {
        title: {
          string_id: "onboarding-data-sync-title",
        },
        text: {
          string_id: "onboarding-data-sync-text2",
        },
        icon: "devices",
        primary_button: {
          label: {
            string_id: "onboarding-data-sync-button2",
          },
          action: {
            type: "OPEN_URL",
            addFlowParams: true,
            data: {
              args:
                "https://accounts.firefox.com/?service=sync&action=email&context=fx_desktop_v3&entrypoint=activity-stream-firstrun&style=trailhead",
              where: "tabshifted",
            },
          },
        },
      },
      id: "TRAILHEAD_CARD_2",
      order: 1,
      blockOnClick: false,
    },
    {
      content: {
        title: {
          string_id: "onboarding-firefox-monitor-title",
        },
        text: {
          string_id: "onboarding-firefox-monitor-text2",
        },
        icon: "ffmonitor",
        primary_button: {
          label: {
            string_id: "onboarding-firefox-monitor-button",
          },
          action: {
            type: "OPEN_URL",
            data: {
              args: "https://monitor.firefox.com/",
              where: "tabshifted",
            },
          },
        },
      },
      id: "TRAILHEAD_CARD_3",
      order: 2,
      blockOnClick: false,
    },
    {
      content: {
        title: {
          string_id: "onboarding-browse-privately-title",
        },
        text: {
          string_id: "onboarding-browse-privately-text",
        },
        icon: "private",
        primary_button: {
          label: {
            string_id: "onboarding-browse-privately-button",
          },
          action: {
            type: "OPEN_PRIVATE_BROWSER_WINDOW",
          },
        },
      },
      id: "TRAILHEAD_CARD_4",
      order: 3,
      blockOnClick: true,
    },
  ],
};
