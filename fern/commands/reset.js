const Listr = require("listr");
const process = require("process");

const workspace = require("../core/workspace.js");
const { reset: resetFirefox } = require('../core/firefox.js');
const version = require("../core/version.js");

module.exports = (program) => {
  program
    .command("reset")
    .description("Reset mozilla-folder to initial state (WARNING: make sure you saved all your changes)")
    .action(
      async () => {
        let { firefox, ghostery, app } = await workspace.load();

        if (firefox === undefined || ghostery === undefined) {
          console.error(
            "Firefox or Ghostery version missing from workspace, make sure to run 'fern.js use'."
          );
          process.exit(1);
        }


        const tasks = new Listr([
          {
            title: `Reset Firefox to ${firefox}`,
            task: () => resetFirefox(firefox),
          },
          {
            title: `Set app version to ${app}`,
            task: () => version.set(app),
          }
        ]);

        try {
          await tasks.run();
        } catch (ex) {
          /* Handled by `tasks` */
        }
      }
    );
};
