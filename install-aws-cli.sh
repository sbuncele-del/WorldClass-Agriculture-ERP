#!/bin/bash
# Install AWS CLI v2

echo "Installing AWS CLI v2..."

cd /tmp
curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'
unzip -q awscliv2.zip
sudo ./aws/install --update

echo ""
echo "✅ AWS CLI installed"
aws --version

echo ""
echo "Next: Configure AWS credentials"
echo "Run: aws configure"
echo ""
echo "You'll need:"
echo "  - AWS Access Key ID"
echo "  - AWS Secret Access Key"
echo "  - Default region: eu-north-1"
echo "  - Default output format: json"
