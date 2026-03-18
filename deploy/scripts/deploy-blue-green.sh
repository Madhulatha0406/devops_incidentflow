#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-deploy/.env.deploy}"

if [[ ! -f "${DEPLOY_ENV_FILE}" ]]; then
  cat > "${DEPLOY_ENV_FILE}" <<EOF
ACTIVE_COLOR=blue
ACTIVE_BACKEND_HOST=backend-blue
ACTIVE_FRONTEND_HOST=frontend-blue
EOF
fi

source "${DEPLOY_ENV_FILE}"

current_color="${ACTIVE_COLOR}"
target_color="${1:-}"

if [[ -z "${target_color}" ]]; then
  if [[ "${current_color}" == "blue" ]]; then
    target_color="green"
  else
    target_color="blue"
  fi
fi

echo "Deploying ${target_color} stack"
docker compose --env-file .env --env-file "${DEPLOY_ENV_FILE}" up -d --build "backend-${target_color}" "frontend-${target_color}"

backend_container="incidentflow-backend-${target_color}"
echo "Waiting for ${backend_container} health check"
until [[ "$(docker inspect --format='{{.State.Health.Status}}' "${backend_container}")" == "healthy" ]]; do
  sleep 5
done

cat > "${DEPLOY_ENV_FILE}" <<EOF
ACTIVE_COLOR=${target_color}
ACTIVE_BACKEND_HOST=backend-${target_color}
ACTIVE_FRONTEND_HOST=frontend-${target_color}
EOF

echo "Switching proxy to ${target_color}"
docker compose --env-file .env --env-file "${DEPLOY_ENV_FILE}" up -d proxy

echo "Deployment complete. Active color: ${target_color}"
