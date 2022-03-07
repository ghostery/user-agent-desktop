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

stage('Build') {
    node('browser-builder') {
        buildAndPackage('linux')
    }
}

// PIPELINE FIELDS

@Field
def triggeringCommitHash

@Field
def buildId = new Date().format('yyyyMMddHHmmss')

@Field
def SETTINGS = [
    'linux': [
        'name': 'linux',
        'dockerFile': 'Linux.dockerfile',
        'targetPlatform': 'linux',
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
            'MOZ_PKG_FORMAT=TGZ',
        ]) {
            sh 'rm -f `pwd`/MacOSX10.12.sdk; ln -s /builds/worker/fetches/MacOSX10.12.sdk `pwd`/MacOSX10.12.sdk'
            sh 'rm -f `pwd`/MacOSX11.0.sdk; ln -s /builds/worker/fetches/MacOSX11.0.sdk `pwd`/MacOSX11.0.sdk'

            sh "./fern.js config --print --force -l --platform ${settings.targetPlatform} --brand ghostery"

            dir('mozilla-release') {
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
