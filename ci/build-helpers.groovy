
def build(opts, Closure postpackage={}, Closure archiving={}) {
    return {
        stage('checkout') {
            checkout scm
        }

        def triggeringCommitHash = sh(returnStdout: true, script: "git log -n 1 --pretty=format:'%h'").trim()

        stage('prepare') {
            if (!fileExists('./build/makecab.exe')) {
                sh 'wget -nv -O ./build/makecab.exe ftp://10.180.244.36/cliqz-browser-build-artifacts/makecab.exe '
            }
            if (!fileExists('./build/MacOSX11.sdk.tar.bz2')) {
                sh 'wget -nv -O ./build/MacOSX10.12.sdk.tar.bz2 ftp://10.180.244.36/cliqz-browser-build-artifacts/MacOSX10.12.sdk.tar.bz2'
            }
            if (!fileExists('./build/MacOSX11.0.sdk.tar.bz2')) {
                sh 'wget -nv -O ./build/MacOSX11.0.sdk.tar.bz2 ftp://10.180.244.36/cliqz-browser-build-artifacts/MacOSX11.0.sdk.tar.bz2'
            }
        }

        def image = stage('docker build base') {
            docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')
            docker.build("ua-build-${opts.name.toLowerCase()}", "-f build/${opts.dockerFile} ./build --build-arg IPFS_GATEWAY=http://10.180.244.30:8080")
        }

        def defaultEnv = [
            "MACH_USE_SYSTEM_PYTHON=1",
            "MOZCONFIG=${env.WORKSPACE}/mozconfig",
            "MOZ_BUILD_DATE=${opts.buildId}",
            "ACCEPTED_MAR_CHANNEL_IDS=firefox-ghostery-release",
            "MAR_CHANNEL_ID=firefox-ghostery-release",
            "MOZ_AUTOMATION=1",
            "MH_BRANCH=${env.BRANCH_NAME}",
            "MOZ_SOURCE_CHANGESET=${triggeringCommitHash}",
        ]
        def dockerOpts = "-v /mnt/vfat/vs2017_15.9.29/:/builds/worker/fetches/vs2017_15.9.29"
        def buildEnv = opts.buildEnv ?: []

        image.inside(dockerOpts) {
            withEnv(defaultEnv) {
                stage('prepare mozilla-release') {
                    prepare_workspace(opts.Reset, opts.targetPlatform, false)
                }

                dir('mozilla-release') {
                    sh 'rm -f `pwd`/MacOSX10.12.sdk; ln -s /builds/worker/fetches/MacOSX10.12.sdk `pwd`/MacOSX10.12.sdk'
                    sh 'rm -f `pwd`/MacOSX11.0.sdk; ln -s /builds/worker/fetches/MacOSX11.0.sdk `pwd`/MacOSX11.0.sdk'

                    if (opts.PGO) {
                        stage("${opts.name}: fetch profiles") {
                            sh 'mkdir -p /builds/worker/artifacts/'
                            sh "wget -nv -O profdata.tar.xz ${opts.PGOProfiles}/${opts.name}/profdata.tar.xz"
                            sh "tar -xvf profdata.tar.xz"
                            buildEnv.add('PGO_PROFILE_USE=1')
                        }
                    } else if (opts.Instrument) {
                        buildEnv.add('PGO_PROFILE_GENERATE=1')
                    }

                    withEnv(buildEnv) {
                        stage("${opts.name}: mach build") {
                            if (opts.Clobber) {
                                sh './mach clobber'
                            }

                            sh './mach build'
                        }

                        stage("${opts.name}: mach package") {
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
                    stage("${opts.name}: mach package") {
                        sh './mach package'
                    }

                    stage("${opts.name}: make update-packaging") {
                        dir(opts.objDir) {
                            sh 'make update-packaging'
                        }
                    }

                    for (String locale in opts.locales) {
                        stage("${opts.name}: repackaging locale ${locale}") {
                            sh "./mach build installers-${locale}"
                            dir(opts.objDir) {
                                sh "make -C ./tools/update-packaging full-update AB_CD=${locale} PACKAGE_BASE_DIR=`pwd`/dist/l10n-stage"
                            }
                        }
                    }
                    archiving()
                }
            }
        }
    }
}

def prepare_workspace(reset, targetPlatform, skipPatches) {
    sh 'npm ci'
    if (reset) {
        sh 'rm -rf .cache'
    }
    sh 'rm -rf mozilla-release'
    sh "./fern.js use"

    withCredentials([
        [
            $class: 'StringBinding',
            credentialsId: '06ca2847-8bc4-425b-8208-c4ee5518dc08',
            variable: 'GLS_GAPI_DATA',
        ],
        [
            $class: 'StringBinding',
            credentialsId: '9fa44cca-2ddb-41bf-b4a8-5a28114c9b4f',
            variable: 'SB_GAPI_DATA',
        ],
    ]) {
        writeFile file: "gls-gapi.data", text: GLS_GAPI_DATA
        writeFile file: "sb-gapi.data", text: SB_GAPI_DATA
        writeFile file: "local.mozconfig", text: """
            ac_add_options --with-google-location-service-api-keyfile=${pwd()}/gls-gapi.data
            ac_add_options --with-google-safebrowsing-api-keyfile=${pwd()}/sb-gapi.data
        """
    }

    sh "./fern.js config --print --force -l --platform ${targetPlatform} --brand ghostery"

    if (!skipPatches) {
        sh "./fern.js reset"
        sh './fern.js import-patches'
    }
}

def signmar() {
    // prepare signmar environment
    if (!fileExists('./signmar')) {
        sh 'wget -O ./signmar ftp://10.180.244.36/cliqz-browser-build-artifacts/mar/signmar'
        sh 'chmod a+x signmar'
    }
    if (!fileExists('./libmozsqlite3.so')) { sh 'wget -O ./libmozsqlite3.so ftp://10.180.244.36/cliqz-browser-build-artifacts/mar/libmozsqlite3.so' }
    if (!fileExists('./libnss3.so')) { sh 'wget -O ./libnss3.so ftp://10.180.244.36/cliqz-browser-build-artifacts/mar/libnss3.so' }
    if (!fileExists('./libnspr4.so')) { sh 'wget -O ./libnspr4.so ftp://10.180.244.36/cliqz-browser-build-artifacts/mar/libnspr4.so' }
    if (!fileExists('./libfreeblpriv3.so')) { sh 'wget -O ./libfreeblpriv3.so ftp://10.180.244.36/cliqz-browser-build-artifacts/mar/libfreeblpriv3.so' }
    if (!fileExists('./libsoftokn3.so')) { sh 'wget -O ./libsoftokn3.so ftp://10.180.244.36/cliqz-browser-build-artifacts/mar/libsoftokn3.so' }

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
def windows_signing(name, objDir, artifactGlob, locales) {
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
                    for (String locale in locales) {
                        // full installer signing
                        bat "ci/sign_win.bat ${locale}"
                        // stub installer signing
                        withEnv(['STUB_PREFIX=-stub']) {
                            bat "ci/sign_win.bat ${locale}"
                        }
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
                            "PKG_NAME=Ghostery Dawn",
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
                archiveArtifacts artifacts: "mozilla-release/obj-x86_64-apple-darwin/dist/update/*.mar"
            }
        }
    }
}

def mac_unified_dmg() {
    def name = 'MacOSARM'
    def x86ObjDir = "obj-x86_64-apple-darwin"
    checkout scm
    docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')
    image = docker.build("ua-build-macosarm", '-f build/MacOSARM.dockerfile ./build/ --build-arg IPFS_GATEWAY=http://10.180.244.30:8080')
    image.inside() {
        prepare_workspace(false, 'macosx-aarch64', true)
        unarchive mapping: ["mozilla-release/" : "."]
        unstash name
        withEnv(["MOZCONFIG=${env.WORKSPACE}/mozconfig"]) {
            sh 'ci/unify_mac_dmg.sh'
            // the unify script replaces the .dmg and .mar files for x86_64 with fat ones, so we rearchive to replace them
            archiveArtifacts artifacts: "mozilla-release/${x86ObjDir}/dist/Ghostery-*"
            // restash MacOSX64 artifacts
            stash name: 'MacOSX64', includes: [
                "mozilla-release/${x86ObjDir}/dist/Ghostery-*",
                "mozilla-release/browser/config/version.txt",
                "mozilla-release/build/package/mac_osx/unpack-diskimage",
                "mozilla-release/security/mac/hardenedruntime/*",
                "mozilla-release/tools/update-packaging/*"
            ].join(',')
        }
    }
}

def withGithubRelease(Closure body) {
    docker.image('golang').inside("-u root") {
        sh 'go get github.com/ghostery/github-release'
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
