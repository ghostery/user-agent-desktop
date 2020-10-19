FROM ua-build-base

RUN ipfs init

ENV 



ADD fetch-toolchain-MacOSX.sh /builds/worker/bin/

RUN /bin/bash /builds/worker/bin/fetch-toolchain-MacOSX.sh

COPY MacOSX10.11.sdk.tar.bz2 /builds/worker/fetches/

RUN cd /builds/worker/fetches/ && \
    tar -xf MacOSX10.11.sdk.tar.bz2 && \
    rm MacOSX10.11.sdk.tar.bz2

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE