FROM ua-build-base:arm64

ARG IPFS_GATEWAY=https://cloudflare-ipfs.com

RUN wget -nv -O /builds/worker/fetches/binutils.tar.xz $IPFS_GATEWAY/ipfs/QmfTyFzy9f61Est4wodKXvwKtPzDbsChWn6WknABjqXd99 && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst $IPFS_GATEWAY/ipfs/QmR9wkZyrUAZ7p8GLoQRDk4UMn4d1CDA7bSpPJ6z1mW55R && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst $IPFS_GATEWAY/ipfs/QmShjomK31LqKs5VjmHYj1igi1XCxsbL9tCU6hJ9FS4erq && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -nv -O /builds/worker/fetches/rust-size.tar.xz $IPFS_GATEWAY/ipfs/QmaBFfnPsWcS1CFJ7ynd2fkkTcUTdg3nzLobVr67yicYub && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz

RUN wget -nv -O /builds/worker/fetches/cbindgen.tar.xz $IPFS_GATEWAY/ipfs/QmVbXdagSvuQcbV1qTCdoU2gDqg8pALckngYok2pz4ze5P && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.xz $IPFS_GATEWAY/ipfs/QmcBFu6XXN7qQbw8WDxdSqaX1F34ieScEbevhkQP4HGfZZ && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz

RUN wget -nv -O /builds/worker/fetches/sccache.tar.xz $IPFS_GATEWAY/ipfs/QmeB7fo2FuA9RNwK3fCRsHMD685HN9843HUfnHxw8S5iCt && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz

RUN wget -nv -O /builds/worker/fetches/node.tar.xz $IPFS_GATEWAY/ipfs/QmcPrE765WnKHryAF1s5FPdnoW6E6yYq4VzzUnLdZ5yMB3 && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.xz && \
    rm node.tar.xz

RUN wget -nv -O /builds/worker/fetches/lucetc.tar.xz $IPFS_GATEWAY/ipfs/QmWjh2TadXMWYkXHYYDNQuBRCcS3AqvvVwGvvaGvH25tmU && \
    cd /builds/worker/fetches/ && \
    tar -xf lucetc.tar.xz && \
    rm lucetc.tar.xz

RUN wget -nv -O /builds/worker/fetches/wasi-sysroot.tar.xz $IPFS_GATEWAY/ipfs/QmUkv5Rarn1p9TZkMMt1u46xNX7LVJs7NC4duoMmV4whPF && \
    cd /builds/worker/fetches/ && \
    tar -xf wasi-sysroot.tar.xz && \
    rm wasi-sysroot.tar.xz

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE