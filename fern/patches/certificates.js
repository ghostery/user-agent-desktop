const path = require("path");

const fsExtra = require("fs-extra");

const { getRoot } = require("../core/workspace.js");

async function getPathToSourceCertificates() {
  const root = await getRoot();
  return path.join(root, "brands", "ghostery", "certificates");
}

const updaterPathComponents = ["toolkit", "mozapps", "update", "updater"];

async function getPathToTargetCertificates() {
  const root = await getRoot();
  return path.join(root, "mozilla-release", ...updaterPathComponents);
}

module.exports = () => ({
  name: "Setup certificates",
  paths: [path.join(...updaterPathComponents)],
  skip: async () => false,
  apply: async () => {
    await fsExtra.copy(
      await getPathToSourceCertificates(),
      await getPathToTargetCertificates()
    );
  },
});
