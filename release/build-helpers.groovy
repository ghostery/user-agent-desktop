import jenkins.model.*
import hudson.model.*
import hudson.slaves.*

@NonCPS
def createNode(nodeId, jenkinsFolderPath) {
    def launcher = new JNLPLauncher()
    def node = new DumbSlave(
        nodeId,
        jenkinsFolderPath,
        launcher
    )
    Jenkins.instance.addNode(node)
}

@NonCPS
def removeNode(nodeId) {
    def allNodes = Jenkins.getInstance().getNodes()
    for (int i =0; i < allNodes.size(); i++) {
        Slave node = allNodes[i]

        if (node.name.toString() == nodeId) {
            Jenkins.getInstance().removeNode(node)
            return
        }
    }
}

@NonCPS
def getNodeSecret(nodeId) {
    return jenkins.slaves.JnlpSlaveAgentProtocol.SLAVE_SECRET.mac(nodeId)
}

def withVagrant(String vagrantFilePath, String jenkinsFolderPath, Integer cpu, Integer memory, Integer vnc_port, Boolean rebuild, Closure body) {
    def nodeId = "${env.BUILD_TAG}"
    createNode(nodeId, jenkinsFolderPath)

    try {
        def nodeSecret = getNodeSecret(nodeId)

        withEnv([
            "VAGRANT_VAGRANTFILE=${vagrantFilePath}",
            "NODE_CPU_COUNT=${cpu}",
            "NODE_MEMORY=${memory}",
            "NODE_VNC_PORT=${vnc_port}",
            "NODE_SECRET=${nodeSecret}",
            "NODE_ID=${nodeId}",
            ]) {

            sh 'vagrant halt --force'
            if (rebuild) {
              sh 'vagrant destroy --force'
            }
            sh  'vagrant up'
        }

        body(nodeId)
    } finally {
        removeNode(nodeId)
        withEnv(["VAGRANT_VAGRANTFILE=${vagrantFilePath}"]) {
            sh 'vagrant halt --force'
        }
    }
}

return this