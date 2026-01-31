#!/bin/bash
#
# WorldClass ERP - Production Deployment Script
# Domain: siyabusaerp.co.za
# EC2: 51.20.67.228
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

EC2_IP="51.20.67.228"
EC2_USER="ubuntu"
DOMAIN="siyabusaerp.co.za"
PROJECT_DIR="/home/ubuntu/worldclass-erp"
SSH_KEY="~/.ssh/aetheros-africa-ec2.pem"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  WorldClass ERP Production Deployment${NC}"
echo -e "${BLUE}  Domain: $DOMAIN${NC}"
echo -e "${BLUE}  Server: $EC2_IP${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if we can connect to EC2
echo -e "\n${YELLOW}[1/7] Checking EC2 connectivity...${NC}"
if ssh -i $SSH_KEY -o ConnectTimeout=10 $EC2_USER@$EC2_IP "echo 'Connected'" 2>/dev/null; then
    echo -e "${GREEN}✓ EC2 connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to EC2. Check SSH key and security groups.${NC}"
    exit 1
fi

# Create project directory structure on EC2
echo -e "\n${YELLOW}[2/7] Setting up project directory on EC2...${NC}"
ssh -i $SSH_KEY $EC2_USER@$EC2_IP << 'REMOTE_SETUP'
mkdir -p /home/ubuntu/worldclass-erp/{docker/nginx,docker/backend,scripts}
mkdir -p /home/ubuntu/worldclass-erp/nginx-conf
mkdir -p /home/ubuntu/worldclass-erp/certbot-etc
mkdir -p /home/ubuntu/worldclass-erp/certbot-var
REMOTE_SETUP
echo -e "${GREEN}✓ Directory structure created${NC}"

# Copy essential files to EC2
echo -e "\n${YELLOW}[3/7] Copying Docker and config files to EC2...${NC}"
scp -i $SSH_KEY ./docker-compose.production.yml $EC2_USER@$EC2_IP:$PROJECT_DIR/docker-compose.yml
scp -i $SSH_KEY ./docker/nginx/nginx.conf $EC2_USER@$EC2_IP:$PROJECT_DIR/nginx-conf/nginx.conf
scp -i $SSH_KEY ./docker/backend/Dockerfile $EC2_USER@$EC2_IP:$PROJECT_DIR/docker/backend/Dockerfile
scp -i $SSH_KEY ./.env.production $EC2_USER@$EC2_IP:$PROJECT_DIR/.env
scp -i $SSH_KEY ./scripts/setup-ssl.sh $EC2_USER@$EC2_IP:$PROJECT_DIR/scripts/setup-ssl.sh
echo -e "${GREEN}✓ Config files copied${NC}"

# Copy backend source code
echo -e "\n${YELLOW}[4/7] Copying backend source code...${NC}"
cd backend
tar --exclude='node_modules' --exclude='dist' -czf /tmp/backend.tar.gz .
scp -i $SSH_KEY /tmp/backend.tar.gz $EC2_USER@$EC2_IP:$PROJECT_DIR/backend.tar.gz
ssh -i $SSH_KEY $EC2_USER@$EC2_IP "cd $PROJECT_DIR && mkdir -p backend && tar -xzf backend.tar.gz -C backend && rm backend.tar.gz"
cd ..
echo -e "${GREEN}✓ Backend code copied${NC}"

# Build and start containers on EC2
echo -e "\n${YELLOW}[5/7] Building and starting Docker containers...${NC}"
ssh -i $SSH_KEY $EC2_USER@$EC2_IP << 'DOCKER_START'
cd /home/ubuntu/worldclass-erp

# Stop existing containers
docker-compose down 2>/dev/null || true

# Stop PM2 if running (to free port 3000)
pm2 stop all 2>/dev/null || true

# Build and start containers
docker-compose build --no-cache backend
docker-compose up -d redis backend

# Wait for backend to be healthy
echo "Waiting for backend to start..."
sleep 10

# Check if backend is running
if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo "Backend is healthy!"
else
    echo "Backend health check - checking logs..."
    docker-compose logs backend --tail 50
fi
DOCKER_START
echo -e "${GREEN}✓ Docker containers started${NC}"

# Setup SSL certificates
echo -e "\n${YELLOW}[6/7] Setting up SSL certificates...${NC}"
ssh -i $SSH_KEY $EC2_USER@$EC2_IP << SETUP_SSL
cd /home/ubuntu/worldclass-erp

# Check if DNS is pointing to this server
MY_IP=\$(curl -s http://checkip.amazonaws.com)
DNS_IP=\$(dig +short $DOMAIN)

if [ "\$MY_IP" == "\$DNS_IP" ]; then
    echo "DNS is correctly configured!"
    chmod +x scripts/setup-ssl.sh
    ./scripts/setup-ssl.sh
else
    echo "WARNING: DNS not yet pointing to this server"
    echo "Current server IP: \$MY_IP"
    echo "DNS resolves to: \$DNS_IP"
    echo "SSL setup will be skipped until DNS propagates"
    
    # Start nginx in HTTP-only mode
    docker-compose up -d nginx
fi
SETUP_SSL
echo -e "${GREEN}✓ SSL setup complete${NC}"

# Deploy frontend
echo -e "\n${YELLOW}[7/7] Building and deploying frontend...${NC}"
cd frontend
npm run build 2>/dev/null || yarn build
scp -i $SSH_KEY -r dist/* $EC2_USER@$EC2_IP:/var/www/html/ 2>/dev/null || \
    ssh -i $SSH_KEY $EC2_USER@$EC2_IP "sudo mkdir -p /var/www/html && sudo chown ubuntu:ubuntu /var/www/html" && \
    scp -i $SSH_KEY -r dist/* $EC2_USER@$EC2_IP:/var/www/html/
cd ..
echo -e "${GREEN}✓ Frontend deployed${NC}"

echo -e "\n${BLUE}============================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Update DNS A record to point $DOMAIN to $EC2_IP"
echo -e "2. Wait for DNS propagation (5-30 minutes)"
echo -e "3. Re-run SSL setup: ssh $EC2_USER@$EC2_IP 'cd $PROJECT_DIR && ./scripts/setup-ssl.sh'"
echo -e "\n${YELLOW}Access URLs:${NC}"
echo -e "- HTTP:  http://$EC2_IP:3000/health (Backend API)"
echo -e "- HTTP:  http://$EC2_IP (Frontend - once nginx running)"
echo -e "- HTTPS: https://$DOMAIN (After SSL setup)"
