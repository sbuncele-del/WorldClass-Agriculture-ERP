# 🇿🇦 SARS ISV Integration - Complete Roadmap

**Date**: November 7, 2025  
**Status**: Planning Phase  
**Priority**: HIGH - Core compliance feature

---

## 📋 Executive Summary

Based on SARS ISV (Independent Software Vendor) requirements, we can achieve **official SARS integration** by becoming a registered ISV. This will give us:

✅ **Direct API Access** to SARS eFiling system  
✅ **Bulk Tax Directive Submissions** via SFTP  
✅ **Automated PAYE Returns** submission  
✅ **Annual Returns** (ITR12, ITR14, IRP6, ITR12T)  
✅ **Transfer Duty** submissions  

**NO** need to scrape or reverse-engineer - SARS provides official interfaces!

---

## 🎯 What You Need to Become a SARS ISV

### Step 1: Company Requirements ✅ (You likely have these)
- [x] Registered South African company/entity
- [x] Active tax clearance certificate
- [x] Registered for eFiling (if not, register at https://www.sarsefiling.co.za)
- [x] Software product capable of generating tax returns

### Step 2: Documentation to Submit 📝

#### A. **Terms and Conditions** (Must Sign)
- **Document**: `Final-v3-ISV-Systems-Interface-Terms-and-Conditions-21-June-2017.pdf`
- **Action**: Download from SARS website, review, sign
- **Key Points**:
  - You agree to SARS interface specifications
  - Security and data protection requirements
  - Liability and support obligations
  - Access key usage restrictions

#### B. **INF001 Form** (Application for Access)
- **Document**: `INF001-Access-to-SARS-Electronic-Interface-External-Form.pdf`
- **Contains**:
  - Company details (name, tax number, contact info)
  - Software product description
  - Tax types you want to integrate (PAYE, Tax Directives, etc.)
  - Technical contact person details
  - Infrastructure details (servers, security)

#### C. **Interface Specifications** (Technical Docs)
- SARS will provide detailed specs for each tax type
- Example: `IBIR-006-Rev-6-29.pdf` for Tax Directives
- Contains:
  - XML/CSV file formats
  - Validation rules
  - Error codes
  - SFTP connection details
  - Testing procedures

### Step 3: Submit Application 📧
**Email to**: `clsisvapplications@sars.gov.za`

**Subject**: "ISV Application - [Your Company Name] - Worldclass ERP"

**Attach**:
1. Signed Terms and Conditions (PDF)
2. Completed INF001 Form (PDF)
3. Company registration documents (if required)
4. Tax clearance certificate (if required)

**Email Body**:
```
Dear SARS ISV Applications Team,

We wish to register as an Independent Software Vendor (ISV) for 
integration with SARS eFiling systems.

Company: [Your Company Name]
Tax Number: [Your Tax Number]
Product: Worldclass ERP - Practice Management & Tax Compliance Software

We are applying for access to the following tax types:
- PAYE Returns (Monthly/Annual)
- Tax Directives (Bulk submissions)
- Annual Returns (ITR12, ITR14)

Please find attached:
1. Signed ISV Terms and Conditions
2. Completed INF001 Application Form
3. [Any other required documents]

We look forward to receiving the interface specifications and 
access credentials.

Regards,
[Your Name]
[Your Title]
[Contact Number]
[Email Address]
```

### Step 4: SARS Review & Approval ⏳
- **Timeline**: Typically 2-4 weeks
- **SARS will**:
  - Review your application
  - Verify company credentials
  - Schedule a call/meeting (sometimes)
  - Provide interface specifications
  - Issue **unique access key** for your product

### Step 5: Development & Testing 🔧
- **You receive**:
  - Access key (unique identifier for your software)
  - SFTP credentials (for bulk submissions)
  - Test environment details
  - Interface specification documents (XML schemas, validation rules)
  
- **You build**:
  - Integration layer in your ERP
  - File generation (XML/CSV formats per SARS specs)
  - SFTP upload/download automation
  - eFiling authentication flow

### Step 6: SARS Testing & Certification ✅
- Submit test files to SARS test environment
- SARS validates your submissions
- Fix any errors/validation issues
- Get certification approval

### Step 7: Go Live! 🚀
- Switch to production SFTP server
- Use production access key
- Start submitting real tax returns
- Monitor and maintain integration

---

## 🏗️ Technical Architecture - What We'll Build

### 1. **SARS Integration Service** (Backend)

**Location**: `/backend/src/modules/sars-integration/`

#### Components:

##### A. Authentication Layer
```typescript
// OAuth 2.0 / API Key authentication
class SARSAuthService {
  - authenticateWithAccessKey()
  - refreshToken()
  - validateSession()
}
```

##### B. eFiling Connector (For Real-time Queries)
```typescript
class EFilingConnector {
  - getUserProfile()          // Get taxpayer info
  - getNotifications()        // Fetch SARS notices
  - getCorrespondence()       // Download letters
  - getWorkItems()            // Pending actions
  - submitReturn()            // Submit single return
}
```

##### C. SFTP Bulk Submission Service (For Tax Directives)
```typescript
class SFTPBulkService {
  - generateBulkFile()        // Create XML/CSV per SARS spec
  - uploadToSARS()            // SFTP upload
  - downloadResults()         // Fetch processing results
  - parseResponseFile()       // Extract success/errors
  - retryFailed()             // Resubmit rejected items
}
```

##### D. Tax Return Generators
```typescript
class PAYEReturnGenerator {
  - generateEMP201()          // Monthly PAYE declaration
  - generateEMP501()          // Annual reconciliation
  - generateIRP5()            // Employee tax certificates
  - validate()                // Pre-submission checks
}

class TaxDirectiveGenerator {
  - generateBulkDirectiveRequest()   // XML format
  - parseDirectiveResponse()         // Parse SARS results
  - updateEmployeeRecords()          // Apply directive rates
}

class AnnualReturnGenerator {
  - generateITR12()           // Individual tax return
  - generateITR14()           // Company tax return
  - generateIRP6()            // Employer annual return
}
```

##### E. Submission Tracker
```typescript
class SubmissionTracker {
  - logSubmission()           // Record all submissions
  - trackStatus()             // Monitor processing
  - handleErrors()            // Parse SARS error codes
  - generateAuditTrail()      // Compliance logging
}
```

### 2. **Database Tables**

```sql
-- SARS Credentials (Encrypted)
CREATE TABLE sars_credentials (
  credential_id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(company_id),
  access_key VARCHAR(255) ENCRYPTED,  -- ISV access key
  sftp_username VARCHAR(255) ENCRYPTED,
  sftp_password VARCHAR(255) ENCRYPTED,
  efiling_username VARCHAR(255) ENCRYPTED,
  efiling_password VARCHAR(255) ENCRYPTED,
  environment VARCHAR(20),  -- 'test' or 'production'
  last_authenticated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submission Queue
CREATE TABLE sars_submission_queue (
  submission_id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(company_id),
  submission_type VARCHAR(50),  -- 'PAYE', 'TaxDirective', 'ITR12', etc.
  period_start DATE,
  period_end DATE,
  file_path VARCHAR(500),  -- Path to generated XML/CSV
  file_hash VARCHAR(64),   -- SHA-256 for integrity
  status VARCHAR(50),      -- 'Pending', 'Uploading', 'Processing', 'Success', 'Failed'
  sars_reference VARCHAR(100),  -- SARS tracking number
  submitted_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SARS Responses
CREATE TABLE sars_submission_results (
  result_id UUID PRIMARY KEY,
  submission_id UUID REFERENCES sars_submission_queue(submission_id),
  result_type VARCHAR(50),  -- 'Accepted', 'Rejected', 'PartialSuccess'
  sars_message TEXT,
  error_code VARCHAR(20),
  error_details JSONB,  -- Structured error data
  response_file_path VARCHAR(500),
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Directives (Specific to bulk directive requests)
CREATE TABLE tax_directives (
  directive_id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(employee_id),
  submission_id UUID REFERENCES sars_submission_queue(submission_id),
  directive_type VARCHAR(50),  -- 'IRP3a', 'IRP3s', etc.
  directive_number VARCHAR(50),  -- SARS-issued number
  tax_rate DECIMAL(5,2),
  reason_code VARCHAR(10),
  effective_from DATE,
  effective_to DATE,
  status VARCHAR(50),  -- 'Pending', 'Approved', 'Rejected'
  requested_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SARS Correspondence (Already exists in SARS Sentinel)
-- Links submissions to received correspondence
CREATE TABLE sars_submission_correspondence (
  link_id UUID PRIMARY KEY,
  submission_id UUID REFERENCES sars_submission_queue(submission_id),
  correspondence_id UUID REFERENCES sars_correspondence(correspondence_id),
  linked_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. **File Format Examples**

#### PAYE EMP201 (Monthly Declaration) - XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<EMP201 xmlns="http://sars.gov.za/schemas/paye">
  <Header>
    <EmployerReference>7654321000</EmployerReference>
    <TaxPeriod>202511</TaxPeriod>  <!-- November 2025 -->
    <SubmissionDate>2025-12-07</SubmissionDate>
  </Header>
  <Employees>
    <Employee>
      <IdNumber>8001015009087</IdNumber>
      <EmployeeNumber>EMP001</EmployeeNumber>
      <Remuneration>25000.00</Remuneration>
      <PAYE>5625.00</PAYE>
      <SDL>312.50</SDL>
      <UIF>250.00</UIF>
    </Employee>
    <!-- More employees -->
  </Employees>
  <Summary>
    <TotalPAYE>112500.00</TotalPAYE>
    <TotalSDL>6250.00</TotalSDL>
    <TotalUIF>5000.00</TotalUIF>
    <TotalAmount>123750.00</TotalAmount>
  </Summary>
</EMP201>
```

#### Tax Directive Bulk Request - CSV
```csv
EmployerReference,EmployeeIdNumber,DirectiveType,IncomeSource,ReasonCode,EffectiveDate
7654321000,8001015009087,IRP3a,Monthly Salary,01,2025-12-01
7654321000,8502034567089,IRP3a,Monthly Salary,01,2025-12-01
```

### 4. **Integration Flow Diagrams**

#### PAYE Submission Flow
```
┌─────────────────┐
│ Payroll Module  │
│ (Monthly Close) │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Generate EMP201 XML │
│ (SARS Format)       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Validate Against    │
│ SARS Schema (XSD)   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Queue Submission    │
│ (sars_submission_   │
│  queue table)       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ SFTP Upload to SARS │
│ (Encrypted channel) │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ SARS Processing     │
│ (Asynchronous)      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Download Result File│
│ (SFTP polling)      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Parse Results       │
│ (Success/Errors)    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Update Submission   │
│ Status & Notify     │
└─────────────────────┘
```

#### eFiling Real-time Flow
```
┌─────────────────┐
│ SARS Sentinel   │
│ (Polling Daemon)│
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Authenticate with   │
│ eFiling (OAuth)     │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Fetch Notifications │
│ (REST API)          │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Download Documents  │
│ (PDF/XML)           │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ AI Classification   │
│ (Document Type)     │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Extract Metadata    │
│ (Deadlines, Amounts)│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Create Workflow     │
│ & Alert Users       │
└─────────────────────┘
```

---

## 📦 What We Get from SARS

### Access Credentials
- **ISV Access Key**: Unique identifier like `"WCLASS-ERP-PROD-2025-ABC123"`
- **SFTP Server**: `sftp://efiling.sars.gov.za`
- **SFTP Username**: `isv_worldclass_erp`
- **SFTP Password**: `[provided by SARS]`
- **API Endpoints**: `https://efiling.sars.gov.za/api/v1/...`

### Documentation
- XML Schemas (`.xsd` files) for validation
- CSV format specifications
- Error code reference
- Test data samples
- Integration guide PDFs

### Test Environment
- Separate test SFTP server
- Test access credentials
- Sample test files
- Pre-loaded test scenarios

---

## 🔐 Security Considerations

### 1. Credential Storage
- **Encrypt** all SARS credentials using AES-256
- Store in secure vault (PostgreSQL encrypted columns + HashiCorp Vault)
- Never log credentials
- Rotate passwords quarterly

### 2. Data Transmission
- **SFTP with SSH keys** (not just password)
- **TLS 1.3** for API calls
- File checksums (SHA-256) for integrity
- Audit trail of all transmissions

### 3. Access Control
- Role-based access to SARS integration features
- Separate permissions for test vs. production
- Multi-factor authentication for submission actions
- IP whitelisting (if SARS requires)

### 4. Compliance
- **POPIA** (Protection of Personal Information Act) compliance
- Secure deletion of sensitive files after processing
- Data retention policies (7 years for tax records)
- Regular security audits

---

## 💰 Cost Analysis

### ISV Registration
- **SARS Fees**: **FREE** (No registration cost!)
- **Time Investment**: 
  - Application: 2-4 hours (forms, documents)
  - Development: 4-6 weeks (integration layer)
  - Testing: 1-2 weeks (SARS certification)

### Infrastructure Costs
- **SFTP Client**: Open-source libraries (FREE)
- **SSL Certificates**: LetsEncrypt (FREE) or commercial ($50-200/year)
- **Storage**: Minimal (submission files ~1-5 MB each)
- **Server**: Existing backend infrastructure (no additional cost)

### Ongoing Costs
- **Maintenance**: Developer time for updates to SARS specs
- **Support**: Monitoring submission queues, handling errors
- **Compliance Audits**: Periodic review (internal team)

---

## ⚠️ Limitations & Considerations

### 1. **Not All Tax Types Available via ISV**
✅ **Available**: PAYE, Tax Directives, ITR12, ITR14, IRP6, Transfer Duty  
❌ **Not Available**: VAT201 (may require manual eFiling login)

**Solution**: Hybrid approach
- Use ISV for available types
- eFiling scraping/RPA for others (with user consent)
- Manual upload option for edge cases

### 2. **Processing Delays**
- SFTP submissions are **asynchronous**
- Results may take 15 minutes to 24 hours
- Need polling mechanism to check status

**Solution**: Background job scheduler
- Poll SARS every 15 minutes for results
- Notify users when processing complete
- Queue retries for failed submissions

### 3. **SARS System Downtime**
- SARS systems occasionally go offline (weekends, maintenance)
- Month-end spikes can slow processing

**Solution**: Smart retry logic
- Detect SARS maintenance windows
- Auto-queue submissions for retry
- User notifications about delays

### 4. **Specification Updates**
- SARS occasionally updates XML schemas (new tax rules)
- Must stay updated with changes

**Solution**: Version management
- Support multiple spec versions simultaneously
- Automated schema validation tests
- Subscribe to SARS ISV notifications

---

## 🎯 Integration with Existing SARS Sentinel

### Current SARS Sentinel (Phase 1 - Completed)
- Manual upload of SARS correspondence
- Document classification (11 types)
- Workflow tracking
- Deadline alerts

### Enhanced with ISV Integration
```typescript
// BEFORE (Manual)
User manually downloads SARS letter from eFiling
→ Uploads to SARS Sentinel
→ AI classifies and extracts deadlines
→ Creates workflow

// AFTER (Automated with ISV)
SARS Sentinel polls eFiling API every hour
→ Auto-downloads new correspondence
→ AI classifies and extracts deadlines
→ Creates workflow
→ Links to related submissions (if applicable)
→ Alerts user immediately
```

### New Capabilities
1. **Two-way Sync**: Not just receive, but also SUBMIT to SARS
2. **Submission Tracking**: Link payroll → EMP201 submission → SARS response
3. **Predictive Alerts**: "PAYE deadline in 5 days, submission not yet queued"
4. **Auto-reconciliation**: Match SARS payment confirmations to submissions

---

## 🚀 Development Roadmap (8 Weeks)

### Week 1-2: ISV Registration & Setup
- [ ] Complete INF001 form
- [ ] Sign Terms and Conditions
- [ ] Submit application to SARS
- [ ] Set up development environment
- [ ] Create database tables

### Week 3-4: Core Integration Layer
- [ ] Build SFTP connector (upload/download)
- [ ] Implement authentication service
- [ ] Create submission queue system
- [ ] Build result parser
- [ ] Unit tests (80%+ coverage)

### Week 5-6: Tax Return Generators
- [ ] PAYE EMP201 XML generator
- [ ] Tax Directive CSV generator
- [ ] ITR12 generator
- [ ] Schema validation engine
- [ ] Integration tests with SARS test environment

### Week 7: Testing & Certification
- [ ] Submit test files to SARS
- [ ] Fix validation errors
- [ ] Performance testing (1000+ submissions)
- [ ] Security audit
- [ ] Get SARS certification

### Week 8: UI & Go-Live
- [ ] Build submission dashboard UI
- [ ] Create user guides
- [ ] Production deployment
- [ ] Monitor first live submissions
- [ ] User training

---

## 📚 Required Documents Checklist

### From SARS Website
- [x] ISV Terms and Conditions PDF
- [x] INF001 Application Form
- [ ] Interface Specification: PAYE (request after approval)
- [ ] Interface Specification: Tax Directives (IBIR-006)
- [ ] Interface Specification: ITR12/ITR14 (request after approval)

### From Your Company
- [ ] Company registration certificate (CK1)
- [ ] Tax clearance certificate
- [ ] Proof of eFiling registration
- [ ] Director ID copies
- [ ] Software product description (1-2 pages)
- [ ] Technical infrastructure overview

### To Create
- [ ] Data protection policy (POPIA compliance)
- [ ] Security architecture document
- [ ] Disaster recovery plan
- [ ] User support procedures

---

## 🎓 Next Steps - Action Plan

### Immediate (This Week)
1. **Download forms** from SARS website:
   - Terms and Conditions
   - INF001 Application Form
   
2. **Gather company documents**:
   - Tax number
   - Registration certificate
   - Tax clearance (if available)
   
3. **Review Terms and Conditions**:
   - Read all 15+ pages
   - Note any concerns
   - Prepare questions for SARS

### Short Term (Next 2 Weeks)
1. **Complete INF001 Form**:
   - Company details
   - Software description: "Worldclass ERP - Practice Management & Tax Compliance"
   - Tax types: PAYE, Tax Directives, ITR12, ITR14
   - Technical contact: [Your details]
   
2. **Submit Application**:
   - Email to clsisvapplications@sars.gov.za
   - Include all required documents
   - Request interface specifications
   
3. **Start Database Design**:
   - Create migration for SARS credentials table
   - Design submission queue schema
   - Plan encryption strategy

### Medium Term (Weeks 3-6)
1. **Wait for SARS Approval** (2-4 weeks)
2. **Receive Access Credentials**
3. **Download Interface Specs**
4. **Begin Development** (following roadmap above)

---

## ❓ FAQ - Common Questions Answered

### Q: Do we need to pay SARS for ISV access?
**A**: No! SARS ISV registration is **completely free**.

### Q: How long does approval take?
**A**: Typically **2-4 weeks** from submission. Can be faster if all documents are complete.

### Q: What if we're rejected?
**A**: Very rare if you have a legitimate software product and proper company registration. SARS usually provides feedback and requests corrections.

### Q: Can we test before getting approved?
**A**: No. You need official credentials to access SARS test environment. However, we can build 90% of the system using mock SARS responses, then integrate once approved.

### Q: What if SARS changes their specs?
**A**: SARS provides advance notice (usually 3-6 months) for major changes. We'll need to update our generators and validators, but the core integration layer stays the same.

### Q: Can we use this for multiple companies?
**A**: Yes! One ISV registration covers your software. You can submit on behalf of multiple client companies (with their eFiling credentials).

### Q: What about VAT returns?
**A**: VAT201 is **not** currently available via ISV interface. Options:
   - Manual eFiling login for now
   - RPA/scraping (with user consent)
   - Wait for SARS to add VAT to ISV service

### Q: Is this legal and compliant?
**A**: 100% legal! This is the **official SARS-endorsed method** for software companies. Much safer than scraping.

---

## 🏆 Benefits Summary

### For Your Business
- ✅ **Official SARS Partner** status (credibility boost)
- ✅ **Competitive Advantage** (few accounting software has this)
- ✅ **Scalability** (bulk submissions, not one-by-one)
- ✅ **Automation** (reduce manual eFiling logins)
- ✅ **Reliability** (official API, not fragile scraping)

### For Your Clients
- ✅ **Faster Tax Submissions** (automated from payroll)
- ✅ **Real-time Status Updates** (know when SARS accepted/rejected)
- ✅ **Error Prevention** (pre-validation before submission)
- ✅ **Audit Trail** (complete history of submissions)
- ✅ **Peace of Mind** (SARS Sentinel never misses a deadline)

### For Compliance
- ✅ **POPIA Compliant** (secure data handling)
- ✅ **Audit-Ready** (full submission logs)
- ✅ **Tax Law Updates** (SARS provides spec updates)
- ✅ **Professional Standard** (SARS-approved integration)

---

## 📞 SARS Contact Information

**ISV Applications**: clsisvapplications@sars.gov.za  
**General eFiling Support**: 0800 00 7277  
**Technical Support** (after approval): isv.support@sars.gov.za *(check docs for exact email)*

**Office Hours**: Monday-Friday, 8:00 AM - 4:30 PM (SAST)

---

## ✅ Conclusion & Recommendation

**YES, WE CAN ACHIEVE FULL SARS INTEGRATION!**

### My Recommendation:
1. ✅ **Pause Client Portal work** (it's optional enhancement)
2. ✅ **Prioritize SARS ISV registration** (critical compliance feature)
3. ✅ **Start application IMMEDIATELY** (2-4 week approval time)
4. ✅ **Build integration in parallel** (while waiting for approval)
5. ✅ **Resume Client Portal later** (after SARS integration live)

### Why This Order?
- **SARS compliance is CRITICAL** for South African businesses
- **ISV approval takes time** (can't rush SARS)
- **Client Portal is nice-to-have** (practice management works without it)
- **SARS integration = HUGE selling point** ("Official SARS integration!")
- **Early mover advantage** (not many SA software has this)

### What I Need from You:
1. **Company Details** for INF001 form:
   - Registered company name
   - Tax number (company & VAT)
   - Physical address
   - Director/owner details
   
2. **Decision**: Confirm we proceed with SARS ISV registration
3. **Documents**: Gather registration cert, tax clearance
4. **Signature**: You'll need to sign Terms & Conditions

**Ready to become a SARS ISV?** 🚀

