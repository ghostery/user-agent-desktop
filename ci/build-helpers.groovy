import jenkins.model.*
import hudson.model.*
import hudson.slaves.*

@NonCPS
def createNode(nodeId, jenkinsFolderPath) {
    def launcher = new JNLPLauncher()

    def node = new DumbSlave(
        nodeId,
        jenkinsFolderPath,
        launcher
    )
    Jenkins.instance.addNode(node)
}

@NonCPS
def removeNode(nodeId) {
    def allNodes = Jenkins.getInstance().getNodes()
    for (int i =0; i < allNodes.size(); i++) {
        Slave node = allNodes[i]

        if (node.name.toString() == nodeId) {
            Jenkins.getInstance().removeNode(node)
            return
        }
    }
}

@NonCPS
def getNodeSecret(nodeId) {
    return jenkins.slaves.JnlpSlaveAgentProtocol.SLAVE_SECRET.mac(nodeId)
}

def withVagrant(String vagrantFilePath, String jenkinsFolderPath, Integer cpu, Integer memory, Integer vnc_port, Boolean rebuild, Closure body) {
    def nodeId = "${env.BUILD_TAG}"
    createNode(nodeId, jenkinsFolderPath)

    try {
        def nodeSecret = getNodeSecret(nodeId)

        withEnv([
            "VAGRANT_VAGRANTFILE=${vagrantFilePath}",
            "NODE_CPU_COUNT=${cpu}",
            "NODE_MEMORY=${memory}",
            "NODE_VNC_PORT=${vnc_port}",
            "NODE_SECRET=${nodeSecret}",
            "NODE_ID=${nodeId}",
        ]) {

            sh 'vagrant halt --force'
            if (rebuild) {
              sh 'vagrant destroy --force'
            }
            sh  'vagrant up'
        }

        body(nodeId)
    } finally {
        removeNode(nodeId)
        withEnv(["VAGRANT_VAGRANTFILE=${vagrantFilePath}"]) {
            sh 'vagrant halt --force'
        }
    }
}

def build(name, dockerFile, mozconfig, objDir, params, buildId) {
    return {
        stage('checkout') {
            checkout scm
        }

        stage('prepare') {
            if (!fileExists('./build/makecab.exe')) {
                sh 'wget -O ./build/makecab.exe ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/makecab.exe '
            }
            if (!fileExists('./build/MacOSX10.11.sdk.tar.bz2')) {
                sh 'wget -O ./build/MacOSX10.11.sdk.tar.bz2 ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/MacOSX10.11.sdk.tar.bz2'
            }
            sh 'cp brands/ghostery/mozconfig build/configs/'
        }

        image = stage('docker build base') {
            docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')
            docker.build("ua-build-${name.toLowerCase()}", "-f build/${dockerFile} ./build")
        }

        image.inside("--env MOZCONFIG=/builds/worker/configs/${mozconfig} --env MOZ_BUILD_DATE=${buildId} -v /mnt/vfat/vs2017_15.8.4/:/builds/worker/fetches/vs2017_15.8.4") {
            stage('prepare mozilla-release') {
                sh 'npm ci'
                if (params.Reset) {
                    sh 'rm -rf .cache'
                }
                sh 'rm -rf mozilla-release'
                sh "./fern.js use"
                sh "./fern.js reset"
                sh './fern.js import-patches'
            }

            dir('mozilla-release') {
                stage("${name}: mach build") {
                    sh 'rm -f `pwd`/MacOSX10.11.sdk; ln -s /builds/worker/fetches/MacOSX10.11.sdk `pwd`/MacOSX10.11.sdk'
                    if (params.Clobber) {
                        sh './mach clobber'
                    }
                    sh './mach build'
                }

                stage("${name}: mach package") {
                    sh './mach package'
                }

                stage("${name}: make update-packaging") {
                    dir(objDir) {
                        withEnv([
                            "ACCEPTED_MAR_CHANNEL_IDS=firefox-ghostery-release",
                            "MAR_CHANNEL_ID=firefox-ghostery-release",
                        ]) {
                            sh 'make update-packaging'
                        }
                    }
                }
            }
        }
    }
}

def signmar() {
    def mars = sh(returnStdout: true, script: "find . -type f -name '*.mar' | grep dist").trim().split("\\r?\\n")
    def pwd = sh(returnStdout: true, script: 'pwd').trim()

    withEnv(['CERT_DB_PATH=/tmp/certs']) {
        def error

        try {
            withCredentials([
                file(credentialsId: 'd9d6021f-40c3-4515-a222-fa3882cbc4ce', variable: 'MAR_CERT'),
                string(credentialsId: '95d95f56-c16e-416e-ac40-ed57eb99fcca', variable: 'MAR_CERT_PASS'),
            ]) {
                sh '''#!/bin/bash
                    set -x
                    set -e
                    mkdir -p $CERT_DB_PATH
                    certutil -N -d $CERT_DB_PATH --empty-password
                    pk12util -i $MAR_CERT -W $MAR_CERT_PASS -d $CERT_DB_PATH
                    certutil -L -d $CERT_DB_PATH
                '''
            }

            echo "MARs to sign: \n" + mars.join('\n')

            for (String mar in mars) {
                def marPath = "${pwd}/${mar}"
                sh """#!/bin/bash
                    set -x
                    set -e
                    ${pwd}/signmar -d \$CERT_DB_PATH \
                        -n 'Release Cliqz MAR signing key' \
                        -s "${marPath}" "${marPath}.signed"
                    rm "${marPath}"
                    mv "${marPath}.signed" "${marPath}"
                """
            }
        } catch (err) {
            error = err
        } finally {
            sh 'rm -rf $CERT_DB_PATH || true'
            if (error) {
                throw error
            }
        }
    }
}

def windows_signing(name, objDir, artifactGlob) {
    return {
        node('master') {
            stage('checkout') {
                checkout scm
            }

            withVagrant("ci/win.Vagrantfile", "c:\\jenkins", 1, 2000, 7000, false) { nodeId ->
                node(nodeId) {
                    stage("Checkout") {
                        checkout scm
                    }
                    stage('Prepare') {
                        unstash name
                    }
                    stage('Sign') {
                        withCredentials([
                            file(credentialsId: "7da7d2de-5a10-45e6-9ffd-4e49f83753a8", variable: 'WIN_CERT'),
                            string(credentialsId: "33b3705c-1c2e-4462-9354-56a76bbb164c", variable: 'WIN_CERT_PASS'),
                        ]) {
                            bat 'ci/sign_win.bat'
                        }
                    }
                    stage('Publish') {
                        archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
                    }
                }
            }
        }
    }
}

def linux_signing(name, objDir, artifactGlob) {
    return {
        node('docker') {
            stage('checkout') {
                checkout scm
            }
            stage('prepare') {
                // keep empty stage for symmetry
            }
            stage('unstash') {
                sh 'rm -rf mozilla-release'
                unstash name
            }
            stage('sign') {
            }
            stage('publish artifacts') {
                archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            }
        }
    }
}

def mac_signing(name, objDir, artifactGlob) {
    return {
        node('gideon') {
            stage('checkout') {
                checkout scm
            }
            stage('prepare') {
                sh 'npm ci'
            }
            stage('unstash') {
                sh 'rm -rf mozilla-release'
                unstash name
            }
            stage('sign') {
                withCredentials([
                    file(credentialsId: '5f834aab-07ff-4c3f-9848-c2ac02b3b532', variable: 'MAC_CERT'),
                    string(credentialsId: 'b21cbf0b-c5e1-4c0f-9df7-20bb8ba61a2c', variable: 'MAC_CERT_PASS'),
                    usernamePassword(
                        credentialsId: '840e974f-f733-4f02-809f-54dc68f5fa46',
                        passwordVariable: 'MAC_NOTARY_PASS',
                        usernameVariable: 'MAC_NOTARY_USER'
                    ),
                ]) {
                    try {
                        // create temporary keychain and make it a default one
                        sh '''#!/bin/bash -l -x
                            security create-keychain -p cliqz cliqz
                            security list-keychains -s cliqz
                            security default-keychain -s cliqz
                            security unlock-keychain -p cliqz cliqz
                        '''

                        sh '''#!/bin/bash -l +x
                            security import $MAC_CERT -P $MAC_CERT_PASS -k cliqz -A
                            security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k cliqz cliqz
                        '''

                        withEnv([
                            "MAC_CERT_NAME=2UYYSSHVUH",
                            "APP_NAME=Ghostery",
                            "ARTIFACT_GLOB=${artifactGlob}"
                        ]){
                            sh "./ci/sign_mac.sh"
                        }
                    } finally {
                        sh '''#!/bin/bash -l -x
                            security delete-keychain cliqz
                            security list-keychains -s login.keychain
                            security default-keychain -s login.keychain
                            true
                        '''
                    }
                }
            }
            stage('publish artifacts') {
                archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            }
        }
    }
}

def withGithubRelease(Closure body) {
    node('docker') {
        docker.image('golang').inside("-u root") {
            sh 'go get github.com/human-web/github-release'
            withCredentials([
                usernamePassword(
                    credentialsId: 'd60e38ae-4a5a-4eeb-ab64-32fd1fad4a28',
                    passwordVariable: 'GITHUB_TOKEN',
                    usernameVariable: 'GITHUB_USERNAME'
                )
            ]) {
                body()
            }
        }
    }
}

return this
