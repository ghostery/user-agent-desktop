FROM ua-build-base

ENV TOOLTOOL_MANIFEST=browser/config/tooltool-manifests/vs2017-15.8.manifest \
    MOZ_AUTOMATION_PACKAGE_TESTS=1

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

RUN wget -nv -O /builds/worker/fetches/binutils.tar.xz https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-binutils/binutils.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-clang-12-win-cross/clang.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-rust-cross-1.54/rustc.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -nv -O /builds/worker/fetches/rust-size.tar.xz https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-rust-size/rust-size.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz

RUN wget -nv -O /builds/worker/fetches/nasm.tar.bz2 https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-nasm/nasm.tar.bz2 && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.bz2 && \
    rm nasm.tar.bz2

RUN wget -nv -O /builds/worker/fetches/node.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-node-12/node.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.zst && \
    rm node.tar.zst

RUN wget -nv -O /builds/worker/fetches/cbindgen.tar.xz https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-cbindgen/cbindgen.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz

RUN wget -nv -O /builds/worker/fetches/sccache.tar.xz https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-sccache/sccache.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.xz https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-dump_syms/dump_syms.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz

RUN wget -nv -O /builds/worker/fetches/wine.tar.xz https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-wine/wine.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf wine.tar.xz && \
    rm wine.tar.xz

RUN wget -nv -O /builds/worker/fetches/liblowercase.tar.xz https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-liblowercase/liblowercase.tar.xz && \
    cd /builds/worker/fetches/ && \
    tar -xf liblowercase.tar.xz && \
    rm liblowercase.tar.xz

RUN wget -nv -O /builds/worker/fetches/winchecksec.tar.bz2 https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/linux64-winchecksec/winchecksec.tar.bz2 && \
    cd /builds/worker/fetches/ && \
    tar -xf winchecksec.tar.bz2 && \
    rm winchecksec.tar.bz2

RUN wget -nv -O /builds/worker/fetches/sysroot-x86_64-linux-gnu.tar.zst https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/sysroot-x86_64-linux-gnu/sysroot-x86_64-linux-gnu.tar.zst && \
    cd /builds/worker/fetches/ && \
    tar -xf sysroot-x86_64-linux-gnu.tar.zst && \
    rm sysroot-x86_64-linux-gnu.tar.zst

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.bz2 https://ghostery-user-agent-cache-public.s3.amazonaws.com/toolchains/92.0/win64-dump_syms/dump_syms.tar.bz2 && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.bz2 && \
    rm dump_syms.tar.bz2

ADD --chown=worker:worker makecab.exe /builds/worker/fetches/

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE