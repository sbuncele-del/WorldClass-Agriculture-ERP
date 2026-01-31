#!/bin/bash
# Phase 2 Financial Reports Deployment Script

EC2_INSTANCE="i-0b20fd06fae7e84b1"
S3_BUCKET="aetheros-erp-deployments"
DEPLOY_FILE="backend-phase2-financial-reports.tar.gz"

echo "==== Phase 2 Deployment: Financial Reports ===="
echo "Deploying to EC2 instance: $EC2_INSTANCE"

# Deploy via SSM
aws ssm send-command \
  --instance-ids "$EC2_INSTANCE" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "cd /home/ec2-user/backend",
    "aws s3 cp s3://'"$S3_BUCKET"'/'"$DEPLOY_FILE"' .",
    "tar -xzf '"$DEPLOY_FILE"' --strip-components=1",
    "pm2 restart worldclass-erp-backend",
    "sleep 3",
    "pm2 list"
  ]' \
  --output text \
  --query "Command.CommandId"

echo "✅ Deployment command sent. Backend restarting..."
