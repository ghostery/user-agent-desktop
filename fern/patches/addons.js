const path = require("path");
const fsExtra = require("fs-extra");
const fs = require("fs").promises;


const { getRoot } = require("../core/workspace.js");
const { getPathToCachedAddon } = require("../core/addons.js");

async function getPathToAddons() {
  const root = await getRoot();
  return path.join(
    root,
    "mozilla-release",
    "browser",
    "extensions",
  );
}

async function getPathToAddon(addonName) {
  const addonsPath = await getPathToAddons();
  return path.join(
    addonsPath,
    addonName,
  );
}

const MOZ_BUILD_FILE_NAME =  "moz.build";

async function getPathToAddonMozBuild() {
  const addonsPath = await getPathToAddons();
  return path.join(
    addonsPath,
    MOZ_BUILD_FILE_NAME,
  );
}

const generateAddonMozBuild = (addonNames) => `
# -*- Mode: python; indent-tabs-mode: nil; tab-width: 40 -*-
# vim: set filetype=python:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

DIRS += [
${addonNames.map(addonName => `    "${addonName}"`).join(',\n')}
]

if CONFIG["NIGHTLY_BUILD"]:
    DIRS += [
        "translations",
    ]
`;

module.exports = (workspace) => {
  const addonNames = Object.keys(workspace.addons);
  const firefoxAddonName = workspace.firefoxAddons;
  const allAddonName = [...addonNames, ...firefoxAddonName].sort();
  return {
    name: "Setup Addons",
    paths: [
      ...addonNames.map(addonName => `browser/extensions/${addonName}`),
      `browser/extensions/${MOZ_BUILD_FILE_NAME}`,
    ],
    skip: () => false,
    apply: async () => {
        return Promise.all(
          addonNames.map(async addonName => {
            return fsExtra.copy(
              await getPathToCachedAddon(addonName, workspace.addons[addonName]),
              await getPathToAddon(addonName)
            );
          }),
          fs.writeFile(
            await getPathToAddonMozBuild(),
            generateAddonMozBuild(allAddonName),
          ),
        );
      }
  };
};
