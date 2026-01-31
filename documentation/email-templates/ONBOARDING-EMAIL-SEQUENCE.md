# SiyaBusa ERP - Automated Onboarding Email Sequence

## Complete Email Drip Campaign for New Users

---

## Sequence Overview

### Campaign Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEW USER ONBOARDING SEQUENCE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TRIGGER: New user account created                                   │
│                                                                      │
│  Day 0 ────► Email 1: Welcome + Login Instructions                  │
│     │                                                                │
│  Day 1 ────► Email 2: Getting Started Guide                         │
│     │                                                                │
│  Day 3 ────► Email 3: Your Module Deep Dive                         │
│     │                                                                │
│  Day 5 ────► Email 4: Tips & Shortcuts                              │
│     │                                                                │
│  Day 7 ────► Email 5: Check-In + Support Resources                  │
│     │                                                                │
│  Day 14 ───► Email 6: Advanced Features                             │
│     │                                                                │
│  Day 21 ───► Email 7: Certification Invitation                      │
│     │                                                                │
│  Day 30 ───► Email 8: Feedback Survey                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Automation Rules

| Trigger | Action | Condition |
|:--------|:-------|:----------|
| Account created | Start sequence | All new users |
| Email opened | Tag as "engaged" | Any email opened |
| Link clicked | Tag with topic | Track interests |
| No opens (3 emails) | Alert admin | Low engagement |
| Certification completed | End sequence early | Goal achieved |

---

## EMAIL 1: Welcome Email

**Trigger:** Immediately upon account creation  
**Subject Line Options:**
- "Welcome to SiyaBusa, {{first_name}}! 🎉"
- "You're in! Here's how to get started with SiyaBusa"
- "{{first_name}}, your SiyaBusa account is ready"

**From:** Sibusiso Mavuso <sibusiso@siyabusa.co.za>  
**Reply-To:** support@siyabusa.co.za

---

### Email Body

```html
Hi {{first_name}},

Welcome to SiyaBusa ERP! 🎉

Your account has been created and you're ready to go. Here's everything you need to get started:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 YOUR LOGIN DETAILS

Login URL: {{company_url}}
Email: {{user_email}}
Temporary Password: {{temp_password}}

(You'll be asked to change this on first login)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 QUICK START (5 minutes)

1. Click the login URL above
2. Enter your email and temporary password
3. Create your new password
4. Complete your profile
5. Explore the dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 BOOKMARK FOR EASY ACCESS

Add SiyaBusa to your browser bookmarks or home screen for quick access anytime.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Reply to this email or call us at +27 74 012 6873.

Welcome aboard!

Sibusiso Mavuso
CEO & Founder, SiyaBusa ERP

P.S. Tomorrow I'll send you our Getting Started Guide with step-by-step instructions for your first week.
```

---

### Variables Required

| Variable | Source | Example |
|:---------|:-------|:--------|
| `{{first_name}}` | User record | Thabo |
| `{{user_email}}` | User record | thabo@company.co.za |
| `{{temp_password}}` | Generated | Abc123!@# |
| `{{company_url}}` | Tenant config | erp.company.co.za |
| `{{company_name}}` | Tenant config | ABC Trading |

---

## EMAIL 2: Getting Started Guide

**Trigger:** 1 day after Email 1  
**Subject Line Options:**
- "Your first day with SiyaBusa - what to do"
- "{{first_name}}, here's your Getting Started Guide"
- "Day 1: Let's make you a SiyaBusa pro"

---

### Email Body

```html
Hi {{first_name}},

How was your first login? 

Today, I want to share our Getting Started Guide - a simple roadmap for your first week with SiyaBusa.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 YOUR FIRST WEEK CHECKLIST

Day 1 (Today):
☐ Log in and change your password
☐ Complete your profile
☐ Explore the dashboard

Day 2-3:
☐ Navigate to your primary module
☐ View some existing records
☐ Create a test record

Day 4-5:
☐ Run your first report
☐ Export data to Excel
☐ Complete the training quiz

[Download the Full Checklist →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎥 5-MINUTE VIDEO TOUR

Haven't explored yet? Watch our quick video tour:

[Watch the Demo Video →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 PRO TIP

Use Ctrl + / (or Cmd + / on Mac) to open the quick search bar from anywhere in SiyaBusa. It's the fastest way to find anything!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions? Hit reply - I read every email.

Sibusiso

P.S. In a couple of days, I'll send you a deep dive into {{primary_module}} - the module you'll use most.
```

---

## EMAIL 3: Module Deep Dive

**Trigger:** 3 days after Email 1  
**Subject Line Options:**
- "Master {{primary_module}} in 15 minutes"
- "{{first_name}}, let's dive into {{primary_module}}"
- "Your guide to {{primary_module}} is here"

**Dynamic Content:** This email changes based on the user's primary module.

---

### Email Body (Financial Module Version)

```html
Hi {{first_name}},

Today, let's master the Financial Module - where you'll spend most of your time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FINANCIAL MODULE OVERVIEW

What you can do:
• Record journal entries
• Manage accounts payable & receivable
• Reconcile bank accounts
• Run financial reports (TB, P&L, Balance Sheet)
• Track budgets vs actuals

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 TRY THESE TODAY

1. VIEW THE CHART OF ACCOUNTS
   Navigate: Financial → Setup → Chart of Accounts
   See how your accounts are organized.

2. RUN A TRIAL BALANCE
   Navigate: Financial → Reports → Trial Balance
   Select the current period and click "Generate"

3. CHECK BANK BALANCES
   Navigate: Financial → Banking → Bank Accounts
   View all connected bank accounts at a glance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📹 TRAINING VIDEO

Watch: "Financial Module Essentials" (12 min)
[Watch Training Video →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 DOWNLOADABLE GUIDE

Get the complete Financial Module User Guide:
[Download PDF Guide →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're doing great! Keep exploring.

Sibusiso
```

---

### Module Variations

Create separate versions for each module:

| Module | Focus Areas |
|:-------|:------------|
| **Financial** | GL, AP, AR, Bank Rec, Reports |
| **HR & Payroll** | Employees, Leave, Payrun, IRP5 |
| **Inventory** | Products, Stock, Transfers, Counts |
| **Sales & CRM** | Customers, Quotes, Orders, Pipeline |
| **Purchasing** | Suppliers, POs, Receiving |
| **Manufacturing** | BOMs, Work Orders, Production |
| **Compliance** | SARS Sentinel, Audit Shield |

---

## EMAIL 4: Tips & Shortcuts

**Trigger:** 5 days after Email 1  
**Subject Line Options:**
- "10 SiyaBusa shortcuts that will save you hours"
- "{{first_name}}, work smarter with these tips"
- "Secret features most users don't know about"

---

### Email Body

```html
Hi {{first_name}},

After 5 days, you're getting comfortable with SiyaBusa. Now let's make you faster.

Here are 10 tips that power users swear by:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⌨️ KEYBOARD SHORTCUTS

1. Ctrl + / → Quick search (find anything instantly)
2. Ctrl + N → Create new record
3. Ctrl + S → Save current record
4. Ctrl + P → Print/Export current view
5. Esc → Close dialog or cancel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 POWER USER TIPS

6. SAVED FILTERS
   Create custom filters and save them for one-click access to common views.

7. DASHBOARD CUSTOMIZATION
   Drag and drop widgets to create your perfect dashboard.

8. BULK ACTIONS
   Select multiple records and apply actions (export, delete, update) in one click.

9. QUICK ENTRY MODE
   Tab through fields faster with Quick Entry in data-heavy screens.

10. EMAIL FROM ANYWHERE
    Click any email address to send directly from SiyaBusa.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CHALLENGE

Try using keyboard shortcuts for an entire day. Most users report saving 30+ minutes daily!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Download the Shortcuts Cheat Sheet →]

Keep crushing it!

Sibusiso
```

---

## EMAIL 5: Check-In + Support

**Trigger:** 7 days after Email 1  
**Subject Line Options:**
- "How's your first week going, {{first_name}}?"
- "Quick check-in from SiyaBusa"
- "{{first_name}}, any questions so far?"

---

### Email Body

```html
Hi {{first_name}},

It's been a week since you started with SiyaBusa. How's it going?

I wanted to personally check in and make sure you have everything you need.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤔 COMMON QUESTIONS AT THIS STAGE

"How do I reset my password?"
→ Profile icon (top right) → Settings → Change Password

"Where do I find historical data?"
→ Use date filters on any list view, or check Reports

"Can I undo a mistake?"
→ Most records have an audit trail - contact support for reversals

"How do I get help?"
→ See below!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆘 SUPPORT OPTIONS

📚 Knowledge Base: help.siyabusa.co.za
   Search hundreds of articles and guides

💬 Live Chat: Click the chat bubble in SiyaBusa
   Mon-Fri, 8am-5pm SAST

📧 Email: support@siyabusa.co.za
   We respond within 4 hours

📞 Phone: +27 74 012 6873
   For urgent issues

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 YOUR PROGRESS

{{progress_stats}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hit reply if you have ANY questions. I'm here to help.

Sibusiso
```

---

### Dynamic Progress Stats

Generate based on user activity:

```
You've logged in: 5 times
Records created: 12
Reports generated: 3
Training progress: 40% complete
```

---

## EMAIL 6: Advanced Features

**Trigger:** 14 days after Email 1  
**Subject Line Options:**
- "Ready for the advanced stuff, {{first_name}}?"
- "Unlock SiyaBusa's hidden power features"
- "Level up: Advanced features you should know"

---

### Email Body

```html
Hi {{first_name}},

Two weeks in - you've got the basics down. Ready to level up?

Here are advanced features that separate casual users from power users:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 ADVANCED FEATURES

1. CUSTOM REPORTS
   Build exactly the report you need with our drag-and-drop report builder.
   Navigate: Reports → Custom Reports → New

2. AUTOMATED WORKFLOWS
   Set up automatic actions like:
   • Email alerts when stock is low
   • Approval reminders
   • Scheduled report delivery
   Navigate: Settings → Automation → Workflows

3. AI ASSISTANTS
   Ask questions in natural language:
   "Show me sales for the last quarter"
   "Which customers are overdue?"
   Click the AI icon (🤖) in the header.

4. SARS SENTINEL
   If you handle SARS correspondence:
   • Auto-classify any SARS letter
   • Track all deadlines
   • Generate responses
   Navigate: Compliance → SARS Sentinel

5. AUDIT SHIELD
   Stay audit-ready year-round:
   • Pre-built compliance checklists
   • Evidence management
   • Auditor portal
   Navigate: Compliance → Audit Shield

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📹 ADVANCED TRAINING

Watch: "Advanced Features Masterclass" (25 min)
[Watch Now →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Which feature interests you most? Reply and let me know!

Sibusiso
```

---

## EMAIL 7: Certification Invitation

**Trigger:** 21 days after Email 1  
**Subject Line Options:**
- "Get certified in SiyaBusa, {{first_name}}"
- "Your certification is waiting"
- "Become a certified SiyaBusa user"

---

### Email Body

```html
Hi {{first_name}},

You've been using SiyaBusa for 3 weeks now. Ready to make it official?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 GET CERTIFIED

Our certification program validates your SiyaBusa expertise:

BRONZE CERTIFICATE
• Complete: End User Training
• Pass: Basic Assessment (80%+)
• Time: ~1 hour

SILVER CERTIFICATE  
• Complete: Bronze + Module Training
• Pass: Module Assessment (80%+)
• Time: ~2 hours

GOLD CERTIFICATE
• Complete: Silver + Advanced Training
• Pass: Advanced Assessment (80%+)
• Time: ~4 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ BENEFITS

• Digital certificate for your LinkedIn
• Priority support access
• Early access to new features
• Recognition in our certified users directory

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Start Your Certification →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your current progress: {{training_completion}}%
Estimated time to Bronze: {{time_to_bronze}}

You're almost there!

Sibusiso
```

---

## EMAIL 8: Feedback Survey

**Trigger:** 30 days after Email 1  
**Subject Line Options:**
- "How are we doing, {{first_name}}? (2-min survey)"
- "Your feedback shapes SiyaBusa's future"
- "30 days in - we'd love your thoughts"

---

### Email Body

```html
Hi {{first_name}},

It's been a month since you joined SiyaBusa. Congratulations on completing your onboarding! 🎉

I'd love to hear how we're doing. Could you spare 2 minutes?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 QUICK SURVEY (2 minutes)

Your feedback directly influences what we build next.

[Take the Survey →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎁 AS A THANK YOU

Complete the survey and get:
• Early access to our next major feature
• Entry into our monthly R1,000 gift card draw

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 YOUR 30-DAY STATS

Logins: {{login_count}}
Records created: {{records_created}}
Reports generated: {{reports_generated}}
Time saved (estimated): {{time_saved}} hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for being part of the SiyaBusa community. We're building this for you.

Sibusiso

P.S. This is the last email in our onboarding sequence, but I'm always here. Hit reply anytime you need anything.
```

---

## Implementation Guide

### Email Platform Setup

**Recommended Platforms:**
- Mailchimp (good for starters)
- SendGrid (developer-friendly)
- Customer.io (advanced automation)
- HubSpot (full CRM integration)

### Automation Triggers

```javascript
// Pseudo-code for automation triggers

// When new user is created
onUserCreated(user) {
  // Start onboarding sequence
  emailSequence.start({
    userId: user.id,
    sequence: 'onboarding',
    variables: {
      first_name: user.firstName,
      user_email: user.email,
      company_url: user.tenant.url,
      company_name: user.tenant.name,
      primary_module: user.primaryModule,
      temp_password: generateTempPassword()
    }
  });
}

// Daily scheduler for sequence emails
dailyScheduler() {
  // Email 2: Day 1
  sendScheduledEmails('onboarding_day_1');
  
  // Email 3: Day 3
  sendScheduledEmails('onboarding_day_3');
  
  // Continue for all emails...
}

// Track engagement
onEmailOpened(email, user) {
  tagUser(user, 'engaged');
  trackEvent('email_opened', { email: email.id });
}

onLinkClicked(link, email, user) {
  tagUser(user, link.topic);
  trackEvent('link_clicked', { email: email.id, link: link.id });
}
```

### API Integration

```javascript
// SiyaBusa Backend Integration

// POST /api/v2/email/trigger
{
  "event": "user_created",
  "user_id": "usr_123",
  "data": {
    "first_name": "Thabo",
    "email": "thabo@company.co.za",
    "tenant_id": "tnt_456",
    "primary_module": "financial"
  }
}

// Webhook for email events
// POST /api/v2/webhooks/email
{
  "event": "email_opened",
  "email_id": "onboarding_welcome",
  "user_id": "usr_123",
  "timestamp": "2026-01-03T10:30:00Z"
}
```

---

## Metrics to Track

| Metric | Target | How to Measure |
|:-------|:-------|:---------------|
| Open rate | >40% | Email platform |
| Click rate | >15% | Email platform |
| Completion rate | >70% | Finish all 8 emails |
| Login after email | >80% | App analytics |
| Certification rate | >30% | LMS tracking |
| Support tickets | <2 per user | Help desk |

---

## A/B Testing Plan

### Test 1: Subject Lines
- Test welcome email subject lines
- Run for 2 weeks, 50/50 split
- Measure open rate

### Test 2: Send Times
- Test 8am vs 10am vs 2pm
- Run for 1 month
- Measure open rate + click rate

### Test 3: Email Length
- Test short vs detailed versions
- Run for 1 month
- Measure click rate + completion rate

---

**Document:** Onboarding Email Sequence v1.0  
**Last Updated:** January 2026  
**Owner:** Masaphokati Technologies (Pty) Ltd
