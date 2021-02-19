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
