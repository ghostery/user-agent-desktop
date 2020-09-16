const execa = require("execa");
const Listr = require("listr");

const version = require("../patches/app-version.js");
const branding = require('../patches/ghostery-branding.js');
const ghostery = require('../patches/ghostery-extension.js');
const certificates = require('../patches/certificates.js');

const { withCwd } = require("./utils.js");

const PATCHES = [version, ghostery, branding, certificates];

async function commitChanges(patch) {
  await withCwd("mozilla-release", async () => {
    await execa("git", ["add", ...patch.paths]);
    await execa("git", ["commit", "-m", `[fern] ${patch.name}`]);
  });
}

async function applyManagedPatches(workspace) {
  return new Listr(
    PATCHES.map((patch) => ({
      title: `[patch] ${patch.name}`,
      skip: () => patch.skip(workspace),
      task: async () => {
        await patch.apply(workspace);
        await commitChanges(patch);
      },
    }))
  );
}

module.exports = {
  applyManagedPatches,
  patches: PATCHES,
};
