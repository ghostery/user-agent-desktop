const path = require("path");

const fsExtra = require("fs-extra");

const { getRoot } = require("../core/workspace.js");
const { folderExists } = require("../core/utils.js");

async function getPathToSourceBranding() {
  const root = await getRoot();
  return path.join(root, "branding", "ghostery");
}

async function getPathToGhosteryBranding() {
  const root = await getRoot();
  return path.join(root, "mozilla-release", "browser", "branding", "ghostery");
}

module.exports = {
  name: "Setup Ghostery branding",
  paths: ["browser/branding/ghostery"],
  skip: async () => folderExists(await getPathToGhosteryBranding()),
  apply: async () =>
    fsExtra.copy(
      await getPathToSourceBranding(),
      await getPathToGhosteryBranding()
    ),
};
