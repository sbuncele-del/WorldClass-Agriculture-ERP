#!/bin/bash
# Fix Backend DATABASE_URL - Run this from AWS Console CloudShell or local terminal with valid AWS credentials
# Region: af-south-1 (Cape Town)

set -e

echo "=== Fixing Backend DATABASE_URL ==="
echo "Region: af-south-1"
echo ""

# Step 1: Register new task definition
echo "Step 1: Registering new task definition..."
aws ecs register-task-definition \
  --cli-input-json file://deploy/backend-task-definition.json \
  --region af-south-1

# Step 2: Update the service to use new task definition
echo ""
echo "Step 2: Updating ECS service..."
aws ecs update-service \
  --cluster worldclass-erp-cluster \
  --service worldclass-erp-backend \
  --task-definition worldclass-erp-backend \
  --force-new-deployment \
  --region af-south-1

echo ""
echo "=== Done! ==="
echo "Wait 2-3 minutes for the new task to start."
echo ""
echo "Test with:"
echo "  curl -sk 'https://siyabusaerp.co.za/api/cash-management/cash-position' -H 'Authorization: Bearer <TOKEN>'"
