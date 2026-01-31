#!/bin/bash

# Fix PM2 environment variable loading issue
# The .env file is not being read by PM2, so we'll use an ecosystem config file instead

INSTANCE_ID="i-0b20fd06fae7e84b1"
REGION="eu-north-1"

echo "Creating PM2 ecosystem config with environment variables..."

# Create ecosystem.config.js on EC2
COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "cd /home/ssm-user/backend",
    "cat > ecosystem.config.js << '\''EOF'\''",
    "module.exports = {",
    "  apps: [{",
    "    name: '\''worldclass-erp'\'',",
    "    script: '\''dist/index.js'\'',",
    "    instances: 1,",
    "    autorestart: true,",
    "    watch: false,",
    "    max_memory_restart: '\''1G'\'',",
    "    env: {",
    "      NODE_ENV: '\''production'\'',",
    "      PORT: '\''3000'\'',",
    "      DATABASE_URL: '\''postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp'\'',",
    "      JWT_SECRET: '\''worldclass-erp-production-secret-2025-very-long-and-secure'\'',",
    "      JWT_EXPIRY: '\''24h'\'',",
    "      REFRESH_TOKEN_EXPIRY: '\''7d'\'',",
    "      CORS_ORIGIN: '\''*'\'',",
    "      DEMO_MODE: '\''true'\'',",
    "      APP_URL: '\''http://worldclass-erp-frontend.s3-website.eu-north-1.amazonaws.com'\'',",
    "      API_URL: '\''http://51.20.92.38:3000'\''",
    "    }",
    "  }]",
    "};",
    "EOF",
    "echo '\''Ecosystem config created'\''",
    "cat ecosystem.config.js"
  ]' \
  --region "$REGION" \
  --output text \
  --query 'Command.CommandId')

echo "Command ID: $COMMAND_ID"
echo "Waiting for ecosystem config creation..."
sleep 5

# Check the result
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --region "$REGION" \
  --query 'StandardOutputContent' \
  --output text

echo ""
echo "Restarting PM2 with ecosystem config..."

# Restart PM2 with ecosystem config
COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "cd /home/ssm-user/backend",
    "pm2 delete worldclass-erp || true",
    "pm2 start ecosystem.config.js",
    "pm2 save",
    "sleep 3",
    "pm2 status",
    "echo '\''--- Recent Logs ---'\''",
    "pm2 logs worldclass-erp --lines 10 --nostream"
  ]' \
  --region "$REGION" \
  --output text \
  --query 'Command.CommandId')

echo "Command ID: $COMMAND_ID"
echo "Waiting for PM2 restart..."
sleep 8

# Check the result
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --region "$REGION" \
  --query 'StandardOutputContent' \
  --output text

echo ""
echo "✅ PM2 restarted with ecosystem config"
echo "The backend should now connect to RDS database"
echo ""
echo "Frontend: http://worldclass-erp-frontend.s3-website.eu-north-1.amazonaws.com"
echo "Backend: http://51.20.92.38:3000"
echo ""
echo "Try logging in with: admin@demo.com / admin123"
