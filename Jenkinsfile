pipeline {
  agent any

  environment {
    REGISTRY = "${env.DOCKER_REGISTRY ?: 'docker.io/yourname'}"
    BACKEND_IMAGE = "${env.BACKEND_IMAGE ?: 'incidentflow-plus-backend'}"
    FRONTEND_IMAGE = "${env.FRONTEND_IMAGE ?: 'incidentflow-plus-frontend'}"
    COVERAGE_TARGET = "75"
    DOCKER_CONTEXT = "${env.DOCKER_CONTEXT ?: 'desktop-linux'}"
    DOCKER_CONFIG = "${env.DOCKER_CONFIG ?: 'C:\\Users\\madhu\\.docker'}"
  }

  triggers {
    githubPush()
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        script {
          if (isUnix()) {
            sh 'cd backend && npm ci'
            sh 'cd frontend && npm ci'
          } else {
            bat 'cd backend && npm ci'
            bat 'cd frontend && npm ci'
          }
        }
      }
    }

    stage('Run Tests') {
      steps {
        script {
          if (isUnix()) {
            sh 'cd backend && npm run test:ci'
            sh 'cd frontend && npm run test:ci'
          } else {
            bat 'cd backend && npm run test:ci'
            bat 'cd frontend && npm run test:ci'
          }
        }
      }
    }

    stage('Build Frontend Bundle') {
      steps {
        script {
          if (isUnix()) {
            sh 'cd frontend && npm run build'
          } else {
            bat 'cd frontend && npm run build'
          }
        }
      }
    }

    stage('Check Docker Daemon') {
      steps {
        script {
          env.DOCKER_AVAILABLE = 'false'
          def dockerStatus = 1

          if (isUnix()) {
            dockerStatus = sh(script: 'docker version >/dev/null 2>&1', returnStatus: true)
          } else {
            try {
              def dockerVersion = bat(
                script: '@echo off\r\ndocker version --format "{{.Server.Version}}"',
                returnStdout: true
              ).trim()

              if (dockerVersion) {
                dockerStatus = 0
                echo "Detected Docker server version ${dockerVersion} through the active Docker context."
              }
            } catch (_ignored) {
              try {
                def desktopLinuxVersion = bat(
                  script: '@echo off\r\ndocker -H npipe:////./pipe/dockerDesktopLinuxEngine version --format "{{.Server.Version}}"',
                  returnStdout: true
                ).trim()

                if (desktopLinuxVersion) {
                  env.DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine'
                  dockerStatus = 0
                  echo "Connected to Docker Desktop through the desktop-linux engine pipe (${desktopLinuxVersion})."
                }
              } catch (_ignoredToo) {
                dockerStatus = 1
              }
            }
          }

          env.DOCKER_AVAILABLE = dockerStatus == 0 ? 'true' : 'false'

          if (env.DOCKER_AVAILABLE == 'true') {
            echo 'Docker daemon detected on the Jenkins agent. Image stages are enabled.'
          } else {
            echo 'Docker daemon is not available on this Jenkins agent. Skipping image build and push stages.'
          }
        }
      }
    }

    stage('Docker Diagnostics') {
      when {
        expression {
          env.DOCKER_AVAILABLE != 'true'
        }
      }
      steps {
        script {
          if (isUnix()) {
            sh '''
              set +e
              whoami || true
              echo "DOCKER_HOST=$DOCKER_HOST"
              echo "DOCKER_CONTEXT=$DOCKER_CONTEXT"
              echo "DOCKER_CONFIG=$DOCKER_CONFIG"
              which docker || true
              docker version || true
            '''
          } else {
            bat '''
@echo off
whoami
echo DOCKER_HOST=%DOCKER_HOST%
echo DOCKER_CONTEXT=%DOCKER_CONTEXT%
echo DOCKER_CONFIG=%DOCKER_CONFIG%
where docker
docker version
docker context ls
docker -H npipe:////./pipe/dockerDesktopLinuxEngine version
'''
          }
        }
      }
    }

    stage('Build Images') {
      when {
        expression {
          env.DOCKER_AVAILABLE == 'true'
        }
      }
      steps {
        script {
          if (isUnix()) {
            sh "docker build -t ${REGISTRY}/${BACKEND_IMAGE}:${env.BUILD_NUMBER} backend"
            sh "docker build -t ${REGISTRY}/${FRONTEND_IMAGE}:${env.BUILD_NUMBER} frontend"
          } else {
            bat "docker build -t %REGISTRY%/%BACKEND_IMAGE%:%BUILD_NUMBER% backend"
            bat "docker build -t %REGISTRY%/%FRONTEND_IMAGE%:%BUILD_NUMBER% frontend"
          }
        }
      }
    }

    stage('Push Images') {
      when {
        expression {
          env.DOCKER_AVAILABLE == 'true'
        }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          script {
            if (isUnix()) {
              sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
              sh "docker push ${REGISTRY}/${BACKEND_IMAGE}:${env.BUILD_NUMBER}"
              sh "docker push ${REGISTRY}/${FRONTEND_IMAGE}:${env.BUILD_NUMBER}"
            } else {
              bat '@echo off && echo %DOCKER_PASS%| docker login -u %DOCKER_USER% --password-stdin'
              bat 'docker push %REGISTRY%/%BACKEND_IMAGE%:%BUILD_NUMBER%'
              bat 'docker push %REGISTRY%/%FRONTEND_IMAGE%:%BUILD_NUMBER%'
            }
          }
        }
      }
    }

    stage('Feedback') {
      steps {
        script {
          if (env.DOCKER_AVAILABLE == 'true') {
            echo 'GREEN TICK'
          } else {
            echo 'GREEN TICK - test and build stages passed; Docker publish stages were skipped because the agent has no Docker daemon.'
          }
        }
      }
    }
  }

  post {
    failure {
      echo 'Build failed. Review Jenkins console logs, Jest coverage report, and Docker build output for clear remediation details.'
    }
    always {
      archiveArtifacts artifacts: 'backend/coverage/**', allowEmptyArchive: true
    }
  }
}
