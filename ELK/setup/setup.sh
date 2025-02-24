#!/bin/bash

if [ -z "${ELASTIC_PASSWORD}" ]; then
    echo "ELASTIC_PASSWORD NOT FOUND!"
    exit 1
fi

if [ -z "${KIBANA_PASSWORD}" ]; then
    echo "KIBANA_PASSWORD NOT FOUND!"
    exit 1
fi

if [ ! -f config/certs/ca.zip ]; then
    echo "Creating CA"
    bin/elasticsearch-certutil ca --silent --pem -out config/certs/ca.zip
    unzip config/certs/ca.zip -d config/certs
fi

if [ ! -f config/certs/certs.zip ]; then
    echo "Creating certs"
    bin/elasticsearch-certutil cert --silent --pem -out config/certs/certs.zip --in \
      config/certs/instances.yml --ca-cert config/certs/ca/ca.crt --ca-key config/certs/ca/ca.key
    unzip config/certs/certs.zip -d config/certs
fi

echo "file permissions"

chown -R root:root config/certs
find config/certs -type d -exec chmod 750 {} \;
find config/certs -type f -exec chmod 640 {} \;

echo "Waiting for Elasticsearch"
until curl -s --cacert config/certs/ca/ca.crt https://elasticsearch:9200 \
  | grep -q "missing authentication credentials"; do sleep 5; done

echo "Kiabana password"
until curl -s \
  -X POST https://elasticsearch:9200/_security/user/kibana_system/_password \
  --cacert config/certs/ca/ca.crt \
  -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"${KIBANA_PASSWORD}\"}" \
  | grep -q "^{}"; do sleep 5; done

echo "Waiting Kibana"
until curl -s -k https://kibana:5601/api/status | grep -q '"status":{"overall":{"level":"available"'; do sleep 5; done

echo "Importing kibana Dashboard..."
until curl -s -k \
    -X POST "https://kibana:5601/api/saved_objects/_import" \
    -u "elastic:${KIBANA_PASSWORD}" \
    -H "kbn-xsrf: true" \
    -H "Content-Type: multipart/form-data" \
    --form file=@/usr/share/elasticsearch/config/dashboard.ndjson \
    | grep -q '"success":true'; do sleep 5; done

