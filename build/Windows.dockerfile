FROM ua-build-base

RUN chown -R worker:worker /builds/worker/fetches

USER worker

RUN /builds/worker/bin/fetch-content static-url \
   --sha256 daa17556c8690a34fb13af25c87ced89c79a36a935bf6126253a9d9a5226367c \
   --size 2505205 \
   https://hg.mozilla.org/mozilla-build/raw-file/3b8c537ca3c879551956ad47ca9f089583f647c5/nsis-3.01.zip \
   /builds/worker/fetches/nsis-3.01.zip && \
    cd /builds/worker/fetches/ && \
    unzip nsis-3.01.zip && \
    rm nsis-3.01.zip
RUN /builds/worker/bin/fetch-content static-url \
    --sha256 5c076f87ba64d82f11513f4af0ceb07246a3540aa3c72ca3ffc2d53971fa56e3 \
    --size 462820 \
    https://hg.mozilla.org/mozilla-build/raw-file/3b8c537ca3c879551956ad47ca9f089583f647c5/upx-3.95-win64.zip \
    /builds/worker/fetches/upx-3.95-win64.zip && \
    cd /builds/worker/fetches/ && \
    unzip upx-3.95-win64.zip && \
    rm upx-3.95-win64.zip
RUN wget -O /builds/worker/fetches/binutils.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-binutils.latest/artifacts/public/build/binutils.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz
RUN wget -O /builds/worker/fetches/clang.tar.zst https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-clang-9-win-cross.latest/artifacts/public/build/clang.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst
RUN wget -O /builds/worker/fetches/rustc.tar.zst https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-rust-cross-1.43.latest/artifacts/public/build/rustc.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst
RUN wget -O /builds/worker/fetches/rust-size.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-rust-size.latest/artifacts/public/build/rust-size.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz
RUN wget -O /builds/worker/fetches/nasm.tar.bz2 https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-nasm.latest/artifacts/public/build/nasm.tar.bz2 && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.bz2 && \
    rm nasm.tar.bz2
RUN wget -O /builds/worker/fetches/node.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-node-10.latest/artifacts/public/build/node.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.xz && \
    rm node.tar.xz
RUN wget -O /builds/worker/fetches/cbindgen.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-cbindgen.latest/artifacts/public/build/cbindgen.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz
RUN wget -O /builds/worker/fetches/sccache.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-sccache.latest/artifacts/public/build/sccache.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz
RUN wget -O /builds/worker/fetches/dump_syms.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-dump-syms.latest/artifacts/public/build/dump_syms.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz
RUN wget -O /builds/worker/fetches/wine.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-wine.latest/artifacts/public/build/wine.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf wine.tar.xz && \
    rm wine.tar.xz
RUN wget -O /builds/worker/fetches/winchecksec.tar.bz2 https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-winchecksec.latest/artifacts/public/build/winchecksec.tar.bz2 && \
    cd /builds/worker/fetches/ && \
    tar -xf winchecksec.tar.bz2 && \
    rm winchecksec.tar.bz2

ADD --chown=worker:worker makecab.exe /builds/worker/fetches/

ENV MOZCONFIG=/builds/worker/mozconfig \
    MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/

COPY configs/windows.mozconfig /builds/worker/mozconfig

WORKDIR $WORKSPACE