const process = require('process');

module.exports = (program) => {
  program
    .command("build")
    .description("Build images locally")
    .action(async () => {
      console.error('Not implemented!');
      process.exit(1);
    });
};
