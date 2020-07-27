# Fern

The `fern.sh` script (soon to be rewritten in Node.js ;)), gives a taste of how a patch-based workflow would look like.

```sh
$ ./fern.sh use 78.0.1
$ cd mozilla-release # Do some stuff... and commit your changes
$ ./fern.sh export-patches # Check 'patches' folder
$ ./fern.sh reset # reset 'mozilla-release' folder
$ ./fern.sh import-patches # Check 'mozilla-release' folder again!
```

## Setting up a dev environment

Use the gecko-dev repo to setup your build environment:
```bash
git clone https://github.com/mozilla/gecko-dev.git
cd gecko-dev
./mach bootstrap
```

Now you should be able use `./mach build` in this project.

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
