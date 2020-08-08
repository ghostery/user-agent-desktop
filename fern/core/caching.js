const path = require('path');
const fs = require('fs');
const process = require('process');

const { getRoot } = require('./workspace.js');
const { fileExists, folderExists } = require('./utils.js');

const CACHE_FOLDER = '.cache';

async function getCacheFolderPath(keys) {
  return path.join(await getRoot(), CACHE_FOLDER, ...keys);
}

async function ensureCacheFolderExists(keys) {
  console.log('Ensure cache exists', keys);
  const folder = await getCacheFolderPath(keys);
  await fs.promises.mkdir(folder, { recursive: true });
  return folder;
}

async function has(keys) {
  const folder = await ensureCacheFolderExists(keys);
  console.log('CACHING HAS', folder);
  return undefined;
}

async function get(keys) {
  const folder = await ensureCacheFolderExists(keys);
  console.log('CACHING GET', folder);
  return undefined;
}

async function set(keys, blob) {
  const folder = await ensureCacheFolderExists(keys);
  console.log('CACHING SET', folder);
  return undefined;
}

async function withCaching(keys, fn) {
  const folder = await getCacheFolderPath(keys);

  if (await folderExists(folder)) {
    return folder;
  }

  console.log('> exists?', await folderExists(folder));
}

module.exports = {
  has,
  get,
  set,
  withCaching,
};

// TODO - cache folder.
// TODO - cache file.
// TODO - load cached.
// TODO - run a function only if not already cached.
