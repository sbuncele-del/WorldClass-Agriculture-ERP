# Agriculture OS Repository Audit

**Repository:** `sbuncele-del/WorldClass-Agriculture-ERP`
**Audit date:** 29 August 2026
**Approved experience standard:** Masaphokati Agriculture OS Command Centre prototype

## Executive conclusion

The repository is a large, multi-industry ERP codebase with a credible reusable foundation in authentication, tenant isolation, accounting, purchasing, inventory, payroll, assets, logistics and audit logging. The existing agriculture implementation is not yet a production agriculture operating system. It is a thin industry hub combining partial APIs, hard-coded records, dashboard statistics and a set of broad tabs.

The correct strategy is **consolidation, not replacement**:

1. Preserve the shared ERP foundation.
2. Replace the competing agriculture schemas with one canonical agriculture domain.
3. Rebuild the agriculture experience around work signals and real farm objects.
4. Integrate SenseIT for field telemetry, FleetSA for mobile assets/fuel/workforce signals, and Siyabusa for accounting, procurement and payroll.
5. Keep the approved prototype as the experience contract.

## Scope inspected

- Root workspace configuration and dependency manifests
- Frontend application routing and API client
- Existing Agriculture Hub and agriculture page
- V1 and V2 agriculture routes/controllers
- Agriculture-related SQL migrations
- Inventory, payroll, fleet and fuel module presence
- Authentication, tenant middleware and audit endpoints
- Repository structure, tracked artefacts and documentation
- Public documentation for credential exposure indicators

The repository contains 2,112 tracked files and is approximately 363 MB in the shallow checkout. It has a single imported commit, which means the repository does not preserve useful incremental engineering history.

## What can be reused

| Capability | Current evidence | Decision |
|---|---|---|
| React application shell | React/Vite frontend with routing and shared components | Reuse, then progressively replace agriculture UI |
| Authentication | JWT middleware and authenticated routes | Reuse after focused security validation |
| Tenant isolation | Tenant middleware and tenant-filtered agriculture queries | Reuse pattern; enforce at repository/service layer |
| PostgreSQL | Existing database and migrations | Reuse; introduce canonical migrations only |
| Farms and fields | Basic `farms` and `farm_fields` objects | Migrate and extend |
| Crop records | Basic planted/harvest attributes | Migrate into crop-cycle model |
| Livestock records | Basic individual animal register | Extend; support groups and events |
| Farm tasks | Basic task record | Replace with shared work-signal/action model |
| Inventory | Dedicated inventory modules and repositories | Integrate through allocation/application contracts |
| Procurement | Purchase routes and supplier workflows | Reuse through Siyabusa boundary |
| Payroll | HR/payroll repositories and frontend | Reuse through Siyabusa boundary |
| Fleet and fuel | Logistics fleet/fuel modules | Integrate through FleetSA boundary |
| Financial accounting | Ledger, reporting and dimensional tracking | Reuse as financial source of truth |
| Audit logging | Audit routes and related services | Reuse and extend for telemetry/action evidence |
| Mapping | Leaflet dependency and early field-map implementation | Reuse library, rebuild domain implementation |

## Critical findings

### A-01 — Public credential exposure

**Severity: Critical**

Publicly tracked operational documents contain what appear to be production database and administrator credentials. Credential-like content is present across numerous operational documents, scripts and examples.

**Required response:**

1. Rotate all exposed database, administrator, cloud, email, payment and API credentials.
2. Remove secrets from the current tree and repository history.
3. Move runtime secrets to an approved secret manager.
4. Add automated secret scanning to pull requests and the default branch.
5. Treat all historically committed credentials as compromised even if believed inactive.

No credential values are repeated in this audit.

### A-02 — Competing agriculture schemas

**Severity: Critical**

The repository defines at least two incompatible agriculture models:

- `farms`, `farm_fields`, `crops`, `livestock`, `farm_tasks`
- `agriculture_farms`, `farm_crops`, `farm_livestock`, another incompatible `farm_tasks`

The duplicate `farm_tasks` definitions have different columns. Code also alternates between `farms.id/name` and nonexistent or alternative `farms.farm_id/farm_name` conventions.

**Impact:** migrations can succeed in one environment and break runtime queries in another. Dashboard totals can read different tables from CRUD operations.

**Decision:** adopt one canonical schema beginning with `ag_farms`, `ag_fields`, `ag_crop_cycles` and a shared signal/action layer. Migrate existing data explicitly; do not rename tables opportunistically in application code.

### A-03 — Frontend/API contract is disconnected

**Severity: High**

The Agriculture Hub requests `/api/agriculture/stats` and `/api/agriculture/equipment`, but the agriculture router does not expose those endpoints. Available endpoints are closer to `/workspace`, `/dashboard`, farms, fields, crops, livestock and tasks.

The screen also contains hard-coded inputs, harvest records, weather, SARS values and other operational claims alongside API-backed arrays. API failure falls back to remaining illustrative content without a clear simulated-data label.

**Impact:** the interface can appear operational while presenting data that is not live.

**Decision:** all displayed facts must use typed query contracts with provenance and freshness. Demonstration data must be served by an explicit demo tenant and labelled as simulated.

### A-04 — Agriculture Hub has excessive responsibility

**Severity: High**

The principal agriculture component combines weather fetching, data access, CSV generation, farm mapping, modal workflows, tax summaries, hard-coded domain records and all agricultural tabs in one file.

**Impact:** difficult testing, fragile changes, inconsistent data handling and poor separation of domain logic.

**Decision:** split by bounded context and keep the Command Centre as a composition surface rather than an all-purpose module.

### A-05 — No telemetry or device domain

**Severity: High**

There is no canonical representation for devices, sensors, measurements, gateways, calibration, connectivity health, telemetry provenance or command acknowledgements.

**Impact:** SenseIT readings cannot be integrated safely without creating vendor-specific fields throughout farm tables.

**Decision:** introduce a hardware-neutral telemetry layer before implementing the SenseIT connector.

### A-06 — No work-signal architecture for agriculture

**Severity: High**

The current `farm_tasks` table captures work assignments but not the reason, evidence, risk, confidence, source, recommended action, escalation or dependencies required by the approved prototype.

**Decision:** use the shared Siyabusa work-signal philosophy with agriculture-specific evidence and actions.

### A-07 — Claims lack provenance

**Severity: High**

Health percentages, yield projections, water usage, revenue and expenses are displayed without a consistent calculation contract or data-source classification.

**Decision:** every important claim must be classified as measured, calculated, forecast, manually reported or simulated, with timestamp, inputs, formula/model version and confidence where applicable.

### A-08 — Repository hygiene is poor

**Severity: Medium**

The repository tracks generated PDFs, ZIP packages, screenshots, test reports, deployment bundles and duplicated operational documentation. This increases clone size, hides the product core and creates a larger security-scanning surface.

**Decision:** preserve business source documents in appropriate durable storage; remove generated artefacts from source control; adopt a concise canonical documentation set.

## Current maturity by agriculture capability

| Capability | Current maturity | Target |
|---|---:|---:|
| Farm register | 2/5 | 5/5 |
| Field register | 2/5 | 5/5 |
| Crop-cycle management | 1/5 | 5/5 |
| Irrigation and water | 0/5 | 5/5 |
| Device telemetry | 0/5 | 5/5 |
| Weather | 1/5 | 4/5 |
| Inputs and applications | 1/5, mainly illustrative | 5/5 |
| Harvest and traceability | 1/5, mainly illustrative | 5/5 |
| Livestock | 1/5 | 4/5 |
| Equipment/fuel | 2/5 elsewhere in ERP | 5/5 through FleetSA |
| Labour/payroll | 3/5 elsewhere in ERP | 5/5 through Siyabusa/FleetSA |
| Farm economics | 2/5 shared ERP foundation | 5/5 |
| Work prioritisation | 1/5 | 5/5 |
| Auditability | 2/5 | 5/5 |

## Build recommendation

Do not extend the current Agriculture Hub with more tabs. Build the canonical domain and integration layer beside it, feed the approved Command Centre from the new read models, then retire the current hub route after functional parity and data migration.

## Verification results

- Dependency installation completed from the committed lockfile.
- The backend TypeScript build completed successfully.
- The frontend strict build check failed before reaching the agriculture module because of existing syntax errors in `NotificationDropdown.tsx` and `LogisticsDashboard.tsx`.
- The agriculture frontend/API route comparison confirmed that the UI requests `stats` and `equipment` resources not provided by the agriculture router.
- Database inspection confirmed incompatible agriculture schema families and duplicate `farm_tasks` definitions.

These results reinforce Phase 0: the repository needs a clean build baseline and migration authority before Agriculture OS implementation begins.

The detailed target is defined in `IMPLEMENTATION-BLUEPRINT.md`.
