properties([
    parameters([
        booleanParam(name: 'Reset', defaultValue: false, description: 'clean workspace files'),
        booleanParam(name: 'Clobber', defaultValue: false, description: 'run mach clobber'),
        booleanParam(name: 'Linux64', defaultValue: true, description: ''),
        booleanParam(name: 'Windows64', defaultValue: true, description: ''),
        booleanParam(name: 'MacOSX64', defaultValue: true, description: ''),
        string(name: 'ReleaseName', defaultValue: '', description: ''),
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
            helpers.build(name, 'Linux.dockerfile', 'linux.mozconfig', objDir, params, buildId)()

            archiveArtifacts artifacts: "mozilla-release/$objDir/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            archiveArtifacts artifacts: "mozilla-release/browser/config/*"

            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
                "mozilla-release/$objDir/dist/update/*.mar",
                "mozilla-release/$objDir/dist/bin/signmar",
                "mozilla-release/$objDir/dist/bin/certutil",
                "mozilla-release/$objDir/dist/bin/pk12util",
            ].join(',')
        }
    }

    signmatrix["Sign ${name}"] = helpers.linux_signing(name, objDir, artifactGlob)
}

if (params.Windows64) {
    def name = 'Windows64'
    def objDir = 'obj-x86_64-pc-mingw32'
    def artifactGlob = "$objDir/dist/install/**/*"

    buildmatrix[name] = {
        // we have to run windows builds on magrathea because that is where the vssdk mount is.
        node('docker && magrathea') {
            helpers.build(name, 'Windows.dockerfile', 'win64.mozconfig', objDir, params, buildId)()

            archiveArtifacts artifacts: "mozilla-release/$objDir/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            archiveArtifacts artifacts: "mozilla-release/browser/config/*"

            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
                "mozilla-release/$objDir/dist/update/*.mar",
                "mozilla-release/browser/config/version.txt",
                "mozilla-release/other-licenses/7zstub/firefox/*",
                "mozilla-release/browser/installer/windows/*",
                "mozilla-release/$objDir/dist/bin/signmar.exe",
                "mozilla-release/$objDir/dist/bin/certutil.exe",
                "mozilla-release/$objDir/dist/bin/pk12util.exe",
            ].join(',')
        }
    }

    signmatrix["Sign ${name}"] = helpers.windows_signing(name, objDir, artifactGlob)
}

if (params.MacOSX64) {
    def name = 'MacOSX64'
    def objDir = 'obj-x86_64-apple-darwin'
    def artifactGlob = "$objDir/dist/Ghostery-*"
    buildmatrix[name] = {
        node('docker && !magrathea') {
            helpers.build(name, 'MacOSX.dockerfile', 'macosx.mozconfig', objDir, params, buildId)()

            archiveArtifacts artifacts: "mozilla-release/$objDir/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            archiveArtifacts artifacts: "mozilla-release/browser/config/*"

            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
                "mozilla-release/$objDir/dist/update/*.mar",
                "mozilla-release/build/package/mac_osx/unpack-diskimage",
                "mozilla-release/security/mac/hardenedruntime/*",
                "mozilla-release/$objDir/dist/bin/signmar",
                "mozilla-release/$objDir/dist/bin/certutil",
                "mozilla-release/$objDir/dist/bin/pk12util",
            ].join(',')
        }
    }

    signmatrix["Sign MacOSX64"] = helpers.mac_signing(name, objDir, artifactGlob, shouldRelease)
}

parallel buildmatrix
parallel signmatrix

stage('release') {
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

        node('docker') {
            docker.image('ua-build-base').inside() {
                sh 'rm -rf artifacts'

                unarchive mapping: ["mozilla-release/" : "artifacts"]

                def artifacts = sh(returnStdout: true, script: 'find artifacts -type f -name *.mar').trim().split("\\r?\\n")

                withCredentials(usernamePassword(
                    credentialsId: 'dd3e97c0-5a9c-4ba9-bf34-f0071f6c3afa',
                    passwordVariable: 'AUTH0_M2M_CLIENT_SECRET',
                    usernameVariable: 'AUTH0_M2M_CLIENT_ID'
                )) {
                    // create release on balrog
                    sh """
                        python3 ci/submitter.py release --tag "${params.ReleaseName}" \
                            --client-id "$AUTH0_M2M_CLIENT_ID" \
                            --client-secret "$AUTH0_M2M_CLIENT_SECRET"
                    """
                    // publish builds
                    for(String artifactPath in artifacts) {
                        sh """
                            python3 ci/submitter.py build --tag "${params.ReleaseName}" \
                                --bid "${buildId}" \
                                --mar "${artifactPath}" \
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
