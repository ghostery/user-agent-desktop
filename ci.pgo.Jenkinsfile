
def buildmatrix = [:]
def buildParams = [Reset: true]
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
  // node('docker && !magrathea') {
  //   helpers.build(name, 'MacOSX.dockerfile', 'macosx', objDir, params, buildId, ['PGO_PROFILE_GENERATE=1'])
  //   stash name: 'mac', includes: ["mozilla-release/obj-x86_64-pc-linux-gnu/dist/Ghostery-*.dmg"]
  // }
  node('gideon') {
    checkout scm
    sh '''#!/bin/bash
      set -x
      set -e
      npm ci
      rm -rf mozilla-release
      ./fern.js use --ipfs-gateway=http://kria.cliqz:8080
    '''
  }
}

parallel buildmatrix