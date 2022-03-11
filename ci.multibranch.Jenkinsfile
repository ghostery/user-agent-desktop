import groovy.transform.Field

properties([
    parameters([
        booleanParam(name: 'Reset', defaultValue: false, description: 'clean workspace files'),
        booleanParam(name: 'Clobber', defaultValue: false, description: 'run mach clobber'),
        string(name: 'ReleaseName', defaultValue: '', description: ''),
    ]),
])

stage('Prepare') {
    node('browser-builder') {
        checkout scm

        triggeringCommitHash = sh(returnStdout: true, script: "git log -n 1 --pretty=format:'%h'").trim()

        download('makecab.exe')
        download('MacOSX10.12.sdk.tar.bz2')
        download('MacOSX11.0.sdk.tar.bz2')

        def image = docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')

        image.inside() {
            version = sh(returnStdout: true, script: "cat .workspace | jq -r .app").trim()

            sh 'npm ci'

            if (params.Reset) {
                sh 'rm -rf .cache'
            }

            sh 'rm -rf mozilla-release'

            sh './fern.js use'

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

            sh './fern.js reset'

            sh './fern.js import-patches'

            stash name: 'mac-entitlements', includes: [
                'mozilla-release/security/mac/hardenedruntime/browser.production.entitlements.xml',
                'mozilla-release/security/mac/hardenedruntime/plugin-container.production.entitlements.xml',
            ].join(',')
        }
    }
}

stage('Build Linux') {
    node('browser-builder') {
        buildAndPackage('linux-x86')
    }
}

stage('Build MacOS x86') {
    node('browser-builder') {
        buildAndPackage('macos-x86')
    }
}

stage('Build MacOS ARM') {
    node('browser-builder') {
        buildAndPackage('macos-arm')
    }
}

stage('Build Windows x86') {
    node('browser-builder') {
        buildAndPackage('windows-x86')
    }
}

stage('Build Windows ARM') {
    node('browser-builder') {
        buildAndPackage('windows-arm')
    }
}

stage('Sign') {
    def parallelSigning = [:]

    parallelSigning['mac'] = {
        node('gideon') {
            checkout scm

            // clear mozilla-release to find packages easily
            // sh 'rm -rf mozilla-release'
            // sh 'rm -rf pkg'

            // unstash 'pkg-macos-x86'
            // unstash 'pkg-macos-arm'
            // unstash 'mac-entitlements'

            def packages = [
                ["mozilla-release/obj-aarch64-apple-darwin/dist/Ghostery-${version}.en-US.mac.tar.gz", 'pkg/arm-en'],
                ["mozilla-release/obj-aarch64-apple-darwin/dist/Ghostery-${version}.de.mac.tar.gz", 'pkg/arm-de'],
                ["mozilla-release/obj-aarch64-apple-darwin/dist/Ghostery-${version}.fr.mac.tar.gz", 'pkg/arm-fr'],
                ["mozilla-release/obj-x86_64-apple-darwin/dist/Ghostery-${version}.en-US.mac.tar.gz", 'pkg/x86-en'],
                ["mozilla-release/obj-x86_64-apple-darwin/dist/Ghostery-${version}.de.mac.tar.gz", 'pkg/x86-de'],
                ["mozilla-release/obj-x86_64-apple-darwin/dist/Ghostery-${version}.fr.mac.tar.gz", 'pkg/x86-fr'],
            ]

            withEnv([
                "APP_NAME=Ghostery",
                "PKG_NAME=Ghostery Dawn",
            ]) {
                withCredentials([
                    file(credentialsId: '5f834aab-07ff-4c3f-9848-c2ac02b3b532', variable: 'MAC_CERT'),
                    string(credentialsId: 'b21cbf0b-c5e1-4c0f-9df7-20bb8ba61a2c', variable: 'MAC_CERT_PASS'),
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
                        ]){
                            for (pkg in packages) {
                            //    sh "./ci/sign_mac.sh ${pkg[0]} ${pkg[1]}"
                            }
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

                withCredentials([
                    usernamePassword(
                        credentialsId: '840e974f-f733-4f02-809f-54dc68f5fa46',
                        passwordVariable: 'MAC_NOTARY_PASS',
                        usernameVariable: 'MAC_NOTARY_USER'
                    ),
                ]) {
                    for (pkg in packages) {
                    //    sh "./ci/notarize_mac_app.sh ${pkg[1]}"
                    }
                }

                for (pkg in packages) {
                    def archiveName = pkg[0].split('/').last()
                    // sh "tar zcf ${pkg[1]}/${archiveName} -C ${pkg[1]}/${env.APP_NAME} ."
                }

                // stash name: 'signed-pkg-mac', includes: 'pkg/*/*.tar.gz'
            }
        }
    }

    parallelSigning['windows'] = {
        node('browser-builder-windows') {
            checkout scm

            // bat 'del /s /q mozilla-release'
            // bat 'del /s /q pkg'

            // unstash 'pkg-windows-x86'
            // unstash 'pkg-windows-arm'

            def packages = [
                ["mozilla-release\\obj-aarch64-windows-mingw32\\dist\\Ghostery-${version}.en-US.win64-aarch64.zip", 'pkg\\arm-en'],
                ["mozilla-release\\obj-aarch64-windows-mingw32\\dist\\Ghostery-${version}.de.win64-aarch64.zip", 'pkg\\arm-de'],
                ["mozilla-release\\obj-aarch64-windows-mingw32\\dist\\Ghostery-${version}.fr.win64-aarch64.zip", 'pkg\\arm-fr'],
                ["mozilla-release\\obj-x86_64-pc-mingw32\\dist\\Ghostery-${version}.en-US.win64.zip", 'pkg\\x86-en'],
                ["mozilla-release\\obj-x86_64-pc-mingw32\\dist\\Ghostery-${version}.de.win64.zip", 'pkg\\x86-de'],
                ["mozilla-release\\obj-x86_64-pc-mingw32\\dist\\Ghostery-${version}.fr.win64.zip", 'pkg\\x86-fr'],
            ]

            for (pkg in packages) {
                // powershell "Expand-Archive -Force ${pkg[0]} ${pkg[1]}"

                withCredentials([
                    file(credentialsId: "7da7d2de-5a10-45e6-9ffd-4e49f83753a8", variable: 'WIN_CERT'),
                    string(credentialsId: "33b3705c-1c2e-4462-9354-56a76bbb164c", variable: 'WIN_CERT_PASS'),
                ]) {
                    // bat "ci\\win_signer.bat ${pkg[1]}\\Ghostery"
                }

                def archiveName = pkg[0].split('\\\\').last()
                // powershell "Compress-Archive -Force -DestinationPath ${pkg[1]}\\${archiveName} -Path ${pkg[1]}\\Ghostery*"
            }

            // stash name: 'signed-pkg-windows', includes: 'pkg/*/*.zip'
        }
    }

    parallel parallelSigning
}

stage('Repackage installers') {
    node('browser-builder') {
        // sh 'rm -rf pkg'

        // unstash 'signed-pkg-mac'
        // unstash 'signed-pkg-windows'

        def dmgs = [
            ["pkg/arm-en/Ghostery-${version}.en-US.mac.tar.gz", "pkg/Ghostery-${version}.en.mac-arm.dmg"],
            ["pkg/arm-de/Ghostery-${version}.de.mac.tar.gz", "pkg/Ghostery-${version}.de.mac-arm.dmg"],
            ["pkg/arm-fr/Ghostery-${version}.fr.mac.tar.gz", "pkg/Ghostery-${version}.fr.mac-arm.dmg"],
            ["pkg/x86-en/Ghostery-${version}.en-US.mac.tar.gz", "pkg/Ghostery-${version}.en.mac-x86.dmg"],
            ["pkg/x86-de/Ghostery-${version}.de.mac.tar.gz", "pkg/Ghostery-${version}.de.mac-x86.dmg"],
            ["pkg/x86-fr/Ghostery-${version}.fr.mac.tar.gz", "pkg/Ghostery-${version}.fr.mac-x86.dmg"],
        ]

        docker.image("ua-build-${SETTINGS['macos-x86'].name.toLowerCase()}").inside() {
            withEnv([
                "MACH_USE_SYSTEM_PYTHON=1",
                "MOZCONFIG=${env.WORKSPACE}/mozconfig",
                "MOZ_BUILD_DATE=${buildId}",
                "MOZ_AUTOMATION=1",
                "MOZ_SOURCE_CHANGESET=${triggeringCommitHash}",
                "MH_BRANCH=${env.BRANCH_NAME}",
            ]) {
                sh "./fern.js config --print --force -l --platform ${SETTINGS['macos-x86'].targetPlatform} --brand ghostery"

                dir('mozilla-release') {
                    for (dmg in dmgs) {
                        sh "./mach repackage dmg -i ${env.WORKSPACE}/${dmg[0]} -o ${env.WORKSPACE}/${dmg[1]}"
                    }
                }
            }
        }

        def installers = [
            ["pkg/arm-en/Ghostery-${version}.en-US.win64-aarch64.zip", "pkg/Ghostery-${version}.en.win64-aarch64.installer.exe"],
            ["pkg/arm-de/Ghostery-${version}.de.win64-aarch64.zip", "pkg/Ghostery-${version}.de.win64-aarch64.installer.exe"],
            ["pkg/arm-fr/Ghostery-${version}.fr.win64-aarch64.zip", "pkg/Ghostery-${version}.fr.win64-aarch64.installer.exe"],
            ["pkg/x86-en/Ghostery-${version}.en-US.win64.zip", "pkg/Ghostery-${version}.en.win64.installer.exe"],
            ["pkg/x86-de/Ghostery-${version}.de.win64.zip", "pkg/Ghostery-${version}.de.win64.installer.exe"],
            ["pkg/x86-fr/Ghostery-${version}.fr.win64.zip", "pkg/Ghostery-${version}.fr.win64.installer.exe"],
        ]

        docker.image("ua-build-${SETTINGS['windows-x86'].name.toLowerCase()}").inside() {
            dir('mozilla-release') {
                for (dmg in dmgs) {
                    // sh "./mach repackage dmg -i ${dmg[0]} -o ${dmg[1]}"
                }
            }
        }

        def miniInstallers = [
            ["pkg/arm-en/Ghostery-${version}.en-US.win64-aarch64.zip", "pkg/Ghostery-${version}.en.win64-aarch64.installer-stub.exe"],
            ["pkg/arm-de/Ghostery-${version}.de.win64-aarch64.zip", "pkg/Ghostery-${version}.de.win64-aarch64.installer-stub.exe"],
            ["pkg/arm-fr/Ghostery-${version}.fr.win64-aarch64.zip", "pkg/Ghostery-${version}.fr.win64-aarch64.installer-stub.exe"],
            ["pkg/x86-en/Ghostery-${version}.en-US.win64.zip", "pkg/Ghostery-${version}.en.win64.installer-stub.exe"],
            ["pkg/x86-de/Ghostery-${version}.de.win64.zip", "pkg/Ghostery-${version}.de.win64.installer-stub.exe"],
            ["pkg/x86-fr/Ghostery-${version}.fr.win64.zip", "pkg/Ghostery-${version}.fr.win64.installer-stub.exe"],
        ]

        docker.image("ua-build-${SETTINGS['windows-x86'].name.toLowerCase()}").inside() {
            dir('mozilla-release') {
                for (dmg in dmgs) {
                    // sh "./mach repackage dmg -i ${dmg[0]} -o ${dmg[1]}"
                }
            }
        }
    }
}

// PIPELINE FIELDS

@Field
def triggeringCommitHash

@Field
def version

@Field
def buildId = new Date().format('yyyyMMddHHmmss')

@Field
def SETTINGS = [
    'linux-x86': [
        'name': 'linux',
        'dockerFile': 'Linux.dockerfile',
        'targetPlatform': 'linux',
        'packageFormat': 'TGZ',
        'objDir': 'obj-x86_64-pc-linux-gnu',
    ],
    'macos-x86': [
        'name': 'MacOSX64',
        'dockerFile': 'MacOSX.dockerfile',
        'targetPlatform': 'macosx',
        'packageFormat': 'TGZ',
        'objDir': 'obj-x86_64-apple-darwin',
    ],
    'macos-arm': [
        'name': 'MacOSARM',
        'dockerFile': 'MacOSARM.dockerfile',
        'targetPlatform': 'macosx-aarch64',
        'packageFormat': 'TGZ',
        'objDir': 'obj-aarch64-apple-darwin',
    ],
    'windows-x86': [
        'name': 'Windows64',
        'dockerFile': 'Windows.dockerfile',
        'targetPlatform': 'win64',
        'packageFormat': 'ZIP',
        'objDir': 'obj-x86_64-pc-mingw32',
    ],
    'windows-arm': [
        'name': 'WindowsARM',
        'dockerFile': 'WindowsARM.dockerfile',
        'targetPlatform': 'win64-aarch64',
        'packageFormat': 'ZIP',
        'objDir': 'obj-aarch64-windows-mingw32',
    ],
]

@Field
def LOCALES = ['de', 'fr']

// PIPELINE HELPERS

def buildAndPackage(platform) {
    def settings = SETTINGS[platform]
    def image = docker.build(
        "ua-build-${settings.name.toLowerCase()}",
        "-f build/${settings.dockerFile} ./build"
    )

    /*
    image.inside(
        '-v /mnt/vfat/vs2017_15.9.29/:/builds/worker/fetches/vs2017_15.9.29'
    ) {
        withEnv([
            "MACH_USE_SYSTEM_PYTHON=1",
            "MOZCONFIG=${env.WORKSPACE}/mozconfig",
            "MOZ_BUILD_DATE=${buildId}",
            "MOZ_AUTOMATION=1",
            "MOZ_SOURCE_CHANGESET=${triggeringCommitHash}",
            "MH_BRANCH=${env.BRANCH_NAME}",
            "ACCEPTED_MAR_CHANNEL_IDS=firefox-ghostery-release",
            "MAR_CHANNEL_ID=firefox-ghostery-release",
            "MOZ_PKG_FORMAT=${settings.packageFormat}",
        ]) {
            sh "./fern.js config --print --force -l --platform ${settings.targetPlatform} --brand ghostery"

            dir('mozilla-release') {
                sh 'rm -f `pwd`/MacOSX10.12.sdk; ln -s /builds/worker/fetches/MacOSX10.12.sdk `pwd`/MacOSX10.12.sdk'
                sh 'rm -f `pwd`/MacOSX11.0.sdk; ln -s /builds/worker/fetches/MacOSX11.0.sdk `pwd`/MacOSX11.0.sdk'

                if (params.Clobber) {
                    sh './mach clobber'
                }

                sh './mach build'

                sh './mach package'

                for (String locale in LOCALES) {
                    sh "./mach build installers-${locale}"
                }
            }
        }
    }
    */

    // stash name: "pkg-${platform}", includes: "mozilla-release/${settings.objDir}/dist/Ghostery-*.${settings.packageFormat == 'ZIP' ? 'zip' : 'tar.gz'}"
}

def download(filename) {
    if (!fileExists("./build/${filename}")) {
        withCredentials([
            [$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'user-agent-desktop-jenkins-cache', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'],
        ]) {
            sh "aws s3 --region us-east-1 cp s3://user-agent-desktop-jenkins-cache/${filename} ./build/${filename}"
        }
    }
}
