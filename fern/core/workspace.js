const path = require("path");
const fs = require("fs");

const WORKSPACE_FILENAME = ".workspace";

async function fileExists(filepath) {
  try {
    await fs.promises.access(filepath, fs.constants.F_OK);
    return true;
  } catch (ex) {
    return false;
  }
}

async function getRoot() {
  const fragments = [__dirname];
  while (
    (await fs.promises.readdir(path.join(...fragments))).includes(".git") ===
    false
  ) {
    fragments.push("..");
  }
  return path.resolve(...fragments);
}

async function getWorkspaceFilePath() {
  const root = await getRoot();
  return path.join(root, WORKSPACE_FILENAME);
}

async function load() {
  const workspaceFile = await getWorkspaceFilePath();
  if (await fileExists(workspaceFile)) {
    const raw = await fs.promises.readFile(workspaceFile, "utf-8");

    try {
      const workspace = JSON.parse(raw);
      // TODO - validate
      return workspace;
    } catch (ex) {
      throw new Error(
        `Could not load '.workspace' file, should be valid JSON.`
      );
    }
  }

  return {
    app: undefined,
    firefox: undefined,
    ghostery: undefined,
  };
}

async function save(workspace) {
  await fs.promises.writeFile(
    await getWorkspaceFilePath(),
    JSON.stringify(workspace, null, 2),
    "utf-8"
  );
}

module.exports = {
  getRoot,
  load,
  save,
};
