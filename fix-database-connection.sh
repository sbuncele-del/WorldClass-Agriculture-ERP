#!/bin/bash

# Fix the database connection by setting the correct environment variables
# The backend uses DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, not DATABASE_URL

INSTANCE_ID="i-0b20fd06fae7e84b1"
REGION="eu-north-1"

echo "Creating correct PM2 ecosystem config..."

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
    "      DB_HOST: '\''aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com'\'',",
    "      DB_PORT: '\''5432'\'',",
    "      DB_NAME: '\''aetheros_erp'\'',",
    "      DB_USER: '\''postgres'\'',",
    "      DB_PASSWORD: '\''caxMex-0putca-dyjnah'\'',",
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
    "echo '\''✅ Ecosystem config created with correct DB variables'\''",
    "cat ecosystem.config.js"
  ]' \
  --region "$REGION" \
  --output text \
  --query 'Command.CommandId')

echo "Command ID: $COMMAND_ID"
sleep 5

aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --region "$REGION" \
  --query 'StandardOutputContent' \
  --output text

echo ""
echo "Restarting PM2 with correct database configuration..."

COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "cd /home/ssm-user/backend",
    "pm2 delete worldclass-erp || true",
    "pm2 start ecosystem.config.js",
    "pm2 save",
    "sleep 4",
    "echo '\''=== PM2 Status ==='\'",",
    "pm2 status",
    "echo '\''\\n=== Application Logs ==='\'",",
    "pm2 logs worldclass-erp --lines 20 --nostream"
  ]' \
  --region "$REGION" \
  --output text \
  --query 'Command.CommandId')

echo "Command ID: $COMMAND_ID"
sleep 8

aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --region "$REGION" \
  --query 'StandardOutputContent' \
  --output text

echo ""
echo "✅ Backend restarted with RDS database connection!"
echo ""
echo "Frontend: http://worldclass-erp-frontend.s3-website.eu-north-1.amazonaws.com"
echo "Backend: http://51.20.92.38:3000"
echo ""
echo "Try logging in now with: admin@demo.com / admin123"
