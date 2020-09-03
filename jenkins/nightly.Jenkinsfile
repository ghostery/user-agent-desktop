node('docker') {
    checkout scm

    def VERSION_NAME = sh(returnStdout: true, script: 'date +%Y-%m-%d').trim() + '.' + env.BUILD_NUMBER
    sh "git tag $VERSION_NAME || true"

    withCredentials([
        usernamePassword(
            credentialsId: 'd60e38ae-4a5a-4eeb-ab64-32fd1fad4a28',
            passwordVariable: 'GITHUB_TOKEN',
            usernameVariable: 'GITHUB_USERNAME'
        )
    ]) {
       sh "git push https://$GITHUB_TOKEN@github.com/human-web/user-agent-desktop.git --tags"
    }

    docker.image('golang').inside("-u root") {
        sh 'go get github.com/human-web/github-release'

        withCredentials([
            usernamePassword(
                credentialsId: 'd60e38ae-4a5a-4eeb-ab64-32fd1fad4a28',
                passwordVariable: 'GITHUB_TOKEN',
                usernameVariable: 'GITHUB_USERNAME'
            )
        ]) {
            sh """
                github-release release \
                  --user human-web \
                  --repo user-agent-desktop \
                  --tag $VERSION_NAME \
                  --name $VERSION_NAME \
                  --pre-release
            """
        }
    }

    build job: 'user-agent/desktop/nightly', parameters: [
        booleanParam(name: 'Reset', value: false),
        booleanParam(name: 'Clobber', value: false),
        booleanParam(name: 'ReleaseName', value: VERSION_NAME),
        booleanParam(name: 'Linux64', value: true),
        booleanParam(name: 'Windows64', value: false),
        booleanParam(name: 'MacOSX64', value: false),
    ], propagate: false, wait: false
}
