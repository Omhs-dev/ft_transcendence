#!/bin/bash

# Set the desired version of Alertmanager
ALERTMANAGER_VERSION="v0.25.0"  # Adjust to the version you want to use
ARCH="amd64"  # Adjust for your system architecture (e.g., amd64, arm64)

# Set the binary paths
ALERTMANAGER_BIN_PATH="/usr/bin/alertmanager"  # Change if needed
ALERTMANAGER_CONFIG_PATH="/etc/alertmanager/alertmanager.yml"  # Adjust the config path if needed

# Download Alertmanager binary if it doesn't exist
if [ ! -f "$ALERTMANAGER_BIN_PATH" ]; then
  echo "Alertmanager binary not found. Downloading version $ALERTMANAGER_VERSION..."
  
  # Download the specified version of Alertmanager
  wget "https://github.com/prometheus/alertmanager/releases/download/$ALERTMANAGER_VERSION/alertmanager-$ALERTMANAGER_VERSION.linux-$ARCH.tar.gz" -O /tmp/alertmanager.tar.gz

  # Extract the binary
  tar -xzf /tmp/alertmanager.tar.gz -C /tmp
  
  # Move the binary to the appropriate directory
  sudo mv /tmp/alertmanager-$ALERTMANAGER_VERSION-linux-$ARCH/alertmanager $ALERTMANAGER_BIN_PATH

  # Clean up
  rm -rf /tmp/alertmanager.tar.gz /tmp/alertmanager-$ALERTMANAGER_VERSION-linux-$ARCH
  
  echo "Alertmanager binary downloaded and moved to $ALERTMANAGER_BIN_PATH"
else
  echo "Alertmanager binary already exists at $ALERTMANAGER_BIN_PATH"
fi

# Copy the service file to the systemd folder
sudo cp provisioning/alertmanager/alertmanager.service /etc/systemd/system/alertmanager.service

# Modify the ExecStart line in the service file dynamically
sudo sed -i "s|ExecStart=.*|ExecStart=${ALERTMANAGER_BIN_PATH} --config.file=${ALERTMANAGER_CONFIG_PATH}|g" /etc/systemd/system/alertmanager.service

# Reload systemd, enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable alertmanager
sudo systemctl start alertmanager
