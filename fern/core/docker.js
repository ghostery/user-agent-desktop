const fs = require("fs");
const path = require("path");

const fse = require("fs-extra");
const yaml = require("js-yaml");
const Listr = require("listr");
const execa = require("execa");

const { getRoot, load: loadWorkspace } = require("./workspace.js");
const { exit } = require("process");

const MOZ_FETCHES_DIR = "/builds/worker/fetches/";

const SKIP_TOOLCHAINS = new Set([
  "win64-pdbstr",
  "macosx64-sdk-11.0",
  "macosx64-sdk-10.12",
]);

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

async function generateDockerFile({ key, fetches, job, name, toolchains }) {
  const statements = ["FROM ua-build-base"];
  const env = Object.entries(job.worker.env || {})
    .map(([k, v]) => `${k}=${v}`)
    .join(" \\\n    ");
  statements.push(`ENV ${env}`);

  for (const key of job.fetches.fetch || []) {
    statements.push(generateFetch(fetches, key));
  }

  for (const { filename, url } of toolchains) {
    statements.push(
      [
        `RUN wget -nv -O /builds/worker/fetches/${filename} ${url} &&`,
        `cd /builds/worker/fetches/ &&`,
        `tar -xf ${filename} &&`,
        `rm ${filename}`,
      ].join(" \\\n    ")
    );
  }

  if (key.startsWith("win")) {
    statements.push(
      "ADD --chown=worker:worker makecab.exe /builds/worker/fetches/"
    );
  }
  if (key.startsWith("macosx64")) {
    statements.push("COPY MacOSX10.12.sdk.tar.bz2 /builds/worker/fetches/");
    statements.push(
      [
        "RUN cd /builds/worker/fetches/ &&",
        "tar -xf MacOSX10.12.sdk.tar.bz2 &&",
        "rm MacOSX10.12.sdk.tar.bz2",
      ].join(" \\\n    ")
    );
  }
  if (key.startsWith("macosx64-aarch64")) {
    statements.push("COPY MacOSX11.0.sdk.tar.bz2 /builds/worker/fetches/");
    statements.push(
      [
        "RUN cd /builds/worker/fetches/ &&",
        "tar -xf MacOSX11.0.sdk.tar.bz2 &&",
        "rm MacOSX11.0.sdk.tar.bz2",
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
    {
      name: "WindowsARM",
      key: "win64-aarch64/opt",
      arch: "arm64",
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
      name: "MacOSARM",
      key: "macosx64-aarch64-shippable/opt",
      arch: "arm64",
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
  // Collect the toolchains required for each build from it's specification in taskcluster configs.
  const buildInfos = await Promise.all(
    buildConfigs.map(async ({ buildPath, key }) => {
      const jobs = yaml.safeLoad(
        await fs.promises.readFile(buildPath, "utf-8")
      );
      if (jobs["job-defaults"]) {
        for (const toolchain of jobs["job-defaults"].fetches.toolchain) {
          jobs[key].fetches.toolchain.push(toolchain);
        }
      }
      return jobs[key];
    })
  );
  // Generate the Listr tasks for fetching toolchains from taskcluster and getting their S3 address.
  const toolchainFetchTasks = [];
  const toolchainsForConfig = buildConfigs.map(() => []);
  const workspace = await loadWorkspace();
  const s3bucket = workspace["s3bucket"];
  const ffVersion = workspace["firefox"];

  buildInfos.forEach((job, i) => {
    for (const key of job.fetches.toolchain) {
      if (
        toolchains.get(key).run["toolchain-artifact"] !== undefined &&
        !SKIP_TOOLCHAINS.has(key)
      ) {
        const name = toolchains.get(key).name || key;
        const artifact = toolchains.get(key).run["toolchain-artifact"];
        const filename = artifact.split("/").pop();
        const localDir = path.join(artifactBaseDir, name);
        const artifactPath = path.join(localDir, filename);
        const s3Key = `toolchains/${ffVersion}/${name}/${filename}`;

        toolchainFetchTasks.push({
          title: `Fetch toolchain: ${name} ${filename}`,
          skip: async () => fse.pathExists(artifactPath),
          task: async () => {
            await fse.mkdirp(localDir);
            await execa("wget", [
              "-O",
              artifactPath,
              `https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.${name}.latest/artifacts/${artifact}`,
            ]);
          },
        });
        toolchainFetchTasks.push({
          title: `Upload toolchain to S3: ${name} ${filename}`,
          task: async () => {
            // Upload not existing files to S3. We use "aws s3 sync" because
            // it can manage a few edge cases easily:
            // - upload a file if it does not exist on S3
            // - upload a file if a local file has a different size than S3 object
            // FYI: "sync" doesn't work with files, but with directories,
            // so we do the trick with '--include' and '--exclude' parameters.
            await execa("aws", [
              "s3",
              "sync",
              "--quiet",
              "--size-only",
              "--exclude",
              "'*'",
              "--include",
              artifact,
              localDir,
              `s3://${s3bucket}/toolchains/${ffVersion}/${name}`,
            ]);
          },
        });
        toolchainFetchTasks.push({
          title: `Get toolchain S3 address: ${name} ${filename}`,
          task: async () => {
            const url = `https://${s3bucket}.s3.amazonaws.com/${s3Key}`;
            toolchainsForConfig[i].push({
              name,
              filename,
              url,
            });
            return url;
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
      title: "Generate dockerfiles",
      task: () =>
        new Listr(
          buildConfigs.map((conf, i) => ({
            title: conf.name,
            task: async () => {
              return fse.writeFile(
                path.join("build", `${conf.name}.dockerfile`),
                await generateDockerFile({
                  name: conf.name,
                  key: conf.key,
                  fetches,
                  job: buildInfos[i],
                  toolchains: toolchainsForConfig[i],
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
