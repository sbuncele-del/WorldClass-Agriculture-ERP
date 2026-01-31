# SiyaBusa ERP
## Service Level Agreement (SLA)

---

**Effective Date:** January 1, 2026  
**Version:** 1.0

---

## 1. Introduction

### 1.1 Purpose

This Service Level Agreement ("SLA") describes the service levels that **Masaphokati Technologies (Pty) Ltd** ("Provider", "we", "us") commits to provide to customers ("Customer", "you") of the SiyaBusa ERP service ("Service").

### 1.2 Scope

This SLA applies to:
- SiyaBusa ERP cloud-hosted service
- All subscription plans (Starter, Professional, Enterprise)
- Production environments

This SLA does not apply to:
- Development, test, or sandbox environments
- Customer-caused issues
- Third-party integrations not provided by us
- Free trials or beta features

### 1.3 Agreement

This SLA is incorporated by reference into the SiyaBusa ERP Terms of Service and any applicable Master Services Agreement. In case of conflict, the MSA takes precedence.

---

## 2. Service Availability

### 2.1 Availability Commitment

We commit to the following availability levels:

| Plan | Monthly Availability Target | Annual Downtime Allowance |
|------|:---------------------------:|:-------------------------:|
| **Starter** | 99.5% | ~3.65 hours/month |
| **Professional** | 99.9% | ~43 minutes/month |
| **Enterprise** | 99.95% | ~22 minutes/month |

### 2.2 Availability Calculation

```
Availability % = ((Total Minutes - Downtime Minutes) / Total Minutes) × 100

Where:
- Total Minutes = Total minutes in the calendar month
- Downtime Minutes = Minutes the Service was unavailable (excluding Exclusions)
```

### 2.3 Availability Exclusions

Downtime does **not** include:
- Scheduled maintenance (with proper notice)
- Emergency maintenance (for security or stability)
- Customer-caused outages
- Third-party service failures outside our control
- Force majeure events
- Features in beta or preview
- Customer network or equipment issues

---

## 3. Service Credits

### 3.1 Credit Eligibility

If we fail to meet the Availability Target, you may be eligible for service credits:

| Monthly Availability | Service Credit |
|:--------------------:|:--------------:|
| < Target, ≥ 99.0% | 10% of monthly fee |
| < 99.0%, ≥ 95.0% | 25% of monthly fee |
| < 95.0% | 50% of monthly fee |

### 3.2 Credit Request Process

To receive service credits:

1. **Submit Request:** Email sla@siyabusa.com within 30 days of the incident
2. **Include Details:**
   - Account/Tenant ID
   - Date(s) and time(s) of unavailability
   - Description of the impact
   - Any error messages or screenshots
3. **Verification:** We will verify the claim against our monitoring data
4. **Credit Issuance:** Approved credits applied to your next invoice

### 3.3 Credit Limitations

- Maximum credit: 50% of monthly fee per month
- Credits are not transferable or redeemable for cash
- Credits expire 12 months after issuance
- Credits do not apply if you are in breach of the Terms of Service
- Credits are your sole remedy for availability failures

---

## 4. Support Services

### 4.1 Support Channels

| Channel | Starter | Professional | Enterprise |
|---------|:-------:|:------------:|:----------:|
| Knowledge Base | ✅ | ✅ | ✅ |
| Community Forum | ✅ | ✅ | ✅ |
| Email Support | ✅ | ✅ | ✅ |
| Chat Support | ✅ | ✅ | ✅ |
| Phone Support | ❌ | ✅ | ✅ |
| Dedicated CSM | ❌ | ❌ | ✅ |

### 4.2 Support Hours

| Plan | Support Hours |
|------|---------------|
| **Starter** | 08:00 - 17:00 SAST, Monday-Friday |
| **Professional** | 07:00 - 19:00 SAST, Monday-Friday |
| **Enterprise** | 24/7/365 |

*SAST = South Africa Standard Time (UTC+2)*

### 4.3 Priority Definitions

| Priority | Definition | Examples |
|----------|------------|----------|
| **P1 - Critical** | Service completely unavailable; major business impact | System down, data loss, security breach |
| **P2 - High** | Major feature unavailable; significant impact | Core module not working, unable to process transactions |
| **P3 - Medium** | Feature degraded; moderate impact | Slow performance, workaround available |
| **P4 - Low** | Minor issue; minimal impact | Cosmetic issues, enhancement requests |

### 4.4 Response Time Targets

| Priority | Starter | Professional | Enterprise |
|----------|:-------:|:------------:|:----------:|
| **P1 - Critical** | 4 hours | 1 hour | 15 minutes |
| **P2 - High** | 8 hours | 4 hours | 1 hour |
| **P3 - Medium** | 24 hours | 8 hours | 4 hours |
| **P4 - Low** | 48 hours | 24 hours | 8 hours |

*Response times are measured during Support Hours*

### 4.5 Resolution Time Targets

| Priority | Target Resolution |
|----------|:------------------:|
| **P1 - Critical** | 4 hours |
| **P2 - High** | 8 hours |
| **P3 - Medium** | 3 business days |
| **P4 - Low** | 10 business days |

*Resolution targets are goals, not guarantees. Complex issues may require longer.*

---

## 5. Maintenance Windows

### 5.1 Scheduled Maintenance

| Maintenance Type | Notice | Typical Window |
|------------------|--------|----------------|
| **Standard** | 7 days advance notice | Sunday 02:00-06:00 SAST |
| **Urgent** | 24 hours advance notice | Off-peak hours |
| **Emergency** | As soon as practical | Any time (security/stability) |

### 5.2 Maintenance Communication

- Maintenance notifications sent via email to account administrators
- In-app notifications for upcoming maintenance
- Status page updates at status.siyabusa.com
- Post-maintenance summary for significant changes

### 5.3 Maintenance Best Practices

We commit to:
- Minimize maintenance frequency and duration
- Perform maintenance during low-usage periods
- Use rolling updates to minimize impact
- Test changes in staging before production

---

## 6. Performance Standards

### 6.1 Response Time Targets

| Metric | Target | Measurement |
|--------|:------:|-------------|
| **Page Load Time** | < 3 seconds | 95th percentile |
| **API Response Time** | < 500ms | 95th percentile |
| **Report Generation** | < 30 seconds | Standard reports |
| **Search Results** | < 2 seconds | 95th percentile |

### 6.2 Performance Monitoring

We continuously monitor:
- Server response times
- Database query performance
- API latency
- Error rates
- Resource utilization

### 6.3 Performance Reporting

Enterprise customers receive:
- Monthly performance reports
- Custom dashboard access
- Quarterly performance reviews

---

## 7. Data Protection

### 7.1 Backup Commitments

| Backup Type | Frequency | Retention |
|-------------|:---------:|:---------:|
| **Full Database** | Daily | 30 days |
| **Transaction Logs** | Continuous | 7 days |
| **Configuration** | Daily | 30 days |
| **File Storage** | Daily | 30 days |

### 7.2 Recovery Objectives

| Metric | Target |
|--------|:------:|
| **Recovery Point Objective (RPO)** | 1 hour |
| **Recovery Time Objective (RTO)** | 4 hours |

*RPO = Maximum data loss in case of disaster*  
*RTO = Maximum time to restore service after disaster*

### 7.3 Data Integrity

We commit to:
- Encrypted backups (AES-256)
- Geographically redundant storage
- Regular backup testing
- Documented disaster recovery procedures

---

## 8. Security Standards

### 8.1 Security Commitments

We commit to:
- AES-256 encryption for data at rest
- TLS 1.3 encryption for data in transit
- Multi-factor authentication support
- Regular security assessments
- Vulnerability scanning and patching
- Security incident response procedures

### 8.2 Security Incident Response

| Severity | Initial Response | Customer Notification |
|----------|:----------------:|:---------------------:|
| **Critical** | 15 minutes | 1 hour |
| **High** | 1 hour | 4 hours |
| **Medium** | 4 hours | 24 hours |
| **Low** | 8 hours | As appropriate |

### 8.3 Compliance

We maintain compliance with:
- POPIA (Protection of Personal Information Act)
- SOC 2 Type II (annual audit)
- ISO 27001 (information security)

---

## 9. Communication

### 9.1 Status Page

Real-time service status: **status.siyabusa.com**

The status page provides:
- Current system status
- Incident history
- Scheduled maintenance
- Subscription for updates

### 9.2 Incident Communication

During incidents, we provide:

| Update Type | Frequency |
|-------------|-----------|
| **Initial Acknowledgment** | Within Response Time target |
| **Progress Updates** | Every 30 minutes (P1), hourly (P2) |
| **Resolution Notice** | Upon resolution |
| **Post-Incident Report** | Within 5 business days (P1/P2) |

### 9.3 Post-Incident Reports

For P1 and P2 incidents, we provide:
- Incident timeline
- Root cause analysis
- Impact assessment
- Corrective actions
- Prevention measures

---

## 10. Customer Responsibilities

### 10.1 Your Responsibilities

To ensure optimal service, you are responsible for:

| Responsibility | Description |
|----------------|-------------|
| **Access Management** | Manage user accounts and permissions |
| **Data Quality** | Ensure accuracy of data entered |
| **Browser Support** | Use supported browser versions |
| **Network** | Maintain adequate internet connectivity |
| **Security** | Protect login credentials, enable MFA |
| **Communication** | Maintain current contact information |
| **Reporting** | Report issues promptly via proper channels |

### 10.2 Supported Browsers

| Browser | Minimum Version |
|---------|:---------------:|
| Google Chrome | Latest - 2 |
| Microsoft Edge | Latest - 2 |
| Mozilla Firefox | Latest - 2 |
| Apple Safari | Latest - 2 |

### 10.3 Network Requirements

| Requirement | Specification |
|-------------|---------------|
| **Bandwidth** | Minimum 10 Mbps per user |
| **Latency** | < 100ms to Cape Town |
| **Firewall** | Allow HTTPS (port 443) |

---

## 11. Escalation Procedures

### 11.1 Escalation Matrix

| Level | Contact | When to Escalate |
|-------|---------|------------------|
| **Level 1** | Support Team | Initial contact |
| **Level 2** | Support Manager | No progress after 4 hours (P1/P2) |
| **Level 3** | Director of Operations | No progress after 8 hours (P1) |
| **Level 4** | Executive Team | Business-critical impact |

### 11.2 Escalation Contacts

| Level | Email | Phone |
|-------|-------|-------|
| **Support** | support@siyabusa.com | +27 XX XXX XXXX |
| **Escalations** | escalations@siyabusa.com | +27 XX XXX XXXX |
| **Emergency (P1)** | emergency@siyabusa.com | +27 XX XXX XXXX |

### 11.3 When to Escalate

Escalate if:
- Response time targets not met
- Issue is business-critical
- Repeated issues with no resolution
- Communication is inadequate

---

## 12. Reporting and Reviews

### 12.1 Service Reports

| Report | Frequency | Availability |
|--------|-----------|--------------|
| **Availability Report** | Monthly | All plans |
| **Performance Report** | Monthly | Professional, Enterprise |
| **Security Report** | Quarterly | Enterprise |
| **Custom Reports** | As requested | Enterprise |

### 12.2 Service Reviews

| Review Type | Frequency | Plans |
|-------------|-----------|-------|
| **Quarterly Business Review** | Quarterly | Enterprise |
| **Annual Review** | Annually | Professional, Enterprise |

---

## 13. SLA Exclusions

### 13.1 Circumstances Not Covered

This SLA does not apply to service issues caused by:

1. **Customer Actions:**
   - Misuse of the Service
   - Unauthorized modifications
   - Failure to follow guidelines
   - Customer network or equipment issues

2. **Third-Party Factors:**
   - Third-party service failures
   - Internet connectivity issues
   - DNS problems outside our control
   - Third-party integrations

3. **External Events:**
   - Force majeure (natural disasters, war, etc.)
   - Government actions
   - Malicious attacks (if reasonable measures were taken)

4. **Planned Activities:**
   - Scheduled maintenance
   - Customer-requested changes
   - Testing and development environments

### 13.2 Beta and Preview Features

Features marked as "beta", "preview", or "experimental" are:
- Not covered by this SLA
- Provided without service level commitments
- Subject to change or discontinuation

---

## 14. Modifications

### 14.1 SLA Changes

We may modify this SLA:
- With 30 days' notice for non-material changes
- With 60 days' notice for material changes
- Immediately for changes that improve service levels

### 14.2 Notification

Changes will be communicated via:
- Email to account administrators
- In-app notification
- Status page announcement

---

## 15. Definitions

| Term | Definition |
|------|------------|
| **Availability** | The Service is accessible and functioning |
| **Downtime** | Period when the Service is not Available |
| **Response Time** | Time from issue submission to first response |
| **Resolution Time** | Time from issue submission to resolution |
| **Scheduled Maintenance** | Planned downtime for updates/maintenance |
| **SAST** | South Africa Standard Time (UTC+2) |
| **Business Hours** | Hours when support is available per plan |
| **Business Days** | Monday-Friday, excluding SA public holidays |

---

## 16. Contact Information

**Support:**
- 📧 Email: support@siyabusa.com
- 💬 Chat: Available in the application
- 📞 Phone: +27 XX XXX XXXX

**SLA Inquiries:**
- 📧 Email: sla@siyabusa.com

**Status Page:**
- 🌐 status.siyabusa.com

---

**Document Control**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 1, 2026 | Initial release |

---

*SiyaBusa ERP - Powering African Business*

**© 2026 Masaphokati Technologies (Pty) Ltd. All Rights Reserved.**
