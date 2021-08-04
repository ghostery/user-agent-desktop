const path = require("path");
const fs = require("fs");
const process = require("process");

const execa = require("execa");
const Listr = require("listr");
const Docker = require("dockerode");
const fsExtra = require("fs-extra");

const { getRoot } = require("../core/workspace.js");
const { sudo, withCwd, fileExists, folderExists } = require("../core/utils.js");

async function buildDocker({ docker, cwd, dockerfile, name, out }) {
  const stream = await docker.buildImage(
    {
      context: cwd,
      src: [dockerfile, "configs", "fetch-content", "MacOSX10.12.sdk.tar.bz2"],
    },
    {
      t: name,
      dockerfile,
      buildargs: {
        user: "jenkins",
        UID: "1000",
        GID: "1000",
      },
    }
  );

  await new Promise((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (err, res) => (err ? reject(err) : resolve(res)),
      ({ stream }) => {
        if (stream !== undefined) {
          out.write(stream);
        }
      }
    );
  });
}

async function runDocker({
  commands = ["build"],
  docker,
  image,
  mozconfig,
  out,
  registerCleanupTask,
  Binds = [],
}) {
  for (const cmd of commands) {
    const container = await docker.createContainer({
      Image: image,
      Cmd: ["./mach", cmd],
      Env: [`MOZCONFIG=/builds/worker/configs/${mozconfig}`],
      Tty: true,
      HostConfig: {
        Binds: [
          `${path.join(
            await getRoot(),
            "mozilla-release"
          )}:/builds/worker/workspace`,
          ...Binds,
        ],
      },
    });

    let cleanupStream = undefined;
    container.attach(
      { stream: true, stdout: true, stderr: true },
      (err, stream) => {
        stream.pipe(out);
        cleanupStream = () => {
          try {
            stream.end();
          } catch (ex) {
            /* Ignore */
          }

          try {
            stream.unpipe(out);
          } catch (ex) {
            /* Ignore */
          }
        };
      }
    );

    let cleanupOngoing = false;
    registerCleanupTask(async () => {
      if (cleanupOngoing === true) {
        return;
      }
      cleanupOngoing = true;

      try {
        if (cleanupStream !== undefined) {
          cleanupStream();
        }
      } catch (ex) {
        console.log("????", ex);
        /* Ignore */
      }

      try {
        console.log("Attempting to stop container...");
        await container.stop({ t: 0 });
      } catch (ex) {
        /* Ignore */
      }

      try {
        console.log("Attempting to remove container...");
        await container.remove({ force: true });
      } catch (ex) {
        /* Ignore */
      }
    });

    await container.start();
    await container.wait();

    try {
      if (cleanupStream !== undefined) {
        cleanupStream();
      }
    } catch (ex) {
      /* Ignore */
    }

    try {
      await container.remove({ force: true });
    } catch (ex) {
      /* NOTE: this might fail if we intercepted CTRL-c */
    }
  }
}

module.exports = (program) => {
  program
    .command("build")
    .requiredOption(
      "-t, --target <flavor>",
      "Build browser for flavor (i.e. one of 'linux', 'mac', 'windows')"
    )
    .description("Build Firefox in docker")
    .action(async ({ target }) => {
      if (target !== "linux" && target !== "mac" && target !== "windows") {
        console.error(
          "Only following targets are currently supported: linux, mac and windows."
        );
        process.exit(1);
      }

      const root = await getRoot();
      const buildFolder = path.join(root, "build");
      const docker = new Docker();

      const cleanupTasks = [];
      const registerCleanupTask = (cb) => {
        cleanupTasks.push(cb);
      };

      process.on("SIGINT", async () => {
        for (const cb of cleanupTasks) {
          try {
            await cb();
          } catch (ex) {
            /* Ignore. */
          }
        }
        process.exit(0);
      });

      const logWriter = fs.createWriteStream("logs");
      console.log("> To check logs run: tail -f ./logs");

      const tasks = [
        {
          title: `Building Docker Base Image`,
          task: () =>
            buildDocker({
              docker,
              cwd: buildFolder,
              dockerfile: "Base.dockerfile",
              name: "ua-build-base",
              out: logWriter,
              registerCleanupTask,
            }),
        },
      ];

      if (target === "linux") {
        tasks.push(
          {
            title: `Building Docker Linux Image`,
            task: () =>
              buildDocker({
                docker,
                cwd: buildFolder,
                dockerfile: "Linux.dockerfile",
                name: "ua-build-linux",
                out: logWriter,
                registerCleanupTask,
              }),
          },
          {
            title: "Building User Agent in Docker (Linux)",
            task: () =>
              runDocker({
                commands: ["build", "package"],
                docker,
                image: "ua-build-linux",
                mozconfig: "linux.mozconfig",
                out: logWriter,
                registerCleanupTask,
              }),
          }
        );
      } else if (target === "mac") {
        tasks.push(
          {
            title: "Building Docker MacOSX Image",
            task: () =>
              buildDocker({
                docker,
                cwd: buildFolder,
                dockerfile: "MacOSX.dockerfile",
                name: "ua-build-mac",
                out: logWriter,
                registerCleanupTask,
              }),
          },
          {
            title: "Check MacOSX10.12.sdk.tar.bz2 exists",
            task: async () => {
              const sdk = "MacOSX10.12.sdk.tar.bz2";
              if ((await fileExists(path.join(buildFolder, sdk))) === false) {
                throw new Error(`${sdk} must be available at build/${sdk}`);
              }
            },
          },
          {
            title: "Extract MacOSX10.12.sdk.tar.bz2",
            skip: () => folderExists(path.join(buildFolder, "MacOSX10.12.sdk")),
            task: async () => {
              await withCwd(buildFolder, () =>
                execa("tar", ["-xjvf", "MacOSX10.12.sdk.tar.bz2"])
              );
            },
          },
          {
            title: "Building User Agent in Docker (MacOSX)",
            task: () =>
              runDocker({
                commands: ["build", "package"],
                docker,
                image: "ua-build-mac",
                mozconfig: "macosx.mozconfig",
                out: logWriter,
                registerCleanupTask,
                Binds: [
                  `${path.join(
                    buildFolder,
                    "MacOSX10.12.sdk"
                  )}:/builds/worker/workspace/MacOSX10.12.sdk`,
                ],
              }),
          }
        );
      } else if (target === "windows") {
        tasks.push(
          {
            title: "Building Docker Windows Image",
            task: () =>
              buildDocker({
                docker,
                cwd: buildFolder,
                dockerfile: "Windows.dockerfile",
                name: "ua-build-win",
                out: logWriter,
                registerCleanupTask,
              }),
          },
          {
            title: "Check Windows 10 SDK exists",
            task: async () => {
              const sdk = "vs2017_15.9.29.zip";
              if ((await fileExists(path.join(buildFolder, sdk))) === false) {
                throw new Error(
                  `Windows 10 SDK must be available at build/${sdk}`
                );
              }
            },
          },
          {
            title: "Check makecab.exe exists",
            task: async () => {
              const makecab = "makecab.exe";
              if (
                (await fileExists(path.join(buildFolder, makecab))) === false
              ) {
                throw new Error(
                  `${makecab} must be available at build/${makecab}`
                );
              }
            },
          },
          {
            title: "Setup VFAT Drive",
            skip: () => folderExists("/mnt/vfat/"),
            task: async () => {
              const fatFile = path.join(root, "fat.fs");
              await execa("truncate", ["-s", "2G", fatFile]);
              await execa("mkfs.vfat", [fatFile]);
              await sudo("mkdir /mnt/vfat");
              await sudo(`mount -t vfat -o rw,uid=1000 ${fatFile} /mnt/vfat`);
            },
          },
          {
            title: "Extract Windows 10 SDK to VFAT Drive",
            skip: () => folderExists("/mnt/vfat/vs2017_15.9.29"),
            task: async () => {
              const vs2017 = "vs2017_15.9.29.zip";
              await fsExtra.copy(
                path.join(buildFolder, vs2017),
                `/mnt/vfat/${vs2017}`
              );
              await withCwd("/mnt/vfat", async () => {
                await execa("unzip", [vs2017]);
                await execa("rm", [vs2017]);
              });
            },
          },
          {
            title: "Building User Agent in Docker (Windows)",
            task: () =>
              runDocker({
                commands: ["build", "package"],
                docker,
                image: "ua-build-win",
                mozconfig: "win64.mozconfig",
                out: logWriter,
                registerCleanupTask,
                Binds: [
                  "/mnt/vfat/vs2017_15.9.29/:/builds/worker/fetches/vs2017_15.9.29",
                  `${path.join(
                    buildFolder,
                    "makecab.exe"
                  )}:/builds/worker/fetches/makecab.exe`,
                ],
              }),
          }
        );
      }

      const listr = new Listr(tasks);

      try {
        await listr.run();
      } catch (ex) {
        console.error(ex);
        /* Handled by `tasks` */
        process.exit(1);
      } finally {
        logWriter.close();
      }
    });
};
