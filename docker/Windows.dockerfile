FROM mozbuild:base

ENV TOOLTOOL_MANIFEST=browser/config/tooltool-manifests/win64/releng.manifest\
    MOZ_AUTOMATION_PACKAGE_TESTS=1

ADD resources /builds/worker/resources
RUN mv /builds/worker/resources/* /builds/worker/fetches/
RUN chown -R worker:worker /builds/worker/fetches
RUN apt-get install -y rename
USER worker

#RUN /builds/worker/bin/fetch-content static-url \
#    --sha256 daa17556c8690a34fb13af25c87ced89c79a36a935bf6126253a9d9a5226367c \
#    --size 2505205 \
#    https://hg.mozilla.org/mozilla-build/raw-file/3b8c537ca3c879551956ad47ca9f089583f647c5/nsis-3.01.zip \
#    /builds/worker/fetches/nsis-3.01.zip && \
RUN cd /builds/worker/fetches/ && \
    unzip nsis-3.01.zip && \
    rm nsis-3.01.zip
# RUN /builds/worker/bin/fetch-content static-url \
#     --sha256 5c076f87ba64d82f11513f4af0ceb07246a3540aa3c72ca3ffc2d53971fa56e3 \
#     --size 462820 \
#     https://hg.mozilla.org/mozilla-build/raw-file/3b8c537ca3c879551956ad47ca9f089583f647c5/upx-3.95-win64.zip \
#     /builds/worker/fetches/upx-3.95-win64.zip && \
RUN cd /builds/worker/fetches/ && \
    unzip upx-3.95-win64.zip && \
    rm upx-3.95-win64.zip
# RUN wget -O /builds/worker/fetches/binutils.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-binutils.latest/artifacts/public/build/binutils.tar.xz && \
RUN cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz
# RUN wget -O /builds/worker/fetches/clang.tar.zst https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-clang-9-win-cross.latest/artifacts/public/build/clang.tar.zst && \
RUN cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst
# RUN wget -O /builds/worker/fetches/rustc.tar.zst https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-rust-cross-1.43.latest/artifacts/public/build/rustc.tar.zst && \
RUN cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst
# RUN wget -O /builds/worker/fetches/rust-size.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-rust-size.latest/artifacts/public/build/rust-size.tar.xz && \
RUN cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz
# RUN wget -O /builds/worker/fetches/nasm.tar.bz2 https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-nasm.latest/artifacts/public/build/nasm.tar.bz2 && \
RUN cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.bz2 && \
    rm nasm.tar.bz2
# RUN wget -O /builds/worker/fetches/node.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-node-10.latest/artifacts/public/build/node.tar.xz && \
RUN cd /builds/worker/fetches/ && \
    tar -xf node.tar.xz && \
    rm node.tar.xz
# RUN wget -O /builds/worker/fetches/cbindgen.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-cbindgen.latest/artifacts/public/build/cbindgen.tar.xz && \
RUN cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz
# RUN wget -O /builds/worker/fetches/sccache.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-sccache.latest/artifacts/public/build/sccache.tar.xz && \
RUN cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz
# RUN wget -O /builds/worker/fetches/dump_syms.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-dump-syms.latest/artifacts/public/build/dump_syms.tar.xz && \
RUN cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz
# RUN wget -O /builds/worker/fetches/wine.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-wine.latest/artifacts/public/build/wine.tar.xz && \
RUN cd /builds/worker/fetches/ && \
    tar -xf wine.tar.xz && \
    rm wine.tar.xz
# RUN wget -O /builds/worker/fetches/liblowercase.tar.xz https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-liblowercase.latest/artifacts/public/build/liblowercase.tar.xz && \
RUN cd /builds/worker/fetches/ && \
    tar -xf liblowercase.tar.xz && \
    rm liblowercase.tar.xz
# RUN wget -O /builds/worker/fetches/winchecksec.tar.bz2 https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.linux64-winchecksec.latest/artifacts/public/build/winchecksec.tar.bz2 && \
RUN cd /builds/worker/fetches/ && \
    tar -xf winchecksec.tar.bz2 && \
    rm winchecksec.tar.bz2
# RUN wget -O /builds/worker/fetches/winchecksec.tar.bz2 https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.win64-dump-syms.latest/artifacts/public/build/dump_syms.tar.bz2 && \
# RUN cd /builds/worker/fetches/ && \
#     tar -xf dump_syms.tar.bz2 && \
#     rm dump_syms.tar.bz2
# RUN cd /builds/worker/fetches/ && \
#     tar -xf pdbstr.tar.bz2 && \
#     rm pdbstr.tar.bz2
RUN mkdir /builds/worker/fetches/pdbstr && \
    touch /builds/worker/fetches/pdbstr/pdbstr.exe

ENV TOOLTOOL_DIR=/builds/worker/fetches/ \
    RUSTC=/builds/worker/fetches/rustc/bin/rustc \
    CARGO=/builds/worker/fetches/rustc/bin/cargo \
    RUSTFMT=/builds/worker/fetches/rustc/bin/rustfmt \
    CBINDGEN=/builds/worker/fetches/cbindgen/cbindgen

# Windows 10 SDK
# ADD vs2017_15.8.4.zip /builds/worker/fetches/
# RUN cd /builds/worker/fetches/ && unzip vs2017_15.8.4.zip && rm vs2017_15.8.4.zip
# RUN cd /builds/worker/fetches/vs2017_15.8.4/SDK/ && \
#     mv Lib lib && mv Include include
# RUN rename 'y/A-Z/a-z/' /builds/worker/fetches/vs2017_15.8.4/SDK
# ADD makecab.exe /builds/worker/fetches/

ENV VSPATH=/builds/worker/checkouts/vs2017_15.8.4 \
    MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    MOZCONFIG=/builds/worker/workspace/.mozconfig \
    PATH=/builds/worker/fetches/clang/bin:/builds/worker/fetches/nsis-3.01:/builds/worker/fetches/vs2017_15.8.4/VC/bin/Hostx64/x64:/builds/worker/fetches/dump_syms:$PATH \
    MOZHARNESS_SCRIPT=mozharness/scripts/fx_desktop_build.py \
    MOZHARNESS_CONFIG="builds/releng_base_firefox.py builds/releng_base_linux_64_builds.py" \
    GECKO_PATH=/builds/worker/workspace \
    MAKECAB=/builds/worker/fetches/makecab.exe \
    LD_PRELOAD=/builds/worker/fetches/liblowercase/liblowercase.so \
    LOWERCASE_DIRS="/builds/worker/checkouts/vs2017_15.8.4"
CMD ['./mach' 'build']