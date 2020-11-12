properties([
    parameters([
      string(name: 'from', defaultValue: '', description: 'Release to update from'),
      string(name: 'to', defaultValue: '', description: 'Release to update to'),
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
            npm ci
            ./fern.js use --ipfs-gateway=http://kria.cliqz:8080
          '''
        }

        stage('build partials') {
          withCredentials([usernamePassword(
              credentialsId: 'dd3e97c0-5a9c-4ba9-bf34-f0071f6c3afa',
              passwordVariable: 'AUTH0_M2M_CLIENT_SECRET',
              usernameVariable: 'AUTH0_M2M_CLIENT_ID'
          )]) {
              sh """
                  python3 ci/generate_partials.py \
                    --old ${params.from} \
                    --to ${params.to} \
                    --client-id "$AUTH0_M2M_CLIENT_ID" \
                    --client-secret "$AUTH0_M2M_CLIENT_SECRET"
              """
              archiveArtifacts artifacts: "*.mar"
          }
        }
    }
    stage('upload to github') {
        helpers.withGithubRelease() {

            unarchive
            sh 'ls -la ./'

            def artifacts = sh(returnStdout: true, script: 'find artifacts -type f').trim().split("\\r?\\n")
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
}
