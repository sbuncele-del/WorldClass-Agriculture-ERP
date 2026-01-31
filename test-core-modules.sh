#!/bin/bash
BASE_URL="http://51.20.92.38:3000/api"
TENANT="x-tenant-id: 00000000-0000-0000-0000-000000000001"

echo "=== CORE MODULE STATUS ==="
echo ""
echo "AUTHENTICATION (5):"
curl -s "$BASE_URL/auth/health" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
echo ""

echo "HR BASIC (4):"
curl -s "$BASE_URL/hr/departments" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
curl -s "$BASE_URL/hr/positions" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
curl -s "$BASE_URL/hr/employees" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
echo ""

echo "FINANCIAL REPORTS (3):"
curl -s "$BASE_URL/financial/trial-balance?fromDate=2025-01-01&toDate=2025-12-31" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
curl -s "$BASE_URL/financial/profit-loss?fromDate=2025-01-01&toDate=2025-12-31" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
curl -s "$BASE_URL/financial/balance-sheet?asOfDate=2025-12-31" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
echo ""

echo "FINANCIAL LEDGER (6):"
curl -s "$BASE_URL/financial/journal-entries/18" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
curl -s "$BASE_URL/financial/ledger/general?from_date=2025-11-01&to_date=2025-11-30&limit=5" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
curl -s "$BASE_URL/financial/ledger/accounts/1200?from_date=2025-11-01&to_date=2025-11-30" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
curl -s "$BASE_URL/financial/fiscal-years" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
curl -s "$BASE_URL/financial/fiscal-periods?year=2025" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
curl -s "$BASE_URL/financial/cash-flow?fromDate=2025-11-01&toDate=2025-11-30" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
echo ""

echo "INVENTORY (1):"
curl -s "$BASE_URL/inventory/items" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1
echo ""

echo "PURCHASE (1):"
curl -s "$BASE_URL/purchase/purchase-orders" -H "$TENANT" | jq -r '.success // "FAIL"' | head -1

