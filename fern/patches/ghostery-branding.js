const path = require("path");

const fsExtra = require("fs-extra");

const { getRoot } = require("../core/workspace.js");

async function getPathToSourceBranding() {
  const root = await getRoot();
  return path.join(root, "brands", "ghostery", "branding");
}

async function getPathToSourceDevToolsIcons() {
  const root = await getRoot();
  return path.join(root, "brands", "ghostery", "devtools", "client", "themes", "images");
}

async function getPathToSourceWindowsInstaller() {
  const root = await getRoot();
  return path.join(root, "brands", "ghostery", "windows-installer", "7zSD.Win32.sfx");
}


const brandingPathComponents = ["browser", "branding", "ghostery"];
const windowsInstallerPathComponents = ["other-licenses", "7zstub", "firefox", "7zSD.Win32.sfx"];
const devToolsIconsPathComponents = ["devtools", "client", "themes", "images"];

async function getTargetPath(pathComponents) {
  return path.join(
    await getRoot(),
    "mozilla-release",
    ...pathComponents,
  );
}

module.exports = () => ({
  name: "Setup Ghostery branding",
  paths: [
    path.join(...brandingPathComponents),
    path.join(...windowsInstallerPathComponents),
    path.join(...devToolsIconsPathComponents),
  ],
  skip: async () => false,
  apply: async () => {
    await fsExtra.copy(
      await getPathToSourceBranding(),
      await getTargetPath(brandingPathComponents)
    );
    // copy installer icon
    await fsExtra.copy(
      await getPathToSourceWindowsInstaller(),
      await getTargetPath(windowsInstallerPathComponents)
    );
    // copy devtools icons
    return fsExtra.copy(
      await getPathToSourceDevToolsIcons(),
      await getTargetPath(devToolsIconsPathComponents)
    );
  },
});
