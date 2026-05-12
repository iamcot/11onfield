#!/bin/bash
set -e

echo "Setting up 11of deployment environment..."

# Get the current user (who will run the GitHub Actions runner)
RUNNER_USER="${SUDO_USER:-$USER}"
echo "Runner user detected: $RUNNER_USER"

# Create dedicated deployment group
if ! getent group 11of-deploy &>/dev/null; then
    sudo groupadd 11of-deploy
    echo "✓ Created 11of-deploy group"
fi

# Create dedicated application user and add to deployment group
if ! id "11of-app" &>/dev/null; then
    sudo useradd -r -s /bin/bash -m -d /opt/11of -G 11of-deploy 11of-app
    echo "✓ Created 11of-app user"
else
    # Add existing user to deployment group
    sudo usermod -a -G 11of-deploy 11of-app
fi

# Add runner user to deployment group
if ! groups "$RUNNER_USER" | grep -q 11of-deploy; then
    sudo usermod -a -G 11of-deploy "$RUNNER_USER"
    echo "✓ Added $RUNNER_USER to 11of-deploy group"
fi

# Create directory structure
sudo mkdir -p /opt/11of/{backend,frontend}/{releases,logs}
sudo mkdir -p /opt/11of/scripts
echo "✓ Created directory structure"

# Set ownership and permissions for shared access
sudo chown -R 11of-app:11of-deploy /opt/11of
sudo chmod -R 775 /opt/11of
# Ensure new files inherit group ownership
sudo chmod g+s /opt/11of /opt/11of/backend /opt/11of/frontend
echo "✓ Set directory ownership and permissions for shared access"

# Copy deployment scripts
sudo cp deployment/scripts/*.sh /opt/11of/scripts/
sudo chmod +x /opt/11of/scripts/*.sh
sudo chown 11of-app:11of-deploy /opt/11of/scripts/*.sh
echo "✓ Copied deployment scripts"

# Install systemd service files
sudo cp deployment/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable 11of-backend.service
sudo systemctl enable 11of-frontend.service
echo "✓ Installed systemd services"

# Configure sudo permissions for service management
echo "11of-app ALL=(ALL) NOPASSWD: /bin/systemctl reload-or-restart 11of-backend.service" | sudo tee /etc/sudoers.d/11of-deploy
echo "11of-app ALL=(ALL) NOPASSWD: /bin/systemctl reload-or-restart 11of-frontend.service" | sudo tee -a /etc/sudoers.d/11of-deploy
echo "11of-app ALL=(ALL) NOPASSWD: /bin/systemctl restart 11of-backend.service" | sudo tee -a /etc/sudoers.d/11of-deploy
echo "11of-app ALL=(ALL) NOPASSWD: /bin/systemctl restart 11of-frontend.service" | sudo tee -a /etc/sudoers.d/11of-deploy
echo "11of-app ALL=(ALL) NOPASSWD: /bin/systemctl is-active 11of-backend.service" | sudo tee -a /etc/sudoers.d/11of-deploy
echo "11of-app ALL=(ALL) NOPASSWD: /bin/systemctl is-active 11of-frontend.service" | sudo tee -a /etc/sudoers.d/11of-deploy
sudo chmod 0440 /etc/sudoers.d/11of-deploy
echo "✓ Configured sudo permissions"

echo ""
echo "✅ Server setup complete!"
echo ""
echo "⚠️  IMPORTANT: GitHub Actions runner must be restarted!"
echo ""
echo "To restart the runner:"
echo "  cd /path/to/runner"
echo "  sudo ./svc.sh stop"
echo "  sudo ./svc.sh start"
echo ""
echo "Or if installed as systemd service:"
echo "  sudo systemctl restart actions.runner.*"
echo ""
echo "After restarting, verify with: groups (should include 11of-deploy)"
echo ""
echo "Next steps:"
echo "1. Restart the GitHub Actions runner (commands above)"
echo "2. Configure GitHub repository secrets"
echo "3. Trigger manual deployment via GitHub Actions"
