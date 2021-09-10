FROM ua-build-base

ARG IPFS_GATEWAY=https://cloudflare-ipfs.com

ENV MOZ_AUTOMATION_PACKAGE_TESTS=1 \
    PERFHERDER_EXTRA_OPTIONS=aarch64

RUN wget -nv -O /builds/worker/fetches/cctools.tar.xz $IPFS_GATEWAY/ipfs/QmVPBqiz1L7i3V86hjhxKT3DMKdjXaTVimcMwkD4FZSZLu && \
    cd /builds/worker/fetches/ && \
    tar -xf cctools.tar.xz && \
    rm cctools.tar.xz

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst $IPFS_GATEWAY/ipfs/QmagiTVTEqBgxYGpcf4PjNXAkG2NLCSGqBR9wXcnNSvvbS && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst
    
RUN wget -nv -O /builds/worker/fetches/sccache.tar.xz $IPFS_GATEWAY/ipfs/QmYYVhmiQoEBTNETfk7snrTJ5VJRDuLkyTSyd1tcUvj3cS && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz

RUN wget -nv -O /builds/worker/fetches/wasi-sysroot.tar.xz $IPFS_GATEWAY/ipfs/QmVbb4erbw4iDYcNVge3jtPipD2XPn8MmHdUsmyKMSZ6TT && \
    cd /builds/worker/fetches/ && \
    tar -xf wasi-sysroot.tar.xz && \
    rm wasi-sysroot.tar.xz

RUN wget -nv -O /builds/worker/fetches/binutils.tar.xz $IPFS_GATEWAY/ipfs/QmcG91LC64zVz1NJgH9RXMTPs3bdCLtMkRaxax6LRWKXBL && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.xz $IPFS_GATEWAY/ipfs/QmWcC3yRQXdHrDDwrJGkvTNxj5xrsjYNNEXVKrPud429VP && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz

RUN wget -nv -O /builds/worker/fetches/hfsplus-tools.tar.xz $IPFS_GATEWAY/ipfs/QmQpB9UY38Zef1HS5MpRXiaXg8MUj3WKYP99BudwBLca42 && \
    cd /builds/worker/fetches/ && \
    tar -xf hfsplus-tools.tar.xz && \
    rm hfsplus-tools.tar.xz

RUN wget -nv -O /builds/worker/fetches/dmg.tar.xz $IPFS_GATEWAY/ipfs/QmUs29kUpYcB15EL9SkofMNWzZSgpEmphEfaTzSpoHTEnP && \
    cd /builds/worker/fetches/ && \
    tar -xf dmg.tar.xz && \
    rm dmg.tar.xz

RUN wget -nv -O /builds/worker/fetches/llvm-dsymutil.tar.xz $IPFS_GATEWAY/ipfs/QmZ5kgYXA2yrQTVaRknGRAUCmdnjJnxDysE4yZUWbpFseb && \
    cd /builds/worker/fetches/ && \
    tar -xf llvm-dsymutil.tar.xz && \
    rm llvm-dsymutil.tar.xz

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst $IPFS_GATEWAY/ipfs/QmTkXwroujWaMubEVc7Z3ePgcNg2pkiErTi5ukQKatowoY && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -nv -O /builds/worker/fetches/rust-size.tar.xz $IPFS_GATEWAY/ipfs/QmTzjvoUMZN3XrriJH5j2hHRCeV1sGAHmAeJvS1zY4MWz6 && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz

RUN wget -nv -O /builds/worker/fetches/cbindgen.tar.xz $IPFS_GATEWAY/ipfs/QmcE5AzXiXsyX5sEJZXd9f3EMRPGY6Ykg6u5uKebCatWUf && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz

RUN wget -nv -O /builds/worker/fetches/nasm.tar.bz2 $IPFS_GATEWAY/ipfs/QmPCrsLuw4zZEG7qbua6yv62gkCLpQ4UFuTMxNFLFhpM3E && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.bz2 && \
    rm nasm.tar.bz2

RUN wget -nv -O /builds/worker/fetches/node.tar.zst $IPFS_GATEWAY/ipfs/QmduJzrgXnLXndunw2KWwMpMQTSHV96QkmVeoVd8nBvX59 && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.zst && \
    rm node.tar.zst

RUN wget -nv -O /builds/worker/fetches/lucetc.tar.xz $IPFS_GATEWAY/ipfs/QmQjTaejKAtshgcpajcXFkh3agV4oFjUykaqPcjC3L1S4m && \
    cd /builds/worker/fetches/ && \
    tar -xf lucetc.tar.xz && \
    rm lucetc.tar.xz

COPY MacOSX11.0.sdk.tar.bz2 /builds/worker/fetches/

RUN cd /builds/worker/fetches/ && \
    tar -xf MacOSX11.0.sdk.tar.bz2 && \
    rm MacOSX11.0.sdk.tar.bz2

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE
