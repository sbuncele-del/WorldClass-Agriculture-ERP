#!/bin/bash

# Quick deployment helper - SSH and deploy
echo "🚀 Deploying Multi-Tenant Schema to AWS RDS"
echo ""
echo "This will:"
echo "  1. SSH into EC2 (51.21.219.35)"
echo "  2. Upload SQL schema file"
echo "  3. Run migration on RDS"
echo "  4. Verify deployment"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo "📤 Copying SQL file to EC2..."
scp -i ~/.ssh/aetheros-aws.pem backend/src/config/multi-tenant-schema.sql ec2-user@51.21.219.35:/tmp/

echo "🔄 Running migration..."
ssh -i ~/.ssh/aetheros-aws.pem ec2-user@51.21.219.35 << 'EOF'
    psql "postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp" -f /tmp/multi-tenant-schema.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration successful!"
        echo ""
        echo "🔍 Demo Tenant:"
        psql "postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp" -c "SELECT id, name, slug, status FROM tenants WHERE slug = 'demo';"
        
        echo ""
        echo "👤 Demo User:"
        psql "postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp" -c "SELECT id, email, role FROM users WHERE email = 'demo@aetheros.co.za';"
        
        echo ""
        echo "🎉 Deployment Complete!"
        echo "Demo Login: demo@aetheros.co.za / Demo123!"
        
        rm /tmp/multi-tenant-schema.sql
    else
        echo "❌ Migration failed!"
        exit 1
    fi
EOF

echo ""
echo "✨ All done!"
