properties([
    parameters([
        booleanParam(name: 'Reset', defaultValue: false, description: 'clean workspace files'),
        booleanParam(name: 'Clobber', defaultValue: false, description: 'run mach clobber'),
        booleanParam(name: 'Linux64', defaultValue: true, description: ''),
        booleanParam(name: 'Windows64', defaultValue: true, description: ''),
        booleanParam(name: 'WindowsARM', defaultValue: false, description: ''),
        booleanParam(name: 'MacOSX64', defaultValue: true, description: ''),
        booleanParam(name: 'MacOSARM', defaultValue: false, description: ''),
        string(name: 'ReleaseName', defaultValue: '', description: ''),
        booleanParam(name: 'Nightly', defaultValue: false, description: 'Push release to nightly'),
        booleanParam(name: 'PGO', defaultValue: false, description: 'Enable Profile Guided Optimization'),
        string(name: 'PGOProfiles', defaultValue: 'http://10.180.244.30:8080/ipfs/QmXCSpgk3QMCf229eYpPva22EASeTLAvoWby23LW8MSJ1Z/86.0', description: 'Base URL for fetching PGO Profiles'),
        booleanParam(name: 'Instrument', defaultValue: false, description: 'Enable an instrumented build for generating profiles for PGO'),
        string(name: 'Locales', defaultValue: 'de', description: 'Repack for these locales'),
    ]),
])

def buildmatrix = [:]
def postbuildmatrix = [:]
def signmatrix = [:]
def shouldRelease = params.ReleaseName?.trim()
def helpers
def buildId = new Date().format('yyyyMMddHHmmss')
def locales = params.Locales ? params.Locales.split(',') : []

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
            helpers.build([
                name: name,
                dockerFile: 'Linux.dockerfile',
                targetPlatform: 'linux',
                objDir: objDir,
                artifactGlob: artifactGlob,
                locales: locales,
                buildId: buildId,
                Reset: params.Reset,
                Clobber: params.Clobber,
                PGO: params.PGO,
                Instrument: params.Instrument,
                PGOProfiles: params.PGOProfiles,
            ])()

            archiveArtifacts artifacts: "mozilla-release/${objDir}/dist/update/*.mar"
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
            helpers.build([
                name: name,
                dockerFile: 'Windows.dockerfile',
                targetPlatform: 'win64',
                objDir: objDir,
                artifactGlob: artifactGlob,
                locales: locales,
                buildId: buildId,
                Reset: params.Reset,
                Clobber: params.Clobber,
                PGO: params.PGO,
                Instrument: params.Instrument,
                PGOProfiles: params.PGOProfiles,
            ], {
                if (shouldRelease) {
                    helpers.windows_signed_packaging(name, objDir)
                }
            })()

            archiveArtifacts artifacts: "mozilla-release/${objDir}/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            archiveArtifacts artifacts: "mozilla-release/${objDir}/dist/*.win64.zip"
            archiveArtifacts artifacts: "mozilla-release/browser/config/version*"

            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
                "mozilla-release/browser/config/version.txt",
                "mozilla-release/other-licenses/7zstub/firefox/*",
                "mozilla-release/browser/installer/windows/*",
                "mozilla-release/browser/installer/windows/instgen/*",
            ].join(',')

            sh "rm -rf mozilla-release/${objDir}/dist/update"
        }
    }

    if (shouldRelease) {
        signmatrix["Sign ${name}"] = helpers.windows_signing(name, objDir, artifactGlob, locales + "en-US")
    }
}

if (params.WindowsARM) {
    def name = 'WindowsARM'
    def objDir = 'obj-aarch64-windows-mingw32'
    def artifactGlob = "$objDir/dist/install/**/*"

    buildmatrix[name] = {
        node('docker && magrathea') {
            helpers.build([
                name: name,
                dockerFile: 'WindowsARM.dockerfile',
                targetPlatform: 'win64-aarch64',
                objDir: objDir,
                artifactGlob: artifactGlob,
                locales: locales,
                buildId: buildId,
                Reset: params.Reset,
                Clobber: params.Clobber,
                PGO: params.PGO,
                Instrument: params.Instrument,
                PGOProfiles: params.PGOProfiles,
            ],  {
                if (shouldRelease) {
                    helpers.windows_signed_packaging(name, objDir)
                }
            })()

            archiveArtifacts artifacts: "mozilla-release/${objDir}/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"

            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
                "mozilla-release/browser/config/version.txt",
                "mozilla-release/other-licenses/7zstub/firefox/*",
                "mozilla-release/browser/installer/windows/*",
            ].join(',')

            sh "rm -rf mozilla-release/${objDir}/dist/update"
        }
    }

    if (shouldRelease) {
        signmatrix["Sign ${name}"] = helpers.windows_signing(name, objDir, artifactGlob, locales + "en-US")
    }
}

if (params.MacOSX64) {
    def name = 'MacOSX64'
    def objDir = 'obj-x86_64-apple-darwin'
    def artifactGlob = "$objDir/dist/Ghostery-*"

    buildmatrix[name] = {
        node('docker && !magrathea') {
            helpers.build([
                name: name,
                dockerFile: 'MacOSX.dockerfile',
                targetPlatform: 'macosx',
                objDir: objDir,
                artifactGlob: artifactGlob,
                locales: locales,
                buildId: buildId,
                Reset: params.Reset,
                Clobber: params.Clobber,
                PGO: params.PGO,
                Instrument: params.Instrument,
                PGOProfiles: params.PGOProfiles,
            ])()

            archiveArtifacts artifacts: "mozilla-release/${objDir}/dist/update/*.mar"
            archiveArtifacts artifacts: "mozilla-release/${artifactGlob}"
            archiveArtifacts artifacts: "mozilla-release/browser/config/version*"

            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
                "mozilla-release/browser/config/version.txt",
                "mozilla-release/build/package/mac_osx/unpack-diskimage",
                "mozilla-release/security/mac/hardenedruntime/*",
                "mozilla-release/tools/update-packaging/*"
            ].join(',')

            sh "rm -rf mozilla-release/${objDir}/dist/update"
        }
    }

    if (shouldRelease) {
        signmatrix["Sign Mac"] = helpers.mac_signing(name, objDir, artifactGlob)
    }
}

if (params.MacOSARM) {
    def name = 'MacOSARM'
    def objDir = 'obj-aarch64-apple-darwin'
    def artifactGlob = "$objDir/dist/Ghostery-*"

    buildmatrix[name] = {
        node('docker && !magrathea') {
            helpers.build([
                name: name,
                dockerFile: 'MacOSARM.dockerfile',
                targetPlatform: 'macosx-aarch64',
                objDir: objDir,
                artifactGlob: artifactGlob,
                locales: locales,
                buildId: buildId,
                Reset: params.Reset,
                Clobber: params.Clobber,
                PGO: params.PGO,
                Instrument: params.Instrument,
                PGOProfiles: params.PGOProfiles,
            ])()

            // the DMG is stashed - this build will then be unified with the x86_64 build
            stash name: name, includes: [
                "mozilla-release/${artifactGlob}",
                "mozilla-release/${objDir}/dist/update/*.mar"
            ].join(',')
        }
    }

    // if x86_64 build is also being done, make a fat multi-arch dmg and mar
    if (params.MacOSX64) {
        postbuildmatrix["MacOS Unified DMG"] = {
            stage('Unify Mac DMG') {
                node('docker && kria') {
                    helpers.mac_unified_dmg()
                }
            }
        }
    }
}

parallel buildmatrix
parallel postbuildmatrix
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
            docker.image('ua-build-base').inside() {
                sh 'rm -rf artifacts'

                unarchive mapping: ["mozilla-release/" : "artifacts"]

                // ignore obj-aarch64-apple-darwin artifacts - they have been unified with grep -v obj-x86-apple-darwin
                def artifacts = sh(returnStdout: true, script: "find artifacts -type f \\( -iname \\*.mar -o -iname *-signed.dmg -o -iname \\*.exe -o -iname \\*.tar.bz2 \\) | grep -v obj-aarch64-apple-darwin").trim().split("\\r?\\n")

                withCredentials([
                    usernamePassword(
                        credentialsId: 'd60e38ae-4a5a-4eeb-ab64-32fd1fad4a28',
                        passwordVariable: 'GITHUB_TOKEN',
                        usernameVariable: 'GITHUB_USERNAME'
                    )
                ]) {
                    def id = sh(returnStdout: true, script: """
                      curl \
                        -H "Accept: application/vnd.github.v3+json" \
                        --header "authorization: Bearer $GITHUB_TOKEN" \
                        https://api.github.com/repos/ghostery/user-agent-desktop/releases/tags/${params.ReleaseName} \
                      | jq .id
                    """).trim()

                    for(String artifactPath in artifacts) {
                        def artifactName = artifactPath.split('/').last()
                        sh("""
                          curl \
                           -X POST \
                           --header "authorization: Bearer $GITHUB_TOKEN" \
                           -H "Accept: application/vnd.github.v3+json" \
                           -H "Content-Type: application/octet-stream" \
                           --data-binary @$artifactPath \
                           "https://uploads.github.com/repos/ghostery/user-agent-desktop/releases/$id/assets?name=$artifactName"
                        """)
                    }
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

                // ignore obj-aarch64-apple-darwin artifacts - they have been unified with grep -v obj-x86-apple-darwin
                def artifacts = sh(returnStdout: true, script: 'find artifacts -type f -name *.mar | grep -v obj-aarch64-apple-darwin').trim().split("\\r?\\n")

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
