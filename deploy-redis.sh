#!/bin/bash
# Deploy Redis + Backend to EC2
# Run this on EC2 via SSM

set -e

echo "🔄 Pulling latest code..."
cd /home/ssm-user/backend
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building..."
npm run build

echo "🐳 Starting Redis via Docker..."
# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ssm-user
fi

# Stop existing Redis if running
sudo docker stop worldclass-redis 2>/dev/null || true
sudo docker rm worldclass-redis 2>/dev/null || true

# Start Redis with persistence
sudo docker run -d \
    --name worldclass-redis \
    --restart unless-stopped \
    -p 6379:6379 \
    -v /home/ssm-user/redis-data:/data \
    redis:7-alpine \
    redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

echo "⏳ Waiting for Redis to start..."
sleep 3

# Test Redis connection
if sudo docker exec worldclass-redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is running!"
else
    echo "❌ Redis failed to start"
    exit 1
fi

echo "🔧 Updating .env with Redis configuration..."
# Add Redis env vars if not present
if ! grep -q "REDIS_HOST" .env; then
    echo "" >> .env
    echo "# Redis Configuration" >> .env
    echo "REDIS_HOST=localhost" >> .env
    echo "REDIS_PORT=6379" >> .env
    echo "REDIS_TLS=false" >> .env
fi

echo "🔄 Restarting backend..."
pm2 restart erp-backend --update-env

echo "⏳ Waiting for server..."
sleep 5

echo "🔍 Checking health endpoints..."
curl -s http://localhost:3000/health | jq .
curl -s http://localhost:3000/health/redis | jq .

echo ""
echo "✅ Deployment complete!"
echo "📊 Redis status: $(sudo docker exec worldclass-redis redis-cli info server | head -5)"
