const Listr = require("listr");
const process = require("process");

const workspace = require("../core/workspace.js");
const { reset: resetFirefox } = require('../core/firefox.js');

module.exports = (program) => {
  program
    .command("reset")
    .description("Reset mozilla-folder to initial state (WARNING: make sure you saved all your changes)")
    .action(
      async () => {
        let { firefox } = await workspace.load();

        if (firefox === undefined) {
          console.error(
            "Firefox version missing from workspace, make sure to run 'fern.js use'."
          );
          process.exit(1);
        }


        const tasks = new Listr([
          {
            title: `Reset Firefox to ${firefox}`,
            task: () => resetFirefox(firefox),
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
