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
            sh 'rm -rf mozilla-release/obj*'
            sh 'rm -rf .cache'
        }

        download('makecab.exe')
        download('MacOSX10.12.sdk.tar.bz2')
        download('MacOSX11.0.sdk.tar.bz2')

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
                'mozilla-release/security/mac/hardenedruntime/browser.production.entitlements.xml',
                'mozilla-release/security/mac/hardenedruntime/plugin-container.production.entitlements.xml',
                'mozilla-release/build/package/mac_osx/unpack-diskimage',
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
            cp mozilla-release/${settings.objDir}/dist/Ghostery-${version}.en-US.linux-x86_64.tar.gz pkg/linux/Ghostery-${version}.en.linux.tar.gz
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
    node('browser-builder-windows') {
        checkout scm

        if (params.Clean) {
            bat 'del /s /q mozilla-release'
            bat 'del /s /q pkg'
        }

        unstash 'pkg-windows-x86'
        unstash 'pkg-windows-arm'

        def packages = [
            ["mozilla-release\\obj-aarch64-windows-mingw32\\dist\\Ghostery-${version}.en-US.win64-aarch64.zip", 'pkg\\arm-en'],
            ["mozilla-release\\obj-aarch64-windows-mingw32\\dist\\Ghostery-${version}.de.win64-aarch64.zip", 'pkg\\arm-de'],
            ["mozilla-release\\obj-aarch64-windows-mingw32\\dist\\Ghostery-${version}.fr.win64-aarch64.zip", 'pkg\\arm-fr'],
            ["mozilla-release\\obj-x86_64-pc-mingw32\\dist\\Ghostery-${version}.en-US.win64.zip", 'pkg\\x86-en'],
            ["mozilla-release\\obj-x86_64-pc-mingw32\\dist\\Ghostery-${version}.de.win64.zip", 'pkg\\x86-de'],
            ["mozilla-release\\obj-x86_64-pc-mingw32\\dist\\Ghostery-${version}.fr.win64.zip", 'pkg\\x86-fr'],
        ]

        for (pkg in packages) {
            powershell "Expand-Archive -Force ${pkg[0]} ${pkg[1]}"

            withCredentials([
                file(credentialsId: "7da7d2de-5a10-45e6-9ffd-4e49f83753a8", variable: 'WIN_CERT'),
                string(credentialsId: "33b3705c-1c2e-4462-9354-56a76bbb164c", variable: 'WIN_CERT_PASS'),
            ]) {
                bat "ci\\win_signer.bat ${pkg[1]}\\Ghostery"
            }

            def archiveName = pkg[0].split('\\\\').last()

            powershell "Compress-Archive -Force -DestinationPath ${pkg[1]}\\${archiveName} -Path ${pkg[1]}\\Ghostery*"
        }

        withCredentials([
            file(credentialsId: "7da7d2de-5a10-45e6-9ffd-4e49f83753a8", variable: 'WIN_CERT'),
            string(credentialsId: "33b3705c-1c2e-4462-9354-56a76bbb164c", variable: 'WIN_CERT_PASS'),
        ]) {
            bat "ci\\win_signer.bat pkg\\installers"
        }

        stash name: 'signed-pkg-windows', includes: [
            'pkg/*/*.zip',
            'pkg/installers/*.exe'
        ].join(',')
    }
}

stage('Repackage Windows installers') {
    node('browser-builder') {
        unstash 'signed-pkg-windows'

        // Fix ZIP paths
        sh '''
            for zip in pkg/*/*.zip
            do
                ./ci/zip-fix.sh "$zip"
            done
        '''

        def installersX86 = [
            ["pkg/x86-en/Ghostery-${version}.en-US.win64.zip", "pkg/Ghostery-${version}.en.win64.installer.exe", 'en'],
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
                        --setupexe pkg/installers/setup.win64.${installer[2]}.exe \
                        --sfx-stub other-licenses/7zstub/firefox/7zSD.Win32.sfx \
                        --use-upx
                """
            }
        }

        def installersARM = [
            ["pkg/arm-en/Ghostery-${version}.en-US.win64-aarch64.zip", "pkg/Ghostery-${version}.en.win64-aarch64.installer.exe", 'en'],
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
                        --setupexe pkg/installers/setup.win64-aarch64.${installer[2]}.exe \
                        --sfx-stub other-licenses/7zstub/firefox/7zSD.Win32.sfx \
                        --use-upx
                """
            }
        }

        def stubInstallersX86 = [
            ["pkg/x86-en/Ghostery-${version}.en-US.win64.zip", "pkg/Ghostery-${version}.en.win64.installer-stub.exe", 'en'],
            ["pkg/x86-de/Ghostery-${version}.de.win64.zip", "pkg/Ghostery-${version}.de.win64.installer-stub.exe", 'de'],
            ["pkg/x86-fr/Ghostery-${version}.fr.win64.zip", "pkg/Ghostery-${version}.fr.win64.installer-stub.exe", 'fr'],
        ]

        withMach('windows-x86') { settings ->
            for (installer in stubInstallersX86) {
                sh """
                   ./mach repackage installer \
                        -o ${env.WORKSPACE}/${installer[1]} \
                        --tag browser/installer/windows/stub.tag \
                        --setupexe pkg/installers/setup-stub.win64.${installer[2]}.exe \
                        --sfx-stub other-licenses/7zstub/firefox/7zSD.Win32.sfx \
                        --use-upx
                """
            }
        }

        def stubInstallersARM = [
            ["pkg/arm-en/Ghostery-${version}.en-US.win64-aarch64.zip", "pkg/Ghostery-${version}.en.win64-aarch64.installer-stub.exe"],
            ["pkg/arm-de/Ghostery-${version}.de.win64-aarch64.zip", "pkg/Ghostery-${version}.de.win64-aarch64.installer-stub.exe"],
            ["pkg/arm-fr/Ghostery-${version}.fr.win64-aarch64.zip", "pkg/Ghostery-${version}.fr.win64-aarch64.installer-stub.exe"],
        ]

        withMach('windows-arm') { settings ->
            for (installer in stubInstallersARM) {
                sh """
                   ./mach repackage installer \
                        -o ${env.WORKSPACE}/${installer[1]} \
                        --tag browser/installer/windows/stub.tag \
                        --setupexe pkg/installers/setup-stub.win64-aarch64.${installer[2]}.exe \
                        --sfx-stub other-licenses/7zstub/firefox/7zSD.Win32.sfx \
                        --use-upx
                """
            }
        }

        stash name: 'installers-windows', includes: 'pkg/*.exe'
    }
}

stage('Sign Windows installers') {
    node('browser-builder-windows') {
        unstash 'installers-windows'

        withCredentials([
            file(credentialsId: "7da7d2de-5a10-45e6-9ffd-4e49f83753a8", variable: 'WIN_CERT'),
            string(credentialsId: "33b3705c-1c2e-4462-9354-56a76bbb164c", variable: 'WIN_CERT_PASS'),
        ]) {
            bat "ci\\win_signer.bat pkg"
        }

        stash name: 'signed-installers-windows', includes: 'pkg/*.exe'
    }

    node('browser-builder') {
        unstash name: 'signed-installers-windows'

        archiveArtifacts artifacts: 'pkg/*.exe'
    }
}

stage('Unify Mac DMG') {
     node('browser-builder') {
        def armObjDir = SETTINGS['macos-arm'].objDir
        def x86ObjDir = SETTINGS['macos-x86'].objDir

        def dmgs = [
            ["mozilla-release/${armObjDir}/dist/Ghostery-${version}.en-US.mac.dmg", "mozilla-release/${x86ObjDir}/dist/Ghostery-${version}.en-US.mac.dmg", "pkg/Ghostery-${version}.en.dmg"],
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
        checkout scm

        if (params.Clean) {
            sh 'rm -rf mozilla-release'
            sh 'rm -rf pkg'
        }

        unstash 'mac-unified-dmg'
        unstash 'mac-entitlements'

        def packages = [
            ["pkg/Ghostery-${version}.en.dmg", "pkg/mac-en"],
            ["pkg/Ghostery-${version}.de.dmg", "pkg/mac-de"],
            ["pkg/Ghostery-${version}.fr.dmg", "pkg/mac-fr"],
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
                            sh "./ci/sign_mac.sh ${pkg[0]} ${pkg[1]}"
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
                    sh "./ci/notarize_mac_app.sh ${pkg[1]}"
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
            ["pkg/mac-en/Ghostery-${version}.en.tar.gz", "pkg/Ghostery-${version}.en.mac.dmg"],
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
        // prepare signmar environment
        withCredentials([
            [$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'user-agent-desktop-jenkins-cache', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'],
        ]) {
            sh 'aws s3 --region us-east-1 --recursive --quiet cp s3://user-agent-desktop-jenkins-cache/mar/ .'
            sh 'chmod a+x signmar'
        }

        def pwd = sh(returnStdout: true, script: 'pwd').trim()

        def packages = [
            ['x86_64', "pkg/linux/Ghostery-${version}.en.linux.tar.gz", "pkg/mars/Ghostery-${version}.en-US.linux-x86_64.complete.mar"],
            ['x86_64', "pkg/linux/Ghostery-${version}.de.linux.tar.gz", "pkg/mars/Ghostery-${version}.de.linux-x86_64.complete.mar"],
            ['x86_64', "pkg/linux/Ghostery-${version}.fr.linux.tar.gz", "pkg/mars/Ghostery-${version}.fr.linux-x86_64.complete.mar"],
            ['macos-x86_64-aarch64', "pkg/mac-en/Ghostery-${version}.en.tar.gz", "pkg/mars/Ghostery-${version}.en-US.mac.complete.mar"],
            ['macos-x86_64-aarch64', "pkg/mac-de/Ghostery-${version}.de.tar.gz", "pkg/mars/Ghostery-${version}.de.mac.complete.mar"],
            ['macos-x86_64-aarch64', "pkg/mac-fr/Ghostery-${version}.fr.tar.gz", "pkg/mars/Ghostery-${version}.fr.mac.complete.mar"],
            ['x86', "pkg/x86-en/Ghostery-${version}.en-US.win64.zip", "pkg/mars/Ghostery-${version}.en-US.win64.complete.mar"],
            ['x86', "pkg/x86-de/Ghostery-${version}.de.win64.zip", "pkg/mars/Ghostery-${version}.de.win64.complete.mar"],
            ['x86', "pkg/x86-fr/Ghostery-${version}.fr.win64.zip", "pkg/mars/Ghostery-${version}.fr.win64.complete.mar"],
            ['aarch64', "pkg/arm-en/Ghostery-${version}.en-US.win64-aarch64.zip", "pkg/mars/Ghostery-${version}.en-US.win64-aarch64.complete.mar"],
            ['aarch64', "pkg/arm-de/Ghostery-${version}.de.win64-aarch64.zip", "pkg/mars/Ghostery-${version}.de.win64-aarch64.complete.mar"],
            ['aarch64', , "pkg/arm-fr/Ghostery-${version}.fr.win64-aarch64.zip", "pkg/mars/Ghostery-${version}.fr.win64-aarch64.complete.mar"],
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

        archiveArtifacts artifacts: 'pkg/mars/*.mar'
    }
}

stage('Publish to github') {
    if (shouldRelease) {
        node('browser-builder') {
            docker.image('ua-build-base').inside() {
                def artifacts = [
                    "pkg/Ghostery-${version}.en.mac.dmg",
                    "pkg/Ghostery-${version}.de.mac.dmg",
                    "pkg/Ghostery-${version}.fr.mac.dmg",
                    "pkg/linux/Ghostery-${version}.en.linux.tar.gz",
                    "pkg/linux/Ghostery-${version}.de.linux.tar.gz",
                    "pkg/linux/Ghostery-${version}.fr.linux.tar.gz",
                    "pkg/Ghostery-${version}.en.win64.installer.exe",
                    "pkg/Ghostery-${version}.de.win64.installer.exe",
                    "pkg/Ghostery-${version}.fr.win64.installer.exe",
                    "pkg/Ghostery-${version}.en.win64-aarch64.installer.exe",
                    "pkg/Ghostery-${version}.de.win64-aarch64.installer.exe",
                    "pkg/Ghostery-${version}.fr.win64-aarch64.installer.exe",
                    "pkg/Ghostery-${version}.en.win64.installer-stub.exe",
                    "pkg/Ghostery-${version}.de.win64.installer-stub.exe",
                    "pkg/Ghostery-${version}.fr.win64.installer-stub.exe",
                    "pkg/Ghostery-${version}.en.win64-aarch64.installer-stub.exe",
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
                def artifacts = sh(returnStdout: true, script: 'find pkg/mars -type f -name *.mar').trim().split("\\r?\\n")

                withCredentials([usernamePassword(
                    credentialsId: 'dd3e97c0-5a9c-4ba9-bf34-f0071f6c3afa',
                    passwordVariable: 'AUTH0_M2M_CLIENT_SECRET',
                    usernameVariable: 'AUTH0_M2M_CLIENT_ID'
                )]) {
                    // create release on balrog
                    sh """
                        python3 ci/submitter.py release --tag "${params.ReleaseName}" \
                            --moz-root artifacts/mozilla-release \
                            --version ${version} \
                            --display-version "${displayVersion}" \
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
                                --version ${version} \
                                --display-version "${displayVersion}" \
                                --client-id "$AUTH0_M2M_CLIENT_ID" \
                                --client-secret "$AUTH0_M2M_CLIENT_SECRET"
                        """
                    }

                    if (params.Nightly) {
                        // copy this release to nightly
                        sh """
                            python3 ci/submitter.py nightly --tag "${params.ReleaseName}" \
                                --moz-root artifacts/mozilla-release \
                                --version ${version} \
                                --display-version "${displayVersion}" \
                                --client-id "$AUTH0_M2M_CLIENT_ID" \
                                --client-secret "$AUTH0_M2M_CLIENT_SECRET"
                        """
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

    withMach(platform) { settings ->
        sh 'rm -f `pwd`/MacOSX10.12.sdk; ln -s /builds/worker/fetches/MacOSX10.12.sdk `pwd`/MacOSX10.12.sdk'
        sh 'rm -f `pwd`/MacOSX11.0.sdk; ln -s /builds/worker/fetches/MacOSX11.0.sdk `pwd`/MacOSX11.0.sdk'

        sh './mach build'

        sh './mach package'

        if (settings.startsWith('win64')) {
            sh 'mkdir -p ${env.WORKSPACE}/pkg/installers'
            sh "cp ${settings.objDir}/browser/installer/windows/instgen/setup-stub.exe ${env.WORKSPACE}/pkg/installers/setup-stub.${settings.targetPlatform}.en.exe"
            sh "cp ${settings.objDir}/browser/installer/windows/instgen/setup.exe ${env.WORKSPACE}/pkg/installers/setup.${settings.targetPlatform}.en.exe"
        }

        for (String locale in LOCALES) {
            sh "./mach build installers-${locale}"

            if (settings.startsWith('win64')) {
                sh "cp ${settings.objDir}/browser/installer/windows/l10ngen/setup-stub.exe ${env.WORKSPACE}/pkg/installers/setup-stub.${settings.targetPlatform}.${locale}.exe"
                sh "cp ${settings.objDir}/browser/installer/windows/l10ngen/setup.exe ${env.WORKSPACE}/pkg/installers/setup.${settings.targetPlatform}.${locale}.exe"
            }
        }
    }

    stash name: "pkg-${platform}", includes: [
        "pkg/installers/*.exe", // setup.exe and setup-stub.exe
        "mozilla-release/${settings.objDir}/dist/Ghostery-*.zip",
        "mozilla-release/${settings.objDir}/dist/Ghostery-*.tar.gz",
        "mozilla-release/${settings.objDir}/dist/Ghostery-*.dmg",
    ].join(',')
}

def withMach(platform, task) {
    def settings = SETTINGS[platform]
    def image = docker.image("ua-build-${settings.name.toLowerCase()}")

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
