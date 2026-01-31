#!/usr/bin/env node

/**
 * JSE Listing Roadmap 2030 - PDF Generator
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

        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            margin: 0;
            padding: 0;
            font-size: 14px;
        }

        /* ==================== COVER PAGE ==================== */
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
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
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

        .cover-logo {
            font-size: 48px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 10px;
        }

        .cover-title {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 10px;
        }

        .cover-subtitle {
            font-size: 18px;
            font-weight: 400;
            color: #bfdbfe;
            margin-bottom: 40px;
        }

        .cover-company {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 20px;
        }

        .cover-info {
            margin-top: 25px;
            padding: 20px 30px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            text-align: left;
            display: inline-block;
        }

        .cover-info .info-row {
            margin: 8px 0;
            font-size: 14px;
            color: #e0f2fe;
        }

        .cover-info .info-label {
            font-weight: 600;
            color: #93c5fd;
        }

        .cover-info .info-value {
            color: #ffffff;
        }

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

        /* ==================== CONTENT PAGES ==================== */
        .page {
            page-break-after: always;
        }

        .page:last-child {
            page-break-after: auto;
        }

        h1 {
            color: #1e3a8a;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
            margin-top: 40px;
            font-size: 24px;
            font-weight: 700;
        }

        h1:first-of-type {
            margin-top: 0;
        }

        h2 {
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-top: 30px;
            font-size: 20px;
            font-weight: 700;
        }

        h3 {
            color: #3730a3;
            margin-top: 25px;
            font-size: 16px;
            font-weight: 700;
        }

        h4 {
            color: #4338ca;
            margin-top: 20px;
            font-size: 14px;
            font-weight: 600;
        }

        /* Intro Box */
        .intro-box {
            background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
            border-left: 4px solid #1e3a8a;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 0 8px 8px 0;
        }

        .intro-title {
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 8px;
            font-size: 14px;
            text-transform: uppercase;
        }

        .intro-text {
            color: #4b5563;
            font-size: 14px;
            margin: 0;
        }

        /* Tables */
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

        td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
        }

        tr:nth-child(even) {
            background-color: #f8fafc;
        }

        /* Lists */
        ul, ol {
            margin: 15px 0;
            padding-left: 25px;
        }

        li {
            margin: 8px 0;
        }

        /* Checklist */
        .checklist {
            list-style: none;
            padding-left: 0;
        }

        .checklist li {
            padding-left: 28px;
            position: relative;
        }

        .checklist li::before {
            content: '☐';
            position: absolute;
            left: 0;
            color: #1e3a8a;
        }

        /* Code/Pre */
        code {
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Consolas', monospace;
            font-size: 12px;
        }

        pre {
            background-color: #1e293b;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 11px;
            line-height: 1.5;
            page-break-inside: avoid;
            white-space: pre-wrap;
        }

        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }

        /* Blockquote */
        blockquote {
            border-left: 4px solid #7c3aed;
            margin: 20px 0;
            padding: 15px 20px;
            background-color: #faf5ff;
            border-radius: 0 8px 8px 0;
            font-style: italic;
        }

        blockquote p {
            margin: 0;
        }

        /* HR */
        hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 30px 0;
        }

        /* Strong */
        strong {
            color: #1e3a8a;
        }

        /* Diagram boxes */
        .diagram-box {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-family: 'Consolas', monospace;
            font-size: 11px;
            white-space: pre;
            overflow-x: auto;
            page-break-inside: avoid;
        }

        /* Risk colors */
        .risk-high { color: #dc2626; font-weight: 600; }
        .risk-medium { color: #f59e0b; font-weight: 600; }
        .risk-low { color: #10b981; font-weight: 600; }

        /* Phase boxes */
        .phase-box {
            background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
            border: 1px solid #1e3a8a;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }

        .phase-title {
            color: #1e3a8a;
            font-weight: 700;
            font-size: 16px;
            margin-bottom: 15px;
        }

        /* Target highlight */
        .target-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 15px 20px;
            margin: 20px 0;
            text-align: center;
        }

        .target-box strong {
            color: #b45309;
            font-size: 18px;
        }

        /* Conclusion box */
        .conclusion-box {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
            color: white;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
        }

        .conclusion-box h2 {
            color: white;
            border-bottom: 1px solid rgba(255,255,255,0.3);
        }

        .conclusion-box ol {
            color: white;
        }

        .conclusion-box strong {
            color: #fcd34d;
        }

        /* Footer quote */
        .footer-quote {
            text-align: center;
            font-style: italic;
            color: #6b7280;
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
        }

        /* Appendix */
        .appendix {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover-page">
    <div class="cover-content">
        <div class="cover-logo">SiyaBusa ERP</div>
        <div class="cover-title">JSE Listing Roadmap 2030</div>
        <div class="cover-subtitle">Strategic Plan for Johannesburg Stock Exchange Listing</div>
        <div class="cover-company">Masaphokati Technologies (Pty) Ltd</div>
        
        <div class="cover-info">
            <div class="info-row"><span class="info-label">Document Version:</span> <span class="info-value">1.0</span></div>
            <div class="info-row"><span class="info-label">Effective Date:</span> <span class="info-value">January 2026</span></div>
            <div class="info-row"><span class="info-label">Department:</span> <span class="info-value">Executive Management</span></div>
            <div class="info-row"><span class="info-label">Classification:</span> <span class="info-value">Confidential - Strategic</span></div>
        </div>
        
        <div class="cover-tagline">We Rule. We Govern. We Empower.</div>
    </div>
</div>

<!-- CONTENT CONTINUES IN NEXT CHUNK -->
`;

// Content will be added in generate function
const CONTENT_PART1 = `
<!-- EXECUTIVE SUMMARY -->
<h1>Executive Summary</h1>

<div class="intro-box">
    <div class="intro-title">Strategic Vision</div>
    <p class="intro-text">This document outlines the strategic roadmap for listing Masaphokati Technologies (Pty) Ltd on the Johannesburg Stock Exchange (JSE) by 2030. The company will operate with the discipline, governance, and transparency of a publicly listed company from Day One.</p>
</div>

<div class="target-box">
    <strong>🎯 Target: JSE Main Board Listing by Q4 2030</strong>
</div>

<hr>

<!-- PART 1: JSE LISTING REQUIREMENTS -->
<h1>Part 1: JSE Listing Requirements</h1>

<h2>Option A: JSE Main Board (Recommended for 2030)</h2>
<p>The Main Board is for established companies with a proven track record.</p>

<h3>Financial Requirements</h3>
<table>
    <tr><th>Requirement</th><th>Minimum Threshold</th></tr>
    <tr><td><strong>Share Capital</strong></td><td>R50 million (subscribed capital)</td></tr>
    <tr><td><strong>Profit History</strong></td><td>Audited profit for 3 preceding years</td></tr>
    <tr><td><strong>Minimum Profit</strong></td><td>R15 million pre-tax profit in last financial year</td></tr>
    <tr><td><strong>Public Shareholding</strong></td><td>Minimum 20% of each class of shares held by public</td></tr>
    <tr><td><strong>Number of Shareholders</strong></td><td>Minimum 300 public shareholders</td></tr>
    <tr><td><strong>Market Capitalisation</strong></td><td>R500 million minimum (recommended: R1 billion+)</td></tr>
</table>

<h3>Corporate Governance Requirements</h3>
<table>
    <tr><th>Requirement</th><th>Description</th></tr>
    <tr><td><strong>Board Composition</strong></td><td>Minimum 4 directors (majority non-executive)</td></tr>
    <tr><td><strong>Independent Directors</strong></td><td>At least 2 independent non-executive directors</td></tr>
    <tr><td><strong>Board Committees</strong></td><td>Audit, Risk, Remuneration, Social & Ethics committees required</td></tr>
    <tr><td><strong>Company Secretary</strong></td><td>Qualified company secretary with relevant experience</td></tr>
    <tr><td><strong>Chairman</strong></td><td>Independent non-executive chairman</td></tr>
    <tr><td><strong>CEO/CFO Separation</strong></td><td>CEO and CFO must be separate individuals</td></tr>
    <tr><td><strong>Financial Director</strong></td><td>Suitably qualified and experienced</td></tr>
</table>

<h3>Compliance Requirements</h3>
<ul>
    <li>Full compliance with Companies Act 71 of 2008</li>
    <li>King IV Corporate Governance Code compliance</li>
    <li>International Financial Reporting Standards (IFRS) compliant financials</li>
    <li>B-BBEE compliance and certificate</li>
    <li>SENS (Stock Exchange News Service) announcements</li>
    <li>Annual Integrated Report</li>
    <li>Sustainability/ESG Reporting</li>
</ul>

<h2>Option B: AltX (Alternative Exchange) - Stepping Stone</h2>
<p>AltX is designed for small to medium enterprises. Could be used as a stepping stone (list 2028, upgrade to Main Board 2030).</p>

<h3>AltX Requirements (Less Stringent)</h3>
<table>
    <tr><th>Requirement</th><th>Minimum Threshold</th></tr>
    <tr><td><strong>Share Capital</strong></td><td>R2 million</td></tr>
    <tr><td><strong>Profit History</strong></td><td>Not required</td></tr>
    <tr><td><strong>Public Shareholding</strong></td><td>10% minimum</td></tr>
    <tr><td><strong>Number of Shareholders</strong></td><td>Minimum 100 public shareholders</td></tr>
    <tr><td><strong>Designated Adviser</strong></td><td>Mandatory (appointed from JSE-approved list)</td></tr>
</table>
`;

const CONTENT_PART2 = `
<div style="page-break-before: always;"></div>

<!-- PART 2: GOVERNANCE STRUCTURE -->
<h1>Part 2: Operating Like a Listed Company from Day One</h1>

<h2>Governance Structure (Implement Immediately)</h2>

<div class="diagram-box">
┌─────────────────────────────────────────────────────────────────┐
│                     BOARD OF DIRECTORS                          │
│  (Chairman: Independent Non-Executive)                          │
├─────────────────────────────────────────────────────────────────┤
│  • Non-Executive Directors (Majority)                           │
│  • Independent Non-Executive Directors (Min 2)                  │
│  • Executive Directors (CEO, CFO, COO)                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
┌───▼───┐         ┌─────▼─────┐       ┌─────▼─────┐
│ AUDIT │         │   RISK    │       │REMUNERATION│
│COMMITTEE│       │ COMMITTEE │       │ COMMITTEE  │
└───────┘         └───────────┘       └───────────┘
    │                                       │
┌───▼───────────────┐             ┌─────────▼─────────┐
│  SOCIAL & ETHICS  │             │   NOMINATIONS     │
│    COMMITTEE      │             │    COMMITTEE      │
└───────────────────┘             └───────────────────┘
</div>

<h3>Board Composition Target (by 2027)</h3>
<table>
    <tr><th>Position</th><th>Type</th><th>Status</th></tr>
    <tr><td>Chairman</td><td>Independent Non-Executive</td><td>To Appoint</td></tr>
    <tr><td>Director 1</td><td>Independent Non-Executive</td><td>To Appoint</td></tr>
    <tr><td>Director 2</td><td>Non-Executive</td><td>To Appoint</td></tr>
    <tr><td>Director 3</td><td>Non-Executive</td><td>To Appoint</td></tr>
    <tr><td>CEO</td><td>Executive</td><td>Founder</td></tr>
    <tr><td>CFO</td><td>Executive</td><td>To Appoint</td></tr>
    <tr><td>COO</td><td>Executive</td><td>To Appoint</td></tr>
</table>

<h2>Committee Structure</h2>

<h3>1. Audit Committee</h3>
<ul>
    <li><strong>Composition:</strong> Min 3 independent non-executive directors</li>
    <li><strong>Chair:</strong> Independent director (not board chairman)</li>
    <li><strong>Responsibilities:</strong>
        <ul>
            <li>Oversee financial reporting</li>
            <li>Internal controls</li>
            <li>External audit relationship</li>
            <li>Risk management (financial)</li>
            <li>Compliance monitoring</li>
        </ul>
    </li>
</ul>

<h3>2. Risk Committee</h3>
<ul>
    <li><strong>Composition:</strong> Min 3 directors (majority non-executive)</li>
    <li><strong>Responsibilities:</strong> Enterprise risk management, IT governance, Cybersecurity oversight, Business continuity</li>
</ul>

<h3>3. Remuneration Committee</h3>
<ul>
    <li><strong>Composition:</strong> Min 3 non-executive directors (majority independent)</li>
    <li><strong>Responsibilities:</strong> Executive compensation, Incentive schemes, Non-executive director fees, Remuneration policy</li>
</ul>

<h3>4. Social & Ethics Committee</h3>
<ul>
    <li><strong>Composition:</strong> Min 3 directors/prescribed officers</li>
    <li><strong>Responsibilities:</strong> B-BBEE compliance, Environmental sustainability, Corporate citizenship, Labour practices, Ethics management</li>
</ul>

<h3>5. Nominations Committee</h3>
<ul>
    <li><strong>Composition:</strong> Min 3 directors (majority non-executive)</li>
    <li><strong>Responsibilities:</strong> Board appointments, Board diversity, Director independence assessment, Succession planning</li>
</ul>
`;

const CONTENT_PART3 = `
<div style="page-break-before: always;"></div>

<!-- PART 3: FINANCIAL FRAMEWORK -->
<h1>Part 3: Financial Framework</h1>

<h2>Immediate Actions (2026)</h2>

<h3>1. Appoint External Auditors</h3>
<ul>
    <li>Big 4 or reputable mid-tier firm</li>
    <li>Begin annual audits immediately</li>
    <li>Build 3-year audited track record</li>
</ul>

<h3>2. Implement IFRS</h3>
<ul>
    <li>Full International Financial Reporting Standards</li>
    <li>Chart of accounts aligned with IFRS</li>
    <li>Monthly management accounts</li>
    <li>Quarterly board reporting</li>
</ul>

<h3>3. Financial Controls</h3>
<ul>
    <li>Segregation of duties</li>
    <li>Authorization matrices</li>
    <li>Internal audit function</li>
    <li>Fraud prevention controls</li>
</ul>

<h2>Financial Targets for Listing</h2>
<table>
    <tr><th>Year</th><th>Revenue Target</th><th>Pre-Tax Profit Target</th><th>Milestone</th></tr>
    <tr><td>2026</td><td>R10 million</td><td>R1 million</td><td>Foundation</td></tr>
    <tr><td>2027</td><td>R30 million</td><td>R5 million</td><td>Growth</td></tr>
    <tr><td>2028</td><td>R75 million</td><td>R12 million</td><td>Scale</td></tr>
    <tr><td>2029</td><td>R150 million</td><td>R20 million</td><td>Pre-IPO</td></tr>
    <tr style="background: #fef3c7;"><td><strong>2030</strong></td><td><strong>R250 million</strong></td><td><strong>R35 million</strong></td><td><strong>IPO Ready</strong></td></tr>
</table>

<h2>Capital Structure Planning</h2>

<h3>Pre-IPO Capital Rounds</h3>
<table>
    <tr><th>Round</th><th>Year</th><th>Target Amount</th><th>Valuation</th><th>Dilution</th></tr>
    <tr><td>Seed</td><td>2026</td><td>R5 million</td><td>R25 million</td><td>20%</td></tr>
    <tr><td>Series A</td><td>2027</td><td>R25 million</td><td>R100 million</td><td>25%</td></tr>
    <tr><td>Series B</td><td>2028</td><td>R75 million</td><td>R300 million</td><td>25%</td></tr>
    <tr><td>Pre-IPO</td><td>2029</td><td>R150 million</td><td>R750 million</td><td>20%</td></tr>
    <tr style="background: #fef3c7;"><td><strong>IPO</strong></td><td><strong>2030</strong></td><td><strong>R500 million</strong></td><td><strong>R2 billion</strong></td><td><strong>25%</strong></td></tr>
</table>

<h3>Post-IPO Shareholding Target</h3>
<table>
    <tr><th>Category</th><th>% Holding</th></tr>
    <tr><td>Founders/Management</td><td>35%</td></tr>
    <tr><td>Strategic Investors</td><td>20%</td></tr>
    <tr><td>Institutional Investors</td><td>25%</td></tr>
    <tr><td>Public Float</td><td>20%</td></tr>
</table>
`;

const CONTENT_PART4 = `
<div style="page-break-before: always;"></div>

<!-- PART 4: COMPLIANCE FRAMEWORK -->
<h1>Part 4: Compliance Framework</h1>

<h2>Regulatory Compliance</h2>
<table>
    <tr><th>Regulation</th><th>Action Required</th><th>Timeline</th></tr>
    <tr><td>Companies Act 71 of 2008</td><td>Full compliance</td><td>Immediate</td></tr>
    <tr><td>King IV Code</td><td>Apply or explain</td><td>Immediate</td></tr>
    <tr><td>B-BBEE Act</td><td>Level 2 or better</td><td>2027</td></tr>
    <tr><td>POPIA</td><td>Data protection compliance</td><td>Immediate</td></tr>
    <tr><td>Tax Compliance</td><td>Valid tax clearance</td><td>Ongoing</td></tr>
    <tr><td>Labour Laws</td><td>Full compliance</td><td>Immediate</td></tr>
    <tr><td>Industry Regulations</td><td>As applicable</td><td>Ongoing</td></tr>
</table>

<h2>Annual Compliance Calendar</h2>
<table>
    <tr><th>Month</th><th>Compliance Activity</th></tr>
    <tr><td>January</td><td>Board strategy session</td></tr>
    <tr><td>February</td><td>Audit planning meeting</td></tr>
    <tr><td>March</td><td>Year-end financial close</td></tr>
    <tr><td>April</td><td>External audit commencement</td></tr>
    <tr><td>May</td><td>Draft AFS review</td></tr>
    <tr><td>June</td><td>AGM preparation / Audit completion</td></tr>
    <tr><td>July</td><td>Annual General Meeting</td></tr>
    <tr><td>August</td><td>Interim results preparation</td></tr>
    <tr><td>September</td><td>Interim results publication</td></tr>
    <tr><td>October</td><td>Board effectiveness review</td></tr>
    <tr><td>November</td><td>Budget approval</td></tr>
    <tr><td>December</td><td>Risk assessment update</td></tr>
</table>

<h2>Key Documents to Produce</h2>

<h3>Quarterly</h3>
<ul>
    <li>Management accounts</li>
    <li>Board pack with financial and operational KPIs</li>
    <li>Risk register update</li>
    <li>Committee meeting minutes</li>
</ul>

<h3>Annually</h3>
<ul>
    <li>Integrated Annual Report</li>
    <li>Annual Financial Statements (AFS)</li>
    <li>King IV compliance register</li>
    <li>B-BBEE certificate</li>
    <li>Tax computations and returns</li>
    <li>Directors' remuneration report</li>
    <li>Sustainability report</li>
</ul>
`;

const CONTENT_PART5 = `
<div style="page-break-before: always;"></div>

<!-- PART 5: FOUR-YEAR ROADMAP -->
<h1>Part 5: Four-Year Roadmap to IPO</h1>

<div class="phase-box">
    <div class="phase-title">Phase 1: Foundation (2026)</div>
    
    <h4>Q1 2026</h4>
    <ul class="checklist">
        <li>Formalize company structure (Pty Ltd to Ltd conversion plan)</li>
        <li>Appoint external auditors</li>
        <li>Implement IFRS-compliant accounting</li>
        <li>Draft shareholder agreement</li>
        <li>Establish governance charter</li>
    </ul>
    
    <h4>Q2 2026</h4>
    <ul class="checklist">
        <li>Appoint company secretary (or outsource)</li>
        <li>Form shadow board committees</li>
        <li>Implement risk management framework</li>
        <li>Begin ESG baseline assessment</li>
        <li>Document all policies and procedures</li>
    </ul>
    
    <h4>Q3 2026</h4>
    <ul class="checklist">
        <li>First quarterly board meeting (formal)</li>
        <li>Implement internal controls</li>
        <li>Begin investor relations documentation</li>
        <li>Create data room for future due diligence</li>
        <li>First-year business plan finalized</li>
    </ul>
    
    <h4>Q4 2026</h4>
    <ul class="checklist">
        <li>First external audit preparation</li>
        <li>Complete King IV gap analysis</li>
        <li>Seed funding round</li>
        <li>Advisory board formation</li>
        <li>Year 1 integrated report (internal)</li>
    </ul>
</div>

<div class="phase-box">
    <div class="phase-title">Phase 2: Growth (2027)</div>
    
    <h4>H1 2027</h4>
    <ul class="checklist">
        <li>Appoint first independent non-executive director</li>
        <li>Formalize audit committee</li>
        <li>Series A funding round</li>
        <li>Implement ERP system (if not done)</li>
        <li>Achieve B-BBEE Level 4 or better</li>
    </ul>
    
    <h4>H2 2027</h4>
    <ul class="checklist">
        <li>Appoint CFO (if not done)</li>
        <li>Full committee structure operational</li>
        <li>First published integrated report</li>
        <li>Employee share scheme design</li>
        <li>Strategic partnerships established</li>
    </ul>
</div>

<div class="phase-box">
    <div class="phase-title">Phase 3: Scale (2028)</div>
    
    <h4>H1 2028</h4>
    <ul class="checklist">
        <li>Consider AltX listing (optional stepping stone)</li>
        <li>Board at full complement (7 directors)</li>
        <li>Series B funding round</li>
        <li>B-BBEE Level 2 achieved</li>
        <li>Comprehensive insurance coverage</li>
    </ul>
    
    <h4>H2 2028</h4>
    <ul class="checklist">
        <li>Appoint designated adviser (if AltX route)</li>
        <li>Pre-listing statement drafting begins</li>
        <li>Independent valuation</li>
        <li>Three-year track record complete</li>
        <li>Management succession plan documented</li>
    </ul>
</div>
`;

const CONTENT_PART6 = `
<div style="page-break-before: always;"></div>

<div class="phase-box">
    <div class="phase-title">Phase 4: Pre-IPO (2029)</div>
    
    <h4>H1 2029</h4>
    <ul class="checklist">
        <li>Engage corporate advisor/sponsor</li>
        <li>Select lead bookrunner/underwriters</li>
        <li>Legal due diligence</li>
        <li>Pre-IPO funding round</li>
        <li>Roadshow preparation</li>
    </ul>
    
    <h4>H2 2029</h4>
    <ul class="checklist">
        <li>Pre-listing statement submission to JSE</li>
        <li>JSE review process</li>
        <li>Address all JSE queries</li>
        <li>Final board appointments</li>
        <li>Media and PR strategy</li>
    </ul>
</div>

<div class="phase-box" style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-color: #f59e0b;">
    <div class="phase-title" style="color: #b45309;">Phase 5: IPO (2030) 🔔</div>
    
    <h4>Q1 2030</h4>
    <ul class="checklist">
        <li>Final JSE approval</li>
        <li>Pricing determination</li>
        <li>Book building</li>
        <li>Allocation</li>
    </ul>
    
    <h4>Q2 2030</h4>
    <ul class="checklist">
        <li><strong>LISTING DAY</strong> 🎉</li>
        <li>First trading day</li>
        <li>Investor communications</li>
        <li>Ongoing compliance begins</li>
    </ul>
</div>

<hr>

<!-- PART 6: PROFESSIONAL ADVISORS -->
<h1>Part 6: Key Professional Advisors Needed</h1>

<h2>Immediate Appointments (2026)</h2>
<table>
    <tr><th>Advisor</th><th>Role</th><th>Estimated Annual Cost</th></tr>
    <tr><td>External Auditors</td><td>Annual audit, interim reviews</td><td>R150,000 - R500,000</td></tr>
    <tr><td>Company Secretary</td><td>Compliance, board support</td><td>R100,000 - R300,000</td></tr>
    <tr><td>Tax Advisor</td><td>Tax compliance, planning</td><td>R50,000 - R150,000</td></tr>
    <tr><td>Legal Counsel</td><td>Corporate law, contracts</td><td>R100,000 - R300,000</td></tr>
</table>

<h2>Pre-IPO Appointments (2029)</h2>
<table>
    <tr><th>Advisor</th><th>Role</th><th>Estimated One-time Cost</th></tr>
    <tr><td>JSE Sponsor</td><td>JSE liaison, documentation</td><td>R2 - R5 million</td></tr>
    <tr><td>Investment Bank</td><td>Bookrunner, underwriting</td><td>3-7% of capital raised</td></tr>
    <tr><td>Due Diligence Legal</td><td>Pre-listing statement</td><td>R1 - R3 million</td></tr>
    <tr><td>Valuation Specialist</td><td>Independent valuation</td><td>R500,000 - R1 million</td></tr>
    <tr><td>IR Consultant</td><td>Investor relations</td><td>R300,000 - R500,000</td></tr>
</table>

<h2>Total Estimated IPO Costs</h2>
<table>
    <tr><th>Category</th><th>Estimated Cost</th></tr>
    <tr><td>Professional fees</td><td>R10 - R15 million</td></tr>
    <tr><td>Underwriting fees (5%)</td><td>R25 million</td></tr>
    <tr><td>Marketing/Roadshow</td><td>R2 - R5 million</td></tr>
    <tr style="background: #fef3c7;"><td><strong>Total</strong></td><td><strong>R37 - R45 million</strong></td></tr>
</table>
`;

const CONTENT_PART7 = `
<div style="page-break-before: always;"></div>

<!-- PART 7: KPIs -->
<h1>Part 7: Key Performance Indicators (KPIs)</h1>

<h2>Financial KPIs</h2>
<table>
    <tr><th>KPI</th><th>Target</th></tr>
    <tr><td>Revenue growth rate</td><td>50%+ annually</td></tr>
    <tr><td>Gross profit margin</td><td>60%+</td></tr>
    <tr><td>EBITDA margin</td><td>25%+</td></tr>
    <tr><td>Return on equity</td><td>20%+</td></tr>
    <tr><td>Debt-to-equity ratio</td><td>&lt;0.5</td></tr>
    <tr><td>Cash conversion cycle</td><td>Monitored</td></tr>
    <tr><td>Customer acquisition cost (CAC)</td><td>Optimized</td></tr>
    <tr><td>Lifetime value (LTV)</td><td>Maximized</td></tr>
</table>

<h2>Operational KPIs</h2>
<table>
    <tr><th>KPI</th><th>Target</th></tr>
    <tr><td>Customer retention rate</td><td>90%+</td></tr>
    <tr><td>Net Promoter Score (NPS)</td><td>50+</td></tr>
    <tr><td>Employee satisfaction score</td><td>Monitored</td></tr>
    <tr><td>System uptime</td><td>99.9%</td></tr>
    <tr><td>Support ticket resolution time</td><td>Optimized</td></tr>
</table>

<h2>Governance KPIs</h2>
<table>
    <tr><th>KPI</th><th>Target</th></tr>
    <tr><td>Board meeting attendance</td><td>100%</td></tr>
    <tr><td>Audit findings remediation rate</td><td>100%</td></tr>
    <tr><td>Policy compliance rate</td><td>100%</td></tr>
    <tr><td>Regulatory filing timeliness</td><td>100%</td></tr>
    <tr><td>Diversity metrics achievement</td><td>On track</td></tr>
</table>

<h2>ESG KPIs</h2>
<table>
    <tr><th>KPI</th><th>Target</th></tr>
    <tr><td>Carbon footprint reduction</td><td>Year-on-year improvement</td></tr>
    <tr><td>B-BBEE scorecard improvement</td><td>Level 2 by 2028</td></tr>
    <tr><td>Employee training hours</td><td>40+ hours/employee/year</td></tr>
    <tr><td>Community investment</td><td>1% of profit</td></tr>
    <tr><td>Gender diversity in leadership</td><td>40% women</td></tr>
</table>

<hr>

<!-- PART 8: RISK REGISTER -->
<h1>Part 8: Risk Register</h1>

<table>
    <tr><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Mitigation</th></tr>
    <tr><td>Failure to achieve revenue targets</td><td class="risk-medium">Medium</td><td class="risk-high">High</td><td>Diversified revenue streams, aggressive sales</td></tr>
    <tr><td>Key person dependency</td><td class="risk-high">High</td><td class="risk-high">High</td><td>Succession planning, key-man insurance</td></tr>
    <tr><td>Regulatory changes</td><td class="risk-medium">Medium</td><td class="risk-medium">Medium</td><td>Ongoing compliance monitoring</td></tr>
    <tr><td>Market downturn at IPO</td><td class="risk-medium">Medium</td><td class="risk-high">High</td><td>Flexible timing, strong fundamentals</td></tr>
    <tr><td>Cybersecurity breach</td><td class="risk-medium">Medium</td><td class="risk-high">High</td><td>Robust IT security, insurance</td></tr>
    <tr><td>Competition</td><td class="risk-high">High</td><td class="risk-medium">Medium</td><td>Innovation, customer lock-in</td></tr>
    <tr><td>B-BBEE non-compliance</td><td class="risk-medium">Medium</td><td class="risk-high">High</td><td>Active transformation program</td></tr>
</table>
`;

const CONTENT_PART8 = `
<div style="page-break-before: always;"></div>

<!-- PART 9: IPO PROCESS -->
<h1>Part 9: The IPO Process Overview</h1>

<div class="diagram-box">
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IPO TIMELINE (12-18 months)                         │
└─────────────────────────────────────────────────────────────────────────────┘

Month 1-3: PREPARATION
├── Appoint advisors (sponsor, legal, auditors)
├── Due diligence begins
├── Valuation work
└── Corporate housekeeping

Month 4-6: DOCUMENTATION
├── Pre-listing statement drafting
├── Legal review
├── Board approvals
└── Auditor sign-off

Month 7-9: JSE REVIEW
├── Submit to JSE
├── JSE queries and responses
├── Amendments
└── Conditional approval

Month 10-12: MARKETING
├── Investor roadshow
├── Book building
├── Pricing
└── Allocation

Month 12+: LISTING
├── Final JSE approval
├── Listing day
├── First trade
└── Ongoing compliance
</div>

<hr>

<!-- PART 10: CHECKLIST -->
<h1>Part 10: Checklist - Running Like a Listed Company</h1>

<h3>Daily</h3>
<ul class="checklist">
    <li>Cash position monitoring</li>
    <li>Customer support metrics review</li>
    <li>Security monitoring</li>
</ul>

<h3>Weekly</h3>
<ul class="checklist">
    <li>Executive team meeting</li>
    <li>Sales pipeline review</li>
    <li>Financial dashboard review</li>
    <li>Risk incident review</li>
</ul>

<h3>Monthly</h3>
<ul class="checklist">
    <li>Board financial pack preparation</li>
    <li>Management accounts close</li>
    <li>KPI reporting</li>
    <li>Cash flow forecasting</li>
    <li>Regulatory compliance check</li>
</ul>

<h3>Quarterly</h3>
<ul class="checklist">
    <li>Board meeting</li>
    <li>Committee meetings</li>
    <li>Strategy review</li>
    <li>Investor update (when applicable)</li>
    <li>Risk register review</li>
</ul>

<h3>Annually</h3>
<ul class="checklist">
    <li>External audit</li>
    <li>AGM</li>
    <li>Integrated report</li>
    <li>Strategy away-day</li>
    <li>Board evaluation</li>
    <li>Director training</li>
    <li>Insurance review</li>
    <li>B-BBEE verification</li>
</ul>
`;

const CONTENT_FINAL = `
<div style="page-break-before: always;"></div>

<!-- CONCLUSION -->
<div class="conclusion-box">
    <h2>Conclusion</h2>
    <p>Listing on the JSE by 2030 is ambitious but achievable. The key is to:</p>
    <ol>
        <li><strong>Start operating like a listed company TODAY</strong></li>
        <li><strong>Build the governance infrastructure early</strong></li>
        <li><strong>Create a 3+ year audited track record</strong></li>
        <li><strong>Grow profitably and consistently</strong></li>
        <li><strong>Build relationships with potential investors</strong></li>
        <li><strong>Maintain impeccable compliance</strong></li>
    </ol>
</div>

<blockquote>
    <p>"The preparation for the IPO is the IPO. The listing day is just the announcement of work already done."</p>
</blockquote>

<hr>

<!-- APPENDIX A -->
<h1>Appendix A: Useful Contacts</h1>

<div class="appendix">
    <table>
        <tr><th>Organization</th><th>Purpose</th><th>Contact</th></tr>
        <tr><td>JSE Limited</td><td>Listing enquiries</td><td>+27 11 520 7000</td></tr>
        <tr><td>CIPC</td><td>Company registration</td><td>www.cipc.co.za</td></tr>
        <tr><td>SARS</td><td>Tax compliance</td><td>www.sars.gov.za</td></tr>
        <tr><td>B-BBEE Commission</td><td>Transformation</td><td>www.bbbeecommission.co.za</td></tr>
        <tr><td>IoDSA</td><td>Governance training</td><td>www.iodsa.co.za</td></tr>
    </table>
</div>

<hr>

<!-- APPENDIX B -->
<h1>Appendix B: Recommended Reading</h1>

<div class="appendix">
    <ol>
        <li><strong>King IV Report on Corporate Governance</strong> - IoDSA</li>
        <li><strong>JSE Listing Requirements</strong> - JSE Limited</li>
        <li><strong>Companies Act 71 of 2008</strong> - Republic of South Africa</li>
        <li><strong>IFRS Standards</strong> - IFRS Foundation</li>
        <li><strong>IPO Guide South Africa</strong> - Various law firms publish annually</li>
    </ol>
</div>

<hr>

<div style="text-align: center; margin-top: 40px; padding: 30px; background: #f8fafc; border-radius: 12px;">
    <p style="color: #6b7280; margin-bottom: 10px;"><strong>Document Prepared By:</strong> Masaphokati Technologies (Pty) Ltd Leadership Team</p>
    <p style="color: #6b7280; margin-bottom: 10px;"><strong>Date:</strong> January 6, 2026</p>
    <p style="color: #6b7280; margin-bottom: 20px;"><strong>Next Review:</strong> July 2026</p>
    <hr style="border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #1e3a8a; font-style: italic; font-size: 16px;">"God is the Power. I am the Vision. We are the Team. This is how we take over."</p>
</div>

</body>
</html>
`;

async function generatePDF() {
    console.log('📊 Generating JSE Listing Roadmap PDF...\n');
    console.log('   Applying Masaphokati brand standards...\n');

    const fullHTML = HTML_CONTENT + 
                     CONTENT_PART1 + 
                     CONTENT_PART2 + 
                     CONTENT_PART3 + 
                     CONTENT_PART4 + 
                     CONTENT_PART5 + 
                     CONTENT_PART6 + 
                     CONTENT_PART7 + 
                     CONTENT_PART8 + 
                     CONTENT_FINAL;

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

    const outputPath = path.join(__dirname, '..', 'succession', 'JSE-LISTING-ROADMAP-2030.pdf');

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

    console.log('✅ JSE Listing Roadmap PDF created successfully!\n');
    console.log(`📊 Output: ${outputPath}\n`);
    console.log('   "This is how we take over."\n');
}

generatePDF().catch(console.error);
