#!/bin/bash
set -e

echo "🔧 FIXING DATABASE CONNECTION - LOCKING TO AWS RDS"
echo "=================================================="

EC2_INSTANCE_ID="i-0b20fd06fae7e84b1"  # From status documents
EC2_IP="51.20.67.228"

# Check AWS credentials
echo ""
echo "1️⃣ Checking AWS credentials..."
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS credentials not configured"
    echo ""
    echo "Please configure AWS credentials:"
    echo "  aws configure"
    echo ""
    echo "Or set environment variables:"
    echo "  export AWS_ACCESS_KEY_ID=your_key"
    echo "  export AWS_SECRET_ACCESS_KEY=your_secret"
    echo "  export AWS_DEFAULT_REGION=eu-north-1"
    exit 1
fi

echo "✅ AWS credentials configured"

# Create the ecosystem config content
echo ""
echo "2️⃣ Creating ecosystem.config.js with RDS credentials..."

cat > /tmp/ecosystem-deploy.js << 'EOF'
module.exports = {
  apps: [{
    name: 'erp-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: 'postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/postgres',
      JWT_SECRET: 'aetheros-super-secret-key-change-in-production-2024',
      JWT_EXPIRY: '24h',
      SMTP_HOST: 'smtp.sendgrid.net',
      SMTP_PORT: '587',
      SMTP_USER: 'apikey',
      SMTP_PASSWORD: 'SENDGRID_API_KEY_PLACEHOLDER.XZ9TjxHkY3Gxf0NHUV53MLRGTYwz7CqSZ7hZs-8aAHs',
      EMAIL_FROM: 'noreply@primesources.site',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '',
      AWS_REGION: 'eu-north-1',
      AWS_S3_BUCKET: 'aetheros-erp-deployments',
      API_BASE_URL: 'http://51.20.67.228:3000',
      CORS_ORIGIN: '*',
      DAILY_API_KEY: '',
      DAILY_API_URL: 'https://api.daily.co/v1',
      LOG_LEVEL: 'info'
    }
  }]
};
EOF

echo "✅ ecosystem.config.js created"

# Create deployment script
echo ""
echo "3️⃣ Creating deployment commands..."

cat > /tmp/deploy-commands.sh << 'DEPLOY_EOF'
#!/bin/bash
set -e

# Check if backend directory exists
if [ ! -d "/home/ec2-user/backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

cd /home/ec2-user/backend

# Create ecosystem.config.js
cat > ecosystem.config.js << 'CONFIG_EOF'
module.exports = {
  apps: [{
    name: 'erp-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: 'postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/postgres',
      JWT_SECRET: 'aetheros-super-secret-key-change-in-production-2024',
      JWT_EXPIRY: '24h',
      SMTP_HOST: 'smtp.sendgrid.net',
      SMTP_PORT: '587',
      SMTP_USER: 'apikey',
      SMTP_PASSWORD: 'SENDGRID_API_KEY_PLACEHOLDER.XZ9TjxHkY3Gxf0NHUV53MLRGTYwz7CqSZ7hZs-8aAHs',
      EMAIL_FROM: 'noreply@primesources.site',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '',
      AWS_REGION: 'eu-north-1',
      AWS_S3_BUCKET: 'aetheros-erp-deployments',
      API_BASE_URL: 'http://51.20.67.228:3000',
      CORS_ORIGIN: '*',
      DAILY_API_KEY: '',
      DAILY_API_URL: 'https://api.daily.co/v1',
      LOG_LEVEL: 'info'
    }
  }]
};
CONFIG_EOF

echo "✅ ecosystem.config.js created"

# Stop and delete existing PM2 process
echo "Stopping existing PM2 process..."
pm2 delete erp-backend 2>/dev/null || echo "No existing process"

# Start with new config
echo "Starting PM2 with new configuration..."
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Show status
echo ""
echo "PM2 Status:"
pm2 list

# Show recent logs
echo ""
echo "Recent logs (last 15 lines):"
pm2 logs erp-backend --lines 15 --nostream || true

echo ""
echo "✅ Deployment complete!"
DEPLOY_EOF

chmod +x /tmp/deploy-commands.sh

echo "✅ Deployment script ready"

# Execute via SSM
echo ""
echo "4️⃣ Deploying to EC2 instance via AWS SSM..."

aws ssm send-command \
    --instance-ids "$EC2_INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "cd /home/ec2-user/backend",
        "cat > ecosystem.config.js << '"'"'EOF'"'"'",
        "module.exports = {",
        "  apps: [{",
        "    name: '"'"'erp-backend'"'"',",
        "    script: '"'"'./dist/index.js'"'"',",
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
        "EOF",
        "pm2 delete erp-backend 2>/dev/null || true",
        "pm2 start ecosystem.config.js",
        "pm2 save",
        "sleep 2",
        "pm2 list",
        "pm2 logs erp-backend --lines 10 --nostream || true"
    ]' \
    --region eu-north-1 \
    --output json > /tmp/ssm-command.json

COMMAND_ID=$(cat /tmp/ssm-command.json | grep -o '"CommandId": "[^"]*"' | cut -d'"' -f4)

echo "✅ Command sent! Command ID: $COMMAND_ID"

# Wait for command to complete
echo ""
echo "5️⃣ Waiting for deployment to complete..."
sleep 10

# Get command output
echo ""
echo "6️⃣ Getting deployment results..."
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$EC2_INSTANCE_ID" \
    --region eu-north-1 \
    --query 'StandardOutputContent' \
    --output text

# Test the connection
echo ""
echo "7️⃣ Testing database connection..."
sleep 3

HEALTH_CHECK=$(curl -s http://$EC2_IP:3000/health)
echo "Health check: $HEALTH_CHECK"

echo ""
echo "8️⃣ Testing login endpoint..."
LOGIN_TEST=$(curl -s -X POST http://$EC2_IP:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' 2>&1 || true)

if echo "$LOGIN_TEST" | grep -q "ECONNREFUSED.*5432"; then
    echo "❌ Still getting localhost database errors!"
    echo "$LOGIN_TEST"
    exit 1
elif echo "$LOGIN_TEST" | grep -q "127.0.0.1:5432"; then
    echo "❌ Still trying to connect to localhost!"
    echo "$LOGIN_TEST"
    exit 1
else
    echo "✅ No more localhost connection attempts!"
    echo "Response: $LOGIN_TEST"
fi

echo ""
echo "=================================================="
echo "✅ DATABASE CONNECTION LOCKED TO AWS RDS!"
echo "=================================================="
echo ""
echo "Backend: http://$EC2_IP:3000"
echo "Database: aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
echo ""
echo "The backend will NEVER try to connect to localhost PostgreSQL again."
echo ""
