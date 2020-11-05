# User Agent Desktop

This project is a fork of Firefox, which aims simplify the process of adding custom branding to
Firefox, as well as selectively disabling/modifying features. This approach can be summarised in
the follow steps:

 1. Take a source snapshot of Firefox.
 2. Copy in branding assets to restyle the browser.
 3. Modify browser prefs to enable/disable features.
 4. Use pre-installed extensions primarily for custom features.
 5. If needed use patches to modify/remove features that cannot be done by prefs or extensions.

This document contains information on the whole process of forking Firefox, and how it is done in
this project:

## Fern

`fern.js` is our build tool for applying the snapshot and patch approach to forking Firefox. The
core fern workflow consists of `fern.js use` and `fern.js import-patches` which together reproduce
a full Firefox source with all the changes applied for our fork.

### `fern.js use`

The basis of fern is a declaritive specification of what we need to build our fork, i.e. which version
of the Firefox source we need, and which extensions to pull in. This is specified in the
`.workspace` file:

```json
{
  "addons": {
    "ghostery": "https://ghostery-deployments.s3.amazonaws.com/ghostery-extension/8.5.4.5bf5c45f/ghostery-firefox-v8.5.4.zip",
    "ghostery-search": "https://github.com/ghostery/ghostery-search-extension/releases/download/v0.1.12/ghostery_search-0.1.12.zip"
  },
  "firefox": "82.0.2",
  "app": "2020.10.1"
}
```

`fern.js use` takes this file and fetches the appropriate sources to set up the initial workspace.
The Firefox sources for the named version are fetched and extracted into the `mozilla-release`
folder, and a git repo is initialised.

Likewise, the named extensions are fetched, and a `moz.build` file automatically generated for each
to enable them to be bundled with the build later.

### `fern.js import-patches`

After running `use` we now have a clean `mozilla-release` folder containing unmodified Firefox source,
and our browser extensions ready to include. `fern.js import-patches` systemetically applys the
following changes to the `mozilla-release` directory:

 1. Update the app version to the one specified in `.workspace`. This allows us to diverge from
 Firefox's naming convensions.
 2. Copy the pre-fetched addons into `mozilla-release` such that they will be bundled as priveleged
 system addons (see [Addon bundling](./addon-bundling.md)).
 3. Copy branding folders from the `brands` folder to inside `mozilla-release`. This branding folder
 overrides most icons in Firefox (via the `--with-branding=` build flag), allowing us to make the
 browser look our own. Branding also includes a file allowing us to specify default pref values.
 4. Copy our own certificates over. This is used for update verification (see [Update system](./update-system.md))
 5. Patch several places where 'Firefox' is hardcoded in strings (for example on error pages). This
 is done by a simple find and replace on specific files.

After running these _managed_ patches (whose content is dynamic), we apply a set of manual patches
from the `patches` folder. Once this completes the `mozilla-release` folder now is ready to build
the browser.

## Building

The browser can be built in two ways:
 1. Set up your local environment and toolchain to build for your device's platform. Best for local
 development of the browser.
 2. Use our dockerised builds to build for any supported platform using a fixed build toolchain.

### Local dev build environment

Once you've done the initial workspace setup with `fern`, building locally works the same as
building Firefox, which is well documented [here](https://firefox-source-docs.mozilla.org/setup/index.html). The full process looks something like this:

```sh
git clone https://github.com/ghostery/user-agent-desktop.git
cd user-agent-desktop
npm ci # Fern.js dependencies
./fern.js use # Pull the correct Firefox and Ghostery extension sources
./fern.js import-patches # Apply patches to Firefox
cd mozilla-release
./mach bootstrap
MOZCONFIG=/path/to/user-agent-desktop/brands/ghostery/mozconfig ./mach build # start build
./mach run # to launch the browser
```

### Dockerised builds

We have cross-platform builds in docker with an environment set up to mimic Mozilla's own
[Taskcluster](https://taskcluster.net/)
environment. We have a [base build image](../build/Base.dockerfile) based on Debian 10 and with the
core build dependencies installed and workspace set up to mimic taskcluster's setup. Then, platform
specific Dockerfiles use this base image and fetch the specific toolchains required for that build.
The list of toolchains is generated from taskcluster definitions of the builds we want to run. By
mimicing the taskcluster setup we can import Mozilla's own `mozconfig` files for production builds
in order to set environment variables for the build.

The platform-specific Dockerfiles can be dynamically re-generated with the `./fern.js generate`
command. This command:
 1. Checks the toolchains required from taskcluster definitions in the `mozilla-release` tree.
 2. Fetches snapshots of these toolchains from taskcluster and caches them in IPFS.
 3. Writes the Dockerfiles to fetch and use these toolchains.

This allows us to update the toolchain in line with Mozilla as we update to new Firefox releases,
but also always be able to build previous versions against the correct toolchain.

For dockerized builds we need to merge our branded `mozconfig` (which sets the branding folder,
binary name etc), with the platform specific config which configures the toolchains. Again fern
provides a helper for this `./fern.js config`. We can pass a platform and brand to generate a
merged `mozconfig` for building the browser.

### Optimized builds

Dockerized builds will by default generate a 'release' build, with compiler optimization enabled.
Further to this, we also do PGO builds which use an execution profile of the executable to further
optimize hot paths.

Our CI builds use PGO on nightly builds. We download the pre-generated profile files `en-US.log`
and `merged.profdata` and put them in the `mozilla-release` folder. Then if we set the `PGO_PROFILE_USE`
environment variable when building the PGO build flags will be set.

PGO profiles for the PGO builds can be generated as follows:
 1. Build the browser with the `PGO_PROFILE_GENERATE` env set.
 2. Ensure you have a version of clang for your platform matching the version used for the build.
 3. `export JARLOG_FILE="en-US.log"`
 4. `export LLVM_PROFDATA=/path/to/clang/bin/llvm-profdata`
 5. `./mach python build/pgo/profileserver.py --binary /path/to/Ghostery-bin`
 6. You should see the files `en-US.log` and `merged.profdata` in your `mozilla-release` folder.

This process is also automated in the `ci.pgo.Jenkinsfile` build on CI.
