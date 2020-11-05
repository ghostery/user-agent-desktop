
def buildmatrix = [:]
properties([
    parameters([
        booleanParam(name: 'Linux64', defaultValue: false, description: ''),
        booleanParam(name: 'Windows64', defaultValue: true, description: ''),
        booleanParam(name: 'MacOSX64', defaultValue: true, description: ''),
    ]),
])

def buildParams = [Reset: true]
def buildId = new Date().format('yyyyMMddHHmmss')
def helpers

node('master') {
    checkout scm

    helpers = load "ci/build-helpers.groovy"
}

if (params.Linux64) {
  def name = 'Linux64'
  def objDir = 'obj-x86_64-pc-linux-gnu'

  buildmatrix[name] = {
    node('docker && !magrathea') {
      helpers.build(name, 'Linux.dockerfile', 'linux', objDir, buildParams, buildId, ['PGO_PROFILE_GENERATE=1'])()
      stash name: name, includes: "mozilla-release/${objDir}/dist/Ghostery-*.tar.bz2"
    }
  }
}

if (params.Windows64) {
  def name = 'Windows64'
  def objDir = 'obj-x86_64-pc-mingw32'

  buildmatrix[name] = {
    node('docker && magrathea') {
      helpers.build(name, 'Windows.dockerfile', 'win64', objDir, buildParams, buildId, ['PGO_PROFILE_GENERATE=1'])()
      stash name: name, includes: "mozilla-release/${objDir}/dist/*.win64.zip"
    }

    stage('start windows vm') {
      node('master') {
        checkout scm

        helpers.withVagrant("ci/win.Vagrantfile", "c:\\jenkins", 4, 4000, 7010, false) { nodeId ->
          node(nodeId) {
            stage('run profileserver') {
              checkout scm
              bat script: '''
                SET BUILD_SHELL=c:\\mozilla-build\\start-shell.bat
                ECHO cd %CD% ^^^&^^^& bash ./ci/profileserver_win.sh | call %BUILD_SHELL%
              '''
            }
          }
        }
      }
    }
  }
}

if (params.MacOSX64) {
  def name = 'MacOSX64'
  def objDir = 'obj-x86_64-apple-darwin'

  buildmatrix[name] = {
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
          rm -rf /tmp/*.app
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
          sh "mkdir -p $WORKSPACE/${name}/"
          sh "tar -Jcvf $WORKSPACE/${name}/profdata.tar.xz merged.profdata en-US.log"
        }
        archiveArtifacts artifacts: "${name}/profdata.tar.xz"
      }
    }
  }
}

parallel buildmatrix