# Masaphokati Agriculture OS — Implementation Blueprint

**Status:** Canonical implementation direction
**Experience contract:** Approved Agriculture OS Command Centre prototype
**Principle:** Build underneath the approved experience; do not redesign it into a module dashboard.

## 1. Product mandate

Agriculture OS is the agricultural operating layer of the Masaphokati ecosystem. It continuously answers five questions:

1. What is happening across the farm?
2. What requires attention now?
3. Why does it matter?
4. What is the next safe action?
5. What is the production and financial consequence?

It must work for farms that begin with manual records, farms connected through sensors, and multi-farm enterprises using advanced control systems. Hardware enriches the product but is not allowed to define its architecture.

## 2. Ecosystem boundaries

### Agriculture OS owns

- Farm, field, camp and production-zone structure
- Seasons and agricultural production cycles
- Crop and livestock operations
- Irrigation and water interpretation
- Agronomic activities and evidence
- Harvest, storage and produce traceability
- Agricultural work signals and operational decisions
- Production-unit economics and agricultural intelligence

### SenseIT owns

- Physical sensors and gateways
- LoRaWAN and device connectivity
- Device-side buffering and transmission
- Raw device readings
- Battery, signal and calibration information where exposed
- Basic platform alerts and hardware support

### FleetSA owns

- Vehicles, tractors and mobile equipment
- Location, utilisation and operating hours
- Fuel stocks and consumption
- Maintenance and inspections
- Operators, relevant mobile workforce signals and logistics

### Siyabusa owns

- General ledger and financial reporting
- Suppliers, customers, purchasing and invoicing
- Payroll and statutory processing
- Asset accounting
- Cash flow, tax and accounting controls

Agriculture OS may calculate operational measures such as cost per hectare, but the posted financial transaction remains owned by Siyabusa.

## 3. Target architecture

```text
SenseIT / Weather / Satellite / Manual / FleetSA / Siyabusa
                         │
                 Integration Gateway
                         │
         Identity + Mapping + Normalisation
                         │
     Agriculture Domain Events and Telemetry Store
                         │
        Rules, Models and Work-Signal Engine
                         │
      Command Centre and Operational Workspaces
                         │
        Human Approval / Action / Audit Trail
```

### Architectural rules

1. External vendors connect through adapters, never directly to UI components.
2. Raw telemetry is immutable; corrections create derived records.
3. Every external object has an internal ID and an external-system mapping.
4. Command Centre reads from purpose-built projections, not dozens of live transactional queries.
5. Recommendations and calculations are versioned.
6. Remote physical commands require a separate control plane from monitoring.
7. Tenant, farm and role authorisation applies at every service boundary.

## 4. Canonical agriculture objects

### Organisation and land

- `Farm`
- `ProductionUnit`
- `Field`
- `Zone`
- `Boundary`
- `WaterSource`
- `Reservoir`
- `IrrigationSystem`
- `Pump`
- `Valve`

Fields store geometry using a geospatial representation, not arrays embedded in UI data. Zones allow a field to contain multiple irrigation or management areas.

### Production

- `Season`
- `CropCycle`
- `CropVariety`
- `ProductionPlan`
- `ActivityPlan`
- `FieldActivity`
- `InputApplication`
- `ScoutObservation`
- `HarvestEvent`
- `ProduceLot`
- `StorageMovement`

`current_crop` must not be a free-standing source of truth on a field. It is derived from active crop cycles.

### Livestock

- `HerdOrFlock`
- `Animal`
- `AnimalEvent`
- `HealthTreatment`
- `FeedEvent`
- `WeightEvent`
- `GrazingMovement`

The model must support both individual animals and commercial group-level management.

### Equipment and people references

- `EquipmentReference` mapped to FleetSA
- `OperatorReference` mapped to FleetSA/HR
- `WorkerReference` mapped to Siyabusa HR
- `WorkTeam`
- `AgricultureAssignment`

Agriculture OS stores agricultural assignments and outcomes, not duplicate employee or vehicle masters.

### Commercial and finance references

- `SupplierReference`
- `CustomerReference`
- `PurchaseReference`
- `InvoiceReference`
- `LedgerDimensionReference`
- `BuyerContract`
- `PriceObservation`

Each farm, field, crop cycle, herd and produce lot must be addressable as a Siyabusa cost/profitability dimension.

## 5. Telemetry model

### Core objects

- `Device`
- `Gateway`
- `SensorChannel`
- `AssetBinding`
- `Measurement`
- `DeviceHealth`
- `CalibrationRecord`
- `TelemetryAlert`
- `CommandRequest`
- `CommandAcknowledgement`

### Measurement envelope

Every measurement contains:

```json
{
  "measurementId": "uuid",
  "tenantId": "uuid",
  "farmId": "uuid",
  "deviceId": "uuid",
  "channel": "irrigation.pressure",
  "value": 3.1,
  "unit": "bar",
  "observedAt": "2026-08-29T10:46:00Z",
  "receivedAt": "2026-08-29T10:46:08Z",
  "quality": "valid",
  "source": "senseit",
  "sourceReference": "external-reading-id",
  "calibrationStatus": "current"
}
```

### Quality states

- `valid`
- `suspect`
- `stale`
- `invalid`
- `missing`
- `estimated`

The UI must never represent stale or estimated data as live measured data.

### SenseIT adapter

The first adapter must support:

- Scheduled reading ingestion
- Webhook ingestion if SenseIT enables it
- Idempotency using external reading IDs or deterministic hashes
- Device inventory synchronisation
- Unit normalisation
- Battery and connectivity state
- API retry with dead-letter handling
- Raw payload retention for diagnosis
- Farm/field/asset binding
- Per-tenant API credentials in a secret manager

SenseIT API access, webhook availability, rate limits and commercial rights are implementation dependencies that require written confirmation.

## 6. Data-truth contract

Every material value displayed by Agriculture OS includes a truth classification:

| Classification | Meaning |
|---|---|
| Measured | Direct device or verified instrument reading |
| Calculated | Deterministic calculation from recorded inputs |
| Forecast | Modelled future value with uncertainty |
| Manual | Entered by a person with attribution |
| Simulated | Demonstration-only data |

Important cards and recommendations expose:

- Source
- Observation/calculation time
- Freshness
- Formula or model version
- Key inputs
- Confidence where relevant
- Missing evidence

## 7. Work-signal architecture

Agriculture modules publish standard signals instead of building independent dashboards.

### Signal contract

- Signal ID
- Type: task, alert, deadline, risk, opportunity, change, blocker
- Tenant, farm and affected object
- Source module and source event
- Title and concise explanation
- Why it matters
- Severity and urgency
- Evidence references
- Confidence
- Recommended action
- Alternative actions
- Responsible role/person
- Due time and escalation policy
- Dependencies
- Status and resolution
- Audit metadata

### Example

```json
{
  "type": "alert",
  "source": "irrigation-rules",
  "affectedObject": "Block A3",
  "title": "Irrigation pressure below target",
  "whyItMatters": "Maize water-stress risk increases after 14:00",
  "severity": "critical",
  "evidence": ["pressure-series", "pump-state", "soil-moisture-series"],
  "recommendedAction": "Inspect North Pivot filter",
  "requiresApproval": false,
  "dueAt": "2026-08-29T12:00:00Z"
}
```

## 8. Irrigation rules and safety controls

### Monitoring rules

An irrigation alert should consider:

- Scheduled operating state
- Actual pump state
- Pressure threshold and duration
- Flow rate
- Soil moisture and trend
- Reservoir availability
- Maintenance windows
- Device quality and calibration

Single-point readings do not create critical incidents unless a specifically approved safety threshold requires it.

### Control levels

1. **Observe:** display readings and trends.
2. **Recommend:** create explainable work signals.
3. **Approve and execute:** authorised human approves a remote command.
4. **Bounded automation:** system acts within an approved policy and physical interlocks.

Initial production releases are limited to levels 1 and 2. Level 3 requires a separately approved controller, command acknowledgement, physical override, timeout, rollback/fail-safe procedure and named permissions. Level 4 is not part of the pilot.

## 9. Integration contracts

### FleetSA → Agriculture OS

Inputs:

- Equipment identity and status
- Position and operating hours
- Fuel issue, tank level and consumption
- Maintenance status
- Operator assignment
- Transport and delivery events

Agriculture OS contributes:

- Field/crop assignment
- Agricultural activity
- Hectares worked
- Expected versus actual performance
- Cost allocation reference

### Agriculture OS → Siyabusa

Outputs:

- Approved purchase requisitions
- Goods/service receipt evidence
- Payroll-approved agriculture time and piece-work quantities
- Harvest sales/invoice instructions
- Cost and profitability dimensions
- Capital equipment references

Siyabusa returns:

- Posted financial amounts
- Supplier/customer status
- Purchase order and invoice status
- Payroll result
- Cash and budget position

No integration writes directly into another system's database. Contracts use versioned APIs/events and idempotency keys.

## 10. Experience mapping

### Command Centre

The approved first screen remains the operating entry point and receives:

- Operating brief from prioritised work signals
- Season revenue from calculation projections linked to Siyabusa actuals
- Water allocation from water-source and telemetry projections
- Area in production from active crop cycles
- Equipment readiness from FleetSA
- Field health from observations, telemetry and approved models
- Input exposure from inventory and planned applications
- Gross-margin outlook from versioned farm-economics calculations

### Operational workspaces

- Farm and map
- Production planning and crop cycles
- Irrigation and water
- Scouting and field activities
- Inputs and applications
- Harvest and traceability
- Livestock
- Equipment (FleetSA embedded context)
- People and payroll (shared context)
- Farm economics (Siyabusa-backed)

Modules remain secondary tools. Users return to the Command Centre after completing work.

## 11. Migration path

1. Freeze additions to legacy agriculture tables and current hard-coded data.
2. Inventory production data in both agriculture schema families.
3. Introduce canonical `ag_*` tables through forward-only migrations.
4. Build repeatable migration scripts with reconciliation reports.
5. Create compatibility reads only where necessary during transition.
6. Build new APIs and Command Centre projections.
7. Run old and new reads in parallel and compare totals.
8. Cut the agriculture route to the new experience.
9. Retire legacy tables only after signed reconciliation and backup.

## 12. Delivery phases

### Phase 0 — Security and repository stabilisation

- Rotate and remove exposed credentials
- Add secret scanning
- Establish canonical environment management
- Remove generated artefacts from the product path
- Select one migration authority
- Establish CI build and test gates

**Exit gate:** no known live credential remains in source; clean reproducible build; migration ownership established.

### Phase 1 — Agriculture foundation

- Canonical farms, fields, zones, seasons and crop cycles
- Geospatial boundaries
- External object mappings
- Truth/provenance fields
- Work-signal core
- Command Centre backed by real projections

**Exit gate:** every Command Centre value is real, explicitly unavailable or explicitly simulated.

### Phase 2 — Connected irrigation pilot

- SenseIT adapter
- Gateway/device registry
- Pressure, flow, soil moisture, weather, reservoir and pump state
- Telemetry health
- Irrigation rules
- Work assignment, acknowledgement and resolution
- Water and energy reporting

**Exit gate:** the system detects and explains a validated irrigation condition, routes work, records response and preserves evidence.

### Phase 3 — Crop operations and inputs

- Production plans
- Field activities
- Scouting
- Input allocations/applications
- Inventory and procurement integration
- Harvest forecasting and recording
- Cost per field/crop cycle

### Phase 4 — FleetSA and Siyabusa integration

- Equipment/fuel/operator signals
- Agriculture assignments
- Payroll/time approval
- Purchases and invoices
- Ledger dimensions and actual costs
- Transport and delivery events

### Phase 5 — Traceability and commercial intelligence

- Produce lots and storage movements
- Quality and moisture
- Buyer contracts
- Pricing scenarios
- Chain of custody
- Margin recommendations with transparent assumptions

### Phase 6 — Livestock and controlled automation

- Herd and animal events
- Health, feed, weight and grazing
- Optional telemetry
- Approved remote irrigation control
- Multi-farm benchmarking

## 13. Pilot acceptance measures

The irrigation pilot is successful only when it demonstrates:

- At least 95% expected telemetry received during the agreed test window
- Stale data identified within the configured freshness period
- Duplicate readings do not create duplicate events
- Every critical alert has supporting evidence
- Alert thresholds are farm/zone specific
- Named responsibility and escalation work correctly
- Response and resolution are auditable
- Manual readings can corroborate sensor readings
- No remote physical action occurs without the approved control level
- Water, energy and operational consequences can be reported

## 14. Immediate implementation backlog

1. Security incident response for repository credentials.
2. Database inventory against the actual deployed environment.
3. Canonical agriculture schema design and migration plan.
4. Typed Agriculture API v3 contract.
5. Work-signal and provenance schema.
6. Command Centre read-model contract.
7. SenseIT technical workshop and API sandbox request.
8. FleetSA and Siyabusa interface contracts.
9. Pilot farm survey and hardware bill of materials.
10. First real-data vertical slice: pressure reading → signal → action → audit.

## 15. Non-negotiable standards

- The approved prototype remains the visual and workflow standard.
- No fabricated operational claim is shown as live.
- No vendor owns the canonical farm model.
- No physical command bypasses authorisation and safety controls.
- No financial transaction is duplicated outside Siyabusa.
- No fleet, fuel or mobile-equipment master is duplicated outside FleetSA.
- All material actions and recommendations are explainable and auditable.
