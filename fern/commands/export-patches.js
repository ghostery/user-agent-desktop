const workspace = require("../core/workspace.js");
const { exportPatches } = require("../core/git.js");

module.exports = (program) => {
  program
    .command("export-patches")
    .description("Export patches from 'mozilla-release' to 'patches'")
    .action(async () => {
      const root = await workspace.getRoot();
      const { firefox: firefoxVersion } = await workspace.load();

      const tasks = exportPatches(root, firefoxVersion);

      try {
        await tasks.run();
      } catch (ex) {
        /* Handled by `tasks` */
      }
    });
};
