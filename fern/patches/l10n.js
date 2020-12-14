const path = require("path");
const fsExtra = require("fs-extra");
const { getRoot } = require("../core/workspace.js");

const replacePaths = [
  ["browser", "chrome", "overrides", "appstrings.properties"],
  ["devtools", "startup", "aboutDevTools.ftl"],
];

function getPathToLocaleFile(filePath, locale, root) {
  if (locale === "en-US") {
    const splitIndex = filePath[0] === "devtools" ? 2 : 1;
    return path.join(
      root,
      "mozilla-release",
      ...filePath.slice(0, splitIndex),
      "locales",
      locale,
      ...filePath.slice(splitIndex)
    );
  }
  return path.join(root, "l10n", locale, ...filePath);
}

async function getLocaleStringOverrides(locale, root) {
  return JSON.parse(
    await fsExtra.readFile(path.join(root, "l10n", `${locale}.json`))
  );
}

function patchStrings(replacements, content, format) {
  const lines = content.split("\n");
  const separator = format === ".ftl" ? " = " : "=";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const key = line.split("=")[0].trim();
    if (replacements[key]) {
      // check for multiline with .label
      if (format === ".ftl" && lines[i + 1].trim().startsWith(".label")) {
        i = i + 1;
        lines[i] = `${lines[i].split("=")[0]}= ${replacements[key].string}`;
      } else {
        lines[i] = `${key}${separator}${replacements[key].string}`;
      }
    }
  }
  return lines.join("\n");
}

module.exports = ({ locale = "en-US" }) => ({
  name: "Rewrite localized strings",
  paths: ["./*"],
  skip: async () => false,
  apply: async () => {
    const root = await getRoot();
    // find and replace style changes
    await Promise.all(
      replacePaths.map(async (p) => {
        const filePath = getPathToLocaleFile(p, locale, root);
        const contents = await fsExtra.readFile(filePath, "utf-8");
        return fsExtra.writeFile(
          filePath,
          contents.replace(/Firefox/g, "Ghostery")
        );
      })
    );
    // get string overrides for this locale
    const stringOverrides = await getLocaleStringOverrides(locale, root);
    await Promise.all(
      Object.keys(stringOverrides).map(async (filePath) => {
        const absPath = getPathToLocaleFile(filePath.split("/"), locale, root);
        const patchedContent = patchStrings(
          stringOverrides[filePath],
          await fsExtra.readFile(absPath, "utf-8"),
          path.extname(absPath)
        );
        return fsExtra.writeFile(absPath, patchedContent);
      })
    );
  },
});
