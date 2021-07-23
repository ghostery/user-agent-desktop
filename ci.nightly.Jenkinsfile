def VERSION_NAME
def helpers
def tagExists = false

node("master") {
    VERSION_NAME = sh(returnStdout: true, script: 'date +%Y-%m-%d').trim()

    checkout scm

    tagExists = sh(returnStdout: true, script: 'git tag --points-at HEAD').trim().length() > 0

    if (!tagExists) {
        helpers = load "ci/build-helpers.groovy"

        sh "git tag $VERSION_NAME || true"

        withCredentials([
            usernamePassword(
                credentialsId: 'd60e38ae-4a5a-4eeb-ab64-32fd1fad4a28',
                passwordVariable: 'GITHUB_TOKEN',
                usernameVariable: 'GITHUB_USERNAME'
            )
        ]) {
            sh "git push https://$GITHUB_TOKEN@github.com/ghostery/user-agent-desktop.git $VERSION_NAME"
        }
    }
}

if (!tagExists) {
    node("docker") {
        helpers.withGithubRelease() {
            sh """
                github-release release \
                    --user ghostery \
                    --repo user-agent-desktop \
                    --tag $VERSION_NAME \
                    --name $VERSION_NAME \
                    --pre-release
            """
        }
    }

    build job: 'user-agent/desktop/main', parameters: [
        booleanParam(name: 'Reset', value: true),
        booleanParam(name: 'Clobber', value: false),
        string(name: 'ReleaseName', value: VERSION_NAME),
        booleanParam(name: 'Linux64', value: true),
        booleanParam(name: 'Windows64', value: true),
        booleanParam(name: 'MacOSX64', value: true),
        booleanParam(name: 'MacOSARM', value: true),
        booleanParam(name: 'WindowsARM', value: true),
        booleanParam(name: 'Nightly', value: true),
        booleanParam(name: 'PGO',  value: true),
        string(name: 'Locales', value: 'de,fr'), //,es-ES,hu,it,ja,ko,nl,pl,pt-BR,ru,zh-CN,zh-TW'),
    ], propagate: false, wait: false
}
