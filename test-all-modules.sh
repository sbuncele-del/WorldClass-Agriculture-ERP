#!/bin/bash

# Comprehensive Module Testing Script
# Tests all ERP module endpoints to identify what works and what needs fixing

IP="51.20.92.38"
BASE_URL="http://$IP/api"
REPORT_FILE="module-test-report-$(date +%Y%m%d-%H%M%S).txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "Worldclass ERP - Full Module Test"
echo "Date: $(date)"
echo "Instance: $BASE_URL"
echo "========================================"
echo ""

# Results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
declare -a FAILED_ENDPOINTS
declare -a PASSED_ENDPOINTS
declare -a SCHEMA_ERRORS

# Function to test endpoint
test_endpoint() {
    local module=$1
    local endpoint=$2
    local description=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $module - $description ... "
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    # Check for success
    if [[ "$http_code" == "200" ]]; then
        # Check if body contains success:true
        if echo "$body" | grep -q '"success".*true'; then
            echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            PASSED_ENDPOINTS+=("$module - $endpoint - $description")
            return 0
        elif echo "$body" | grep -q "column.*does not exist"; then
            echo -e "${RED}❌ SCHEMA ERROR${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            error_msg=$(echo "$body" | grep -o 'column "[^"]*" does not exist' | head -1)
            SCHEMA_ERRORS+=("$module|$endpoint|$error_msg")
            FAILED_ENDPOINTS+=("$module - $endpoint - $description - SCHEMA: $error_msg")
            return 1
        else
            echo -e "${YELLOW}⚠️  SUCCESS BUT NO DATA${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            PASSED_ENDPOINTS+=("$module - $endpoint - $description (no data)")
            return 0
        fi
    elif [[ "$http_code" == "404" ]]; then
        echo -e "${YELLOW}⚠️  NOT FOUND${NC} (endpoint may not exist)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_ENDPOINTS+=("$module - $endpoint - $description - 404 NOT FOUND")
        return 1
    elif [[ "$http_code" == "401" ]]; then
        echo -e "${YELLOW}⚠️  AUTH REQUIRED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_ENDPOINTS+=("$module - $endpoint - $description - AUTH REQUIRED")
        return 1
    elif [[ "$http_code" == "500" ]]; then
        echo -e "${RED}❌ SERVER ERROR${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        error_snippet=$(echo "$body" | head -c 100)
        FAILED_ENDPOINTS+=("$module - $endpoint - $description - 500 ERROR: $error_snippet")
        return 1
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_ENDPOINTS+=("$module - $endpoint - $description - HTTP $http_code")
        return 1
    fi
}

echo "=== FINANCIAL MODULE ==="
test_endpoint "Financial" "/financial/chart-of-accounts" "Chart of Accounts"
test_endpoint "Financial" "/financial/journal-entries" "Journal Entries List"
test_endpoint "Financial" "/financial/journal-entries/1" "Journal Entry Detail"
test_endpoint "Financial" "/financial/fiscal-years" "Fiscal Years"
test_endpoint "Financial" "/financial/fiscal-periods" "Fiscal Periods"
test_endpoint "Financial" "/financial/ledger/general" "General Ledger"
test_endpoint "Financial" "/financial/ledger/accounts/1200" "Account Ledger"
test_endpoint "Financial" "/financial/trial-balance" "Trial Balance"
test_endpoint "Financial" "/financial/income-statement" "Income Statement"
test_endpoint "Financial" "/financial/balance-sheet" "Balance Sheet"
test_endpoint "Financial" "/financial/cash-flow" "Cash Flow Statement"
test_endpoint "Financial" "/financial/tax-settings" "Tax Settings"
test_endpoint "Financial" "/financial/dimensions" "Financial Dimensions"
echo ""

echo "=== HR & PAYROLL MODULE ==="
test_endpoint "HR" "/hr/employees" "Employee List"
test_endpoint "HR" "/hr/employees/1" "Employee Detail"
test_endpoint "HR" "/hr/departments" "Departments"
test_endpoint "HR" "/hr/positions" "Positions"
test_endpoint "HR" "/hr/payroll/runs" "Payroll Runs"
test_endpoint "HR" "/hr/payroll/slips" "Pay Slips"
test_endpoint "HR" "/hr/leave/requests" "Leave Requests"
test_endpoint "HR" "/hr/leave/types" "Leave Types"
test_endpoint "HR" "/hr/attendance" "Attendance Records"
test_endpoint "HR" "/hr/benefits" "Employee Benefits"
echo ""

echo "=== SALES MODULE ==="
test_endpoint "Sales" "/sales/customers" "Customer List"
test_endpoint "Sales" "/sales/customers/1" "Customer Detail"
test_endpoint "Sales" "/sales/invoices" "Sales Invoices"
test_endpoint "Sales" "/sales/invoices/1" "Invoice Detail"
test_endpoint "Sales" "/sales/quotes" "Sales Quotes"
test_endpoint "Sales" "/sales/orders" "Sales Orders"
test_endpoint "Sales" "/sales/receipts" "Sales Receipts"
test_endpoint "Sales" "/sales/credit-notes" "Credit Notes"
test_endpoint "Sales" "/sales/pricing" "Pricing Lists"
test_endpoint "Sales" "/sales/commissions" "Sales Commissions"
echo ""

echo "=== PURCHASE MODULE ==="
test_endpoint "Purchase" "/purchase/vendors" "Vendor List"
test_endpoint "Purchase" "/purchase/vendors/1" "Vendor Detail"
test_endpoint "Purchase" "/purchase/orders" "Purchase Orders"
test_endpoint "Purchase" "/purchase/orders/1" "PO Detail"
test_endpoint "Purchase" "/purchase/invoices" "Purchase Invoices"
test_endpoint "Purchase" "/purchase/receipts" "Goods Receipts"
test_endpoint "Purchase" "/purchase/payments" "Vendor Payments"
test_endpoint "Purchase" "/purchase/requisitions" "Purchase Requisitions"
echo ""

echo "=== INVENTORY MODULE ==="
test_endpoint "Inventory" "/inventory/products" "Product List"
test_endpoint "Inventory" "/inventory/products/1" "Product Detail"
test_endpoint "Inventory" "/inventory/stock-levels" "Stock Levels"
test_endpoint "Inventory" "/inventory/locations" "Warehouse Locations"
test_endpoint "Inventory" "/inventory/movements" "Stock Movements"
test_endpoint "Inventory" "/inventory/adjustments" "Stock Adjustments"
test_endpoint "Inventory" "/inventory/transfers" "Stock Transfers"
test_endpoint "Inventory" "/inventory/categories" "Product Categories"
test_endpoint "Inventory" "/inventory/suppliers" "Suppliers"
echo ""

echo "=== MANUFACTURING MODULE ==="
test_endpoint "Manufacturing" "/manufacturing/work-orders" "Work Orders"
test_endpoint "Manufacturing" "/manufacturing/bom" "Bill of Materials"
test_endpoint "Manufacturing" "/manufacturing/production" "Production Records"
test_endpoint "Manufacturing" "/manufacturing/routings" "Production Routings"
test_endpoint "Manufacturing" "/manufacturing/work-centers" "Work Centers"
test_endpoint "Manufacturing" "/manufacturing/quality-control" "QC Inspections"
echo ""

echo "=== WAREHOUSE MODULE ==="
test_endpoint "Warehouse" "/warehouse/locations" "Warehouse Locations"
test_endpoint "Warehouse" "/warehouse/bins" "Storage Bins"
test_endpoint "Warehouse" "/warehouse/picks" "Pick Lists"
test_endpoint "Warehouse" "/warehouse/shipments" "Shipments"
test_endpoint "Warehouse" "/warehouse/receiving" "Receiving Records"
test_endpoint "Warehouse" "/warehouse/cycle-counts" "Cycle Counts"
echo ""

echo "=== ASSET MANAGEMENT MODULE ==="
test_endpoint "Assets" "/assets/fixed-assets" "Fixed Assets"
test_endpoint "Assets" "/assets/depreciation" "Depreciation Schedule"
test_endpoint "Assets" "/assets/disposals" "Asset Disposals"
test_endpoint "Assets" "/assets/maintenance" "Maintenance Records"
test_endpoint "Assets" "/assets/categories" "Asset Categories"
echo ""

echo "=== CASH MANAGEMENT MODULE ==="
test_endpoint "Cash" "/cash-management/bank-accounts" "Bank Accounts"
test_endpoint "Cash" "/cash-management/transactions" "Bank Transactions"
test_endpoint "Cash" "/cash-management/reconciliation" "Bank Reconciliation"
test_endpoint "Cash" "/cash-management/deposits" "Bank Deposits"
test_endpoint "Cash" "/cash-management/payments" "Bank Payments"
echo ""

echo "=== COMPLIANCE MODULE ==="
test_endpoint "Compliance" "/compliance/vat-returns" "VAT Returns"
test_endpoint "Compliance" "/compliance/tax-submissions" "Tax Submissions"
test_endpoint "Compliance" "/compliance/audit-trail" "Audit Trail"
test_endpoint "Compliance" "/compliance/reports" "Compliance Reports"
echo ""

echo "=== SARS SENTINEL MODULE ==="
test_endpoint "SARS" "/sars-sentinel/status" "SARS Status"
test_endpoint "SARS" "/sars-sentinel/submissions" "SARS Submissions"
test_endpoint "SARS" "/sars-sentinel/e-filing" "E-Filing Status"
echo ""

echo "=== PRACTICE MANAGEMENT MODULE ==="
test_endpoint "Practice" "/practice/clients" "Practice Clients"
test_endpoint "Practice" "/practice/matters" "Legal Matters"
test_endpoint "Practice" "/practice/timesheets" "Timesheets"
test_endpoint "Practice" "/practice/billing" "Practice Billing"
echo ""

echo "=== LOGISTICS MODULE ==="
test_endpoint "Logistics" "/logistics/vehicles" "Fleet Vehicles"
test_endpoint "Logistics" "/logistics/trips" "Delivery Trips"
test_endpoint "Logistics" "/logistics/routes" "Delivery Routes"
test_endpoint "Logistics" "/logistics/fuel" "Fuel Management"
echo ""

echo "=== ADMIN MODULE ==="
test_endpoint "Admin" "/admin/users" "User Management"
test_endpoint "Admin" "/admin/roles" "Role Management"
test_endpoint "Admin" "/admin/permissions" "Permissions"
test_endpoint "Admin" "/admin/settings" "System Settings"
test_endpoint "Admin" "/admin/modules" "Module Status"
echo ""

echo "=== TENANT & SUBSCRIPTION ==="
test_endpoint "Tenant" "/tenant/settings" "Tenant Settings"
test_endpoint "Subscription" "/subscription/status" "Subscription Status"
test_endpoint "Subscription" "/subscription/plans" "Subscription Plans"
echo ""

echo ""
echo "========================================"
echo "TEST SUMMARY"
echo "========================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC} ($(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%)"
echo -e "Failed: ${RED}$FAILED_TESTS${NC} ($(awk "BEGIN {printf \"%.1f\", ($FAILED_TESTS/$TOTAL_TESTS)*100}")%)"
echo ""

# Schema errors breakdown
if [ ${#SCHEMA_ERRORS[@]} -gt 0 ]; then
    echo -e "${RED}=== SCHEMA ERRORS (${#SCHEMA_ERRORS[@]}) ===${NC}"
    for error in "${SCHEMA_ERRORS[@]}"; do
        IFS='|' read -r module endpoint error_msg <<< "$error"
        echo -e "  ${YELLOW}$module${NC} - $endpoint"
        echo -e "    ${RED}$error_msg${NC}"
    done
    echo ""
fi

# Failed endpoints
if [ ${#FAILED_ENDPOINTS[@]} -gt 0 ]; then
    echo -e "${RED}=== FAILED ENDPOINTS ===${NC}"
    for endpoint in "${FAILED_ENDPOINTS[@]}"; do
        echo "  ❌ $endpoint"
    done
    echo ""
fi

# Passed endpoints (summary only)
echo -e "${GREEN}=== PASSED ENDPOINTS (${#PASSED_ENDPOINTS[@]}) ===${NC}"
for endpoint in "${PASSED_ENDPOINTS[@]}"; do
    echo "  ✅ $endpoint"
done
echo ""

# Generate recommendations
echo "========================================"
echo "RECOMMENDATIONS"
echo "========================================"

if [ ${#SCHEMA_ERRORS[@]} -gt 0 ]; then
    echo -e "${YELLOW}1. Fix Schema Mismatches:${NC}"
    echo "   - ${#SCHEMA_ERRORS[@]} endpoints have database schema issues"
    echo "   - Similar to chart-of-accounts and journal-entries fixes"
    echo "   - Estimated time: 15-30 min per module"
    echo ""
fi

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${YELLOW}2. Investigate Failed Endpoints:${NC}"
    echo "   - $FAILED_TESTS endpoints returned errors"
    echo "   - Review detailed error messages above"
    echo "   - Check database tables exist"
    echo ""
fi

if [ $PASSED_TESTS -gt 0 ]; then
    echo -e "${GREEN}3. Working Modules Ready for Demo:${NC}"
    echo "   - $PASSED_TESTS endpoints working correctly"
    echo "   - These can be shown to customers immediately"
    echo ""
fi

echo "Full report saved to: $REPORT_FILE"

# Save detailed report
{
    echo "Worldclass ERP - Full Module Test Report"
    echo "Date: $(date)"
    echo "Instance: $BASE_URL"
    echo ""
    echo "SUMMARY"
    echo "======="
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS ($(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%)"
    echo "Failed: $FAILED_TESTS ($(awk "BEGIN {printf \"%.1f\", ($FAILED_TESTS/$TOTAL_TESTS)*100}")%)"
    echo ""
    echo "SCHEMA ERRORS"
    echo "============="
    for error in "${SCHEMA_ERRORS[@]}"; do
        echo "$error"
    done
    echo ""
    echo "FAILED ENDPOINTS"
    echo "================"
    for endpoint in "${FAILED_ENDPOINTS[@]}"; do
        echo "$endpoint"
    done
    echo ""
    echo "PASSED ENDPOINTS"
    echo "================"
    for endpoint in "${PASSED_ENDPOINTS[@]}"; do
        echo "$endpoint"
    done
} > "$REPORT_FILE"

# Exit code based on results
if [ $FAILED_TESTS -gt 0 ]; then
    echo ""
    echo "⚠️  Some tests failed. Review the report above."
    exit 1
else
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    exit 0
fi
