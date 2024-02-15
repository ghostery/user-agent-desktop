FROM debian:12
ENV DEBIAN_FRONTEND=noninteractive
ENV XZ_OPT=-T0

ENV HOME=/builds/worker \
    SHELL=/bin/bash \
    USER=worker \
    LOGNAME=worker \
    HOSTNAME=taskcluster-worker
ENV ARCH=amd64
ARG UID
ARG GID
ARG user

## Add worker user and setup its workspace.
RUN mkdir /builds && \
    (getent group $GID || groupadd -g $GID worker) && \
    groupmod -n worker `getent group $GID | cut -d: -f1` && \
    useradd -u $UID -g $GID -d /builds/worker -s /bin/bash -m worker && \
    mkdir -p /builds/worker/workspace && \
    chown -R worker:worker /builds

# Declare default working folder
WORKDIR /builds/worker

VOLUME /builds/worker/checkouts
VOLUME /builds/worker/workspace
VOLUME /builds/worker/tooltool-cache



RUN dpkg --add-architecture $ARCH
RUN apt-get update && \
    apt-get dist-upgrade -y  && \
    apt-get install -y \
      # from debian-raw
      apt-transport-https \
      ca-certificates \
      # from debian-base
      git \
      less \
      make \
      mercurial \
      patch \
      python3 \
      python3-minimal \
      python3-zstandard \
      python3-psutil \
      python3-venv \
      vim-tiny \
      xz-utils \
      zstd \
      # from debian-packages
      apt-utils \
      aptitude \
      build-essential \
      devscripts \
      equivs \
      fakeroot \
      git \
      # from debian-build
      bash \
      binutils \
      bzip2 \
      cpio \
      curl \
      file \
      findutils \
      gawk \
      gnupg \
      gzip \
      jq \
      lib32atomic1 \
      'lib32gcc(1|-s1)$' \
      lib32stdc++6 \
      lib32z1 \
      libasound2 \
      libc6-i386 \
      libgtk-3-0 \
      libucl1 \
      libxml2 \
      m4 \
      make \
      p7zip-full \
      perl \
      procps \
      python3-dev \
      rsync \
      screen \
      tar \
      unzip \
      uuid \
      wget \
      x11-utils \
      zip \
      # extras
      wine64 \
      wine \
      nodejs \
      npm \
      python3-pip \
      pipx \
      libasound2-dev \
      libcurl4-openssl-dev \
      libnss3-tools \
      python3-cairo \
      locales \
      liblzma-dev

# mbsdiff and mar (built from martools on linux)
ADD mbsdiff /builds/worker/bin/mbsdiff
ADD mar /builds/worker/bin/mar
RUN chown -R worker:worker /builds/worker/bin && chmod 755 /builds/worker/bin/*
ENV PATH="/builds/worker/bin:${PATH}"

# fetches
ADD fetch-content /builds/worker/bin/fetch-content
RUN mkdir -p /builds/worker/fetches/ && \
    chown -R worker:worker /builds/worker/fetches

USER worker
