FROM ua-build-base

ENV MOZ_AUTOMATION_PACKAGE_TESTS="1" \
    MOZ_ENABLE_FULL_SYMBOLS="1"

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/126.0/linux64-clang-17/clang.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/126.0/linux64-rust-1.77/rustc.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -nv -O /builds/worker/fetches/rust-size.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/126.0/linux64-rust-size/rust-size.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.zst && \
    rm rust-size.tar.zst

RUN wget -nv -O /builds/worker/fetches/cbindgen.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/126.0/linux64-cbindgen/cbindgen.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.zst && \
    rm cbindgen.tar.zst

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/126.0/linux64-dump_syms/dump_syms.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.zst && \
    rm dump_syms.tar.zst

RUN wget -nv -O /builds/worker/fetches/nasm.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/126.0/linux64-nasm/nasm.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.zst && \
    rm nasm.tar.zst

RUN wget -nv -O /builds/worker/fetches/node.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/126.0/linux64-node-18/node.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.zst && \
    rm node.tar.zst

RUN wget -nv -O /builds/worker/fetches/pkgconf.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/126.0/linux64-pkgconf/pkgconf.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf pkgconf.tar.zst && \
    rm pkgconf.tar.zst

RUN wget -nv -O /builds/worker/fetches/sysroot-x86_64-linux-gnu.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/126.0/sysroot-x86_64-linux-gnu/sysroot-x86_64-linux-gnu.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf sysroot-x86_64-linux-gnu.tar.zst && \
    rm sysroot-x86_64-linux-gnu.tar.zst

RUN wget -nv -O /builds/worker/fetches/sysroot-wasm32-wasi.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/126.0/sysroot-wasm32-wasi-clang-17/sysroot-wasm32-wasi.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf sysroot-wasm32-wasi.tar.zst && \
    rm sysroot-wasm32-wasi.tar.zst

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE