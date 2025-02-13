FROM prom/alertmanager

# Copy the template configuration file
COPY alertmanager.yaml /etc/alertmanager/alertmanager.yaml

# Set the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]