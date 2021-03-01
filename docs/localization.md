# Localization

We leverage the Firefox [Localization](https://firefox-source-docs.mozilla.org/l10n/overview.html)
system in order to provide the browser in multiple languages.

The process to build a language-specific version of Firefox is roughly the following:
 1. Build Firefox in English.
 2. Get a language pack for the desired language from `l10n-central`: https://hg.mozilla.org/l10n-central/
 3. Point the build system to the language packs with the `--with-l10n-base` option.
 4. Run `./mach build installers-{LANG}` to repack the browser for the desired language.

In this project we use the process, but adding a patching mechanism to allow us to update a subset
of the strings in the browser. In most cases the Mozilla-provided translations are acceptable, so
we don't need to change them.

Our process is as follows:
 1. Specify which language packs to download from `l10n-central` in our `.workspace` file. We specify
 a explicit mercurial commit from their tree to ensure reproducability. These language packs are then
 downloaded when running `./fern.js use`.
 ```json
 "locales": {
    "de": "de1025e5e9a9f831271dc1aa8437aba18a631662"
  }
  ```
  2. Create a file at `l10n/{LANG}.json`. This file specifies the strings in the language pack which
  should be modified. It is a nested JSON object, where the top level key points to a specific
  translation file, and the second to the key in that file to modify.

  When creating this file, `l10n/en-US.json` can be used as a base, as this file defines all the
  strings we change in the default English version of the browser. Ideally, every string changed
  here should have a corresponding change in all other languages.

  The `{LANG}.json` files are used when `./fern.js import-patches` is run to patch both the default
  strings in `mozilla-release`, as well as the language packs in the `l10n` folder.
  ```json
  {
    "path/to/strings.ftl": {
      "key": {
        "string": "Overridden translation"
      }
    }
  }
  ```
  3. For changes that cannot be patched with this method, standard git patches can also be used to
  modify language packs. This is done via the same method as patches to Firefox code - simply navigate
  to the `l10n/{LANG}` folder, make the desired changes and commit them. The `./fern.js export-patches`
  command will then create patch files in the `l10n-patches/{LANG}` folder which can be applied with
  `./fern.js import-patches`.

Once a language pack is configured by these steps, the fetching and patching of packs will be handled
entirely by `fern`'s `use` and `import-patches` flow, as with other browser changes.

## Notes

Useful command to look for traslation string `rg "private window" mozilla-release -g "*.{properties,ftl,dtd,inc}" -i`
