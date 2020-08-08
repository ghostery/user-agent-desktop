const Listr = require("listr");
const process = require("process");

const {
  load: loadWorkspace,
  save: saveWorkspace,
} = require("../core/workspace.js");
const ghostery = require("../core/ghostery.js");
const firefox = require("../core/firefox.js");

module.exports = (program) => {
  program
    .command("use")
    .description("Setup workspace with specified Firefox and Ghostery versions")
    .option("-f, --firefox", "Specify which version of Firefox to use")
    .option("-g, --ghostery", "Specify which version of Ghostery to use")
    .action(
      async ({
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

        if (
          workspace.ghostery === undefined &&
          ghosteryVersionOverride === undefined
        ) {
          console.error(
            "No Ghostery version found in workspace and none specified."
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

        // Setup Ghostery version in workspace
        if (
          ghosteryVersionOverride !== undefined &&
          ghosteryVersionOverride !== workspace.ghostery
        ) {
          workspace.ghostery = ghosteryVersionOverride;
        }

        const tasks = new Listr([
          {
            title: `Setup Firefox ${workspace.firefox}`,
            task: async () => await firefox.use(workspace.firefox),
          },
          {
            title: `Setup Ghostery ${workspace.ghostery}`,
            task: () => ghostery.use(workspace.ghostery),
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
        }
      }
    );
};
