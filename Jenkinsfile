
properties([
    parameters([
        booleanParam(name: 'Clobber', defaultValue: false, description: 'run mach clobber'),
        booleanParam(name: 'Linux64', defaultValue: true, description: ''),
        booleanParam(name: 'Windows64', defaultValue: true, description: ''),
    ]),
])

def matrix = [:]

def configureWorkspace() {
    return {
        stage('checkout') {
            checkout scm
        }

        stage('prepare mozilla-release') {
            FIREFOX_VERSION = readFile '.workspace'
            sh "./fern.sh use ${FIREFOX_VERSION}"
            sh "./fern.sh reset ${FIREFOX_VERSION}"
            sh './fern.sh import-patches'
        }

        stage('prepare build env') {
            if (!fileExists('./build/makecab.exe')) {
                sh 'wget -O ./build/makecab.exe ftp://cliqznas/cliqz-browser-build-artifacts/makecab.exe '
            }
            sh 'cp ./mozilla-release/taskcluster/scripts/misc/fetch-content ./build/'
        }
    }
}

if (params.Linux64) {
    def name = 'Linux64'
    matrix[name] = {
        node('docker') {
            currentBuild.description = name
            configureWorkspace()()

            linux_image = stage('docker build') {
                docker.build('ua-build-base:debian9', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g` --build-arg DOCKER_BASE_IMAGE=debian:9')
                docker.build("ua-build-linux", "-f build/Linux.dockerfile ./build")
            }

            linux_image.inside("--env MOZCONFIG=/builds/worker/configs/linux.mozconfig") {
                dir('mozilla-release') {
                    stage("${name}: mach build") {
                        sh 'ln -s `pwd`/mozilla-release /builds/worker/workspace'
                        if (params.Clobber) {
                            sh './mach clobber'
                        }
                        sh './mach build'
                    }

                    stage("${name}: mach package") {
                        sh './mach package'
                    }

                    stage("${name}: publish artifacts") {
                        archiveArtifacts artifacts: 'obj-x86_64-pc-linux-gnu/dist/firefox-*'
                    }
                }
            }
        }
    }
}

if (params.Windows64) {
    def name = 'Windows64'
    matrix[name] = {
        node('docker') {
            currentBuild.description = name
            configureWorkspace()()

            windows_image = stage('docker build') {
                docker.build('ua-build-base:debian10', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g` --build-arg DOCKER_BASE_IMAGE=debian:10')
                docker.build("ua-build-windows", "-f build/Windows.dockerfile ./build")
            }

            windows_image.inside("--env MOZCONFIG=/builds/worker/configs/win64.mozconfig -v /mnt/vfat/vs2017_15.8.4/:/builds/worker/fetches/vs2017_15.8.4") {
                dir('mozilla-release') {
                    stage("${name}: mach build") {
                        sh 'ln -s `pwd`/mozilla-release /builds/worker/workspace'
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

parallel matrix
