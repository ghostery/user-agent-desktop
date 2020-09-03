properties([
    parameters([
        booleanParam(name: 'Reset', defaultValue: false, description: 'clean workspace files'),
        booleanParam(name: 'Clobber', defaultValue: false, description: 'run mach clobber'),
        booleanParam(name: 'Linux64', defaultValue: true, description: ''),
        booleanParam(name: 'Windows64', defaultValue: false, description: ''),
        booleanParam(name: 'MacOSX64', defaultValue: false, description: ''),
        string(name: 'ReleaseName', defaultValue: '', description: ''),
    ]),
])

def buildmatrix = [:]
def signmatrix = [:]
def releasematrix = [:]

node('master') {
    checkout scm
    def helpers = load "release/build-helpers.groovy"

    if (params.Linux64) {
        def name = 'Linux64'
        def artifactGlob = 'obj-x86_64-pc-linux-gnu/dist/Ghostery-*'
        // buildmatrix[name] = {
        //     node('docker && !magrathea') {
        //         helpers.build(name, 'Linux.dockerfile', 'linux.mozconfig', 'obj-x86_64-pc-linux-gnu/dist/Ghostery-*', params)()
        //         stage("${name}: publish artifacts") {
        //             archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
        //         }
        //     }
        // }
        def releaseFile = "release$name"
        sh """
            touch $releaseFile
            echo $ReleaseName > $releaseFile
        """
        archiveArtifacts artifacts: releaseFile

        releasematrix['Relase Linux64'] = {
            helpers.withGithubRelease() {
                unarchive mapping: ["$releaseFile" : "dir/releaseFile"]
                sh 'ls'
                echo "test"
                sh 'ls dir'

                sh """
                    github-release upload \
                        --user human-web \
                        --repo user-agent-desktop \
                        --tag "${params.ReleaseName}" \
                        --name testFile \
                        --file dir/releaseFile
                """
            }
        }
    }

    if (params.Windows64) {
        def name = 'Windows64'
        def artifactGlob = 'obj-x86_64-pc-mingw32/dist/install/**/*'
        buildmatrix[name] = {
            // we have to run windows builds on magrathea because that is where the vssdk mount is.
            node('docker && magrathea') {
                helpers.build(name, 'Windows.dockerfile', 'win64.mozconfig', artifactGlob, params)()
                stage("${name}: publish artifacts") {
                    archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
                    stash name: name, includes: "mozilla-release/${artifactGlob},mozilla-release/browser/config/version.txt,mozilla-release/other-licenses/7zstub/firefox/*,mozilla-release/browser/installer/windows/*"
                }
            }
        }
        // TODO: Put this only in release builds
        if (env.BRANCH_NAME == 'master' || ReleaseName?.trim()) {
            signmatrix["Sign ${name}"] = helpers.windows_signing(name, artifactGlob)
        }
    }

    if (params.MacOSX64) {
        def name = 'MacOSX64'
        def artifactGlob = 'obj-x86_64-apple-darwin/dist/Ghostery-*'
        buildmatrix[name] = {
            node('docker && !magrathea') {
                helpers.build(name, 'MacOSX.dockerfile', 'macosx.mozconfig', 'obj-x86_64-apple-darwin/dist/Ghostery-*', params)()
                stage("${name}: publish artifacts") {
                    archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
                    // files needed for packaging
                    stash includes: "mozilla-release/${artifactGlob},mozilla-release/build/package/mac_osx/unpack-diskimage,mozilla-release/security/mac/hardenedruntime/*", name: name
                }
            }
        }
        if (env.BRANCH_NAME == 'master' || ReleaseName?.trim()) {
            signmatrix["Sign MacOSX64"] = helpers.mac_signing(name, artifactGlob)
        }
    }
}

parallel buildmatrix
parallel signmatrix
parallel releasematrix
