FROM debian:9
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
      patch \
      python3 \
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
      linux-libc-dev \
      linux-libc-dev:$ARCH \
      pkg-config \
      dpkg-dev \
      libstdc++-6-dev \
      libstdc++-6-dev:$ARCH \
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
      libreadline-gplv2-dev \
      libncursesw5-dev \
      libssl-dev \ 
      libsqlite3-dev \
      libgdbm-dev \ 
      libc6-dev \
      libbz2-dev \
      libffi-dev \
      zlib1g-dev\
      # extras
      wine64 wine upx-ucl \
      python3-pip zstd \
      libasound2-dev libcurl4-openssl-dev \
      libnss3-tools \
      locales \
      liblzma-dev \
      curl \
      xz-utils
      
RUN wget https://www.python.org/ftp/python/3.9.2/Python-3.9.2.tgz && \
  tar xzf Python-3.9.2.tgz && \
  cd Python-3.9.2 && \
  ./configure --enable-optimizations && \
  make altinstall && \
  update-alternatives --install /usr/local/bin/python3 python3 /usr/local/bin/python3.9 10 && \
  update-alternatives --install /usr/local/bin/pip3 pip3 /usr/local/bin/pip3.9 10 

# custom
RUN curl https://nodejs.org/dist/v14.16.0/node-v14.16.0-linux-x64.tar.xz -o /node.tar.xz
RUN mkdir -p /node
RUN tar -xf /node.tar.xz --strip-components=1 -C /node
ENV PATH="/node/bin:${PATH}"
RUN pip3 install zstandard importlib_metadata mar balrogclient
ADD fetch-content /builds/worker/bin/fetch-content
# mbsdiff and mar (built from martools on linux)
ADD mbsdiff /builds/worker/bin/mbsdiff
ADD mar /builds/worker/bin/mar
RUN chown -R worker:worker /builds/worker/bin && chmod 755 /builds/worker/bin/*
ENV PATH="/builds/worker/bin:${PATH}"
# fetches
RUN mkdir -p /builds/worker/fetches/ && \
    chown -R worker:worker /builds/worker/fetches

USER worker
