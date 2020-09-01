const stream = require("stream");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");

const got = require("got");
const execa = require("execa");
const Listr = require("listr");
const readdir = require("recursive-readdir");

const { getCacheDir } = require("./caching.js");
const { fileExists, folderExists, ensureFolderExists } = require("./utils.js");

async function getPathToGhosteryCache(version) {
  return getCacheDir("ghostery", `${version}`);
}

async function getPathToCachedGhosteryExtension(version) {
  const cache = await getPathToGhosteryCache(version);
  return path.join(cache, `ghostery-firefox-${version}`);
}

async function use(version) {
  const cache = await getPathToGhosteryCache(version);
  const folder = await getPathToCachedGhosteryExtension(version);
  const archive = path.join(cache, `ghostery-firefox-${version}.zip`);
  const url = `https://github.com/ghostery/ghostery-extension/releases/download/${version}/ghostery-firefox-${version}.zip`;

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
      task: async () => {
        await ensureFolderExists(folder);
        await execa("unzip", [archive, "-d", folder]);
      },
    },
    {
      title: "Moz.build",
      task: async () => {
        fs.promises.writeFile(
          path.join(folder, "moz.build"),
          [
            "# -*- Mode: python; indent-tabs-mode: nil; tab-width: 40 -*-",
            "# vim: set filetype=python:",
            "# This Source Code Form is subject to the terms of the Mozilla Public",
            "# License, v. 2.0. If a copy of the MPL was not distributed with this",
            "# file, You can obtain one at http://mozilla.org/MPL/2.0/.",
            "",
            'DEFINES["MOZ_APP_VERSION"] = CONFIG["MOZ_APP_VERSION"]',
            'DEFINES["MOZ_APP_MAXVERSION"] = CONFIG["MOZ_APP_MAXVERSION"]',
            "",
            'id = "firefox@ghostery.com"',
            "",
            `files = """${(await readdir(folder))
              .map((filename) => filename.slice(folder.length + 1))
              .sort()
              .join("\n")}"""`,
            "",
            'for path in files.split("\\n"):',
            "    root = FINAL_TARGET_FILES.features[id]",
            '    parts = path.split("/")',
            "    for folder in parts[:-1]:",
            "        root = root[folder]",
            "    root += [path]",
          ].join("\n"),
          "utf-8"
        );
      },
    },
  ]);
}

module.exports = {
  getPathToCachedGhosteryExtension,
  use,
};
