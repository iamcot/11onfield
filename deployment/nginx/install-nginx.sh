#!/bin/bash
set -e

echo "Installing nginx configuration for 11onfield.com..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Error: nginx is not installed"
    echo "Install it with: sudo apt install nginx"
    exit 1
fi

# Copy nginx configuration
echo "Copying nginx configuration..."
sudo cp deployment/nginx/11onfield.conf /etc/nginx/sites-available/11onfield.conf

# Create symlink to enable the site
if [ ! -L /etc/nginx/sites-enabled/11onfield.conf ]; then
    sudo ln -s /etc/nginx/sites-available/11onfield.conf /etc/nginx/sites-enabled/11onfield.conf
    echo "✓ Enabled site"
fi

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Nginx configuration installed successfully!"
echo ""
echo "Your site is now available at:"
echo "  http://11onfield.com"
echo "  http://www.11onfield.com"
echo ""
echo "API endpoints are proxied through:"
echo "  http://11onfield.com/api/*  -> Backend (port 8081)"
echo ""
echo "To enable HTTPS:"
echo "1. Install certbot: sudo apt install certbot python3-certbot-nginx"
echo "2. Get certificate: sudo certbot --nginx -d 11onfield.com -d www.11onfield.com"
echo "3. Certbot will automatically configure SSL in the nginx config"
