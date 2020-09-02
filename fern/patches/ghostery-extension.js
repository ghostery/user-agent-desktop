const path = require("path");

const fsExtra = require("fs-extra");

const { getRoot } = require("../core/workspace.js");
const { folderExists } = require("../core/utils.js");
const { getPathToCachedGhosteryExtension } = require("../core/ghostery.js");

async function getPathToGhosteryExtension() {
  const root = await getRoot();
  return path.join(
    root,
    "mozilla-release",
    "browser",
    "extensions",
    "ghostery"
  );
}

module.exports = {
  name: "Setup Ghostery extension",
  paths: ["browser/extensions/ghostery"],
  skip: async () => folderExists(await getPathToGhosteryExtension()),
  apply: async ({ ghostery: version }) =>
    fsExtra.copy(
      await getPathToCachedGhosteryExtension(version),
      await getPathToGhosteryExtension()
    ),
};
