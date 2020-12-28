const path = require("path");

const execa = require("execa");
const Listr = require("listr");
const fse = require("fs-extra");
const rimraf = require("rimraf");

const { setup: setupGit, reset: resetGit } = require("./git.js");
const { getRoot } = require("./workspace.js");
const { getCacheDir } = require("./caching.js");
const { fileExists, folderExists, symlinkExists } = require("./utils.js");

/**
 * Converts a 40 char hex commit ID from mercurial to a name we can use as a git tag without
 * conflicting with git commit ids.
 * @param {*} commit
 */
function tagForCommit(commit) {
  return `mozhg-${commit}`
}

async function use(locales) {
  const root = await getRoot();
  const cache = await getCacheDir("l10n");
  return new Listr(
    Object.keys(locales).map((locale) => {
      const commit = locales[locale];
      const folder = path.join(cache, `${locale}-${commit}`);
      const archive = path.join(cache, `${locale}-${commit}.zip`);
      const url = `https://hg.mozilla.org/l10n-central/${locale}/archive/${commit}.zip`;
      const tasks = new Listr([
        {
          title: "Download",
          skip: () => fileExists(archive),
          task: () => execa("wget", ["-nv", "-O", archive, url]),
        },
        {
          title: "Extract",
          skip: () => folderExists(folder),
          task: () => execa("unzip", ["-d", cache, archive]),
        },
        {
          title: "Git",
          skip: () => folderExists(path.join(folder, ".git")),
          task: () => setupGit(tagForCommit(commit), folder),
        },
        {
          title: "Link",
          task: async () => {
            const linkDir = path.join("l10n", locale);
            if (!(await folderExists("l10n"))) {
              await fse.mkdir(path.join(root, "l10n"));
            }
            if (await symlinkExists(linkDir)) {
              rimraf.sync(linkDir);
            }
            await fse.symlink(folder, linkDir);
          },
        },
      ]);
      return {
        title: locale,
        task: () => tasks,
      };
    })
  );
}

async function reset(locales) {
  return new Listr(
    Object.keys(locales).map((locale) => {
      return {
        title: locale,
        task: () => resetGit(tagForCommit(locales[locale]), `l10n/${locale}`),
      };
    })
  );
}

module.exports = {
  use,
  reset,
  tagForCommit,
};
