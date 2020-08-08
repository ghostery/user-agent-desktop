const process = require('process');

module.exports = (program) => {
  program
    .command("export-patches")
    .description("Export patches from 'mozilla-release' to 'patches'")
    .action(async () => {
      console.error('Not implemented!');
      process.exit(1);
    });
};
