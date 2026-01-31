# Logistics Module - Complete Documentation

## 📅 Completed: January 17, 2026
## 🏷️ Version: v2.0.0-logistics-tested
## 📦 Task Definition: 68 | Image: jan17-logistics-fix2

---

# PART 1: INFRASTRUCTURE REFERENCE

This section documents how modules are deployed. Use this as a template for all future module deployments.

---

## 1.1 AWS Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS Cape Town (af-south-1)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐  │
│  │   Application   │     │    Database     │     │    Cache     │  │
│  │   Load Balancer │     │    (RDS)        │     │   (Redis)    │  │
│  │                 │     │                 │     │              │  │
│  │ worldclass-erp- │     │ worldclass-erp- │     │ worldclass-  │  │
│  │ alb-1149802512  │     │ db.c92ou2c2e43l │     │ redis.raszuy │  │
│  └────────┬────────┘     └────────┬────────┘     └──────┬───────┘  │
│           │                       │                      │          │
│           ▼                       ▼                      ▼          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    ECS Fargate Cluster                      │   │
│  │                  worldclass-erp-cluster                     │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │              Backend Service (Node.js)               │   │   │
│  │  │            worldclass-erp-backend:68                 │   │   │
│  │  │          Image: jan17-logistics-fix2                 │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    ECR Repository                            │   │
│  │  483636500494.dkr.ecr.af-south-1.amazonaws.com/              │   │
│  │                    worldclass-erp-backend                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1.2 Key Infrastructure Details

### Backend API
| Item | Value |
|------|-------|
| **ALB URL** | `https://worldclass-erp-alb-1149802512.af-south-1.elb.amazonaws.com` |
| **ECS Cluster** | `worldclass-erp-cluster` |
| **Service Name** | `worldclass-erp-backend` |
| **Current Task Def** | `worldclass-erp-backend:68` |
| **Current Image** | `jan17-logistics-fix2` |
| **Container Port** | 3000 |
| **CPU/Memory** | 512 / 1024 MB |
| **Platform** | Fargate 1.4.0 (Linux) |

### Database (PostgreSQL on RDS)
| Item | Value |
|------|-------|
| **Host** | `worldclass-erp-db.c92ou2c2e43l.af-south-1.rds.amazonaws.com` |
| **Port** | 5432 |
| **Database** | `erp_database` |
| **User** | `erpadmin` |
| **Schema** | `logistics` (for this module) |

### Redis Cache
| Item | Value |
|------|-------|
| **Host** | `worldclass-redis.raszuy.0001.afs1.cache.amazonaws.com` |
| **Port** | 6379 |

### ECR Repository
| Item | Value |
|------|-------|
| **Repository URI** | `483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-backend` |
| **Region** | `af-south-1` |

---

## 1.3 Deployment Process (Step-by-Step)

Use these exact steps when deploying any module:

### Step 1: Build Backend
```bash
cd /workspaces/WorldClass-ERP/backend
npm run build
```

### Step 2: Build Docker Image
```bash
IMAGE_TAG="your-image-tag"
docker build -t worldclass-erp-backend:$IMAGE_TAG .
```

### Step 3: Login to ECR
```bash
aws ecr get-login-password --region af-south-1 | \
  docker login --username AWS --password-stdin \
  483636500494.dkr.ecr.af-south-1.amazonaws.com
```

### Step 4: Tag & Push Image
```bash
docker tag worldclass-erp-backend:$IMAGE_TAG \
  483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-backend:$IMAGE_TAG

docker push 483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-backend:$IMAGE_TAG
```

### Step 5: Update Task Definition
```bash
# Get current task definition
aws ecs describe-task-definition --task-definition worldclass-erp-backend \
  --region af-south-1 --query 'taskDefinition' > /tmp/task-def.json

# Clean up and update image
cat /tmp/task-def.json | jq '
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, 
      .compatibilities, .registeredAt, .registeredBy) | 
  .containerDefinitions[0].image = "483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-backend:'$IMAGE_TAG'"
' > /tmp/task-def-new.json

# Register new revision
aws ecs register-task-definition --cli-input-json file:///tmp/task-def-new.json \
  --region af-south-1 --query 'taskDefinition.revision' --output text
```

### Step 6: Deploy to ECS
```bash
REVISION=XX  # The revision number from Step 5
aws ecs update-service \
  --cluster worldclass-erp-cluster \
  --service worldclass-erp-backend \
  --task-definition worldclass-erp-backend:$REVISION \
  --force-new-deployment \
  --region af-south-1
```

### Step 7: Monitor Deployment
```bash
# Check rollout status
aws ecs describe-services \
  --cluster worldclass-erp-cluster \
  --services worldclass-erp-backend \
  --region af-south-1 \
  --query 'services[0].deployments[0].rolloutState'
# Wait until: "COMPLETED"
```

---

## 1.4 Testing in Production

### Get Auth Token
```bash
TOKEN=$(curl -sLk -X POST \
  "https://worldclass-erp-alb-1149802512.af-south-1.elb.amazonaws.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@siyabusaerp.co.za","password":"Admin123!"}' \
  | jq -r '.data.tokens.accessToken')
```

### Test an Endpoint
```bash
curl -sLk -X GET \
  "https://worldclass-erp-alb-1149802512.af-south-1.elb.amazonaws.com/api/v2/your-endpoint" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 1.5 Git Versioning

### Commit Convention
```
feat(module): short description
fix(module): short description

Body with details...

Deployed: Task definition XX, Image tag-name
```

### Tagging
```bash
git tag -a v2.0.0-module-name -m "Description"
git push origin main --tags
```

### Current Tags
- `v2.0.0-healthcare-complete` - Healthcare module with full automation
- `v2.0.0-logistics-complete` - Logistics automation (initial)
- `v2.0.0-logistics-tested` - Logistics tested in production

---

## 1.6 Database Schema (Logistics)

### Core Tables
```sql
logistics.vehicles          -- Fleet vehicles
logistics.drivers           -- Driver records
logistics.trips             -- Trip records
logistics.routes            -- Route definitions
logistics.shipments         -- Shipment tracking
logistics.fuel_transactions -- Fuel records
logistics.loads             -- Load/cargo details
logistics.gps_positions     -- GPS tracking data
```

### Key Column Mappings (IMPORTANT!)
| What You Might Expect | Actual Column Name |
|-----------------------|-------------------|
| `registration` | `vehicle_registration` |
| `odometer` | `current_odometer` |
| `license_code` | `license_type` |
| `invoice_amount` | `revenue` |
| `started_at` | `actual_start` |
| `delivered_at` | `actual_end` |
| `origin_name` | `origin` |
| `destination_name` | `destination` |
| `d.assigned_vehicle_id` | Use `v.current_driver_id = d.driver_id` |

---

# PART 2: USER GUIDE - HOW THE LOGISTICS SYSTEM WORKS

This explains the complete workflow from a user's perspective - step by step.

---

## 2.1 Overview: What This System Does

The Logistics Module automates your entire transport operation:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    LOGISTICS WORKFLOW                                │
│                                                                      │
│  📦 LOAD RECEIVED → 🚛 DISPATCH → 🛣️ TRIP → 📋 POD → 💰 INVOICE    │
│                                                                      │
│  1. Customer places order                                            │
│  2. System auto-assigns best driver                                  │
│  3. Driver does pre-trip checklist                                   │
│  4. Route optimized with fuel stops                                  │
│  5. Real-time tracking during trip                                   │
│  6. POD captured at delivery                                         │
│  7. Invoice auto-generated                                           │
│  8. Profitability reports available                                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2.2 Step-by-Step: The Complete Journey

### 🔵 STEP 1: A Load Comes In

**What Happens:**
A customer calls/emails: "I need 15 tons moved from Johannesburg to Cape Town tomorrow morning."

**You Do:**
Go to **Logistics → Trips → New Trip** and enter:
- Origin: Johannesburg
- Destination: Cape Town
- Pickup Date/Time: Tomorrow 08:00
- Cargo Type: General
- Weight: 15,000 kg

**API Call (Behind the Scenes):**
```
POST /api/v2/logistics/trips
{
  "origin": "Johannesburg",
  "destination": "Cape Town",
  "scheduledStart": "2026-01-18T08:00:00Z",
  "cargoType": "GENERAL",
  "weightKg": 15000,
  "customerId": "customer-uuid"
}
```

---

### 🔵 STEP 2: Smart Dispatch - System Recommends Best Driver

**What Happens Automatically:**
The system analyzes ALL available drivers and vehicles to find the best match.

**It Considers:**
- ✅ Driver's current location (closest to pickup)
- ✅ Vehicle capacity (can carry 15 tons?)
- ✅ Driver's license valid (PDP not expired?)
- ✅ Driver's available hours (RTMS compliance - max 9hrs driving)
- ✅ Driver's performance score (on-time delivery rate, customer ratings)
- ✅ Vehicle maintenance status (no critical defects?)

**You See:**
A ranked list of recommended drivers:

| Rank | Driver | Vehicle | Distance to Pickup | ETA | Score | Status |
|------|--------|---------|-------------------|-----|-------|--------|
| ⭐1 | John Nkosi | ND 123 GP | 5 km | 20 min | 95 | Best Match |
| 2 | Peter Moyo | CA 456 GP | 15 km | 35 min | 88 | Good Option |
| 3 | Sarah Dube | CY 789 GP | 25 km | 50 min | 82 | Available |

**You Do:**
Click "Assign" next to John Nkosi.

**API Call:**
```
POST /api/v2/logistics/automation/dispatch
{
  "loadId": "trip-123",
  "origin": "JHB",
  "destination": "CPT",
  "pickupTime": "2026-01-18T08:00:00Z",
  "cargoType": "GENERAL",
  "weightKg": 15000
}
```

---

### 🔵 STEP 3: Route Optimization

**What Happens Automatically:**
Once a driver is assigned, the system calculates the optimal route.

**You See (Route Details):**
```
╔════════════════════════════════════════════════════════════╗
║  OPTIMIZED ROUTE: Johannesburg → Cape Town                 ║
╠════════════════════════════════════════════════════════════╣
║  Total Distance:     1,400 km                              ║
║  Estimated Duration: 14 hours                              ║
║  Estimated Fuel:     490 liters (R11,515)                  ║
║  Toll Costs:         R850                                  ║
╠════════════════════════════════════════════════════════════╣
║  RECOMMENDED FUEL STOPS:                                   ║
║  1. Engen 1-Stop, Midrand (R23.45/L)                       ║
║  2. Shell Ultra City, Harrismith (R23.52/L)                ║
║  3. Total, Three Sisters (R23.61/L)                        ║
╠════════════════════════════════════════════════════════════╣
║  ⚠️ TRAFFIC ALERTS:                                        ║
║  • Rush hour expected N1 Johannesburg - depart after 09:00 ║
║  • Roadworks on N12 near Potchefstroom                     ║
╠════════════════════════════════════════════════════════════╣
║  ALTERNATIVE: Toll-Free Route                              ║
║  Distance: 1,600 km | Duration: 16 hrs | Tolls: R0         ║
╚════════════════════════════════════════════════════════════╝
```

**API Call:**
```
POST /api/v2/logistics/automation/optimize-route
{
  "origin": "JHB",
  "destination": "CPT",
  "vehicleType": "SUPER"
}
```

---

### 🔵 STEP 4: Driver Notification & Pre-Trip Checklist

**What Happens:**
- Driver receives notification on mobile app: "New trip assigned"
- Driver sees trip details, route, and pickup time

**Before Starting - Pre-Trip Checklist (REQUIRED)**

The driver MUST complete a 35-item checklist before the vehicle moves. This is RTMS/legal compliance.

**Driver's Mobile App Shows:**

```
╔════════════════════════════════════════════════════════════╗
║           PRE-TRIP INSPECTION CHECKLIST                    ║
║           Trip: JHB → CPT | Vehicle: ND 123 GP             ║
╠════════════════════════════════════════════════════════════╣
║  EXTERIOR CHECKS                              [0/8 Done]   ║
║  ┌──────────────────────────────────────────────────────┐  ║
║  │ [ ] Headlights (high & low beam)           ⚠️ Critical │  ║
║  │ [ ] Brake lights                           ⚠️ Critical │  ║
║  │ [ ] Indicators (front & rear)              ⚠️ Critical │  ║
║  │ [ ] Reflectors present & clean                        │  ║
║  │ [ ] Side mirrors secure                    ⚠️ Critical │  ║
║  │ [ ] Windscreen (no cracks >10cm)           ⚠️ Critical │  ║
║  │ [ ] Wipers functional                      ⚠️ Critical │  ║
║  │ [ ] Number plates visible                             │  ║
║  └──────────────────────────────────────────────────────┘  ║
║                                                            ║
║  TYRES & WHEELS                               [0/6 Done]   ║
║  ┌──────────────────────────────────────────────────────┐  ║
║  │ [ ] Tyre pressure (all wheels)             ⚠️ Critical │  ║
║  │ [ ] Tyre tread depth >1mm                  ⚠️ Critical │  ║
║  │ [ ] Spare tyre condition                              │  ║
║  │ [ ] Wheel nuts secure                      ⚠️ Critical │  ║
║  │ [ ] No visible damage                                 │  ║
║  │ [ ] Mudflaps fitted                                   │  ║
║  └──────────────────────────────────────────────────────┘  ║
║                                                            ║
║  ... (more categories: ENGINE, CABIN, SAFETY, DOCUMENTS)   ║
║                                                            ║
║  [Take Photo of Odometer: ___________]                     ║
║                                                            ║
║  [Driver Signature: ___________________]                   ║
║                                                            ║
║          [ SUBMIT INSPECTION ]                             ║
╚════════════════════════════════════════════════════════════╝
```

**If Driver Finds a Defect:**
- Critical defect (e.g., brakes not working) → Vehicle STOPS, cannot proceed
- High defect → Return to depot within 24 hours
- Medium defect → Schedule repair at next service

**API Call (Get Checklist):**
```
GET /api/v2/logistics/compliance/pre-trip/checklist
```

**API Call (Submit Inspection):**
```
POST /api/v2/logistics/compliance/pre-trip/submit
{
  "inspectionId": "insp-123",
  "vehicleId": "vehicle-uuid",
  "driverId": "driver-uuid",
  "tripId": "trip-123",
  "responses": [
    { "checklistItemId": "EXT001", "passed": true },
    { "checklistItemId": "EXT002", "passed": true },
    ...
  ],
  "odometer": 125000,
  "driverSignature": "base64-signature-data"
}
```

---

### 🔵 STEP 5: Trip Starts - Real-Time Tracking

**What Happens:**
- Driver marks "Trip Started"
- GPS tracking begins
- System monitors:
  - Current location
  - Speed (alerts if over limit)
  - Driving hours (alerts when approaching 9-hour limit)
  - Estimated arrival time

**You See (Control Room Dashboard):**
```
╔════════════════════════════════════════════════════════════╗
║  LIVE TRIP TRACKING                                        ║
╠════════════════════════════════════════════════════════════╣
║  Trip: TRP-2026-00145                                      ║
║  Driver: John Nkosi | Vehicle: ND 123 GP                   ║
║  Route: Johannesburg → Cape Town                           ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  📍 Current Location: Bloemfontein (N1)                    ║
║  🕐 Time on Road: 4h 23m                                   ║
║  ⏱️ Time Remaining: 4h 15m (driving limit)                 ║
║  📏 Distance Covered: 420 km                               ║
║  📏 Distance Remaining: 980 km                             ║
║  🕐 ETA: Today 18:45                                       ║
║                                                            ║
║  ⛽ Last Fuel: Shell Harrismith (150L @ R3,528)            ║
║                                                            ║
║  [MAP SHOWING VEHICLE POSITION]                            ║
║        🚛 ←── Current Position                             ║
║       JHB ●━━━━━━●━━━━━━━━━━━━━━━━● CPT                    ║
║                 ↑                                          ║
║              You Are Here                                  ║
╚════════════════════════════════════════════════════════════╝
```

**RTMS Compliance - Driving Hours:**
```
╔═══════════════════════════════════════════╗
║  DRIVER HOURS - John Nkosi                ║
╠═══════════════════════════════════════════╣
║  Today's Driving:     4h 23m / 9h max     ║
║  ████████░░░░░░░░░░░░ 49%                 ║
║                                           ║
║  Time Until Mandatory Rest: 4h 37m        ║
║  (Must take 30-min break after 5.5 hrs)   ║
║                                           ║
║  Weekly Total: 32h / 56h max              ║
║  ████████████████░░░░░░░░░░ 57%           ║
╚═══════════════════════════════════════════╝
```

---

### 🔵 STEP 6: Arrival & Proof of Delivery (POD)

**What Happens:**
Driver arrives at destination. Customer receives goods.

**Driver's Mobile App:**
```
╔════════════════════════════════════════════════════════════╗
║            PROOF OF DELIVERY                               ║
║            Trip: TRP-2026-00145                             ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Delivered To: ABC Warehouse, Cape Town                    ║
║  Contact Person: [_______________]                         ║
║                                                            ║
║  Delivery Status:                                          ║
║  ○ Complete - All goods delivered                          ║
║  ○ Partial - Some items missing                            ║
║  ○ Rejected - Customer refused                             ║
║                                                            ║
║  Condition of Goods:                                       ║
║  ○ Good condition                                          ║
║  ○ Minor damage                                            ║
║  ○ Significant damage                                      ║
║                                                            ║
║  📷 REQUIRED PHOTOS:                                       ║
║  [+] Photo of delivered goods                              ║
║  [+] Photo of delivery note                                ║
║  [+] Photo of receiving area                               ║
║                                                            ║
║  Receiver's Name: [_______________]                        ║
║  Receiver's ID:   [_______________]                        ║
║                                                            ║
║  ┌──────────────────────────────────────┐                  ║
║  │                                      │                  ║
║  │     [SIGNATURE CAPTURE BOX]          │                  ║
║  │                                      │                  ║
║  └──────────────────────────────────────┘                  ║
║                                                            ║
║  Odometer at Delivery: [_________]                         ║
║                                                            ║
║              [ COMPLETE DELIVERY ]                         ║
╚════════════════════════════════════════════════════════════╝
```

---

### 🔵 STEP 7: Auto-Invoice Generation (Triggered by POD)

**What Happens Automatically:**
The moment the driver submits the POD, the system:
1. Calculates all trip costs
2. Applies the customer's rate card
3. Generates a professional invoice
4. Sends it to the customer (optional)

**API Call (Triggered Automatically):**
```
POST /api/v2/logistics/costing/pod-complete
{
  "tripId": "trip-123",
  "podData": {
    "receiverName": "John Smith",
    "receiverId": "8001015009087",
    "deliveryStatus": "COMPLETE",
    "goodsCondition": "GOOD",
    "photos": ["url1", "url2", "url3"],
    "signature": "base64-signature",
    "odometerEnd": 126400
  }
}
```

**Generated Invoice:**
```
╔════════════════════════════════════════════════════════════════════╗
║                        TAX INVOICE                                 ║
║                                                                    ║
║  SiyaBusa Logistics (Pty) Ltd                                      ║
║  VAT: 4123456789                                                   ║
║  123 Transport Road, Johannesburg                                  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Invoice No:    INV-2026-00891                                     ║
║  Invoice Date:  17 January 2026                                    ║
║  Due Date:      31 January 2026                                    ║
║                                                                    ║
║  Bill To:                                                          ║
║  ABC Manufacturing (Pty) Ltd                                       ║
║  456 Industrial Ave, Cape Town                                     ║
║  VAT: 4987654321                                                   ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║  TRIP DETAILS                                                      ║
║  ─────────────────────────────────────────────────────────────     ║
║  Trip Reference:   TRP-2026-00145                                  ║
║  Route:            Johannesburg → Cape Town                        ║
║  Distance:         1,400 km                                        ║
║  Vehicle:          ND 123 GP (34-Ton Superlink)                    ║
║  Driver:           John Nkosi                                      ║
║  POD Reference:    POD-2026-00145                                  ║
║  Delivery Date:    17 January 2026, 18:23                          ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║  DESCRIPTION                          QTY      RATE        AMOUNT  ║
║  ─────────────────────────────────────────────────────────────     ║
║  Transport: JHB-CPT (per km)         1,400    R12.50    R17,500.00 ║
║  Fuel Surcharge (current rate)          1    R2,500     R2,500.00  ║
║  Toll Costs (actual)                    1      R850       R850.00  ║
║  Overnight Allowance                    1      R350       R350.00  ║
║                                                                    ║
║  ─────────────────────────────────────────────────────────────     ║
║                                      SUBTOTAL:          R21,200.00 ║
║                                      VAT (15%):          R3,180.00 ║
║                                      ─────────────────────────────  ║
║                                      TOTAL DUE:         R24,380.00 ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║  BANKING DETAILS                                                   ║
║  Bank: First National Bank                                         ║
║  Account: SiyaBusa Logistics                                       ║
║  Acc No: 62123456789                                               ║
║  Branch: 250655                                                    ║
║  Reference: INV-2026-00891                                         ║
╚════════════════════════════════════════════════════════════════════╝
```

---

### 🔵 STEP 8: Reports & Analytics

**Available Reports:**

#### 8.1 Costing Dashboard
```
GET /api/v2/logistics/costing/dashboard?period=month
```

Shows:
- Total Revenue: R450,000
- Total Costs: R346,500
- Profit Margin: 23%
- Top Customers by Revenue
- Cost Breakdown (Fuel 40%, Driver 25%, Tolls 10%, etc.)

#### 8.2 Route Profitability
```
GET /api/v2/logistics/costing/route-profitability
```

Shows which routes make money:
```
╔══════════════════════════════════════════════════════════════════╗
║                    ROUTE PROFITABILITY ANALYSIS                  ║
╠══════════════════════════════════════════════════════════════════╣
║  Route              │ Trips │ Revenue   │ Costs     │ Margin    ║
║  ───────────────────┼───────┼───────────┼───────────┼───────────║
║  JHB → CPT          │   45  │ R 985,000 │ R 738,750 │ 25% ✅    ║
║  JHB → DBN          │   62  │ R 620,000 │ R 508,400 │ 18% ✅    ║
║  CPT → PE           │   28  │ R 196,000 │ R 180,320 │  8% ⚠️    ║
║  DBN → JHB          │   55  │ R 440,000 │ R 422,400 │  4% ❌    ║
╚══════════════════════════════════════════════════════════════════╝

RECOMMENDATIONS:
⚠️ CPT → PE: Consider raising rates or finding backhaul loads
❌ DBN → JHB: Route is unprofitable - review pricing strategy
```

#### 8.3 Driver Performance
```
GET /api/v2/logistics/automation/driver-scoring/{driverId}
```

Shows:
- On-time delivery rate: 94%
- Customer rating: 4.7/5
- Fuel efficiency: Good (vs baseline)
- Incidents: 0 in last 90 days
- Safe driving score: 88/100

#### 8.4 Maintenance Dashboard
```
GET /api/v2/logistics/maintenance/dashboard
```

Shows:
- Vehicles needing service: 5
- Overdue services: 3
- Upcoming services (7 days): 8
- Open defects: 2

#### 8.5 Compliance Status
```
GET /api/v2/logistics/compliance/license-expiry?daysAhead=30
```

Shows:
- Expired licenses: 0
- Expiring in 7 days: 1 (Driver PDP)
- Expiring in 30 days: 3 (Vehicle licenses)

---

## 2.3 Quick Reference - All API Endpoints

### Dispatch & Routing
| Action | Method | Endpoint |
|--------|--------|----------|
| Smart Dispatch | POST | `/api/v2/logistics/automation/dispatch` |
| Optimize Route | POST | `/api/v2/logistics/automation/optimize-route` |
| Driver Scoring | GET | `/api/v2/logistics/automation/driver-scoring/{driverId}` |
| Find Backhaul | POST | `/api/v2/logistics/automation/backhaul` |

### Compliance
| Action | Method | Endpoint |
|--------|--------|----------|
| Get Pre-Trip Checklist | GET | `/api/v2/logistics/compliance/pre-trip/checklist` |
| Start Pre-Trip Inspection | POST | `/api/v2/logistics/compliance/pre-trip/start` |
| Submit Inspection | POST | `/api/v2/logistics/compliance/pre-trip/submit` |
| Driver Hours | GET | `/api/v2/logistics/compliance/driver-hours/{driverId}` |
| License Expiry | GET | `/api/v2/logistics/compliance/license-expiry` |

### Maintenance
| Action | Method | Endpoint |
|--------|--------|----------|
| Maintenance Schedule | GET | `/api/v2/logistics/maintenance/schedule` |
| Predictive Alerts | GET | `/api/v2/logistics/maintenance/predictive` |
| Report Defect | POST | `/api/v2/logistics/maintenance/defects` |
| Open Defects | GET | `/api/v2/logistics/maintenance/defects/open` |
| Book Service | POST | `/api/v2/logistics/maintenance/book` |

### Costing & Invoicing
| Action | Method | Endpoint |
|--------|--------|----------|
| Calculate Trip Cost | GET | `/api/v2/logistics/costing/trip/{tripId}` |
| Generate Invoice | POST | `/api/v2/logistics/costing/invoice/generate` |
| POD Complete (Auto-Invoice) | POST | `/api/v2/logistics/costing/pod-complete` |
| Route Profitability | GET | `/api/v2/logistics/costing/route-profitability` |
| Driver Pay | GET | `/api/v2/logistics/costing/driver-pay/{driverId}` |
| Fuel Reconciliation | GET | `/api/v2/logistics/costing/fuel-reconciliation/{vehicleId}` |
| Costing Dashboard | GET | `/api/v2/logistics/costing/dashboard` |

---

## 2.4 Summary: The Complete Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  📦 CUSTOMER ORDER                                                  │
│      │                                                              │
│      ▼                                                              │
│  🚛 SMART DISPATCH ───────────────────────────────────────────┐     │
│      │ • Find best driver (location, capacity, hours)         │     │
│      │ • Check vehicle availability                           │     │
│      │ • Verify compliance (license, PDP)                     │     │
│      ▼                                                        │     │
│  🛣️ ROUTE OPTIMIZATION                                        │     │
│      │ • Calculate fastest route                              │     │
│      │ • Estimate fuel costs & stops                          │     │
│      │ • Check tolls                                          │     │
│      │ • Traffic alerts                                       │     │
│      ▼                                                        │     │
│  📋 PRE-TRIP CHECKLIST (Driver Mobile App)                    │     │
│      │ • 35 safety items                                      │     │
│      │ • Photo evidence                                       │     │
│      │ • Driver signature                                     │     │
│      │ • Defect reporting                                     │     │
│      ▼                                                        │     │
│  🚚 TRIP IN PROGRESS                                          │     │
│      │ • GPS tracking                                         │     │
│      │ • Speed monitoring                                     │     │
│      │ • Hours compliance (RTMS)                              │     │
│      │ • Fuel capture                                         │     │
│      ▼                                                        │     │
│  ✅ DELIVERY & POD                                            │     │
│      │ • Delivery confirmation                                │     │
│      │ • Photo proof                                          │     │
│      │ • Receiver signature                                   │     │
│      │ • Goods condition                                      │     │
│      ▼                                                        │     │
│  💰 AUTO-INVOICE ◄────────────────────────────────────────────┘     │
│      │ • Calculate trip costs                                       │
│      │ • Apply rate card                                            │
│      │ • Generate invoice                                           │
│      │ • GL posting                                                 │
│      ▼                                                              │
│  📊 REPORTS & ANALYTICS                                             │
│      • Route profitability                                          │
│      • Driver performance                                           │
│      • Fleet costs                                                  │
│      • Compliance status                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2.5 Test Credentials

| Item | Value |
|------|-------|
| **API URL** | `https://worldclass-erp-alb-1149802512.af-south-1.elb.amazonaws.com` |
| **Email** | `admin@siyabusaerp.co.za` |
| **Password** | `Admin123!` |
| **Tenant ID** | `d0a49212-96f5-46c7-9d69-fec0f235a90c` |

---

# PART 3: FILES CREATED/MODIFIED

## Services (in `/backend/src/services/`)
1. **logistics-automation.service.ts** (24KB)
   - Smart dispatch algorithm
   - Route optimization with SA hubs
   - Driver scoring system
   - Backhaul matching

2. **logistics-compliance.service.ts** (29KB)
   - RTMS hours tracking
   - 35-item pre-trip checklist
   - License/PDP expiry monitoring
   - Cross-border permit tracking

3. **logistics-maintenance.service.ts** (28KB)
   - Service scheduling
   - Predictive maintenance
   - Defect reporting workflow
   - Cost analysis

4. **logistics-costing.service.ts** (33KB)
   - Trip cost calculation
   - Auto-invoice generation
   - Route profitability analysis
   - Fuel reconciliation

## Controller
- **logistics-automation.controller.v2.ts** (18KB) - REST API controller

## Routes
- **v2.routes.ts** - Added ~50 new endpoints

---

**Document Created:** January 17, 2026
**Last Updated:** January 17, 2026
**Author:** GitHub Copilot

