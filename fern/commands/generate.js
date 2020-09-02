const process = require('process');

const Listr = require("listr");

const docker = require("../core/docker.js");

module.exports = (program) => {
  program
    .command("generate")
    .description("Generate docker images from taskcluster")
    .action(async () => {
      const tasks = new Listr([
        {
          title: "Generate Dockerfiles",
          task: () => docker.generate(),
        },
      ]);
      // MacOSX.dockerfile   Windows.dockerfile Reset Firefox to ${firefox}`,

      try {
        await tasks.run();
      } catch (ex) {
        /* Handled by `tasks` */
        process.exit(1);
      }
    });
};
