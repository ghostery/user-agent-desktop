const fs = require("fs");
const path = require("path");

const yaml = require("js-yaml");
const Listr = require("listr");

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

async function generateDockerFile({ key, buildPath, fetches, toolchains }) {
  const builds = yaml.safeLoad(await fs.promises.readFile(buildPath, "utf-8"));

  const job = builds[key];

  const statements = ["FROM ua-build-base"];
  const env = Object.entries(job.worker.env)
    .map(([k, v]) => `${k}=${v}`)
    .join(" \\\n    ");
  statements.push(`ENV ${env}`);
  statements.push("");

  for (const key of job.fetches.fetch || []) {
    statements.push(generateFetch(fetches, key));
  }

  for (const key of job.fetches.toolchain) {
    if (toolchains.get(key).run["toolchain-artifact"] !== undefined) {
      const name = toolchains.get(key).name || key;
      const artifact = toolchains.get(key).run["toolchain-artifact"];
      const filename = artifact.split("/").pop();
      statements.push(
        [
          `RUN wget -O ${MOZ_FETCHES_DIR}${filename} https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.${name}.latest/artifacts/${artifact} &&`,
          `cd ${MOZ_FETCHES_DIR} &&`,
          `tar -xf ${filename} &&`,
          `rm ${filename}`,
        ].join(" \\\n    ")
      );
    }
  }

  if (key.startsWith('win')) {
    statements.push('ADD --chown=worker:worker makecab.exe /builds/worker/fetches/')
  }
  if (key.startsWith('mac')) {
    statements.push('COPY MacOSX10.11.sdk.tar.bz2 /builds/worker/fetches/')
    statements.push([
      'RUN cd /builds/worker/fetches/ &&',
      'tar -xf MacOSX10.11.sdk.tar.bz2 &&',
      'rm MacOSX10.11.sdk.tar.bz2',
    ].join(" \\\n    "))
  }

  statements.push(
    [
      'ENV MOZ_FETCHES_DIR=/builds/worker/fetches/',
      'GECKO_PATH=/builds/worker/workspace',
      'WORKSPACE=/builds/worker/workspace',
      'TOOLTOOL_DIR=/builds/worker/fetches/',
      'LANG=en_US.UTF-8',
      'LANGUAGE=en_US:en',
    ].join(" \\\n    ")
  );
  statements.push('COPY configs /builds/worker/configs')
  statements.push('WORKDIR $WORKSPACE')

  return statements.join("\n\n");
}

async function generate() {
  const root = await getRoot();
  const fetches = await loadFetches(root);
  const toolchains = await loadToolchains(root);

  return new Listr([
    {
      title: "Linux",
      task: async () =>
        fs.promises.writeFile(
          path.join(root, "build", "Windows.dockerfile"),
          await generateDockerFile({
            key: "linux64/opt",
            fetches,
            toolchains,
            buildPath: path.join(
              root,
              "mozilla-release",
              "taskcluster",
              "ci",
              "build",
              "linux.yml"
            ),
          }),
          "utf-8"
        ),
    },
    {
      title: "Windows",
      task: async () =>
        fs.promises.writeFile(
          path.join(root, "build", "Windows.dockerfile"),
          await generateDockerFile({
            key: "win64/opt",
            fetches,
            toolchains,
            buildPath: path.join(
              root,
              "mozilla-release",
              "taskcluster",
              "ci",
              "build",
              "windows.yml"
            ),
          }),
          "utf-8"
        ),
    },
    {
      title: "Mac OS X",
      task: async () =>
        fs.promises.writeFile(
          path.join(root, "build", "MacOSX.dockerfile"),
          await generateDockerFile({
            key: "macosx64/opt",
            fetches,
            toolchains,
            buildPath: path.join(
              root,
              "mozilla-release",
              "taskcluster",
              "ci",
              "build",
              "macosx.yml"
            ),
          }),
          "utf-8"
        ),
    },
  ]);
}

module.exports = {
  generate,
};
