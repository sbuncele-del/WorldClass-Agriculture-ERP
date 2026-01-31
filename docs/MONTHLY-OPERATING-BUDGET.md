# SiyaBusa ERP - Monthly Operating Budget Detail

## Purpose
This document provides transparent breakdown of monthly costs for the 4-month runway (Feb-May 2026).

---

## Investment Ask: R200,000 for 4 Months

| Objective | Timeline |
|:----------|:---------|
| First paying customer | May 2026 |
| Break-even point | 5-6 customers |
| Pricing model | R980/user/month |

### 1. AWS Infrastructure (R5,500-R7,000/month)

| Service | Monthly | Notes |
|:--------|--------:|:------|
| ECS Fargate (Backend) | R1,200 | t3.small equivalent |
| ECS Fargate (Frontend) | R600 | Static hosting |
| RDS PostgreSQL | R1,800 | db.t3.micro + storage |
| Application Load Balancer | R400 | HTTPS termination |
| S3 Storage | R200 | Document storage |
| CloudWatch / Monitoring | R150 | Logs and alerts |
| Route 53 / DNS | R50 | Domain management |
| Data Transfer | R600 | Bandwidth |
| **Subtotal** | **R5,000-R7,000** | Scales with usage |

### 2. Third-Party Services (R13,000/month)

| Service | Plan | Monthly | Annual | Why |
|:--------|:-----|--------:|-------:|:----|
| **OpenAI API** | GPT-4 usage | R8,000 | R96,000 | 9 AI assistants |
| **Daily.co** | Pro | R2,500 | R30,000 | Video conferencing |
| **SendGrid** | Pro 100K | R1,500 | R18,000 | Transactional email |
| **Twilio** | Pay-as-you-go | R1,000 | R12,000 | SMS notifications |
| **Subtotal** | | **R13,000** | **R156,000** | |

### 3. Development Tools (R7,500/month)

| Service | Plan | Monthly | Annual | Why |
|:--------|:-----|--------:|-------:|:----|
| **GitHub** | Team | R2,500 | R30,000 | Private repos, CI/CD |
| **Sentry** | Team | R1,500 | R18,000 | Error tracking |
| **LogRocket** | Team | R2,000 | R24,000 | Session replay |
| **Jest/Cypress** | Enterprise | R1,500 | R18,000 | Testing automation |
| **Subtotal** | | **R7,500** | **R90,000** | |

### 4. Security & Compliance (R4,500/month)

| Service | Plan | Monthly | Annual | Why |
|:--------|:-----|--------:|-------:|:----|
| **SSL Certificates** | Wildcard | R500 | R6,000 | HTTPS everywhere |
| **Snyk** | Pro | R1,500 | R18,000 | Vulnerability scanning |
| **AWS Backup** | Cross-region | R2,000 | R24,000 | Disaster recovery |
| **Penetration Testing** | Quarterly | R500 | R6,000 | Security audits |
| **Subtotal** | | **R4,500** | **R54,000** | |

### 5. Domains & Misc (R500/month)

| Item | Monthly | Annual |
|:-----|--------:|-------:|
| Domains (siyabusa.co.za, etc.) | R200 | R2,400 |
| Additional services | R300 | R3,600 |
| **Subtotal** | **R500** | **R6,000** | |

---

### 6. Marketing (R90,000/month)

| Channel | Monthly | Annual | Strategy |
|:--------|--------:|-------:|:---------|
| **LinkedIn Ads** | R25,000 | R300,000 | B2B decision makers |
| **LinkedIn Sales Navigator** | R3,500 | R42,000 | Direct outreach |
| **LinkedIn Premium** | R1,500 | R18,000 | Content visibility |
| **Google Search Ads** | R15,000 | R180,000 | Intent-based traffic |
| **Google Display** | R5,000 | R60,000 | Remarketing |
| **Facebook/Instagram** | R8,000 | R96,000 | Brand awareness |
| **Twitter/X** | R3,000 | R36,000 | Tech community |
| **YouTube Ads** | R4,000 | R48,000 | Demo videos |
| **Content Creation** | R8,000 | R96,000 | Blogs, whitepapers |
| **SEO Services** | R5,000 | R60,000 | Organic growth |
| **Video Production** | R4,000 | R48,000 | Testimonials |
| **Trade Shows** | R2,500 | R30,000 | 3-4 events |
| **PR Agency** | R4,000 | R48,000 | Media coverage |
| **Launch Event** | R1,500 | R18,000 | Q2 2026 |
| **Subtotal** | **R90,000** | **R1,080,000** | |

### 7. Team (R55,000/month)

| Role | Type | Monthly | Annual | Responsibility |
|:-----|:-----|--------:|-------:|:---------------|
| Customer Success Manager | Contract | R25,000 | R300,000 | Onboarding, retention |
| Technical Support | Part-time | R15,000 | R180,000 | User support, bug triage |
| Video Content Creator | Part-time | R10,000 | R120,000 | Demo videos, product walkthroughs, social content |
| Marketing Content Writer | Part-time | R5,000 | R60,000 | LinkedIn posts, scripts, marketing copy |
| **Subtotal** | | **R55,000** | **R660,000** | |

### 8. Office & Admin (R8,000/month)

| Item | Monthly | Annual |
|:-----|--------:|-------:|
| Co-working space | R5,000 | R60,000 |
| Legal services | R1,500 | R18,000 |
| Accounting services | R1,500 | R18,000 |
| **Subtotal** | **R8,000** | **R96,000** | |

*Note: Communication tools (video conferencing, messaging) are built into SiyaBusa ERP's Communications Hub module — no external tools required.*

### 9. Contingency (R27,500/month)

| Purpose | Monthly | Annual |
|:--------|--------:|-------:|
| Unexpected AWS scaling | R15,000 | R180,000 |
| Emergency support | R7,500 | R90,000 |
| Opportunity fund | R5,000 | R60,000 |
| **Subtotal** | **R27,500** | **R330,000** | |

---

## Monthly Total Breakdown

| Category | Monthly | Annual | % |
|:---------|--------:|-------:|--:|
| AWS Infrastructure | R15,000 | R180,000 | 6.3% |
| Third-Party Services | R13,000 | R156,000 | 5.5% |
| Development Tools | R7,500 | R90,000 | 3.2% |
| Security & Compliance | R4,500 | R54,000 | 1.9% |
| Domains & Misc | R500 | R6,000 | 0.2% |
| Marketing | R90,000 | R1,080,000 | 37.9% |
| Team | R55,000 | R660,000 | 23.2% |
| Office & Admin | R8,000 | R96,000 | 3.4% |
| Contingency | R27,500 | R330,000 | 11.6% |
| **TOTAL** | **R221,500** | **R2,658,000** | **93.3%** |
| **Reserve (held back)** | N/A | **R192,000** | **6.7%** |
| **GRAND TOTAL** | | **R2,850,000** | **100%** |

*Note: No external communication tools budgeted — SiyaBusa ERP includes built-in video conferencing (Daily.co powered) and messaging.*

---

## Cash Flow Projection

| Month | Operating | Marketing | Total Burn | Cumulative | Remaining |
|:------|----------:|----------:|-----------:|-----------:|----------:|
| Jan | R90,000 | R90,000 | R180,000 | R180,000 | R2,670,000 |
| Feb | R90,000 | R90,000 | R180,000 | R360,000 | R2,490,000 |
| Mar | R90,000 | R90,000 | R180,000 | R540,000 | R2,310,000 |
| Apr | R95,000 | R100,000 | R195,000 | R735,000 | R2,115,000 |
| May | R95,000 | R100,000 | R195,000 | R930,000 | R1,920,000 |
| Jun | R100,000 | R100,000 | R200,000 | R1,130,000 | R1,720,000 |
| Jul | R100,000 | R90,000 | R190,000 | R1,320,000 | R1,530,000 |
| Aug | R100,000 | R90,000 | R190,000 | R1,510,000 | R1,340,000 |
| Sep | R105,000 | R80,000 | R185,000 | R1,695,000 | R1,155,000 |
| Oct | R105,000 | R80,000 | R185,000 | R1,880,000 | R970,000 |
| Nov | R110,000 | R80,000 | R190,000 | R2,070,000 | R780,000 |
| Dec | R110,000 | R80,000 | R190,000 | R2,260,000 | R590,000 |

**Note:** R590,000 remaining at month 12 = 3+ months additional runway

---

## Revenue Impact on Burn

| Month | Customers | MRR | Net Burn |
|:------|----------:|----:|:---------|
| Oct 2026 | 15 | R90,000 | R100,000 |
| Nov 2026 | 20 | R130,000 | R60,000 |
| Dec 2026 | 25 | R170,000 | R20,000 |
| Jan 2027 | 32 | R220,000 | **Cash positive** |

**Break-even:** ~28 customers at R8,000 average MRR

---

## AWS Pricing Sources

All AWS prices based on eu-north-1 (Stockholm) region, current as of January 2026:

| Service | Instance | On-Demand | Reserved (1yr) |
|:--------|:---------|----------:|---------------:|
| EC2 t3.medium | 2 vCPU, 4GB | $0.0416/hr | $0.026/hr |
| EC2 t3.small | 2 vCPU, 2GB | $0.0208/hr | $0.013/hr |
| RDS db.t3.medium | 2 vCPU, 4GB | $0.068/hr | $0.043/hr |
| ElastiCache cache.t3.micro | 2 vCPU, 0.5GB | $0.017/hr | $0.011/hr |
| S3 | Standard | $0.023/GB | - |
| CloudFront | Data out | $0.085/GB | - |

*Exchange rate assumed: R19 = $1 USD*

---

## Key Assumptions

1. **No full-time salaries in Year 1** — Founders work without salary, team is contractors
2. **Marketing front-loaded** — Heavy investment Q1-Q2 to build pipeline
3. **Revenue starts Q4 2026** — 9-month dependency building period
4. **Conservative customer growth** — 5 beta → 25 paying in 12 months
5. **Average contract value** — R8,000-R12,000/month

---

<div align="center">

*This budget is designed for transparency and accountability.*  
*All figures are estimates based on current pricing and may be adjusted.*

</div>
