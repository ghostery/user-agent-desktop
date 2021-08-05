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
const privateBrowsingIconPaths = [
  ["browser", "themes","shared","icons", "indicator-private-browsing.svg"],
  ["browser", "themes","shared","icons","privateBrowsing.svg"],
  ["browser", "themes", "shared", "privatebrowsing", "favicon.svg"],
  ["browser", "themes", "shared", "privatebrowsing", "private-browsing.svg"]
];

async function getTargetPath(pathComponents) {
  return path.join(
    await getRoot(),
    "mozilla-release",
    ...pathComponents,
  );
}

async function copy(fromPath, ...to) {
  const from = path.join(await getRoot(), ...fromPath);
  return Promise.all(to.map(async (toPath) => {
    return fsExtra.copy(
      from,
      await getTargetPath(toPath)
    )
  }));
}

module.exports = () => ({
  name: "Setup Ghostery branding",
  paths: [
    brandingPathComponents,
    windowsInstallerPathComponents,
    devToolsIconsPathComponents,
    ...privateBrowsingIconPaths
  ].map(p => path.join(...p)),
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
    await fsExtra.copy(
      await getPathToSourceDevToolsIcons(),
      await getTargetPath(devToolsIconsPathComponents)
    );
    // white ghosty private tab logo
    await copy(
      ["brands", "ghostery", "branding", "content", "private-ghosty-logo-white.svg"],
      ["browser", "themes", "shared", "icons", "indicator-private-browsing.svg"],
      ["browser", "themes", "shared", "privatebrowsing", "private-browsing.svg"],
    );
    // context-fill ghosty private tab logo
    return copy(
      ["brands", "ghostery", "branding", "content", "private-ghosty-logo.svg"],
      ["browser", "themes","shared","icons","privateBrowsing.svg"],
      ["browser", "themes", "shared", "privatebrowsing", "favicon.svg"],
    );
  },
});
