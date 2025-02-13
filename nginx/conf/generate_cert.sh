#!/bin/bash

CERT_DIR="/etc/nginx/ssl"
CERT_KEY="$CERT_DIR/nginx.key"
CERT_CRT="$CERT_DIR/nginx.crt"

mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_KEY" ] || [ ! -f "$CERT_CRT" ]; then
    echo "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_KEY" -out "$CERT_CRT" \
    -subj "/C=DE/ST=Baden-württemberg/L=Heilbronn/O=42Heilbronn/OU=Heilb/CN=mfaoussi.42.fr"
    echo "Certificate generated successfully."
else
    echo "SSL certificate already exists. Skipping generation."
fi