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

node('master') {
    checkout scm

    helpers = load "release/build-helpers.groovy"
}

if (params.Linux64) {
    def name = 'Linux64'
    def distDir = 'obj-x86_64-pc-linux-gnu'
    def artifactGlob = "$distDir/dist/Ghostery-*"

    buildmatrix[name] = {
        node('docker && !magrathea') {
            helpers.build(name, 'Linux.dockerfile', 'linux.mozconfig', distDir, params)()
            stage("${name}: publish artifacts") {
                archiveArtifacts artifacts: "mozilla-release/$distDir/dist/Ghostery-*"
                stash name: name, includes: "mozilla-release/$distDir/dist/update/*.mar"
            }
        }
    }
}

if (params.Windows64) {
    def name = 'Windows64'
    def distDir = 'obj-x86_64-pc-mingw32'
    def artifactGlob = "$distDir/dist/install/**/*"

    buildmatrix[name] = {
        // we have to run windows builds on magrathea because that is where the vssdk mount is.
        node('docker && magrathea') {
            helpers.build(name, 'Windows.dockerfile', 'win64.mozconfig', distDir, params)()
            stage("${name}: publish artifacts") {
                archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
                stash name: name, includes: [
                    "mozilla-release/${artifactGlob}",
                    "mozilla-release/browser/config/version.txt",
                    "mozilla-release/other-licenses/7zstub/firefox/*",
                    "mozilla-release/browser/installer/windows/*",
                    "mozilla-release/$distDir/dist/update/*.mar",
                ].join(',')
            }
        }
    }

    if (shouldRelease) {
        signmatrix["Sign ${name}"] = helpers.windows_signing(name, artifactGlob)
    }
}

if (params.MacOSX64) {
    def name = 'MacOSX64'
    def distDir = 'obj-x86_64-apple-darwin'
    def artifactGlob = "$distDir/dist/Ghostery-*"
    buildmatrix[name] = {
        node('docker && !magrathea') {
            helpers.build(name, 'MacOSX.dockerfile', 'macosx.mozconfig', distDir, params)()
            stage("${name}: publish artifacts") {
                archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
                // files needed for packaging
                stash name: name, includes: [
                    "mozilla-release/${artifactGlob}",
                    "mozilla-release/build/package/mac_osx/unpack-diskimage",
                    "mozilla-release/security/mac/hardenedruntime/*",
                    "mozilla-release/$distDir/dist/update/*.mar",
                ].join(',')
            }
        }
    }

    if (shouldRelease) {
        signmatrix["Sign MacOSX64"] = helpers.mac_signing(name, artifactGlob)
    }
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
    }
}
