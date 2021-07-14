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
  try {
    return JSON.parse(
      await fsExtra.readFile(path.join(root, "l10n", `${locale}.json`))
    );
  } catch (e) {
    // allow an underscore instead of a - in locale name
    return JSON.parse(
      await fsExtra.readFile(path.join(root, "l10n", `${locale.replace('-', '_')}.json`))
    );
  }
}

function replacementLine(key, value, format) {
  if (format === ".ftl") {
    if (Array.isArray(value)) {
      return [
        `${key} =`,
        ...value.map(line => `    ${line}`)
      ].join("\n");
    }
    return `${key} = ${value}`;
  } else if (format === ".inc") {
    // bookmarks.inc - uses #define
    return `#define ${key} ${value}`;
  } else if (format === ".dtd") {
    return `<!ENTITY ${key} "${value}">`
  } else if (format === '.properties') {
    return `${key}=${value}`;
  }
  throw "Unknown file format"
}

function patchStrings(replacements, content, format) {
  const lines = content.split("\n");
  const keys = new Set(Object.keys(replacements));
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let key;
    if (format === ".dtd") {
      key = (line.split(" ")[1] || "").trim();
    } else {
      key = line.split("=")[0].trim();
    }
    if (key && replacements[key]) {
      if (format === ".ftl" && !replacements[key].string) {
        // TODO: below multiline with .label handing is a special case of .ftl key replacement
        // this code should be handle it if the translation files will get updated to
        // use nested structure.
        while (lines[i + 1] && (lines[i + 1].startsWith('    .') || lines[i + 1].startsWith('  .'))) {
          i = i + 1;
          const subKeyMatch = /^ {2,4}\.(.*) =/.exec(lines[i]);
          if (subKeyMatch) {
            const subKey = subKeyMatch[1];
            if (replacements[key][subKey]) {
              lines[i] = `    .${subKey} = ${replacements[key][subKey].string}`;
            }
          }
        }
      } else if (format === ".ftl" && lines[i + 1].trim().startsWith(".label")) {
        // check for multiline with .label
        i = i + 1;
        lines[i] = `${lines[i].split("=")[0]}= ${replacements[key].string}`;
      } else {
        // TODO: this creates empty lines - we don't need them
        const multipleLines = replacements[key].string.split("\n");
        if (format === ".ftl" && multipleLines.length > 1) {
          for (let k = 0; k < multipleLines.length; k++) {
            lines[i] = "";
            i = i + 1;
          }
          lines[i] = replacementLine(key, multipleLines, format);
        } else {
          lines[i] = replacementLine(key, replacements[key].string, format);
        }
      }
      keys.delete(key);
    }
  }
  // add remaining at the end of the file
  // we insert two lines before the end for bookmarks.inc case
  const extraLines = [...keys].map((key) => replacementLine(key, replacements[key].string, format));
  lines.splice(lines.length - 2, 0, ...extraLines);
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
          contents.replace(/Firefox/g, "Ghostery Dawn")
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
