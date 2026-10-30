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
cp "${ARTIFACT_PATH}"/.npmrc "${RELEASE_PATH}/" 2>/dev/null || true
cp "${ARTIFACT_PATH}"/next.config.js "${RELEASE_PATH}/"
cp -r "${ARTIFACT_PATH}"/public "${RELEASE_PATH}/" 2>/dev/null || true

# Link to shared node_modules (installed by workflow)
ln -s "${DEPLOY_PATH}/node_modules" "${RELEASE_PATH}/node_modules"

# Copy environment file
cp "${DEPLOY_PATH}/.env.production" "${RELEASE_PATH}/.env.production"

# Remember the release that is running now, so a failed start can go back to it
PREVIOUS_RELEASE=$(readlink "${DEPLOY_PATH}/current" 2>/dev/null || echo "")

wait_healthy() {
  for i in $(seq 1 "$1"); do
    if [ "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7070 2>/dev/null || echo 000)" = "200" ]; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# Switch to the new release; the old process kept serving until this point
ln -sfn "${RELEASE_PATH}" "${DEPLOY_PATH}/current"
sudo systemctl reload-or-restart 11of-frontend.service

echo "Waiting for frontend to start..."
if ! wait_healthy 45; then
  echo "✗ New frontend did not become healthy, going back to the old one"
  sudo journalctl -u 11of-frontend.service -n 40 --no-pager 2>/dev/null || true
  if [ -n "${PREVIOUS_RELEASE}" ] && [ -d "${PREVIOUS_RELEASE}" ]; then
    ln -sfn "${PREVIOUS_RELEASE}" "${DEPLOY_PATH}/current"
    sudo systemctl reset-failed 11of-frontend.service 2>/dev/null || true
    sudo systemctl restart 11of-frontend.service || true
    wait_healthy 30 && echo "✓ Back on ${PREVIOUS_RELEASE}" || echo "⚠ Old release is not healthy either, check the server"
  fi
  rm -rf "${RELEASE_PATH}"
  exit 1
fi

echo "✓ Frontend deployed successfully (release ${RELEASE_ID})"

# Cleanup: keep only last 3 releases
cd "${DEPLOY_PATH}/releases" && ls -t | tail -n +4 | xargs -r rm -rf
