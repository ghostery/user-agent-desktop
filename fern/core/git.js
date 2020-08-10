const fs = require("fs");
const path = require("path");

const execa = require("execa");
const Listr = require("listr");
const rimraf = require("rimraf");

const { withCwd, folderExists, fileExists } = require("./utils.js");

async function setup(version, folder) {
  return new Listr([
    {
      title: "init",
      task: () => withCwd(folder, () => execa("git", ["init"])),
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
            "--output-directory",
            patchesFolder,
          ]);

          await fs.promises.writeFile(
            path.join(patchesFolder, ".index"),
            (await fs.promises.readdir(patchesFolder))
              .filter((filename) => filename.endsWith(".patch"))
              .sort()
              .join("\n"),
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
