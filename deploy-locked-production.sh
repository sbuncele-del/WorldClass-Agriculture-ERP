#!/bin/bash

# Deploy ERP Backend with Locked Production Image
# Date: December 30, 2025
# Purpose: Deploy the locked production image with all authentication fixes

echo "🚀 Deploying ERP Backend - Production Locked Version"
echo "Date: $(date)"

# Configuration
IMAGE_NAME="erp-backend:production-locked-dec30-2025"
CONTAINER_NAME="erp-backend-production"
PORT="3000"
S3_BACKUP="s3://aetheros-erp-deployments/docker/erp-backend-production-locked-dec30-2025.tar.gz"

echo "📋 Configuration:"
echo "  Image: $IMAGE_NAME"
echo "  Container: $CONTAINER_NAME"  
echo "  Port: $PORT"
echo "  S3 Backup: $S3_BACKUP"

# Stop and remove existing container
echo "🛑 Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || echo "No existing container to stop"
docker rm $CONTAINER_NAME 2>/dev/null || echo "No existing container to remove"

# Check if image exists locally, if not download from S3
if ! docker images | grep -q "erp-backend.*production-locked-dec30-2025"; then
    echo "📥 Image not found locally, downloading from S3..."
    aws s3 cp $S3_BACKUP /tmp/erp-backend-production-locked.tar.gz
    docker load < /tmp/erp-backend-production-locked.tar.gz
    rm /tmp/erp-backend-production-locked.tar.gz
    echo "✅ Image loaded from S3 backup"
else
    echo "✅ Image found locally"
fi

# Start new container with locked image
echo "🚀 Starting container with locked production image..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:$PORT \
    --restart unless-stopped \
    $IMAGE_NAME

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Health check
echo "🔍 Performing health check..."
HEALTH_RESPONSE=$(curl -s http://localhost:$PORT/health || echo "FAILED")

if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo "✅ Health check passed!"
    echo "✅ ERP Backend deployed successfully with locked production image"
    echo ""
    echo "🌐 Access URLs:"
    echo "  Health: http://localhost:$PORT/health"
    echo "  Login: http://localhost:$PORT/api/auth/login"
    echo "  Frontend: http://primesources.site"
    echo ""
    echo "🔐 Login Credentials:"
    echo "  Email: Sibusiso@sgbsgroup.co.za"
    echo "  Password: Masaphokati2025!"
    echo ""
    echo "📊 Container Status:"
    docker ps | grep erp-backend
else
    echo "❌ Health check failed!"
    echo "Response: $HEALTH_RESPONSE"
    echo "📋 Container logs:"
    docker logs $CONTAINER_NAME --tail 20
    exit 1
fi