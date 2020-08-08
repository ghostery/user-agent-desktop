const stream = require("stream");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");

const got = require("got");
const execa = require("execa");
const Listr = require("listr");
const rimraf = require("rimraf");

const { setup: setupGit, reset: resetGit } = require("./git.js");
const { getRoot } = require("./workspace.js");
const caching = require("./caching.js");
const {
  fileExists,
  folderExists,
  symlinkExists,
  ensureFolderExists,
} = require("./utils.js");

async function use(version) {
  // TODO - use 'caching.js' for that instead!
  const root = await getRoot();
  const cache = path.join(root, ".cache", "firefox", `${version}`);
  const folder = path.join(cache, `firefox-${version}`);
  const archive = path.join(cache, `firefox-${version}.source.tar.xz`);
  const git = path.join(folder, ".git");
  const url = `https://archive.mozilla.org/pub/firefox/releases/${version}/source/firefox-${version}.source.tar.xz`;

  await ensureFolderExists(cache); // TODO - use 'caching.js' instead!

  return new Listr([
    {
      title: "Download",
      skip: () => fileExists(archive),
      task: () =>
        promisify(stream.pipeline)(
          got.stream(url),
          fs.createWriteStream(archive)
        ),
    },
    {
      title: "Extract",
      skip: () => folderExists(folder),
      task: () => execa("tar", ["-xvf", archive, "-C", cache]),
    },
    {
      title: "Git",
      skip: () => folderExists(git),
      task: () => setupGit(version, folder),
    },
    {
      title: "Link",
      task: async () => {
        // Clean-up existing symlink
        if (await symlinkExists("mozilla-release")) {
          rimraf.sync("mozilla-release");
        }

        // Make sure there is no folder named 'mozilla-release'
        if (await folderExists("mozilla-release")) {
          throw new Error(
            'Existing "mozilla-release" path: Cannot be overriden safely!'
          );
        }

        // Create symlink!
        await fs.promises.symlink(folder, "mozilla-release");
      },
    },
  ]);
}

function reset(version) {
  return new Listr([
    {
      title: "Git",
      task: () => resetGit(version, 'mozilla-release'),
    },
  ]);
}


module.exports = {
  use,
  reset,
};
