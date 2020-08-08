const process = require('process');

module.exports = (program) => {
  program
    .command("import-patches")
    .description("Import patches from 'patches' to 'mozilla-release'")
    .action(async () => {
      console.error('Not implemented!');
      process.exit(1);
    });
};
