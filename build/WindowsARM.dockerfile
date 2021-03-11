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

RUN wget -nv -O /builds/worker/fetches/binutils.tar.xz $IPFS_GATEWAY/ipfs/QmeFSdGiyZiCXeJHkdgnG5GnfN9HTUUMR9na2nU1jZHLyx && \
    cd /builds/worker/fetches/ && \
    tar -xf binutils.tar.xz && \
    rm binutils.tar.xz

RUN wget -nv -O /builds/worker/fetches/clang.tar.zst $IPFS_GATEWAY/ipfs/QmVzxQyDLKq7R59VaFdhfwdB9EKPrF3mY2hkx13L9fdxhA && \
    cd /builds/worker/fetches/ && \
    tar -xf clang.tar.zst && \
    rm clang.tar.zst

RUN wget -nv -O /builds/worker/fetches/rustc.tar.zst $IPFS_GATEWAY/ipfs/QmXLE9cRR2h82Dhds6i3n8ACsZY9yA31K8ce31Fux5BD31 && \
    cd /builds/worker/fetches/ && \
    tar -xf rustc.tar.zst && \
    rm rustc.tar.zst

RUN wget -nv -O /builds/worker/fetches/rust-size.tar.xz $IPFS_GATEWAY/ipfs/QmRnEqBQJLiJxpvSbrFQu8XrWwzdRGV73stsStUz4KgJPK && \
    cd /builds/worker/fetches/ && \
    tar -xf rust-size.tar.xz && \
    rm rust-size.tar.xz

RUN wget -nv -O /builds/worker/fetches/nasm.tar.bz2 $IPFS_GATEWAY/ipfs/QmRQxpSb2kM7BnG39FVGmKLcLZMr7ni87RC79m6UaVewgt && \
    cd /builds/worker/fetches/ && \
    tar -xf nasm.tar.bz2 && \
    rm nasm.tar.bz2

RUN wget -nv -O /builds/worker/fetches/node.tar.xz $IPFS_GATEWAY/ipfs/QmSgLsqyDiZrv5vTsVKqMNVk1Ai6mvZhL4GLKVFor6aotJ && \
    cd /builds/worker/fetches/ && \
    tar -xf node.tar.xz && \
    rm node.tar.xz

RUN wget -nv -O /builds/worker/fetches/cbindgen.tar.xz $IPFS_GATEWAY/ipfs/QmcRVCUDD3464tJ239X5XkbaTSFHDZnKPQbw2Rxp8Q4DvC && \
    cd /builds/worker/fetches/ && \
    tar -xf cbindgen.tar.xz && \
    rm cbindgen.tar.xz

RUN wget -nv -O /builds/worker/fetches/sccache.tar.xz $IPFS_GATEWAY/ipfs/QmWEBpqfYwLhBfr66ASqaTkfY6tGSC5wLKYtj6DKDMRG6T && \
    cd /builds/worker/fetches/ && \
    tar -xf sccache.tar.xz && \
    rm sccache.tar.xz

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.xz $IPFS_GATEWAY/ipfs/QmdLTjhbkCuUbN5TraCuLh41jdsF7QEy4ZmDhByziwcQoY && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.xz && \
    rm dump_syms.tar.xz

RUN wget -nv -O /builds/worker/fetches/wine.tar.xz $IPFS_GATEWAY/ipfs/Qma6tgysiwd3TGpS4hdempt1m7Ev6FsZbbPiGvJAzcECVU && \
    cd /builds/worker/fetches/ && \
    tar -xf wine.tar.xz && \
    rm wine.tar.xz

RUN wget -nv -O /builds/worker/fetches/liblowercase.tar.xz $IPFS_GATEWAY/ipfs/QmNsQXu998cJ2iR5qMKCQQRpWgwFrBKVJLUu5azVbuU8U7 && \
    cd /builds/worker/fetches/ && \
    tar -xf liblowercase.tar.xz && \
    rm liblowercase.tar.xz

RUN wget -nv -O /builds/worker/fetches/winchecksec.tar.bz2 $IPFS_GATEWAY/ipfs/QmeX3eMz11KBsCKd5tXM5mt3YCxfbafBZZLbeWDe2teVi1 && \
    cd /builds/worker/fetches/ && \
    tar -xf winchecksec.tar.bz2 && \
    rm winchecksec.tar.bz2

RUN wget -nv -O /builds/worker/fetches/dump_syms.tar.bz2 $IPFS_GATEWAY/ipfs/QmYYrHMTw2GQvdKmVBSXfScMw8Hecr2MHf525ESjkooj5b && \
    cd /builds/worker/fetches/ && \
    tar -xf dump_syms.tar.bz2 && \
    rm dump_syms.tar.bz2

ADD --chown=worker:worker makecab.exe /builds/worker/fetches/

ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \
    GECKO_PATH=/builds/worker/workspace \
    WORKSPACE=/builds/worker/workspace \
    TOOLTOOL_DIR=/builds/worker/fetches/ \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    MOZ_AUTOMATION=1

COPY configs /builds/worker/configs

WORKDIR $WORKSPACE
