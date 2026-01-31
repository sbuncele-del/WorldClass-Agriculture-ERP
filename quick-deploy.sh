#!/bin/bash

# Quick Deploy - Backend + Frontend to AWS
INSTANCE_ID="i-0b20fd06fae7e84b1"
BUCKET_NAME="aetheros-erp-deployments"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=========================================="
echo "  Quick Deploy to AWS"
echo "=========================================="

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

# Package backend
echo "📦 Packaging backend..."
cd backend
tar -czf /tmp/backend.tar.gz --exclude='node_modules' --exclude='dist' src/ package.json tsconfig.json
cd ..

# Package frontend
echo "📦 Packaging frontend..."
tar -czf /tmp/frontend.tar.gz -C frontend/dist .

# Upload to S3
echo "📤 Uploading to S3..."
aws s3 mb s3://$BUCKET_NAME 2>/dev/null || true
aws s3 cp /tmp/backend.tar.gz s3://$BUCKET_NAME/backend-$TIMESTAMP.tar.gz
aws s3 cp /tmp/frontend.tar.gz s3://$BUCKET_NAME/frontend-$TIMESTAMP.tar.gz

# Deploy via SSM
echo "🚀 Deploying to EC2..."
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Deploy backend + frontend" \
    --parameters "commands=[
        'set -e',
        'echo \"Downloading packages...\"',
        'aws s3 cp s3://$BUCKET_NAME/backend-$TIMESTAMP.tar.gz /tmp/',
        'aws s3 cp s3://$BUCKET_NAME/frontend-$TIMESTAMP.tar.gz /tmp/',
        'echo \"Deploying backend...\"',
        'cd /home/ec2-user/backend',
        'tar -xzf /tmp/backend.tar.gz',
        'npm install --production',
        'npm run build',
        'pm2 restart all || pm2 start dist/index.js --name backend',
        'echo \"Deploying frontend...\"',
        'sudo rm -rf /var/www/html/*',
        'sudo tar -xzf /tmp/frontend.tar.gz -C /var/www/html/',
        'sudo chown -R nginx:nginx /var/www/html/',
        'sudo systemctl restart nginx',
        'echo \"✅ Deployment complete!\"',
        'pm2 status'
    ]" \
    --output text \
    --query 'Command.CommandId')

echo "Command ID: $COMMAND_ID"
echo "Waiting 30s..."
sleep 30

echo ""
echo "=========================================="
echo "Results:"
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text

echo ""
echo "=========================================="
echo "✅ Done!"
echo "Frontend: http://51.21.219.35"
echo "Backend: http://51.21.219.35:3000"
echo "Login: admin@demo.com / admin123"
