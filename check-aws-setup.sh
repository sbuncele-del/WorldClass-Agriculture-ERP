#!/bin/bash

echo "================================================"
echo "   AWS Textract Configuration Check"
echo "================================================"
echo ""

# Check if backend .env file exists
if [ -f "backend/.env" ]; then
    echo "✅ backend/.env file found"
    
    # Check for AWS credentials
    if grep -q "AWS_REGION" backend/.env; then
        AWS_REGION=$(grep "AWS_REGION" backend/.env | cut -d'=' -f2)
        echo "✅ AWS_REGION: $AWS_REGION"
    else
        echo "❌ AWS_REGION not found in .env"
    fi
    
    if grep -q "AWS_ACCESS_KEY_ID" backend/.env; then
        echo "✅ AWS_ACCESS_KEY_ID is set"
    else
        echo "❌ AWS_ACCESS_KEY_ID not found in .env"
    fi
    
    if grep -q "AWS_SECRET_ACCESS_KEY" backend/.env; then
        echo "✅ AWS_SECRET_ACCESS_KEY is set"
    else
        echo "❌ AWS_SECRET_ACCESS_KEY not found in .env"
    fi
else
    echo "❌ backend/.env file not found"
    echo ""
    echo "Creating backend/.env file..."
    
    # Create .env file with template
    cat > backend/.env <<EOF
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/worldclass_erp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=worldclass_erp
DB_USER=user
DB_PASSWORD=password

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AWS Configuration for Textract
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
EOF
    
    echo "✅ Created backend/.env file with template"
    echo "⚠️  Please update AWS credentials in backend/.env"
fi

echo ""
echo "================================================"
echo "   Checking AWS SDK Installation"
echo "================================================"
echo ""

cd backend

if [ -f "package.json" ]; then
    if grep -q "@aws-sdk/client-textract" package.json; then
        echo "✅ @aws-sdk/client-textract is in package.json"
        
        if [ -d "node_modules/@aws-sdk/client-textract" ]; then
            echo "✅ @aws-sdk/client-textract is installed"
        else
            echo "⚠️  @aws-sdk/client-textract not found in node_modules"
            echo "   Run: cd backend && npm install"
        fi
    else
        echo "❌ @aws-sdk/client-textract not in package.json"
    fi
fi

cd ..

echo ""
echo "================================================"
echo "   Action Items"
echo "================================================"
echo ""
echo "1. Update AWS credentials in backend/.env:"
echo "   - Get credentials from AWS IAM Console"
echo "   - Ensure IAM user has Textract permissions"
echo ""
echo "2. Install dependencies if needed:"
echo "   cd backend && npm install"
echo ""
echo "3. Restart backend server to load new credentials"
echo ""
echo "================================================"
