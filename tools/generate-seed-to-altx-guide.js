#!/usr/bin/env node

/**
 * Seed to AltX - Practical Funding & Listing Guide
 * For Early-Stage Companies (Pre-Revenue)
 * Follows Masaphokati Technologies PDF Document Design Standard
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');

        @page { size: A4; margin: 20mm 20mm 25mm 20mm; }
        * { box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            margin: 0;
            padding: 0;
            font-size: 14px;
        }

        /* COVER PAGE */
        .cover-page {
            height: 250mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: 
                radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.4) 0%, transparent 20%),
                radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.4) 0%, transparent 20%),
                linear-gradient(135deg, #020617 0%, #1e3a8a 50%, #172554 100%);
            margin: -20mm -20mm 0 -20mm;
            padding: 20mm;
            page-break-after: always;
            color: white;
            position: relative;
            overflow: hidden;
        }

        .cover-page::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: 
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            pointer-events: none;
        }

        .cover-content {
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(12px);
            padding: 60px;
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-width: 80%;
            position: relative;
            z-index: 10;
        }

        .cover-logo { font-size: 48px; font-weight: 800; color: #ffffff; margin-bottom: 10px; }
        .cover-title { font-size: 28px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
        .cover-subtitle { font-size: 16px; font-weight: 400; color: #bfdbfe; margin-bottom: 40px; }
        .cover-company { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 20px; }

        .cover-info {
            margin-top: 25px;
            padding: 20px 30px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            text-align: left;
            display: inline-block;
        }
        .cover-info .info-row { margin: 8px 0; font-size: 14px; color: #e0f2fe; }
        .cover-info .info-label { font-weight: 600; color: #93c5fd; }
        .cover-info .info-value { color: #ffffff; }
        .cover-tagline {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 12px;
            color: #93c5fd;
            font-weight: 400;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        /* CONTENT STYLES */
        h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-top: 40px; font-size: 24px; font-weight: 700; }
        h1:first-of-type { margin-top: 0; }
        h2 { color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 30px; font-size: 20px; font-weight: 700; }
        h3 { color: #3730a3; margin-top: 25px; font-size: 16px; font-weight: 700; }
        h4 { color: #4338ca; margin-top: 20px; font-size: 14px; font-weight: 600; }

        .intro-box {
            background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
            border-left: 4px solid #1e3a8a;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 0 8px 8px 0;
        }
        .intro-title { font-weight: 700; color: #1e3a8a; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; }
        .intro-text { color: #4b5563; font-size: 14px; margin: 0; }

        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; page-break-inside: avoid; }
        th { background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%); color: white; padding: 12px 10px; text-align: left; font-weight: 600; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background-color: #f8fafc; }

        ul, ol { margin: 15px 0; padding-left: 25px; }
        li { margin: 8px 0; }

        .highlight-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .highlight-box h3 { color: #b45309; margin-top: 0; }

        .action-box {
            background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%);
            border: 2px solid #10b981;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .action-box h3 { color: #059669; margin-top: 0; }

        .warning-box {
            background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
            border: 2px solid #ef4444;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .warning-box h3 { color: #dc2626; margin-top: 0; }

        .timeline-visual {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-family: 'Consolas', monospace;
            font-size: 11px;
            white-space: pre;
        }

        blockquote {
            border-left: 4px solid #7c3aed;
            margin: 20px 0;
            padding: 15px 20px;
            background-color: #faf5ff;
            border-radius: 0 8px 8px 0;
            font-style: italic;
        }

        hr { border: none; border-top: 2px solid #e5e7eb; margin: 30px 0; }
        strong { color: #1e3a8a; }

        .example-box {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            font-size: 13px;
        }

        .step-number {
            display: inline-block;
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
            color: white;
            border-radius: 50%;
            text-align: center;
            line-height: 28px;
            font-weight: 700;
            margin-right: 10px;
        }

        .checklist { list-style: none; padding-left: 0; }
        .checklist li { padding-left: 28px; position: relative; margin: 10px 0; }
        .checklist li::before { content: '☐'; position: absolute; left: 0; color: #1e3a8a; font-size: 16px; }

        .math-box {
            background: #1e293b;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Consolas', monospace;
            font-size: 13px;
            margin: 15px 0;
        }

        .founder-highlight {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin: 20px 0;
        }
        .founder-highlight h3 { color: #fcd34d; margin-top: 0; }
        .founder-highlight ul { color: white; }
    </style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover-page">
    <div class="cover-content">
        <div class="cover-logo">SiyaBusa ERP</div>
        <div class="cover-title">Seed to AltX: Practical Funding Guide</div>
        <div class="cover-subtitle">From R2 Million Seed Round to JSE AltX Listing</div>
        <div class="cover-company">Masaphokati Technologies (Pty) Ltd</div>
        
        <div class="cover-info">
            <div class="info-row"><span class="info-label">Document Version:</span> <span class="info-value">1.0</span></div>
            <div class="info-row"><span class="info-label">Effective Date:</span> <span class="info-value">January 2026</span></div>
            <div class="info-row"><span class="info-label">Current Stage:</span> <span class="info-value">Pre-Revenue / Product Complete</span></div>
            <div class="info-row"><span class="info-label">Classification:</span> <span class="info-value">Confidential - Founders Only</span></div>
        </div>
        
        <div class="cover-tagline">We Rule. We Govern. We Empower.</div>
    </div>
</div>

<!-- YOUR CURRENT REALITY -->
<h1>Your Current Reality</h1>

<div class="intro-box">
    <div class="intro-title">Where You Are Today</div>
    <p class="intro-text">Masaphokati Technologies is a newly registered Pty Ltd with a fully developed ERP product (SiyaBusa ERP). You have intellectual property but no revenue yet, no transactions, and no audited financials. This guide shows you exactly how to structure your R2 million seed round to position for AltX listing.</p>
</div>

<h2>Current Status Assessment</h2>

<table>
    <tr><th>Asset</th><th>Status</th><th>Value Indicator</th></tr>
    <tr><td>Company Registration</td><td>✅ Pty Ltd registered</td><td>Legal entity exists</td></tr>
    <tr><td>Product Development</td><td>✅ Complete</td><td>IP created - significant value</td></tr>
    <tr><td>Revenue</td><td>❌ None yet</td><td>Pre-revenue stage</td></tr>
    <tr><td>Customers</td><td>❌ None yet</td><td>Pre-customer stage</td></tr>
    <tr><td>Transactions</td><td>❌ None yet</td><td>No audit needed yet</td></tr>
    <tr><td>Bank Account</td><td>⚠️ Verify</td><td>Must have business account</td></tr>
    <tr><td>Team</td><td>Founder(s)</td><td>Key person value</td></tr>
</table>

<div class="highlight-box">
    <h3>💡 Key Insight: You Don't Need Auditors Yet</h3>
    <p>With no transactions, there's nothing to audit. You only need auditors once you have:</p>
    <ul>
        <li>Revenue coming in</li>
        <li>Expenses being paid</li>
        <li>A financial year to close</li>
    </ul>
    <p><strong>Action:</strong> Appoint auditors when you close your first financial year with transactions (likely end of 2026 after seed funding is deployed).</p>
</div>

<hr>

<!-- SHARE STRUCTURE EXPLAINED -->
<h1>Share Structure: How It Actually Works</h1>

<h2>The "60 Million Shares" Question</h2>

<p>You asked: "How do I have 60 million shares when I don't have R60 million?"</p>

<div class="action-box">
    <h3>✅ The Answer: Shares ≠ Cash</h3>
    <p>Share capital is about <strong>ownership units</strong>, not cash in the bank. Here's how it works:</p>
</div>

<h3>How Share Creation Works</h3>

<div class="example-box">
<strong>Example: Starting from Zero</strong>

Your MOI (Memorandum of Incorporation) authorizes shares. Let's say:
- Authorized shares: 1,000,000,000 (1 billion) - this costs nothing
- Par value: R0.0001 (one hundredth of a cent) - or no par value

To issue yourself 60,000,000 shares at R0.0001 par value:
- Cost = 60,000,000 × R0.0001 = <strong>R6,000</strong>

That's it. For R6,000, you own 60 million shares.
</div>

<h3>Real-World Practical Approach</h3>

<table>
    <tr><th>Approach</th><th>How It Works</th><th>Cost</th></tr>
    <tr><td><strong>No Par Value Shares</strong></td><td>Shares have no face value. Directors determine issue price.</td><td>R0 to issue to founders</td></tr>
    <tr><td><strong>Low Par Value</strong></td><td>E.g., R0.001 per share. 1 million shares = R1,000</td><td>Minimal</td></tr>
    <tr><td><strong>Sweat Equity</strong></td><td>Shares issued for services rendered (your development work)</td><td>R0 (you already "paid" with work)</td></tr>
</table>

<h2>Recommended Structure for Masaphokati</h2>

<div class="math-box">
AUTHORIZED SHARE CAPITAL
========================
Authorized Shares:     1,000,000,000 (1 billion)
Share Type:            Ordinary shares, no par value

INITIAL ISSUE (Founders)
========================
Shares to Founder(s):  100,000,000 (100 million)
Issue Price:           R0.00 (for sweat equity / development work)
Consideration:         Services rendered (IP development)

This gives you 100% ownership of 100 million shares.
No cash required.
</div>

<div style="page-break-before: always;"></div>

<!-- SEED ROUND STRUCTURE -->
<h1>Structuring Your R2 Million Seed Round</h1>

<h2>The Math: Pre-Money vs Post-Money Valuation</h2>

<div class="highlight-box">
    <h3>Key Terms to Understand</h3>
    <ul>
        <li><strong>Pre-Money Valuation:</strong> What your company is worth BEFORE new investment</li>
        <li><strong>Post-Money Valuation:</strong> Pre-Money + New Investment</li>
        <li><strong>Dilution:</strong> How much of your ownership % you give up</li>
    </ul>
</div>

<h3>Scenario: R2 Million Seed at R10 Million Pre-Money Valuation</h3>

<div class="math-box">
BEFORE INVESTMENT
=================
Pre-Money Valuation:    R10,000,000
Founder Shares:         100,000,000 shares (100%)
Price Per Share:        R10M ÷ 100M = R0.10

INVESTMENT
==========
Investment Amount:      R2,000,000
Price Per Share:        R0.10 (same as founders)
New Shares Issued:      R2M ÷ R0.10 = 20,000,000 shares

AFTER INVESTMENT
================
Post-Money Valuation:   R10M + R2M = R12,000,000
Total Shares:           100M + 20M = 120,000,000
Founder Ownership:      100M ÷ 120M = 83.33%
Investor Ownership:     20M ÷ 120M = 16.67%

✅ You raised R2 million
✅ You still own 83.33%
✅ Investors own 16.67%
</div>

<h3>Alternative Valuations</h3>

<table>
    <tr><th>Pre-Money Valuation</th><th>R2M Investment Gets</th><th>Founder Retains</th></tr>
    <tr><td>R5 million</td><td>28.57%</td><td>71.43%</td></tr>
    <tr><td>R8 million</td><td>20.00%</td><td>80.00%</td></tr>
    <tr><td><strong>R10 million</strong></td><td><strong>16.67%</strong></td><td><strong>83.33%</strong></td></tr>
    <tr><td>R15 million</td><td>11.76%</td><td>88.24%</td></tr>
    <tr><td>R20 million</td><td>9.09%</td><td>90.91%</td></tr>
</table>

<h2>Justifying Your Valuation</h2>

<p>Investors will ask: "Why is a pre-revenue company worth R10 million?"</p>

<h3>Your Value Drivers</h3>

<table>
    <tr><th>Value Component</th><th>Justification</th><th>Estimated Value</th></tr>
    <tr><td>Developed Software (IP)</td><td>Full ERP system, 400+ API endpoints, complete modules</td><td>R3-5 million</td></tr>
    <tr><td>Development Cost Avoided</td><td>Cost to build from scratch: 2-3 years, R5-10M</td><td>R5-10 million</td></tr>
    <tr><td>Market Opportunity</td><td>SA ERP market size, underserved SME segment</td><td>Strategic value</td></tr>
    <tr><td>Founder Expertise</td><td>Domain knowledge, vision, execution ability</td><td>Key person value</td></tr>
    <tr><td>First Mover Advantage</td><td>Ready to deploy while competitors still building</td><td>Time value</td></tr>
</table>

<div class="action-box">
    <h3>✅ Reasonable Seed Valuation Range: R8-15 million</h3>
    <p>For a complete product with no revenue, R10 million pre-money is defensible. This values your development work at roughly R100,000 per year of effort (if you spent 2-3 years building).</p>
</div>

<div style="page-break-before: always;"></div>

<!-- PRACTICAL STEPS TODAY -->
<h1>What To Do This Week</h1>

<div class="warning-box">
    <h3>🎯 Reality Check</h3>
    <p>You're pre-revenue with a complete product. Your immediate priority is:</p>
    <ol>
        <li><strong>Get your first customer</strong> (proves the product works)</li>
        <li><strong>Structure for investment</strong> (clean cap table)</li>
        <li><strong>Raise seed funding</strong> (R2 million target)</li>
    </ol>
    <p>Everything else follows from these three things.</p>
</div>

<h2>Step 1: Corporate Housekeeping (This Week)</h2>

<ul class="checklist">
    <li>Download CIPC documents (CM1, CM2, MOI) - verify all details</li>
    <li>Confirm company registration is active and compliant</li>
    <li>Ensure you have a business bank account (separate from personal)</li>
    <li>Document your shareholding (who owns what %)</li>
    <li>Confirm your registered address is current</li>
</ul>

<h2>Step 2: Document Your IP (This Week)</h2>

<ul class="checklist">
    <li>Create inventory of all software developed</li>
    <li>Document the modules and features completed</li>
    <li>Ensure all code is in company-owned repositories</li>
    <li>Confirm IP assignment (all work belongs to the company)</li>
    <li>Create screenshots/demo videos of the system</li>
</ul>

<h2>Step 3: Prepare Investment Materials (Next 2 Weeks)</h2>

<ul class="checklist">
    <li>Executive Summary (2 pages)</li>
    <li>Pitch Deck (10-15 slides)</li>
    <li>Financial Model (3-year projections)</li>
    <li>Product Demo (video or live)</li>
    <li>Term Sheet Template (what you're offering)</li>
</ul>

<h2>Step 4: Start Customer Conversations (Parallel)</h2>

<ul class="checklist">
    <li>Identify 5-10 potential pilot customers</li>
    <li>Offer free trials or heavily discounted pilots</li>
    <li>Get Letters of Intent (LOIs) if possible</li>
    <li>Collect testimonials from any beta users</li>
</ul>

<div style="page-break-before: always;"></div>

<!-- TERM SHEET TEMPLATE -->
<h1>Sample Term Sheet for R2 Million Seed Round</h1>

<div class="intro-box">
    <div class="intro-title">Investment Terms</div>
    <p class="intro-text">This is a template term sheet you can customize and present to potential investors.</p>
</div>

<table>
    <tr><th colspan="2" style="text-align: center;">TERM SHEET - MASAPHOKATI TECHNOLOGIES (PTY) LTD</th></tr>
    <tr><td><strong>Company</strong></td><td>Masaphokati Technologies (Pty) Ltd</td></tr>
    <tr><td><strong>Product</strong></td><td>SiyaBusa ERP - Complete Enterprise Resource Planning System</td></tr>
    <tr><td><strong>Round</strong></td><td>Seed Round</td></tr>
    <tr><td><strong>Amount Raising</strong></td><td>R2,000,000 (Two Million Rand)</td></tr>
    <tr><td><strong>Pre-Money Valuation</strong></td><td>R10,000,000</td></tr>
    <tr><td><strong>Post-Money Valuation</strong></td><td>R12,000,000</td></tr>
    <tr><td><strong>Security Type</strong></td><td>Ordinary Shares</td></tr>
    <tr><td><strong>Shares Offered</strong></td><td>20,000,000 shares (16.67% of post-money)</td></tr>
    <tr><td><strong>Price Per Share</strong></td><td>R0.10</td></tr>
    <tr><td><strong>Minimum Investment</strong></td><td>R100,000</td></tr>
</table>

<h3>Use of Funds</h3>
<table>
    <tr><th>Category</th><th>Amount</th><th>%</th></tr>
    <tr><td>Sales & Marketing</td><td>R800,000</td><td>40%</td></tr>
    <tr><td>Team Expansion</td><td>R600,000</td><td>30%</td></tr>
    <tr><td>Operations & Infrastructure</td><td>R300,000</td><td>15%</td></tr>
    <tr><td>Product Enhancement</td><td>R200,000</td><td>10%</td></tr>
    <tr><td>Working Capital Reserve</td><td>R100,000</td><td>5%</td></tr>
    <tr><td><strong>Total</strong></td><td><strong>R2,000,000</strong></td><td><strong>100%</strong></td></tr>
</table>

<h3>Investor Rights (Standard Seed Terms)</h3>
<ul>
    <li><strong>Information Rights:</strong> Quarterly financial updates, annual audited statements (once audits begin)</li>
    <li><strong>Board Observer:</strong> Investors holding 5%+ may appoint a board observer</li>
    <li><strong>Pro-Rata Rights:</strong> Right to participate in future funding rounds</li>
    <li><strong>Anti-Dilution:</strong> Weighted-average anti-dilution protection</li>
    <li><strong>Tag-Along:</strong> Right to sell alongside founders in any exit</li>
</ul>

<h3>Milestones</h3>
<table>
    <tr><th>Milestone</th><th>Target Date</th></tr>
    <tr><td>First paying customer</td><td>Q1 2026</td></tr>
    <tr><td>10 customers, R500K ARR</td><td>Q4 2026</td></tr>
    <tr><td>50 customers, R2M ARR</td><td>Q4 2027</td></tr>
    <tr><td>Series A raise (R15-25M)</td><td>Q1 2028</td></tr>
</table>

<div style="page-break-before: always;"></div>

<!-- PATH TO ALTX -->
<h1>Path from Seed to AltX</h1>

<h2>Funding Rounds Roadmap</h2>

<div class="timeline-visual">
TODAY           SEED            SERIES A         PRE-IPO          ALTX
(Jan 2026)      (Q1 2026)       (Q1 2028)        (Q4 2028)        (Q2 2029)
    │               │               │                │               │
    ▼               ▼               ▼                ▼               ▼
┌───────┐      ┌─────────┐     ┌──────────┐    ┌──────────┐    ┌─────────┐
│ R0    │      │ R2M     │     │ R15-25M  │    │ R30-50M  │    │ R50M+   │
│Pre-Rev│ ──▶  │Seed     │ ──▶ │Series A  │ ──▶│Pre-IPO   │ ──▶│IPO      │
│       │      │         │     │          │    │          │    │         │
└───────┘      └─────────┘     └──────────┘    └──────────┘    └─────────┘
                 │                 │                │               │
            16.67% sold       +20% sold        +15% sold      +10% sold
            83.33% left       63.33% left      48.33% left    38.33% left
</div>

<h2>Cap Table Evolution</h2>

<table>
    <tr><th>Stage</th><th>Founders</th><th>Seed</th><th>Series A</th><th>Pre-IPO</th><th>Public</th></tr>
    <tr><td>Today</td><td>100%</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>Post-Seed</td><td>83.33%</td><td>16.67%</td><td>-</td><td>-</td><td>-</td></tr>
    <tr><td>Post-Series A</td><td>66.67%</td><td>13.33%</td><td>20%</td><td>-</td><td>-</td></tr>
    <tr><td>Post-Pre-IPO</td><td>56.67%</td><td>11.33%</td><td>17%</td><td>15%</td><td>-</td></tr>
    <tr><td>Post-IPO (AltX)</td><td>51.00%</td><td>10.20%</td><td>15.30%</td><td>13.50%</td><td>10%</td></tr>
</table>

<div class="founder-highlight">
    <h3>🎯 Founder Protection Strategy</h3>
    <ul>
        <li>After Seed (R2M): You still own <strong>83.33%</strong></li>
        <li>After Series A (R20M): You still own <strong>~67%</strong></li>
        <li>After Pre-IPO (R40M): You still own <strong>~57%</strong></li>
        <li>After AltX IPO: You still own <strong>~51%</strong> (majority control)</li>
    </ul>
    <p><strong>Total Raised: R70+ million while maintaining majority control</strong></p>
</div>

<h2>Valuation Growth Expected</h2>

<table>
    <tr><th>Stage</th><th>Valuation</th><th>Multiple</th><th>Justification</th></tr>
    <tr><td>Seed (Today)</td><td>R10-12M</td><td>-</td><td>Product complete, pre-revenue</td></tr>
    <tr><td>Series A</td><td>R75-100M</td><td>6-8x</td><td>R2M+ ARR, growth proven</td></tr>
    <tr><td>Pre-IPO</td><td>R200-300M</td><td>2-3x</td><td>R10M+ ARR, market leader</td></tr>
    <tr><td>AltX IPO</td><td>R400-500M</td><td>1.5-2x</td><td>Public market premium</td></tr>
</table>

<div style="page-break-before: always;"></div>

<!-- PRIVATE PLACEMENT DEEP DIVE -->
<h1>Private Placement: Deep Dive</h1>

<div class="intro-box">
    <div class="intro-title">Your Preferred Approach</div>
    <p class="intro-text">Private placement allows you to hand-pick your investors and build strategic relationships. Combined with a hybrid IPO approach, this builds toward AltX listing while maintaining control over your shareholder base.</p>
</div>

<h2>What is Private Placement?</h2>

<p>Private placement means selling shares directly to selected investors rather than through a public offering. For AltX, you need 100 shareholders—but they can all be strategically chosen.</p>

<h3>Advantages</h3>
<ul>
    <li><strong>Control:</strong> You choose who invests</li>
    <li><strong>Relationships:</strong> Investors become strategic partners</li>
    <li><strong>Speed:</strong> No prospectus required for private placement</li>
    <li><strong>Terms:</strong> Negotiate directly, flexible structures</li>
    <li><strong>Less disclosure:</strong> Private round has less regulatory burden</li>
</ul>

<h2>Hybrid Approach: Strategic Investors + Mini-IPO</h2>

<div class="highlight-box">
    <h3>Recommended Strategy</h3>
    <ol>
        <li><strong>Seed Round (Now):</strong> R2M from 3-5 strategic investors</li>
        <li><strong>Series A (2028):</strong> R15-25M from 10-20 investors + funds</li>
        <li><strong>Pre-IPO Placement:</strong> R30-50M from 50-70 investors</li>
        <li><strong>Mini-IPO at AltX:</strong> R10-20M from 30-50 new shareholders (reach 100 minimum)</li>
    </ol>
</div>

<h2>Finding Your Seed Investors (R2 Million)</h2>

<h3>Target Investor Profiles</h3>

<table>
    <tr><th>Type</th><th>Typical Investment</th><th>What They Bring</th><th>Where to Find</th></tr>
    <tr><td>Friends & Family</td><td>R50K - R200K</td><td>Trust, patience</td><td>Your network</td></tr>
    <tr><td>Angel Investors</td><td>R100K - R500K</td><td>Experience, contacts</td><td>ABAN, Jozi Angels</td></tr>
    <tr><td>High-Net-Worth Individuals</td><td>R200K - R1M</td><td>Capital, credibility</td><td>Introductions</td></tr>
    <tr><td>Strategic Partners</td><td>R500K - R2M</td><td>Customers, distribution</td><td>Industry contacts</td></tr>
    <tr><td>Early-Stage VCs</td><td>R1M - R5M</td><td>Funds, governance</td><td>SAVCA directory</td></tr>
</table>

<h3>Sample Seed Round Composition</h3>

<div class="example-box">
<strong>Example: R2M from 5 Investors</strong>

Investor A (Strategic Partner - Accounting Firm): R500,000 → 4.17%
Investor B (Angel - Tech Entrepreneur): R400,000 → 3.33%
Investor C (HNW Individual): R400,000 → 3.33%
Investor D (Family Office): R400,000 → 3.33%
Investor E (Angel Network Pool): R300,000 → 2.50%
─────────────────────────────────────────────────
Total Raised: R2,000,000 → 16.67%
Founder Retains: 83.33%
</div>

<h3>South African Angel Networks & Funds</h3>

<table>
    <tr><th>Organization</th><th>Focus</th><th>Typical Check Size</th></tr>
    <tr><td>Jozi Angels</td><td>Tech startups</td><td>R500K - R5M</td></tr>
    <tr><td>Newtown Partners</td><td>Technology</td><td>R5M - R30M</td></tr>
    <tr><td>Knife Capital</td><td>Growth stage</td><td>R10M - R50M</td></tr>
    <tr><td>4Di Capital</td><td>Technology</td><td>R5M - R50M</td></tr>
    <tr><td>Kalon Venture Partners</td><td>B2B SaaS</td><td>R2M - R20M</td></tr>
    <tr><td>ABAN (African Business Angel Network)</td><td>Various</td><td>Varies</td></tr>
    <tr><td>Founders Factory Africa</td><td>Technology</td><td>R2M - R10M</td></tr>
</table>

<div style="page-break-before: always;"></div>

<!-- INVESTOR DOCUMENTS CHECKLIST -->
<h1>Documents You Need to Prepare</h1>

<h2>For R2M Seed Round (Immediate)</h2>

<table>
    <tr><th>#</th><th>Document</th><th>Purpose</th><th>Status</th></tr>
    <tr><td>1</td><td>Executive Summary</td><td>2-page overview for initial interest</td><td>⚠️ Update</td></tr>
    <tr><td>2</td><td>Pitch Deck</td><td>10-15 slide presentation</td><td>⚠️ Create</td></tr>
    <tr><td>3</td><td>Financial Model</td><td>3-year projections (Excel)</td><td>⚠️ Create</td></tr>
    <tr><td>4</td><td>Product Demo</td><td>Video or live walkthrough</td><td>⚠️ Verify</td></tr>
    <tr><td>5</td><td>Term Sheet Template</td><td>Standard terms to share</td><td>✅ Template in this doc</td></tr>
    <tr><td>6</td><td>Shareholders Agreement</td><td>Legal rights & obligations</td><td>⚠️ Legal help</td></tr>
    <tr><td>7</td><td>Subscription Agreement</td><td>Legal doc to purchase shares</td><td>⚠️ Legal help</td></tr>
    <tr><td>8</td><td>Company Profile</td><td>About the company</td><td>⚠️ Update</td></tr>
</table>

<h2>Update to Existing Investor Documents</h2>

<p>Your existing investor documents in <code>/investor-docs/</code> need to be updated to reflect:</p>

<ul>
    <li><strong>AltX listing goal</strong> - mention the path to public listing</li>
    <li><strong>Investment terms</strong> - what you're actually offering</li>
    <li><strong>Use of funds</strong> - how the R2M will be deployed</li>
    <li><strong>Milestones</strong> - what investors can expect</li>
    <li><strong>Declaration update</strong> - "God is <em>the</em> Power"</li>
</ul>

<h2>Documents for Later Stages</h2>

<h3>For Series A (2028)</h3>
<ul>
    <li>Audited financial statements (Year 1 & 2)</li>
    <li>Due diligence data room</li>
    <li>Customer contracts and ARR breakdown</li>
    <li>Detailed competitive analysis</li>
    <li>Management team CVs</li>
    <li>IP documentation</li>
</ul>

<h3>For AltX Listing (2029)</h3>
<ul>
    <li>Pre-Listing Statement (PLS)</li>
    <li>3 years audited financials</li>
    <li>Independent valuation report</li>
    <li>Legal due diligence report</li>
    <li>King IV compliance register</li>
    <li>Directors' declarations</li>
</ul>

<div style="page-break-before: always;"></div>

<!-- PRACTICAL TIMELINE -->
<h1>Your 12-Month Action Plan</h1>

<h3>Month 1: January 2026 - Foundation</h3>
<ul class="checklist">
    <li>Verify CIPC registration, download all documents</li>
    <li>Confirm/open business bank account</li>
    <li>Document all IP (code, designs, features)</li>
    <li>Create investor pitch deck (first draft)</li>
    <li>Build financial model (3-year projections)</li>
    <li>Identify 10 potential seed investors</li>
</ul>

<h3>Month 2: February 2026 - Outreach</h3>
<ul class="checklist">
    <li>Finalize pitch deck</li>
    <li>Create product demo video</li>
    <li>Reach out to 10 potential investors</li>
    <li>Have 5+ investor meetings</li>
    <li>Identify potential pilot customers</li>
    <li>Get legal template for shareholders agreement</li>
</ul>

<h3>Month 3: March 2026 - Close Seed Round</h3>
<ul class="checklist">
    <li>Negotiate terms with interested investors</li>
    <li>Finalize shareholders agreement</li>
    <li>Execute subscription agreements</li>
    <li>Receive funds into company account</li>
    <li>Issue share certificates</li>
    <li>Update CIPC with new shareholding</li>
</ul>

<h3>Months 4-6: Q2 2026 - Deploy & Grow</h3>
<ul class="checklist">
    <li>Hire first sales person</li>
    <li>Launch marketing campaigns</li>
    <li>Sign first 3-5 paying customers</li>
    <li>Set up proper accounting (Xero/QuickBooks)</li>
    <li>Begin tracking monthly financials</li>
    <li>Appoint auditors (for year-end)</li>
</ul>

<h3>Months 7-9: Q3 2026 - Scale</h3>
<ul class="checklist">
    <li>Reach 10+ customers</li>
    <li>Achieve R50K+ MRR</li>
    <li>Hire additional team members</li>
    <li>Implement customer success process</li>
    <li>Begin Series A preparation</li>
    <li>Research Designated Advisers</li>
</ul>

<h3>Months 10-12: Q4 2026 - First Year End</h3>
<ul class="checklist">
    <li>Close first financial year</li>
    <li>Complete first audit</li>
    <li>Reach 20+ customers, R100K+ MRR</li>
    <li>Prepare year-end investor report</li>
    <li>Begin Series A roadshow prep</li>
    <li>Appoint first non-executive advisor</li>
</ul>

<div style="page-break-before: always;"></div>

<!-- FINAL PAGES -->
<h1>Summary: From Today to AltX</h1>

<div class="timeline-visual">
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        YOUR JOURNEY: 2026 → 2029                               │
└─────────────────────────────────────────────────────────────────────────────────┘

2026 Q1    → Raise R2M Seed from 3-5 strategic investors
2026 Q2-Q4 → Deploy capital, get first 20 customers
2026 Q4    → First audit (once you have transactions)

2027 Q1-Q2 → Scale to 50+ customers, R2M+ ARR
2027 Q3-Q4 → Prepare for Series A

2028 Q1    → Raise Series A (R15-25M) from 10-20 investors
2028 Q2-Q4 → Scale aggressively, hit R10M ARR
2028 Q4    → 3rd year audit complete, AltX prep begins

2029 Q1    → Appoint Designated Adviser
2029 Q2    → Pre-Listing Statement, private placement to reach 100 shareholders
2029 Q3    → JSE review and approval
2029 Q4    → 🔔 ALTX LISTING DAY 🔔

Key Numbers:
• Total raised: R50-80 million
• Founder ownership at listing: ~50%
• ARR at listing: R15-25 million
• Valuation at listing: R300-500 million
</div>

<hr>

<div style="text-align: center; margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%); border-radius: 12px; color: white;">
    <h2 style="color: white; border: none; margin-top: 0;">The Journey Begins Today</h2>
    <p style="font-size: 16px; margin-bottom: 20px;">From R0 to JSE-Listed. One investor at a time. One customer at a time.</p>
    <p style="color: #fcd34d; font-style: italic; font-size: 18px;">"God is the Power. I am the Vision. We are the Team."</p>
    <p style="color: #93c5fd; letter-spacing: 2px; text-transform: uppercase; margin-top: 20px;">This is how we take over.</p>
</div>

</body>
</html>
`;

async function generatePDF() {
    console.log('📊 Generating Seed to AltX Practical Guide PDF...\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(HTML_CONTENT, { waitUntil: 'networkidle0' });

    const outputPath = path.join(__dirname, '..', 'succession', 'SEED-TO-ALTX-PRACTICAL-GUIDE.pdf');

    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
            <div style="font-size: 9px; color: #9ca3af; width: 100%; text-align: center; padding-bottom: 10px; font-family: sans-serif;">
                <span>Masaphokati Technologies (Pty) Ltd - Confidential</span>
                <span style="margin-left: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            </div>
        `,
        margin: {
            top: '20mm',
            right: '20mm',
            bottom: '25mm',
            left: '20mm'
        }
    });

    await browser.close();

    console.log('✅ Seed to AltX Practical Guide PDF created!\n');
    console.log(`📊 Output: ${outputPath}\n`);
}

generatePDF().catch(console.error);
