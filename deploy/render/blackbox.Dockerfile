FROM prom/blackbox-exporter:v0.27.0

COPY deploy/render/blackbox.yml /etc/blackbox_exporter/config.yml

CMD ["--config.file=/etc/blackbox_exporter/config.yml", "--web.listen-address=:10000"]
