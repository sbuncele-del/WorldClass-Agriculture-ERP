#!/bin/bash

# ================================================
# DEPLOY MULTI-TENANT SCHEMA TO AWS RDS
# ================================================

echo "🚀 AetherOS ERP - Multi-Tenant Schema Deployment"
echo "================================================"
echo ""

# AWS RDS Details
RDS_HOST="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB="aetheros_erp"
RDS_USER="postgres"
RDS_PASSWORD="caxMex-0putca-dyjnah"

# Connection string
CONN_STRING="postgresql://${RDS_USER}:${RDS_PASSWORD}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}"

echo "📋 Deployment Options:"
echo "  1. Deploy via EC2 SSH (Recommended)"
echo "  2. Deploy directly from local (requires VPN/bastion)"
echo "  3. Show SQL file for manual deployment"
echo ""
read -p "Select option (1-3): " OPTION

case $OPTION in
  1)
    echo ""
    echo "📡 Connecting to EC2 instance..."
    echo ""
    
    # Check if SSH key exists
    if [ ! -f ~/.ssh/aetheros-aws.pem ]; then
      echo "❌ SSH key not found at ~/.ssh/aetheros-aws.pem"
      echo "Please ensure your AWS key pair is in the correct location."
      exit 1
    fi
    
    # SSH into EC2 and execute
    ssh -i ~/.ssh/aetheros-aws.pem ec2-user@51.21.219.35 << 'ENDSSH'
      echo "📂 Creating SQL file on EC2..."
      cat > /tmp/multi-tenant-schema.sql << 'EOF'
ENDSSH
    
    # Append the SQL file content
    cat src/config/multi-tenant-schema.sql | ssh -i ~/.ssh/aetheros-aws.pem ec2-user@51.21.219.35 "cat >> /tmp/multi-tenant-schema.sql"
    
    # Continue SSH session to run the migration
    ssh -i ~/.ssh/aetheros-aws.pem ec2-user@51.21.219.35 << ENDSSH
      echo ""
      echo "🔄 Running migration..."
      psql "${CONN_STRING}" -f /tmp/multi-tenant-schema.sql
      
      if [ \$? -eq 0 ]; then
        echo ""
        echo "✅ Migration completed successfully!"
        echo ""
        echo "🔍 Verifying deployment..."
        
        # Verify tables
        psql "${CONN_STRING}" -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('tenants', 'users', 'demo_tenants') ORDER BY table_name;"
        
        echo ""
        echo "📊 Checking demo tenant..."
        psql "${CONN_STRING}" -c "SELECT id, name, slug, status FROM tenants WHERE slug = 'demo';"
        
        echo ""
        echo "👤 Checking demo user..."
        psql "${CONN_STRING}" -c "SELECT id, email, role FROM users WHERE email = 'demo@aetheros.co.za';"
        
        echo ""
        echo "🎉 Deployment Complete!"
        echo ""
        echo "Demo Credentials:"
        echo "  Email: demo@aetheros.co.za"
        echo "  Password: Demo123!"
        
        # Cleanup
        rm /tmp/multi-tenant-schema.sql
      else
        echo ""
        echo "❌ Migration failed! Check the error messages above."
        exit 1
      fi
ENDSSH
    ;;
    
  2)
    echo ""
    echo "📡 Deploying directly from local machine..."
    echo ""
    
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
      echo "❌ psql not found. Please install PostgreSQL client first."
      exit 1
    fi
    
    echo "🔄 Running migration..."
    psql "${CONN_STRING}" -f src/config/multi-tenant-schema.sql
    
    if [ $? -eq 0 ]; then
      echo ""
      echo "✅ Migration completed successfully!"
      echo ""
      echo "🔍 Verifying deployment..."
      psql "${CONN_STRING}" -c "SELECT COUNT(*) as tenant_tables FROM information_schema.tables WHERE table_name IN ('tenants', 'users', 'demo_tenants');"
      
      echo ""
      echo "🎉 Deployment Complete!"
    else
      echo ""
      echo "❌ Migration failed! Check the error messages above."
      exit 1
    fi
    ;;
    
  3)
    echo ""
    echo "📄 SQL File Location:"
    echo "  src/config/multi-tenant-schema.sql"
    echo ""
    echo "📋 Manual Deployment Steps:"
    echo ""
    echo "1. Copy SQL file to EC2:"
    echo "   scp -i ~/.ssh/aetheros-aws.pem src/config/multi-tenant-schema.sql ec2-user@51.21.219.35:/tmp/"
    echo ""
    echo "2. SSH into EC2:"
    echo "   ssh -i ~/.ssh/aetheros-aws.pem ec2-user@51.21.219.35"
    echo ""
    echo "3. Run migration:"
    echo "   psql \"${CONN_STRING}\" -f /tmp/multi-tenant-schema.sql"
    echo ""
    echo "4. Verify:"
    echo "   psql \"${CONN_STRING}\" -c \"SELECT * FROM tenants;\""
    echo ""
    ;;
    
  *)
    echo "❌ Invalid option selected"
    exit 1
    ;;
esac
