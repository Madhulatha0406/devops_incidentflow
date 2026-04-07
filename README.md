# IncidentFlow – SLA-Based IT Service Management System

IncidentFlow is a production-ready MERN-style campus operations platform that combines three practical modules in one system:

- SLA-based IT incident management with escalation logic
- Smart campus bus tracking with live mock GPS updates and delay alerts
- AI-based answer correction suggestions for teachers

The project is structured for DevOps evaluation with Docker, Docker Compose, Jenkins CI, GitHub Actions CI, feature toggles, health checks, logging, and blue-green deployment support.

## Project Description

IncidentFlow is a containerized web application for managing infrastructure-related issues within a college campus. Students report problems, administrators assign technicians, and technicians resolve incidents within predefined SLA time limits. The platform also includes bus tracking simulation, AI-based answer correction support, automated testing, CI/CD, and runtime monitoring to reflect a real DevOps workflow.

## Architecture

- Frontend: React + Vite
- Backend: Node.js + Express + Socket.IO
- Database: MongoDB with Mongoose models
- Authentication: JWT-based role access control
- Testing: Jest + Supertest
- CI/CD: Jenkins pipeline plus GitHub Actions verification workflow
- Deployment: Docker Compose with blue-green proxy switching

## Objective

The main objective of this project is to demonstrate a complete DevOps lifecycle for a containerized MERN application:

- Implement role-based workflow for Student, Technician, and Admin
- Maintain automated test coverage above the 70-75% target
- Automate build, test, and delivery workflows
- Run services in isolated Docker containers
- Expose monitoring and operational visibility through logs and `/health`

## Presentation Guide

### Docker

- Docker is used to package the backend and frontend into reproducible containers.
- This removes machine-specific setup issues and ensures the same runtime behavior across development, testing, and deployment.

### Docker Compose

- Docker Compose orchestrates the complete stack: MongoDB, blue backend, green backend, blue frontend, green frontend, and reverse proxy.
- It also simulates blue-green deployment by keeping two colors available and allowing traffic switching through environment-driven proxy routing.

### Jenkins

- Jenkins is the implemented CI engine for this project.
- On every code change it installs dependencies, runs tests, checks coverage, builds Docker images, and pushes them to Docker Hub.
- The pipeline prints `GREEN TICK` when the full CI flow succeeds.

### GitHub Actions

- GitHub Actions now provides repository-native CI on push and pull request.
- The workflow installs dependencies, runs backend coverage tests, runs frontend tests, builds the frontend, and uploads coverage artifacts.
- If `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are configured as GitHub Secrets, it also builds and pushes backend and frontend images.

### Testing and Coverage

- Jest is used for unit testing.
- Supertest is used for backend API integration testing.
- The backend coverage gate stays above the required threshold, which proves the critical logic is verified automatically before deployment.

### Monitoring and Logging

- The `/health` endpoint exposes runtime status, active deployment color, database mode, and feature toggle state.
- Request logging and error logging provide operational visibility for debugging and monitoring.

### Security and Secrets

- JWT secures authenticated role-based access.
- Environment variables store secrets and deployment configuration.
- No secrets are hardcoded in the application source.

### Feature Toggles

- Runtime feature flags let the admin enable or disable incidents, bus tracking, and AI correction without changing code.
- This demonstrates controlled rollout and operational flexibility.

### Ansible and GitHub Actions

- Ansible is not used in this implementation.
- GitHub is used as the source repository, GitHub Actions provides repo-native CI, and Jenkins remains the richer pipeline for image delivery and deployment automation.

## Roles

- Student
  - Report incidents
  - Track own complaints
  - View bus status and delay alerts
  - Use AI answer review module
- Technician
  - View assigned incidents
  - Update incident status
  - Resolve tickets within SLA
- Admin
  - Create users
  - Assign technicians
  - Trigger escalation scans
  - Toggle modules on or off
  - View analytics dashboard

## Folder Structure

```text
incidentflow-plus/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- jobs/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- repositories/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   |-- tests/
|   |-- Dockerfile
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   `-- components/
|   |-- tests/
|   |-- Dockerfile
|   `-- package.json
|-- deploy/
|   |-- proxy/
|   `-- scripts/
|-- docker-compose.yml
|-- Jenkinsfile
|-- .env.example
`-- README.md
```

## Core Features

- SLA-based issue tracking with deadline generation by priority
- Escalation scan for breached incidents
- Role-based incident visibility and updates
- Live bus simulation with scheduled position updates
- Delay alert generation for late buses
- AI-based correction suggestions using a local heuristic scoring engine
- Feature toggles for `incidents`, `busTracking`, and `aiCorrection`
- Health endpoint at `/health`
- Structured request and error logging
- Blue-green deployment support with reverse proxy switching

## Default Demo Users

- Admin: `admin@incidentflow.local` / `Password123!`
- Technician: `tech@incidentflow.local` / `Password123!`
- Student: `student@incidentflow.local` / `Password123!`

## Environment Setup

1. Copy the root env file:

```bash
cp .env.example .env
cp deploy/.env.deploy.example deploy/.env.deploy
```

2. Update at minimum:

- `JWT_SECRET`
- `DOCKER_REGISTRY`
- `BACKEND_IMAGE`
- `FRONTEND_IMAGE`
- `OPENAI_API_KEY` if you later replace the local AI engine with a hosted provider

## Local Development

### Backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

If you want the frontend dev server to call the backend directly, set `VITE_API_BASE_URL=http://localhost:5000/api`.

## API Overview

### Public

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`

### Incident Management

- `GET /api/incidents`
- `POST /api/incidents`
- `PATCH /api/incidents/:id/assign`
- `PATCH /api/incidents/:id/status`

### Bus Tracking

- `GET /api/buses`

### AI Correction

- `POST /api/ai/correct`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/admin/feature-flags`
- `PATCH /api/admin/feature-flags/:name`
- `POST /api/admin/escalations/run`

## Testing

### Backend unit + integration tests

```bash
cd backend
npm run test:ci
```

This enforces:

- Jest test execution
- Supertest API integration tests
- Minimum 75% global coverage

### Frontend tests

```bash
cd frontend
npm run test:ci
```

### Root CI-style run

```bash
npm run test:ci
```

## Verified Results

- Backend tests: 52 passed
- Frontend tests: 5 passed
- Backend coverage: above 95% statements and above 78% branches
- CI feedback condition: passes and prints `GREEN TICK` in Jenkins

## Docker and Compose

The repository includes:

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `deploy/proxy/*` for active blue/green proxy routing

### Start the stack

```bash
docker compose --env-file .env --env-file deploy/.env.deploy up -d --build
```

### Services

- MongoDB
- `backend-blue`
- `backend-green`
- `frontend-blue`
- `frontend-green`
- `proxy`

Proxy traffic is routed to the active color using:

- `ACTIVE_BACKEND_HOST`
- `ACTIVE_FRONTEND_HOST`

## Blue-Green Deployment

### Linux/macOS

```bash
bash deploy/scripts/deploy-blue-green.sh
```

Optional explicit color:

```bash
bash deploy/scripts/deploy-blue-green.sh green
```

### Windows PowerShell

```powershell
.\deploy\scripts\deploy-blue-green.ps1
```

The deployment flow is:

1. Build and start the inactive color
2. Wait for backend health to report healthy
3. Update `deploy/.env.deploy`
4. Restart the proxy pointing to the new color
5. Keep the old color available during the switch to simulate zero downtime

## Jenkins CI/CD

`Jenkinsfile` includes:

1. Checkout from GitHub
2. Install backend and frontend dependencies
3. Run all tests
4. Enforce backend coverage threshold of 75%
5. Build Docker images
6. Push images to your Docker registry
7. Print `GREEN TICK` on success
8. Print failure guidance when the pipeline fails

### Jenkins prerequisites

- GitHub webhook configured to trigger Jenkins on push
- Jenkins credentials with ID `docker-registry-creds`
- Environment variables or global config for:
  - `DOCKER_REGISTRY`
  - `BACKEND_IMAGE`
  - `FRONTEND_IMAGE`

## GitHub Actions CI

The repository now includes [`.github/workflows/ci.yml`](.github/workflows/ci.yml), which:

1. Runs on push and pull request
2. Installs backend and frontend dependencies
3. Runs backend coverage tests and frontend tests
4. Builds the frontend bundle
5. Uploads backend coverage artifacts
6. Optionally builds and pushes Docker images on `main` or `master`

### GitHub Secrets

Set these repository secrets if you want image publishing from GitHub Actions:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## GitHub Integration Steps

1. Create a GitHub repository for this project.
2. Initialize git locally if needed:

```bash
git init
git add .
git commit -m "Initial IncidentFlow+ platform"
```

3. Add your remote:

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

4. In GitHub:
  - Add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` if you want GitHub Actions to publish images
  - Configure a webhook to Jenkins if you want Jenkins-triggered deployment
5. In Jenkins:
  - Create a Pipeline job using the repo
  - Point it at `Jenkinsfile`
  - Enable GitHub webhook trigger

## Production Notes

- No secrets are hardcoded
- Runtime config is environment-driven
- MongoDB models are present for production persistence
- In-memory repositories are used in tests for fast and deterministic verification
- Bus updates and escalation scans run as background jobs
- Logging is enabled for both successful requests and failures
- Feature flags can be changed at runtime through admin APIs

## Important Local Limitation

This machine did not have Docker installed during verification, so Docker image builds and `docker compose` runtime could not be executed locally here. The Dockerfiles, Compose stack, proxy assets, and deployment scripts are included and ready, but container verification must be run on a machine with Docker available.
