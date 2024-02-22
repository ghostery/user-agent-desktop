/* groovylint-disable DuplicateStringLiteral, LineLength, NestedBlockDepth */
import groovy.transform.Field

properties([
    parameters([
        booleanParam(name: 'Clean', defaultValue: false, description: 'clean workspace files'),
        string(name: 'ReleaseName', defaultValue: '', description: ''),
        booleanParam(name: 'Nightly', defaultValue: false, description: 'Push release to nightly'),
    ]),
])

def shouldRelease = params.ReleaseName?.trim()

stage('Prepare') {
    node('browser-builder') {
        checkout scm

        triggeringCommitHash = sh(returnStdout: true, script: "git log -n 1 --pretty=format:'%h'").trim()

        if (params.Clean) {
            sh 'rm -rf mozilla-release'
            sh 'rm -rf .cache'
            sh 'rm -rf pkg'
        }

        download('makecab.exe')
        download('MacOSX14.0.sdk.tar.xz')

        docker.build('ua-sign-windows', '-f ./build/sign-windows/Dockerfile ./build/sign-windows/ --build-arg UID=`id -u` --build-arg GID=`id -g`')

        def image = docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')

        image.inside() {

            sh 'npm ci'

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

            version = readFile('mozilla-release/browser/config/version.txt').trim()
            displayVersion = readFile('mozilla-release/browser/config/version_display.txt').trim()

            stash name: 'mac-entitlements', includes: [
                'mozilla-release/security/mac/hardenedruntime/v2/production/firefox.browser.xml',
                'mozilla-release/security/mac/hardenedruntime/v2/production/plugin-container.xml',
                'mozilla-release/build/package/mac_osx/unpack-diskimage',
                'ci/sign_mac.sh',
            ].join(',')
        }
    }
}

stage('Build Linux') {
    node('browser-builder') {
        buildAndPackage('linux-x86')

        def settings = SETTINGS['linux-x86']

        sh """
            mkdir -p pkg/linux
            cp mozilla-release/${settings.objDir}/dist/Ghostery-${version}.en-US.linux-x86_64.tar.gz pkg/linux/Ghostery-${version}.en-US.linux.tar.gz
            cp mozilla-release/${settings.objDir}/dist/Ghostery-${version}.de.linux-x86_64.tar.gz pkg/linux/Ghostery-${version}.de.linux.tar.gz
            cp mozilla-release/${settings.objDir}/dist/Ghostery-${version}.fr.linux-x86_64.tar.gz pkg/linux/Ghostery-${version}.fr.linux.tar.gz
        """

        archiveArtifacts artifacts: 'pkg/linux/*.tar.gz'
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

stage('Sign Windows') {

    def packages = [
        ["mozilla-release/obj-aarch64-pc-windows-msvc/dist/Ghostery-${version}.en-US.win64-aarch64.zip", 'pkg/arm-en'],
        ["mozilla-release/obj-aarch64-pc-windows-msvc/dist/Ghostery-${version}.de.win64-aarch64.zip", 'pkg/arm-de'],
        ["mozilla-release/obj-aarch64-pc-windows-msvc/dist/Ghostery-${version}.fr.win64-aarch64.zip", 'pkg/arm-fr'],
        ["mozilla-release/obj-x86_64-pc-windows-msvc/dist/Ghostery-${version}.en-US.win64.zip", 'pkg/x86-en'],
        ["mozilla-release/obj-x86_64-pc-windows-msvc/dist/Ghostery-${version}.de.win64.zip", 'pkg/x86-de'],
        ["mozilla-release/obj-x86_64-pc-windows-msvc/dist/Ghostery-${version}.fr.win64.zip", 'pkg/x86-fr'],
    ]

    node('browser-builder') {
        docker.image('ua-sign-windows').inside() {
            for (pkg in packages) {
                sh "rm -rf ${pkg[1]}/Ghostery"
                try {
                    sh "unzip ${pkg[0]} -d ${pkg[1]}"

                    signWindowsBinaries("${pkg[1]}/Ghostery")

                    String archiveName = pkg[0].split('/').last()

                    sh "cd ${pkg[1]} && zip -r ${archiveName} Ghostery"
                } finally {
                    sh "rm -rf ${pkg[1]}/Ghostery"
                }
            }

            signWindowsBinaries('pkg')
        }
    }
}

stage('Repackage Windows installers') {
    node('browser-builder') {

        def installersX86 = [
            ["pkg/x86-en/Ghostery-${version}.en-US.win64.zip", "pkg/Ghostery-${version}.en-US.win64.installer.exe", 'en-US'],
            ["pkg/x86-de/Ghostery-${version}.de.win64.zip", "pkg/Ghostery-${version}.de.win64.installer.exe", 'de'],
            ["pkg/x86-fr/Ghostery-${version}.fr.win64.zip", "pkg/Ghostery-${version}.fr.win64.installer.exe", 'fr'],
        ]

        withMach('windows-x86') { settings ->
            for (installer in installersX86) {
                sh """
                    ./mach repackage installer \
                        -o ${env.WORKSPACE}/${installer[1]} \
                        --package-name 'Ghostery' \
                        --package ${env.WORKSPACE}/${installer[0]} \
                        --tag browser/installer/windows/app.tag \
                        --setupexe ${env.WORKSPACE}/pkg/installers/win64/${installer[2]}/setup.exe \
                        --sfx-stub other-licenses/7zstub/firefox/7zSD.Win32.sfx \
                        --use-upx
                """
            }
        }

        def installersARM = [
            ["pkg/arm-en/Ghostery-${version}.en-US.win64-aarch64.zip", "pkg/Ghostery-${version}.en-US.win64-aarch64.installer.exe", 'en-US'],
            ["pkg/arm-de/Ghostery-${version}.de.win64-aarch64.zip", "pkg/Ghostery-${version}.de.win64-aarch64.installer.exe", 'de'],
            ["pkg/arm-fr/Ghostery-${version}.fr.win64-aarch64.zip", "pkg/Ghostery-${version}.fr.win64-aarch64.installer.exe", 'fr'],
        ]

        withMach('windows-arm') { settings ->
            for (installer in installersARM) {
                sh """
                    ./mach repackage installer \
                        -o ${env.WORKSPACE}/${installer[1]} \
                        --package-name 'Ghostery' \
                        --package ${env.WORKSPACE}/${installer[0]} \
                        --tag browser/installer/windows/app.tag \
                        --setupexe ${env.WORKSPACE}/pkg/installers/win64-aarch64/${installer[2]}/setup.exe \
                        --sfx-stub other-licenses/7zstub/firefox/7zSD.Win32.sfx \
                        --use-upx
                """
            }
        }

        def stubInstallersX86 = [
            ["pkg/x86-en/Ghostery-${version}.en-US.win64.zip", "pkg/Ghostery-${version}.en-US.win64.installer-stub.exe", 'en-US'],
            ["pkg/x86-de/Ghostery-${version}.de.win64.zip", "pkg/Ghostery-${version}.de.win64.installer-stub.exe", 'de'],
            ["pkg/x86-fr/Ghostery-${version}.fr.win64.zip", "pkg/Ghostery-${version}.fr.win64.installer-stub.exe", 'fr'],
        ]

        withMach('windows-x86') { settings ->
            for (installer in stubInstallersX86) {
                sh """
                   ./mach repackage installer \
                        -o ${env.WORKSPACE}/${installer[1]} \
                        --tag browser/installer/windows/stub.tag \
                        --setupexe ${env.WORKSPACE}/pkg/installers/win64/${installer[2]}/setup-stub.exe \
                        --sfx-stub other-licenses/7zstub/firefox/7zSD.Win32.sfx \
                        --use-upx
                """
            }
        }

        def stubInstallersARM = [
            ["pkg/arm-en/Ghostery-${version}.en-US.win64-aarch64.zip", "pkg/Ghostery-${version}.en-US.win64-aarch64.installer-stub.exe", 'en-US'],
            ["pkg/arm-de/Ghostery-${version}.de.win64-aarch64.zip", "pkg/Ghostery-${version}.de.win64-aarch64.installer-stub.exe", 'de'],
            ["pkg/arm-fr/Ghostery-${version}.fr.win64-aarch64.zip", "pkg/Ghostery-${version}.fr.win64-aarch64.installer-stub.exe", 'fr'],
        ]

        withMach('windows-arm') { settings ->
            for (installer in stubInstallersARM) {
                sh """
                   ./mach repackage installer \
                        -o ${env.WORKSPACE}/${installer[1]} \
                        --tag browser/installer/windows/stub.tag \
                        --setupexe ${env.WORKSPACE}/pkg/installers/win64-aarch64/${installer[2]}/setup-stub.exe \
                        --sfx-stub other-licenses/7zstub/firefox/7zSD.Win32.sfx \
                        --use-upx
                """
            }
        }

        docker.image('ua-sign-windows').inside() {
            signWindowsBinaries('pkg')
        }

        archiveArtifacts artifacts: 'pkg/*.exe'
    }
}

stage('Unify Mac DMG') {
     node('browser-builder') {
        def armObjDir = SETTINGS['macos-arm'].objDir
        def x86ObjDir = SETTINGS['macos-x86'].objDir

        def dmgs = [
            ["mozilla-release/${armObjDir}/dist/Ghostery-${version}.en-US.mac.dmg", "mozilla-release/${x86ObjDir}/dist/Ghostery-${version}.en-US.mac.dmg", "pkg/Ghostery-${version}.en-US.dmg"],
            ["mozilla-release/${armObjDir}/dist/Ghostery-${version}.de.mac.dmg", "mozilla-release/${x86ObjDir}/dist/Ghostery-${version}.de.mac.dmg", "pkg/Ghostery-${version}.de.dmg"],
            ["mozilla-release/${armObjDir}/dist/Ghostery-${version}.fr.mac.dmg", "mozilla-release/${x86ObjDir}/dist/Ghostery-${version}.fr.mac.dmg", "pkg/Ghostery-${version}.fr.dmg"],
        ]

        withMach('macos-arm') {
            for (dmg in dmgs) {
                sh """
                    cd ${env.WORKSPACE}
                    ./ci/unify_mac_dmg.sh ${dmg[0]} ${dmg[1]} ${dmg[2]}
                """
            }
        }

        stash name: 'mac-unified-dmg', includes: 'pkg/*.dmg'
    }
}

stage('Sign Mac') {
    node('gideon') {
        if (params.Clean) {
            sh 'rm -rf mozilla-release'
            sh 'rm -rf pkg'
            sh 'rm -rf ci'
        }

        unstash 'mac-unified-dmg'
        unstash 'mac-entitlements'

        def packages = [
            ["pkg/Ghostery-${version}.en-US.dmg", "pkg/mac-en"],
            ["pkg/Ghostery-${version}.de.dmg", "pkg/mac-de"],
            ["pkg/Ghostery-${version}.fr.dmg", "pkg/mac-fr"],
        ]

        withEnv([
            "APP_NAME=Ghostery",
            "PKG_NAME=Ghostery Private Browser",
            "APPLE_TEAM_ID=HPY23A294X",
        ]) {
            withCredentials([
                file(credentialsId: '5f834aab-07ff-4c3f-9848-c2ac02b3b532', variable: 'MAC_CERT'),
                string(credentialsId: 'b21cbf0b-c5e1-4c0f-9df7-20bb8ba61a2c', variable: 'MAC_CERT_PASS'),
            ]) {
                try {
                    // create temporary keychain and make it a default one
                    sh '''#!/bin/bash -l -x
                        security create-keychain -p ci ci
                        security list-keychains -s ci
                        security default-keychain -s ci
                        security unlock-keychain -p ci ci
                    '''

                    sh '''#!/bin/bash -l +x
                        security import $MAC_CERT -P $MAC_CERT_PASS -k ci -A
                        security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k ci ci
                    '''

                    for (pkg in packages) {
                        sh "./ci/sign_mac.sh ${pkg[0]} ${pkg[1]}"
                    }
                } finally {
                    sh '''#!/bin/bash -l -x
                        security delete-keychain ci
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
                    String bundlePath = "${env.PKG_NAME}.zip"
                    String appPath = "${pkg[1]}/${env.APP_NAME}/${env.PKG_NAME}.app"

                    try {
                        sh "zip -r '${bundlePath}' '${appPath}'"

                        sh "xcrun notarytool submit --team-id ${env.APPLE_TEAM_ID} --apple-id '${env.MAC_NOTARY_USER}' --password '${env.MAC_NOTARY_PASS}' '${bundlePath}' --wait"

                        sh "xcrun stapler staple '${appPath}'"
                    } finally {
                        sh "rm -rf ${bundlePath}"
                    }
                }
            }

            for (pkg in packages) {
                def archiveName = pkg[0].split('/').last()[0..-4] + 'tar.gz'
                sh "tar zcf ${pkg[1]}/${archiveName} -C \"${pkg[1]}/${env.APP_NAME}\" .DS_Store .VolumeIcon.icns \"${env.PKG_NAME}.app\" .background"
            }

            stash name: 'signed-pkg-mac', includes: 'pkg/*/*.tar.gz'
        }
    }
}

stage('Repackage Mac') {
    node('browser-builder') {
        unstash 'signed-pkg-mac'

        def dmgs = [
            ["pkg/mac-en/Ghostery-${version}.en-US.tar.gz", "pkg/Ghostery-${version}.en-US.mac.dmg"],
            ["pkg/mac-de/Ghostery-${version}.de.tar.gz", "pkg/Ghostery-${version}.de.mac.dmg"],
            ["pkg/mac-fr/Ghostery-${version}.fr.tar.gz", "pkg/Ghostery-${version}.fr.mac.dmg"],
        ]

        withMach('macos-x86') {
            for (dmg in dmgs) {
                sh "./mach repackage dmg -i ${env.WORKSPACE}/${dmg[0]} -o ${env.WORKSPACE}/${dmg[1]}"
            }
        }

        archiveArtifacts artifacts: 'pkg/*.dmg'
    }
}

stage('Repackage MAR') {
    node('browser-builder') {
        def pwd = sh(returnStdout: true, script: 'pwd').trim()

        def packages = [
            ['x86_64', "pkg/linux/Ghostery-${version}.en-US.linux.tar.gz", "pkg/mars/Ghostery-${version}.en-US.linux-x86_64.complete.mar"],
            ['x86_64', "pkg/linux/Ghostery-${version}.de.linux.tar.gz", "pkg/mars/Ghostery-${version}.de.linux-x86_64.complete.mar"],
            ['x86_64', "pkg/linux/Ghostery-${version}.fr.linux.tar.gz", "pkg/mars/Ghostery-${version}.fr.linux-x86_64.complete.mar"],
            ['macos-x86_64-aarch64', "pkg/mac-en/Ghostery-${version}.en-US.tar.gz", "pkg/mars/Ghostery-${version}.en-US.mac.complete.mar"],
            ['macos-x86_64-aarch64', "pkg/mac-de/Ghostery-${version}.de.tar.gz", "pkg/mars/Ghostery-${version}.de.mac.complete.mar"],
            ['macos-x86_64-aarch64', "pkg/mac-fr/Ghostery-${version}.fr.tar.gz", "pkg/mars/Ghostery-${version}.fr.mac.complete.mar"],
            ['x86', "pkg/x86-en/Ghostery-${version}.en-US.win64.zip", "pkg/mars/Ghostery-${version}.en-US.win64.complete.mar"],
            ['x86', "pkg/x86-de/Ghostery-${version}.de.win64.zip", "pkg/mars/Ghostery-${version}.de.win64.complete.mar"],
            ['x86', "pkg/x86-fr/Ghostery-${version}.fr.win64.zip", "pkg/mars/Ghostery-${version}.fr.win64.complete.mar"],
            ['aarch64', "pkg/arm-en/Ghostery-${version}.en-US.win64-aarch64.zip", "pkg/mars/Ghostery-${version}.en-US.win64-aarch64.complete.mar"],
            ['aarch64', "pkg/arm-de/Ghostery-${version}.de.win64-aarch64.zip", "pkg/mars/Ghostery-${version}.de.win64-aarch64.complete.mar"],
            ['aarch64', "pkg/arm-fr/Ghostery-${version}.fr.win64-aarch64.zip", "pkg/mars/Ghostery-${version}.fr.win64-aarch64.complete.mar"],
        ]

        sh 'mkdir -p pkg/mars'

        withMach('linux-x86') {
            for (pkg in packages) {
                sh """
                    ./mach repackage mar \
                        --arch ${pkg[0]} \
                        --mar-channel-id $MAR_CHANNEL_ID \
                        --input ${pwd}/${pkg[1]} \
                        --mar /builds/worker/bin/mar  \
                        --output ${pwd}/${pkg[2]}
                """
            }

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

                    for (pkg in packages) {
                        def marPath = "${pwd}/${pkg[2]}"
                        sh """#!/bin/bash
                            set -x
                            set -e
                            ./obj-x86_64-pc-linux-gnu/dist/bin/signmar -d \$CERT_DB_PATH \
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

        archiveArtifacts artifacts: 'pkg/mars/*.mar'
    }
}

stage('Publish to github') {
    if (shouldRelease) {
        node('browser-builder') {
            docker.image('ua-build-base').inside() {
                def artifacts = [
                    "pkg/Ghostery-${version}.en-US.mac.dmg",
                    "pkg/Ghostery-${version}.de.mac.dmg",
                    "pkg/Ghostery-${version}.fr.mac.dmg",
                    "pkg/linux/Ghostery-${version}.en-US.linux.tar.gz",
                    "pkg/linux/Ghostery-${version}.de.linux.tar.gz",
                    "pkg/linux/Ghostery-${version}.fr.linux.tar.gz",
                    "pkg/Ghostery-${version}.en-US.win64.installer.exe",
                    "pkg/Ghostery-${version}.de.win64.installer.exe",
                    "pkg/Ghostery-${version}.fr.win64.installer.exe",
                    "pkg/Ghostery-${version}.en-US.win64-aarch64.installer.exe",
                    "pkg/Ghostery-${version}.de.win64-aarch64.installer.exe",
                    "pkg/Ghostery-${version}.fr.win64-aarch64.installer.exe",
                    "pkg/Ghostery-${version}.en-US.win64.installer-stub.exe",
                    "pkg/Ghostery-${version}.de.win64.installer-stub.exe",
                    "pkg/Ghostery-${version}.fr.win64.installer-stub.exe",
                    "pkg/Ghostery-${version}.en-US.win64-aarch64.installer-stub.exe",
                    "pkg/Ghostery-${version}.de.win64-aarch64.installer-stub.exe",
                    "pkg/Ghostery-${version}.fr.win64-aarch64.installer-stub.exe",
                    "pkg/mars/Ghostery-${version}.en-US.linux-x86_64.complete.mar",
                    "pkg/mars/Ghostery-${version}.de.linux-x86_64.complete.mar",
                    "pkg/mars/Ghostery-${version}.fr.linux-x86_64.complete.mar",
                    "pkg/mars/Ghostery-${version}.en-US.mac.complete.mar",
                    "pkg/mars/Ghostery-${version}.de.mac.complete.mar",
                    "pkg/mars/Ghostery-${version}.fr.mac.complete.mar",
                    "pkg/mars/Ghostery-${version}.en-US.win64.complete.mar",
                    "pkg/mars/Ghostery-${version}.de.win64.complete.mar",
                    "pkg/mars/Ghostery-${version}.fr.win64.complete.mar",
                    "pkg/mars/Ghostery-${version}.en-US.win64-aarch64.complete.mar",
                    "pkg/mars/Ghostery-${version}.de.win64-aarch64.complete.mar",
                    "pkg/mars/Ghostery-${version}.fr.win64-aarch64.complete.mar",
                ]

                withCredentials([
                    usernamePassword(
                        credentialsId: 'd60e38ae-4a5a-4eeb-ab64-32fd1fad4a28',
                        passwordVariable: 'GITHUB_TOKEN',
                        usernameVariable: 'GITHUB_USERNAME'
                    )
                ]) {
                    def id = sh(returnStdout: true, script: """
                        curl \
                            --fail \
                            -H "Accept: application/vnd.github.v3+json" \
                            --header "authorization: Bearer $GITHUB_TOKEN" \
                            https://api.github.com/repos/ghostery/user-agent-desktop/releases/tags/${params.ReleaseName} \
                        | jq .id
                    """).trim()

                    for(String artifactPath in artifacts) {
                        def artifactName = artifactPath.split('/').last()
                        sh("""
                            curl \
                                --fail \
                                -X POST \
                                --header "authorization: Bearer $GITHUB_TOKEN" \
                                -H "Accept: application/vnd.github.v3+json" \
                                -H "Content-Type: application/octet-stream" \
                                --data-binary @$artifactPath \
                                "https://uploads.github.com/repos/ghostery/user-agent-desktop/releases/$id/assets?name=$artifactName"
                        """)
                    }
                }
            }
        }
    }
}

stage('publish to balrog') {
    if (shouldRelease) {
        node('browser-builder') {
            docker.image('ua-build-base').inside('--dns 1.1.1.1') {
                def artifacts = [
                    "pkg/mars/Ghostery-${version}.en-US.linux-x86_64.complete.mar",
                    "pkg/mars/Ghostery-${version}.de.linux-x86_64.complete.mar",
                    "pkg/mars/Ghostery-${version}.fr.linux-x86_64.complete.mar",
                    "pkg/mars/Ghostery-${version}.en-US.mac.complete.mar",
                    "pkg/mars/Ghostery-${version}.de.mac.complete.mar",
                    "pkg/mars/Ghostery-${version}.fr.mac.complete.mar",
                    "pkg/mars/Ghostery-${version}.en-US.win64.complete.mar",
                    "pkg/mars/Ghostery-${version}.de.win64.complete.mar",
                    "pkg/mars/Ghostery-${version}.fr.win64.complete.mar",
                    "pkg/mars/Ghostery-${version}.en-US.win64-aarch64.complete.mar",
                    "pkg/mars/Ghostery-${version}.de.win64-aarch64.complete.mar",
                    "pkg/mars/Ghostery-${version}.fr.win64-aarch64.complete.mar",
                ]

                withCredentials([usernamePassword(
                    credentialsId: 'dd3e97c0-5a9c-4ba9-bf34-f0071f6c3afa',
                    passwordVariable: 'AUTH0_M2M_CLIENT_SECRET',
                    usernameVariable: 'AUTH0_M2M_CLIENT_ID'
                )]) {
                    try {
                        sh '''#!/usr/bin/env bash
                            python3 -m venv venv
                            source venv/bin/activate
                            pip3 install balrogclient
                        '''

                        // create release on balrog
                        retry(3) {
                            sh """#!/usr/bin/env bash
                                source venv/bin/activate
                                python3 ci/submitter.py release --tag "${params.ReleaseName}" \
                                    --moz-root artifacts/mozilla-release \
                                    --version ${version} \
                                    --display-version "${displayVersion}" \
                                    --client-id "$AUTH0_M2M_CLIENT_ID" \
                                    --client-secret "$AUTH0_M2M_CLIENT_SECRET"
                            """
                        }

                        // publish builds
                        for(String artifactPath in artifacts) {
                            retry(3) {
                                sh """#!/usr/bin/env bash
                                    source venv/bin/activate
                                    python3 ci/submitter.py build --tag "${params.ReleaseName}" \
                                        --bid "${buildId}" \
                                        --mar "${artifactPath}" \
                                        --moz-root artifacts/mozilla-release \
                                        --version ${version} \
                                        --display-version "${displayVersion}" \
                                        --client-id "$AUTH0_M2M_CLIENT_ID" \
                                        --client-secret "$AUTH0_M2M_CLIENT_SECRET"
                                """
                            }
                        }

                        // copy this release to nightly
                        if (params.Nightly) {
                            retry(3) {
                                sh """#!/usr/bin/env bash
                                    source venv/bin/activate
                                    python3 ci/submitter.py nightly --tag "${params.ReleaseName}" \
                                        --moz-root artifacts/mozilla-release \
                                        --version ${version} \
                                        --display-version "${displayVersion}" \
                                        --client-id "$AUTH0_M2M_CLIENT_ID" \
                                        --client-secret "$AUTH0_M2M_CLIENT_SECRET"
                                """
                            }
                        }
                    } finally {
                        sh "rm -rf venv"
                    }
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
def displayVersion

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
        'packageFormat': 'DMG',
        'objDir': 'obj-x86_64-apple-darwin',
    ],
    'macos-arm': [
        'name': 'MacOSARM',
        'dockerFile': 'MacOSARM.dockerfile',
        'targetPlatform': 'macosx-aarch64',
        'packageFormat': 'DMG',
        'objDir': 'obj-aarch64-apple-darwin',
    ],
    'windows-x86': [
        'name': 'Windows64',
        'dockerFile': 'Windows.dockerfile',
        'targetPlatform': 'win64',
        'packageFormat': 'ZIP',
        'objDir': 'obj-x86_64-pc-windows-msvc',
    ],
    'windows-arm': [
        'name': 'WindowsARM',
        'dockerFile': 'WindowsARM.dockerfile',
        'targetPlatform': 'win64-aarch64',
        'packageFormat': 'ZIP',
        'objDir': 'obj-aarch64-pc-windows-msvc',
    ],
]

@Field
def LOCALES = ['de', 'fr']

// PIPELINE HELPERS

def buildAndPackage(platform) {
    def settings = SETTINGS[platform]
    docker.build(
        "ua-build-${settings.name.toLowerCase()}",
        "-f build/${settings.dockerFile} ./build"
    )

    withMach(platform) {
        sh 'rm -f `pwd`/MacOSX14.0.sdk; ln -s /builds/worker/fetches/MacOSX14.0.sdk `pwd`/MacOSX14.0.sdk'

        sh './mach build'

        sh './mach package'

        if (settings.targetPlatform.startsWith('win64')) {
            sh "mkdir -p ${env.WORKSPACE}/pkg/installers/${settings.targetPlatform}/en-US"
            sh "cp ${settings.objDir}/browser/installer/windows/instgen/setup-stub.exe ${env.WORKSPACE}/pkg/installers/${settings.targetPlatform}/en-US/setup-stub.exe"
            sh "cp ${settings.objDir}/browser/installer/windows/instgen/setup.exe ${env.WORKSPACE}/pkg/installers/${settings.targetPlatform}/en-US/setup.exe"
        }

        sh "cat ${settings.objDir}/dist/bin/updater.ini"

        for (String locale in LOCALES) {
            sh "./mach build installers-${locale}"

            if (settings.targetPlatform.startsWith('win64')) {
                sh "mkdir -p ${env.WORKSPACE}/pkg/installers/${settings.targetPlatform}/${locale}"
                sh "cp ${settings.objDir}/browser/installer/windows/l10ngen/setup-stub.exe ${env.WORKSPACE}/pkg/installers/${settings.targetPlatform}/${locale}/setup-stub.exe"
                sh "cp ${settings.objDir}/browser/installer/windows/l10ngen/setup.exe ${env.WORKSPACE}/pkg/installers/${settings.targetPlatform}/${locale}/setup.exe"
            }

            sh "cat ${settings.objDir}/dist/bin/updater.ini"
        }
    }
}

def withMach(platform, task) {
    def settings = SETTINGS[platform]
    def image = docker.image("ua-build-${settings.name.toLowerCase()}")

    image.inside(
        '-v /mnt/vfat/vs/:/builds/worker/fetches/vs'
    ) {
        withEnv([
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
                task(settings)
            }
        }
    }
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

void signWindowsBinaries(String folderPath) {
    dir(folderPath) {
        withCredentials([
            string(credentialsId: "UAD_AZURE_USER_ID", variable: 'UAD_AZURE_USER_ID'),
            string(credentialsId: "UAD_AZURE_PASSWORD", variable: 'UAD_AZURE_PASSWORD'),
            string(credentialsId: "UAD_AZURE_TENANT", variable: 'UAD_AZURE_TENANT'),
        ]) {
            sh """
                set -e
                az login \
                    --service-principal \
                    --username "${env.UAD_AZURE_USER_ID}" \
                    --password "${env.UAD_AZURE_PASSWORD}" \
                    --tenant "${env.UAD_AZURE_TENANT}"

                for f in \$(find . -name '*.exe' -o -name '*.dll'); do
                    jsign \
                        --storetype AZUREKEYVAULT \
                        --storepass \$(az account get-access-token --resource "https://vault.azure.net" | jq -r .accessToken) \
                        --tsmode RFC3161 \
                        --alg SHA-256 \
                        --tsaurl http://timestamp.digicert.com \
                        --keystore ChrmodCodeSigningTest \
                        --alias ChrmodCodeSigningTest \
                        "\$f"
                    # osslsigncode verify "\$f"
                done
            """
        }
    }
}
