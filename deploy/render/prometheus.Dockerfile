FROM prom/prometheus:v2.54.1

USER root
COPY deploy/render/prometheus.rules.yml /etc/prometheus/rules.yml
COPY deploy/render/prometheus-entrypoint.sh /prometheus-entrypoint.sh

RUN chmod +x /prometheus-entrypoint.sh

USER nobody

ENTRYPOINT ["/prometheus-entrypoint.sh"]
