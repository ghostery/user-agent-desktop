const path = require("path");

const fsExtra = require("fs-extra");

const { getRoot } = require("../core/workspace.js");

async function getPathToSourceBranding() {
  const root = await getRoot();
  return path.join(root, "brands", "ghostery", "branding");
}

async function getPathToSourceWindowsInstallerIcon() {
  const root = await getRoot();
  return path.join(root, "brands", "ghostery", "windows-installer", "setup.ico");
}

async function getPathToGhosteryBranding() {
  const root = await getRoot();
  return path.join(root, "mozilla-release", "browser", "branding", "ghostery");
}

const windowsInstallerIconPathComponents = [
  "other-licenses",
  "7zstub",
  "firefox",
  "setup.ico",
];

async function getPathToWindowsInstallerIcon() {
  return path.join(
    await getRoot(),
    "mozilla-release",
    ...windowsInstallerIconPathComponents
  );
}

module.exports = {
  name: "Setup Ghostery branding",
  paths: ["browser/branding/ghostery", path.join(...windowsInstallerIconPathComponents)],
  skip: async () => false,
  apply: async () => {
    await fsExtra.copy(
      await getPathToSourceBranding(),
      await getPathToGhosteryBranding()
    );
    // copy installer icon
    return fsExtra.copy(
      await getPathToSourceWindowsInstallerIcon(),
      await getPathToWindowsInstallerIcon()
    );
  },
};
