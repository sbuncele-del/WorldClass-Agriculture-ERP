#!/bin/bash
# Final comprehensive Mining Module CRUD tests with correct field names
# This script tests all Mining module endpoints with proper payloads

# Don't exit on error - we want to see all results
set +e

API_URL="https://siyabusaerp.co.za/api"
EMAIL="miningtestx@test.co.za"
PASSWORD="Mining@12345"

echo "=============================================="
echo "   MINING MODULE - FINAL CRUD VERIFICATION"
echo "=============================================="
echo ""

# Step 1: Authenticate
echo "Step 1: Authenticating..."
AUTH_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${EMAIL}\", \"password\": \"${PASSWORD}\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.tokens.accessToken // .data.accessToken // .accessToken // .token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ FAILED - Could not get token"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

TENANT_ID=$(echo "$AUTH_RESPONSE" | jq -r '.data.tenant.id // .tenantId // .tenant_id // .data.tenantId // empty')
echo "✅ Authenticated - Token: ${TOKEN:0:20}..."
echo "   Tenant ID: $TENANT_ID"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Results tracking
PASS=0
FAIL=0
declare -a FAILED_TESTS=()

test_endpoint() {
  local METHOD=$1
  local ENDPOINT=$2
  local DATA=$3
  local TEST_NAME=$4
  local EXPECT_CODE=${5:-200}
  
  echo -n "Testing: $TEST_NAME... "
  
  if [ "$METHOD" = "GET" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}${ENDPOINT}" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -H "x-tenant-id: $TENANT_ID")
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X "$METHOD" "${API_URL}${ENDPOINT}" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -H "x-tenant-id: $TENANT_ID" \
      -d "$DATA")
  fi
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  SUCCESS=$(echo "$BODY" | jq -r '.success // empty' 2>/dev/null)
  
  if [[ "$HTTP_CODE" =~ ^2[0-9][0-9]$ ]] && [ "$SUCCESS" != "false" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $HTTP_CODE)"
    ((PASS++))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC} (HTTP $HTTP_CODE)"
    echo "   Response: $(echo "$BODY" | head -c 200)"
    ((FAIL++))
    FAILED_TESTS+=("$TEST_NAME: HTTP $HTTP_CODE")
    return 1
  fi
}

echo "=============================================="
echo "              MINING SITES CRUD              "
echo "=============================================="

# GET Sites
test_endpoint "GET" "/v2/mining/sites" "" "GET /v2/mining/sites"

# POST Site - Create new site with unique code
SITE_CODE="SITE-$(date +%s)"
SITE_DATA="{
  \"code\": \"$SITE_CODE\",
  \"name\": \"Final Test Mine\",
  \"location\": \"Mpumalanga, South Africa\",
  \"locationLat\": -25.7479,
  \"locationLng\": 28.2293,
  \"province\": \"Mpumalanga\",
  \"address\": \"Test Address 123\",
  \"areaHectares\": 500,
  \"mineralType\": \"coal\",
  \"miningMethod\": \"underground\",
  \"licenseNumber\": \"LIC-FINAL-001\",
  \"licenseExpiry\": \"2028-12-31\"
}"
test_endpoint "POST" "/v2/mining/sites" "$SITE_DATA" "POST /v2/mining/sites"

# Get the site ID for update test
SITES_RESPONSE=$(curl -s -X GET "${API_URL}/v2/mining/sites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID")
SITE_ID=$(echo "$SITES_RESPONSE" | jq -r '.data[0].id // empty')

if [ -n "$SITE_ID" ] && [ "$SITE_ID" != "null" ]; then
  # PUT Site - Update
  UPDATE_DATA='{"status": "active", "mineralType": "coal"}'
  test_endpoint "PUT" "/v2/mining/sites/$SITE_ID" "$UPDATE_DATA" "PUT /v2/mining/sites/:id"
else
  echo -e "${YELLOW}⚠️  SKIP${NC} PUT /v2/mining/sites/:id - No site ID available"
fi

echo ""
echo "=============================================="
echo "         MINING PRODUCTION CRUD              "
echo "=============================================="

# GET Production
test_endpoint "GET" "/v2/mining/production" "" "GET /v2/mining/production"

# POST Production - Record production with correct field names
if [ -n "$SITE_ID" ] && [ "$SITE_ID" != "null" ]; then
  PRODUCTION_DATA=$(cat <<EOF
{
  "siteId": "$SITE_ID",
  "extractionDate": "$(date +%Y-%m-%d)",
  "shiftType": "day",
  "mineralType": "coal",
  "quantityExtracted": 1500,
  "quantityUnit": "tonnes",
  "gradePercent": 92.5,
  "processingStatus": "unprocessed",
  "notes": "Final API test production record"
}
EOF
)
  test_endpoint "POST" "/v2/mining/production" "$PRODUCTION_DATA" "POST /v2/mining/production"
  
  # Get production ID for update test
  PROD_RESPONSE=$(curl -s -X GET "${API_URL}/v2/mining/production" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -H "x-tenant-id: $TENANT_ID")
  PROD_ID=$(echo "$PROD_RESPONSE" | jq -r '.data[0].id // empty')
  
  if [ -n "$PROD_ID" ] && [ "$PROD_ID" != "null" ]; then
    UPDATE_PROD='{"processingStatus": "processed", "gradePercent": 95.0}'
    test_endpoint "PUT" "/v2/mining/production/$PROD_ID" "$UPDATE_PROD" "PUT /v2/mining/production/:id"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP${NC} POST /v2/mining/production - No site ID available"
fi

echo ""
echo "=============================================="
echo "       MINING SAFETY INCIDENTS CRUD          "
echo "=============================================="

# GET Safety Incidents
test_endpoint "GET" "/v2/mining/safety-incidents" "" "GET /v2/mining/safety-incidents"

# POST Safety Incident with correct field names
if [ -n "$SITE_ID" ] && [ "$SITE_ID" != "null" ]; then
  INCIDENT_DATA=$(cat <<EOF
{
  "siteId": "$SITE_ID",
  "incidentDate": "$(date +%Y-%m-%d)",
  "incidentType": "near_miss",
  "severity": "minor",
  "location": "Section B Underground",
  "description": "Final API test - near miss incident for testing",
  "injuriesCount": 0,
  "fatalitiesCount": 0,
  "rootCause": "Equipment malfunction",
  "correctiveActions": "Equipment inspection scheduled"
}
EOF
)
  test_endpoint "POST" "/v2/mining/safety-incidents" "$INCIDENT_DATA" "POST /v2/mining/safety-incidents"
  
  # Get incident ID for update test
  INCIDENT_RESPONSE=$(curl -s -X GET "${API_URL}/v2/mining/safety-incidents" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -H "x-tenant-id: $TENANT_ID")
  INCIDENT_ID=$(echo "$INCIDENT_RESPONSE" | jq -r '.data[0].id // empty')
  
  if [ -n "$INCIDENT_ID" ] && [ "$INCIDENT_ID" != "null" ]; then
    UPDATE_INCIDENT='{"status": "investigating", "correctiveActions": "Full equipment inspection completed"}'
    test_endpoint "PUT" "/v2/mining/safety-incidents/$INCIDENT_ID" "$UPDATE_INCIDENT" "PUT /v2/mining/safety-incidents/:id"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP${NC} POST /v2/mining/safety-incidents - No site ID available"
fi

echo ""
echo "=============================================="
echo "        MINING EQUIPMENT CRUD                "
echo "=============================================="

# GET Equipment
test_endpoint "GET" "/v2/mining/equipment" "" "GET /v2/mining/equipment"

# POST Equipment with correct field names
if [ -n "$SITE_ID" ] && [ "$SITE_ID" != "null" ]; then
  EQUIPMENT_DATA=$(cat <<EOF
{
  "siteId": "$SITE_ID",
  "code": "EQ-FINAL-$(date +%s)",
  "name": "Final Test Excavator",
  "equipmentType": "excavator",
  "manufacturer": "Caterpillar",
  "model": "390F",
  "serialNumber": "SN-FINAL-$(date +%s)",
  "purchaseDate": "2023-01-15",
  "purchasePrice": 2500000.00,
  "lastMaintenanceDate": "2024-10-01",
  "nextMaintenanceDate": "2025-01-01"
}
EOF
)
  test_endpoint "POST" "/v2/mining/equipment" "$EQUIPMENT_DATA" "POST /v2/mining/equipment"
  
  # Get equipment ID for update test
  EQUIP_RESPONSE=$(curl -s -X GET "${API_URL}/v2/mining/equipment" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -H "x-tenant-id: $TENANT_ID")
  EQUIP_ID=$(echo "$EQUIP_RESPONSE" | jq -r '.data[0].id // empty')
  
  if [ -n "$EQUIP_ID" ] && [ "$EQUIP_ID" != "null" ]; then
    UPDATE_EQUIP='{"status": "operational", "operatingHours": 2500, "notes": "Regular maintenance completed"}'
    test_endpoint "PUT" "/v2/mining/equipment/$EQUIP_ID" "$UPDATE_EQUIP" "PUT /v2/mining/equipment/:id"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP${NC} POST /v2/mining/equipment - No site ID available"
fi

echo ""
echo "=============================================="
echo "          MINING MINERALS                    "
echo "=============================================="

# GET Minerals
test_endpoint "GET" "/v2/mining/minerals" "" "GET /v2/mining/minerals"

echo ""
echo "=============================================="
echo "          MINING DASHBOARD                   "
echo "=============================================="

# Dashboard
test_endpoint "GET" "/v2/mining/dashboard" "" "GET /v2/mining/dashboard"

echo ""
echo "=============================================="
echo "           FINAL RESULTS SUMMARY             "
echo "=============================================="
echo ""
echo -e "Total Tests: $((PASS + FAIL))"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "Failed Tests:"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  - $test"
  done
fi

echo ""
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}=============================================="
  echo "   🎉 ALL TESTS PASSED - MINING IS READY!    "
  echo "=============================================="
  echo ""
  echo "The Mining module is production-ready for your presentation!"
  echo -e "${NC}"
else
  echo -e "${RED}=============================================="
  echo "   ⚠️  SOME TESTS FAILED - NEEDS ATTENTION   "
  echo "=============================================="
  echo -e "${NC}"
fi
