#!/bin/sh
set -eu

cat > /etc/prometheus/prometheus.yml <<EOF
global:
  scrape_interval: 30s
  evaluation_interval: 30s

rule_files:
  - /etc/prometheus/rules.yml

scrape_configs:
  - job_name: incidentflow-backend
    scheme: https
    metrics_path: /metrics
    static_configs:
      - targets:
          - ${BACKEND_PUBLIC_HOST}:443

  - job_name: incidentflow-http-probes
    scheme: https
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - ${BACKEND_PUBLIC_URL}/health
          - ${FRONTEND_PUBLIC_URL}/health
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: ${BLACKBOX_PUBLIC_HOST}:443

  - job_name: incidentflow-tcp-probes
    scheme: https
    metrics_path: /probe
    params:
      module: [tcp_connect]
    static_configs:
      - targets:
          - ${BACKEND_PUBLIC_HOST}:443
          - ${FRONTEND_PUBLIC_HOST}:443
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: ${BLACKBOX_PUBLIC_HOST}:443
EOF

exec /bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --web.listen-address=:10000 \
  --web.enable-lifecycle
