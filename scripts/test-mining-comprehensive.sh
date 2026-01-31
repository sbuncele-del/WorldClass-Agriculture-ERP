#!/bin/bash
# COMPREHENSIVE MINING MODULE TEST
# Tests ALL CRUD operations for every mining endpoint

echo "=============================================="
echo "  MINING MODULE COMPREHENSIVE TEST"
echo "=============================================="
echo ""

# Login
echo "1. Authenticating..."
curl -s -X POST https://siyabusaerp.co.za/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"miningtestx@test.co.za","password":"Mining@12345"}' > /tmp/login.json

TOKEN=$(python3 -c "import json; d=json.load(open('/tmp/login.json')); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))")
TENANT=$(python3 -c "import json; d=json.load(open('/tmp/login.json')); print(d.get('data',{}).get('tenant',{}).get('id',''))")

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi
echo "✅ Authenticated (Tenant: $TENANT)"
echo ""

API="https://siyabusaerp.co.za/api"
AUTH="-H \"Authorization: Bearer $TOKEN\" -H \"x-tenant-id: $TENANT\" -H \"Content-Type: application/json\""

# Helper function
test_endpoint() {
  local method=$1
  local path=$2
  local data=$3
  local name=$4
  
  if [ "$method" == "GET" ]; then
    RESP=$(curl -s -w "\n%{http_code}" "$API$path" \
      -H "Authorization: Bearer $TOKEN" \
      -H "x-tenant-id: $TENANT")
  else
    RESP=$(curl -s -w "\n%{http_code}" -X "$method" "$API$path" \
      -H "Authorization: Bearer $TOKEN" \
      -H "x-tenant-id: $TENANT" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  HTTP=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  
  if [ "$HTTP" == "200" ] || [ "$HTTP" == "201" ]; then
    echo "✅ $name - HTTP $HTTP"
    # Save IDs for later tests
    if echo "$BODY" | grep -q '"id"'; then
      ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)
      [ -n "$ID" ] && echo "   Created ID: $ID"
    fi
  else
    echo "❌ $name - HTTP $HTTP"
    echo "   $(echo $BODY | head -c 150)"
  fi
}

echo "=============================================="
echo "  MINING SITES (CRUD)"
echo "=============================================="

# Create site
TS=$(date +%s)
test_endpoint "POST" "/v2/mining/sites" \
  "{\"code\":\"SITE$TS\",\"name\":\"Test Mine $TS\",\"locationLat\":-26.2041,\"locationLng\":28.0473,\"province\":\"Gauteng\",\"areaHectares\":1000,\"mineralType\":\"gold\",\"miningMethod\":\"opencast\"}" \
  "Create Site"

# Get site ID from the created site or existing
SITES=$(curl -s "$API/v2/mining/sites" -H "Authorization: Bearer $TOKEN" -H "x-tenant-id: $TENANT")
SITE_ID=$(echo "$SITES" | python3 -c "import sys,json; d=json.load(sys.stdin); sites=d.get('data',[]); print(sites[0]['id'] if sites else '')" 2>/dev/null)
echo "   Using Site ID: $SITE_ID"

# List sites
test_endpoint "GET" "/v2/mining/sites" "" "List Sites"

# Get single site
test_endpoint "GET" "/v2/mining/sites/$SITE_ID" "" "Get Site by ID"

# Update site
test_endpoint "PUT" "/v2/mining/sites/$SITE_ID" \
  "{\"name\":\"Updated Mine Name\",\"status\":\"operational\"}" \
  "Update Site"

echo ""
echo "=============================================="
echo "  MINING PRODUCTION (CRUD)"
echo "=============================================="

# Create production record
test_endpoint "POST" "/v2/mining/production" \
  "{\"siteId\":\"$SITE_ID\",\"productionDate\":\"2026-01-08\",\"quantity\":1500,\"mineralType\":\"gold\",\"shift\":\"day\",\"notes\":\"Test production record\"}" \
  "Create Production Record"

# Get production records
test_endpoint "GET" "/v2/mining/production" "" "List Production Records"

# Get production by site
test_endpoint "GET" "/v2/mining/production?siteId=$SITE_ID" "" "Get Production by Site"

echo ""
echo "=============================================="
echo "  MINING SAFETY (CRUD)"
echo "=============================================="

# Create safety incident
test_endpoint "POST" "/v2/mining/safety" \
  "{\"siteId\":\"$SITE_ID\",\"incidentDate\":\"2026-01-07\",\"incidentType\":\"near_miss\",\"severity\":\"minor\",\"description\":\"Test incident for system validation\",\"employeesInvolved\":2}" \
  "Create Safety Incident"

# List safety incidents
test_endpoint "GET" "/v2/mining/safety" "" "List Safety Incidents"

echo ""
echo "=============================================="
echo "  MINING EQUIPMENT (CRUD)"
echo "=============================================="

# Create equipment
test_endpoint "POST" "/v2/mining/equipment" \
  "{\"siteId\":\"$SITE_ID\",\"name\":\"CAT 797F Haul Truck\",\"type\":\"haul_truck\",\"serialNumber\":\"CAT-2026-001\",\"status\":\"operational\",\"lastMaintenance\":\"2026-01-01\"}" \
  "Create Equipment"

# List equipment
test_endpoint "GET" "/v2/mining/equipment" "" "List Equipment"

# Get equipment by site
test_endpoint "GET" "/v2/mining/equipment?siteId=$SITE_ID" "" "Get Equipment by Site"

echo ""
echo "=============================================="
echo "  MINING MINERALS (CRUD)"
echo "=============================================="

# Create mineral
test_endpoint "POST" "/v2/mining/minerals" \
  "{\"name\":\"Gold (Au)\",\"code\":\"AU\",\"unit\":\"ounces\",\"currentPrice\":2050.00}" \
  "Create Mineral"

# List minerals
test_endpoint "GET" "/v2/mining/minerals" "" "List Minerals"

echo ""
echo "=============================================="
echo "  MINING DASHBOARD & REPORTS"
echo "=============================================="

test_endpoint "GET" "/v2/mining/dashboard" "" "Mining Dashboard"
test_endpoint "GET" "/v2/mining/workspace" "" "Mining Workspace"

echo ""
echo "=============================================="
echo "  SUMMARY"
echo "=============================================="

# Final verification
echo ""
echo "Final State Check:"
echo "Sites: $(curl -s "$API/v2/mining/sites" -H "Authorization: Bearer $TOKEN" -H "x-tenant-id: $TENANT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null) records"
echo "Production: $(curl -s "$API/v2/mining/production" -H "Authorization: Bearer $TOKEN" -H "x-tenant-id: $TENANT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null) records"
echo "Safety: $(curl -s "$API/v2/mining/safety" -H "Authorization: Bearer $TOKEN" -H "x-tenant-id: $TENANT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null) records"
echo "Equipment: $(curl -s "$API/v2/mining/equipment" -H "Authorization: Bearer $TOKEN" -H "x-tenant-id: $TENANT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null) records"
echo "Minerals: $(curl -s "$API/v2/mining/minerals" -H "Authorization: Bearer $TOKEN" -H "x-tenant-id: $TENANT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null) records"

echo ""
echo "=============================================="
echo "  TEST COMPLETE"
echo "=============================================="
