#!/bin/bash
# AetherOS ERP - Backend Configuration Script
# Run this on EC2 after RDS database is created

set -e

echo "🔧 Configuring AetherOS Backend..."

# You'll need to replace these after RDS creation:
RDS_ENDPOINT="aetheros-erp-db.YOUR_RDS_ID.eu-north-1.rds.amazonaws.com"
RDS_PASSWORD="YOUR_DATABASE_PASSWORD"
RDS_DATABASE="aetheros_erp"
RDS_USER="postgres"

# Navigate to backend directory
cd ~/backend

# Install production dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Create .env file
echo "📝 Creating .env file..."
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://${RDS_USER}:${RDS_PASSWORD}@${RDS_ENDPOINT}:5432/${RDS_DATABASE}
JWT_SECRET=${JWT_SECRET}
CORS_ORIGIN=*
LOG_LEVEL=info
EOF

echo "✅ Configuration complete!"
echo ""
echo "📋 Environment variables created:"
cat .env
echo ""
echo "⚠️  IMPORTANT: Edit .env and replace YOUR_RDS_ID and YOUR_DATABASE_PASSWORD"
echo "   Run: nano .env"
echo ""
echo "🔍 Next steps:"
echo "   1. Edit .env with correct RDS endpoint and password"
echo "   2. Test database connection: psql -h \$RDS_ENDPOINT -U postgres -d aetheros_erp"
echo "   3. Run migrations (if you have SQL files)"
echo "   4. Start backend: pm2 start dist/index.js --name aetheros-backend"
