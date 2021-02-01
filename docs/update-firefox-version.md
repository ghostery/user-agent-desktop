# How to update Firefox version

Firefox releases new version every month and it is important for forks to update the upstream source as soon as possible for security reasons. 

Process of the update is manual as some of the patches managed by minions may have to be rewritten. 

Procedure is the following:
* update `.workspace` file with latest version of Firefox. It typically make sense to also bump version of the browser, eg. from 2021.01 to 2021.02
* run `./fern.js use` to download Firefox source and update `mozilla-release` folder with it
* run `./fern.js import-patches` - *this step will likely fail*

## What to do with failing import-patches?

Fern imports all patches in a single operation but git will try to apply them one after other. In case of a failure git will exit with error but suggest next actions:
1. check the failing patch with `git am --show-current-patch=diff` and decide what to do
    1. if the patch is simple you can try to recreate from scratch in the current working tree
    1. if the patch is complext you can try to apply it manuall with help of `git apply --verbose --reject ../patches/0018-Manual-override-of-search-engine-list.patch`
2. `git add` your changes and when ready let git am to continue with next patch with `git am --continue`
3. do this until all patches are successfuly applied


This will result in a working tree that has all the patches but `./fern.js import-patches` not fully done (for instance translations were not applied).
To get to the clean state do:
* `./fern.js export-patches` to get the updates patches into `patches` folder
* `./fern.js reset` to clean the working tree - check `git status` if in fact it was propertly cleared
* `./fern.js import-patches` should apply correcly this time (you may have to delete `l10n-patches` folder if it was present in repository root)

At this stage the update process is completed and is ready to be submitted as PR.

Remeber to update ipfs cache in the `.workspace` so that CD can pick up Firefox source.
