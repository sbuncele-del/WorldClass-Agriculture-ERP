#!/bin/bash
BASE_URL="http://51.20.92.38:3000/api"
TENANT_ID="00000000-0000-0000-0000-000000000001"

echo "=== PHASE 2 ENDPOINT TESTS ==="
echo ""

# Financial Reports
echo "1. Trial Balance:"
curl -s "$BASE_URL/financial/trial-balance?fromDate=2025-01-01&toDate=2025-12-31" -H "x-tenant-id: $TENANT_ID" | jq -r '.success'

echo "2. Profit & Loss:"
curl -s "$BASE_URL/financial/profit-loss?fromDate=2025-01-01&toDate=2025-12-31" -H "x-tenant-id: $TENANT_ID" | jq -r '.success'

echo "3. Balance Sheet:"
curl -s "$BASE_URL/financial/balance-sheet?asOfDate=2025-12-31" -H "x-tenant-id: $TENANT_ID" | jq -r '.success'

# HR
echo "4. HR Departments:"
curl -s "$BASE_URL/hr/departments" -H "x-tenant-id: $TENANT_ID" | jq -r '.success, .count'

echo "5. HR Positions:"
curl -s "$BASE_URL/hr/positions" -H "x-tenant-id: $TENANT_ID" | jq -r '.success, .count'

# Inventory
echo "6. Inventory Items:"
curl -s "$BASE_URL/inventory/items" -H "x-tenant-id: $TENANT_ID" | jq -r '.success, .count'

# Purchase
echo "7. Purchase Orders:"
curl -s "$BASE_URL/purchase/purchase-orders" -H "x-tenant-id: $TENANT_ID" | jq -r '.success, .total'
