#!/bin/bash

# Connect Backend to RDS Database
# This script updates the backend .env file to use the RDS database

set -e

echo "════════════════════════════════════════"
echo "  Connect Backend to AWS RDS"
echo "════════════════════════════════════════"
echo ""

# RDS Configuration
RDS_ENDPOINT="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_USER="postgres"
RDS_DATABASE="aetheros_erp"
BACKEND_IP="51.21.219.35"
SSH_KEY="$HOME/.ssh/worldclass-erp-key.pem"

echo "📊 RDS Database Details:"
echo "   Endpoint: $RDS_ENDPOINT"
echo "   Port: $RDS_PORT"
echo "   Database: $RDS_DATABASE"
echo "   User: $RDS_USER"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found at $SSH_KEY"
    echo "Please ensure you have the SSH key to access the backend server"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Test RDS Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Enter your RDS database password: " -s 
echo ""

# Test connection from local machine
echo "🔍 Testing RDS connection..."
if command -v psql &> /dev/null; then
    PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -c "SELECT version();" &> /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ RDS connection successful!"
    else
        echo "⚠️  Could not connect from local machine (this is OK if you're not in the VPC)"
    fi
else
    echo "⚠️  psql not installed locally, will test from backend server"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Backup Current Backend .env"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh -i "$SSH_KEY" ubuntu@$BACKEND_IP << 'ENDSSH'
cd /home/ubuntu/worldclass-erp/backend

# Backup existing .env if it exists
if [ -f .env ]; then
    echo "📦 Backing up current .env to .env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
else
    echo "ℹ️  No existing .env file found"
fi
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Create New .env with RDS Config"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create .env content
cat > /tmp/backend-rds.env << ENVFILE
# Database Configuration - AWS RDS
DB_HOST=$RDS_ENDPOINT
DB_PORT=$RDS_PORT
DB_NAME=$RDS_DATABASE
DB_USER=$RDS_USER
DB_PASSWORD=$RDS_PASSWORD
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# Alternative format (if backend uses different var names)
DATABASE_URL=postgresql://$RDS_USER:$RDS_PASSWORD@$RDS_ENDPOINT:$RDS_PORT/$RDS_DATABASE?sslmode=require

# Node Environment
NODE_ENV=production
PORT=3000

# JWT Secret (generate a secure one if not set)
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com

# AWS Configuration
AWS_REGION=eu-north-1

# Email Configuration (if using SES)
EMAIL_FROM=noreply@aetheros.co.za

# Logging
LOG_LEVEL=info
ENVFILE

echo "📝 Created .env configuration"

# Copy to backend server
echo "📤 Uploading .env to backend server..."
scp -i "$SSH_KEY" /tmp/backend-rds.env ubuntu@$BACKEND_IP:/home/ubuntu/worldclass-erp/backend/.env

# Clean up local temp file
rm /tmp/backend-rds.env

echo "✅ .env file uploaded"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Test Database Connection from Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh -i "$SSH_KEY" ubuntu@$BACKEND_IP << ENDSSH
cd /home/ubuntu/worldclass-erp/backend

# Install psql if not present
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL client..."
    sudo apt-get update -qq
    sudo apt-get install -y postgresql-client
fi

# Load environment variables
export \$(cat .env | grep -v '^#' | xargs)

# Test connection
echo "🔍 Testing database connection from backend server..."
PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -c "SELECT version();"

if [ \$? -eq 0 ]; then
    echo ""
    echo "✅ Backend can connect to RDS!"
else
    echo ""
    echo "❌ Connection failed. Check security groups and credentials."
    exit 1
fi
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Check Database Schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh -i "$SSH_KEY" ubuntu@$BACKEND_IP << ENDSSH
cd /home/ubuntu/worldclass-erp/backend
export \$(cat .env | grep -v '^#' | xargs)

echo "📊 Checking existing database schemas..."
PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -c "\dn"

echo ""
echo "📋 Checking existing tables..."
PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY schemaname, tablename;"
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 6: Install Dependencies (if needed)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh -i "$SSH_KEY" ubuntu@$BACKEND_IP << 'ENDSSH'
cd /home/ubuntu/worldclass-erp/backend

# Check if pg module is installed
if ! npm list pg &> /dev/null; then
    echo "📦 Installing PostgreSQL driver..."
    npm install pg
fi

# Check if dotenv is installed
if ! npm list dotenv &> /dev/null; then
    echo "📦 Installing dotenv..."
    npm install dotenv
fi

echo "✅ Dependencies checked"
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 7: Restart Backend Service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh -i "$SSH_KEY" ubuntu@$BACKEND_IP << 'ENDSSH'
# Check if PM2 is being used
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting backend with PM2..."
    cd /home/ubuntu/worldclass-erp/backend
    pm2 restart all --update-env
    pm2 save
    
    echo ""
    echo "📊 PM2 Status:"
    pm2 list
    
    echo ""
    echo "📋 Recent logs:"
    pm2 logs --lines 20 --nostream
else
    echo "⚠️  PM2 not found. Please restart your backend manually."
    echo "   You may need to run: node server.js or npm start"
fi
ENDSSH

echo ""
echo "════════════════════════════════════════"
echo "   ✅ BACKEND CONNECTED TO RDS!"
echo "════════════════════════════════════════"
echo ""
echo "🎯 Next Steps:"
echo "   1. Run database migrations: ./migrate-database-schema.sh"
echo "   2. Test API endpoints"
echo "   3. Check logs: ssh ubuntu@$BACKEND_IP 'pm2 logs'"
echo ""
echo "🌐 Backend API: http://$BACKEND_IP:3000"
echo "🗄️  Database: $RDS_ENDPOINT"
echo ""
