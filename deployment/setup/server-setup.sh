#!/bin/bash
set -e

echo "Setting up 11of deployment environment..."

# Create dedicated application user
if ! id "11of-app" &>/dev/null; then
    sudo useradd -r -s /bin/bash -m -d /opt/11of 11of-app
    echo "✓ Created 11of-app user"
fi

# Create directory structure
sudo mkdir -p /opt/11of/{backend,frontend}/{releases,logs}
sudo mkdir -p /opt/11of/scripts
echo "✓ Created directory structure"

# Set ownership
sudo chown -R 11of-app:11of-app /opt/11of
echo "✓ Set directory ownership"

# Copy deployment scripts
sudo cp deployment/scripts/*.sh /opt/11of/scripts/
sudo chmod +x /opt/11of/scripts/*.sh
sudo chown 11of-app:11of-app /opt/11of/scripts/*.sh
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
echo "✓ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Create .env file at /opt/11of/backend/.env with production secrets"
echo "2. Create .env.production file at /opt/11of/frontend/.env.production"
echo "3. Set up your GitHub Actions self-hosted runner"
echo "4. Configure GitHub repository secrets"
echo "5. Trigger manual deployment via GitHub Actions (first deployment will install node_modules)"
