
properties([
    parameters([
        booleanParam(name: 'Clobber', defaultValue: false, description: 'run mach clobber'),
        booleanParam(name: 'Linux', defaultValue: true, description: ''),
        booleanParam(name: 'Windows', defaultValue: true, description: ''),
    ]),
])

node('docker') {
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
        if (!fileExists('./build/vs2017_15.8.4.zip')) {
            sh 'wget -O ./build/vs2017_15.8.4.zip ftp://cliqznas/cliqz-browser-build-artifacts/vs2017_15.8.4.zip'
            sh 'cd build && unzip vs2017_15.8.4'
        }
        sh 'cp ./mozilla-release/taskcluster/scripts/misc/fetch-content ./build/'
    }

    stage('docker build base') {
        docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')
    }

    if (params.Linux) {
        linux_image = stage('docker build') {
            docker.build("ua-build-linux", "-f build/Linux.dockerfile ./build")
        }

        linux_image.inside("--env MOZCONFIG=/builds/worker/configs/linux.mozconfig") {
            dir('mozilla-release') {
                stage('linux: mach build') {
                    sh 'ln -s `pwd`/mozilla-release /builds/worker/workspace'
                    if (params.Clobber) {
                        sh './mach clobber'
                    }
                    sh './mach build'
                }

                stage('mach package') {
                    sh './mach package'
                }

                stage('publish artifacts') {
                    archiveArtifacts artifacts: 'obj-x86_64-pc-linux-gnu/dist/firefox-*'
                }
            }
        }
    }

    if (params.Windows) {
        windows_image = stage('docker build') {
            docker.build("ua-build-windows", "-f build/Windows.dockerfile ./build")
        }

        windows_image.inside("--env MOZCONFIG=/builds/worker/configs/win64.mozconfig -v /mnt/vfat/vs2017_15.8.4/:/builds/worker/fetches/vs2017_15.8.4") {
            dir('mozilla-release') {
                stage('mach build') {
                    sh 'ln -s `pwd`/mozilla-release /builds/worker/workspace'
                    sh './mach build'
                }

                stage('mach package') {
                    sh './mach package'
                }

                stage('publish artifacts') {
                    archiveArtifacts artifacts: 'obj-x86_64-pc-linux-gnu/dist/firefox-*'
                }
            }
        }
    }
}
