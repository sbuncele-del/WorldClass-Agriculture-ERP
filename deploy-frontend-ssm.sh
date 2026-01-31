#!/bin/bash

# Deploy Frontend using AWS Systems Manager (NO SSH KEY NEEDED!)
# Works with your EC2 instance: 51.20.92.38 (i-0b20fd06fae7e84b1)

set -e

INSTANCE_ID="i-0b20fd06fae7e84b1"
EC2_IP="51.20.92.38"

echo "============================================"
echo "  Frontend Deployment via AWS SSM"
echo "  Instance: $EC2_IP ($INSTANCE_ID)"
echo "============================================"
echo ""

# Check if frontend tarball exists
if [ ! -f "/tmp/frontend-dist.tar.gz" ]; then
    if [ -f "frontend/frontend-dist.tar.gz" ]; then
        echo "✓ Found frontend-dist.tar.gz in frontend folder"
        cp frontend/frontend-dist.tar.gz /tmp/
    elif [ -d "frontend/dist" ]; then
        echo "✓ Creating tarball from frontend/dist..."
        cd frontend
        tar -czf /tmp/frontend-dist.tar.gz dist/
        cd ..
    else
        echo "❌ No frontend build found!"
        echo "   Run: cd frontend && npm run build"
        exit 1
    fi
fi

echo "✓ Frontend tarball ready: /tmp/frontend-dist.tar.gz"
echo ""

# Step 1: Upload frontend to S3 (temporary staging)
echo "Step 1: Uploading frontend to S3..."
BUCKET_NAME="worldclass-erp-deployment-temp"

# Create bucket if it doesn't exist
aws s3 mb s3://$BUCKET_NAME --region eu-north-1 2>/dev/null || echo "Bucket already exists"

# Upload tarball
aws s3 cp /tmp/frontend-dist.tar.gz s3://$BUCKET_NAME/frontend-dist.tar.gz
echo "✓ Uploaded to S3"
echo ""

# Step 2: Download and deploy on EC2 via SSM
echo "Step 2: Deploying on EC2 via Systems Manager..."

aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Deploy WorldClass ERP Frontend" \
    --parameters 'commands=[
        "set -e",
        "echo \"Downloading frontend...\"",
        "cd /tmp",
        "aws s3 cp s3://'"$BUCKET_NAME"'/frontend-dist.tar.gz . --region eu-north-1",
        "echo \"Extracting frontend...\"",
        "rm -rf dist/",
        "tar -xzf frontend-dist.tar.gz",
        "echo \"Installing to Nginx (both locations)...\"",
        "sudo rm -rf /var/www/html/*",
        "sudo rm -rf /var/www/aetheros-erp/*",
        "sudo cp -r dist/* /var/www/html/",
        "sudo cp -r dist/* /var/www/aetheros-erp/",
        "sudo chown -R nginx:nginx /var/www/html /var/www/aetheros-erp",
        "echo \"Clearing nginx cache and restarting...\"",
        "sudo rm -rf /var/cache/nginx/*",
        "sudo systemctl restart nginx",
        "echo \"✓ Frontend deployed successfully!\"",
        "echo \"Visit: http://primesources.site/\"",
        "rm -f /tmp/frontend-dist.tar.gz",
        "rm -rf /tmp/dist/"
    ]' \
    --output text \
    --region eu-north-1

echo ""
echo "✓ Deployment command sent!"
echo ""
echo "To check status:"
echo "  aws ssm list-command-invocations --instance-id $INSTANCE_ID --region eu-north-1"
echo ""
echo "Your app will be live at: http://$EC2_IP/"
echo "============================================"
