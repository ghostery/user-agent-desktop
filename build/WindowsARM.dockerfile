FROM ua-build-base

ENV PERFHERDER_EXTRA_OPTIONS=aarch64 \
    MOZ_AUTOMATION_PACKAGE_TESTS=1

RUN /builds/worker/bin/fetch-content static-url \
    --sha256 5c076f87ba64d82f11513f4af0ceb07246a3540aa3c72ca3ffc2d53971fa56e3 \
    --size 462820 \
    https://hg.mozilla.org/mozilla-build/raw-file/3b8c537ca3c879551956ad47ca9f089583f647c5/upx-3.95-win64.zip \
    /builds/worker/fetches/upx-3.95-win64.zip && \
    cd /builds/worker/fetches/ && \
    unzip upx-3.95-win64.zip && \
    rm upx-3.95-win64.zip

RUN wget -nv -O /builds/worker/fetches/binutils.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-binutils/binutils.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.zst && \
    rm binutils.tar.zst

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-clang-15/clang.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-rust-cross-1.65/rustc.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -nv -O /builds/worker/fetches/rust-size.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-rust-size/rust-size.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.zst && \
    rm rust-size.tar.zst

RUN wget -nv -O /builds/worker/fetches/nasm.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-nasm/nasm.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.zst && \
    rm nasm.tar.zst

RUN wget -nv -O /builds/worker/fetches/node.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-node-16/node.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.zst && \
    rm node.tar.zst

RUN wget -nv -O /builds/worker/fetches/cbindgen.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-cbindgen/cbindgen.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.zst && \
    rm cbindgen.tar.zst

RUN wget -nv -O /builds/worker/fetches/sccache.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-sccache/sccache.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.zst && \
    rm sccache.tar.zst

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-dump_syms/dump_syms.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.zst && \
    rm dump_syms.tar.zst

RUN wget -nv -O /builds/worker/fetches/wine.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-wine/wine.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf wine.tar.zst && \
    rm wine.tar.zst

RUN wget -nv -O /builds/worker/fetches/liblowercase.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-liblowercase/liblowercase.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf liblowercase.tar.zst && \
    rm liblowercase.tar.zst

RUN wget -nv -O /builds/worker/fetches/winchecksec.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/linux64-winchecksec/winchecksec.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf winchecksec.tar.zst && \
    rm winchecksec.tar.zst

RUN wget -nv -O /builds/worker/fetches/nsis.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/nsis/nsis.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf nsis.tar.zst && \
    rm nsis.tar.zst

RUN wget -nv -O /builds/worker/fetches/sysroot-x86_64-linux-gnu.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/sysroot-x86_64-linux-gnu/sysroot-x86_64-linux-gnu.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf sysroot-x86_64-linux-gnu.tar.zst && \
    rm sysroot-x86_64-linux-gnu.tar.zst

RUN wget -nv -O /builds/worker/fetches/sysroot-wasm32-wasi.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/109.0/sysroot-wasm32-wasi-clang-15/sysroot-wasm32-wasi.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf sysroot-wasm32-wasi.tar.zst && \
    rm sysroot-wasm32-wasi.tar.zst

ADD --chown=worker:worker makecab.exe /builds/worker/fetches/

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE