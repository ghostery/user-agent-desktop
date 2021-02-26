const Listr = require("listr");
const process = require("process");
const fs = require("fs");
const path = require("path");

const MOZCONFIG_PATH = "mozconfig";

module.exports = (program) => {
  program
    .command("config")
    .description("Creates a mozconfig file based on brand and platform")
    .option(
      "-b, --brand <BRAND>",
      "Specify which brand to use"
    )
    .option(
      "-p, --platform <platform>",
      "Specify which platform to use (e.g. win64, linux, macosx)"
    )
    .option(
      "-f, --force",
      "Replace current mozconfig if exists"
    )
    .option(
      "-l, --local",
      "Choose if local.mozconfig should be used"
    )
    .option(
      "--print",
      "Print mozconfig to screen"
    )
    .action(
      async ({ force, platform, brand, local, print }) => {
        const tasks = new Listr([
          {
            title: "Generate mozconfig",
            task: () => {
              if (fs.existsSync(MOZCONFIG_PATH)) {
                if (!force) {
                  throw new Error("mozconfig already exist")
                }
              }
              let brandMozConfig = "";
              if (brand) {
                brandMozConfig = fs.readFileSync(path.join("brands", brand, "mozconfig"));
              }

              let platformMozConfig = "";
              if (platform) {
                platformMozConfig = fs.readFileSync(path.join("build", "configs", `${platform}.mozconfig`));
              }

              let localMozconfig = "";
              if (local) {
                localMozconfig = fs.readFileSync("local.mozconfig");
              }


              const mozConfig = [
                platformMozConfig.toString().trim(),
                brandMozConfig.toString().trim(),
                localMozconfig.toString().trim(),
              ].join("\n");

              if (print) {
                console.log("fern: Generated MOZCONFIG START\n");
                console.log(mozConfig);
                console.log("\nfern: Generated MOZCONFIG END")
              }

              fs.writeFileSync(MOZCONFIG_PATH, mozConfig);
            },
          },
        ]);

        try {
          await tasks.run();
        } catch (ex) {
          console.error(ex);
          /* Handled by `tasks` */
          process.exit(1);
        }
      }
    );
};
