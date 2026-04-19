#!/bin/bash
set -e

DEPLOY_PATH="/opt/11of/backend"
RELEASE_ID=$(date +%s)
RELEASE_PATH="${DEPLOY_PATH}/releases/release-${RELEASE_ID}"
ARTIFACT_PATH="$1"

echo "Deploying backend release ${RELEASE_ID}..."

# Create release directory
mkdir -p "${RELEASE_PATH}"

# Copy artifact and environment file
cp "${ARTIFACT_PATH}" "${RELEASE_PATH}/backoffice.jar"
cp "${DEPLOY_PATH}/.env" "${RELEASE_PATH}/.env"

# Update symlink atomically (zero downtime)
ln -sfn "${RELEASE_PATH}" "${DEPLOY_PATH}/current"

# Reload systemd service
sudo systemctl reload-or-restart 11of-backend.service

echo "Backend deployed successfully"

# Cleanup: keep only last 5 releases
cd "${DEPLOY_PATH}/releases" && ls -t | tail -n +6 | xargs -r rm -rf
