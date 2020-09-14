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

async function getPathToWindowsInstallerIcon() {
  return path.join(
    await getRoot(),
    "mozilla-release",
    "other-licenses",
    "7zstub",
    "firefox",
    "setup.ico"
  );
}

module.exports = {
  name: "Setup Ghostery branding",
  paths: ["browser/branding/ghostery"],
  skip: async () => folderExists(await getPathToGhosteryBranding()),
  apply: async () => {
    await fsExtra.copy(
      await getPathToSourceBranding(),
      await getPathToGhosteryBranding()
    );
    // copy installer icon
    return fsExtra.copy(
      path.join(await getPathToGhosteryBranding(), "setup.ico"),
      await getPathToWindowsInstallerIcon()
    );
  },
};
