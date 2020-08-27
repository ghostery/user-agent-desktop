const path = require("path");
const execa = require("execa");
const fse = require("fs-extra");

async function set(version) {
  const { stdout: commitHash } = await execa("git", [
    "rev-parse",
    "--short",
    "HEAD",
  ]);
  const versionString = `${version} (${commitHash})`;
  await fse.writeFile(
    path.join("mozilla-release", "browser", "config", "version.txt"),
    versionString
  );
  await fse.writeFile(
    path.join("mozilla-release", "browser", "config", "version_display.txt"),
    versionString
  );
}

module.exports = {
  set,
};
