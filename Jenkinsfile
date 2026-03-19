pipeline {
  agent any

  environment {
    REGISTRY = "${env.DOCKER_REGISTRY ?: 'docker.io/yourname'}"
    BACKEND_IMAGE = "${env.BACKEND_IMAGE ?: 'incidentflow-plus-backend'}"
    FRONTEND_IMAGE = "${env.FRONTEND_IMAGE ?: 'incidentflow-plus-frontend'}"
    COVERAGE_TARGET = "75"
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

    stage('Build Images') {
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
        echo 'GREEN TICK'
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
