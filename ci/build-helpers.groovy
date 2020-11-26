
def build(name, dockerFile, targetPlatform, objDir, params, buildId, buildEnv=[], Closure postpackage={}, Closure archiving={}) {
    return {
        stage('checkout') {
            checkout scm
        }

        stage('prepare') {
            if (!fileExists('./build/makecab.exe')) {
                sh 'wget -nv -O ./build/makecab.exe ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/makecab.exe '
            }
            if (!fileExists('./build/MacOSX10.11.sdk.tar.bz2')) {
                sh 'wget -nv -O ./build/MacOSX10.11.sdk.tar.bz2 ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/MacOSX10.11.sdk.tar.bz2'
            }
        }

        def image = stage('docker build base') {
            docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')
            docker.build("ua-build-${name.toLowerCase()}", "-f build/${dockerFile} ./build --build-arg IPFS_GATEWAY=http://kria.cliqz:8080")
        }

        def defaultEnv = ["MACH_USE_SYSTEM_PYTHON=1", "MOZCONFIG=${env.WORKSPACE}/mozconfig", "MOZ_BUILD_DATE=${buildId}"]
        def dockerOpts = "-v /mnt/vfat/vs2017_15.9.29/:/builds/worker/fetches/vs2017_15.9.29"

        image.inside(dockerOpts) {
            withEnv(defaultEnv) {
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
                    sh 'rm -f `pwd`/MacOSX10.11.sdk; ln -s /builds/worker/fetches/MacOSX10.11.sdk `pwd`/MacOSX10.11.sdk'

                    if (params.PGO) {
                        stage("${name}: fetch profiles") {
                            sh 'mkdir -p /builds/worker/artifacts/'
                            sh "wget -nv -O profdata.tar.xz ${params.PGOProfiles}/${name}/profdata.tar.xz"
                            sh "tar -xvf profdata.tar.xz"
                            buildEnv.add('PGO_PROFILE_USE=1')
                        }
                    } else if (params.Instrument) {
                        buildEnv.add('PGO_PROFILE_GENERATE=1')
                    }

                    withEnv(buildEnv) {
                        stage("${name}: mach build") {
                            if (params.Clobber) {
                                sh './mach clobber'
                            }
                            sh './mach build'
                        }

                        stage("${name}: mach package") {
                            sh './mach package'
                        }
                    }
                } //dir
            } //withEnv
        } //inside

        postpackage()

        image.inside(dockerOpts) {
            withEnv(defaultEnv) {
                dir('mozilla-release') {
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
                    archiving()
                }
            }
        }
    }
}

def signmar() {
    // prepare signmar environment
    if (!fileExists('./signmar')) {
        sh 'wget -O ./signmar ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/signmar'
        sh 'chmod a+x signmar'
    }
    if (!fileExists('./libmozsqlite3.so')) { sh 'wget -O ./libmozsqlite3.so ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/libmozsqlite3.so' }
    if (!fileExists('./libnss3.so')) { sh 'wget -O ./libnss3.so ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/libnss3.so' }
    if (!fileExists('./libnspr4.so')) { sh 'wget -O ./libnspr4.so ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/libnspr4.so' }
    if (!fileExists('./libfreeblpriv3.so')) { sh 'wget -O ./libfreeblpriv3.so ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/libfreeblpriv3.so' }
    if (!fileExists('./libsoftokn3.so')) { sh 'wget -O ./libsoftokn3.so ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/libsoftokn3.so' }

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

// signs packaged artifacts for repackaging
def windows_signed_packaging(name, objDir, appName='Ghostery') {
    def stash_name = "${name}_packaging"
    def bin_dir = "mozilla-release/${objDir}/dist/${appName}"
    stash name: stash_name, includes: [
        "${bin_dir}/*",
        "${bin_dir}/**/*",
    ].join(',')
    unstash name: windows_sign_dir(stash_name, bin_dir)()
    sh "rm -rf mozilla-release/${objDir}/dist/${appName}-*.zip"
    sh "rm -rf mozilla-release/${objDir}/dist/install"
}

// Sign windows installers
def windows_signing(name, objDir, artifactGlob) {
    return {
        node('windows') {
            stage("Checkout") {
                checkout scm
                // clean old build artifacts in work dir
                bat 'del /s /q mozilla-release'
            }
            stage('Prepare') {
                unstash name
            }
            stage('Sign') {
                withCredentials([
                    file(credentialsId: "7da7d2de-5a10-45e6-9ffd-4e49f83753a8", variable: 'WIN_CERT'),
                    string(credentialsId: "33b3705c-1c2e-4462-9354-56a76bbb164c", variable: 'WIN_CERT_PASS'),
                ]) {
                    // full installer signing
                    bat 'ci/sign_win.bat'
                    // stub installer signing
                    withEnv(['STUB_PREFIX=-stub']) {
                        bat 'ci/sign_win.bat'
                    }
                }
            }
            stage('Publish') {
                archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            }
        }
    }
}

// Sign binaries and libraries in a stashed folder
def windows_sign_dir(name, dir) {
    return {
        node('windows') {
            stage('Sign') {
                def signed_name = "${name}_signed"
                checkout scm
                bat 'del /s /q mozilla-release'
                unstash name
                withCredentials([
                    file(credentialsId: "7da7d2de-5a10-45e6-9ffd-4e49f83753a8", variable: 'WIN_CERT'),
                    string(credentialsId: "33b3705c-1c2e-4462-9354-56a76bbb164c", variable: 'WIN_CERT_PASS'),
                ]) {
                    bat "ci/win_signer.bat ${dir}"
                }
                stash name: signed_name, includes: "${dir}/*,${dir}/**/*"
                signed_name
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
                            "MAC_CERT_NAME=HPY23A294X",
                            "APP_NAME=Ghostery",
                            "PKG_NAME=Ghostery Browser",
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

return this
