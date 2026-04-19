#!/bin/bash
set -e

DEPLOY_PATH="/opt/11of/frontend"
RELEASE_ID=$(date +%s)
RELEASE_PATH="${DEPLOY_PATH}/releases/release-${RELEASE_ID}"
ARTIFACT_PATH="$1"

echo "Deploying frontend release ${RELEASE_ID}..."

# Create release directory
mkdir -p "${RELEASE_PATH}"

# Copy build artifacts
cp -r "${ARTIFACT_PATH}"/.next "${RELEASE_PATH}/"
cp "${ARTIFACT_PATH}"/package.json "${RELEASE_PATH}/"
cp "${ARTIFACT_PATH}"/next.config.js "${RELEASE_PATH}/"
cp -r "${ARTIFACT_PATH}"/public "${RELEASE_PATH}/" 2>/dev/null || true

# Link to shared node_modules (saves space)
ln -s "${DEPLOY_PATH}/node_modules" "${RELEASE_PATH}/node_modules"

# Copy environment file
cp "${DEPLOY_PATH}/.env.production" "${RELEASE_PATH}/.env.production"

# Update symlink atomically (zero downtime)
ln -sfn "${RELEASE_PATH}" "${DEPLOY_PATH}/current"

# Reload systemd service
sudo systemctl reload-or-restart 11of-frontend.service

echo "Frontend deployed successfully"

# Cleanup: keep only last 5 releases
cd "${DEPLOY_PATH}/releases" && ls -t | tail -n +6 | xargs -r rm -rf
