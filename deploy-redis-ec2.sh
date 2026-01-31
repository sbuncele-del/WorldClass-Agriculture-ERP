#!/bin/bash
# Run these commands INSIDE the SSM session on EC2
# Copy and paste them one at a time

echo "=== Step 1: Find the backend directory ==="
find /home -name "package.json" -path "*/backend/*" 2>/dev/null | head -5
ls -la /home/

echo ""
echo "=== Step 2: Navigate to backend (adjust path if needed) ==="
# Try common locations
if [ -d "/home/ec2-user/backend" ]; then
    cd /home/ec2-user/backend
elif [ -d "/home/ssm-user/backend" ]; then
    cd /home/ssm-user/backend
elif [ -d "/home/ssm-user/WorldClass-ERP/backend" ]; then
    cd /home/ssm-user/WorldClass-ERP/backend
else
    echo "❌ Backend directory not found!"
    echo "Please run: find /home -name 'package.json' 2>/dev/null"
    exit 1
fi
echo "Current directory: $(pwd)"

echo ""
echo "=== Step 3: Pull latest code ==="
git pull origin main

echo ""
echo "=== Step 4: Install dependencies ==="
npm install

echo ""
echo "=== Step 5: Build ==="
npm run build

echo ""
echo "=== Step 6: Start Docker service ==="
sudo systemctl start docker
sudo systemctl enable docker

echo ""
echo "=== Step 7: Run Redis container ==="
sudo docker stop redis 2>/dev/null || true
sudo docker rm redis 2>/dev/null || true
sudo docker run -d \
    --name redis \
    --restart unless-stopped \
    -p 6379:6379 \
    -v /home/ssm-user/redis-data:/data \
    redis:7-alpine \
    redis-server --appendonly yes

echo ""
echo "=== Step 8: Test Redis ==="
sleep 3
sudo docker exec redis redis-cli ping

echo ""
echo "=== Step 9: Update .env ==="
if ! grep -q "REDIS_HOST" .env 2>/dev/null; then
    echo "" >> .env
    echo "# Redis Configuration" >> .env
    echo "REDIS_HOST=localhost" >> .env
    echo "REDIS_PORT=6379" >> .env
    echo "REDIS_TLS=false" >> .env
    echo "✅ Redis config added to .env"
else
    echo "ℹ️  Redis already configured in .env"
fi

echo ""
echo "=== Step 10: Restart backend ==="
pm2 restart all --update-env || pm2 start dist/index.js --name erp-backend

echo ""
echo "=== Step 11: Verify ==="
sleep 5
curl -s http://localhost:3000/health || echo "Health check pending..."
curl -s http://localhost:3000/health/redis || echo "Redis health check pending..."

echo ""
echo "✅ Deployment complete!"
