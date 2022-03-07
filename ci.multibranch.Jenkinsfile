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

// PIPELINE FIELDS

@Field
def triggeringCommitHash

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

    image.inside(
        '-v /mnt/vfat/vs2017_15.9.29/:/builds/worker/fetches/vs2017_15.9.29'
    ) {
        withEnv([
            "MACH_USE_SYSTEM_PYTHON=1",
            "MOZCONFIG=${env.WORKSPACE}/mozconfig",
            "MOZ_BUILD_DATE=${buildId}",
            "ACCEPTED_MAR_CHANNEL_IDS=firefox-ghostery-release",
            "MAR_CHANNEL_ID=firefox-ghostery-release",
            "MOZ_AUTOMATION=1",
            "MH_BRANCH=${env.BRANCH_NAME}",
            "MOZ_SOURCE_CHANGESET=${triggeringCommitHash}",
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

    if (settings.packageFormat == 'ZIP') {
        archiveArtifacts artifacts: "mozilla-release/${settings.objDir}/dist/Ghostery-*.zip"
    }
    if (settings.packageFormat == 'TGZ') {
        archiveArtifacts artifacts: "mozilla-release/${settings.objDir}/dist/Ghostery-*.tar.gz"
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
