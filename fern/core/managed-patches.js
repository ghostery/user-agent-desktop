const execa = require("execa");
const Listr = require("listr");

const version = require("../patches/app-version.js");
const branding = require("../patches/ghostery-branding.js");
const addons = require("../patches/addons.js");
const certificates = require("../patches/certificates.js");
const hardcoded = require("../patches/hardcoded-strings.js");
const l10n = require("../patches/l10n.js");

const { withCwd } = require("./utils.js");

const PATCHES = [version, addons, branding, certificates, hardcoded, l10n];

async function commitChanges(patch, wd = "mozilla-release") {
  await withCwd(wd, async () => {
    await execa("git", ["add", ...patch.paths]);
    await execa("git", ["commit", "-m", `[fern] ${patch.name}`]);
  });
}

async function applyManagedPatches(workspace) {
  workspace.locale = "en-US";
  return new Listr(
    PATCHES.map((patchFactory) => {
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

async function applyManagedLocalePatches(workspace) {
  return new Listr(
    [l10n].map((patchFactory) => {
      const patch = patchFactory(workspace);
      return {
        title: `[patch] ${patch.name}`,
        skip: () => patch.skip(),
        task: async () => {
          await patch.apply();
          await commitChanges(patch, `l10n/${workspace.locale}`);
        },
      };
    })
  );
}

module.exports = {
  applyManagedPatches,
  applyManagedLocalePatches,
  patches: PATCHES,
};
