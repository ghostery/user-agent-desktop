properties([
    parameters([
        booleanParam(name: 'Reset', defaultValue: false, description: 'clean workspace files'),
        booleanParam(name: 'Clobber', defaultValue: false, description: 'run mach clobber'),
        booleanParam(name: 'Linux64', defaultValue: true, description: ''),
        booleanParam(name: 'Windows64', defaultValue: true, description: ''),
        booleanParam(name: 'MacOSX64', defaultValue: true, description: ''),
    ]),
])

def build(name, dockerFile, mozconfig, artifactGlob) {
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

def buildmatrix = [:]
def signmatrix = [:]

if (params.Linux64) {
    def name = 'Linux64'
    def artifactGlob = 'obj-x86_64-pc-linux-gnu/dist/Ghostery-*'
    buildmatrix[name] = {
        node('docker && !magrathea') {
            build(name, 'Linux.dockerfile', 'linux.mozconfig', 'obj-x86_64-pc-linux-gnu/dist/Ghostery-*')()
            stage("${name}: publish artifacts") {
                archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            }
        }
    }
}

if (params.Windows64) {
    def name = 'Windows64'
    def artifactGlob = 'obj-x86_64-pc-mingw32/dist/install/**/*'
    buildmatrix[name] = {
        // we have to run windows builds on magrathea because that is where the vssdk mount is.
        node('docker && magrathea') {
            build(name, 'Windows.dockerfile', 'win64.mozconfig', artifactGlob)()
            stage("${name}: publish artifacts") {
                archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            }
        }
    }
}

if (params.MacOSX64) {
    def name = 'MacOSX64'
    def artifactGlob = 'obj-x86_64-apple-darwin/dist/Ghostery-*'
    buildmatrix[name] = {
        node('docker && !magrathea') {
            // build(name, 'MacOSX.dockerfile', 'macosx.mozconfig', 'obj-x86_64-apple-darwin/dist/Ghostery-*')()
            stage("${name}: stash artifacts") {
                // files needed for packaging
                stash includes: "mozilla-release/${artifactGlob},mozilla-release/build/package/mac_osx/unpack-diskimage,mozilla-release/security/mac/hardenedruntime/*", name: name
            }
        }
    }
    signmatrix["Sign MacOSX64"] = mac_signing(name, artifactGlob)
}

parallel buildmatrix
parallel signmatrix
