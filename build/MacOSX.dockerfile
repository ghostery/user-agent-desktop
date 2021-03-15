FROM ua-build-base

ARG IPFS_GATEWAY=https://cloudflare-ipfs.com

ENV MOZ_AUTOMATION_PACKAGE_TESTS=1

RUN wget -nv -O /builds/worker/fetches/cctools.tar.xz $IPFS_GATEWAY/ipfs/QmNbVHKmG3yib4LC3VVoscpFwCq2V7Ucubeg3bThP7QFrq && \
    cd /builds/worker/fetches/ && \
    tar -xf cctools.tar.xz && \
    rm cctools.tar.xz

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst $IPFS_GATEWAY/ipfs/QmdiWXsb2LFPgYDZ5dKPYWqwSh4RTTgjyd9CX1SQTdGwh2 && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/sccache.tar.xz $IPFS_GATEWAY/ipfs/QmWEBpqfYwLhBfr66ASqaTkfY6tGSC5wLKYtj6DKDMRG6T && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz

RUN wget -nv -O /builds/worker/fetches/wasi-sysroot.tar.xz $IPFS_GATEWAY/ipfs/QmWGe9oPQRpzSaFGKfoMRqFFy9a3Seo8v3zbzEzV6FDcHC && \
    cd /builds/worker/fetches/ && \
    tar -xf wasi-sysroot.tar.xz && \
    rm wasi-sysroot.tar.xz

RUN wget -nv -O /builds/worker/fetches/binutils.tar.xz $IPFS_GATEWAY/ipfs/QmeFSdGiyZiCXeJHkdgnG5GnfN9HTUUMR9na2nU1jZHLyx && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.xz $IPFS_GATEWAY/ipfs/QmdLTjhbkCuUbN5TraCuLh41jdsF7QEy4ZmDhByziwcQoY && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz

RUN wget -nv -O /builds/worker/fetches/hfsplus-tools.tar.xz $IPFS_GATEWAY/ipfs/QmV6Lh69TMC4Q4NNYseFA1jX9YtvsL5rwY8DXvQ8y7WTKt && \
    cd /builds/worker/fetches/ && \
    tar -xf hfsplus-tools.tar.xz && \
    rm hfsplus-tools.tar.xz

RUN wget -nv -O /builds/worker/fetches/dmg.tar.xz $IPFS_GATEWAY/ipfs/QmenFYGVH67KZEg6V7MjvWu9wEPdT1jc5DFxcZmR3StWCQ && \
    cd /builds/worker/fetches/ && \
    tar -xf dmg.tar.xz && \
    rm dmg.tar.xz

RUN wget -nv -O /builds/worker/fetches/llvm-dsymutil.tar.xz $IPFS_GATEWAY/ipfs/QmeykAY2YAUxbM6iro6SqDCEpLob9r757ERPLZt3ydGog8 && \
    cd /builds/worker/fetches/ && \
    tar -xf llvm-dsymutil.tar.xz && \
    rm llvm-dsymutil.tar.xz

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst $IPFS_GATEWAY/ipfs/QmVWmRTuYM7zY1mP6oVdCv8oFhHGuBxwwzE5nHWkH3xrf5 && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -nv -O /builds/worker/fetches/rust-size.tar.xz $IPFS_GATEWAY/ipfs/QmRnEqBQJLiJxpvSbrFQu8XrWwzdRGV73stsStUz4KgJPK && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz

RUN wget -nv -O /builds/worker/fetches/cbindgen.tar.xz $IPFS_GATEWAY/ipfs/QmcRVCUDD3464tJ239X5XkbaTSFHDZnKPQbw2Rxp8Q4DvC && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz

RUN wget -nv -O /builds/worker/fetches/nasm.tar.bz2 $IPFS_GATEWAY/ipfs/QmRQxpSb2kM7BnG39FVGmKLcLZMr7ni87RC79m6UaVewgt && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.bz2 && \
    rm nasm.tar.bz2

RUN wget -nv -O /builds/worker/fetches/node.tar.xz $IPFS_GATEWAY/ipfs/QmSgLsqyDiZrv5vTsVKqMNVk1Ai6mvZhL4GLKVFor6aotJ && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.xz && \
    rm node.tar.xz

RUN wget -nv -O /builds/worker/fetches/lucetc.tar.xz $IPFS_GATEWAY/ipfs/QmbgnvNZ1PsQBKLBFaHcCS7C8LWqBaGEG2Pb3NvHGA72pD && \
    cd /builds/worker/fetches/ && \
    tar -xf lucetc.tar.xz && \
    rm lucetc.tar.xz

COPY MacOSX10.12.sdk.tar.bz2 /builds/worker/fetches/

RUN cd /builds/worker/fetches/ && \
    tar -xf MacOSX10.12.sdk.tar.bz2 && \
    rm MacOSX10.12.sdk.tar.bz2

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE
