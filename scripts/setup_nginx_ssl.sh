#!/usr/bin/env bash
# ==============================================================================
# DET Academy - Production Nginx & Let's Encrypt SSL Setup Script
# Domain: det-academy.ru / www.det-academy.ru
# ==============================================================================

set -euo pipefail

echo "========================================================"
echo "🚀 Setting up Nginx & Free SSL for det-academy.ru"
echo "========================================================"

DOMAIN="det-academy.ru"
EMAIL="admin@det-academy.ru"

# 1. Update packages and install Nginx + Certbot
echo "📦 1. Installing Nginx and Certbot..."
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y nginx certbot python3-certbot-nginx
elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y epel-release
    sudo yum install -y nginx certbot python3-certbot-nginx
fi

# 2. Open Firewall ports 80 & 443
echo "🛡️ 2. Configuring Firewall (UFW)..."
if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow 'Nginx Full' || (sudo ufw allow 80/tcp && sudo ufw allow 443/tcp)
fi

# 3. Create Certbot ACME directory
echo "📁 3. Creating challenge directory..."
sudo mkdir -p /var/www/certbot

# 4. Copy initial Nginx configuration (HTTP only)
echo "📝 4. Applying initial Nginx configuration..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

sudo cp "$REPO_ROOT/nginx/det-academy.ru.initial.conf" /etc/nginx/sites-available/det-academy.ru
sudo ln -sf /etc/nginx/sites-available/det-academy.ru /etc/nginx/sites-enabled/
# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# 5. Obtain free SSL certificate from Let's Encrypt
echo "🔒 5. Requesting Free Let's Encrypt SSL Certificate..."
sudo certbot --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --agree-tos \
    --no-eff-email \
    --email "$EMAIL" \
    --redirect

# 6. Apply full production SSL configuration with WebSocket & tuning
echo "✨ 6. Installing fine-tuned production Nginx SSL configuration..."
sudo cp "$REPO_ROOT/nginx/det-academy.ru.conf" /etc/nginx/sites-available/det-academy.ru
sudo nginx -t
sudo systemctl reload nginx

# 7. Verify auto-renewal timer
echo "🔄 7. Verifying Certbot Auto-Renewal..."
sudo certbot renew --dry-run

echo "========================================================"
echo "✅ SUCCESS! Site is securely live at:"
echo "   https://det-academy.ru"
echo "   https://www.det-academy.ru"
echo "========================================================"
