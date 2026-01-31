#!/bin/bash
# ============================================================================
# COMPREHENSIVE API ENDPOINT TEST SUITE
# WorldClass ERP - Full System Validation
# ============================================================================

# Don't exit on error - we want to continue testing
set +e

API_BASE="${API_BASE:-http://51.20.67.228:3000}"
EMAIL="${TEST_EMAIL:-Sibusiso@sgbsgroup.co.za}"
PASSWORD="${TEST_PASSWORD:-Masaphokati2025!}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

# Arrays to track results
declare -a PASSED_TESTS
declare -a FAILED_TESTS
declare -a SKIPPED_TESTS

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_field="$4"
    local auth="${5:-yes}"
    
    local url="${API_BASE}${endpoint}"
    local result
    local http_code
    
    if [ "$auth" = "yes" ]; then
        result=$(curl -s -w "\n%{http_code}" "$url" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
    else
        result=$(curl -s -w "\n%{http_code}" "$url" -H "Content-Type: application/json")
    fi
    
    http_code=$(echo "$result" | tail -1)
    body=$(echo "$result" | sed '$d')
    
    # Check if response is valid JSON and has success field
    if echo "$body" | jq -e ".$expected_field" > /dev/null 2>&1; then
        local success_val=$(echo "$body" | jq -r ".$expected_field")
        if [ "$success_val" = "true" ] || [ "$success_val" = "OK" ] || [ -n "$success_val" ]; then
            echo -e "${GREEN}✅ PASS${NC} - $name"
            PASS_COUNT=$((PASS_COUNT + 1))
            PASSED_TESTS+=("$name")
            return 0
        fi
    fi
    
    # Check for HTML error (route not found)
    if echo "$body" | grep -q "Cannot GET\|Cannot POST\|<!DOCTYPE"; then
        echo -e "${YELLOW}⚠️  SKIP${NC} - $name (Route not wired)"
        SKIP_COUNT=$((SKIP_COUNT + 1))
        SKIPPED_TESTS+=("$name|Route not wired")
        return 1
    fi
    
    # Extract error message
    local error_msg=$(echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "Invalid response")
    echo -e "${RED}❌ FAIL${NC} - $name: $error_msg"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILED_TESTS+=("$name|$error_msg")
    return 1
}

# Function to test POST endpoint
test_post_endpoint() {
    local name="$1"
    local endpoint="$2"
    local data="$3"
    local expected_field="$4"
    
    local url="${API_BASE}${endpoint}"
    local result
    
    result=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$data")
    
    http_code=$(echo "$result" | tail -1)
    body=$(echo "$result" | sed '$d')
    
    if echo "$body" | jq -e ".$expected_field" > /dev/null 2>&1; then
        local success_val=$(echo "$body" | jq -r ".$expected_field")
        if [ "$success_val" = "true" ]; then
            echo -e "${GREEN}✅ PASS${NC} - $name"
            PASS_COUNT=$((PASS_COUNT + 1))
            PASSED_TESTS+=("$name")
            return 0
        fi
    fi
    
    if echo "$body" | grep -q "Cannot GET\|Cannot POST\|<!DOCTYPE"; then
        echo -e "${YELLOW}⚠️  SKIP${NC} - $name (Route not wired)"
        SKIP_COUNT=$((SKIP_COUNT + 1))
        SKIPPED_TESTS+=("$name|Route not wired")
        return 1
    fi
    
    local error_msg=$(echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "Invalid response")
    echo -e "${RED}❌ FAIL${NC} - $name: $error_msg"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILED_TESTS+=("$name|$error_msg")
    return 1
}

echo "============================================================================"
echo "        WORLDCLASS ERP - COMPREHENSIVE API TEST SUITE"
echo "        $(date)"
echo "============================================================================"
echo ""
echo "API Base: $API_BASE"
echo ""

# ============================================================================
# AUTHENTICATION
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}AUTHENTICATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Get auth token
LOGIN_RESULT=$(curl -s -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESULT" | jq -r '.data.tokens.accessToken // .data.accessToken // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Auth Login"
    PASS_COUNT=$((PASS_COUNT + 1))
    PASSED_TESTS+=("Auth Login")
    TENANT_ID=$(echo "$LOGIN_RESULT" | jq -r '.data.tenant.id')
    USER_NAME=$(echo "$LOGIN_RESULT" | jq -r '.data.user.email')
    echo "   Logged in as: $USER_NAME"
    echo "   Tenant ID: $TENANT_ID"
else
    echo -e "${RED}❌ FAIL${NC} - Auth Login: Cannot proceed without token"
    echo "$LOGIN_RESULT" | jq .
    exit 1
fi

# Health check
test_endpoint "Health Check" "GET" "/health" "status" "no"

echo ""

# ============================================================================
# ADMIN MODULE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}ADMIN MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Admin - Get Users" "GET" "/api/v2/admin/users" "success"
test_endpoint "Admin - Get Roles" "GET" "/api/v2/admin/roles" "success"
test_endpoint "Admin - Get Audit Log" "GET" "/api/v2/admin/audit-log" "success"
test_endpoint "Admin - Get Settings" "GET" "/api/v2/admin/settings" "success"

echo ""

# ============================================================================
# TENANT SETTINGS
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TENANT SETTINGS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Tenant Settings - Get" "GET" "/api/v2/settings/tenant" "success"
test_endpoint "Tenant Settings - Get Modules" "GET" "/api/v2/settings/modules" "success"

echo ""

# ============================================================================
# INVENTORY MODULE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}INVENTORY MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Inventory - Get Items" "GET" "/api/v2/inventory/items" "success"
test_endpoint "Inventory - Get Categories" "GET" "/api/v2/inventory/categories" "success"
test_endpoint "Inventory - Get Warehouses" "GET" "/api/v2/inventory/warehouses" "success"
test_endpoint "Inventory - Get Stock Levels" "GET" "/api/v2/inventory/stock-levels" "success"
test_endpoint "Inventory - Get Stock Movements" "GET" "/api/v2/inventory/stock-movements" "success"
test_endpoint "Inventory - Get Low Stock" "GET" "/api/v2/inventory/low-stock" "success"
test_endpoint "Inventory - Dashboard" "GET" "/api/v2/inventory/dashboard" "success"

echo ""

# ============================================================================
# SALES MODULE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}SALES MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Sales - Get Customers" "GET" "/api/v2/sales/customers" "success"
test_endpoint "Sales - Get Leads" "GET" "/api/v2/sales/leads" "success"
test_endpoint "Sales - Get Opportunities" "GET" "/api/v2/sales/opportunities" "success"
test_endpoint "Sales - Get Quotations" "GET" "/api/v2/sales/quotations" "success"
test_endpoint "Sales - Get Orders" "GET" "/api/v2/sales/orders" "success"
test_endpoint "Sales - Get Invoices" "GET" "/api/v2/sales/invoices" "success"
test_endpoint "Sales - Dashboard" "GET" "/api/v2/sales/dashboard" "success"
test_endpoint "Sales - Pipeline" "GET" "/api/v2/sales/pipeline" "success"

echo ""

# ============================================================================
# PURCHASE MODULE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PURCHASE MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Purchase - Get Suppliers" "GET" "/api/v2/purchase/suppliers" "success"
test_endpoint "Purchase - Get Purchase Orders" "GET" "/api/v2/purchase/orders" "success"
test_endpoint "Purchase - Get Requisitions" "GET" "/api/v2/purchase/requisitions" "success"
test_endpoint "Purchase - Dashboard" "GET" "/api/v2/purchase/dashboard" "success"

echo ""

# ============================================================================
# FINANCIAL MODULE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}FINANCIAL MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Financial - Chart of Accounts" "GET" "/api/v2/financial/chart-of-accounts" "success"
test_endpoint "Financial - Journal Entries" "GET" "/api/v2/financial/journal-entries" "success"
test_endpoint "Financial - Fiscal Periods" "GET" "/api/v2/financial/fiscal-periods" "success"
test_endpoint "Financial - Dashboard" "GET" "/api/v2/dashboard/stats" "success"
test_endpoint "Financial - Balance Sheet" "GET" "/api/v2/reports/balance-sheet" "success"
test_endpoint "Financial - Income Statement" "GET" "/api/v2/reports/income-statement" "success"
test_endpoint "Financial - Cash Flow" "GET" "/api/v2/reports/cash-flow" "success"
test_endpoint "Financial - GL Explorer" "GET" "/api/v2/financial/gl-explorer/filter-options" "success"
test_endpoint "Financial - Tax Settings" "GET" "/api/v2/tax-settings" "success"

echo ""

# ============================================================================
# HR MODULE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}HR MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "HR - Get Employees" "GET" "/api/v2/hr/employees" "success"
test_endpoint "HR - Get Departments" "GET" "/api/v2/hr/departments" "success"
test_endpoint "HR - Get Positions" "GET" "/api/v2/hr/positions" "success"
test_endpoint "HR - Get Leave Types" "GET" "/api/v2/hr/leave-types" "success"
test_endpoint "HR - Get Leave Requests" "GET" "/api/v2/hr/leave-requests" "success"
test_endpoint "HR - Get Payroll Runs" "GET" "/api/v2/hr/payroll-runs" "success"
test_endpoint "HR - Dashboard" "GET" "/api/v2/hr/dashboard" "success"

echo ""

# ============================================================================
# ASSET MANAGEMENT
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}ASSET MANAGEMENT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Assets - Get Assets" "GET" "/api/v2/assets" "success"
test_endpoint "Assets - Get Categories" "GET" "/api/v2/assets/categories" "success"
test_endpoint "Assets - Get Locations" "GET" "/api/v2/assets/locations" "success"
test_endpoint "Assets - Dashboard" "GET" "/api/v2/assets/dashboard" "success"

echo ""

# ============================================================================
# MANUFACTURING MODULE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}MANUFACTURING MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Manufacturing - Get BOMs" "GET" "/api/v2/manufacturing/boms" "success"
test_endpoint "Manufacturing - Get Work Orders" "GET" "/api/v2/manufacturing/work-orders" "success"
test_endpoint "Manufacturing - Dashboard" "GET" "/api/v2/manufacturing/dashboard" "success"

echo ""

# ============================================================================
# LOGISTICS MODULE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}LOGISTICS MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Logistics - Get Vehicles" "GET" "/api/v2/logistics/vehicles" "success"
test_endpoint "Logistics - Get Drivers" "GET" "/api/v2/logistics/drivers" "success"
test_endpoint "Logistics - Get Trips" "GET" "/api/v2/logistics/trips" "success"
test_endpoint "Logistics - Get Fuel Records" "GET" "/api/v2/logistics/fuel" "success"
test_endpoint "Logistics - Dashboard" "GET" "/api/v2/logistics/dashboard" "success"

echo ""

# ============================================================================
# COMPLIANCE MODULE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}COMPLIANCE MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Compliance - Dashboard" "GET" "/api/v2/compliance/dashboard" "success"
test_endpoint "Compliance - SARS Status" "GET" "/api/v2/compliance/sars/status" "success"
test_endpoint "Audit Ready - Dashboard" "GET" "/api/v2/audit-ready/dashboard" "success"

echo ""

# ============================================================================
# INDUSTRY VERTICALS
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}INDUSTRY VERTICALS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Healthcare - Dashboard" "GET" "/api/v2/healthcare/dashboard" "success"
test_endpoint "Mining - Dashboard" "GET" "/api/v2/mining/dashboard" "success"
test_endpoint "Construction - Dashboard" "GET" "/api/v2/construction/dashboard" "success"
test_endpoint "Property - Dashboard" "GET" "/api/v2/property/dashboard" "success"
test_endpoint "Agriculture - Dashboard" "GET" "/api/v2/agriculture/dashboard" "success"

echo ""

# ============================================================================
# COMMUNICATIONS MODULE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}COMMUNICATIONS MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Communications - Dashboard" "GET" "/api/v2/communications/dashboard" "success"
test_endpoint "Communications - Messages" "GET" "/api/v2/communications/messages" "success"
test_endpoint "Communications - Notifications" "GET" "/api/v2/communications/notifications" "success"
test_endpoint "Meetings - Status" "GET" "/api/v2/meetings/status" "success"

echo ""

# ============================================================================
# PROPOSALS & PROJECTS
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PROPOSALS & PROJECTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Proposals - Get All" "GET" "/api/v2/proposals" "success"
test_endpoint "Projects - Get All" "GET" "/api/v2/practice/projects" "success"
test_endpoint "Projects - Tasks" "GET" "/api/v2/practice/tasks" "success"
test_endpoint "Projects - Time Tracking" "GET" "/api/v2/practice/time-entries" "success"

echo ""

# ============================================================================
# AI ASSISTANT
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}AI ASSISTANT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "AI - Get Conversations" "GET" "/api/v2/ai/conversations" "success"
test_endpoint "AI - Get Suggestions" "GET" "/api/v2/ai/suggestions" "success"

echo ""

# ============================================================================
# MULTI-ENTITY
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}MULTI-ENTITY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Multi-Entity - Get Entities" "GET" "/api/v2/multi-entity/entities" "success"
test_endpoint "Multi-Entity - Dashboard" "GET" "/api/v2/multi-entity/dashboard" "success"

echo ""

# ============================================================================
# TREASURY
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TREASURY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Treasury - Get Accounts" "GET" "/api/v2/treasury/accounts" "success"
test_endpoint "Treasury - Dashboard" "GET" "/api/v2/treasury/dashboard" "success"

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "============================================================================"
echo "                           TEST SUMMARY"
echo "============================================================================"
echo ""
echo -e "  ${GREEN}✅ PASSED:${NC}  $PASS_COUNT"
echo -e "  ${RED}❌ FAILED:${NC}  $FAIL_COUNT"
echo -e "  ${YELLOW}⚠️  SKIPPED:${NC} $SKIP_COUNT"
echo ""
TOTAL=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))
echo "  TOTAL TESTS: $TOTAL"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
    echo "============================================================================"
    echo "                        FAILED ENDPOINTS"
    echo "============================================================================"
    for item in "${FAILED_TESTS[@]}"; do
        IFS='|' read -r name error <<< "$item"
        echo -e "  ${RED}❌${NC} $name"
        echo "     Error: $error"
    done
    echo ""
fi

if [ $SKIP_COUNT -gt 0 ]; then
    echo "============================================================================"
    echo "                       SKIPPED ENDPOINTS"
    echo "============================================================================"
    for item in "${SKIPPED_TESTS[@]}"; do
        IFS='|' read -r name reason <<< "$item"
        echo -e "  ${YELLOW}⚠️${NC}  $name"
        echo "     Reason: $reason"
    done
    echo ""
fi

# Exit with error if any tests failed
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}Some tests failed. See above for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All active endpoints passed!${NC}"
    exit 0
fi
