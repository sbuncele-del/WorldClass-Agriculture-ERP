# Worldclass ERP Software - Project Instructions

## Project Overview
This is a comprehensive ERP (Enterprise Resource Planning) system built with modern technologies.
The system is **production-ready** and deployed on AWS.

## Technology Stack
- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: React, TypeScript, Vite
- **Database**: PostgreSQL (AWS RDS)
- **Cache**: Redis
- **Infrastructure**: AWS (EC2, RDS, S3)
- **Architecture**: Monorepo with multi-tenant design

## ERP Modules (All Implemented)

### Core Business Modules
1. ✅ **Inventory Management** - Stock control, warehousing
2. ✅ **Sales & CRM** - Invoicing, quotes, customer management
3. ✅ **Purchase Management** - POs, supplier management, receiving
4. ✅ **Financial Accounting** - GL, AP, AR, Chart of Accounts
5. ✅ **HR & Payroll** - Employee management, payroll processing
6. ✅ **Manufacturing** - BOM, work orders, production
7. ✅ **Warehouse Management** - Locations, transfers, picking

### Financial & Compliance
8. ✅ **Asset Management** - IAS 16 compliant, depreciation
9. ✅ **Cash Management** - Bank reconciliation, cash flow
10. ✅ **Compliance Hub** - SARS integration, regulatory
11. ✅ **Audit Hub** - Audit trails, audit readiness
12. ✅ **Multi-Entity** - Consolidation, intercompany

### Industry Verticals
13. ✅ **Healthcare** - Patient management, medical inventory
14. ✅ **Mining** - Mineral tracking, safety compliance
15. ✅ **Construction** - Project costing, progress billing
16. ✅ **Property Management** - Leases, tenant billing
17. ✅ **Agriculture** - Crop management, farm operations

### Operations & Logistics
18. ✅ **Logistics & Fleet** - Vehicle tracking, fuel management
19. ✅ **Project Management** - Tasks, timelines, resources
20. ✅ **Practice Management** - Professional services, time tracking

### Platform Features
21. ✅ **Admin & Settings** - User management, tenant config
22. ✅ **Communications Hub** - Video meetings (Daily.co), messaging
23. ✅ **Proposals & Pitch** - Business proposals, presentations
24. ✅ **AI Assistant** - Natural language queries, actionable agent
25. ✅ **Dashboard & Reports** - KPIs, custom reports, analytics

## Multi-Tenant Architecture
- All API endpoints require tenant context
- V2 controllers use `TenantRequest` interface with `getTenantId()` helper
- Database queries must include `tenant_id` in WHERE clauses
- Services should accept `TenantContext` parameter

## Project Status (December 2025)
- [x] Backend API complete (400+ endpoints)
- [x] Frontend UI complete (React + Vite)
- [x] Database schema deployed (PostgreSQL)
- [x] V2 controller migration complete (66 controllers)
- [x] AWS deployment operational
- [ ] V2 route wiring (in progress)
- [ ] Service multi-tenancy audit
- [ ] Test coverage expansion

## Development Guidelines
- Follow TypeScript best practices
- Use RESTful API design patterns
- Implement proper error handling with tenant context
- All new endpoints should use V2 controller pattern
- Database queries MUST be tenant-scoped
