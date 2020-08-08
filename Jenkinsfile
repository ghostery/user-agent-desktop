
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

def configureWorkspace() {
    return {
        stage('checkout') {
            checkout scm
        }

        stage('prepare mozilla-release') {
            if (params.Reset) {
                sh 'rm -rf .cache'
            }
            FIREFOX_VERSION = readFile '.workspace'
            sh "./fern.js use ${FIREFOX_VERSION}"
            sh "./fern.js reset ${FIREFOX_VERSION}"
            sh './fern.js import-patches'
        }

        stage('prepare build env') {
            if (!fileExists('./build/makecab.exe')) {
                sh 'wget -O ./build/makecab.exe ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/makecab.exe '
            }
            if (!fileExists('./build/MacOSX10.11.sdk.tar.bz2')) {
                sh 'wget -O ./build/MacOSX10.11.sdk.tar.bz2 ftp://cliqznas.cliqz/cliqz-browser-build-artifacts/MacOSX10.11.sdk.tar.bz2'
            }
            sh 'cp ./mozilla-release/taskcluster/scripts/misc/fetch-content ./build/'
        }
    }
}

def buildDockerImage(imageName, dockerFile) {
    return stage('docker build') {
        docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')
        docker.build(imageName, "-f ${dockerFile} ./build")
    }
}

if (params.Linux64) {
    def name = 'Linux64'
    matrix[name] = {
        node('docker && !magrathea') {
            configureWorkspace()()

            linux_image = buildDockerImage('ua-build-linux', 'build/Linux.dockerfile')

            linux_image.inside('--env MOZCONFIG=/builds/worker/configs/linux.mozconfig') {
                dir('mozilla-release') {
                    stage("${name}: mach build") {
                        if (params.Clobber) {
                            sh './mach clobber'
                        }
                        sh './mach build'
                    }

                    stage("${name}: mach package") {
                        sh './mach package'
                    }

                    stage("${name}: publish artifacts") {
                        archiveArtifacts artifacts: 'obj-x86_64-pc-linux-gnu/dist/Ghostery-*'
                    }
                }
            }
        }
    }
}

if (params.Windows64) {
    def name = 'Windows64'
    matrix[name] = {
        // we have to run windows builds on magrathea because that is where the vssdk mount is.
        node('docker && magrathea') {
            configureWorkspace()()

            windows_image = buildDockerImage('ua-build-windows', 'build/Windows.dockerfile')

            windows_image.inside('--env MOZCONFIG=/builds/worker/configs/win64.mozconfig -v /mnt/vfat/vs2017_15.8.4/:/builds/worker/fetches/vs2017_15.8.4') {
                dir('mozilla-release') {
                    stage("${name}: mach build") {
                        if (params.Clobber) {
                            sh './mach clobber'
                        }
                        sh './mach build'
                    }

                    stage("${name}: mach package") {
                        sh './mach package'
                    }

                    stage("${name}: publish artifacts") {
                        archiveArtifacts artifacts: 'obj-x86_64-pc-mingw32/dist/install/**/*'
                    }
                }
            }
        }
    }
}

if (params.MacOSX64) {
    def name = 'MacOSX64'
    matrix[name] = {
        node('docker && !magrathea') {
            configureWorkspace()()

            mac_image = buildDockerImage('ua-build-mac', 'build/MacOSX.dockerfile')

            mac_image.inside('--env MOZCONFIG=/builds/worker/configs/macosx.mozconfig') {
                dir('mozilla-release') {
                    stage("${name}: mach build") {
                        sh 'ln -s /builds/worker/fetches/MacOSX10.11.sdk `pwd`/MacOSX10.11.sdk'
                        if (params.Clobber) {
                            sh './mach clobber'
                        }
                        sh './mach build'
                    }

                    stage("${name}: mach package") {
                        sh './mach package'
                    }

                    stage("${name}: publish artifacts") {
                        archiveArtifacts artifacts: 'obj-x86_64-apple-darwin/dist/Ghostery-*'
                    }
                }
            }
        }
    }
}

parallel matrix
