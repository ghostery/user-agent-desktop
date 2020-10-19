FROM ua-build-base

RUN ipfs init

ENV MOZ_AUTOMATION_PACKAGE_TESTS=1



ADD fetch-toolchain-Linux.sh /builds/worker/bin/

RUN /bin/bash /builds/worker/bin/fetch-toolchain-Linux.sh

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE