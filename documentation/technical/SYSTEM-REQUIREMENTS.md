# SiyaBusa ERP
## System Requirements Specification

## Table of Contents

1. [Overview](#overview)
2. [Deployment Options](#deployment-options)
3. [Browser Requirements](#browser-requirements)
4. [Network Requirements](#network-requirements)
5. [Mobile Device Requirements](#mobile-device-requirements)
6. [Integration Requirements](#integration-requirements)
7. [User Workstation Requirements](#user-workstation-requirements)
8. [Performance Expectations](#performance-expectations)
9. [Security Requirements](#security-requirements)
10. [Compliance & Data Residency](#compliance--data-residency)

---

## Overview

### About SiyaBusa ERP

SiyaBusa ERP is a cloud-native enterprise resource planning system delivered as Software-as-a-Service (SaaS). As a fully managed cloud solution, there are minimal infrastructure requirements for customers.

### Key Characteristics

| Characteristic | Details |
|----------------|---------|
| **Deployment Model** | 100% Cloud SaaS |
| **Hosting** | AWS (Amazon Web Services) |
| **Data Center Region** | Africa (Cape Town) / EU (Ireland) |
| **Architecture** | Multi-tenant, microservices |
| **Access Method** | Web browser, Mobile apps, API |

### What Customers Don't Need

✅ **No on-premise servers**  
✅ **No database management**  
✅ **No software installation**  
✅ **No manual updates/patches**  
✅ **No IT infrastructure**  
✅ **No backup management**  

---

## Deployment Options

### Cloud SaaS (Standard)

Our standard deployment is fully cloud-hosted.

| Aspect | Specification |
|--------|---------------|
| **Infrastructure** | Managed by SiyaBusa |
| **Updates** | Automatic, zero downtime |
| **Backups** | Daily automated backups |
| **Availability** | 99.9% SLA |
| **Scaling** | Automatic based on usage |

### Private Cloud (Enterprise)

For enterprise customers with specific requirements:

| Aspect | Specification |
|--------|---------------|
| **Infrastructure** | Dedicated tenant environment |
| **Data Isolation** | Fully isolated database |
| **Region Selection** | Choice of AWS regions |
| **Custom Compliance** | Tailored to requirements |
| **SLA** | 99.95% with premium support |

### Hybrid Options

| Option | Use Case |
|--------|----------|
| **API Integration** | Connect on-premise systems to SiyaBusa cloud |
| **Data Sync** | Bi-directional sync with local systems |
| **Reporting** | Connect BI tools to SiyaBusa data |

---

## Browser Requirements

### Supported Browsers

SiyaBusa is optimized for modern web browsers:

| Browser | Minimum Version | Recommended |
|---------|-----------------|-------------|
| **Google Chrome** | 90+ | Latest |
| **Microsoft Edge** | 90+ | Latest |
| **Mozilla Firefox** | 88+ | Latest |
| **Safari** | 14+ | Latest |
| **Opera** | 76+ | Latest |

### Browser Settings

#### Required Settings

| Setting | Requirement |
|---------|-------------|
| **JavaScript** | Enabled |
| **Cookies** | Enabled for siyabusa.com |
| **LocalStorage** | Enabled |
| **Pop-ups** | Allowed for siyabusa.com |
| **TLS** | 1.2 or higher |

#### Recommended Settings

| Setting | Recommendation |
|---------|----------------|
| **Hardware Acceleration** | Enabled |
| **Auto-update** | Enabled |
| **Cache** | Default settings |

### Unsupported Browsers

| Browser | Status |
|---------|--------|
| Internet Explorer 11 | ❌ Not supported |
| Edge Legacy (EdgeHTML) | ❌ Not supported |
| Safari < 14 | ❌ Not supported |

---

## Network Requirements

### Bandwidth Requirements

| Usage Type | Minimum | Recommended |
|------------|---------|-------------|
| **Per User (Active)** | 1 Mbps | 2+ Mbps |
| **Small Office (5 users)** | 5 Mbps | 10+ Mbps |
| **Medium Office (20 users)** | 15 Mbps | 30+ Mbps |
| **Large Office (50+ users)** | 40 Mbps | 100+ Mbps |

### Latency Requirements

| Metric | Maximum | Optimal |
|--------|---------|---------|
| **Round-trip Latency** | 200ms | < 100ms |
| **Packet Loss** | 1% | < 0.1% |
| **Jitter** | 30ms | < 10ms |

### Firewall & Proxy Configuration

#### Domains to Whitelist

```
# Core Application
*.siyabusa.com
app.siyabusa.com
api.siyabusa.com

# Authentication
auth.siyabusa.com
login.siyabusa.com

# Content Delivery
cdn.siyabusa.com
static.siyabusa.com

# File Storage
files.siyabusa.com
uploads.siyabusa.com

# Real-time Features
ws.siyabusa.com
realtime.siyabusa.com
```

#### Ports Required

| Port | Protocol | Purpose |
|------|----------|---------|
| 443 | HTTPS | All web traffic |
| 443 | WSS | WebSocket (real-time) |

### Proxy Configuration

If using a proxy server:

| Setting | Requirement |
|---------|-------------|
| **SSL Inspection** | May require certificate installation |
| **WebSocket Support** | Must be enabled |
| **Timeout** | Minimum 120 seconds |
| **Caching** | Exclude *.siyabusa.com |

### DNS Requirements

- Use reliable DNS servers (Google: 8.8.8.8, Cloudflare: 1.1.1.1)
- DNS resolution for siyabusa.com domains
- Consider local DNS caching for performance

---

## Mobile Device Requirements

### iOS Requirements

| Requirement | Specification |
|-------------|---------------|
| **iOS Version** | 14.0 or later |
| **Devices** | iPhone 8 or newer |
| **Storage** | 200 MB free space |
| **App Store** | SiyaBusa ERP app |

### Android Requirements

| Requirement | Specification |
|-------------|---------------|
| **Android Version** | 10.0 (API 29) or later |
| **Devices** | Most modern smartphones |
| **Storage** | 200 MB free space |
| **Play Store** | SiyaBusa ERP app |

### Mobile Browser (Alternative)

| Browser | Minimum Version |
|---------|-----------------|
| Chrome Mobile | 90+ |
| Safari Mobile | 14+ |
| Samsung Internet | 14+ |

### Mobile Network

| Network | Suitability |
|---------|-------------|
| **WiFi** | Optimal |
| **4G/LTE** | Good |
| **5G** | Excellent |
| **3G** | Limited functionality |

---

## Integration Requirements

### API Integration

| Requirement | Specification |
|-------------|---------------|
| **Protocol** | HTTPS/REST |
| **Authentication** | OAuth 2.0 |
| **Data Format** | JSON |
| **Rate Limits** | Per subscription tier |

### Third-Party Integrations

#### Banking Integration

| Bank | Integration Method |
|------|-------------------|
| Standard Bank | API / File upload |
| FNB | API / File upload |
| ABSA | File upload |
| Nedbank | File upload |
| Capitec | API |

#### Payment Gateways

| Gateway | Requirements |
|---------|--------------|
| **PayFast** | PayFast merchant account |
| **PayGate** | PayGate credentials |
| **Ozow** | Ozow account |
| **SnapScan** | SnapScan merchant |

#### Accounting Software (Migration)

| Software | Import Format |
|----------|---------------|
| Sage/Pastel | CSV, Excel |
| QuickBooks | IIF, CSV |
| Xero | CSV, Excel |

### Email Integration

| Service | Configuration |
|---------|---------------|
| **Microsoft 365** | OAuth connection |
| **Google Workspace** | OAuth connection |
| **SMTP** | Custom SMTP settings |

---

## User Workstation Requirements

### Minimum Requirements

| Component | Specification |
|-----------|---------------|
| **Operating System** | Windows 10, macOS 10.14, Ubuntu 20.04 |
| **Processor** | 2 GHz dual-core |
| **RAM** | 4 GB |
| **Storage** | 500 MB free |
| **Display** | 1280 x 720 |
| **Internet** | 2 Mbps |

### Recommended Requirements

| Component | Specification |
|-----------|---------------|
| **Operating System** | Windows 11, macOS 12+, Ubuntu 22.04 |
| **Processor** | 2.5 GHz quad-core |
| **RAM** | 8 GB |
| **Storage** | 1 GB free |
| **Display** | 1920 x 1080 |
| **Internet** | 10+ Mbps |

### Display Recommendations

| Usage | Minimum Resolution | Recommended |
|-------|-------------------|-------------|
| **Basic Use** | 1280 x 720 | 1920 x 1080 |
| **Financial Reports** | 1920 x 1080 | 2560 x 1440 |
| **Dashboard Views** | 1920 x 1080 | 2560 x 1440 |

### Peripheral Devices

| Device | Compatibility |
|--------|---------------|
| **Printers** | Any printer compatible with browser |
| **Barcode Scanners** | USB HID keyboard-mode scanners |
| **Receipt Printers** | ESC/POS compatible |
| **Card Readers** | Browser-compatible readers |

---

## Performance Expectations

### Response Times

| Operation | Expected Time |
|-----------|---------------|
| **Page Load** | < 3 seconds |
| **Form Submit** | < 2 seconds |
| **Report Generation** | < 10 seconds |
| **Search Results** | < 1 second |
| **Dashboard Load** | < 5 seconds |

### Concurrent Users

| Plan | Concurrent Users | Notes |
|------|------------------|-------|
| **Starter** | Up to 10 | Basic usage |
| **Professional** | Up to 50 | Standard usage |
| **Enterprise** | Unlimited | High volume |

### Data Limits

| Data Type | Starter | Professional | Enterprise |
|-----------|---------|--------------|------------|
| **Storage** | 10 GB | 50 GB | Unlimited |
| **Transactions/month** | 5,000 | 50,000 | Unlimited |
| **File Uploads** | 100 MB/file | 500 MB/file | 1 GB/file |
| **API Calls/day** | 10,000 | 50,000 | 200,000 |

### Offline Capability

| Feature | Offline Support |
|---------|-----------------|
| **Mobile App** | Limited (view cached data) |
| **Web App** | Not available |
| **Data Entry** | Queue when reconnected |

---

## Security Requirements

### Client-Side Security

| Requirement | Details |
|-------------|---------|
| **Antivirus** | Current, updated antivirus recommended |
| **Firewall** | Personal firewall recommended |
| **Auto-lock** | Screen lock after inactivity |
| **Secure Password** | Password manager recommended |

### Authentication Options

| Method | Availability |
|--------|--------------|
| **Username/Password** | All plans |
| **Multi-Factor Auth (MFA)** | All plans (recommended) |
| **SSO (SAML)** | Enterprise plan |
| **SSO (OAuth)** | Enterprise plan |

### MFA Options

| Option | Setup Required |
|--------|----------------|
| **Authenticator App** | Google/Microsoft Authenticator |
| **SMS** | Mobile phone number |
| **Email** | Verified email address |
| **Hardware Key** | FIDO2/WebAuthn devices |

### Password Requirements

| Requirement | Specification |
|-------------|---------------|
| **Minimum Length** | 8 characters |
| **Complexity** | Upper, lower, number, special |
| **Expiry** | 90 days (configurable) |
| **History** | Cannot reuse last 5 passwords |

---

## Compliance & Data Residency

### Data Residency Options

| Region | Data Center | Primary Users |
|--------|-------------|---------------|
| **South Africa** | AWS Cape Town | SA businesses |
| **Europe** | AWS Ireland | EU compliance required |
| **Global** | Multi-region | Multinational |

### Compliance Certifications

| Standard | Status |
|----------|--------|
| **POPIA** | Compliant |
| **GDPR** | Compliant (EU region) |
| **SOC 2 Type II** | Certified |
| **ISO 27001** | In progress |

### Data Backup & Retention

| Aspect | Specification |
|--------|---------------|
| **Backup Frequency** | Daily |
| **Backup Retention** | 30 days |
| **Point-in-Time Recovery** | Last 7 days |
| **Data Export** | Always available |
| **Data Deletion** | Upon request + 30 days |

### Encryption

| Layer | Encryption |
|-------|------------|
| **In Transit** | TLS 1.3 |
| **At Rest** | AES-256 |
| **Backups** | AES-256 |

---

## Pre-Deployment Checklist

### Technical Readiness

- [ ] Verify browser version meets requirements
- [ ] Test network connectivity to siyabusa.com
- [ ] Whitelist required domains in firewall
- [ ] Configure proxy exceptions if applicable
- [ ] Test from all office locations

### User Readiness

- [ ] Identify user accounts needed
- [ ] Collect user email addresses
- [ ] Define user roles and permissions
- [ ] Plan MFA rollout
- [ ] Schedule user training

### Data Readiness

- [ ] Export data from legacy systems
- [ ] Clean and format data for import
- [ ] Identify data mapping requirements
- [ ] Plan parallel running period

### Integration Readiness

- [ ] Document integration requirements
- [ ] Obtain API credentials
- [ ] Configure bank feed connections
- [ ] Test payment gateway integration

---

## Support Contacts

### Technical Support

| Channel | Contact | Hours |
|---------|---------|-------|
| **Email** | support@siyabusa.com | 24/7 |
| **Phone** | +27 XX XXX XXXX | 08:00-17:00 SAST |
| **Chat** | In-app chat | 08:00-20:00 SAST |
| **Emergency** | Enterprise hotline | 24/7 |

### Status & Updates

| Resource | URL |
|----------|-----|
| **System Status** | status.siyabusa.com |
| **Release Notes** | docs.siyabusa.com/releases |
| **Known Issues** | support.siyabusa.com |

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Technical | Initial release |

---

*SiyaBusa ERP - Powering African Business*

**© 2026 Masaphokati Technologies (Pty) Ltd. All Rights Reserved.**
