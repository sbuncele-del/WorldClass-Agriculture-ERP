#!/bin/bash

# ============================================================
# WorldClass ERP - Vultr Deployment Script
# Optimized for 2GB RAM servers
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
║   🚀 Vultr Johannesburg Deployment                            ║
║   🇿🇦 Optimized for 2GB RAM                                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo -e "${GREEN}► Your Public IP: ${PUBLIC_IP}${NC}\n"

# ============================================================
# Step 1: System Update & Swap (for 2GB RAM)
# ============================================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[1/7] Setting up system and swap space...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Update system
apt update && apt upgrade -y

# Create 2GB swap file for 2GB RAM servers
if [ ! -f /swapfile ]; then
    echo "Creating swap file (helps with 2GB RAM)..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo -e "${GREEN}✓ Swap file created (2GB)${NC}"
else
    echo -e "${GREEN}✓ Swap already exists${NC}"
fi

# ============================================================
# Step 2: Install Docker
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[2/7] Installing Docker...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker already installed: $(docker --version)${NC}"
else
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed${NC}"
fi

# Install Docker Compose
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker Compose available${NC}"
else
    apt install -y docker-compose-plugin
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi

# ============================================================
# Step 3: Configure Firewall
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[3/7] Configuring firewall...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Configure UFW
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Backend API (optional direct access)
ufw --force enable

echo -e "${GREEN}✓ Firewall configured${NC}"

# ============================================================
# Step 4: Clone Repository
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[4/7] Cloning WorldClass ERP...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

APP_DIR="/root/WorldClass-ERP"

if [ -d "$APP_DIR" ]; then
    echo "Updating existing repository..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/sbuncele-del/WorldClass-ERP.git "$APP_DIR"
    cd "$APP_DIR"
fi

echo -e "${GREEN}✓ Repository ready${NC}"

# ============================================================
# Step 5: Create Docker Compose (Optimized for 2GB)
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[5/7] Creating optimized Docker configuration...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
DB_PASSWORD="worldclass_$(openssl rand -hex 8)"

# Create .env file
cat > "$APP_DIR/.env" << EOF
# WorldClass ERP - Vultr Johannesburg
# Generated: $(date)
# Server IP: ${PUBLIC_IP}

# Database
DB_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/worldclass_erp

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# URLs
FRONTEND_URL=http://${PUBLIC_IP}
VITE_API_URL=/api

# Environment
NODE_ENV=production
PORT=3000
EOF

# Create optimized docker-compose for 2GB RAM
cat > "$APP_DIR/docker-compose.vultr.yml" << 'COMPOSE'
version: '3.8'

services:
  # PostgreSQL - Memory optimized
  postgres:
    image: postgres:15-alpine
    container_name: worldclass-db
    restart: always
    environment:
      POSTGRES_DB: worldclass_erp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      # Memory optimization for 2GB server
      POSTGRES_SHARED_BUFFERS: 128MB
      POSTGRES_WORK_MEM: 4MB
    volumes:
      - postgres_data:/var/lib/postgresql/data
    command: 
      - "postgres"
      - "-c"
      - "shared_buffers=128MB"
      - "-c"
      - "work_mem=4MB"
      - "-c"
      - "maintenance_work_mem=64MB"
      - "-c"
      - "effective_cache_size=512MB"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - worldclass-network
    deploy:
      resources:
        limits:
          memory: 512M

  # Redis - Memory optimized
  redis:
    image: redis:7-alpine
    container_name: worldclass-redis
    restart: always
    command: redis-server --maxmemory 64mb --maxmemory-policy allkeys-lru --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - worldclass-network
    deploy:
      resources:
        limits:
          memory: 128M

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: worldclass-api
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/worldclass_erp
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      # Memory optimization
      NODE_OPTIONS: "--max-old-space-size=512"
    volumes:
      - backend_uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - worldclass-network
    deploy:
      resources:
        limits:
          memory: 768M

  # Frontend + Nginx
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: worldclass-frontend
    restart: always
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - worldclass-network
    deploy:
      resources:
        limits:
          memory: 128M

networks:
  worldclass-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  backend_uploads:
COMPOSE

echo -e "${GREEN}✓ Docker configuration created (optimized for 2GB RAM)${NC}"

# ============================================================
# Step 6: Build and Start
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[6/7] Building and starting containers...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$APP_DIR"

# Build images
echo "Building Docker images (this may take 5-10 minutes)..."
docker compose -f docker-compose.vultr.yml build

# Start services
echo "Starting services..."
docker compose -f docker-compose.vultr.yml up -d

# Wait for services
echo "Waiting for services to be ready..."
sleep 30

# ============================================================
# Step 7: Verify Deployment
# ============================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[7/7] Verifying deployment...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check containers
echo "Container status:"
docker compose -f docker-compose.vultr.yml ps

# Test health endpoint
echo ""
echo "Testing API health..."
sleep 10
curl -s http://localhost/api/health || echo "API still starting..."

# ============================================================
# Complete!
# ============================================================
echo -e "\n${GREEN}"
cat << EOF
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎉 DEPLOYMENT COMPLETE! 🎉                                  ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   🌐 Your WorldClass ERP is now running!                      ║
║                                                               ║
║   ┌─────────────────────────────────────────────────────────┐ ║
║   │                                                         │ ║
║   │   🇿🇦 Frontend:  http://${PUBLIC_IP}                      
║   │   🔌 API:       http://${PUBLIC_IP}/api                   
║   │   💚 Health:    http://${PUBLIC_IP}/api/health            
║   │                                                         │ ║
║   └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   📊 SERVER SPECS:                                            ║
║   • Location:  Johannesburg, South Africa                     ║
║   • RAM:       2GB + 2GB Swap                                 ║
║   • Storage:   55GB SSD                                       ║
║   • Backups:   Enabled                                        ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   📝 USEFUL COMMANDS:                                         ║
║                                                               ║
║   cd /root/WorldClass-ERP                                     ║
║   docker compose -f docker-compose.vultr.yml ps      Status   ║
║   docker compose -f docker-compose.vultr.yml logs    Logs     ║
║   docker compose -f docker-compose.vultr.yml restart Restart  ║
║   docker compose -f docker-compose.vultr.yml down    Stop     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}Your ERP is ready at: http://${PUBLIC_IP}${NC}"
