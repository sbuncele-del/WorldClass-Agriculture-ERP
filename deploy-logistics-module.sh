#!/bin/bash

echo "=========================================="
echo "  Logistics Module - Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
PRODUCTION_SERVER="ec2-user@51.20.92.38"

# Function to print status
print_status() {
    echo -e "${BLUE}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Error: Must be run from project root directory"
    exit 1
fi

echo "=========================================="
echo "  Step 1: Backend Setup"
echo "=========================================="
echo ""

print_status "Checking backend dependencies..."
cd $BACKEND_DIR

if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies already installed"
fi

# Check for AWS SDK
if grep -q "@aws-sdk/client-textract" package.json; then
    print_success "AWS Textract SDK found"
else
    print_error "AWS Textract SDK not found in package.json"
    exit 1
fi

# Check environment file
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    print_status "Creating .env from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env file"
        print_warning "⚠️  Please configure AWS credentials in backend/.env"
    else
        print_error ".env.example not found"
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Check AWS configuration
print_status "Checking AWS configuration..."
if grep -q "AWS_ACCESS_KEY_ID=your_aws_access_key" .env; then
    print_warning "AWS credentials not configured yet"
    print_warning "Please update backend/.env with real AWS credentials"
else
    if grep -q "AWS_ACCESS_KEY_ID" .env && grep -q "AWS_SECRET_ACCESS_KEY" .env; then
        print_success "AWS credentials configured"
    else
        print_error "AWS credentials missing from .env"
    fi
fi

cd ..

echo ""
echo "=========================================="
echo "  Step 2: Frontend Setup"
echo "=========================================="
echo ""

print_status "Checking frontend dependencies..."
cd $FRONTEND_DIR

if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

# Check environment files
if [ ! -f ".env.development" ]; then
    print_status "Creating .env.development..."
    cat > .env.development <<EOF
# Backend API URL
VITE_API_URL=http://localhost:3000

# Environment
VITE_ENV=development

# Enable API logging (for debugging)
VITE_API_DEBUG=true
EOF
    print_success "Created .env.development"
fi

if [ ! -f ".env.production" ]; then
    print_status "Creating .env.production..."
    cat > .env.production <<EOF
VITE_API_URL=http://51.20.92.38
VITE_APP_NAME=AetherOS ERP
VITE_ENVIRONMENT=production
EOF
    print_success "Created .env.production"
fi

cd ..

echo ""
echo "=========================================="
echo "  Step 3: Build Frontend"
echo "=========================================="
echo ""

print_status "Building frontend for production..."
cd $FRONTEND_DIR
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
    print_success "Build output: $FRONTEND_DIR/dist"
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

echo ""
echo "=========================================="
echo "  Step 4: Logistics Module Files Check"
echo "=========================================="
echo ""

# Check key files exist
LOGISTICS_FILES=(
    "frontend/src/modules/logistics/DocumentProcessing.tsx"
    "frontend/src/modules/logistics/TripManagementEnhanced.tsx"
    "frontend/src/modules/logistics/FleetManagementEnhanced.tsx"
    "frontend/src/modules/logistics/LogisticsCommandCenter.tsx"
    "frontend/src/services/logistics.api.ts"
    "frontend/src/utils/api.ts"
    "backend/src/routes/logistics/documents.ts"
    "backend/src/routes/logistics/trips.ts"
    "backend/src/modules/logistics/logistics.routes.ts"
)

for file in "${LOGISTICS_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file"
    else
        print_error "$file - MISSING"
    fi
done

echo ""
echo "=========================================="
echo "  Step 5: Database Setup"
echo "=========================================="
echo ""

print_status "Checking logistics database schema..."

# Check if logistics schema exists
cd $BACKEND_DIR

# This would require database connection - skipping for now
print_warning "Database check skipped - please verify manually"
print_status "Required tables:"
echo "  - logistics.trips"
echo "  - logistics.vehicles"
echo "  - logistics.drivers"
echo "  - logistics.fuel_transactions"
echo "  - logistics.maintenance_records"

cd ..

echo ""
echo "=========================================="
echo "  Step 6: Testing"
echo "=========================================="
echo ""

read -p "Do you want to run tests? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting backend server for testing..."
    
    cd $BACKEND_DIR
    npm run dev &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 5
    
    # Test API endpoints
    print_status "Testing API endpoints..."
    
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
    fi
    
    if curl -s http://localhost:3000/api/logistics/workspace > /dev/null; then
        print_success "Logistics workspace endpoint accessible"
    else
        print_warning "Logistics workspace endpoint not responding"
    fi
    
    # Kill backend
    kill $BACKEND_PID 2>/dev/null
    cd ..
fi

echo ""
echo "=========================================="
echo "  Step 7: Deployment (Optional)"
echo "=========================================="
echo ""

read -p "Do you want to deploy to production server (${PRODUCTION_SERVER})? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deploying to production..."
    
    # Create deployment package
    print_status "Creating deployment package..."
    tar -czf logistics-deployment.tar.gz \
        frontend/dist \
        backend/src \
        backend/package.json \
        backend/tsconfig.json \
        LOGISTICS-TEXTRACT-SETUP.md
    
    print_success "Deployment package created: logistics-deployment.tar.gz"
    
    # Upload to server
    print_status "Uploading to server..."
    scp logistics-deployment.tar.gz $PRODUCTION_SERVER:/tmp/
    
    if [ $? -eq 0 ]; then
        print_success "Upload successful"
        
        print_status "Deploying on server..."
        ssh $PRODUCTION_SERVER << 'EOF'
            cd /opt/worldclass-erp
            tar -xzf /tmp/logistics-deployment.tar.gz
            
            # Build backend
            cd backend
            npm install
            npm run build
            
            # Restart services
            sudo systemctl restart worldclass-backend
            sudo systemctl restart nginx
            
            echo "Deployment complete"
EOF
        
        print_success "Deployment complete!"
    else
        print_error "Upload failed"
    fi
else
    print_status "Skipping deployment"
fi

echo ""
echo "=========================================="
echo "  Deployment Summary"
echo "=========================================="
echo ""

print_success "Logistics module setup complete!"
echo ""
echo "Next steps:"
echo "  1. Configure AWS credentials in backend/.env"
echo "  2. Start backend: cd backend && npm run dev"
echo "  3. Start frontend: cd frontend && npm run dev"
echo "  4. Navigate to: http://localhost:5173/logistics"
echo "  5. Test document upload in Document Processing"
echo ""
echo "Production URLs:"
echo "  Frontend: http://51.20.92.38"
echo "  Backend API: http://51.20.92.38/api"
echo ""
echo "Documentation:"
echo "  - LOGISTICS-TEXTRACT-SETUP.md - Complete setup guide"
echo "  - check-aws-setup.sh - AWS configuration checker"
echo ""

print_warning "Important: Ensure AWS Textract credentials are configured before testing document upload"

echo ""
echo "=========================================="
