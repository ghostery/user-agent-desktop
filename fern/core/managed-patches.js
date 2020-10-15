const execa = require("execa");
const Listr = require("listr");

const version = require("../patches/app-version.js");
const branding = require('../patches/ghostery-branding.js');
const addons = require('../patches/addons.js');
const certificates = require('../patches/certificates.js');
const hardcoded = require('../patches/hardcoded-strings.js');

const { withCwd } = require("./utils.js");

const PATCHES = [version, addons, branding, certificates, hardcoded];

async function commitChanges(patch) {
  await withCwd("mozilla-release", async () => {
    await execa("git", ["add", ...patch.paths]);
    await execa("git", ["commit", "-m", `[fern] ${patch.name}`]);
  });
}

async function applyManagedPatches(workspace) {
  return new Listr(
    PATCHES.map(patchFactory => {
      const patch = patchFactory(workspace);
      return {
        title: `[patch] ${patch.name}`,
        skip: () => patch.skip(),
        task: async () => {
          await patch.apply();
          await commitChanges(patch);
        },
      };
    })
  );
}

module.exports = {
  applyManagedPatches,
  patches: PATCHES,
};
