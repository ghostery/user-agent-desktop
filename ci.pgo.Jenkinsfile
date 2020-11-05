
def buildmatrix = [:]
def buildParams = [Reset: false]
def buildId = new Date().format('yyyyMMddHHmmss')
def helpers

node('master') {
    checkout scm

    helpers = load "ci/build-helpers.groovy"
}


// buildmatrix['Linux64'] = {
//   node('docker && !magrathea') {
//     helpers.build('Linux64', 'Linux.dockerfile', 'linux', 'obj-x86_64-pc-linux-gnu', buildParams, ['PGO_PROFILE_GENERATE=1'])
//     stash name: 'linux', includes: ["mozilla-release/obj-x86_64-pc-linux-gnu/dist/Ghostery-*.tar.bz2"]
//   }
// }

buildmatrix['MacOSX64'] = {
  def name = 'MacOSX64'
  def objDir = 'obj-x86_64-apple-darwin'

  node('docker && !magrathea') {
    helpers.build(name, 'MacOSX.dockerfile', 'macosx', objDir, params, buildId, ['PGO_PROFILE_GENERATE=1'])()
    stash name: name, includes: "mozilla-release/${objDir}/dist/Ghostery-*.dmg"
  }

  node('gideon') {
    stage('prepare workspace') {
      checkout scm
      sh '''#!/bin/bash
        set -x -e
        npm ci
        rm -rf mozilla-release
        ./fern.js use --ipfs-gateway=http://kria.cliqz:8080
      '''
    }

    stage('fetch toolchain') {
      sh '''#!/bin/bash
        set -x -e
        wget -O clang.tar.zst 'http://kria.cliqz:8080/ipfs/Qme6cUwu2zm5AiGGxUVP7yvspLaDkAEXszYox8VywiSPBB'
        zstd -d clang.tar.zst
        tar -xf clang.tar
        rm clang.tar*
      '''
    }

    stage('setup mach environment') {
      dir('mozilla-release') {
        sh './mach create-mach-environment'
      }
    }

    stage('run profileserver') {
      unstash name
      dir('mozilla-release') {
        sh '''#!/bin/bash
          set -x -e
          export JARLOG_FILE="en-US.log"
          export LLVM_PROFDATA=$WORKSPACE/clang/bin/llvm-profdata
          ./mach python python/mozbuild/mozbuild/action/install.py ./obj-x86_64-apple-darwin/dist/Ghostery-*.dmg /tmp/
          ./mach python build/pgo/profileserver.py --binary /tmp/*.app/Contents/MacOS/Ghostery
        '''
        sh "tar -Jcvf ./${name}_profdata.tar.xz merged.profdata en-US.log"
      }
      archiveArtifacts artifacts: "mozilla-release/${name}_profdata.tar.xz"
    }
  }
}

parallel buildmatrix