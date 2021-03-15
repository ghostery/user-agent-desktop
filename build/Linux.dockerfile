FROM ua-build-base

ARG IPFS_GATEWAY=https://cloudflare-ipfs.com

ENV MOZ_AUTOMATION_PACKAGE_TESTS=1

RUN wget -nv -O /builds/worker/fetches/binutils.tar.xz $IPFS_GATEWAY/ipfs/QmeFSdGiyZiCXeJHkdgnG5GnfN9HTUUMR9na2nU1jZHLyx && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst $IPFS_GATEWAY/ipfs/QmPLrCJewuyhJUrUq8guZ33yA28vjkj1fj4Z5GiEEbd3j3 && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst $IPFS_GATEWAY/ipfs/QmVgWw29vbHmW2K2e18Vsn3dBEStNGt6cpNgLi9PhYEPS1 && \
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

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.xz $IPFS_GATEWAY/ipfs/QmdLTjhbkCuUbN5TraCuLh41jdsF7QEy4ZmDhByziwcQoY && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz

RUN wget -nv -O /builds/worker/fetches/sccache.tar.xz $IPFS_GATEWAY/ipfs/QmWEBpqfYwLhBfr66ASqaTkfY6tGSC5wLKYtj6DKDMRG6T && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz

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

RUN wget -nv -O /builds/worker/fetches/wasi-sysroot.tar.xz $IPFS_GATEWAY/ipfs/QmWGe9oPQRpzSaFGKfoMRqFFy9a3Seo8v3zbzEzV6FDcHC && \
    cd /builds/worker/fetches/ && \
    tar -xf wasi-sysroot.tar.xz && \
    rm wasi-sysroot.tar.xz

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace/mozilla-release \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE
