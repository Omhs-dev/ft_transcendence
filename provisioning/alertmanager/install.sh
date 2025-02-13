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

  # Define the download URL
  DOWNLOAD_URL="https://github.com/prometheus/alertmanager/releases/download/$ALERTMANAGER_VERSION/alertmanager-${ALERTMANAGER_VERSION:1}.linux-$ARCH.tar.gz"

  # Download the specified version of Alertmanager
  wget "$DOWNLOAD_URL" -O /tmp/alertmanager.tar.gz || { echo "Failed to download Alertmanager binary"; exit 1; }

  # Extract the binary
  tar -xzf /tmp/alertmanager.tar.gz -C /tmp || { echo "Failed to extract Alertmanager binary"; exit 1; }

  # Find the extracted directory
  EXTRACTED_DIR=$(tar -tf /tmp/alertmanager.tar.gz | head -n 1 | cut -f1 -d"/")

  # Move the binary to the appropriate directory
  sudo mv "/tmp/$EXTRACTED_DIR/alertmanager" "$ALERTMANAGER_BIN_PATH" || { echo "Failed to move Alertmanager binary"; exit 1; }

  # Clean up
  rm -rf /tmp/alertmanager.tar.gz "/tmp/$EXTRACTED_DIR"

  echo "Alertmanager binary downloaded and moved to $ALERTMANAGER_BIN_PATH"
else
  echo "Alertmanager binary already exists at $ALERTMANAGER_BIN_PATH"
fi

# Ensure the binary is executable
sudo chmod +x "$ALERTMANAGER_BIN_PATH"

# Copy the service file to the systemd folder
if [ -f "provisioning/alertmanager/alertmanager.service" ]; then
  sudo cp provisioning/alertmanager/alertmanager.service /etc/systemd/system/alertmanager.service
else
  echo "Error: provisioning/alertmanager/alertmanager.service not found."
  exit 1
fi

# Modify the ExecStart line in the service file dynamically
sudo sed -i "s|ExecStart=.*|ExecStart=${ALERTMANAGER_BIN_PATH} --config.file=${ALERTMANAGER_CONFIG_PATH}|g" /etc/systemd/system/alertmanager.service

# Reload systemd, enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable alertmanager
sudo systemctl start alertmanager

# Check if the service started successfully
if sudo systemctl is-active --quiet alertmanager; then
  echo "Alertmanager service started successfully."
else
  echo "Error: Failed to start Alertmanager service. Check logs with 'journalctl -u alertmanager'."
fi