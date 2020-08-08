FROM mozbuild:base



ENV TOOLTOOL_MANIFEST=browser/config/tooltool-manifests/macosx64/cross-releng.manifest



RUN wget -O /builds/worker/fetches/binutils.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-binutils.latest/artifacts/public/build/binutils.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz

RUN wget -O /builds/worker/fetches/cctools.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-cctools-port.latest/artifacts/public/build/cctools.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf cctools.tar.xz && \
    rm cctools.tar.xz

RUN wget -O /builds/worker/fetches/clang.tar.zst https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-clang-9-macosx-cross.latest/artifacts/public/build/clang.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -O /builds/worker/fetches/hfsplus-tools.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-hfsplus.latest/artifacts/public/build/hfsplus-tools.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf hfsplus-tools.tar.xz && \
    rm hfsplus-tools.tar.xz

RUN wget -O /builds/worker/fetches/dmg.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-libdmg.latest/artifacts/public/build/dmg.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf dmg.tar.xz && \
    rm dmg.tar.xz

RUN wget -O /builds/worker/fetches/llvm-dsymutil.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-llvm-dsymutil.latest/artifacts/public/build/llvm-dsymutil.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf llvm-dsymutil.tar.xz && \
    rm llvm-dsymutil.tar.xz

RUN wget -O /builds/worker/fetches/rustc.tar.zst https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-rust-macos-1.43.latest/artifacts/public/build/rustc.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -O /builds/worker/fetches/rust-size.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-rust-size.latest/artifacts/public/build/rust-size.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz

RUN wget -O /builds/worker/fetches/cbindgen.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-cbindgen.latest/artifacts/public/build/cbindgen.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz

RUN wget -O /builds/worker/fetches/sccache.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-sccache.latest/artifacts/public/build/sccache.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz

RUN wget -O /builds/worker/fetches/nasm.tar.bz2 https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-nasm.latest/artifacts/public/build/nasm.tar.bz2 && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.bz2 && \
    rm nasm.tar.bz2

RUN wget -O /builds/worker/fetches/node.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-node-10.latest/artifacts/public/build/node.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.xz && \
    rm node.tar.xz

RUN wget -O /builds/worker/fetches/lucetc.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-lucetc.latest/artifacts/public/build/lucetc.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf lucetc.tar.xz && \
    rm lucetc.tar.xz

RUN wget -O /builds/worker/fetches/wasi-sysroot.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.wasi-sysroot.latest/artifacts/public/build/wasi-sysroot.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf wasi-sysroot.tar.xz && \
    rm wasi-sysroot.tar.xz

ENV TOOLTOOL_DIR=/builds/worker/fetches/ RUSTC=/builds/worker/fetches/rustc/bin/rustc CARGO=/builds/worker/fetches/rustc/bin/cargo RUSTFMT=/builds/worker/fetches/rustc/bin/rustfmt CBINDGEN=/builds/worker/fetches/cbindgen/cbindgen

ADD vs2017_15.8.4.zip /builds/worker/fetches/

RUN cd /builds/worker/fetches/ && unzip vs2017_15.8.4.zip && rm vs2017_15.8.4.zip

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ MOZCONFIG=/builds/worker/workspace/.mozconfig

USER worker