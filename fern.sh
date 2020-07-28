#!/usr/bin/env sh

CACHE_FOLDER=".cache"

usage() {
  echo "Usage:"
  echo "  fern.sh use <FIREFOX RELEASE>"
  echo "  fern.sh reset <FIREFOX RELEASE>"
  echo
  echo "Examples:"
  echo "  ./fern.sh use 78.0.1"
}

init_cache_folder() {
  if ! [ -d "${CACHE_FOLDER}" ] ; then
    echo "Creating ${CACHE_FOLDER} folder"
    mkdir "${CACHE_FOLDER}"
  else
    echo "Using cache folder: ${CACHE_FOLDER}"
  fi
}

download_firefox_archive() {
  FIREFOX_RELEASE="$1"
  FIREFOX_FOLDER="$2"
  FIREFOX_FOLDER="firefox-${FIREFOX_RELEASE}"
  FIREFOX_ARCHIVE="${FIREFOX_FOLDER}.source.tar.xz"
  FIREFOX_ARCHIVE_URL="https://archive.mozilla.org/pub/firefox/releases/${FIREFOX_RELEASE}/source/${FIREFOX_ARCHIVE}"

  # Check if firefox source tree already exists
  if ! [ -d "${FIREFOX_FOLDER}" ] ; then
    # Check if the archive is already downloaded
    if ! [ -f "${FIREFOX_ARCHIVE}" ] ; then
      echo "Downloading ${FIREFOX_ARCHIVE}..."
      wget "${FIREFOX_ARCHIVE_URL}" -O "${FIREFOX_ARCHIVE}"
    else
      echo "Using cached archive: ${FIREFOX_ARCHIVE}"
    fi

    # Untar archive
    echo "Untar into ${FIREFOX_FOLDER}"
    tar -xf "${FIREFOX_ARCHIVE}"
  else
    echo "Using cached Firefox: ${FIREFOX_FOLDER}"
  fi
}

init_firefox_git() {
  FIREFOX_RELEASE="$1"
  FIREFOX_FOLDER="$2"
  FIREFOX_GIT="${FIREFOX_FOLDER}/.git"

  if ! [ -d "${FIREFOX_GIT}" ] ; then
    echo "Initializing git for ${FIREFOX_RELEASE}..."
    echo "This might take a few seconds, but result will be cached."
    (
      cd "${FIREFOX_FOLDER}"; \
        git init; \
        git checkout --orphan "${FIREFOX_RELEASE}"; \
        git add '*' '.*'; \
        git commit -am "Firefox ${FIREFOX_RELEASE}"; \
        git checkout -b workspace; \
    )
  else
    echo "Using cached git: ${FIREFOX_GIT}"
  fi
}

reset_firefox_git() {
  FIREFOX_RELEASE="$1"
  FIREFOX_FOLDER="$2"

  echo "Reset git for ${FIREFOX_RELEASE}"
  (
    cd "${FIREFOX_FOLDER}"; \
      git checkout "${FIREFOX_RELEASE}"; \
      git branch -D workspace; \
      git checkout -b workspace; \
  )
}

symlink_workspace() {
  FIREFOX_RELEASE="$1"
  FIREFOX_CACHED_FOLDER="$2"

  if [ -L "mozilla-release" ] ; then
    echo "Symlink exists, overriding..."
    rm mozilla-release # Delete existing symlink
  fi

  if [ -d "mozilla-release" ] ; then
    echo
    echo "Existing 'mozilla-release' directory: Cannot be overriden!"
    echo "Please remove this directory or move it somewhere else so that 'fern.sh' can proceed."
    exit 1
  fi

  ln -s "${FIREFOX_CACHED_FOLDER}" mozilla-release
  # symlink branding into mozilla-release
  if [ ! -L "${FIREFOX_CACHED_FOLDER}/browser/branding/ghostery" ] ; then
    ln -s ./branding/ghostery "${FIREFOX_CACHED_FOLDER}/browser/branding/ghostery"
  fi
  echo "Folder 'mozilla-release' now tracks ${FIREFOX_RELEASE}"
}

COMMAND="$1"
case "${COMMAND}" in
  use)
    FIREFOX_RELEASE="$2"
    FIREFOX_FOLDER="firefox-${FIREFOX_RELEASE}"
    FIREFOX_CACHED_FOLDER="${CACHE_FOLDER}/${FIREFOX_FOLDER}"

    echo "${FIREFOX_RELEASE}" > .workspace

    init_cache_folder
    (cd "${CACHE_FOLDER}"; download_firefox_archive "${FIREFOX_RELEASE}" "${FIREFOX_FOLDER}")
    (cd "${CACHE_FOLDER}"; init_firefox_git "${FIREFOX_RELEASE}" "${FIREFOX_FOLDER}")
    symlink_workspace "${FIREFOX_RELEASE}" "${CACHE_FOLDER}/${FIREFOX_FOLDER}"
    exit 0
    ;;
  reset)
    FIREFOX_RELEASE="$(cat .workspace)"
    FIREFOX_FOLDER="firefox-${FIREFOX_RELEASE}"
    FIREFOX_CACHED_FOLDER="${CACHE_FOLDER}/${FIREFOX_FOLDER}"
    (cd "${CACHE_FOLDER}"; reset_firefox_git "${FIREFOX_RELEASE}" "${FIREFOX_FOLDER}")
    exit 0
    ;;
  export-patches)
    echo "Exporting patches from working directory..."
    FIREFOX_RELEASE="$(cat .workspace)"

    # Reset folder of patches
    PATCHES_FOLDER="$(pwd)/patches"
    rm -frv "${PATCHES_FOLDER}"
    mkdir -pv "${PATCHES_FOLDER}"

    # Reset index of patches
    PATCHES_INDEX="${PATCHES_FOLDER}/.index"
    touch "${PATCHES_INDEX}"

    ( cd mozilla-release; \
      for sha1 in $(git log "${FIREFOX_RELEASE}"..workspace --oneline | cut -d' ' -f 1-1) ; do
        PATCH="$(git format-patch -1 ${sha1})"
        mv -v "${PATCH}" "${PATCHES_FOLDER}"
        echo "${PATCH}" >> "${PATCHES_INDEX}"
      done
    )
    exit 0
    ;;
  import-patches)
    echo "Patch working directory"
    PATCHES_FOLDER="$(pwd)/patches"
    PATCHES_INDEX="${PATCHES_FOLDER}/.index"

    if [ -d "${PATCHES_FOLDER}" ] ; then
      for patch in $(tac "${PATCHES_INDEX}") ; do
        ( cd mozilla-release; \
          git apply --stat "${PATCHES_FOLDER}/${patch}"; \
          git apply --check "${PATCHES_FOLDER}/${patch}"; \
          git am --signoff < "${PATCHES_FOLDER}/${patch}"; \
        )
      done
    fi

    exit 0
    ;;
  '')
    echo "Expected command name such as 'use'."
    echo
    usage
    exit 1
    ;;
  *)
    echo "Unsupported command: ${COMMAND}."
    echo
    usage
    exit 1
    ;;
esac
