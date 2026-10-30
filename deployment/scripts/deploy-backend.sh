#!/bin/bash
set -e

DEPLOY_PATH="/opt/11of/backend"
RELEASE_ID=$(date +%s)
RELEASE_PATH="${DEPLOY_PATH}/releases/release-${RELEASE_ID}"
ARTIFACT_PATH="$1"

if [ ! -f "${ARTIFACT_PATH}" ]; then
  echo "✗ Artifact not found: ${ARTIFACT_PATH}"
  exit 1
fi

echo "Deploying backend release ${RELEASE_ID}..."

# Create release directory
mkdir -p "${RELEASE_PATH}"
mkdir -p "${RELEASE_PATH}/scripts"

# Copy artifact and environment file
cp "${ARTIFACT_PATH}" "${RELEASE_PATH}/backoffice.jar"
cp "${DEPLOY_PATH}/.env" "${RELEASE_PATH}/.env"

# Copy utility scripts from backoffice/scripts if they exist
if [ -d "/tmp/backoffice-scripts" ]; then
  echo "📂 Found /tmp/backoffice-scripts directory"
  ls -la /tmp/backoffice-scripts/
  echo "Copying utility scripts to ${RELEASE_PATH}/scripts/..."
  cp -v -r /tmp/backoffice-scripts/* "${RELEASE_PATH}/scripts/"
  chmod -v +x "${RELEASE_PATH}/scripts/"*.sh 2>/dev/null || true
  echo "✓ Utility scripts copied"
  ls -la "${RELEASE_PATH}/scripts/"
  rm -rf /tmp/backoffice-scripts
else
  echo "⚠️ /tmp/backoffice-scripts directory not found - scripts will not be deployed"
fi

# Remember the release that is running now, so a failed start can go back to it
PREVIOUS_RELEASE=$(readlink "${DEPLOY_PATH}/current" 2>/dev/null || echo "")

wait_healthy() {
  for i in $(seq 1 "$1"); do
    if curl -sf http://localhost:7071/actuator/health 2>/dev/null | grep -q "UP"; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# Switch to the new release; the old process kept serving until this point
ln -sfn "${RELEASE_PATH}" "${DEPLOY_PATH}/current"
sudo systemctl reload-or-restart 11of-backend.service

# Only a release that answers the health check stays
echo "Waiting for backend to start..."
if ! wait_healthy 60; then
  echo "✗ New release did not become healthy, going back to the old one"
  sudo journalctl -u 11of-backend.service -n 40 --no-pager 2>/dev/null || true
  if [ -n "${PREVIOUS_RELEASE}" ] && [ -d "${PREVIOUS_RELEASE}" ]; then
    ln -sfn "${PREVIOUS_RELEASE}" "${DEPLOY_PATH}/current"
    sudo systemctl reset-failed 11of-backend.service 2>/dev/null || true
    sudo systemctl restart 11of-backend.service || true
    wait_healthy 45 && echo "✓ Back on ${PREVIOUS_RELEASE}" || echo "⚠ Old release is not healthy either, check the server"
  else
    echo "⚠ No previous release to go back to"
  fi
  # Drop the bad release so rollback.sh never takes it for the previous one
  rm -rf "${RELEASE_PATH}"
  exit 1
fi

echo "✓ Backend deployed successfully (release ${RELEASE_ID})"

# Cleanup: keep only last 3 releases
cd "${DEPLOY_PATH}/releases" && ls -t | tail -n +4 | xargs -r rm -rf
