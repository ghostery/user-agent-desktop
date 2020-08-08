const fs = require('fs');
const process = require('process');

async function symlinkExists(path) {
  try {
    const stats = await fs.promises.lstat(path);
    return stats.isSymbolicLink();
  } catch (ex) {
    return false;
  }
}

async function pathExists(path) {
  try {
    await fs.promises.access(path, fs.constants.F_OK);
    return true;
  } catch (ex) {
    return false;
  }
}

const folderExists = pathExists;
const fileExists = pathExists;

async function ensureFolderExists(path) {
  await fs.promises.mkdir(path, { recursive: true });
}

async function withCwd(path, fn, {
  createIfMissing,
} = {
  createIfMissing: false,
}) {
  const cwd = process.cwd();

  // Optionally create path if missing.
  if (createIfMissing === true && (await folderExists(path)) === false) {
    try {
      await fs.promises.mkdir(path, { recursive: true });
    } catch (ex) {
      console.log(`Path did not exist and cannot be created: ${path}`, ex);
      return undefined;
    }
  }

  // Move to directory and run callback there.
  try {
    process.chdir(path);
    return (await fn());
  } catch (ex) {
    console.error(ex);
  } finally {
    process.chdir(cwd);
  }

  return undefined;
}

module.exports = {
  symlinkExists,
  folderExists,
  fileExists,
  withCwd,
  ensureFolderExists,
};
