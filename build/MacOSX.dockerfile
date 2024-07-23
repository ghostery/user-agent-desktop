FROM ua-build-base

ENV MOZ_AUTOMATION_PACKAGE_TESTS="1"

RUN wget -nv -O /builds/worker/fetches/cctools.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/128.0/linux64-cctools-port/cctools.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf cctools.tar.zst && \
    rm cctools.tar.zst

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/128.0/linux64-clang-18/clang.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/sysroot-wasm32-wasi.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/128.0/sysroot-wasm32-wasi-clang-18/sysroot-wasm32-wasi.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf sysroot-wasm32-wasi.tar.zst && \
    rm sysroot-wasm32-wasi.tar.zst

COPY MacOSX14.4.sdk.tar.xz /builds/worker/fetches/

RUN cd /builds/worker/fetches/ && \
    tar -xf MacOSX14.4.sdk.tar.xz && \
    rm MacOSX14.4.sdk.tar.xz

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE