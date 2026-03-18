#!/bin/sh
set -eu

envsubst '${ACTIVE_BACKEND_HOST} ${ACTIVE_FRONTEND_HOST}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

nginx -g 'daemon off;'
