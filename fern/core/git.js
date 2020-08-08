const execa = require("execa");
const Listr = require("listr");

const { withCwd } = require("./utils.js");

async function setup(version, folder) {
  return new Listr([
    {
      title: "init",
      task: () => withCwd(folder, () => execa("git", ["init"])),
    },
    {
      title: "orphan",
      task: () =>
        withCwd(folder, () =>
          execa("git", ["checkout", "--orphan", `${version}`])
        ),
    },
    {
      title: "add",
      task: () => withCwd(folder, () => execa("git", ["add", "*", ".*"])),
    },
    {
      title: "commit",
      task: () =>
        withCwd(folder, () =>
          execa("git", ["commit", "-am", `'Firefox ${version}'`])
        ),
    },
    {
      title: "checkout",
      task: () =>
        withCwd(folder, () => execa("git", ["checkout", "-b", "workspace"])),
    },
  ]);
}

async function reset(version, folder) {
  return new Listr([
    {
      title: `checkout ${version}`,
      task: () =>
        withCwd(folder, () => execa("git", ["checkout", `${version}`])),
    },
    {
      title: "branch -D workspace",
      task: () =>
        withCwd(folder, () => execa("git", ["branch", "-D", "workspace"])),
    },
    {
      title: "checkout -b workspace",
      task: () => withCwd(folder, () => execa("git", ["checkout", "-b", "workspace"])),
    },
  ]);
}

module.exports = {
  setup,
  reset,
};
