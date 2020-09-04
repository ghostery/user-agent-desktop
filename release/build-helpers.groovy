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

def build(name, dockerFile, mozconfig, distDir, params) {
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
        }

        image = stage('docker build base') {
            docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')
            docker.build("ua-build-${name.toLowerCase()}", "-f build/${dockerFile} ./build")
        }

        image.inside("--env MOZCONFIG=/builds/worker/configs/${mozconfig} -v /mnt/vfat/vs2017_15.8.4/:/builds/worker/fetches/vs2017_15.8.4") {
            stage('prepare mozilla-release') {
                sh 'npm ci'
                if (params.Reset) {
                    sh 'rm -rf .cache'
                }
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
                    dir(distDir) {
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

def windows_signing(name, artifactGlob) {
    return {
        node('master') {
            stage('checkout') {
                checkout scm
            }

            withVagrant("release/win.Vagrantfile", "c:\\jenkins", 1, 2000, 7000, false) { nodeId ->
                node(nodeId) {
                    stage("Checkout") {
                        checkout scm
                    }
                    stage('Prepare') {
                        unstash name
                    }
                    stage('Sign') {
                        withCredentials([
                            [$class: 'FileBinding', credentialsId: "6d44ddad-5592-4a89-89aa-7f934268113b", variable: 'WIN_CERT'],
                            [$class: 'StringBinding', credentialsId: "c891117f-e3db-41d6-846b-bcdcd1664dfd", variable: 'WIN_CERT_PASS']
                        ]) {
                            bat 'release/sign_win.bat'
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

def mac_signing(name, artifactGlob) {
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
                [$class: 'FileBinding', credentialsId: 'd9169b03-c7f5-4da2-bae3-56347ae1829c', variable: 'MAC_CERT'],
                [$class: 'StringBinding', credentialsId: 'd29da4e0-cf0a-41df-8446-44078bdca137', variable: 'MAC_CERT_PASS'],
                [$class: 'UsernamePasswordMultiBinding',
                    credentialsId: '840e974f-f733-4f02-809f-54dc68f5fa46',
                    passwordVariable: 'MAC_NOTARY_PASS',
                    usernameVariable: 'MAC_NOTARY_USER']
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
                        withEnv(["MAC_CERT_NAME=2UYYSSHVUH", "APP_NAME=Ghostery", "ARTIFACT_GLOB=${artifactGlob}"]){
                            sh "./release/sign_mac.sh"
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
