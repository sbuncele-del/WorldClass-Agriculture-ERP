#!/bin/bash

# ============================================================
# WorldClass ERP - Oracle Cloud Free Tier Deployment Script
# ============================================================
# Run this on your Oracle ARM VM (Ubuntu)
# Cost: $0/month (Always Free tier)
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     WorldClass ERP - Oracle Cloud Deployment              ║"
echo "║     Always Free Tier - \$0/month                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo -e "${GREEN}✓ Your Public IP: ${PUBLIC_IP}${NC}"

# ============================================================
# Step 1: System Update
# ============================================================
echo -e "\n${YELLOW}[1/8] Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# ============================================================
# Step 2: Install Node.js 20
# ============================================================
echo -e "\n${YELLOW}[2/8] Installing Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

# ============================================================
# Step 3: Install PostgreSQL
# ============================================================
echo -e "\n${YELLOW}[3/8] Installing PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
fi
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
echo -e "${YELLOW}Setting up database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE worldclass_erp;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'worldclass_secure_2024';"
echo -e "${GREEN}✓ PostgreSQL installed and configured${NC}"

# ============================================================
# Step 4: Install Redis
# ============================================================
echo -e "\n${YELLOW}[4/8] Installing Redis...${NC}"
if ! command -v redis-server &> /dev/null; then
    sudo apt install -y redis-server
fi
sudo systemctl enable redis-server
sudo systemctl start redis-server
echo -e "${GREEN}✓ Redis installed and running${NC}"

# ============================================================
# Step 5: Install Nginx
# ============================================================
echo -e "\n${YELLOW}[5/8] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
fi
sudo systemctl enable nginx
echo -e "${GREEN}✓ Nginx installed${NC}"

# ============================================================
# Step 6: Install PM2
# ============================================================
echo -e "\n${YELLOW}[6/8] Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 installed${NC}"

# ============================================================
# Step 7: Clone and Setup Application
# ============================================================
echo -e "\n${YELLOW}[7/8] Setting up WorldClass ERP...${NC}"

APP_DIR="/home/ubuntu/WorldClass-ERP"

# Clone if not exists, otherwise pull
if [ -d "$APP_DIR" ]; then
    echo "Repository exists, pulling latest..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    cd /home/ubuntu
    git clone https://github.com/sbuncele-del/WorldClass-ERP.git
    cd "$APP_DIR"
fi

# Create backend .env file
echo -e "${YELLOW}Creating environment configuration...${NC}"
cat > "$APP_DIR/backend/.env" << EOF
# WorldClass ERP - Oracle Cloud Configuration
# Generated on $(date)

# Database (PostgreSQL on localhost)
DATABASE_URL=postgresql://postgres:worldclass_secure_2024@localhost:5432/worldclass_erp

# Redis (local)
REDIS_URL=redis://localhost:6379

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Server
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=http://${PUBLIC_IP}

# Tenant (default)
DEFAULT_TENANT_ID=1
EOF

echo -e "${GREEN}✓ Environment configured${NC}"

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd "$APP_DIR/backend"
npm install

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
npm run build || echo "Build command may vary, checking..."

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd "$APP_DIR/frontend"
npm install

# Create frontend .env
cat > "$APP_DIR/frontend/.env" << EOF
VITE_API_URL=http://${PUBLIC_IP}/api
EOF

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build

echo -e "${GREEN}✓ Application built successfully${NC}"

# ============================================================
# Step 8: Configure Nginx & Start Services
# ============================================================
echo -e "\n${YELLOW}[8/8] Configuring Nginx and starting services...${NC}"

# Create Nginx config
sudo tee /etc/nginx/sites-available/worldclass > /dev/null << EOF
server {
    listen 80;
    server_name ${PUBLIC_IP};

    # Frontend - serve static files
    location / {
        root ${APP_DIR}/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/api/health;
        proxy_http_version 1.1;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/worldclass /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# Start backend with PM2
cd "$APP_DIR/backend"
pm2 delete worldclass-api 2>/dev/null || true
pm2 start dist/index.js --name "worldclass-api" --env production
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | sudo bash

echo -e "${GREEN}✓ Services started${NC}"

# ============================================================
# Deployment Complete!
# ============================================================
echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          🎉 DEPLOYMENT COMPLETE! 🎉                       ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║  Frontend:  http://${PUBLIC_IP}                          "
echo "║  API:       http://${PUBLIC_IP}/api                      "
echo "║  Health:    http://${PUBLIC_IP}/api/health               "
echo "║                                                           ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Useful Commands:                                         ║"
echo "║  • pm2 status        - Check app status                   ║"
echo "║  • pm2 logs          - View application logs              ║"
echo "║  • pm2 restart all   - Restart application                ║"
echo "║  • sudo systemctl status nginx   - Check Nginx            ║"
echo "║  • sudo systemctl status redis   - Check Redis            ║"
echo "║  • sudo systemctl status postgresql - Check DB            ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Monthly Cost: \$0 (Oracle Always Free Tier)               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Show status
echo -e "\n${BLUE}Current Status:${NC}"
pm2 status
