FROM debian:12

ENV DEBIAN_FRONTEND=noninteractive

ARG UID
ARG GID

RUN mkdir /worker && \
    (getent group $GID || groupadd -g $GID worker) && \
    groupmod -n worker `getent group $GID | cut -d: -f1` && \
    useradd -u $UID -g $GID -d /worker -s /bin/bash -m worker && \
    chown -R worker:worker /worker
WORKDIR /worker

# Step 1 - azure-cli

RUN apt-get update && \
    apt-get install -y \
        ca-certificates curl apt-transport-https lsb-release gnupg

RUN mkdir -p /etc/apt/keyrings && \
    curl -sLS https://packages.microsoft.com/keys/microsoft.asc | \
        gpg --dearmor | \
        tee /etc/apt/keyrings/microsoft.gpg > /dev/null && \
    chmod go+r /etc/apt/keyrings/microsoft.gpg

RUN echo "deb [arch=`dpkg --print-architecture` signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/azure-cli/ $(lsb_release -cs) main" | \
    tee /etc/apt/sources.list.d/azure-cli.list

RUN apt-get update && \
    apt-get install -y \
        azure-cli

# Step 2 - jSign

RUN apt-get update && \
    apt-get install -y \
        openjdk-17-jdk-headless

RUN curl -L https://github.com/ebourg/jsign/releases/download/6.0/jsign-6.0.jar --output /worker/jsign.jar && \
    chmod a+r /worker/jsign.jar && \
    echo "#/usr/bin/env bash\njava -jar /worker/jsign.jar \$@" | tee /bin/jsign && \
    chmod a+x /bin/jsign

# Step 3 - other tooling

RUN apt-get update && \
    apt-get install -y \
        zip unzip \
        jq \
        osslsigncode

# Step 4 - download CRT for verification

USER worker

RUN curl https://cacerts.digicert.com/DigiCertTrustedG4CodeSigningRSA4096SHA3842021CA1.crt.pem -o /worker/ca.pem \
  curl https://cacerts.digicert.com/DigiCertTrustedRootG4.crt.pem >> /worker/ca.pem
