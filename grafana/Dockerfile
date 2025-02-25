FROM grafana/grafana:latest

USER root
RUN apk update && apk add --no-cache openssl

RUN mkdir -p /etc/grafana/ssl

RUN openssl req -x509 -nodes -days 365 \
    -keyout /etc/grafana/ssl/grafana.key \
    -out /etc/grafana/ssl/grafana.crt \
    -subj "/C=DE/ST=Baden-württemberg/L=Heilbronn/O=42Heilbronn/OU=Heilb/CN=localhost/UID=grafana"

COPY ./grafana.ini /etc/grafana/grafana.ini


RUN chown -R grafana:root /etc/grafana
USER grafana


