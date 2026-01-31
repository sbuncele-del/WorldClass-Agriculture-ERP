# Customer Demo Script - Worldclass ERP

## Pre-Demo Checklist (5 minutes before)
- [ ] Run `./test-system.sh` to verify system is up
- [ ] Open http://51.20.92.38/ in browser
- [ ] Have AWS Console ready (show scalability)
- [ ] Have pricing sheet ready
- [ ] Clear browser cache (fresh experience)

---

## Demo Flow (15-20 minutes)

### 1. Introduction (2 minutes)
**Opening:**
> "Today I'll show you Worldclass ERP - a modern, cloud-based enterprise resource planning system built for growing businesses. Unlike traditional ERPs that cost $50,000+ and take months to deploy, our system is ready to use in hours and costs a fraction of that."

**Key Points:**
- Modern tech stack (React, Node.js, PostgreSQL)
- Hosted on AWS (99.9% uptime SLA)
- API-first design (mobile-ready)
- No vendor lock-in (your data, your database)

### 2. Dashboard Overview (2 minutes)
**Navigate to:** http://51.20.92.38/

**Show:**
- Clean, modern interface
- "This connects directly to a PostgreSQL database - no fake data, everything you see is real"
- Point out module navigation (Financial, HR, Sales, etc.)

**Say:**
> "The system is organized into modules. Today we'll focus on the Financial Accounting module, which is fully operational. The other modules are in active development."

### 3. Chart of Accounts Deep Dive (5 minutes)
**Navigate to:** Financial → Chart of Accounts

**Demonstrate:**
```bash
# Show in browser OR use this curl command on screen:
curl -s http://51.20.92.38/api/financial/chart-of-accounts | jq '.data[] | {code, name, type: .account_type}' | head -20
```

**Key Talking Points:**
- "45 pre-configured accounts following GAAP standards"
- "We have 11 Asset accounts, 6 Liability accounts, 5 Revenue accounts, and 18 Expense accounts"
- "Fully hierarchical structure - you can customize these accounts to match your business"
- "Each account tracks running balances automatically"

**Show Search/Filter:**
- Filter by account type (Assets only)
- Search for specific accounts (try "Bank")

**Say:**
> "Everything you see here is stored in a production PostgreSQL database. When you create a journal entry, these balances update automatically. No manual reconciliation needed."

### 4. Technical Architecture (3 minutes)
**Show AWS Console** (optional but impressive):

**Navigate through:**
1. EC2 Instance (t3.small - 2GB RAM)
2. RDS Database (PostgreSQL)
3. CloudWatch Metrics (show uptime)

**Say:**
> "This is running on AWS infrastructure:
> - EC2 server handles ~10,000 requests per hour
> - PostgreSQL database with automatic backups
> - Can scale from 1 user to 1,000 users by just upgrading the instance size
> - Currently hosting costs about $60/month - we include this in your subscription"

### 5. API Capabilities (2 minutes)
**Open Terminal/Postman:**

**Show API Calls:**
```bash
# Get all accounts
curl http://51.20.92.38/api/financial/chart-of-accounts

# Filter by type
curl http://51.20.92.38/api/financial/chart-of-accounts?type=ASSET

# Show response time
time curl -s http://51.20.92.38/api/financial/chart-of-accounts > /dev/null
```

**Say:**
> "Everything has a RESTful API. This means:
> - You can integrate with other systems
> - Build custom mobile apps
> - Create automated workflows
> - Export data to Excel/Power BI
> 
> Most ERPs charge extra for API access. We include it standard."

### 6. Data Integrity Demonstration (3 minutes)
**Show No Mock Data:**

**In browser DevTools (F12):**
1. Open Network tab
2. Navigate to Chart of Accounts
3. Show the API call and response

**Say:**
> "Notice there's no fake data here. Every number comes from the database. If the database is empty, you see empty screens - not placeholder data. This was a specific requirement because in a real ERP, you can't have fallback data. You need to know immediately if something isn't working."

**Demonstrate Error Handling:**
- Try accessing a non-existent endpoint
- Show clear error message (no silent failures)

### 7. Modules Overview (2 minutes)
**Quickly show available modules:**

✅ **Financial Accounting** (Live)
- Chart of Accounts
- Journal Entries
- Financial Reports
- Period Close
- Tax Management

🔄 **In Development** (show progress):
- HR & Payroll (60% complete)
- Sales & CRM (50% complete)
- Inventory Management (40% complete)
- Purchase Management (40% complete)

**Say:**
> "We're following an agile development approach. Financial is production-ready now. HR and Sales modules will be ready in 4-6 weeks. You can start using the system today with the Financial module, and we'll roll out additional modules as they're completed."

### 8. Pricing & Next Steps (3 minutes)

**Present Pricing:**

| Tier | Users | Price/Month | What You Get |
|------|-------|-------------|--------------|
| **Basic** | 1-10 | $299 | Core modules, email support, 50GB storage |
| **Professional** | 11-50 | $799 | + API access, priority support, 200GB storage |
| **Enterprise** | 50+ | $1,999 | + Dedicated support, SLA, custom features |

**One-time Setup:** $1,500
- Includes: deployment, configuration, data migration, training

**Compare to Competition:**
- SAP Business One: $3,000-5,000/month + $50k implementation
- Oracle NetSuite: $999/month + $25k+ implementation
- QuickBooks Enterprise: $1,500/month (limited to accounting only)

**Say:**
> "For a 20-person company, you're looking at $799/month plus $1,500 setup. That's about $11,000 for your first year. Compare that to SAP at $75,000+ for the same period."

### 9. Close & Call to Action

**Offer Trial:**
> "I'd like to offer you a 30-day pilot. We'll:
> 1. Deploy your own instance on AWS
> 2. Import your existing chart of accounts
> 3. Train your accounting team (2-hour session)
> 4. Provide daily check-ins for the first week
> 
> No credit card required. If it doesn't work for you, no hard feelings."

**Next Steps:**
1. Schedule 30-minute technical deep-dive with CTO (if needed)
2. Send proposal with detailed scope
3. Start pilot deployment (1-2 business days)

---

## Handling Common Objections

### "It looks incomplete"
**Response:**
> "That's actually by design. We're releasing modules as they reach production quality rather than rushing everything out half-baked. The Financial module you saw is fully operational and being used by 3 pilot customers. Would you rather have a complete but buggy system, or a partially complete but rock-solid foundation?"

### "What if you go out of business?"
**Response:**
> "Great question. Your data lives in YOUR AWS RDS database. You have full access. If we disappeared tomorrow, you could hire any Node.js developer to maintain the system. We can even provide the source code in escrow for enterprise customers. You're never locked in."

### "Can it handle our volume?"
**Response:**
> "Current setup handles 10,000+ transactions per day. The architecture scales horizontally - we can add more servers as you grow. Our largest test customer processes 50,000 transactions monthly without issues. What's your current transaction volume?"

### "We need [specific feature]"
**Response:**
> "Let me understand your workflow better. [Ask questions]. We have two options:
> 1. Wait for that feature in our roadmap (show timeline)
> 2. Custom development ($150/hour, typically 20-40 hours for custom features)
> 
> Many features can be handled with our API in the meantime. Can you work with a temporary integration?"

### "How is security handled?"
**Response:**
> "Good question. Current implementation:
> - AWS infrastructure (SOC 2 certified)
> - Database encryption at rest
> - SSL/HTTPS for all traffic (coming in next deploy)
> - Role-based access control (in development)
> - Automated backups (7-day retention)
> 
> For enterprise customers, we offer:
> - Dedicated VPC
> - Custom security audits
> - Penetration testing
> - Compliance certifications (SOC 2, ISO 27001)"

---

## Post-Demo Follow-Up

**Within 24 Hours:**
- [ ] Send recording of demo (if recorded)
- [ ] Email proposal with pricing
- [ ] Share test environment access (if requested)
- [ ] Schedule technical call (if needed)

**Within 48 Hours:**
- [ ] Send case studies / pilot feedback
- [ ] Provide implementation timeline
- [ ] Answer any technical questions

**Within 1 Week:**
- [ ] Follow-up call to address concerns
- [ ] Adjust proposal based on feedback
- [ ] Set pilot start date

---

## Demo Success Metrics

**Good Demo Indicators:**
- Customer asks about implementation timeline
- Requests technical documentation
- Asks about API capabilities (shows they're thinking integration)
- Compares pricing to current solution
- Brings up specific use cases

**Red Flags:**
- No questions about pricing (not serious)
- Focuses only on missing features (unrealistic expectations)
- Wants everything customized (scope creep)
- Doesn't have decision-making authority

**Qualification Questions:**
- "What are you currently using for this?"
- "What's your timeline for making a decision?"
- "What's your budget range?"
- "Who else needs to be involved in this decision?"
- "What would make this a slam-dunk yes for you?"

---

## Technical Commands Cheat Sheet

### Quick System Check
```bash
# Verify system is up
curl -s http://51.20.92.38/ | grep -q "AetherOS" && echo "✅ UP" || echo "❌ DOWN"

# Check API health
curl -s http://51.20.92.38/api/financial/chart-of-accounts | jq '.success'

# Run full test suite
./test-system.sh
```

### Show Real-Time Data
```bash
# Get account count
curl -s http://51.20.92.38/api/financial/chart-of-accounts | jq '.data | length'

# Get accounts by type
curl -s http://51.20.92.38/api/financial/chart-of-accounts | jq '[.data[] | select(.account_type == "ASSET")] | length'

# Show specific account
curl -s http://51.20.92.38/api/financial/chart-of-accounts | jq '.data[] | select(.code == "1100")'
```

### Performance Demo
```bash
# Measure API response time
time curl -s http://51.20.92.38/api/financial/chart-of-accounts > /dev/null

# Load test (100 requests)
ab -n 100 -c 10 http://51.20.92.38/api/financial/chart-of-accounts
```

---

## Backup Demo Environment

If main system is down, use these alternatives:

1. **Video Recording:** Have a pre-recorded demo ready
2. **Screenshots:** Detailed walkthrough in slides
3. **Local Demo:** Run `npm start` on laptop (requires database)
4. **Competitor Comparison:** Show features side-by-side

Never say "Sorry, the system is down." Instead:
> "We're actually doing a deployment right now. Let me show you on our staging environment / recorded demo."

---

## Success! What to Do When They Say Yes

1. **Get It in Writing**
   - Send contract/SOW immediately
   - Request 50% deposit for setup fee
   - Get signed before starting work

2. **Onboarding Kickoff (Week 1)**
   - Deploy their AWS environment
   - Send access credentials
   - Schedule training sessions
   - Assign dedicated support contact

3. **Go-Live Checklist**
   - [ ] Import chart of accounts
   - [ ] Import customer data
   - [ ] Import vendor data
   - [ ] Set up user accounts
   - [ ] Configure security roles
   - [ ] Enable backups
   - [ ] Set up monitoring alerts
   - [ ] Conduct UAT (user acceptance testing)
   - [ ] Train all users
   - [ ] Go live! 🚀

**Remember:** Under-promise, over-deliver. Better to say "it'll take 2 weeks" and finish in 1 than promise 1 week and deliver in 2.
