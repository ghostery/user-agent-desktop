# Updates

We use Firefox's built in update system to update the browser, running our own [Balrog](https://github.com/mozilla-releng/balrog)
server to provide updates. We have a [fork](https://github.com/ghostery/balrog) of that project
that contains the changes needed to configure the update server for our purposes, and the deployment
steps. The deployment is documented [here](https://github.com/ghostery/balrog/blob/ghostery/Deployment.md).

The balrog public endpoint is available at `update.ghosterybrowser.com`, and we configure the browser
to use this URL by setting `MOZ_APPUPDATE_HOST` during the build. This is achived by the
[this patch](../patches/0002-Set-update-URL.patch).

## Update channels

We have two update channels, `release` and `nightly`. On balrog we can configure which version
each channel should get. The `nightly` channel automatically gets nightly builds run on CI. This is
done by the "publish to balrog" step of the Jenkins job. Submitting a new nightly build to balrog
consists of 3 steps.
 1. Creating a release on balrog. `python3 ci/submitter.py release --tag TAG_NAME`
 2. Attaching each build to the release (each `.mar` file is fingerprinted). `python3 ci/submitter.py build --tag TAG_NAME --bid BUILD_ID --mar ARTIFACT_PATH`
 3. Update the nightly update rule to point to the new release: `python3 ci/submitter.py nightly --tag TAG_NAME`

The operations on the balrog API are implemented by the [`ci/submitter.py`](../ci/submitter.py)
script, which uses Mozilla's `balrogclient` library to talk to the balrog admin endpoint.

The `release` channel is manually updated via the balrog admin UI to point to specific release
builds which were uploaded as nightly builds.

## Changing update channels

The update channel used by the browser is configured by the `app.update.channel` pref. In Firefox
this pref is locked, so it can only be changed by editing files on disk. Changes made in `about:config`
to this pref will not register. This is so that the update channel can be locked with the build
and it should not be changed after install.

For Ghostery we distribute the same builds to both channels in order to simplify the build process,
but this means that we cannot configure release builds differently to nightlies. We get around this
by making `app.update.channel` pref changes from `about:config` work, so users can manually update
their update channel in the browser. This is achieved via a subtle change to `UpdateUtils.jsm`, as
you can see in this [patch](../patches/0031-Allow-update-channel-to-be-configured-via-prefs.patch).

## Partial updates

For incremental updates partial updates can be used to reduce the update size. From a normal build
a "complete" update `.mar` file is generated, which contains a full update from any version to the
new version. We can also generate a diff between too complete mars, which can be used to update
between specific versions.

This "partial" mar can be generated with the following steps (see also `ci/mar_diff.sh`)
 1. Download both mars and unpack each with the `mozilla-release/tools/update-packaging/unwrap_full_update.pl`
 script.
 2. Run `mozilla-release/tools/update-packaging/make_incremental_update.sh` with the two unpacked mars
 as input.

We can then add these partials to a balrog Release, which enables clients with specific versions to
use the partial to update rather than the complete mar.

The "partial-updates" Jenkins job automates the generation of partials, given a pair of releases to diff,
by doing the following:

 1. Fetching mars for all build targets for the given releases (using Balrog to get the download
 links for these) and diffing each pair (implemented by `ci/partials.py generate`).
 2. Signing the partial mars.
 3. Uploading mars to Github Releases.
 4. Updating Balrog with the new partial builds (implemented by `ci/partials.py publish`)
