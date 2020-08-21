const path = require("path");
const fs = require("fs");
const process = require("process");

const Listr = require("listr");
const Docker = require("dockerode");

const { getRoot } = require("../core/workspace.js");

async function buildDocker({ docker, cwd, dockerfile, name, out }) {
  const stream = await docker.buildImage(
    {
      context: cwd,
      src: [dockerfile, "configs", "fetch-content", "MacOSX10.11.sdk.tar.bz2"],
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
  docker,
  image,
  mozconfig,
  out,
  registerCleanupTask,
}) {
  const container = await docker.createContainer({
    Image: image,
    Cmd: ["./mach", "build"],
    Env: [`MOZCONFIG=/builds/worker/configs/${mozconfig}`],
    Tty: true,
    HostConfig: {
      Binds: [
        `${path.join(
          await getRoot(),
          "mozilla-release"
        )}:/builds/worker/workspace`,
      ],
    },
  });

  let cleanupStream = undefined;
  container.attach(
    { stream: true, stdout: true, stderr: true },
    (err, stream) => {
      stream.pipe(out);
      cleanupStream = () => {
        stream.unpipe(out);
      };
    }
  );

  let cleanupOngoing = false;
  registerCleanupTask(async () => {
    if (cleanupOngoing === true) {
      return;
    }
    cleanupOngoing = true;

    if (cleanupStream !== undefined) {
      cleanupStream();
    }

    try {
      console.log("Attempting to stop container...");
      await container.stop({ t: 1 });
    } catch (ex) {
      /* Ignore */
    }

    try {
      console.log("Attempting to remove container...");
      await container.remove();
    } catch (ex) {
      /* Ignore */
    }
  });

  await container.start();
  await container.wait();

  try {
    await container.remove();
  } catch (ex) {
    /* NOTE: this might fail if we intercepted CTRL-c */
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
      if (target !== "linux" && target !== "mac") {
        console.error(
          "Only following targets are currently supported: linux, mac."
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
            title: "Building User Agent in Docker (MacOSX)",
            task: () =>
              runDocker({
                docker,
                image: "ua-build-mac",
                mozconfig: "macosx.mozconfig",
                out: logWriter,
                registerCleanupTask,
              }),
          }
        );
      }

      const listr = new Listr(tasks);

      try {
        await listr.run();
      } catch (ex) {
        /* Handled by `tasks` */
      } finally {
        logWriter.close();
      }
    });
};
