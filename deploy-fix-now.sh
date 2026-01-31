#!/bin/bash
set -e

echo "🔧 Deploying corrected ecosystem.config.js..."

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "i-0b20fd06fae7e84b1" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "cd /home/ec2-user/backend",
        "cat > ecosystem.config.js << '"'"'EOFCONFIG'"'"'",
        "module.exports = {",
        "  apps: [{",
        "    name: '"'"'erp-backend'"'"',",
        "    script: '"'"'src/index.ts'"'"',",
        "    interpreter: '"'"'ts-node'"'"',",
        "    instances: 1,",
        "    exec_mode: '"'"'fork'"'"',",
        "    watch: false,",
        "    max_memory_restart: '"'"'1G'"'"',",
        "    env: {",
        "      NODE_ENV: '"'"'production'"'"',",
        "      PORT: '"'"'3000'"'"',",
        "      DATABASE_URL: '"'"'postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/postgres'"'"',",
        "      JWT_SECRET: '"'"'aetheros-super-secret-key-change-in-production-2024'"'"',",
        "      JWT_EXPIRY: '"'"'24h'"'"',",
        "      SMTP_HOST: '"'"'smtp.sendgrid.net'"'"',",
        "      SMTP_PORT: '"'"'587'"'"',",
        "      SMTP_USER: '"'"'apikey'"'"',",
        "      SMTP_PASSWORD: '"'"'SENDGRID_API_KEY_PLACEHOLDER.XZ9TjxHkY3Gxf0NHUV53MLRGTYwz7CqSZ7hZs-8aAHs'"'"',",
        "      EMAIL_FROM: '"'"'noreply@primesources.site'"'"',",
        "      REDIS_HOST: '"'"'localhost'"'"',",
        "      REDIS_PORT: '"'"'6379'"'"',",
        "      AWS_REGION: '"'"'eu-north-1'"'"',",
        "      AWS_S3_BUCKET: '"'"'aetheros-erp-deployments'"'"',",
        "      API_BASE_URL: '"'"'http://51.20.67.228:3000'"'"',",
        "      CORS_ORIGIN: '"'"'*'"'"',",
        "      LOG_LEVEL: '"'"'info'"'"'",
        "    }",
        "  }]",
        "};",
        "EOFCONFIG",
        "cat ecosystem.config.js",
        "pm2 delete erp-backend 2>/dev/null || true",
        "pm2 start ecosystem.config.js",
        "pm2 save",
        "sleep 4",
        "pm2 list",
        "pm2 logs erp-backend --lines 20 --nostream"
    ]' \
    --region eu-north-1 \
    --output json | jq -r '.Command.CommandId')

echo "Command ID: $COMMAND_ID"
echo ""
echo "Waiting 12 seconds for deployment..."
sleep 12

echo ""
echo "Getting results..."
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "i-0b20fd06fae7e84b1" \
    --region eu-north-1 \
    --query 'StandardOutputContent' \
    --output text

echo ""
echo "Testing connection..."
sleep 2
curl -X POST http://51.20.67.228:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' 2>&1 | head -20

echo ""
echo "✅ Done!"
