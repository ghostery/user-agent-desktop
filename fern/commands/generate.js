const process = require('process');

const Listr = require("listr");

const docker = require("../core/docker.js");

module.exports = (program) => {
  program
    .command("generate")
    .requiredOption(
      "-a --artifact-dir <artifactDir>",
      "Directory where artifacts should be downloaded to"
    )
    .description("Generate docker images from taskcluster")
    .action(async ({ artifactDir }) => {
      const tasks = new Listr([
        {
          title: "Generate Dockerfiles",
          task: () => docker.generate(artifactDir),
        },
      ]);
      // MacOSX.dockerfile   Windows.dockerfile Reset Firefox to ${firefox}`,

      try {
        await tasks.run();
      } catch (ex) {
        console.error(ex);
        /* Handled by `tasks` */
        process.exit(1);
      }
    });
};
