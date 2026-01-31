#!/bin/bash
# WorldClass ERP - SSL Certificate Setup with Let's Encrypt
# Run this script on your production server

set -e

# Configuration
DOMAIN="siyabusaerp.co.za"
EMAIL="admin@siyabusaerp.co.za"

echo "============================================"
echo "WorldClass ERP - SSL Certificate Setup"
echo "============================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

# Create required directories
mkdir -p docker/nginx/ssl
mkdir -p docker/nginx/certbot

# Step 1: Start nginx with HTTP only for initial certificate
echo "Step 1: Creating temporary nginx config for certificate generation..."

cat > docker/nginx/nginx-temp.conf << 'EOF'
events {
    worker_connections 1024;
}
http {
    server {
        listen 80;
        server_name _;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 200 'OK';
        }
    }
}
EOF

# Step 2: Run certbot to get initial certificate
echo "Step 2: Obtaining SSL certificate from Let's Encrypt..."
docker run -it --rm \
    -v "$(pwd)/docker/nginx/ssl:/etc/letsencrypt" \
    -v "$(pwd)/docker/nginx/certbot:/var/www/certbot" \
    -p 80:80 \
    certbot/certbot certonly \
    --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Step 3: Update nginx config with your domain
echo "Step 3: Updating nginx configuration..."
sed -i "s/yourdomain.com/$DOMAIN/g" docker/nginx/nginx.conf

echo "============================================"
echo "SSL Certificate Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Update .env.production with your domain"
echo "2. Run: docker-compose -f docker-compose.production.yml up -d"
echo ""
echo "Certificate will auto-renew via certbot container."
