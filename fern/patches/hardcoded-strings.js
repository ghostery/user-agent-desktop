const path = require("path");
const fsExtra = require("fs-extra");
const { getRoot } = require("../core/workspace.js");

const files = [
  ["browser", "app", "firefox.exe.manifest"]
]

module.exports = () => ({
  name: "Rewrite Firefox strings",
  paths: files.map(p => path.join(...p)),
  skip: async () => false,
  apply: async () => {
    return Promise.all(files.map(async (p) => {
      const filePath = path.join(await getRoot(), 'mozilla-release', ...p);
      const contents = await fsExtra.readFile(filePath, 'utf-8');
      return fsExtra.writeFile(filePath, contents.replace(/Firefox/g, 'Ghostery'));
    }));
  },
});
