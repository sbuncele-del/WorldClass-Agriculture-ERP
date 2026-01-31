#!/bin/bash
BASE="http://51.20.92.38:3000/api"
H="x-tenant-id: 00000000-0000-0000-0000-000000000001"

test() {
  name="$1"; path="$2"
  res=$(curl -s "$BASE$path" -H "$H" 2>&1)
  if echo "$res" | grep -qE '(success.*true|customers|vendors|suppliers|orders|quotations|employees|data|items)'; then
    echo "✅ $name"
  else
    echo "❌ $name"
  fi
}

echo "=== SALES ==="
test "Customers" "/sales/customers"
test "Invoices" "/sales/invoices"
test "Quotations" "/sales/quotations"
test "Orders" "/sales/orders"
test "Leads" "/sales/leads"
test "Opportunities" "/sales/opportunities"

echo ""
echo "=== PURCHASE ==="
test "Vendors" "/purchase/vendors"
test "PO List" "/purchase/purchase-orders"
test "Requisitions" "/purchase/requisitions"
test "Receipts" "/purchase/receipts"

echo ""
echo "=== INVENTORY ==="
test "Items" "/inventory/items"
test "Stock Levels" "/inventory/stock-levels"
test "Movements" "/inventory/stock-movements"
test "Adjustments" "/inventory/stock-adjustments"
test "Warehouses" "/inventory/warehouses"
test "Categories" "/inventory/categories"

echo ""
echo "=== FINANCIAL ==="
test "COA" "/financial/chart-of-accounts"
test "Journal List" "/financial/journal-entries?limit=10"
test "Trial Balance" "/financial/trial-balance?fromDate=2025-01-01&toDate=2025-12-31"
test "P&L" "/financial/profit-loss?fromDate=2025-01-01&toDate=2025-12-31"
test "Balance Sheet" "/financial/balance-sheet?asOfDate=2025-12-31"
test "General Ledger" "/financial/ledger/general?from_date=2025-11-01&to_date=2025-11-30&limit=5"
test "Fiscal Years" "/financial/fiscal-years"

echo ""
echo "=== HR ==="
test "Employees" "/hr/employees"
test "Departments" "/hr/departments"
test "Positions" "/hr/positions"

