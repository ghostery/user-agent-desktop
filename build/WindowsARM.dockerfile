FROM ua-build-base

ENV PERFHERDER_EXTRA_OPTIONS="aarch64" \
    MOZ_ARTIFACT_TASK="[object Object]" \
    MOZ_ARTIFACT_TASK_WIN32_OPT="[object Object]" \
    USE_ARTIFACT="1"

RUN /builds/worker/bin/fetch-content static-url \
    --sha256 5c076f87ba64d82f11513f4af0ceb07246a3540aa3c72ca3ffc2d53971fa56e3 \
    --size 462820 \
    https://hg.mozilla.org/mozilla-build/raw-file/3b8c537ca3c879551956ad47ca9f089583f647c5/upx-3.95-win64.zip \
    /builds/worker/fetches/upx-3.95-win64.zip && \
    cd /builds/worker/fetches/ && \
    unzip upx-3.95-win64.zip && \
    rm upx-3.95-win64.zip

RUN wget -nv -O /builds/worker/fetches/node.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/117.0/linux64-node-16/node.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.zst && \
    rm node.tar.zst

RUN wget -nv -O /builds/worker/fetches/wine.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/117.0/linux64-wine/wine.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf wine.tar.zst && \
    rm wine.tar.zst

RUN wget -nv -O /builds/worker/fetches/nsis.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/117.0/nsis/nsis.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf nsis.tar.zst && \
    rm nsis.tar.zst

ADD --chown=worker:worker makecab.exe /builds/worker/fetches/

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE