FROM ua-build-base

ARG IPFS_GATEWAY=https://cloudflare-ipfs.com

ENV MOZ_AUTOMATION_PACKAGE_TESTS=1

RUN wget -nv -O /builds/worker/fetches/cctools.tar.xz $IPFS_GATEWAY/ipfs/QmaXYNbf8gLDtBNJiK8U3HEkAdT3MADQ3oWFmvhA2vutnJ && \
    cd /builds/worker/fetches/ && \
    tar -xf cctools.tar.xz && \
    rm cctools.tar.xz

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst $IPFS_GATEWAY/ipfs/QmNp3Rb8vbgaztJMgsHWN75zyGtUkAESRYhf6eBm4eVfe7 && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/sccache.tar.xz $IPFS_GATEWAY/ipfs/QmeB7fo2FuA9RNwK3fCRsHMD685HN9843HUfnHxw8S5iCt && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz

RUN wget -nv -O /builds/worker/fetches/wasi-sysroot.tar.xz $IPFS_GATEWAY/ipfs/QmUkv5Rarn1p9TZkMMt1u46xNX7LVJs7NC4duoMmV4whPF && \
    cd /builds/worker/fetches/ && \
    tar -xf wasi-sysroot.tar.xz && \
    rm wasi-sysroot.tar.xz

RUN wget -nv -O /builds/worker/fetches/binutils.tar.xz $IPFS_GATEWAY/ipfs/QmfTyFzy9f61Est4wodKXvwKtPzDbsChWn6WknABjqXd99 && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.xz $IPFS_GATEWAY/ipfs/QmcBFu6XXN7qQbw8WDxdSqaX1F34ieScEbevhkQP4HGfZZ && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz

RUN wget -nv -O /builds/worker/fetches/hfsplus-tools.tar.xz $IPFS_GATEWAY/ipfs/QmWW2sbyn2raXW13JmXMfYkpAxcjJYfSLLFq1huKrvuYbk && \
    cd /builds/worker/fetches/ && \
    tar -xf hfsplus-tools.tar.xz && \
    rm hfsplus-tools.tar.xz

RUN wget -nv -O /builds/worker/fetches/dmg.tar.xz $IPFS_GATEWAY/ipfs/QmchVhUdZ9sJcaAS6HBy47KMEqxrTyKdxcFafqVbNrCZWv && \
    cd /builds/worker/fetches/ && \
    tar -xf dmg.tar.xz && \
    rm dmg.tar.xz

RUN wget -nv -O /builds/worker/fetches/llvm-dsymutil.tar.xz $IPFS_GATEWAY/ipfs/QmT3sLuWBehn5L89qRuKuhGiCiioZ7Wco2MgkSZw6ahvXP && \
    cd /builds/worker/fetches/ && \
    tar -xf llvm-dsymutil.tar.xz && \
    rm llvm-dsymutil.tar.xz

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst $IPFS_GATEWAY/ipfs/QmTqq47yy8NKArpfyZjCfUvJi8uS46r62qWTzyAVqXPUPJ && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -nv -O /builds/worker/fetches/rust-size.tar.xz $IPFS_GATEWAY/ipfs/QmaBFfnPsWcS1CFJ7ynd2fkkTcUTdg3nzLobVr67yicYub && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz

RUN wget -nv -O /builds/worker/fetches/cbindgen.tar.xz $IPFS_GATEWAY/ipfs/Qmdx5ruFmQVFBykwHKj6qhcUEqmQC7sJtXxSTt7gYrnV3M && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz

RUN wget -nv -O /builds/worker/fetches/nasm.tar.bz2 $IPFS_GATEWAY/ipfs/QmXkwK3DDQyUsJPRnaNG9mn74L2aMn2dWHWoC8d9CBiUTa && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.bz2 && \
    rm nasm.tar.bz2

RUN wget -nv -O /builds/worker/fetches/node.tar.xz $IPFS_GATEWAY/ipfs/QmcPrE765WnKHryAF1s5FPdnoW6E6yYq4VzzUnLdZ5yMB3 && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.xz && \
    rm node.tar.xz

RUN wget -nv -O /builds/worker/fetches/lucetc.tar.xz $IPFS_GATEWAY/ipfs/QmWjh2TadXMWYkXHYYDNQuBRCcS3AqvvVwGvvaGvH25tmU && \
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