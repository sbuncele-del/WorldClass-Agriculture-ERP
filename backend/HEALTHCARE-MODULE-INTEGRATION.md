# Healthcare Module - Integration Architecture

## 🏥 Overview
The Healthcare Operations Intelligence Module is **NOT** a standalone system - it's an integrated component of the complete ERP ecosystem. It focuses on **operational intelligence** unique to healthcare, while leveraging existing ERP modules for shared functionality.

---

## 🔗 Integration Philosophy

### "We are not building a standalone module, but one integrated in the whole ecosystem"

| Healthcare Needs | ERP Module Used | Why |
|-----------------|----------------|-----|
| **Staff Scheduling** | HR Module | Employee records, payroll, time tracking already exist |
| **Medical Equipment** | Asset Management | Equipment tracking, maintenance, depreciation already exist |
| **Medical Supplies** | Inventory Module | Stock management, reordering, warehousing already exist |
| **Revenue/Billing** | Financial Accounting | GL accounts, journal entries, AR already exist |
| **Patient Billing** | GoodX (External) | Specialized medical billing, medical aid claims |

---

## 📊 What Healthcare Module DOES Provide

### 1. **Facilities Management** (Healthcare-Specific)
- Hospital/clinic locations
- Ward and room tracking
- Bed management (real-time occupancy)
- Operating theatre scheduling

### 2. **Patient Operations** (Core Healthcare)
- Patient master data (with GoodX sync)
- Appointment scheduling
- Visit tracking (check-in → discharge)
- Patient flow analytics
- Triage management

### 3. **Clinical Workflows** (Medical Processes)
- Vitals recording
- Clinical notes
- Lab orders and results
- Prescriptions
- Medical procedures

### 4. **Operational Intelligence** (Healthcare-Specific Analytics)
- Operations Command Center dashboard
- Patient journey visualization
- Bottleneck identification
- Wait time analytics
- Bed occupancy forecasting

### 5. **Facility Communications** (Healthcare Context)
- Department-specific messaging
- Emergency alerts
- Service requests (housekeeping, maintenance, etc.)
- Priority routing

---

## 🔄 How Integration Works

### Staff Management → HR Module

**Healthcare Perspective:**
```typescript
// Healthcare module needs to know: "Who is on duty in ICU right now?"
GET /api/healthcare/facilities/123/staff/schedule
```

**Behind the Scenes:**
```typescript
// 1. Healthcare queries healthcare_staff_schedules table
//    (contains shift assignments, department, facility_id)
// 2. Joins with HR module's employees table
//    (contains employee names, roles, contact info)
// 3. Returns integrated view for operational staff
```

**HR Module Handles:**
- Employee master data (names, ID numbers, addresses)
- Employment contracts and terms
- Payroll processing
- Leave management
- Performance reviews
- Time and attendance

**Healthcare Module Uses:**
- References staff_id from HR module
- Adds healthcare context (department, shift, ward assignment)
- Tracks clinical workload and utilization
- Links staff to patients, procedures, clinical notes

---

### Equipment Management → Asset Management Module

**Healthcare Perspective:**
```typescript
// Healthcare module needs: "Is the MRI machine operational?"
GET /api/healthcare/facilities/123/equipment/status
```

**Behind the Scenes:**
```typescript
// 1. Healthcare queries healthcare_equipment table
//    (contains medical equipment categorization, criticality flags)
// 2. Joins with Asset Management's assets table
//    (contains asset registry, maintenance records, depreciation)
// 3. Returns operational status for clinical staff
```

**Asset Management Handles:**
- Asset registry (purchase date, cost, location)
- Depreciation calculations
- Maintenance scheduling
- Asset transfers and disposals
- Warranty tracking

**Healthcare Module Adds:**
- Medical device classification (X-ray, ventilator, etc.)
- Criticality flags (life-critical equipment)
- Calibration and sterilization schedules
- Equipment downtime impact on patient care
- Usage tracking per procedure/department

---

### Medical Inventory → Inventory Module

**Healthcare Perspective:**
```typescript
// Healthcare module needs: "Do we have enough insulin?"
GET /api/healthcare/facilities/123/inventory/critical
```

**Behind the Scenes:**
```typescript
// 1. Healthcare queries medical_inventory table
//    (contains medical categorization, expiry tracking, criticality)
// 2. Joins with Inventory Module's inventory_items table
//    (contains stock levels, locations, reorder points)
// 3. Returns medicine availability with healthcare context
```

**Inventory Module Handles:**
- Stock management (quantities, locations, warehouses)
- Purchase orders and receiving
- Stock movements and adjustments
- Reorder automation
- Supplier management

**Healthcare Module Adds:**
- Medical categorization (medications, consumables, PPE)
- Expiry date tracking (critical for medicines)
- Criticality levels (life-saving drugs vs general supplies)
- Usage per patient/procedure
- Regulatory compliance tracking

---

### Revenue & Billing → Financial Accounting + GoodX

**Healthcare Perspective:**
```typescript
// Healthcare module needs: "How much revenue today?"
GET /api/healthcare/facilities/123/revenue/today
```

**Behind the Scenes:**
```typescript
// 1. GoodX captures patient billing (consultations, procedures, meds)
// 2. Healthcare module's goodx_revenue_capture table stores transaction
// 3. Automated sync creates journal entries in Financial Accounting
// 4. Revenue flows to GL accounts: 
//    Debit: Accounts Receivable (or Bank)
//    Credit: Revenue - Medical Services
```

**Financial Accounting Handles:**
- Chart of accounts
- Journal entries
- General ledger
- Financial statements
- Accounts receivable/payable

**GoodX Handles:**
- Patient billing and invoicing
- Medical aid claims (discovery, momentum, etc.)
- ICD-10 and tariff codes
- Medical scheme submissions
- Patient statements

**Healthcare Module Bridges:**
- Auto-captures revenue from GoodX
- Creates GL entries in Financial module
- Tracks outstanding medical aid claims
- Provides operational revenue visibility
- Reconciles GoodX vs ERP

---

## 🎯 User Experience Benefits

### For Operational Staff (Nurses, Receptionists, Clinical Staff)
✅ **Single Interface**: Don't need to learn HR system to see who's on duty
✅ **Healthcare Language**: Sees "ICU staff" not "department 42 employees"
✅ **Actionable Insights**: "3 patients waiting >30min" not raw data tables
✅ **Quick Actions**: Send service request, check bed availability, view patient journey

### For Management
✅ **Operational Intelligence**: Real-time facility performance
✅ **Predictive Analytics**: Forecast busy periods, resource needs
✅ **Consolidated View**: Financial + operational metrics together
✅ **Integration Transparency**: Data flows automatically between modules

### For Finance Team
✅ **Automated Revenue Capture**: GoodX → ERP (no manual entry)
✅ **Reconciliation Tools**: Compare GoodX billing vs ERP revenue
✅ **Audit Trail**: Full transaction tracking across systems
✅ **Financial Reporting**: Healthcare revenue in consolidated statements

---

## 🔧 Technical Integration Points

### Database Schema Integration

```sql
-- Healthcare references HR module
CREATE TABLE healthcare_staff_schedules (
    schedule_id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES employees(employee_id),  -- HR Module
    facility_id INTEGER REFERENCES healthcare_facilities(facility_id),
    shift_date DATE,
    department VARCHAR(50)
);

-- Healthcare references Asset Management
CREATE TABLE healthcare_equipment (
    equipment_id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(asset_id),  -- Asset Management Module
    equipment_type VARCHAR(100),
    is_critical BOOLEAN DEFAULT false
);

-- Healthcare references Inventory Module  
CREATE TABLE medical_inventory (
    medical_item_id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER REFERENCES inventory_items(item_id),  -- Inventory Module
    criticality_level VARCHAR(20),
    requires_cold_storage BOOLEAN
);

-- Healthcare creates revenue for Financial Module
CREATE TABLE goodx_revenue_capture (
    revenue_capture_id SERIAL PRIMARY KEY,
    journal_entry_id INTEGER REFERENCES journal_entries(entry_id),  -- Financial Module
    goodx_transaction_id VARCHAR(100),
    patient_id INTEGER,
    net_amount DECIMAL(15,2)
);
```

### API Integration Pattern

```typescript
// Example: Get staff availability for surgery
export const getStaffForSurgery = async (facilityId: number, surgeryType: string) => {
    // 1. Query HR module for available surgeons
    const surgeons = await hrModule.getAvailableStaff({
        role: 'SURGEON',
        specialization: surgeryType,
        status: 'AVAILABLE'
    });

    // 2. Query Healthcare for current workload
    const workload = await healthcareDB.getStaffWorkload(surgeons.map(s => s.staff_id));

    // 3. Combine and return integrated view
    return surgeons.map(surgeon => ({
        ...surgeon,
        current_workload: workload[surgeon.staff_id],
        available_for_surgery: workload[surgeon.staff_id] < 3 // max 3 procedures per day
    }));
};
```

---

## 📋 Module Responsibility Matrix

| Function | HR Module | Asset Management | Inventory | Financial | Healthcare |
|----------|-----------|-----------------|-----------|-----------|------------|
| Employee records | ✅ Owner | - | - | - | 👁️ View |
| Payroll | ✅ Owner | - | - | ✅ Processes | - |
| Shift scheduling | 👁️ View | - | - | - | ✅ Owner |
| Equipment registry | - | ✅ Owner | - | - | 👁️ View |
| Maintenance scheduling | - | ✅ Owner | - | - | 👁️ View |
| Equipment criticality | - | - | - | - | ✅ Owner |
| Stock management | - | - | ✅ Owner | - | 👁️ View |
| Reordering | - | - | ✅ Owner | - | 👁️ View |
| Medicine expiry | - | - | 👁️ View | - | ✅ Owner |
| Journal entries | - | - | - | ✅ Owner | 🔄 Creates |
| Revenue recognition | - | - | - | ✅ Owner | 🔄 Captures |
| Patient billing | - | - | - | - | 🔗 GoodX |
| Patient records | - | - | - | - | ✅ Owner |
| Clinical workflows | - | - | - | - | ✅ Owner |
| Bed management | - | - | - | - | ✅ Owner |
| Facility operations | - | - | - | - | ✅ Owner |

**Legend:**
- ✅ Owner: Primary responsibility and data storage
- 👁️ View: Read-only access for operational needs
- 🔄 Creates: Generates data for another module
- 🔗 External: Handled by external system

---

## 🚀 Implementation Benefits

### Avoids Redundancy
❌ **Don't build**: Separate employee database in Healthcare
✅ **Do integrate**: Reference HR module's employees

❌ **Don't build**: Duplicate asset tracking in Healthcare
✅ **Do integrate**: Add medical context to Asset Management

### Clear Module Boundaries
- **HR Module**: "Who are our employees?"
- **Healthcare Module**: "Which employees are on duty in ICU today?"

- **Asset Management**: "What equipment do we own?"
- **Healthcare Module**: "Is the MRI machine operational for patient care?"

- **Inventory Module**: "How much stock do we have?"
- **Healthcare Module**: "Do we have critical medications for tonight's ER shift?"

### User Confusion Prevention
- Operational staff uses **Healthcare module** (speaks their language)
- Healthcare module **transparently** pulls data from HR/Assets/Inventory
- Finance team sees **consolidated reports** (healthcare revenue + other revenue)
- No confusion about "where do I manage staff?" (HR) vs "where do I see who's on duty?" (Healthcare)

---

## 📝 Development Guidelines

### When Building Healthcare Features:

**Ask: "Is this unique to healthcare operations?"**
- ✅ Yes → Build in Healthcare module
  * Patient journey tracking
  * Triage management
  * Clinical notes
  * Bed occupancy

- ❌ No → Use existing module
  * Employee data → HR module
  * Equipment maintenance → Asset Management
  * Stock levels → Inventory module
  * Financial transactions → Financial Accounting

**Ask: "Does this have medical context?"**
- ✅ Yes → Add healthcare layer on top of existing module
  * Staff utilization → HR + Healthcare context
  * Equipment criticality → Assets + Medical categorization
  * Medicine expiry → Inventory + Regulatory tracking

**Ask: "Will operational staff understand this?"**
- ✅ Yes → Good UI/UX design
  * "ICU Staff Schedule" ✅
  * "Employee List - Department 42" ❌
  
  * "MRI Machine Status: Operational" ✅
  * "Asset #1234 Status: Active" ❌

---

## 🎓 Summary

The Healthcare Module is designed to:

1. **Focus on Healthcare Operations Intelligence** - What makes healthcare unique
2. **Leverage Existing ERP Capabilities** - Don't reinvent the wheel
3. **Provide Operational Context** - Translate ERP data into healthcare language
4. **Automate Integration** - GoodX → Healthcare → Financial (seamless)
5. **Speak to Users** - Operational staff, not just accountants

This approach creates a **powerful, integrated system** where:
- Data is entered once (single source of truth)
- Modules work together seamlessly
- Users get the right view for their role
- No redundancy or confusion
- Financial and operational views are always in sync

**Result**: A healthcare module that speaks to operational people while being fully integrated with the financial and accounting side of the business. 🏥✨
