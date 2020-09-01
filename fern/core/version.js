const path = require("path");
const execa = require("execa");
const fse = require("fs-extra");

const { withCwd } = require("./utils.js");

async function set(version) {
  const { stdout: commitHash } = await execa("git", [
    "rev-parse",
    "--short",
    "HEAD",
  ]);
  const versionWithHash = `${version} (${commitHash})`;
  await fse.writeFile(
    path.join("mozilla-release", "browser", "config", "version.txt"),
    version
  );
  await fse.writeFile(
    path.join("mozilla-release", "browser", "config", "version_display.txt"),
    versionWithHash
  );
  await withCwd("mozilla-release", async () => {
    await execa("git", ["add", "browser/config/version*"]);
    await execa("git", ["commit", "-m", "Set browser version"]);
  });
}

module.exports = {
  set,
};
