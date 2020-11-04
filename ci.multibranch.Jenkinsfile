properties([
    parameters([
        booleanParam(name: 'Reset', defaultValue: false, description: 'clean workspace files'),
        booleanParam(name: 'Clobber', defaultValue: false, description: 'run mach clobber'),
        booleanParam(name: 'Linux64', defaultValue: true, description: ''),
        booleanParam(name: 'Windows64', defaultValue: true, description: ''),
        booleanParam(name: 'MacOSX64', defaultValue: true, description: ''),
        string(name: 'ReleaseName', defaultValue: '', description: ''),
        booleanParam(name: 'Nightly', defaultValue: false, description: 'Push release to nightly'),
    ]),
])

def buildmatrix = [:]
def shouldRelease = params.ReleaseName?.trim()
def helpers
def buildId = new Date().format('yyyyMMddHHmmss')

node('master') {
    checkout scm

    helpers = load "ci/build-helpers.groovy"
}

if (params.Linux64) {
    def name = 'Linux64'
    def objDir = 'obj-x86_64-pc-linux-gnu'
    def artifactGlob = "$objDir/dist/Ghostery-*"

    buildmatrix[name] = {
        node('docker && !magrathea') {
            helpers.build(name, 'Linux.dockerfile', 'linux', objDir, params, buildId, {}, {})()
            
            archiveArtifacts artifacts: "mozilla-release/$objDir/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            archiveArtifacts artifacts: "mozilla-release/browser/config/version*"
            
            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
            ].join(',')

            sh "rm -rf mozilla-release/$objDir/dist/update"
        }
    }
}

if (params.Windows64) {
    def name = 'Windows64'
    def objDir = 'obj-x86_64-pc-mingw32'
    def artifactGlob = "$objDir/dist/install/**/*"

    buildmatrix[name] = {
        // we have to run windows builds on magrathea because that is where the vssdk mount is.
        node('docker && magrathea') {
            helpers.build(name, 'Windows.dockerfile', 'win64', objDir, params, buildId, {    
                if (true || shouldRelease) {
                    helpers.windows_pre_pkg_signing(name, objDir, artifactGlob)
                }
            }, {
                if (true || shouldRelease) {
                    helpers.windows_post_pkg_signing(name, objDir, artifactGlob)
                }
            })()
            
            archiveArtifacts artifacts: "mozilla-release/$objDir/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            archiveArtifacts artifacts: "mozilla-release/browser/config/version*"

            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
                "mozilla-release/browser/config/version.txt",
                "mozilla-release/other-licenses/7zstub/firefox/*",
                "mozilla-release/browser/installer/windows/*",
            ].join(',')

            sh "rm -rf mozilla-release/$objDir/dist/update"
        }
    }
}

if (params.MacOSX64) {
    def name = 'MacOSX64'
    def objDir = 'obj-x86_64-apple-darwin'
    def artifactGlob = "$objDir/dist/Ghostery-*"
    buildmatrix[name] = {
        node('docker && !magrathea') {
            helpers.build(name, 'MacOSX.dockerfile', 'macosx', objDir, params, buildId, {     
                if (true || shouldRelease) {
                    helpers.mac_pre_pkg_signing(name, objDir, artifactGlob)
                }
            }, {
                if (true || shouldRelease) {
                    helpers.mac_post_pkg_signing(name, objDir, artifactGlob)
                }
            })()
            
            archiveArtifacts artifacts: "mozilla-release/$objDir/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            archiveArtifacts artifacts: "mozilla-release/browser/config/version*"

            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
                "mozilla-release/build/package/mac_osx/unpack-diskimage",
                "mozilla-release/security/mac/hardenedruntime/*",
            ].join(',')

            sh "rm -rf mozilla-release/$objDir/dist/update"
        }
    }
}

parallel buildmatrix

stage('Sign MAR') {
    if (shouldRelease) {
        node('docker') {
            checkout scm

            docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')

            docker.image('ua-build-base').inside() {
                if (!fileExists('./signmar')) {
                    sh 'wget -O ./signmar ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/signmar'
                    sh 'chmod a+x signmar'
                }
                if (!fileExists('./libmozsqlite3.so')) { sh 'wget -O ./libmozsqlite3.so ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/libmozsqlite3.so' }
                if (!fileExists('./libnss3.so')) { sh 'wget -O ./libnss3.so ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/libnss3.so' }
                if (!fileExists('./libnspr4.so')) { sh 'wget -O ./libnspr4.so ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/libnspr4.so' }
                if (!fileExists('./libfreeblpriv3.so')) { sh 'wget -O ./libfreeblpriv3.so ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/libfreeblpriv3.so' }
                if (!fileExists('./libsoftokn3.so')) { sh 'wget -O ./libsoftokn3.so ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/mar/libsoftokn3.so' }

                unarchive mapping: ["mozilla-release/" : "."]

                helpers.signmar()

                archiveArtifacts artifacts: "mozilla-release/obj*/dist/update/*.mar"
            }
        }
    }
}


stage('publish to github') {
    if (shouldRelease) {
        helpers.withGithubRelease() {
            sh 'rm -rf artifacts'

            unarchive mapping: ["mozilla-release/" : "artifacts"]

            def artifacts = sh(returnStdout: true, script: 'find artifacts -type f').trim().split("\\r?\\n")

            for(String artifactPath in artifacts) {
                def artifactName = artifactPath.split('/').last()
                sh """
                    github-release upload \
                        --user human-web \
                        --repo user-agent-desktop \
                        --tag "${params.ReleaseName}" \
                        --name "${artifactName}" \
                        --file "${artifactPath}"
                """
            }

            sh 'rm -rf artifacts'
        }
    }
}

stage('publish to balrog') {
    if (shouldRelease) {
        node('docker && magrathea') {
            docker.image('ua-build-base').inside('--dns 1.1.1.1') {
                sh 'rm -rf artifacts'

                unarchive mapping: ["mozilla-release/" : "artifacts"]

                def artifacts = sh(returnStdout: true, script: 'find artifacts -type f -name *.mar').trim().split("\\r?\\n")

                withCredentials([usernamePassword(
                    credentialsId: 'dd3e97c0-5a9c-4ba9-bf34-f0071f6c3afa',
                    passwordVariable: 'AUTH0_M2M_CLIENT_SECRET',
                    usernameVariable: 'AUTH0_M2M_CLIENT_ID'
                )]) {
                    // create release on balrog
                    sh """
                        python3 ci/submitter.py release --tag "${params.ReleaseName}" \
                            --moz-root artifacts/mozilla-release \
                            --client-id "$AUTH0_M2M_CLIENT_ID" \
                            --client-secret "$AUTH0_M2M_CLIENT_SECRET"
                    """
                    // publish builds
                    for(String artifactPath in artifacts) {
                        sh """
                            python3 ci/submitter.py build --tag "${params.ReleaseName}" \
                                --bid "${buildId}" \
                                --mar "${artifactPath}" \
                                --moz-root artifacts/mozilla-release \
                                --client-id "$AUTH0_M2M_CLIENT_ID" \
                                --client-secret "$AUTH0_M2M_CLIENT_SECRET"
                        """
                    }

                    if (params.Nightly) {
                        // copy this release to nightly
                        sh """
                            python3 ci/submitter.py nightly --tag "${params.ReleaseName}" \
                                --moz-root artifacts/mozilla-release \
                                --client-id "$AUTH0_M2M_CLIENT_ID" \
                                --client-secret "$AUTH0_M2M_CLIENT_SECRET"
                        """
                    }

                    sh 'rm -rf artifacts'
                }
            }
        }
    }
}
