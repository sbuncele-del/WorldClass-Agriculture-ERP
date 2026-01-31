# Healthcare Dashboard & Workspace Endpoints

## 🎯 Overview
Comprehensive backend endpoints to power **Healthcare Operations Dashboards** and **Workspaces** in the frontend.

**Total New Endpoints**: 6  
**Build Status**: ✅ Compiled Successfully  
**Purpose**: Real-time operational data for dashboard widgets and workspace views

---

## 📊 Dashboard & Workspace Endpoints

### 1. **Operations Command Center Dashboard** 🏥
**Endpoint**: `GET /api/healthcare/facilities/:facilityId/dashboard/command-center`

**Purpose**: Complete real-time data for main operations dashboard

**Response Data**:
```json
{
  "facility_status": {
    "overall_status": "OPERATIONAL",
    "bed_occupancy_percentage": 78.5,
    "beds_occupied": 157,
    "beds_available": 43,
    "patients_checked_in": 45,
    "patients_in_consultation": 23,
    "patients_waiting": 12,
    "average_wait_time_minutes": 28,
    "staff_on_duty": 89,
    "staff_required": 95,
    "staff_utilization_percentage": 93.7,
    "critical_alerts_count": 3
  },
  "today_stats": {
    "checked_in_today": 156,
    "completed_today": 142,
    "cancelled_today": 8,
    "currently_active": 45,
    "avg_visit_duration_minutes": 47.3
  },
  "critical_alerts": [
    {
      "alert_type": "LOW_STOCK",
      "severity": "CRITICAL",
      "message": "Insulin stock critically low",
      "suggested_action": "Emergency reorder required",
      "created_at": "2025-11-13T14:23:00Z"
    }
  ],
  "waiting_patients": {
    "waiting_count": 12,
    "avg_wait_minutes": 28.5,
    "max_wait_minutes": 67
  },
  "bed_status": [
    {
      "status": "OCCUPIED",
      "count": 157,
      "icu_beds": 12,
      "general_beds": 145
    },
    {
      "status": "AVAILABLE",
      "count": 43,
      "icu_beds": 2,
      "general_beds": 41
    }
  ],
  "staff_on_duty": [
    {
      "staff_role": "DOCTOR",
      "count": 15,
      "on_duty": 14,
      "scheduled": 1
    },
    {
      "staff_role": "NURSE",
      "count": 45,
      "on_duty": 42,
      "scheduled": 3
    }
  ],
  "revenue_today": {
    "transaction_count": 156,
    "total_revenue": 487500.00,
    "pending_sync": 12
  },
  "upcoming_appointments": [
    {
      "appointment_id": "...",
      "patient_name": "John Doe",
      "appointment_time": "15:30",
      "appointment_type": "CONSULTATION"
    }
  ],
  "dashboard_timestamp": "2025-11-13T14:30:00Z"
}
```

**Use Case**: 
- Main dashboard overview
- Real-time facility status monitoring
- Executive summary view
- Operations command center

---

### 2. **Patient Workspace** 👥
**Endpoint**: `GET /api/healthcare/facilities/:facilityId/workspace/patients`

**Purpose**: Complete data for patient management workspace

**Response Data**:
```json
{
  "active_patients": [
    {
      "visit_id": "...",
      "patient_id": "...",
      "first_name": "John",
      "last_name": "Doe",
      "medical_record_number": "MRN12345",
      "date_of_birth": "1980-05-15",
      "location_name": "Ward A",
      "bed_number": "A-12",
      "status": "IN_CONSULTATION",
      "check_in_time": "2025-11-13T08:30:00Z",
      "minutes_in_facility": 360
    }
  ],
  "today_appointments": [
    {
      "appointment_id": "...",
      "first_name": "Jane",
      "last_name": "Smith",
      "phone": "+27821234567",
      "appointment_time": "15:30",
      "status": "SCHEDULED"
    }
  ],
  "recent_admissions": [
    {
      "visit_id": "...",
      "first_name": "Mike",
      "last_name": "Johnson",
      "check_in_time": "2025-11-13T12:45:00Z",
      "location_name": "ICU",
      "bed_number": "ICU-3"
    }
  ],
  "pending_discharges": [
    {
      "visit_id": "...",
      "first_name": "Sarah",
      "last_name": "Williams",
      "status": "AWAITING_DISCHARGE",
      "location_name": "Ward B",
      "bed_number": "B-7"
    }
  ],
  "statistics": {
    "total_patients": 3456,
    "active_patients": 3210,
    "patients_last_30_days": 1234
  },
  "workspace_timestamp": "2025-11-13T14:30:00Z"
}
```

**Use Case**:
- Patient management view
- Admission/discharge workflow
- Appointment scheduling interface
- Patient list and search

---

### 3. **Clinical Workspace** 🩺
**Endpoint**: `GET /api/healthcare/facilities/:facilityId/workspace/clinical`

**Purpose**: Clinical workflows and pending tasks

**Response Data**:
```json
{
  "pending_lab_orders": [
    {
      "order_id": "...",
      "patient_name": "John Doe",
      "test_name": "Full Blood Count",
      "priority": "URGENT",
      "status": "SAMPLE_COLLECTED",
      "ordered_at": "2025-11-13T13:00:00Z",
      "pending_minutes": 90
    }
  ],
  "pending_prescriptions": [
    {
      "prescription_id": "...",
      "patient_name": "Jane Smith",
      "medication_name": "Amoxicillin 500mg",
      "status": "PENDING",
      "prescribed_at": "2025-11-13T14:15:00Z"
    }
  ],
  "critical_vitals": [
    {
      "vitals_id": "...",
      "patient_name": "Mike Johnson",
      "blood_pressure_systolic": 165,
      "blood_pressure_diastolic": 95,
      "alert_flags": ["HIGH_BP"],
      "recorded_at": "2025-11-13T14:20:00Z"
    }
  ],
  "triage_queue": [
    {
      "triage_id": "...",
      "patient_name": "Sarah Williams",
      "triage_priority": "P2_VERY_URGENT",
      "chief_complaint": "Chest pain",
      "check_in_time": "2025-11-13T14:10:00Z",
      "wait_minutes": 20
    }
  ],
  "recent_procedures": [
    {
      "procedure_id": "...",
      "patient_name": "Tom Brown",
      "procedure_name": "Minor Surgery",
      "status": "COMPLETED",
      "scheduled_date": "2025-11-13",
      "scheduled_time": "10:00"
    }
  ],
  "workspace_timestamp": "2025-11-13T14:30:00Z"
}
```

**Use Case**:
- Clinical workflow management
- Lab order tracking
- Prescription dispensing
- Triage queue monitoring
- Critical patient alerts

---

### 4. **Resource Management Workspace** 🏗️
**Endpoint**: `GET /api/healthcare/facilities/:facilityId/workspace/resources`

**Purpose**: Beds, staff, equipment, and inventory status

**Response Data**:
```json
{
  "bed_summary": [
    {
      "ward_name": "Ward A",
      "location_type": "WARD",
      "total_beds": 50,
      "available": 12,
      "occupied": 36,
      "cleaning": 2,
      "maintenance": 0,
      "occupancy_rate": 72.0
    },
    {
      "ward_name": "ICU",
      "location_type": "ICU",
      "total_beds": 15,
      "available": 2,
      "occupied": 13,
      "cleaning": 0,
      "maintenance": 0,
      "occupancy_rate": 86.7
    }
  ],
  "staff_schedule": [
    {
      "staff_role": "DOCTOR",
      "department": "EMERGENCY",
      "total_scheduled": 8,
      "on_duty": 7,
      "upcoming": 1,
      "no_show": 0
    },
    {
      "staff_role": "NURSE",
      "department": "ICU",
      "total_scheduled": 12,
      "on_duty": 11,
      "upcoming": 1,
      "no_show": 0
    }
  ],
  "equipment_status": [
    {
      "equipment_type": "DIAGNOSTIC",
      "total_equipment": 25,
      "operational": 23,
      "in_maintenance": 1,
      "down": 1,
      "critical_down": 0
    },
    {
      "equipment_type": "SURGICAL",
      "total_equipment": 15,
      "operational": 14,
      "in_maintenance": 1,
      "down": 0,
      "critical_down": 0
    }
  ],
  "inventory_alerts": [
    {
      "alert_type": "LOW_STOCK",
      "severity": "HIGH",
      "item_name": "Surgical Gloves (Medium)",
      "message": "Stock below reorder point",
      "suggested_action": "Reorder 5000 units"
    }
  ],
  "service_requests": [
    {
      "request_type": "MAINTENANCE",
      "priority": "HIGH",
      "count": 3
    },
    {
      "request_type": "HOUSEKEEPING",
      "priority": "MEDIUM",
      "count": 7
    }
  ],
  "workspace_timestamp": "2025-11-13T14:30:00Z"
}
```

**Use Case**:
- Bed allocation dashboard
- Staff scheduling view
- Equipment maintenance tracking
- Inventory monitoring
- Facilities management

---

### 5. **Analytics Workspace** 📈
**Endpoint**: `GET /api/healthcare/facilities/:facilityId/workspace/analytics`

**Query Parameters**: 
- `period` (optional): Number of days to analyze (default: 30)

**Purpose**: Performance metrics and trends

**Response Data**:
```json
{
  "patient_flow_trends": [
    {
      "visit_date": "2025-11-13",
      "total_visits": 156,
      "completed": 142,
      "cancelled": 8,
      "avg_wait_time": 28.5,
      "avg_visit_duration": 47.3
    },
    {
      "visit_date": "2025-11-12",
      "total_visits": 148,
      "completed": 135,
      "cancelled": 6,
      "avg_wait_time": 31.2,
      "avg_visit_duration": 49.1
    }
  ],
  "bed_occupancy_trends": [
    {
      "date": "2025-11-13",
      "avg_occupancy": 78.5,
      "peak_occupancy": 92.3,
      "avg_beds_occupied": 157
    }
  ],
  "wait_time_trends": [
    {
      "visit_date": "2025-11-13",
      "avg_wait": 28.5,
      "max_wait": 67,
      "median_wait": 25,
      "waited_over_30min": 23
    }
  ],
  "revenue_trends": [
    {
      "transaction_date": "2025-11-13",
      "transaction_count": 156,
      "gross_revenue": 520000.00,
      "net_revenue": 487500.00,
      "total_discounts": 32500.00
    }
  ],
  "top_procedures": [
    {
      "procedure_name": "Minor Surgery",
      "procedure_count": 45,
      "completed_count": 43,
      "avg_duration": 35.2
    },
    {
      "procedure_name": "X-Ray",
      "procedure_count": 123,
      "completed_count": 120,
      "avg_duration": 15.5
    }
  ],
  "period_days": 30,
  "workspace_timestamp": "2025-11-13T14:30:00Z"
}
```

**Use Case**:
- Performance analytics dashboard
- Trend analysis
- Business intelligence
- Management reporting
- Capacity planning

---

### 6. **Quick Stats Widget** ⚡
**Endpoint**: `GET /api/healthcare/facilities/:facilityId/stats/quick`

**Purpose**: Fast-loading key metrics for dashboard widgets

**Response Data**:
```json
{
  "patients_today": 156,
  "patients_active": 45,
  "beds_available": 43,
  "beds_total": 200,
  "bed_occupancy_rate": 78.5,
  "appointments_pending": 23,
  "staff_on_duty": 89,
  "critical_alerts": 3,
  "revenue_today": 487500.00,
  "timestamp": "2025-11-13T14:30:00Z"
}
```

**Use Case**:
- Dashboard KPI cards
- Header statistics
- Quick glance metrics
- Real-time counters
- Widget components

---

## 🎨 Frontend Integration

### Dashboard Layout Example

```typescript
// Operations Command Center Dashboard
const OperationsDashboard = () => {
  const { data } = useSWR(
    `/api/healthcare/facilities/${facilityId}/dashboard/command-center`,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  return (
    <Dashboard>
      <KPICards stats={data.today_stats} />
      <FacilityStatusWidget status={data.facility_status} />
      <CriticalAlerts alerts={data.critical_alerts} />
      <WaitingPatientsWidget waiting={data.waiting_patients} />
      <BedStatusChart bedStatus={data.bed_status} />
      <StaffOnDutyWidget staff={data.staff_on_duty} />
      <RevenueWidget revenue={data.revenue_today} />
      <UpcomingAppointments appointments={data.upcoming_appointments} />
    </Dashboard>
  );
};
```

### Workspace Views

**Patient Workspace**:
```typescript
const PatientWorkspace = () => {
  const { data } = useSWR(
    `/api/healthcare/facilities/${facilityId}/workspace/patients`
  );

  return (
    <Workspace>
      <ActivePatientsTable patients={data.active_patients} />
      <TodayAppointments appointments={data.today_appointments} />
      <RecentAdmissions admissions={data.recent_admissions} />
      <PendingDischarges discharges={data.pending_discharges} />
    </Workspace>
  );
};
```

**Clinical Workspace**:
```typescript
const ClinicalWorkspace = () => {
  const { data } = useSWR(
    `/api/healthcare/facilities/${facilityId}/workspace/clinical`
  );

  return (
    <Workspace>
      <LabOrdersQueue orders={data.pending_lab_orders} />
      <PrescriptionsQueue prescriptions={data.pending_prescriptions} />
      <CriticalVitalsAlerts vitals={data.critical_vitals} />
      <TriageQueue queue={data.triage_queue} />
      <RecentProcedures procedures={data.recent_procedures} />
    </Workspace>
  );
};
```

**Resource Workspace**:
```typescript
const ResourceWorkspace = () => {
  const { data } = useSWR(
    `/api/healthcare/facilities/${facilityId}/workspace/resources`
  );

  return (
    <Workspace>
      <BedManagementGrid beds={data.bed_summary} />
      <StaffScheduleView schedule={data.staff_schedule} />
      <EquipmentStatusGrid equipment={data.equipment_status} />
      <InventoryAlerts alerts={data.inventory_alerts} />
      <ServiceRequests requests={data.service_requests} />
    </Workspace>
  );
};
```

**Analytics Workspace**:
```typescript
const AnalyticsWorkspace = () => {
  const [period, setPeriod] = useState(30);
  const { data } = useSWR(
    `/api/healthcare/facilities/${facilityId}/workspace/analytics?period=${period}`
  );

  return (
    <Workspace>
      <PeriodSelector value={period} onChange={setPeriod} />
      <PatientFlowChart data={data.patient_flow_trends} />
      <BedOccupancyChart data={data.bed_occupancy_trends} />
      <WaitTimeChart data={data.wait_time_trends} />
      <RevenueChart data={data.revenue_trends} />
      <TopProceduresTable procedures={data.top_procedures} />
    </Workspace>
  );
};
```

---

## 📊 Dashboard Widgets

### 1. **KPI Cards** (Quick Stats Endpoint)
```
┌─────────────────┬─────────────────┬─────────────────┐
│ Patients Today  │ Patients Active │ Bed Occupancy   │
│      156        │       45        │     78.5%       │
│   +12 vs avg    │   Normal        │   ⚠️ High       │
└─────────────────┴─────────────────┴─────────────────┘
```

### 2. **Facility Status Card**
```
┌─────────────────────────────────────┐
│ Facility Status: 🟢 OPERATIONAL     │
├─────────────────────────────────────┤
│ Bed Occupancy: ████████░░ 78.5%    │
│ Staff Utilization: ████████░░ 93.7%│
│ Wait Time: 28 minutes (Normal)      │
│ Critical Alerts: ⚠️ 3               │
└─────────────────────────────────────┘
```

### 3. **Critical Alerts Widget**
```
┌─────────────────────────────────────┐
│ 🚨 Critical Alerts (3)              │
├─────────────────────────────────────┤
│ 🔴 Insulin stock critically low     │
│    → Emergency reorder required     │
│                                     │
│ 🔴 Patient waiting >60 minutes      │
│    → Escalate to management         │
│                                     │
│ 🟡 Equipment maintenance overdue    │
│    → Schedule maintenance           │
└─────────────────────────────────────┘
```

### 4. **Bed Status Donut Chart**
```
        Available (21.5%)
       ╱───────────╲
      ╱             ╲
     │   Occupied   │
     │    (78.5%)   │
      ╲             ╱
       ╲___________╱
```

### 5. **Revenue Today Card**
```
┌─────────────────────────────────────┐
│ Today's Revenue                     │
│                                     │
│ R 487,500.00                        │
│ 156 transactions                    │
│                                     │
│ ⚠️ 12 pending sync to ERP           │
└─────────────────────────────────────┘
```

---

## 🔄 Real-Time Updates

### Polling Strategy

```typescript
// Fast polling for critical data (every 10 seconds)
useSWR('/api/healthcare/facilities/:id/stats/quick', {
  refreshInterval: 10000
});

// Medium polling for dashboard (every 30 seconds)
useSWR('/api/healthcare/facilities/:id/dashboard/command-center', {
  refreshInterval: 30000
});

// Slow polling for analytics (every 5 minutes)
useSWR('/api/healthcare/facilities/:id/workspace/analytics', {
  refreshInterval: 300000
});
```

### WebSocket Alternative (Future Enhancement)
```typescript
// Real-time updates via WebSocket
const socket = io('/healthcare-events');

socket.on('patient-checked-in', (data) => {
  // Update dashboard
});

socket.on('critical-alert', (alert) => {
  // Show notification
});

socket.on('bed-status-changed', (bedStatus) => {
  // Update bed grid
});
```

---

## 🎯 Performance Optimization

### Database Query Optimization
- ✅ All queries use indexes on `facility_id`, `tenant_id`, `visit_date`
- ✅ Parallel queries using `Promise.all()` for dashboard data
- ✅ Aggregations done in PostgreSQL (not application layer)
- ✅ Pagination and limits on large result sets
- ✅ Calculated fields done in SQL (faster than JS)

### Caching Strategy (Future)
```typescript
// Redis caching for frequently accessed data
const cacheKey = `dashboard:${facilityId}:${Date.now() / 30000}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

// ... fetch from database ...

await redis.setex(cacheKey, 30, data); // Cache for 30 seconds
```

---

## 🚀 Summary

**New Endpoints Added**: 6  
**Total Healthcare Endpoints**: 45 (39 + 6)  
**Build Status**: ✅ Compiled Successfully  

### Endpoint Quick Reference

| Endpoint | Purpose | Refresh Rate |
|----------|---------|--------------|
| `/dashboard/command-center` | Main operations dashboard | 30 seconds |
| `/workspace/patients` | Patient management | 1 minute |
| `/workspace/clinical` | Clinical workflows | 30 seconds |
| `/workspace/resources` | Beds/staff/equipment | 1 minute |
| `/workspace/analytics` | Performance trends | 5 minutes |
| `/stats/quick` | KPI widgets | 10 seconds |

### Frontend Dashboard Structure
```
Operations Command Center
├── Header (Quick Stats)
├── Facility Status Widget
├── Critical Alerts Panel
├── Active Patients Grid
├── Bed Status Chart
├── Staff On Duty List
├── Revenue Widget
└── Upcoming Appointments

Workspaces
├── Patient Workspace
│   ├── Active Patients Table
│   ├── Today's Appointments
│   ├── Recent Admissions
│   └── Pending Discharges
├── Clinical Workspace
│   ├── Lab Orders Queue
│   ├── Prescriptions Queue
│   ├── Critical Vitals Alerts
│   ├── Triage Queue
│   └── Recent Procedures
├── Resource Workspace
│   ├── Bed Management Grid
│   ├── Staff Schedule
│   ├── Equipment Status
│   ├── Inventory Alerts
│   └── Service Requests
└── Analytics Workspace
    ├── Patient Flow Trends
    ├── Bed Occupancy Trends
    ├── Wait Time Analysis
    ├── Revenue Trends
    └── Top Procedures
```

**Status**: ✅ **READY FOR FRONTEND INTEGRATION**
