properties([
    parameters([
      string(name: 'from', defaultValue: '', description: 'Release to update from'),
      string(name: 'to', defaultValue: '', description: 'Release to update to'),
      booleanParam(name: 'nightly', defaultValue: true, description: 'Is this a nightly update'),
    ]),
])

node('docker && magrathea') {
    image = stage('docker build') {
      checkout scm
      docker.build('ua-build-base', '-f build/Base.dockerfile ./build/ --build-arg user=`whoami` --build-arg UID=`id -u` --build-arg GID=`id -g`')
    }

    def helpers = load "ci/build-helpers.groovy"

    image.inside('--dns 1.1.1.1') {
        stage('prepare mozilla-release') {
          sh '''
            set -ex
            rm -rf *.mar
            rm -rf dist
            mkdir -p dist
            npm ci
            ./fern.js use
          '''
        }

        stage('build partials') {
          withCredentials([usernamePassword(
              credentialsId: 'dd3e97c0-5a9c-4ba9-bf34-f0071f6c3afa',
              passwordVariable: 'AUTH0_M2M_CLIENT_SECRET',
              usernameVariable: 'AUTH0_M2M_CLIENT_ID'
          )]) {
              sh """
                  python3 ci/partials.py generate \
                    --old ${params.from} \
                    --to ${params.to} \
                    --client-id "$AUTH0_M2M_CLIENT_ID" \
                    --client-secret "$AUTH0_M2M_CLIENT_SECRET" \
                    --mar-dir ./dist/ \
                    ${params.nightly ? '--nightly' : ''}
              """
          }
        }
    }

    image.inside() {
        stage('sign mars') {
            helpers.signmar()
        }
    }

    stage('upload to github') {
        helpers.withGithubRelease() {
            def artifacts = sh(returnStdout: true, script: 'ls dist/*.mar').trim().split("\\r?\\n")
            for(String artifactPath in artifacts) {
                def artifactName = artifactPath.split('/').last()
                sh """
                    github-release upload \
                        --user ghostery \
                        --repo user-agent-desktop \
                        --tag "${params.to}" \
                        --name "${artifactName}" \
                        --file "${artifactPath}"
                """
            }
        }
    }

    image.inside('--dns 1.1.1.1') {
        stage('update balrog') {
          withCredentials([usernamePassword(
              credentialsId: 'dd3e97c0-5a9c-4ba9-bf34-f0071f6c3afa',
              passwordVariable: 'AUTH0_M2M_CLIENT_SECRET',
              usernameVariable: 'AUTH0_M2M_CLIENT_ID'
          )]) {
              sh """
                  python3 ci/partials.py publish \
                    --old ${params.from} \
                    --to ${params.to} \
                    --client-id "$AUTH0_M2M_CLIENT_ID" \
                    --client-secret "$AUTH0_M2M_CLIENT_SECRET" \
                    --mar-dir ./dist/
              """
          }
        }
    }

}

