#!/bin/bash
set -e

SERVICE=$1  # "backend" or "frontend"

if [ -z "$SERVICE" ]; then
    echo "Usage: $0 <backend|frontend>"
    exit 1
fi

DEPLOY_PATH="/opt/11of/${SERVICE}"
CURRENT_RELEASE=$(readlink "${DEPLOY_PATH}/current")
PREVIOUS_RELEASE=$(ls -t "${DEPLOY_PATH}/releases" | sed -n '2p')

if [ -z "${PREVIOUS_RELEASE}" ]; then
    echo "No previous release found for ${SERVICE}"
    exit 1
fi

echo "Rolling back ${SERVICE} from ${CURRENT_RELEASE} to ${PREVIOUS_RELEASE}..."

# Update symlink to previous release
ln -sfn "${DEPLOY_PATH}/releases/${PREVIOUS_RELEASE}" "${DEPLOY_PATH}/current"

# Restart service
sudo systemctl restart "11of-${SERVICE}.service"

# Wait and verify
sleep 5
if sudo systemctl is-active --quiet "11of-${SERVICE}.service"; then
    echo "✓ Rollback completed successfully for ${SERVICE}"
else
    echo "✗ Service failed to start after rollback"
    exit 1
fi
