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
const { getCacheDir } = require("./caching.js");
const { fileExists, folderExists, symlinkExists } = require("./utils.js");

async function use(version, ipfsGateway, ipfsAddr) {
  const root = await getRoot();
  const cache = await getCacheDir("firefox", `${version}`);
  const folder = path.join(cache, `firefox-${version.split('b')[0]}`);
  const archive = path.join(cache, `firefox-${version}.source.tar.xz`);
  const git = path.join(folder, ".git");
  const baseUrl = ipfsGateway ? `${ipfsGateway}${ipfsAddr}` : "https://archive.mozilla.org/pub";
  const url = `${baseUrl}/firefox/releases/${version}/source/firefox-${version}.source.tar.xz`;
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
    {
      title: "Populate Build Folder",
      task: async () => {
        await fs.promises.copyFile(
          path.join(folder, "taskcluster/scripts/misc/fetch-content"),
          path.join(root, "build", "fetch-content")
        );
      },
    },
  ]);
}

function reset(version) {
  return new Listr([
    {
      title: "Git",
      task: () => resetGit(version, "mozilla-release"),
    },
  ]);
}

module.exports = {
  use,
  reset,
};
