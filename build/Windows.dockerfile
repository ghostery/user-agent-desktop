FROM ua-build-base

ARG IPFS_GATEWAY=https://cloudflare-ipfs.com

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

RUN wget -nv -O /builds/worker/fetches/binutils.tar.xz $IPFS_GATEWAY/ipfs/QmcG91LC64zVz1NJgH9RXMTPs3bdCLtMkRaxax6LRWKXBL && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst $IPFS_GATEWAY/ipfs/QmbXKQ2TDSyJJLNfqeUQSFN5MKW4Ua1Mb9uAmX9sJuY9UW && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst $IPFS_GATEWAY/ipfs/QmUxb7HJG3DZKL8rBy36ADE4CT2Z5fUxeaWYj7sAFku7h3 && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -nv -O /builds/worker/fetches/rust-size.tar.xz $IPFS_GATEWAY/ipfs/QmTzjvoUMZN3XrriJH5j2hHRCeV1sGAHmAeJvS1zY4MWz6 && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz

RUN wget -nv -O /builds/worker/fetches/nasm.tar.bz2 $IPFS_GATEWAY/ipfs/QmPCrsLuw4zZEG7qbua6yv62gkCLpQ4UFuTMxNFLFhpM3E && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.bz2 && \
    rm nasm.tar.bz2

RUN wget -nv -O /builds/worker/fetches/node.tar.zst $IPFS_GATEWAY/ipfs/QmduJzrgXnLXndunw2KWwMpMQTSHV96QkmVeoVd8nBvX59 && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.zst && \
    rm node.tar.zst

RUN wget -nv -O /builds/worker/fetches/cbindgen.tar.xz $IPFS_GATEWAY/ipfs/QmcE5AzXiXsyX5sEJZXd9f3EMRPGY6Ykg6u5uKebCatWUf && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz

RUN wget -nv -O /builds/worker/fetches/sccache.tar.xz $IPFS_GATEWAY/ipfs/QmYYVhmiQoEBTNETfk7snrTJ5VJRDuLkyTSyd1tcUvj3cS && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.xz $IPFS_GATEWAY/ipfs/QmWcC3yRQXdHrDDwrJGkvTNxj5xrsjYNNEXVKrPud429VP && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz

RUN wget -nv -O /builds/worker/fetches/wine.tar.xz $IPFS_GATEWAY/ipfs/QmT73n1moFxFfHhd4qYAndfHuECKbeHa52FVtpvdHLDoyJ && \
    cd /builds/worker/fetches/ && \
    tar -xf wine.tar.xz && \
    rm wine.tar.xz

RUN wget -nv -O /builds/worker/fetches/liblowercase.tar.xz $IPFS_GATEWAY/ipfs/QmP9mEruB9iVcjWNBxeigEzyr3nNnexmqQNW7oouHewR8y && \
    cd /builds/worker/fetches/ && \
    tar -xf liblowercase.tar.xz && \
    rm liblowercase.tar.xz

RUN wget -nv -O /builds/worker/fetches/winchecksec.tar.bz2 $IPFS_GATEWAY/ipfs/QmfKctjJLWSGjVpRpfMR4Lqo3T8cetXorznunZhK74EtRE && \
    cd /builds/worker/fetches/ && \
    tar -xf winchecksec.tar.bz2 && \
    rm winchecksec.tar.bz2

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.bz2 $IPFS_GATEWAY/ipfs/QmTrZUBQGPf5TywxAwBhKKfZDpCFNnGzAkcXoFqCiGM7AA && \
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