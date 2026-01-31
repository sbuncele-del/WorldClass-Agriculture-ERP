#!/bin/bash

# Deploy Backend Code to EC2 via SSM
INSTANCE_ID="i-0b20fd06fae7e84b1"
LOCAL_BACKEND="./backend"

echo "🚀 Deploying Backend Code via AWS Systems Manager..."
echo "Instance: $INSTANCE_ID"
echo ""

# Step 1: Create tarball of backend code
echo "📦 Step 1: Packaging backend code..."
cd "$LOCAL_BACKEND" || exit 1

# Exclude node_modules and other unnecessary files
tar -czf /tmp/backend-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.env' \
    --exclude='*.log' \
    src/ package.json tsconfig.json

cd - > /dev/null

echo "✅ Package created: $(du -h /tmp/backend-deploy.tar.gz | cut -f1)"
echo ""

# Step 2: Upload to S3 bucket (temporary)
echo "📤 Step 2: Uploading to S3..."
BUCKET_NAME="aetheros-erp-deployments"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create bucket if it doesn't exist
aws s3 mb s3://$BUCKET_NAME 2>/dev/null || echo "Bucket already exists"

# Upload
aws s3 cp /tmp/backend-deploy.tar.gz s3://$BUCKET_NAME/backend-$TIMESTAMP.tar.gz

if [ $? -eq 0 ]; then
    echo "✅ Upload successful"
else
    echo "❌ Upload failed"
    exit 1
fi
echo ""

# Step 3: Deploy on EC2 via SSM
echo "🔧 Step 3: Deploying on EC2..."

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Deploy backend code" \
    --parameters "commands=[
        '#!/bin/bash',
        'set -e',
        'echo \"📥 Downloading deployment package...\"',
        'aws s3 cp s3://$BUCKET_NAME/backend-$TIMESTAMP.tar.gz /tmp/backend-deploy.tar.gz',
        'echo',
        'echo \"💾 Backing up current code...\"',
        'cd /home/ec2-user/backend',
        'if [ -d \"src.backup\" ]; then rm -rf src.backup; fi',
        'if [ -d \"src\" ]; then cp -r src src.backup; fi',
        'echo',
        'echo \"📂 Extracting new code...\"',
        'tar -xzf /tmp/backend-deploy.tar.gz -C /home/ec2-user/backend/',
        'chown -R ec2-user:ec2-user /home/ec2-user/backend/src',
        'echo',
        'echo \"📦 Installing dependencies...\"',
        'cd /home/ec2-user/backend',
        'sudo -u ec2-user npm install',
        'echo',
        'echo \"🔨 Building TypeScript...\"',
        'sudo -u ec2-user npm run build',
        'echo',
        'echo \"🔄 Restarting application...\"',
        'pm2 restart all || pm2 start dist/index.js --name backend',
        'echo',
        'echo \"✅ Deployment complete!\"',
        'pm2 status',
        'pm2 logs --lines 10 --nostream'
    ]" \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 30 seconds for deployment..."
sleep 30

echo ""
echo "📊 Deployment Results:"
echo "=========================================="
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query '[Status,StandardOutputContent]' \
    --output text

echo ""
echo "=========================================="
echo ""

# Check for errors
echo "🔍 Checking for errors..."
ERRORS=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardErrorContent' \
    --output text)

if [ -n "$ERRORS" ] && [ "$ERRORS" != "None" ]; then
    echo "⚠️  Errors detected:"
    echo "$ERRORS"
else
    echo "✅ No errors detected"
fi

echo ""
echo "🧹 Cleaning up..."
rm -f /tmp/backend-deploy.tar.gz
aws s3 rm s3://$BUCKET_NAME/backend-$TIMESTAMP.tar.gz

echo ""
echo "✅ Deployment process complete!"
echo ""
echo "To check status: aws ssm start-session --target $INSTANCE_ID"
echo "To view logs: Run 'pm2 logs' in the SSM session"
