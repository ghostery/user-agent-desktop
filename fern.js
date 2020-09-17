#!/usr/bin/env node

const process = require('process');

const program = require('commander');
const colors = require('colors');

// register sub-commands
require('./fern/commands/use')(program);
require('./fern/commands/reset')(program);
require('./fern/commands/config')(program);
require('./fern/commands/generate')(program);
require('./fern/commands/build')(program);
require('./fern/commands/export-patches')(program);
require('./fern/commands/import-patches')(program);

(() => {
  colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red',
  });

  program.parse(process.argv);
})();
