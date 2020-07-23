
node('docker') {
    stage('checkout') {
        checkout scm
    }

    stage('prepare mozilla-release') {
        sh './fern.sh use 78.0.1'
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

    linux_image = stage('docker build linux') {
        docker.build('ua-build-linux', '-f Linux.dockerfile ./build')
    }

    linux_image.inside("-v ${pwd}/mozilla-release:/builds/worker/workspace --env MOZCONFIG=/builds/worker/configs/linux.mozconfig") {
        stage('mach build') {
            sh './mach build'
        }
    }
}
