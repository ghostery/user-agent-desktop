const fs = require("fs");
const path = require("path");

const fse = require("fs-extra");
const yaml = require("js-yaml");
const Listr = require("listr");
const execa = require("execa");

const { getRoot } = require("./workspace.js");

const MOZ_FETCHES_DIR = "/builds/worker/fetches/";

async function loadFetches(root) {
  return yaml.safeLoad(
    await fs.promises.readFile(
      path.join(
        root,
        "mozilla-release",
        "taskcluster",
        "ci",
        "fetch",
        "toolchains.yml"
      ),
      "utf-8"
    )
  );
}

async function loadToolchains(root) {
  const toolchainPath = path.join(
    root,
    "mozilla-release",
    "taskcluster",
    "ci",
    "toolchain"
  );

  const toolchains = new Map();
  for (const filename of await fs.promises.readdir(toolchainPath)) {
    if (filename.endsWith(".yml")) {
      let defaultArtifact = "";
      for (const [k, v] of Object.entries(
        yaml.safeLoad(
          await fs.promises.readFile(
            path.join(toolchainPath, filename),
            "utf-8"
          )
        )
      )) {
        toolchains.set(k, v);

        if (v.run === undefined) {
          continue;
        }

        if (v.run["toolchain-alias"] !== undefined) {
          toolchains.set(v.run["toolchain-alias"], v);
          v.name = k;
        }

        if (k === "job-defaults") {
          defaultArtifact = v.run["toolchain-artifact"] || "";
        }

        if (v.run["toolchain-artifact"] === undefined) {
          v.run["toolchain-artifact"] = defaultArtifact;
        }
      }
    }
  }
  return toolchains;
}

function generateFetch(fetches, key) {
  const d = fetches[key].fetch;
  if (d.type === "static-url") {
    const filename = d.url.split("/").pop();
    return [
      `RUN /builds/worker/bin/fetch-content ${d.type}`,
      `--sha256 ${d.sha256}`,
      `--size ${d.size}`,
      `${d.url}`,
      `${MOZ_FETCHES_DIR}${filename} &&`,
      `cd ${MOZ_FETCHES_DIR} &&`,
      `unzip ${filename} &&`,
      `rm ${filename}`,
    ].join(" \\\n    ");
  }
}

async function generateDockerFile({ key, fetches, job, name }) {
  const statements = ["FROM ua-build-base"];
  statements.push("RUN ipfs init");
  const env = Object.entries(job.worker.env || {})
    .map(([k, v]) => `${k}=${v}`)
    .join(" \\\n    ");
  statements.push(`ENV ${env}`);
  statements.push("");

  for (const key of job.fetches.fetch || []) {
    statements.push(generateFetch(fetches, key));
  }

  statements.push(`ADD fetch-toolchain-${name}.sh /builds/worker/bin/`);
  statements.push(
    `RUN /bin/bash /builds/worker/bin/fetch-toolchain-${name}.sh`
  );

  if (key.startsWith("win")) {
    statements.push(
      "ADD --chown=worker:worker makecab.exe /builds/worker/fetches/"
    );
  }
  if (key.startsWith("mac")) {
    statements.push("COPY MacOSX10.11.sdk.tar.bz2 /builds/worker/fetches/");
    statements.push(
      [
        "RUN cd /builds/worker/fetches/ &&",
        "tar -xf MacOSX10.11.sdk.tar.bz2 &&",
        "rm MacOSX10.11.sdk.tar.bz2",
      ].join(" \\\n    ")
    );
  }

  statements.push(
    [
      "ENV MOZ_FETCHES_DIR=/builds/worker/fetches/",
      "GECKO_PATH=/builds/worker/workspace",
      "WORKSPACE=/builds/worker/workspace",
      "TOOLTOOL_DIR=/builds/worker/fetches/",
      "LANG=en_US.UTF-8",
      "LANGUAGE=en_US:en",
    ].join(" \\\n    ")
  );
  statements.push("COPY configs /builds/worker/configs");
  statements.push("WORKDIR $WORKSPACE");

  return statements.join("\n\n");
}

async function generate(artifactBaseDir) {
  const root = await getRoot();
  const fetches = await loadFetches(root);
  const toolchains = await loadToolchains(root);
  const buildConfigs = [
    {
      name: "Linux",
      key: "linux64/opt",
      buildPath: path.join(
        root,
        "mozilla-release",
        "taskcluster",
        "ci",
        "build",
        "linux.yml"
      ),
    },
    {
      name: "Windows",
      key: "win64/opt",
      buildPath: path.join(
        root,
        "mozilla-release",
        "taskcluster",
        "ci",
        "build",
        "windows.yml"
      ),
    },
    {
      name: "MacOSX",
      key: "macosx64/opt",
      buildPath: path.join(
        root,
        "mozilla-release",
        "taskcluster",
        "ci",
        "build",
        "macosx.yml"
      ),
    },
  ];
  const buildInfos = await Promise.all(
    buildConfigs.map(
      async ({ buildPath, key }) =>
        yaml.safeLoad(await fs.promises.readFile(buildPath, "utf-8"))[key]
    )
  );
  const toolchainFetchTasks = [];
  const toolchainsForConfig = buildConfigs.map(() => []);
  buildInfos.forEach((job, i) => {
    for (const key of job.fetches.toolchain) {
      if (toolchains.get(key).run["toolchain-artifact"] !== undefined) {
        const name = toolchains.get(key).name || key;
        const artifact = toolchains.get(key).run["toolchain-artifact"];
        const filename = artifact.split("/").pop();
        const localDir = path.join(artifactBaseDir, name);
        const localPath = path.join(localDir, filename.split(".")[0]);
        const artifactPath = path.join(localDir, filename);
        toolchainFetchTasks.push({
          title: `Fetch toolchain: ${name} ${filename}`,
          skip: async () => fse.pathExists(localPath),
          task: () =>
            new Listr([
              {
                title: "Download from taskcluster",
                skip: async () => fse.pathExists(artifactPath),
                task: async () => {
                  await fse.mkdirp(localDir);
                  await execa("wget", [
                    "-O",
                    artifactPath,
                    `https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.${name}.latest/artifacts/${artifact}`,
                  ]);
                },
              },
              {
                title: "Extract toolchain",
                task: async () => {
                  await execa("tar", ["-xf", filename], { cwd: localDir });
                  await execa("rm", [artifactPath]);
                },
              },
            ]),
        });
        toolchainFetchTasks.push({
          title: `Get toolchain IPFS address: ${name} ${filename}`,
          task: async () => {
            const ipfsAdd = await execa("ipfs", ["add", "-Q", "-r", localDir]);
            const hash = ipfsAdd.stdout.trim();
            toolchainsForConfig[i].push({
              name,
              hash,
            });
            return hash;
          },
        });
      }
    }
  });
  return new Listr([
    {
      title: "Prepare toolchains",
      task: () => new Listr(toolchainFetchTasks),
    },
    {
      title: "Generate toolchain scripts",
      task: () =>
        new Listr(
          buildConfigs.map((conf, i) => ({
            title: conf.name,
            task: async () => {
              const lines = [];
              lines.push("set -x -e");
              // start up ipfs daemon and wait for it
              lines.push("ipfs daemon &");
              lines.push("while [ ! -e ${HOME}/.ipfs/api ]");
              lines.push("do");
              lines.push('echo "Waiting for IPFS to start"');
              lines.push("sleep 1");
              lines.push("done");
              for (const { name, hash } of toolchainsForConfig[i]) {
                lines.push(`# ${name}`);
                lines.push(`ipfs get -o /builds/worker/fetches/ /ipfs/${hash}`);
              }
              lines.push("killall ipfs");
              return fse.writeFile(
                path.join("build", `fetch-toolchain-${conf.name}.sh`),
                lines.join("\n"),
                "utf-8"
              );
            },
          }))
        ),
    },
    {
      title: "Generate dockerfiles",
      task: () =>
        new Listr(
          buildConfigs.map((conf, i) => ({
            title: conf.name,
            task: async () => {
              return fse.writeFile(
                path.join("build", `${conf.name}.dockerfile`),
                await generateDockerFile({
                  key: conf.key,
                  fetches,
                  job: buildInfos[i],
                  name: conf.name,
                }),
                "utf-8"
              );
            },
          }))
        ),
    },
  ]);
}

module.exports = {
  generate,
};
