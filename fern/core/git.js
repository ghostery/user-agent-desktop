const fs = require("fs");
const path = require("path");

const execa = require("execa");
const Listr = require("listr");
const rimraf = require("rimraf");

const { withCwd, folderExists, fileExists } = require("./utils.js");

async function setupIdentity() {
  // Set 'user.name' if needed
  try {
    await execa("git", ["config", "--get", "user.name"]);
  } catch (ex) {
    await execa("git", ["config", "user.name", "Jenkins"]);
  }

  // Set 'user.email' if needed
  try {
    await execa("git", ["config", "--get", "user.email"]);
  } catch (ex) {
    await execa("git", ["config", "user.email", "jenkins@magrathea"]);
  }
}

async function setup(version, folder) {
  return new Listr([
    {
      title: "init",
      task: () => withCwd(folder, () => execa("git", ["init"])),
    },
    {
      title: "identity",
      task: () => withCwd(folder, () => setupIdentity()),
    },
    {
      title: "orphan",
      task: () =>
        withCwd(folder, () =>
          execa("git", ["checkout", "--orphan", `${version}`])
        ),
    },
    {
      title: "add",
      task: () => withCwd(folder, () => execa("git", ["add", "*", ".*"])),
    },
    {
      title: "commit",
      task: () =>
        withCwd(folder, () =>
          execa("git", ["commit", "-am", `'Firefox ${version}'`])
        ),
    },
    {
      title: "checkout",
      task: () =>
        withCwd(folder, () => execa("git", ["checkout", "-b", "workspace"])),
    },
  ]);
}

async function reset(version, folder) {
  return new Listr([
    {
      title: `checkout ${version}`,
      task: () =>
        withCwd(folder, () => execa("git", ["checkout", `${version}`])),
    },
    {
      title: "branch -D workspace",
      task: () =>
        withCwd(folder, () => execa("git", ["branch", "-D", "workspace"])),
    },
    {
      title: "checkout -b workspace",
      task: () =>
        withCwd(folder, () => execa("git", ["checkout", "-b", "workspace"])),
    },
  ]);
}

function exportPatches(root, version) {
  const patchesFolder = path.join(root, "patches");

  return new Listr([
    {
      title: "Reset 'patches' folder",
      task: async () => {
        rimraf.sync("patches");
        await fs.promises.mkdir("patches");
      },
    },
    {
      title: "Export patches",
      task: () =>
        withCwd("mozilla-release", async () => {
          await execa("git", [
            "format-patch",
            `${version}`,
            "--minimal", // Spend extra time to make sure the smallest possible diff is produced.
            "--no-numbered", // Name output in [PATCH] format.
            "--keep-subject", // Do not strip/add [PATCH] from the first line of the commit log message.
            "--output-directory",
            patchesFolder,
          ]);

          // Get list of patches
          const patches = (await fs.promises.readdir(patchesFolder))
            .filter((filename) => filename.endsWith(".patch"))
            .sort();

          // Normalize patches by removing the first line
          await Promise.all(
            patches.map(async (patchName) => {
              const patchPath = path.join(patchesFolder, patchName);
              const patch = await fs.promises.readFile(patchPath, "utf-8");
              await fs.promises.writeFile(
                patchPath,
                patch.slice(patch.indexOf("\n") + 1),
                "utf-8"
              );
            })
          );

          // Generate .index
          await fs.promises.writeFile(
            path.join(patchesFolder, ".index"),
            patches.join("\n"),
            "utf-8"
          );
        }),
    },
  ]);
}

function importPatches(root) {
  const patchesFolder = path.join(root, "patches");
  const patchesIndex = path.join(patchesFolder, ".index");

  return new Listr([
    {
      title: "Import patches",
      task: () =>
        withCwd("mozilla-release", async () => {
          if ((await folderExists(patchesFolder)) === false) {
            throw new Error("Patches folder does not exist.");
          }

          if ((await fileExists(patchesIndex)) === false) {
            throw new Error("Patches index file does not exist.");
          }

          const patches = (await fs.promises.readFile(patchesIndex, "utf-8"))
            .trim()
            .split("\n")
            .map((filename) => path.join(patchesFolder, filename));

          await execa("git", [
            "am",
            "--ignore-space-change",
            "--ignore-whitespace",
            ...patches,
          ]);
        }),
    },
  ]);
}

module.exports = {
  setup,
  reset,
  exportPatches,
  importPatches,
};
