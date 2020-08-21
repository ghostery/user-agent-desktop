const path = require("path");

const { getRoot } = require("./workspace.js");
const { ensureFolderExists } = require("./utils.js");

const CACHE_FOLDER = ".cache";

async function getCacheDir(...keys) {
  const root = await getRoot();
  const cache = path.join(root, CACHE_FOLDER, ...keys);
  await ensureFolderExists(cache);
  return cache;
}

module.exports = {
  getCacheDir,
};
