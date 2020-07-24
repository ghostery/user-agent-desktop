FROM debian:10
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

### Add worker user and setup its workspace.
RUN mkdir /builds && \
    groupadd -g $GID worker && \
    useradd -u $UID -g $GID -d /builds/worker -s /bin/bash -m worker && \
    mkdir -p /builds/worker/workspace && \
    chown -R worker:worker /builds

# Declare default working folder
WORKDIR /builds/worker

VOLUME /builds/worker/checkouts
VOLUME /builds/worker/workspace
VOLUME /builds/worker/tooltool-cache

RUN dpkg --add-architecture $ARCH
RUN apt-get update
RUN apt-get dist-upgrade -y
RUN apt-get install -y \
      # from debian-raw
      apt-transport-https \
      ca-certificates \
      # from debian-base
      git \
      less \
      make \
      patch \
      python3.5 \
      python3-distutils-extra \
      python3-minimal \
      vim-tiny \
      xz-utils \
      # from debian-packages
      apt-utils \
      aptitude \
      build-essential \
      devscripts \
      fakeroot \
      git \
      # from debian-build
      autoconf2.13 \
      automake \
      bzip2 \
      curl \
      file \
      gawk \
      gcc-multilib \
      gnupg \
      jq \
      libucl1 \
      p7zip-full \
      procps \
      rsync \
      screen \
      tar \
      unzip \
      uuid \
      valgrind \
      wget \
      x11-utils \
      xvfb \
      yasm \
      zip \
      libc6-dev \
      pkg-config \
      dpkg-dev \
      libstdc++-8-dev \
      libstdc++-8-dev:$ARCH \
      libdbus-glib-1-dev:$ARCH \
      libdrm-dev:$ARCH \
      libfontconfig1-dev:$ARCH \
      libfreetype6-dev:$ARCH \
      libgconf2-dev:$ARCH \
      libgtk-3-dev:$ARCH \
      libgtk2.0-dev:$ARCH \
      libpango1.0-dev:$ARCH \
      libpulse-dev:$ARCH \
      libx11-xcb-dev:$ARCH \
      libxt-dev:$ARCH \
      libglib2.0-dev \
      # extras
      wine64 wine upx-ucl nodejs \
      python3-pip zstd autoconf2.13
# custom
RUN pip3 install zstandard
ADD fetch-content /builds/worker/bin/fetch-content
RUN chown -R worker:worker /builds/worker/bin && chmod 755 /builds/worker/bin/*
# fetches
RUN mkdir -p /builds/worker/fetches/