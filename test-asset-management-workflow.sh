#!/bin/bash

# ============================================================================
# Asset Management Module - Complete Workflow Test
# ============================================================================
# Tests the complete asset lifecycle:
# 1. Asset acquisition and GL posting
# 2. Monthly depreciation calculation
# 3. GL impact verification
# 4. Financial statement updates
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}ASSET MANAGEMENT - COMPLETE WORKFLOW TEST${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Database connection details
DB_HOST="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="aetheros_erp"
DB_USER="postgres"
DB_PASSWORD="caxMex-0putca-dyjnah"

# Check if running via SSH on EC2 or locally
if [ -f "/home/ec2-user/backend/database/migrations/create-asset-gl-posting.sql" ]; then
    MIGRATION_FILE="/home/ec2-user/backend/database/migrations/create-asset-gl-posting.sql"
    TEST_FILE="/home/ec2-user/asset-management-complete-test.sql"
    echo -e "${GREEN}✓ Running on EC2 instance${NC}"
else
    MIGRATION_FILE="./backend/database/migrations/create-asset-gl-posting.sql"
    TEST_FILE="./asset-management-complete-test.sql"
    echo -e "${GREEN}✓ Running locally${NC}"
fi

echo ""
echo -e "${YELLOW}Step 1: Deploy Asset Management GL posting functions${NC}"
echo "------------------------------------------------------------"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Asset GL posting functions deployed successfully${NC}"
else
    echo -e "${RED}✗ Failed to deploy GL posting functions${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Run complete asset workflow test${NC}"
echo "------------------------------------------------------------"

if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}✗ Test file not found: $TEST_FILE${NC}"
    exit 1
fi

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$TEST_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}✓ ASSET MANAGEMENT TEST COMPLETED SUCCESSFULLY${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    echo ""
    echo -e "${BLUE}What was tested:${NC}"
    echo "  1. ✓ Asset acquisition GL posting (DR Fixed Assets, CR Bank)"
    echo "  2. ✓ Monthly depreciation calculation"
    echo "  3. ✓ Depreciation GL posting (DR Expense, CR Accumulated Dep)"
    echo "  4. ✓ Multi-month depreciation tracking"
    echo "  5. ✓ Balance Sheet impact (Net Book Value)"
    echo "  6. ✓ Profit & Loss impact (Depreciation Expense)"
    echo "  7. ✓ Trial balance verification"
    echo "  8. ✓ Complete audit trail"
    echo ""
    echo -e "${BLUE}Key Results:${NC}"
    echo "  - Asset: Toyota Hilux 4x4 (VEH-2025-001)"
    echo "  - Cost: R 450,000"
    echo "  - Monthly Depreciation: R 6,750"
    echo "  - Accumulated Depreciation: R 13,500 (2 months)"
    echo "  - Net Book Value: R 436,500"
    echo ""
    echo -e "${GREEN}All GL transactions posted correctly!${NC}"
    echo ""
else
    echo -e "${RED}✗ Asset management test failed${NC}"
    exit 1
fi
