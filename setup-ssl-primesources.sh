#!/bin/bash
# SSL Setup Script for primesources.site
# Run this on your EC2 server: bash setup-ssl-primesources.sh

echo "=== SSL Setup for primesources.site ==="

# Step 1: Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Step 2: Install acme.sh
curl https://get.acme.sh | sh -s email=admin@primesources.site
source ~/.bashrc

# Step 3: Issue SSL certificate
sudo ~/.acme.sh/acme.sh --issue -d primesources.site -d www.primesources.site \
  --webroot /var/www/aetheros-erp \
  --force

# Step 4: Install certificate
sudo ~/.acme.sh/acme.sh --install-cert -d primesources.site \
  --key-file /etc/nginx/ssl/primesources.key \
  --fullchain-file /etc/nginx/ssl/primesources.crt \
  --reloadcmd "systemctl reload nginx"

# Step 5: Update nginx configuration
sudo tee /etc/nginx/conf.d/aetheros-ssl.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name primesources.site www.primesources.site;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name primesources.site www.primesources.site;

    ssl_certificate /etc/nginx/ssl/primesources.crt;
    ssl_certificate_key /etc/nginx/ssl/primesources.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/aetheros-erp;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Step 6: Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== SSL Setup Complete! ==="
echo "Your site should now be accessible at:"
echo "  https://primesources.site"
echo "  https://www.primesources.site"
echo ""
echo "SSL certificate will auto-renew every 60 days."
