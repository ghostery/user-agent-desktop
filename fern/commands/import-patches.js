const process = require('process');

const workspace = require("../core/workspace.js");
const { importPatches } = require("../core/git.js");

module.exports = (program) => {
  program
    .command("import-patches")
    .description("Import patches from 'patches' to 'mozilla-release'")
    .action(async () => {
      const root = await workspace.getRoot();
      const tasks = await importPatches(root);

      try {
        await tasks.run();
      } catch (ex) {
        console.error(ex);
        /* Handled by `tasks` */
        process.exit(1);
      }
    });
};
