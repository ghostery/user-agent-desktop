# Fern

The `fern.js` script (soon to be rewritten in Node.js ;)), gives a taste of how a patch-based workflow would look like.

```sh
$ ./fern.js use --firefox 78.0.1
$ cd mozilla-release # Do some stuff... and commit your changes
$ ./fern.js export-patches # Check 'patches' folder
$ ./fern.js reset # reset 'mozilla-release' folder
$ ./fern.js import-patches # Check 'mozilla-release' folder again!
```

## Setting up a dev environment

`./mach bootstrap` requires a VC checkout of the gecko source to run properly. Use the gecko-dev repo to run `mach bootstrap` and setup your local build environment:
```bash
git clone https://github.com/mozilla/gecko-dev.git
cd gecko-dev
./mach bootstrap
```

Now you should be able use `./mach build` in this project.

Alternatively, the `build-*` scripts in this repo will prepare docker images with a prepared build environment for each platform. The scripts will drop you to a command prompt in a docker container where you can run `./mach build` directly.

# Building on windows

## Prerequisites

### VS2017 Redist

This can be built on windows after setting up a build environment as per [these instructions](https://firefox-source-docs.mozilla.org/setup/windows_build.html#building-firefox-on-windows).
You will need to install the Windows 10 SDK at version `10.0.17134.0`. Then run the following to create `vs2017_15.8.4.zip`:

```bash
./mach python build/windows_toolchain.py create-zip vs2017_15.8.4
```

### Makecab.exe

This is copied from a windows install at `C:\Windows\System32\makecab.exe`.
