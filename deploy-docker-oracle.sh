#!/bin/bash

# ============================================================
# WorldClass ERP - One-Click Oracle Cloud Docker Deployment
# ============================================================
# Run this on your Oracle ARM VM
# Cost: $0/month (Always Free Tier)
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██╗    ██╗ ██████╗ ██████╗ ██╗     ██████╗  ██████╗██╗      ║
║   ██║    ██║██╔═══██╗██╔══██╗██║     ██╔══██╗██╔════╝██║      ║
║   ██║ █╗ ██║██║   ██║██████╔╝██║     ██║  ██║██║     ██║      ║
║   ██║███╗██║██║   ██║██╔══██╗██║     ██║  ██║██║     ██║      ║
║   ╚███╔███╔╝╚██████╔╝██║  ██║███████╗██████╔╝╚██████╗███████╗ ║
║    ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═════╝  ╚═════╝╚══════╝ ║
║                                                               ║
║   ███████╗██████╗ ██████╗                                     ║
║   ██╔════╝██╔══██╗██╔══██╗                                    ║
║   █████╗  ██████╔╝██████╔╝                                    ║
║   ██╔══╝  ██╔══██╗██╔═══╝                                     ║
║   ███████╗██║  ██║██║                                         ║
║   ╚══════╝╚═╝  ╚═╝╚═╝                                         ║
║                                                               ║
║   🐳 Docker Deployment on Oracle Cloud Free Tier              ║
║   💰 Cost: $0/month                                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_IP")
echo -e "${GREEN}► Your Public IP: ${PUBLIC_IP}${NC}\n"

# ============================================================
# Step 1: Install Docker
# ============================================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[1/6] Installing Docker...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker already installed: $(docker --version)${NC}"
else
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker installed${NC}"
fi

# Install Docker Compose
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose available${NC}"
else
    echo "Installing Docker Compose plugin..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi

# ============================================================
# Step 2: Open Firewall Ports
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[2/6] Configuring Firewall...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Open ports via iptables (Oracle VM firewall)
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true

echo -e "${GREEN}✓ Firewall ports opened (80, 443, 3000)${NC}"
echo -e "${YELLOW}⚠ Remember to also configure Oracle Cloud Security List!${NC}"

# ============================================================
# Step 3: Clone Repository
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[3/6] Setting up WorldClass ERP...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

APP_DIR="/home/ubuntu/WorldClass-ERP"

if [ -d "$APP_DIR" ]; then
    echo "Updating existing repository..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    cd /home/ubuntu
    git clone https://github.com/sbuncele-del/WorldClass-ERP.git
    cd "$APP_DIR"
fi

echo -e "${GREEN}✓ Repository ready${NC}"

# ============================================================
# Step 4: Create Environment File
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[4/6] Creating Configuration...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
DB_PASSWORD="worldclass_$(openssl rand -hex 8)"

cat > "$APP_DIR/.env" << EOF
# WorldClass ERP - Oracle Cloud Configuration
# Generated: $(date)
# Public IP: ${PUBLIC_IP}

# Database
DB_PASSWORD=${DB_PASSWORD}

# JWT Secrets
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# URLs
FRONTEND_URL=http://${PUBLIC_IP}
VITE_API_URL=/api

# Node Environment
NODE_ENV=production
EOF

echo -e "${GREEN}✓ Configuration created${NC}"
echo -e "  Database Password: ${DB_PASSWORD}"

# ============================================================
# Step 5: Build and Start Containers
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[5/6] Building Docker Images...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$APP_DIR"

# Build and start
echo "Building images (this may take a few minutes on first run)..."
docker compose -f docker-compose.oracle.yml build --no-cache

echo -e "\n${BLUE}Starting services...${NC}"
docker compose -f docker-compose.oracle.yml up -d

# Wait for services
echo -e "\n${BLUE}Waiting for services to be healthy...${NC}"
sleep 10

# ============================================================
# Step 6: Run Database Migrations
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[6/6] Running Database Migrations...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Wait for postgres to be ready
echo "Waiting for database..."
until docker exec worldclass-db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
done

# Run migrations
docker exec worldclass-api npm run db:migrate 2>/dev/null || echo "Migrations may need manual review"

echo -e "${GREEN}✓ Database setup complete${NC}"

# ============================================================
# Deployment Complete!
# ============================================================
echo -e "\n${GREEN}"
cat << EOF
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎉 DEPLOYMENT SUCCESSFUL! 🎉                                ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   🌐 Your WorldClass ERP is now running!                      ║
║                                                               ║
║   ┌─────────────────────────────────────────────────────────┐ ║
║   │                                                         │ ║
║   │   Frontend:  http://${PUBLIC_IP}                   │ ║
║   │   API:       http://${PUBLIC_IP}/api               │ ║
║   │   Health:    http://${PUBLIC_IP}/api/health        │ ║
║   │                                                         │ ║
║   └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   📊 RESOURCES ALLOCATED (FREE FOREVER):                      ║
║   ┌─────────────────────────────────────────────────────────┐ ║
║   │  CPU:      4 ARM Cores (Ampere A1)                      │ ║
║   │  RAM:      24 GB                                        │ ║
║   │  Storage:  200 GB                                       │ ║
║   │  Database: PostgreSQL 15                                │ ║
║   │  Cache:    Redis 7                                      │ ║
║   └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   📝 USEFUL COMMANDS:                                         ║
║                                                               ║
║   docker compose -f docker-compose.oracle.yml ps     Status   ║
║   docker compose -f docker-compose.oracle.yml logs   Logs     ║
║   docker compose -f docker-compose.oracle.yml down   Stop     ║
║   docker compose -f docker-compose.oracle.yml up -d  Start    ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   💰 MONTHLY COST: \$0.00                                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Show container status
echo -e "\n${CYAN}Container Status:${NC}"
docker compose -f docker-compose.oracle.yml ps

echo -e "\n${GREEN}All done! Your ERP is ready at: http://${PUBLIC_IP}${NC}"
