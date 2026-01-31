#!/bin/bash
# MINING MODULE COMPLETE TEST

echo "=== MINING MODULE COMPLETE TEST ==="
echo ""

# Step 1: Create fresh account
echo "Creating test account..."
SIGNUP=$(curl -s -X POST https://siyabusaerp.co.za/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"companyName":"MiningTestX","companySlug":"miningtestx","email":"miningtestx@test.co.za","password":"Mining@12345","firstName":"Mining","lastName":"Tester","plan":"professional"}')

# Extract token (handle both possible formats)
TOKEN=$(echo "$SIGNUP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "Signup failed or user exists. Trying login..."
  LOGIN=$(curl -s -X POST https://siyabusaerp.co.za/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"miningtestx@test.co.za","password":"Mining@12345"}')
  TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✅ Got auth token"
echo ""

TENANT="1"

echo "=== Testing Mining Endpoints ==="
echo ""

test_endpoint() {
  local name=$1
  local path=$2
  local method=${3:-GET}
  
  RESP=$(curl -s -w "\n%{http_code}" "https://siyabusaerp.co.za/api$path" \
    -H "Authorization: Bearer $TOKEN" \
    -H "x-tenant-id: $TENANT" \
    -H "Content-Type: application/json")
  
  HTTP=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  
  if [ "$HTTP" == "200" ]; then
    echo "✅ $name - HTTP $HTTP"
    echo "   Response: $(echo $BODY | head -c 150)..."
  elif [ "$HTTP" == "401" ] || [ "$HTTP" == "403" ]; then
    echo "🔒 $name - HTTP $HTTP (Auth issue)"
  elif [ "$HTTP" == "404" ]; then
    echo "⚠️  $name - HTTP $HTTP (Not wired)"
  else
    echo "❌ $name - HTTP $HTTP"
    echo "   Error: $(echo $BODY | head -c 200)"
  fi
  echo ""
}

test_endpoint "Mining Sites" "/v2/mining/sites"
test_endpoint "Mining Production" "/v2/mining/production"
test_endpoint "Mining Safety" "/v2/mining/safety"
test_endpoint "Mining Dashboard" "/v2/mining/dashboard"
test_endpoint "Mining Equipment" "/v2/mining/equipment"
test_endpoint "Mining Minerals" "/v2/mining/minerals"

echo "=== Test Creating a Mining Site ==="
CREATE=$(curl -s -w "\n%{http_code}" -X POST "https://siyabusaerp.co.za/api/v2/mining/sites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Mine Site","location":"Johannesburg","type":"underground","status":"active"}')

HTTP=$(echo "$CREATE" | tail -1)
BODY=$(echo "$CREATE" | sed '$d')
echo "POST /v2/mining/sites - HTTP $HTTP"
echo "Response: $BODY"

echo ""
echo "=== MINING MODULE TEST COMPLETE ==="
