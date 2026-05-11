FROM node:22-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache bash gettext

COPY deploy/render/frontend.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/render/frontend-entrypoint.sh /frontend-entrypoint.sh
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chmod +x /frontend-entrypoint.sh

EXPOSE 10000

CMD ["/frontend-entrypoint.sh"]
