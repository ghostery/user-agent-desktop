FROM ua-build-base

ARG IPFS_GATEWAY=https://cloudflare-ipfs.com

ENV TOOLTOOL_MANIFEST=browser/config/tooltool-manifests/win64/aarch64.manifest \
    PERFHERDER_EXTRA_OPTIONS=aarch64 \
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

RUN wget -nv -O /builds/worker/fetches/binutils.tar.xz $IPFS_GATEWAY/ipfs/QmfTyFzy9f61Est4wodKXvwKtPzDbsChWn6WknABjqXd99 && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst $IPFS_GATEWAY/ipfs/QmNS8jkq9w9DV6JH4kdYwN9g5QMyuy2qXPdrUWyQrWzr27 && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst $IPFS_GATEWAY/ipfs/QmXLE9cRR2h82Dhds6i3n8ACsZY9yA31K8ce31Fux5BD31 && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -nv -O /builds/worker/fetches/rust-size.tar.xz $IPFS_GATEWAY/ipfs/QmaBFfnPsWcS1CFJ7ynd2fkkTcUTdg3nzLobVr67yicYub && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz

RUN wget -nv -O /builds/worker/fetches/nasm.tar.bz2 $IPFS_GATEWAY/ipfs/QmXkwK3DDQyUsJPRnaNG9mn74L2aMn2dWHWoC8d9CBiUTa && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.bz2 && \
    rm nasm.tar.bz2

RUN wget -nv -O /builds/worker/fetches/node.tar.xz $IPFS_GATEWAY/ipfs/QmcPrE765WnKHryAF1s5FPdnoW6E6yYq4VzzUnLdZ5yMB3 && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.xz && \
    rm node.tar.xz

RUN wget -nv -O /builds/worker/fetches/cbindgen.tar.xz $IPFS_GATEWAY/ipfs/Qmdx5ruFmQVFBykwHKj6qhcUEqmQC7sJtXxSTt7gYrnV3M && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz

RUN wget -nv -O /builds/worker/fetches/sccache.tar.xz $IPFS_GATEWAY/ipfs/QmeB7fo2FuA9RNwK3fCRsHMD685HN9843HUfnHxw8S5iCt && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.xz $IPFS_GATEWAY/ipfs/QmcBFu6XXN7qQbw8WDxdSqaX1F34ieScEbevhkQP4HGfZZ && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz

RUN wget -nv -O /builds/worker/fetches/wine.tar.xz $IPFS_GATEWAY/ipfs/QmNnUM1wbAzNfAAJmkXmyp2etev8ipG9Aw3pNwrtd7xHwr && \
    cd /builds/worker/fetches/ && \
    tar -xf wine.tar.xz && \
    rm wine.tar.xz

RUN wget -nv -O /builds/worker/fetches/liblowercase.tar.xz $IPFS_GATEWAY/ipfs/QmXsvLT12XWDwPpYpnJ1Z96vpJH9xG97Tax98v9oLNeuLe && \
    cd /builds/worker/fetches/ && \
    tar -xf liblowercase.tar.xz && \
    rm liblowercase.tar.xz

RUN wget -nv -O /builds/worker/fetches/winchecksec.tar.bz2 $IPFS_GATEWAY/ipfs/QmZkQu458RNKLkuwkGGuzVNhpbBE8W2gBkiaa2GHdfLCKD && \
    cd /builds/worker/fetches/ && \
    tar -xf winchecksec.tar.bz2 && \
    rm winchecksec.tar.bz2

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.bz2 $IPFS_GATEWAY/ipfs/QmWnwBGT8cL9JqFHuW8mjZXTdGaC9mfBRqGPaZaq6Mpc9d && \
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