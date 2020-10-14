const path = require("path");

const fsExtra = require("fs-extra");

const { getRoot } = require("../core/workspace.js");
const { folderExists } = require("../core/utils.js");
const { getPathToCachedAddon } = require("../core/addons.js");

async function getPathToAddon(addonName) {
  const root = await getRoot();
  return path.join(
    root,
    "mozilla-release",
    "browser",
    "extensions",
    addonName
  );
}

module.exports = (workspace) => {
  const addonNames = Object.keys(workspace.addons);
  return {
    name: "Setup Addons",
    paths: addonNames.map(addonName => `browser/extensions/${addonName}`),
    skip: () => false,
    apply: async () => {
        return Promise.all(addonNames.map(async addonName => {
          return fsExtra.copy(
            await getPathToCachedAddon(addonName, workspace.addons[addonName]),
            await getPathToAddon(addonName)
          );
        }));
      }
  };
};
