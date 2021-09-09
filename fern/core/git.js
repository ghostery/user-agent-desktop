const fs = require("fs");
const path = require("path");

const Listr = require("listr");
const chalk = require("chalk");
const execa = require("execa");
const rimraf = require("rimraf");

const workspace = require("./workspace.js");
const { withCwd, folderExists, fileExists } = require("./utils.js");
const {
  patches: managedPatches,
  applyManagedPatches,
  applyManagedLocalePatches,
} = require("./managed-patches.js");

async function abortPendingGitOperations() {
  for (const op of ["am", "rebase", "merge"]) {
    try {
      await execa("git", [op, "--abort"]);
    } catch (ex) {
      /* Fails if none ongoing. */
    }
  }
}

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
      title: "abort pending (if any)",
      skip: async () =>
        (await folderExists(
          path.join("mozilla-release", ".git", "rebase-apply")
        )) === false,
      task: () => withCwd(folder, abortPendingGitOperations),
    },
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

async function exportPatchesToFolder(patchesFolder, startTag, offset = 0) {
  // count number of back commits to the initial code dump. We use this to exclude a fixed number of commits that we added after the initial commit
  const { stdout: commitCount } = await execa("git", [
    "rev-list",
    "--count",
    `${startTag}..HEAD`,
  ]);

  await execa("git", [
    "format-patch",
    `HEAD~${parseInt(commitCount) - offset}`,
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
}

function exportPatches(root, version, locales) {
  const patchesFolder = path.join(root, "patches");

  const tasks = [
    {
      title: "Reset 'patches' folder",
      task: async () => {
        rimraf.sync(patchesFolder);
        await fs.promises.mkdir(patchesFolder);
      },
    },
    {
      title: "Export patches",
      task: () =>
        withCwd("mozilla-release", () =>
          exportPatchesToFolder(patchesFolder, version, managedPatches.length)
        ),
    },
    {
      title: "Reset 'l10n-patches' folders",
      task: async () => {
        const folder = path.join(root, "l10n-patches");
        rimraf.sync(folder);
        await fs.promises.mkdir(folder);
        await Promise.all(
          Object.keys(locales).map((locale) =>
            fs.promises.mkdir(path.join(folder, locale))
          )
        );
      },
    },
  ];
  Object.keys(locales).forEach((locale) => {
    tasks.push({
      title: `Export translation patches: ${locale}`,
      task: () =>
        withCwd(`l10n/${locale}`, async () => {
          try {
            await exportPatchesToFolder(
              path.join(root, "l10n-patches", locale),
              `mozhg-${locales[locale]}`,
              1
            );
          } catch (e) {
            // nothing to do
          }
        }),
    });
  });
  return new Listr(tasks);
}

async function importFromPatchFiles(patchesFolder) {
  const patchesIndex = path.join(patchesFolder, ".index");
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

  try {
    await execa("git", [
      "am",
      "--ignore-space-change",
      "--ignore-whitespace",
      ...patches,
    ]);
  } catch (ex) {
    // Catch error and raw exception with more details.

    console.error();
    console.error(chalk.bold(chalk.red("Error while importing patches...")));
    console.error(ex.shortMessage);

    const stdout = ex.stdout.trim();
    if (stdout) {
      console.error(chalk.bold(chalk.magenta("STDOUT")), ex.stdout.trim());
    }

    const stderr = ex.stderr.trim();
    if (stderr) {
      console.error(chalk.bold(chalk.red("STDERR")), ex.stderr.trim());
    }

    const { stdout: details } = await execa("git", [
      "am",
      "--show-current-patch=raw",
    ]);

    console.error(chalk.bold(chalk.yellow("PATCH:")), details.trim());

    throw ex;
  }
}

async function importPatches(root) {
  const ws = await workspace.load();
  const tasks = [
    {
      title: "Import patches managed by fern",
      task: async () => applyManagedPatches(ws),
    },
    {
      title: "Import patches managed by minions",
      task: () =>
        withCwd("mozilla-release", () =>
          importFromPatchFiles(path.join(root, "patches"))
        ),
    },
    {
      title: "Import translations",
      task: () => {
        const l10nTasks = []
        Object.keys(ws.locales).forEach((locale) => {
          const patchPath = path.join(root, "l10n-patches", locale);
          l10nTasks.push({
            title: `${locale}`,
            task: async () => applyManagedLocalePatches({ ...ws, locale }),
          });
          l10nTasks.push({
            title: `patches: ${locale}`,
            skip: async () => !(await folderExists(patchPath)),
            task: () =>
              withCwd(`l10n/${locale}`, () => importFromPatchFiles(patchPath)),
          });
        });
        return new Listr(l10nTasks)
      }
    }
  ];
  return new Listr(tasks);
}

module.exports = {
  setup,
  reset,
  exportPatches,
  importPatches,
};
