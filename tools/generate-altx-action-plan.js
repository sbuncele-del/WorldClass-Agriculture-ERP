#!/usr/bin/env node

/**
 * AltX Listing Action Plan - PDF Generator
 * From Pty Ltd to AltX Listed Company
 * Follows Masaphokati Technologies PDF Document Design Standard (DOC-STD-001)
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

        @page {
            size: A4;
            margin: 20mm 20mm 25mm 20mm;
        }

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
        .cover-title { font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
        .cover-subtitle { font-size: 18px; font-weight: 400; color: #bfdbfe; margin-bottom: 40px; }
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

        /* CONTENT */
        h1 {
            color: #1e3a8a;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
            margin-top: 40px;
            font-size: 24px;
            font-weight: 700;
        }
        h1:first-of-type { margin-top: 0; }

        h2 {
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-top: 30px;
            font-size: 20px;
            font-weight: 700;
        }

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

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
            page-break-inside: avoid;
        }
        th {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
            color: white;
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
        }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background-color: #f8fafc; }

        ul, ol { margin: 15px 0; padding-left: 25px; }
        li { margin: 8px 0; }

        .checklist { list-style: none; padding-left: 0; }
        .checklist li { padding-left: 28px; position: relative; }
        .checklist li::before { content: '☐'; position: absolute; left: 0; color: #1e3a8a; }

        .action-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .action-box h3 { color: #b45309; margin-top: 0; }

        .immediate-box {
            background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
            border: 2px solid #ef4444;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .immediate-box h3 { color: #dc2626; margin-top: 0; }

        .success-box {
            background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%);
            border: 2px solid #10b981;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .success-box h3 { color: #059669; margin-top: 0; }

        .timeline-box {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-family: 'Consolas', monospace;
            font-size: 11px;
            white-space: pre;
        }

        .cost-highlight {
            background: #fef3c7;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 600;
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

        .status-current { background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
        .status-todo { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
        .status-done { background: #d1fae5; color: #059669; padding: 2px 8px; border-radius: 4px; font-weight: 600; }

        .phase-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
        }
        .phase-content {
            border: 1px solid #e5e7eb;
            border-top: none;
            padding: 20px;
            border-radius: 0 0 8px 8px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover-page">
    <div class="cover-content">
        <div class="cover-logo">SiyaBusa ERP</div>
        <div class="cover-title">AltX Listing Action Plan</div>
        <div class="cover-subtitle">From Pty Ltd to Publicly Listed Company</div>
        <div class="cover-company">Masaphokati Technologies (Pty) Ltd</div>
        
        <div class="cover-info">
            <div class="info-row"><span class="info-label">Document Version:</span> <span class="info-value">1.0</span></div>
            <div class="info-row"><span class="info-label">Effective Date:</span> <span class="info-value">January 2026</span></div>
            <div class="info-row"><span class="info-label">Target Listing:</span> <span class="info-value">Q2 2028</span></div>
            <div class="info-row"><span class="info-label">Classification:</span> <span class="info-value">Confidential - Strategic</span></div>
        </div>
        
        <div class="cover-tagline">We Rule. We Govern. We Empower.</div>
    </div>
</div>

<!-- CURRENT STATUS -->
<h1>Current Status Assessment</h1>

<div class="intro-box">
    <div class="intro-title">Where We Are Today</div>
    <p class="intro-text">Masaphokati Technologies is currently registered as a <strong>Private Company (Pty) Ltd</strong>. This document outlines the exact steps to transform into an AltX-listed public company, providing market exposure and credibility while building toward a JSE Main Board listing.</p>
</div>

<table>
    <tr><th>Attribute</th><th>Current State</th><th>Required for AltX</th><th>Gap</th></tr>
    <tr><td>Company Type</td><td><span class="status-current">Pty Ltd (Private)</span></td><td>Ltd (Public)</td><td><span class="status-todo">Conversion Required</span></td></tr>
    <tr><td>Share Capital</td><td>TBD</td><td>R2 million minimum</td><td>Verify & increase if needed</td></tr>
    <tr><td>Audited Financials</td><td>TBD</td><td>Latest year audited</td><td>Appoint auditors</td></tr>
    <tr><td>Public Shareholders</td><td>0 (Private)</td><td>Minimum 100</td><td><span class="status-todo">Must acquire</span></td></tr>
    <tr><td>Public Float</td><td>0%</td><td>Minimum 10%</td><td><span class="status-todo">Must create</span></td></tr>
    <tr><td>Designated Adviser</td><td>None</td><td>Mandatory</td><td><span class="status-todo">Must appoint</span></td></tr>
    <tr><td>Board of Directors</td><td>TBD</td><td>Min 4 (exec + non-exec)</td><td>Expand board</td></tr>
</table>

<hr>

<!-- WHY ALTX -->
<h1>Why AltX First?</h1>

<h2>Strategic Advantages</h2>

<table>
    <tr><th>Factor</th><th>AltX</th><th>JSE Main Board</th></tr>
    <tr><td><strong>Minimum Share Capital</strong></td><td>R2 million</td><td>R50 million</td></tr>
    <tr><td><strong>Profit Track Record</strong></td><td>Not required</td><td>3 years audited profit</td></tr>
    <tr><td><strong>Public Shareholders</strong></td><td>100 minimum</td><td>300 minimum</td></tr>
    <tr><td><strong>Public Float</strong></td><td>10%</td><td>20%</td></tr>
    <tr><td><strong>Listing Timeline</strong></td><td>6-12 months</td><td>12-18 months</td></tr>
    <tr><td><strong>Listing Costs</strong></td><td>R3-8 million</td><td>R15-45 million</td></tr>
    <tr><td><strong>Designated Adviser</strong></td><td>Required (support)</td><td>Sponsor (less support)</td></tr>
</table>

<div class="success-box">
    <h3>✅ AltX Benefits for Masaphokati</h3>
    <ul>
        <li><strong>Immediate credibility</strong> - "JSE Listed Company" status</li>
        <li><strong>Access to capital</strong> - Raise funds from public markets</li>
        <li><strong>Currency for acquisitions</strong> - Use shares for M&A</li>
        <li><strong>Employee incentives</strong> - Listed share options</li>
        <li><strong>Media & visibility</strong> - Analyst coverage, SENS announcements</li>
        <li><strong>Governance discipline</strong> - Build systems for Main Board move</li>
        <li><strong>Stepping stone</strong> - Graduate to Main Board by 2030</li>
    </ul>
</div>

<div style="page-break-before: always;"></div>

<!-- IMMEDIATE ACTIONS -->
<h1>Immediate Actions (This Week)</h1>

<div class="immediate-box">
    <h3>🚨 ACTION REQUIRED: January 2026</h3>
    <p>These tasks must be initiated immediately to stay on track for a Q2 2028 listing.</p>
</div>

<h2>Action 1: Verify Company Registration</h2>
<table>
    <tr><th>Task</th><th>How</th><th>Cost</th><th>Timeline</th></tr>
    <tr><td>Download company documents from CIPC</td><td>www.cipc.co.za</td><td>~R50</td><td>Today</td></tr>
    <tr><td>Verify registration number</td><td>Check CM1/CM2</td><td>Free</td><td>Today</td></tr>
    <tr><td>Check current directors</td><td>CIPC records</td><td>Free</td><td>Today</td></tr>
    <tr><td>Verify MOI (Memorandum of Incorporation)</td><td>Review document</td><td>Free</td><td>Today</td></tr>
</table>

<h2>Action 2: Appoint External Auditors</h2>
<p>You MUST have audited financials. Appoint auditors NOW even if your first audit is for a partial year.</p>

<table>
    <tr><th>Auditor Type</th><th>Firms</th><th>Annual Cost Estimate</th></tr>
    <tr><td>Big 4 (Premium)</td><td>PwC, Deloitte, EY, KPMG</td><td>R300,000 - R800,000</td></tr>
    <tr><td>Mid-Tier (Recommended)</td><td>BDO, Grant Thornton, Mazars, Moore</td><td>R150,000 - R400,000</td></tr>
    <tr><td>Smaller Firms</td><td>Various registered auditors</td><td>R80,000 - R200,000</td></tr>
</table>

<div class="action-box">
    <h3>📞 This Week's Call: Contact 3 audit firms for quotes</h3>
    <ul>
        <li>BDO South Africa: +27 11 488 1700</li>
        <li>Grant Thornton: +27 11 322 4500</li>
        <li>Mazars: +27 11 547 4000</li>
    </ul>
</div>

<h2>Action 3: Open Separate Bank Account</h2>
<p>If not already done, ensure company has its own dedicated business bank account.</p>

<h2>Action 4: Start Financial Record-Keeping</h2>
<ul class="checklist">
    <li>Implement accounting software (Xero, QuickBooks, or SiyaBusa ERP!)</li>
    <li>Capture all transactions from company inception</li>
    <li>Separate personal and business expenses completely</li>
    <li>Keep all invoices, receipts, contracts</li>
</ul>

<div style="page-break-before: always;"></div>

<!-- PTY LTD TO LTD CONVERSION -->
<h1>Converting from Pty Ltd to Ltd</h1>

<div class="intro-box">
    <div class="intro-title">Critical Step</div>
    <p class="intro-text">You cannot list a Pty Ltd on the JSE. You must convert to a public company (Ltd) or incorporate a new public company. The conversion route is typically simpler.</p>
</div>

<h2>Option A: Convert Existing Pty Ltd to Ltd (Recommended)</h2>

<h3>Requirements for Conversion</h3>
<table>
    <tr><th>Requirement</th><th>Details</th></tr>
    <tr><td>Special Resolution</td><td>75% shareholder approval to convert</td></tr>
    <tr><td>New MOI</td><td>Adopt MOI compliant with public company requirements</td></tr>
    <tr><td>Name Change</td><td>Remove "(Pty)" - become "Masaphokati Technologies Ltd"</td></tr>
    <tr><td>CIPC Filing</td><td>Form CoR15.2 (Conversion of Company)</td></tr>
    <tr><td>Minimum Directors</td><td>Must have at least 3 directors</td></tr>
    <tr><td>Company Secretary</td><td>Must appoint qualified company secretary</td></tr>
    <tr><td>Audit Committee</td><td>Must establish (minimum 3 members)</td></tr>
</table>

<h3>Conversion Process Steps</h3>
<ol>
    <li><strong>Board Resolution</strong> - Directors resolve to propose conversion</li>
    <li><strong>Shareholder Notice</strong> - Give shareholders notice of special resolution</li>
    <li><strong>Special Resolution</strong> - Shareholders approve conversion (75%+)</li>
    <li><strong>Adopt New MOI</strong> - Draft and adopt public company MOI</li>
    <li><strong>Appoint Company Secretary</strong> - Mandatory for public companies</li>
    <li><strong>File with CIPC</strong> - Submit CoR15.2 and new MOI</li>
    <li><strong>Receive New Registration</strong> - CIPC issues amended certificate</li>
</ol>

<h3>Estimated Costs</h3>
<table>
    <tr><th>Item</th><th>Cost</th></tr>
    <tr><td>Legal fees (MOI drafting)</td><td>R30,000 - R80,000</td></tr>
    <tr><td>CIPC filing fees</td><td>~R500</td></tr>
    <tr><td>Company secretary setup</td><td>R10,000 - R30,000</td></tr>
    <tr><td><strong>Total Conversion</strong></td><td class="cost-highlight">R40,000 - R110,000</td></tr>
</table>

<h3>Timeline: 2-3 months</h3>

<h2>Option B: Incorporate New Public Company</h2>
<p>Alternative: Create new "Masaphokati Technologies Ltd" and transfer assets/shares. More complex, involves tax implications. Consult with tax advisor if considering this route.</p>

<div style="page-break-before: always;"></div>

<!-- ALTX REQUIREMENTS DETAILED -->
<h1>AltX Listing Requirements (Detailed)</h1>

<h2>Mandatory Requirements</h2>

<table>
    <tr><th>Requirement</th><th>Specification</th><th>Your Action</th></tr>
    <tr><td><strong>Share Capital</strong></td><td>Minimum R2,000,000</td><td>Ensure issued share capital meets minimum</td></tr>
    <tr><td><strong>Profit History</strong></td><td>Not required (growth focus)</td><td>No action - but audited financials needed</td></tr>
    <tr><td><strong>Audited Financials</strong></td><td>Latest financial year</td><td>Appoint auditors, complete audit</td></tr>
    <tr><td><strong>Shareholders</strong></td><td>Minimum 100 public shareholders</td><td>IPO or private placement</td></tr>
    <tr><td><strong>Public Float</strong></td><td>Minimum 10% of issued shares</td><td>Allocate shares in IPO</td></tr>
    <tr><td><strong>Designated Adviser</strong></td><td>JSE-approved DA required</td><td>Appoint from approved list</td></tr>
    <tr><td><strong>Directors</strong></td><td>Min 4 (including 2 exec, 2 non-exec)</td><td>Expand board</td></tr>
    <tr><td><strong>Financial Director</strong></td><td>Suitably qualified FD/CFO</td><td>Appoint experienced FD</td></tr>
    <tr><td><strong>Company Secretary</strong></td><td>Qualified and experienced</td><td>Appoint or outsource</td></tr>
    <tr><td><strong>Registered Office</strong></td><td>South African address</td><td>Confirm registered address</td></tr>
</table>

<h2>The Designated Adviser (DA) Role</h2>

<div class="action-box">
    <h3>🔑 Critical: Appoint DA Early</h3>
    <p>The Designated Adviser is your guide through the listing process. They:</p>
    <ul>
        <li>Assess your listing readiness</li>
        <li>Guide documentation preparation</li>
        <li>Liaise with JSE on your behalf</li>
        <li>Ensure ongoing compliance post-listing</li>
        <li>Provide corporate advice</li>
    </ul>
</div>

<h3>JSE-Approved Designated Advisers (Selection)</h3>
<table>
    <tr><th>Firm</th><th>Contact</th><th>Notes</th></tr>
    <tr><td>PSG Capital</td><td>+27 21 887 9602</td><td>Large, experienced</td></tr>
    <tr><td>Merchantec Capital</td><td>+27 11 325 6363</td><td>SME focused</td></tr>
    <tr><td>Grindrod Bank</td><td>+27 31 333 6600</td><td>Full service</td></tr>
    <tr><td>Questco</td><td>+27 11 011 9200</td><td>Specialist DA</td></tr>
    <tr><td>Arbor Capital</td><td>+27 11 480 8500</td><td>Advisory focused</td></tr>
    <tr><td>Exchange Sponsors</td><td>+27 11 880 2113</td><td>Boutique</td></tr>
</table>

<p><strong>DA Fees:</strong> R500,000 - R2,000,000 (listing) + R200,000 - R500,000 annually (retained)</p>

<div style="page-break-before: always;"></div>

<!-- BOARD COMPOSITION -->
<h1>Board & Governance Structure</h1>

<h2>Required Board Composition for AltX</h2>

<table>
    <tr><th>Role</th><th>Type</th><th>Requirement</th><th>Candidate Profile</th></tr>
    <tr><td>CEO</td><td>Executive</td><td>Mandatory</td><td>Founder/Current MD</td></tr>
    <tr><td>CFO/FD</td><td>Executive</td><td>Mandatory</td><td>CA(SA) or equivalent, listed co experience preferred</td></tr>
    <tr><td>Chairman</td><td>Non-Executive</td><td>Mandatory</td><td>Industry experience, governance knowledge</td></tr>
    <tr><td>Director</td><td>Independent Non-Exec</td><td>Recommended</td><td>Independent, no business ties</td></tr>
</table>

<h2>Required Committees</h2>

<h3>1. Audit Committee (Mandatory for Public Companies)</h3>
<ul>
    <li>Minimum 3 members</li>
    <li>All must be non-executive directors</li>
    <li>Majority must be independent</li>
    <li>Chairman must be independent (not board chairman)</li>
    <li>At least 1 member must have financial expertise</li>
</ul>

<h3>2. Social & Ethics Committee (Mandatory - Companies Act)</h3>
<ul>
    <li>Minimum 3 members</li>
    <li>At least 1 must be a director</li>
    <li>Monitors: ethics, B-BBEE, environment, labour, corruption</li>
</ul>

<h2>Where to Find Directors</h2>
<table>
    <tr><th>Source</th><th>How</th></tr>
    <tr><td>Institute of Directors SA (IoDSA)</td><td>Director database, www.iodsa.co.za</td></tr>
    <tr><td>Your Network</td><td>Industry contacts, advisors, investors</td></tr>
    <tr><td>Executive Search Firms</td><td>Jack Hammer, Landelahni, Signium</td></tr>
    <tr><td>Professional Bodies</td><td>SAICA, Law societies</td></tr>
    <tr><td>Your DA</td><td>Often have director networks</td></tr>
</table>

<h3>Director Remuneration (AltX benchmarks)</h3>
<table>
    <tr><th>Role</th><th>Annual Fee Range</th></tr>
    <tr><td>Non-Executive Chairman</td><td>R150,000 - R400,000</td></tr>
    <tr><td>Non-Executive Director</td><td>R80,000 - R200,000</td></tr>
    <tr><td>Committee Chairman (additional)</td><td>R30,000 - R80,000</td></tr>
    <tr><td>Committee Member (additional)</td><td>R20,000 - R50,000</td></tr>
</table>

<div style="page-break-before: always;"></div>

<!-- CAPITAL RAISING -->
<h1>Capital Raising & Creating Public Float</h1>

<h2>The Challenge</h2>
<p>You need <strong>100 public shareholders</strong> holding at least <strong>10% of shares</strong>. As a Pty Ltd with no public shares, you must create this through a capital raise.</p>

<h2>Options to Create Public Float</h2>

<h3>Option 1: Initial Public Offering (IPO)</h3>
<table>
    <tr><th>Aspect</th><th>Details</th></tr>
    <tr><td>What</td><td>Offer shares to public through JSE listing process</td></tr>
    <tr><td>Minimum raise</td><td>Typically R10-50 million for AltX</td></tr>
    <tr><td>Process</td><td>Prospectus, roadshow, book-build, allocation</td></tr>
    <tr><td>Timeline</td><td>4-6 months from documentation start</td></tr>
    <tr><td>Cost</td><td>5-10% of capital raised</td></tr>
</table>

<h3>Option 2: Private Placement + Listing</h3>
<table>
    <tr><th>Aspect</th><th>Details</th></tr>
    <tr><td>What</td><td>Place shares privately with 100+ investors, then list</td></tr>
    <tr><td>Investors</td><td>High-net-worth individuals, family offices, small funds</td></tr>
    <tr><td>Minimum per investor</td><td>No minimum, but typically R10,000+</td></tr>
    <tr><td>Advantage</td><td>More control over shareholder base</td></tr>
    <tr><td>Disadvantage</td><td>More work to find 100 investors</td></tr>
</table>

<h3>Option 3: Combination Approach (Recommended)</h3>
<ol>
    <li><strong>Pre-IPO Round:</strong> Raise R5-10 million from 20-30 strategic investors</li>
    <li><strong>IPO:</strong> Offer remaining shares to reach 100+ shareholders</li>
    <li><strong>Total:</strong> R15-30 million raised, diversified shareholder base</li>
</ol>

<h2>Suggested Capital Structure</h2>
<table>
    <tr><th>Shareholder Category</th><th>% of Shares</th><th>Number of Shares*</th></tr>
    <tr><td>Founders/Management</td><td>60%</td><td>60,000,000</td></tr>
    <tr><td>Pre-IPO Investors</td><td>15%</td><td>15,000,000</td></tr>
    <tr><td>IPO Public Shareholders</td><td>15%</td><td>15,000,000</td></tr>
    <tr><td>Employee Share Scheme</td><td>10%</td><td>10,000,000</td></tr>
    <tr><td><strong>Total</strong></td><td><strong>100%</strong></td><td><strong>100,000,000</strong></td></tr>
</table>
<p><em>*Assuming 100 million shares at R1 par value = R100m market cap at listing</em></p>

<h2>Valuation Considerations</h2>
<p>AltX tech companies typically list at:</p>
<ul>
    <li><strong>Revenue multiple:</strong> 2-5x annual revenue</li>
    <li><strong>Pre-revenue:</strong> Based on comparable transactions, IP value</li>
    <li><strong>Your DA</strong> will help determine appropriate valuation</li>
</ul>

<div style="page-break-before: always;"></div>

<!-- TIMELINE -->
<h1>24-Month Roadmap to AltX Listing</h1>

<div class="timeline-box">
TODAY (Jan 2026)                                          LISTING (Q2 2028)
    │                                                              │
    ▼                                                              ▼
────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────┴───
    │  PHASE 1 │  PHASE 2 │  PHASE 3 │  PHASE 4 │  PHASE 5 │
    │Foundation│  Build   │  Prepare │   File   │  Launch  │
    │ 6 months │ 6 months │ 6 months │ 3 months │ 3 months │
    │          │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┴──────────┘
    Jan-Jun 26  Jul-Dec 26  Jan-Jun 27  Jul-Sep 27  Oct 27-Q2 28
</div>

<div class="phase-header"><strong>Phase 1: Foundation</strong> (January - June 2026)</div>
<div class="phase-content">
<ul class="checklist">
    <li>Verify company registration and documents</li>
    <li>Appoint external auditors</li>
    <li>Implement proper accounting systems</li>
    <li>Research and shortlist Designated Advisers</li>
    <li>Begin informal DA discussions</li>
    <li>Identify potential board members</li>
    <li>Start documenting business processes</li>
    <li>Prepare management accounts monthly</li>
    <li>First year-end (if Feb/March)</li>
    <li>Commence first audit</li>
</ul>
<p><strong>Budget:</strong> R200,000 - R400,000</p>
</div>

<div class="phase-header"><strong>Phase 2: Build</strong> (July - December 2026)</div>
<div class="phase-content">
<ul class="checklist">
    <li>Complete first audit</li>
    <li>Formally appoint Designated Adviser</li>
    <li>DA conducts listing readiness assessment</li>
    <li>Identify gaps and remediation plan</li>
    <li>Begin conversion from Pty Ltd to Ltd</li>
    <li>Draft new public company MOI</li>
    <li>Appoint first non-executive director</li>
    <li>Appoint or outsource company secretary</li>
    <li>Implement governance framework</li>
    <li>Start investor materials preparation</li>
</ul>
<p><strong>Budget:</strong> R500,000 - R1,000,000</p>
</div>

<div class="phase-header"><strong>Phase 3: Prepare</strong> (January - June 2027)</div>
<div class="phase-content">
<ul class="checklist">
    <li>Complete Pty Ltd to Ltd conversion</li>
    <li>Full board in place (4+ directors)</li>
    <li>Audit committee operational</li>
    <li>Social & ethics committee operational</li>
    <li>Second audit underway</li>
    <li>Engage legal counsel for listing</li>
    <li>Begin pre-listing statement drafting</li>
    <li>Identify lead broker/corporate advisor</li>
    <li>Pre-IPO investor discussions</li>
    <li>Valuation work</li>
</ul>
<p><strong>Budget:</strong> R1,000,000 - R2,000,000</p>
</div>

<div style="page-break-before: always;"></div>

<div class="phase-header"><strong>Phase 4: File</strong> (July - September 2027)</div>
<div class="phase-content">
<ul class="checklist">
    <li>Complete pre-listing statement</li>
    <li>DA review and sign-off</li>
    <li>Legal review complete</li>
    <li>Submit application to JSE</li>
    <li>Respond to JSE queries</li>
    <li>Finalize prospectus/PLS</li>
    <li>Pre-IPO placement (if doing)</li>
    <li>Book build preparation</li>
    <li>Media and PR strategy</li>
    <li>Conditional approval from JSE</li>
</ul>
<p><strong>Budget:</strong> R1,500,000 - R3,000,000</p>
</div>

<div class="phase-header"><strong>Phase 5: Launch</strong> (October 2027 - Q2 2028)</div>
<div class="phase-content">
<ul class="checklist">
    <li>Investor roadshow</li>
    <li>Book building (collecting orders)</li>
    <li>Price determination</li>
    <li>Share allocation</li>
    <li>Final JSE approval</li>
    <li><strong>LISTING DAY 🔔</strong></li>
    <li>First trading day celebration</li>
    <li>SENS announcement</li>
    <li>Ongoing compliance begins</li>
    <li>First results announcement cycle</li>
</ul>
<p><strong>Budget:</strong> R2,000,000 - R4,000,000 (including IPO costs)</p>
</div>

<hr>

<h2>Total Estimated Costs</h2>
<table>
    <tr><th>Category</th><th>Low Estimate</th><th>High Estimate</th></tr>
    <tr><td>Auditors (2 years)</td><td>R300,000</td><td>R800,000</td></tr>
    <tr><td>Designated Adviser</td><td>R800,000</td><td>R2,000,000</td></tr>
    <tr><td>Legal Fees</td><td>R500,000</td><td>R1,500,000</td></tr>
    <tr><td>Corporate Advisor/Broker</td><td>R500,000</td><td>R1,500,000</td></tr>
    <tr><td>Company Conversion</td><td>R50,000</td><td>R150,000</td></tr>
    <tr><td>Directors' Fees (setup)</td><td>R200,000</td><td>R500,000</td></tr>
    <tr><td>Marketing/Roadshow</td><td>R200,000</td><td>R500,000</td></tr>
    <tr><td>JSE Fees</td><td>R100,000</td><td>R300,000</td></tr>
    <tr><td>Contingency</td><td>R350,000</td><td>R750,000</td></tr>
    <tr style="background: #fef3c7;"><td><strong>TOTAL</strong></td><td><strong>R3,000,000</strong></td><td><strong>R8,000,000</strong></td></tr>
</table>

<div style="page-break-before: always;"></div>

<!-- IMMEDIATE CHECKLIST -->
<h1>Your Action Checklist: Next 30 Days</h1>

<div class="immediate-box">
    <h3>Week 1 (January 6-12, 2026)</h3>
    <ul class="checklist">
        <li>Download all CIPC documents for Masaphokati Technologies (Pty) Ltd</li>
        <li>Review current MOI and shareholder structure</li>
        <li>List all current assets, liabilities, contracts</li>
        <li>Contact 3 audit firms for proposals</li>
        <li>Research Designated Advisers (review websites)</li>
    </ul>
</div>

<div class="action-box">
    <h3>Week 2 (January 13-19, 2026)</h3>
    <ul class="checklist">
        <li>Meet with 2-3 audit firms</li>
        <li>Select and appoint auditors</li>
        <li>Begin gathering financial records</li>
        <li>Contact 2 Designated Advisers for intro calls</li>
        <li>Start researching potential board candidates</li>
    </ul>
</div>

<div class="action-box">
    <h3>Week 3 (January 20-26, 2026)</h3>
    <ul class="checklist">
        <li>Hold introductory calls with DAs</li>
        <li>Get DA fee proposals</li>
        <li>Ensure bank account is business-only</li>
        <li>Implement/verify accounting system</li>
        <li>Create board of directors wishlist</li>
    </ul>
</div>

<div class="success-box">
    <h3>Week 4 (January 27 - February 2, 2026)</h3>
    <ul class="checklist">
        <li>Auditors formally engaged (letter signed)</li>
        <li>Shortlist 2 DAs for detailed discussions</li>
        <li>First month's management accounts prepared</li>
        <li>Initial board candidate outreach</li>
        <li>Document key contracts and IP</li>
    </ul>
</div>

<hr>

<h1>Key Contacts to Save</h1>

<table>
    <tr><th>Organization</th><th>Purpose</th><th>Contact</th></tr>
    <tr><td>CIPC</td><td>Company registration, conversion</td><td>www.cipc.co.za / 086 100 2472</td></tr>
    <tr><td>JSE Limited</td><td>Listing enquiries</td><td>+27 11 520 7000</td></tr>
    <tr><td>IoDSA</td><td>Director search, governance</td><td>www.iodsa.co.za</td></tr>
    <tr><td>SAICA</td><td>Find CA auditors</td><td>www.saica.co.za</td></tr>
    <tr><td>SARS</td><td>Tax compliance</td><td>www.sars.gov.za</td></tr>
</table>

<hr>

<div style="text-align: center; margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%); border-radius: 12px; color: white;">
    <h2 style="color: white; border: none; margin-top: 0;">The Journey Begins Today</h2>
    <p style="font-size: 16px; margin-bottom: 20px;">From Pty Ltd to JSE-Listed in 24 months. This is possible. This is the plan.</p>
    <p style="color: #fcd34d; font-style: italic; font-size: 18px;">"God is the Power. I am the Vision. We are the Team."</p>
    <p style="color: #93c5fd; letter-spacing: 2px; text-transform: uppercase; margin-top: 20px;">This is how we take over.</p>
</div>

</body>
</html>
`;

async function generatePDF() {
    console.log('📊 Generating AltX Listing Action Plan PDF...\n');
    console.log('   From Pty Ltd to Publicly Listed Company...\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(HTML_CONTENT, { waitUntil: 'networkidle0' });

    const outputPath = path.join(__dirname, '..', 'succession', 'ALTX-LISTING-ACTION-PLAN.pdf');

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

    console.log('✅ AltX Listing Action Plan PDF created successfully!\n');
    console.log(`📊 Output: ${outputPath}\n`);
    console.log('   "This is how we take over."\n');
}

generatePDF().catch(console.error);
