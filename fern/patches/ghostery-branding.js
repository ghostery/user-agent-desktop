const path = require("path");

const fsExtra = require("fs-extra");

const { getRoot } = require("../core/workspace.js");

async function getPathToSourceBranding() {
  const root = await getRoot();
  return path.join(root, "brands", "ghostery", "branding");
}

async function getPathToSourceWindowsInstaller() {
  const root = await getRoot();
  return path.join(root, "brands", "ghostery", "windows-installer", "7zSD.Win32.sfx");
}

async function getPathToGhosteryBranding() {
  const root = await getRoot();
  return path.join(root, "mozilla-release", "browser", "branding", "ghostery");
}

const windowsInstallerPathComponents = [
  "other-licenses",
  "7zstub",
  "firefox",
  "7zSD.Win32.sfx",
];

async function getPathToWindowsInstallerIcon() {
  return path.join(
    await getRoot(),
    "mozilla-release",
    ...windowsInstallerPathComponents
  );
}

module.exports = {
  name: "Setup Ghostery branding",
  paths: ["browser/branding/ghostery", path.join(...windowsInstallerPathComponents)],
  skip: async () => false,
  apply: async () => {
    await fsExtra.copy(
      await getPathToSourceBranding(),
      await getPathToGhosteryBranding()
    );
    // copy installer icon
    return fsExtra.copy(
      await getPathToSourceWindowsInstaller(),
      await getPathToWindowsInstallerIcon()
    );
  },
};
