import jenkins.model.*
import hudson.model.*
import hudson.slaves.*
    
def sparseCheckout(scm, files) {
    if (scm.class.simpleName == 'GitSCM') {
        def filesAsPaths = files.collect {
            [path: it]
        }

        return checkout([$class                           : 'GitSCM',
                         branches                         : scm.branches,
                         doGenerateSubmoduleConfigurations: scm.doGenerateSubmoduleConfigurations,
                         extensions                       : scm.extensions +
                                 [[$class: 'SparseCheckoutPaths', sparseCheckoutPaths: filesAsPaths]],
                         submoduleCfg                     : scm.submoduleCfg,
                         userRemoteConfigs                : scm.userRemoteConfigs
        ])
    } else {
        // fallback to checkout everything by default
        return checkout(scm)
    }
}

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

def build(nodeId, name, dockerFile, targetPlatform, objDir, params, buildId, Closure stash, Closure pre_pkg_signing, Closure archiving) {
    def build = {
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
            docker.build("ua-build-${name.toLowerCase()}", "-f build/${dockerFile} ./build --build-arg IPFS_GATEWAY=http://kria.cliqz:8080")
        }

        image.inside("-v /mnt/vfat/vs2017_15.8.4/:/builds/worker/fetches/vs2017_15.8.4") {
            withEnv(["MACH_USE_SYSTEM_PYTHON=1", "MOZCONFIG=${env.WORKSPACE}/mozconfig", "MOZ_BUILD_DATE=${buildId}"]) {
                stage('prepare mozilla-release') {
                    sh 'npm ci'
                    if (params.Reset) {
                        sh 'rm -rf .cache'
                    }
                    sh 'rm -rf mozilla-release'
                    sh "./fern.js use --ipfs-gateway=http://kria.cliqz:8080"
                    sh "./fern.js config --print --force --platform ${targetPlatform} --brand ghostery"
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
                }
                stash()
            }
        }
    }

    def packaging = {    
        sh 'rm -rf signed.tar'
        unstash "${name}-signed"   
        sh 'tar xf signed.tar'

        stage("${name}: Packaging") {
            image.inside() {
                withEnv([
                    "MACH_USE_SYSTEM_PYTHON=1", 
                    "MOZCONFIG=${env.WORKSPACE}/mozconfig", 
                    "MOZ_BUILD_DATE=${buildId}",
                    "ACCEPTED_MAR_CHANNEL_IDS=firefox-ghostery-release",
                    "MAR_CHANNEL_ID=firefox-ghostery-release",
                ]) {
                    dir('mozilla-release') {
                        sh './mach package'

                        dir(objDir) {
                            sh 'make update-packaging'
                        }
                    }
                    archiving()
                }
            }
        }
    }

    return {
        def nodeName = ''
        def wsName = ''
        
        node(nodeId) {
            wsName = "${env.WORKSPACE}-${name}"
            nodeName = env.NODE_NAME
            ws(wsName) {
                build()
            }
        }
        
        stage("${name}: Pre Packaging Signing") {
            pre_pkg_signing()
        }
        
        node(nodeName) {
            ws(wsName) {
                packaging()
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

def windows_pre_pkg_signing(name, objDir, artifactGlob) {
    return {
        node('master') {
            sparseCheckout(scm, ['ci/win.Vagrantfile'])

            withVagrant("ci/win.Vagrantfile", "c:\\jenkins", 1, 2000, 7000, false) { nodeId ->
                node(nodeId) {
                    // clean old build artifacts in work dir
                    bat 'del /s /q mozilla-release'

                    sparseCheckout(scm, ['ci/sign_win_dll.bat'])

                    unstash "${name}-pre-pkg"

                    withCredentials([
                        file(credentialsId: "7da7d2de-5a10-45e6-9ffd-4e49f83753a8", variable: 'WIN_CERT'),
                        string(credentialsId: "33b3705c-1c2e-4462-9354-56a76bbb164c", variable: 'WIN_CERT_PASS'),
                    ]) {
                        bat 'ci/sign_win_dll.bat'
                    }
                    
                    sh 'rm -rf signed.tar'
                    sh "tar -chf signed.tar mozilla-release/${objDir}/dist/Ghostery"
                    stash name: "${name}-signed", includes: 'signed.tar'
                }
            }
        }
    }
}

def windows_post_pkg_signing(name, objDir, artifactGlob) {
    return {
        node('master') {
            sparseCheckout(scm, ['ci/win.Vagrantfile'])

            withVagrant("ci/win.Vagrantfile", "c:\\jenkins", 1, 2000, 7000, false) { nodeId ->
                node(nodeId) {
                    // clean old build artifacts in work dir
                    bat 'del /s /q mozilla-release'

                    sparseCheckout(scm, ['ci/sign_win_installer.bat'])

                    unstash name

                    withCredentials([
                        file(credentialsId: "7da7d2de-5a10-45e6-9ffd-4e49f83753a8", variable: 'WIN_CERT'),
                        string(credentialsId: "33b3705c-1c2e-4462-9354-56a76bbb164c", variable: 'WIN_CERT_PASS'),
                    ]) {
                        bat 'ci/sign_win_installer.bat'
                    }

                    sh 'rm -rf signed.tar'
                    sh "tar -chf signed.tar mozilla-release/${objDir}/dist/Ghostery\\ Browser.app"
                    stash name: "${name}-signed", includes: 'signed.tar'
                }
            }
        }
    }
}

def mac_pre_pkg_signing(name, objDir, artifactGlob) {
    return {
        node('gideon') {
            sh 'rm -rf mozilla-release'

            sparseCheckout(scm, [
                'ci/sign_mac_app.sh',
                'ci/notarize_mac_app.sh',
            ])

            sh 'rm -rf app.tar'
            unstash "${name}-pre-pkg"   
            sh 'tar xf app.tar'

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
                        "MAC_CERT_NAME=HPY23A294X",
                        "APP_NAME=Ghostery",
                        "PKG_NAME=Ghostery Browser",
                        "ARTIFACT_GLOB=${artifactGlob}"
                    ]){
                        sh "./ci/sign_mac_app.sh"
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
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
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
