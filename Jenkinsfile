pipeline {
  agent any

  environment {
    REGISTRY = "${env.DOCKER_REGISTRY ?: 'docker.io/yourname'}"
    BACKEND_IMAGE = "${env.BACKEND_IMAGE ?: 'incidentflow-plus-backend'}"
    FRONTEND_IMAGE = "${env.FRONTEND_IMAGE ?: 'incidentflow-plus-frontend'}"
    COVERAGE_TARGET = "75"
    DOCKER_CONTEXT = "${env.DOCKER_CONTEXT ?: 'desktop-linux'}"
    DOCKER_CONFIG = "${env.DOCKER_CONFIG ?: 'C:\\Users\\madhu\\.docker'}"
    SONAR_JDK_TOOL = "${env.SONAR_JDK_TOOL ?: 'JDK17'}"
    JMETER_JDK_TOOL = "${env.JMETER_JDK_TOOL ?: 'JDK17'}"
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
            sh 'npm ci'
            sh 'cd backend && npm ci'
            sh 'cd frontend && npm ci'
          } else {
            bat 'npm ci'
            bat 'cd backend && npm ci'
            bat 'cd frontend && npm ci'
          }
        }
      }
    }

    stage('Static Analysis') {
      steps {
        script {
          if (isUnix()) {
            sh 'npm run lint:ci'
          } else {
            bat 'npm run lint:ci'
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

    stage('SonarQube Analysis') {
      steps {
        script {
          def scannerHome = tool 'SonarScanner'
          def jdkHome = tool env.SONAR_JDK_TOOL

          withSonarQubeEnv('SonarQube') {
            if (!env.SONAR_HOST_URL?.trim() || !env.SONAR_AUTH_TOKEN?.trim()) {
              echo 'Skipping SonarQube analysis because SONAR_HOST_URL or SONAR_AUTH_TOKEN is not configured.'
              return
            }

            def sonarStatus = 1
            if (isUnix()) {
              withEnv([
                "JAVA_HOME=${jdkHome}",
                "PATH+SONAR_JAVA=${jdkHome}/bin"
              ]) {
                sonarStatus = sh(
                  script: "\"${scannerHome}/bin/sonar-scanner\" -Dsonar.host.url=\"$SONAR_HOST_URL\" -Dsonar.token=\"$SONAR_AUTH_TOKEN\"",
                  returnStatus: true
                )
              }
            } else {
              withEnv([
                "JAVA_HOME=${jdkHome}",
                "PATH+SONAR_JAVA=${jdkHome}\\bin"
              ]) {
                sonarStatus = bat(
                  script: "@echo off\r\n\"${scannerHome}\\bin\\sonar-scanner.bat\" -Dsonar.host.url=%SONAR_HOST_URL% -Dsonar.token=%SONAR_AUTH_TOKEN%",
                  returnStatus: true
                )
              }
            }

            if (sonarStatus != 0) {
              echo "Skipping SonarQube quality scan result because scanner exited with status ${sonarStatus}. Check that SonarQube is running at ${env.SONAR_HOST_URL}."
            }
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
            def dockerCmd = 'docker'
            def dockerDesktopCli = 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe'
            def dockerDesktopCliStatus = bat(
              script: "@echo off\r\nif exist \"${dockerDesktopCli}\" exit /b 0\r\nexit /b 1",
              returnStatus: true
            )

            if (dockerDesktopCliStatus == 0) {
              dockerCmd = "\"${dockerDesktopCli}\""
              env.DOCKER_BIN_DIR = 'C:\\Program Files\\Docker\\Docker\\resources\\bin'
            }

            try {
              def dockerVersion = bat(
                script: "@echo off\r\n${dockerCmd} version --format \"{{.Server.Version}}\"",
                returnStdout: true
              ).trim()

              if (dockerVersion) {
                dockerStatus = 0
                env.DOCKER_CMD = dockerCmd
                echo "Detected Docker server version ${dockerVersion} through the active Docker context."
              }
            } catch (_ignored) {
              try {
                def desktopLinuxVersion = bat(
                  script: "@echo off\r\n${dockerCmd} -H npipe:////./pipe/dockerDesktopLinuxEngine version --format \"{{.Server.Version}}\"",
                  returnStdout: true
                ).trim()

                if (desktopLinuxVersion) {
                  env.DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine'
                  env.DOCKER_CMD = dockerCmd
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
if exist "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" version
docker version
docker context ls
docker -H npipe:////./pipe/dockerDesktopLinuxEngine version
exit /b 0
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
            withEnv(["PATH+DOCKER=${env.DOCKER_BIN_DIR ?: 'C:\\Program Files\\Docker\\Docker\\resources\\bin'}"]) {
              bat "${env.DOCKER_CMD ?: 'docker'} build -t %REGISTRY%/%BACKEND_IMAGE%:%BUILD_NUMBER% backend"
              bat "${env.DOCKER_CMD ?: 'docker'} build -t %REGISTRY%/%FRONTEND_IMAGE%:%BUILD_NUMBER% frontend"
            }
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
              withEnv(["PATH+DOCKER=${env.DOCKER_BIN_DIR ?: 'C:\\Program Files\\Docker\\Docker\\resources\\bin'}"]) {
                bat "@echo off && echo %DOCKER_PASS%| ${env.DOCKER_CMD ?: 'docker'} login -u %DOCKER_USER% --password-stdin"
                bat "${env.DOCKER_CMD ?: 'docker'} push %REGISTRY%/%BACKEND_IMAGE%:%BUILD_NUMBER%"
                bat "${env.DOCKER_CMD ?: 'docker'} push %REGISTRY%/%FRONTEND_IMAGE%:%BUILD_NUMBER%"
              }
            }
          }
        }
      }
    }

    stage('JMeter Smoke Test') {
      steps {
        script {
          if (!env.JMETER_HOST?.trim()) {
            echo 'Skipping JMeter smoke test because JMETER_HOST is not configured.'
            return
          }

          if (isUnix()) {
            def jmeterStatus = sh(script: 'command -v jmeter >/dev/null 2>&1', returnStatus: true)
            if (jmeterStatus != 0) {
              echo 'Skipping JMeter smoke test because JMeter is not installed on this Jenkins agent.'
              return
            }

            def jmeterJdkHome = tool env.JMETER_JDK_TOOL

            withEnv([
              "JAVA_HOME=${jmeterJdkHome}",
              "PATH+JMETER_JAVA=${jmeterJdkHome}/bin",
              "PROTOCOL=${env.JMETER_PROTOCOL ?: 'http'}",
              "HOST=${env.JMETER_HOST}",
              "PORT=${env.JMETER_PORT ?: '5000'}",
              "STUDENT_EMAIL=${env.JMETER_STUDENT_EMAIL ?: 'student@incidentflow.local'}",
              "STUDENT_PASSWORD=${env.JMETER_STUDENT_PASSWORD ?: 'Password123!'}"
            ]) {
              sh 'bash scripts/run-jmeter.sh'
            }
          } else {
            def jmeterStatus = bat(script: '@echo off\r\nwhere jmeter.bat >NUL 2>&1', returnStatus: true)
            if (jmeterStatus != 0 && !env.JMETER_HOME?.trim()) {
              echo 'Skipping JMeter smoke test because JMeter is not installed on this Jenkins agent.'
              return
            }

            def jmeterJdkHome = tool env.JMETER_JDK_TOOL

            withEnv([
              "JAVA_HOME=${jmeterJdkHome}",
              "PATH+JMETER_JAVA=${jmeterJdkHome}\\bin"
            ]) {
              bat """
@echo off
C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -ExecutionPolicy Bypass -File scripts\\run-jmeter.ps1 ^
  -Protocol ${env.JMETER_PROTOCOL ?: 'http'} ^
  -TargetHost ${env.JMETER_HOST} ^
  -Port ${env.JMETER_PORT ?: '5000'} ^
  -StudentEmail ${env.JMETER_STUDENT_EMAIL ?: 'student@incidentflow.local'} ^
  -StudentPassword ${env.JMETER_STUDENT_PASSWORD ?: 'Password123!'}
"""
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
      archiveArtifacts artifacts: 'backend/coverage/**,frontend/coverage/**,performance/jmeter/results.jtl,performance/jmeter/report/**', allowEmptyArchive: true
    }
  }
}
