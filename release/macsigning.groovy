// @Library('cliqz-shared-library@vagrant')

def mac_signing(name, artifactGlob) {
  return {
    node('gideon') {
      writeFile file: 'Vagrantfile', text: '''
      # -*- mode: ruby -*-
      # vi: set ft=ruby :

      Vagrant.configure("2") do |config|
          config.vm.box = "browser-ios-10.13.6"
          config.vm.synced_folder ".", "/vagrant", disabled: true
          config.vm.define "crossbuild" do |crossbuild|
              crossbuild.vm.hostname = "browser-f-mac-crossbuild"
              crossbuild.vm.network "public_network", :bridge => "en0: Ethernet 1", auto_config: false
              crossbuild.vm.boot_timeout = 900
              crossbuild.ssh.forward_agent = true
              crossbuild.vm.provider "virtualbox" do |v|
                  v.gui = false
                  v.name = "crossbuild"
                  v.memory = ENV["NODE_MEMORY"]
              end
              crossbuild.vm.provision "shell", privileged: true, run: "always", inline: <<-SHELL
                  npm install --unsafe-perm=true appdmg@0.5.2 -g
              SHELL
              crossbuild.vm.provision "shell", privileged: false, run: "always", inline: <<-SHELL
                  rm -f slave.jar
                  wget #{ENV['JENKINS_URL']}/jnlpJars/agent.jar
                  nohup java -jar agent.jar -jnlpUrl #{ENV['JENKINS_URL']}/computer/#{ENV['NODE_ID']}/slave-agent.jnlp -secret #{ENV["NODE_SECRET"]} &
              SHELL
          end
      end
      '''
      vagrant.inside(
          'Vagrantfile',
          '/jenkins',
          2, // CPU
          8000, // MEMORY
          7000, // VNCPORT
          false, // rebuild image
      ){ nodeId ->
        node(nodeId) {
          stage('checkout') {
              checkout scm
          }
          stage('unstash') {
              unstash "unpack-diskimage"
              unstash name
              sh 'rm -rf obj/'
              sh 'mkdir -p obj/dist'
          }
          stage('sign') {
              withCredentials([
              [$class: 'FileBinding', credentialsId: 'd9169b03-c7f5-4da2-bae3-56347ae1829c', variable: 'MAC_CERT'],
              [$class: 'StringBinding', credentialsId: 'd29da4e0-cf0a-41df-8446-44078bdca137', variable: 'MAC_CERT_PASS'],
              [$class: 'UsernamePasswordMultiBinding',
                  credentialsId: '840e974f-f733-4f02-809f-54dc68f5fa46',
                  passwordVariable: 'MAC_NOTARY_PASS',
                  usernameVariable: 'MAC_NOTARY_USER']
              ]) {
                  try {
                      // create temporary keychain and make it a default one
                      sh '''#!/bin/bash -l -x
                          security create-keychain -p cliqz cliqz
                          security list-keychains -s cliqz
                          security default-keychain -s cliqz
                          security unlock-keychain -p cliqz cliqz
                      '''

                      sh '''#!/bin/bash -l +x
                          security import $MAC_CERT -P $MAC_CERT_PASS -k cliqz -A
                          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k cliqz cliqz
                      '''
                      withEnv(["MAC_CERT_NAME=2UYYSSHVUH", "APP_NAME=Ghostery", "ARTIFACT_GLOB=${artifactGlob}"]){
                          sh "./release/sign_mac.sh"
                      }
                  } finally {
                      sh '''#!/bin/bash -l -x
                          security delete-keychain cliqz
                          security list-keychains -s login.keychain
                          security default-keychain -s login.keychain
                          true
                      '''
                  }
              }
          }
          stage('publish artifacts') {
              archiveArtifacts artifacts: "obj/dist/*"
          }
        }
      }
    }
  }
}

return this;
