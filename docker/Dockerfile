FROM debian:10
ENV DEBIAN_FRONTEND=noninteractive
ENV XZ_OPT=-T0

ENV HOME=/builds/worker \
    SHELL=/bin/bash \
    USER=worker \
    LOGNAME=worker \
    HOSTNAME=taskcluster-worker
ENV ARCH=i386

### Add worker user and setup its workspace.
RUN mkdir /builds && \
    groupadd -g 1000 worker && \
    useradd -u 1000 -g 1000 -d /builds/worker -s /bin/bash -m worker && \
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
      libstdc++-8-dev \
      linux-libc-dev:$ARCH \
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
      # extras
      wine64 wine upx-ucl nodejs wine32 \
      python3-pip zstd
# custom
RUN pip3 install zstandard
ADD fetch-content /builds/worker/bin/fetch-content
RUN chown -R worker:worker /builds/worker/bin && chmod 755 /builds/worker/bin/*

# fetches
RUN mkdir -p /builds/worker/fetches/
ENV MOZ_FETCHES_DIR=/builds/worker/fetches/

# clangmingw
RUN wget -O $MOZ_FETCHES_DIR/clangmingw.tar.zst \
    https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-clang-9-mingw-x64.latest/artifacts/public/build/clangmingw.tar.zst
RUN cd $MOZ_FETCHES_DIR && \
    tar -xf clangmingw.tar.zst && \
    rm clangmingw.tar.zst
# rust
RUN wget -O ${MOZ_FETCHES_DIR}rustc.tar.zst \
    https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.mingw32-rust-1.43.latest/artifacts/public/build/rustc.tar.zst
RUN cd $MOZ_FETCHES_DIR && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst
# cbindgen
RUN wget -O ${MOZ_FETCHES_DIR}cbindgen.tar.xz \
    https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-cbindgen.latest/artifacts/public/build/cbindgen.tar.xz
RUN cd $MOZ_FETCHES_DIR && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz
# nsis
RUN wget -O ${MOZ_FETCHES_DIR}nsis.tar.xz \
    https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-mingw32-nsis.latest/artifacts/public/build/nsis.tar.xz
# fxc2
RUN wget -O ${MOZ_FETCHES_DIR}fxc2.tar.xz \
    https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-mingw-fxc2-x86.latest/artifacts/public/build/fxc2.tar.xz
RUN cd $MOZ_FETCHES_DIR && \
    tar -xf fxc2.tar.xz && \
    rm fxc2.tar.xz

# nasm
RUN /builds/worker/bin/fetch-content static-url \
    --sha256 e24ade3e928f7253aa8c14aa44726d1edf3f98643f87c9d72ec1df44b26be8f5 \
    --size 827620 \
    https://www.nasm.us/pub/nasm/releasebuilds/2.14.02/nasm-2.14.02.tar.xz \
    /builds/worker/fetches/nasm-2.14.02.tar.xz
ADD build-nasm.sh /builds/worker/bin
RUN cd $MOZ_FETCHES_DIR && \
    tar -xf nasm-2.14.02.tar.xz && \
    rm nasm-2.14.02.tar.xz
RUN UPLOAD_DIR=/builds/worker/bin/ bash /builds/worker/bin/build-nasm.sh && \
    ln -s /builds/worker/fetches/nasm-2.14.02/nasm/nasm /usr/local/bin/nasm

ADD setup-windows-env.sh /builds/worker/bin
RUN chmod +x /builds/worker/bin/setup-windows-env.sh
RUN chown -R worker:worker /builds/worker/fetches
USER worker
