const Listr = require("listr");
const process = require("process");
const fs = require("fs");

const {
  load: loadWorkspace,
  save: saveWorkspace,
} = require("../core/workspace.js");
const addons = require("../core/addons.js");
const firefox = require("../core/firefox.js");

module.exports = (program) => {
  program
    .command("use")
    .description("Setup workspace with specified Firefox and Ghostery versions")
    .option(
      "-f, --firefox <FIREFOX>",
      "Specify which version of Firefox to use"
    )
    .option(
      "-a, --app <APP>",
      "Specify the app version"
    )
    .action(
      async ({
        app: appVersionOverride,
        firefox: firefoxVersionOverride,
        ghostery: ghosteryVersionOverride,
      }) => {
        let workspace = await loadWorkspace();

        if (
          workspace.firefox === undefined &&
          firefoxVersionOverride === undefined
        ) {
          console.error(
            "No Firefox version found in workspace and none specified."
          );
          process.exit(1);
        }

        // Setup firefox version in workspace
        if (
          firefoxVersionOverride !== undefined &&
          firefoxVersionOverride !== workspace.firefox
        ) {
          workspace.firefox = firefoxVersionOverride;
        }

        // Setup app version in workspace
        if (
          appVersionOverride !== undefined &&
          appVersionOverride !== workspace.app
        ) {
          workspace.app = appVersionOverride;
        }

        const tasks = new Listr([
          {
            title: `Setup Firefox ${workspace.firefox}`,
            task: async () => await firefox.use(workspace.firefox),
          },
          {
            title: `Setup Addons`,
            task: () => addons.use(workspace.addons),
          },
          {
            title: "Persist Workspace",
            task: () => saveWorkspace(workspace),
          },
        ]);

        try {
          await tasks.run();
        } catch (ex) {
          /* Handled by `tasks` */
          process.exit(1);
        }
      }
    );
};
