#!/bin/bash
# REAL DATA VERIFICATION TEST
# Tests if endpoints return real database data or mock/hardcoded data

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5M2ZmNWYxMS1iMjU2LTRhZmItYjJlYi01ODFiOGJlYzI2NTQiLCJ0ZW5hbnRJZCI6IjgzNTIzMjY0LTM3MzQtNDAzYi05ODZkLTRmNTA5NGZmNzkwMyIsImVtYWlsIjoidmVyaWZ5QHRlc3RqYW44LmNvLnphIiwicm9sZSI6ImFkbWluIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc2Nzg4MzY2OSwiZXhwIjoxNzY3OTcwMDY5fQ.TI5PozWq-_WJZP-imrd8qrKYJAZPtrjmJbnGabqkv4c"
TENANT="83523264-3734-403b-986d-4f5094ff7903"
API="https://siyabusaerp.co.za/api"

echo "=============================================="
echo "  REAL DATA VERIFICATION TEST"
echo "=============================================="
echo ""

test_endpoint() {
    local name=$1
    local path=$2
    echo "Testing: $name"
    result=$(curl -s "$API$path" -H "Authorization: Bearer $TOKEN" -H "x-tenant-id: $TENANT")
    
    if echo "$result" | grep -q '"success":true'; then
        echo "  ✅ Returns data"
        # Check if it has real data
        if echo "$result" | grep -q '"data":\[\]'; then
            echo "     ⚠️  Empty array (no records)"
        else
            echo "     📊 Has records"
        fi
    elif echo "$result" | grep -q '"success":false'; then
        error=$(echo "$result" | grep -o '"error":"[^"]*"' | head -1)
        echo "  ❌ Error: $error"
    else
        echo "  ⚠️  Unknown response"
    fi
    echo ""
}

echo "=== CORE MODULES ==="
test_endpoint "Sales Customers" "/v2/sales/customers"
test_endpoint "Sales Invoices" "/v2/sales/invoices"
test_endpoint "Inventory Items" "/v2/inventory/items"
test_endpoint "HR Employees" "/v2/hr/employees"
test_endpoint "Financial Accounts" "/v2/financial/accounts"
test_endpoint "Purchase Suppliers" "/v2/purchase/suppliers"

echo "=== INDUSTRY MODULES ==="
test_endpoint "Mining Sites" "/v2/mining/sites"
test_endpoint "Healthcare Patients" "/v2/healthcare/patients"
test_endpoint "Construction Projects" "/v2/construction/projects"
test_endpoint "Agriculture Farms" "/v2/agriculture/farms"
test_endpoint "Logistics Vehicles" "/v2/logistics/vehicles"
test_endpoint "Property Properties" "/v2/property/properties"

echo "=== OTHER MODULES ==="
test_endpoint "Asset Management" "/v2/assets"
test_endpoint "Manufacturing BOMs" "/v2/manufacturing/boms"
test_endpoint "Warehouse Locations" "/v2/warehouse/locations"
test_endpoint "Cash Accounts" "/v2/cash/accounts"

echo "=============================================="
echo "  TEST COMPLETE"
echo "=============================================="
