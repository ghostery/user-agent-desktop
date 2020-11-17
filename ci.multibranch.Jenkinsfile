properties([
    parameters([
        booleanParam(name: 'Reset', defaultValue: false, description: 'clean workspace files'),
        booleanParam(name: 'Clobber', defaultValue: false, description: 'run mach clobber'),
        booleanParam(name: 'Linux64', defaultValue: true, description: ''),
        booleanParam(name: 'Windows64', defaultValue: true, description: ''),
        booleanParam(name: 'MacOSX64', defaultValue: true, description: ''),
        string(name: 'ReleaseName', defaultValue: '', description: ''),
        booleanParam(name: 'Nightly', defaultValue: false, description: 'Push release to nightly'),
        booleanParam(name: 'PGO', defaultValue: false, description: 'Enable Profile Guided Optimization'),
        string(name: 'PGOProfiles', defaultValue: 'http://kria.cliqz:8080/ipfs/QmbgLeiiCdNbGYywzgqX7esXfkBFAQwr6zyA4MQySrmj2i/82.0.3', description: 'Base URL for fetching PGO Profiles'),
        booleanParam(name: 'Instrument', defaultValue: false, description: 'Enable an instrumented build for generating profiles for PGO'),
    ]),
])

def buildmatrix = [:]
def signmatrix = [:]
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
            helpers.build(name, 'Linux.dockerfile', 'linux', objDir, params, buildId)()

            archiveArtifacts artifacts: "mozilla-release/$objDir/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            archiveArtifacts artifacts: "mozilla-release/browser/config/version*"

            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
            ].join(',')

            sh "rm -rf mozilla-release/$objDir/dist/update"
        }
    }

    if (shouldRelease) {
        signmatrix["Sign ${name}"] = helpers.linux_signing(name, objDir, artifactGlob)
    }
}

if (params.Windows64) {
    def name = 'Windows64'
    def objDir = 'obj-x86_64-pc-mingw32'
    def artifactGlob = "$objDir/dist/install/**/*"

    buildmatrix[name] = {
        // we have to run windows builds on magrathea because that is where the vssdk mount is.
        node('docker && magrathea') {
            helpers.build(name, 'Windows.dockerfile', 'win64', objDir, params, buildId)()

            archiveArtifacts artifacts: "mozilla-release/$objDir/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            archiveArtifacts artifacts: "mozilla-release/${objDir}/dist/*.win64.zip"
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

    if (shouldRelease) {
        signmatrix["Sign ${name}"] = helpers.windows_signing(name, objDir, artifactGlob)
    }
}

if (params.MacOSX64) {
    def name = 'MacOSX64'
    def objDir = 'obj-x86_64-apple-darwin'
    def artifactGlob = "$objDir/dist/Ghostery-*"
    buildmatrix[name] = {
        node('docker && !magrathea') {
            helpers.build(name, 'MacOSX.dockerfile', 'macosx', objDir, params, buildId)()

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

    if (shouldRelease) {
        signmatrix["Sign MacOSX64"] = helpers.mac_signing(name, objDir, artifactGlob)
    }
}

parallel buildmatrix
parallel signmatrix

stage('Sign MAR') {
    if (shouldRelease) {
        node('docker') {
            checkout scm

            docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')

            docker.image('ua-build-base').inside() {
                unarchive mapping: ["mozilla-release/" : "."]

                helpers.signmar()

                archiveArtifacts artifacts: "mozilla-release/obj*/dist/update/*.mar"
            }
        }
    }
}


stage('publish to github') {
    if (shouldRelease) {
        node('docker') {
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
                        // generate partials from the last nightly version
                        // By doing this before updating nightly we can use the nightly release
                        // data on balrog to reference the previous day's nightly
                        build job: 'user-agent/desktop-partial-updates', parameters: [
                            string(name: 'from', value: 'nightly'),
                            string(name: 'to', value: params.ReleaseName)
                        ], propagate: false, wait: true
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
