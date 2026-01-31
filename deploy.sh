#!/bin/bash
# ========================================
# WorldClass ERP - Production Deployment Script
# ========================================
#
# This script deploys the backend to the Vultr server
#
# Usage:
#   ./deploy.sh              # Deploy to production
#   ./deploy.sh --docker     # Deploy with Docker (recommended)
#   ./deploy.sh --rsync      # Deploy with rsync (current method)
#
# ========================================

set -e  # Exit on error

# ----------------------------------------
# Configuration - Load from environment or credentials file
# ----------------------------------------
if [ -f "/workspaces/WorldClass-ERP/CREDENTIALS.env" ]; then
    source /workspaces/WorldClass-ERP/CREDENTIALS.env
fi

SERVER_IP="${SERVER_IP:-139.84.243.221}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASSWORD="${SERVER_PASSWORD:-}"  # Must be set in CREDENTIALS.env or environment
REMOTE_DIR="/root/WorldClass-ERP"
VERSION=$(date +"%Y%m%d-%H%M%S")

# Check if password is set
if [ -z "$SERVER_PASSWORD" ]; then
    echo -e "${RED}ERROR: SERVER_PASSWORD not set${NC}"
    echo "Create CREDENTIALS.env file with: SERVER_PASSWORD=your-password"
    echo "Or set SERVER_PASSWORD environment variable"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  WorldClass ERP - Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}ERROR: sshpass is not installed${NC}"
    echo "Install with: apt-get install sshpass"
    exit 1
fi

# Parse arguments
DEPLOY_METHOD="rsync"
if [[ "$1" == "--docker" ]]; then
    DEPLOY_METHOD="docker"
elif [[ "$1" == "--rsync" ]]; then
    DEPLOY_METHOD="rsync"
fi

echo -e "${YELLOW}Deployment method: ${DEPLOY_METHOD}${NC}"
echo -e "${YELLOW}Server: ${SERVER_IP}${NC}"
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo ""

# ----------------------------------------
# Build
# ----------------------------------------
echo -e "${GREEN}[1/4] Building TypeScript...${NC}"
cd /workspaces/WorldClass-ERP/backend
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

if [[ "$DEPLOY_METHOD" == "docker" ]]; then
    # ----------------------------------------
    # Docker Deployment
    # ----------------------------------------
    echo -e "${GREEN}[2/4] Building Docker image...${NC}"
    docker build -f Dockerfile.prod -t worldclass-backend:${VERSION} -t worldclass-backend:latest .
    echo -e "${GREEN}✓ Docker image built${NC}"
    echo ""

    echo -e "${GREEN}[3/4] Saving and transferring image...${NC}"
    docker save worldclass-backend:${VERSION} | gzip > /tmp/worldclass-backend-${VERSION}.tar.gz
    sshpass -p "${SERVER_PASSWORD}" scp /tmp/worldclass-backend-${VERSION}.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
    echo -e "${GREEN}✓ Image transferred${NC}"
    echo ""

    echo -e "${GREEN}[4/4] Loading and starting on server...${NC}"
    sshpass -p "${SERVER_PASSWORD}" ssh ${SERVER_USER}@${SERVER_IP} << EOF
        echo "Loading Docker image..."
        gunzip -c /tmp/worldclass-backend-${VERSION}.tar.gz | docker load
        
        echo "Stopping old container..."
        docker stop worldclass-backend 2>/dev/null || true
        docker rm worldclass-backend 2>/dev/null || true
        
        echo "Starting new container..."
        docker run -d \
            --name worldclass-backend \
            --restart always \
            -p 3000:3000 \
            --env-file ${REMOTE_DIR}/backend/.env.docker \
            --network host \
            worldclass-backend:${VERSION}
        
        echo "Cleaning up..."
        rm /tmp/worldclass-backend-${VERSION}.tar.gz
        
        echo "Checking health..."
        sleep 5
        docker logs worldclass-backend --tail 20
EOF
    echo -e "${GREEN}✓ Docker deployment complete${NC}"

else
    # ----------------------------------------
    # Rsync Deployment (Current Method)
    # ----------------------------------------
    echo -e "${GREEN}[2/4] Syncing files to server...${NC}"
    sshpass -p "${SERVER_PASSWORD}" rsync -avz --delete \
        /workspaces/WorldClass-ERP/backend/dist/ \
        ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/backend/dist/
    echo -e "${GREEN}✓ Files synced${NC}"
    echo ""

    echo -e "${GREEN}[3/4] Checking dependencies on server...${NC}"
    sshpass -p "${SERVER_PASSWORD}" ssh ${SERVER_USER}@${SERVER_IP} << EOF
        cd ${REMOTE_DIR}/backend
        npm install --only=production 2>&1 | tail -5
EOF
    echo -e "${GREEN}✓ Dependencies checked${NC}"
    echo ""

    echo -e "${GREEN}[4/4] Restarting PM2...${NC}"
    sshpass -p "${SERVER_PASSWORD}" ssh ${SERVER_USER}@${SERVER_IP} << EOF
        cd ${REMOTE_DIR}/backend
        pm2 restart worldclass-backend 2>/dev/null || pm2 start dist/index.js --name worldclass-backend
        sleep 3
        pm2 logs worldclass-backend --lines 10 --nostream
EOF
    echo -e "${GREEN}✓ PM2 restarted${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete! ✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Version: ${VERSION}"
echo -e "Server:  http://${SERVER_IP}:3000"
echo -e "Health:  http://${SERVER_IP}:3000/api/health"
echo ""
