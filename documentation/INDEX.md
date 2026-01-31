# SiyaBusa ERP Documentation
## Master Index

---

**Product:** SiyaBusa ERP  
**Company:** Masaphokati Technologies (Pty) Ltd  
**Last Updated:** January 2026

---

## Welcome

Welcome to the SiyaBusa ERP documentation repository. This master index provides navigation to all professional documentation across the organization.

---

## Documentation Structure

```
documentation/
├── legal/                    # Legal agreements and policies
├── sales/                    # Sales enablement materials  
├── technical/                # Technical and API documentation
├── customer-success/         # Customer success resources
├── operations/               # Operational procedures
└── training/                 # User training materials (existing)
```

---

## Documentation by Department

### Legal Department
[View Index](legal/INDEX.md)

| Document | Description |
|----------|-------------|
| [Terms of Service](legal/TERMS-OF-SERVICE.md) | Customer terms and conditions |
| [Privacy Policy](legal/PRIVACY-POLICY.md) | POPIA-compliant privacy policy |
| [Service Level Agreement](legal/SERVICE-LEVEL-AGREEMENT.md) | SLA with availability commitments |
| [Master Services Agreement](legal/MASTER-SERVICES-AGREEMENT.md) | Enterprise contract template |
| [Data Processing Agreement](legal/DATA-PROCESSING-AGREEMENT.md) | Data processing terms |
| [Acceptable Use Policy](legal/ACCEPTABLE-USE-POLICY.md) | Usage policies |
| [End User License Agreement](legal/END-USER-LICENSE-AGREEMENT.md) | Software licensing terms |

### Sales Team
[View Index](sales/INDEX.md)

| Document | Description |
|----------|-------------|
| [Pricing Guide](sales/PRICING-GUIDE.md) | Complete pricing information |
| [SOW Template](sales/SOW-TEMPLATE.md) | Implementation statement of work |
| [ROI Calculator](sales/ROI-CALCULATOR.md) | Business case development tool |
| [Implementation Project Plan](sales/IMPLEMENTATION-PROJECT-PLAN.md) | Project planning template |

### Technical / Engineering
[View Index](technical/INDEX.md)

| Document | Description |
|----------|-------------|
| [API Documentation](technical/API-DOCUMENTATION.md) | REST API reference |
| [System Requirements](technical/SYSTEM-REQUIREMENTS.md) | Technical prerequisites |
| [Security Whitepaper](technical/SECURITY-WHITEPAPER.md) | Security architecture |
| [Support Escalation Matrix](technical/SUPPORT-ESCALATION-MATRIX.md) | Support procedures |

### Customer Success
[View Index](customer-success/INDEX.md)

| Document | Description |
|----------|-------------|
| [Customer Success Playbook](customer-success/CUSTOMER-SUCCESS-PLAYBOOK.md) | CSM methodology guide |
| [Case Study Templates](customer-success/CASE-STUDY-TEMPLATES.md) | Industry case study templates |
| [Competitive Battle Cards](customer-success/COMPETITIVE-BATTLE-CARDS.md) | Competitive intelligence |
| [QBR Template](customer-success/QBR-TEMPLATE.md) | Quarterly review template |

### Operations
[View Index](operations/INDEX.md)

| Document | Description |
|----------|-------------|
| [Incident Post-Mortem Template](operations/INCIDENT-POST-MORTEM-TEMPLATE.md) | Post-incident analysis template |

### Training (Existing)
[View Folder](training/)

| Document | Description |
|----------|-------------|
| Finance Training | Financial module training |
| HR Training | HR & Payroll module training |
| Inventory Training | Inventory management training |
| Administrator Guide | System administration guide |

---

## Quick Access by Role

### Sales Representatives
1. [Pricing Guide](sales/PRICING-GUIDE.md) - Customer pricing
2. [ROI Calculator](sales/ROI-CALCULATOR.md) - Business case
3. [Competitive Battle Cards](customer-success/COMPETITIVE-BATTLE-CARDS.md) - Competition
4. [Case Studies](customer-success/CASE-STUDY-TEMPLATES.md) - Customer stories

### Customer Success Managers
1. [Customer Success Playbook](customer-success/CUSTOMER-SUCCESS-PLAYBOOK.md) - Methodology
2. [QBR Template](customer-success/QBR-TEMPLATE.md) - Reviews
3. [Support Escalation Matrix](technical/SUPPORT-ESCALATION-MATRIX.md) - Support

### Implementation Consultants
1. [SOW Template](sales/SOW-TEMPLATE.md) - Scope definition
2. [Implementation Project Plan](sales/IMPLEMENTATION-PROJECT-PLAN.md) - Project management
3. [System Requirements](technical/SYSTEM-REQUIREMENTS.md) - Technical prep

### Developers / Technical
1. [API Documentation](technical/API-DOCUMENTATION.md) - Integration
2. [Security Whitepaper](technical/SECURITY-WHITEPAPER.md) - Security
3. [System Requirements](technical/SYSTEM-REQUIREMENTS.md) - Requirements

### Legal / Compliance
1. [Terms of Service](legal/TERMS-OF-SERVICE.md) - Customer terms
2. [Privacy Policy](legal/PRIVACY-POLICY.md) - Privacy
3. [Data Processing Agreement](legal/DATA-PROCESSING-AGREEMENT.md) - POPIA
4. [Master Services Agreement](legal/MASTER-SERVICES-AGREEMENT.md) - Contracts

### Operations / Support
1. [Support Escalation Matrix](technical/SUPPORT-ESCALATION-MATRIX.md) - Support tiers
2. [Incident Post-Mortem Template](operations/INCIDENT-POST-MORTEM-TEMPLATE.md) - Incidents
3. [SLA](legal/SERVICE-LEVEL-AGREEMENT.md) - Service levels

---

## Document Statistics

| Category | Documents | Status |
|----------|:---------:|:------:|
| Legal | 7 | ✅ Complete |
| Sales | 4 | ✅ Complete |
| Technical | 4 | ✅ Complete |
| Customer Success | 4 | ✅ Complete |
| Operations | 1 | ✅ Complete |
| **Total** | **20** | ✅ |

---

## Version Control

All documents follow these standards:
- Version numbering (1.0, 1.1, 2.0)
- Effective date
- Change history table
- Review schedule

---

## PDF Generation

To generate PDF versions of all documentation:

```bash
cd /workspaces/WorldClass-ERP
node tools/convert-docs-to-pdf.js
```

PDF outputs will be saved to `documentation/pdf/`

---

## Contributing

To update documentation:
1. Edit the Markdown source file
2. Update version number and date
3. Add entry to change history
4. Regenerate PDF if needed
5. Update this index if adding new documents

---

## Contact

**Documentation Team**  
📧 docs@siyabusa.com

**For specific inquiries:**
- Legal: legal@siyabusa.com
- Sales: sales@siyabusa.com
- Technical: support@siyabusa.com
- Customer Success: success@siyabusa.com

---

*SiyaBusa ERP - Powering African Business*

**© 2026 Masaphokati Technologies (Pty) Ltd. All Rights Reserved.**
