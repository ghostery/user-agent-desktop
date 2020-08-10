
properties([
    parameters([
        booleanParam(name: 'Reset', defaultValue: false, description: 'clean workspace files'),
        booleanParam(name: 'Clobber', defaultValue: false, description: 'run mach clobber'),
        booleanParam(name: 'Linux64', defaultValue: true, description: ''),
        booleanParam(name: 'Windows64', defaultValue: true, description: ''),
        booleanParam(name: 'MacOSX64', defaultValue: true, description: ''),
    ]),
])

def matrix = [:]

def build(name, dockerFile, mozconfig, artifactGlob) {
    return {
        stage('checkout') {
            checkout scm
        }

        stage('prepare') {
            if (!fileExists('./build/makecab.exe')) {
                sh 'wget -O ./build/makecab.exe ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/makecab.exe '
            }
            if (!fileExists('./build/MacOSX10.11.sdk.tar.bz2')) {
                sh 'wget -O ./build/MacOSX10.11.sdk.tar.bz2 ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/MacOSX10.11.sdk.tar.bz2'
            }
        }

        image = stage('docker build base') {
            docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')
            docker.build("ua-build-${name.toLowerCase()}", "-f build/${dockerFile} ./build")
        }

        image.inside("--env MOZCONFIG=/builds/worker/configs/${mozconfig} -v /mnt/vfat/vs2017_15.8.4/:/builds/worker/fetches/vs2017_15.8.4") {
            stage('prepare mozilla-release') {
                sh 'npm ci'
                if (params.Reset) {
                    sh 'rm -rf .cache'
                }
                sh "./fern.js use"
                sh "./fern.js reset"
                sh './fern.js import-patches'
            }

            dir('mozilla-release') {
                stage("${name}: mach build") {
                    sh 'rm -f `pwd`/MacOSX10.11.sdk; ln -s /builds/worker/fetches/MacOSX10.11.sdk `pwd`/MacOSX10.11.sdk'
                    if (params.Clobber) {
                        sh './mach clobber'
                    }
                    sh './mach build'
                }

                stage("${name}: mach package") {
                    sh './mach package'
                }

                stage("${name}: publish artifacts") {
                    archiveArtifacts artifacts: artifactGlob
                }
            }
        }
    }
}

if (params.Linux64) {
    def name = 'Linux64'
    matrix[name] = {
        node('docker && !magrathea') {
            build(name, 'Linux.dockerfile', 'linux.mozconfig', 'obj-x86_64-pc-linux-gnu/dist/Ghostery-*')()
        }
    }
}

if (params.Windows64) {
    def name = 'Windows64'
    matrix[name] = {
        // we have to run windows builds on magrathea because that is where the vssdk mount is.
        node('docker && magrathea') {
            build(name, 'Windows.dockerfile', 'win64.mozconfig', 'obj-x86_64-pc-mingw32/dist/install/**/*')()
        }
    }
}

if (params.MacOSX64) {
    def name = 'MacOSX64'
    matrix[name] = {
        node('docker && !magrathea') {
            build(name, 'MacOSX.dockerfile', 'macosx.mozconfig', 'obj-x86_64-apple-darwin/dist/Ghostery-*')()
        }
    }
}

parallel matrix
