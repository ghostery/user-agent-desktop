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
    ].join(" \\\n   ");
  }
}

async function generateDockerFile({ key, buildPath, fetches, toolchains }) {
  const builds = yaml.safeLoad(await fs.promises.readFile(buildPath, "utf-8"));

  const job = builds[key];

  const statements = ["FROM mozbuild:base", ""];
  const env = Object.entries(job.worker.env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\\n    ");
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

  statements.push(
    [
      `ENV TOOLTOOL_DIR=${MOZ_FETCHES_DIR}`,
      `RUSTC=${MOZ_FETCHES_DIR}rustc/bin/rustc`,
      `CARGO=${MOZ_FETCHES_DIR}rustc/bin/cargo`,
      `RUSTFMT=${MOZ_FETCHES_DIR}rustc/bin/rustfmt`,
      `CBINDGEN=${MOZ_FETCHES_DIR}cbindgen/cbindgen`,
    ].join(" ")
  );

  statements.push(`ADD vs2017_15.8.4.zip ${MOZ_FETCHES_DIR}`);
  statements.push(
    `RUN cd ${MOZ_FETCHES_DIR} && unzip vs2017_15.8.4.zip && rm vs2017_15.8.4.zip`
  );

  // extra_env = '\\\n    '.join([f'{k}={v}' for k, v in job['run']['extra-config']['env'].items()])
  // statements.append(f'ENV {extra_env}')
  statements.push(
    [
      `ENV MOZ_FETCHES_DIR=/builds/worker/fetches/`,
      `MOZCONFIG=/builds/worker/workspace/.mozconfig`,
    ].join(" ")
  );
  statements.push("USER worker");
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
