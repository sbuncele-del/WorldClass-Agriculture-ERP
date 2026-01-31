#!/bin/bash

# Start EC2 Instance and Check Status
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "=========================================="
echo "  Starting EC2 Instance"
echo "=========================================="
echo ""

# Check if running in Codespaces or local
if [ -f "/usr/local/bin/aws" ]; then
    AWS_CMD="/usr/local/bin/aws"
elif [ -f "/usr/bin/aws" ]; then
    AWS_CMD="/usr/bin/aws"
elif command -v aws &> /dev/null; then
    AWS_CMD="aws"
else
    echo "❌ AWS CLI not found in PATH"
    echo "Trying common locations..."
    AWS_CMD=$(find /usr -name aws 2>/dev/null | head -1)
    if [ -z "$AWS_CMD" ]; then
        echo "❌ Cannot find AWS CLI"
        echo ""
        echo "Please install AWS CLI:"
        echo "  curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
        echo "  unzip awscliv2.zip"
        echo "  sudo ./aws/install"
        exit 1
    fi
fi

echo "✅ Using AWS CLI: $AWS_CMD"
echo ""

# Check instance status
echo "Checking instance status..."
STATUS=$($AWS_CMD ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].State.Name' \
    --output text 2>&1)

if echo "$STATUS" | grep -q "UnauthorizedOperation\|InvalidClientTokenId"; then
    echo "❌ AWS credentials not configured or invalid"
    echo "Run: aws configure"
    exit 1
fi

echo "Current status: $STATUS"
echo ""

if [ "$STATUS" = "running" ]; then
    echo "✅ Instance is already running"
elif [ "$STATUS" = "stopped" ]; then
    echo "🚀 Starting instance..."
    $AWS_CMD ec2 start-instances --instance-ids $INSTANCE_ID
    
    echo "⏳ Waiting for instance to start..."
    $AWS_CMD ec2 wait instance-running --instance-ids $INSTANCE_ID
    
    echo "✅ Instance started!"
else
    echo "⚠️  Instance is in '$STATUS' state"
fi

# Get public IP
echo ""
echo "Getting public IP..."
PUBLIC_IP=$($AWS_CMD ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo ""
echo "=========================================="
echo "  Instance Ready!"
echo "=========================================="
echo "Public IP: $PUBLIC_IP"
echo "Frontend: http://$PUBLIC_IP"
echo "Backend: http://$PUBLIC_IP:3000"
echo ""
echo "Testing connection..."
sleep 5

# Test backend
if curl -s --max-time 5 "http://$PUBLIC_IP:3000/health" > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "⚠️  Backend not responding yet (may still be starting)"
    echo "   Try: curl http://$PUBLIC_IP:3000/health"
fi

echo ""
echo "To deploy new code, run: ./quick-deploy.sh"
