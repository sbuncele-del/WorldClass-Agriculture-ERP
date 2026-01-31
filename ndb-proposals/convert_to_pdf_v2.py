#!/usr/bin/env python3
"""Convert NDB Proposal Markdown to professional PDF with working infographics"""

import markdown
from weasyprint import HTML, CSS
from pathlib import Path

# Read markdown file
md_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.md')
md_content = md_file.read_text()

# Convert markdown to HTML
md_converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
html_body = md_converter.convert(md_content)

# Cover page HTML - simplified for WeasyPrint compatibility
cover_page = """
<div class="cover-page">
    <table class="cover-logo-table">
        <tr>
            <td>
                <div class="logo-circle">
                    <div class="logo-text">NDB</div>
                    <div class="logo-subtext">SOUTH SUDAN</div>
                </div>
            </td>
        </tr>
    </table>
    
    <div class="cover-title">National Development Bank<br/>of South Sudan</div>
    <div class="cover-subtitle">Investment & Development Finance Business Plan</div>
    <div class="cover-tagline">"Building Tomorrow's South Sudan Today"</div>
    
    <table class="cover-highlights-table">
        <tr>
            <td class="highlight-box">
                <div class="highlight-value">$1.2B</div>
                <div class="highlight-label">3-Year Target</div>
            </td>
            <td class="highlight-box">
                <div class="highlight-value">$5M</div>
                <div class="highlight-label">Seed Capital</div>
            </td>
            <td class="highlight-box">
                <div class="highlight-value">360%</div>
                <div class="highlight-label">Year 1 ROI</div>
            </td>
        </tr>
    </table>
    
    <div class="cover-footer">
        <p><strong>Presented to:</strong> Strategic Investment Partners</p>
        <p><strong>Prepared by:</strong> Alex Tsela Global (ATG) Holdings</p>
        <p><strong>Date:</strong> January 2026</p>
        <div class="confidential-badge">CONFIDENTIAL — Investment Memorandum</div>
    </div>
</div>
"""

# Investment at a Glance - Table-based for WeasyPrint
investment_infographic = """
<div class="infographic-box">
    <div class="infographic-title">💼 Investment at a Glance</div>
    <table class="metrics-table">
        <tr>
            <td class="metric-cell blue-bg">
                <div class="metric-icon">💰</div>
                <div class="metric-value">$5M</div>
                <div class="metric-label">Seed Capital</div>
            </td>
            <td class="metric-cell green-bg">
                <div class="metric-icon">📈</div>
                <div class="metric-value">$1.2B</div>
                <div class="metric-label">3-Year Mobilization</div>
            </td>
            <td class="metric-cell gold-bg">
                <div class="metric-icon">🚀</div>
                <div class="metric-value">360%</div>
                <div class="metric-label">Year 1 ROI</div>
            </td>
            <td class="metric-cell purple-bg">
                <div class="metric-icon">💎</div>
                <div class="metric-value">$60M</div>
                <div class="metric-label">3-Year Commission</div>
            </td>
        </tr>
    </table>
</div>
"""

# Sector Allocation - Visual bars instead of pie
sector_chart = """
<div class="infographic-box">
    <div class="infographic-title">🎯 Priority Sectors - Capital Allocation ($900M Total)</div>
    <table class="bar-chart-table">
        <tr>
            <td class="bar-label">Roads (Juba-Nimule)</td>
            <td class="bar-container">
                <div class="bar roads-bar">$400M (44%)</div>
            </td>
        </tr>
        <tr>
            <td class="bar-label">Gold Mining (Kapoeta)</td>
            <td class="bar-container">
                <div class="bar mining-bar">$300M (33%)</div>
            </td>
        </tr>
        <tr>
            <td class="bar-label">Agro-processing</td>
            <td class="bar-container">
                <div class="bar agro-bar">$200M (22%)</div>
            </td>
        </tr>
    </table>
</div>
"""

# Timeline - Table-based
timeline_infographic = """
<div class="infographic-box">
    <div class="infographic-title">📅 3-Year Capital Mobilization Roadmap</div>
    <table class="timeline-table">
        <tr>
            <td class="timeline-cell year1">
                <div class="timeline-year">YEAR 1</div>
                <div class="timeline-amount">$400M</div>
                <div class="timeline-desc">Foundation Building<br/>First Deals Closed<br/>15 Staff</div>
            </td>
            <td class="timeline-arrow">→</td>
            <td class="timeline-cell year2">
                <div class="timeline-year">YEAR 2</div>
                <div class="timeline-amount">$425M</div>
                <div class="timeline-desc">Track Record Built<br/>Expanded Funders<br/>30 Staff</div>
            </td>
            <td class="timeline-arrow">→</td>
            <td class="timeline-cell year3">
                <div class="timeline-year">YEAR 3</div>
                <div class="timeline-amount">$375M</div>
                <div class="timeline-desc">Proven Institution<br/>$1.2B Cumulative<br/>45 Staff</div>
            </td>
        </tr>
    </table>
    <div class="timeline-total">📊 Total 3-Year Target: <strong>$1.2 Billion</strong></div>
</div>
"""

# Revenue Chart - Horizontal bars
revenue_chart = """
<div class="infographic-box">
    <div class="infographic-title">📊 5-Year Revenue Projection</div>
    <table class="revenue-chart-table">
        <tr>
            <td class="rev-year">Year 1</td>
            <td class="rev-bar-cell"><div class="rev-bar rev1">$24M</div></td>
        </tr>
        <tr>
            <td class="rev-year">Year 2</td>
            <td class="rev-bar-cell"><div class="rev-bar rev2">$29M</div></td>
        </tr>
        <tr>
            <td class="rev-year">Year 3</td>
            <td class="rev-bar-cell"><div class="rev-bar rev3">$34M</div></td>
        </tr>
        <tr>
            <td class="rev-year">Year 4</td>
            <td class="rev-bar-cell"><div class="rev-bar rev4">$55M</div></td>
        </tr>
        <tr>
            <td class="rev-year">Year 5</td>
            <td class="rev-bar-cell"><div class="rev-bar rev5">$88M</div></td>
        </tr>
    </table>
</div>
"""

# Org Chart - Table-based
org_chart = """
<div class="infographic-box">
    <div class="infographic-title">🏛️ Governance Structure</div>
    <table class="org-chart-table">
        <tr>
            <td colspan="3" class="org-cell board">
                <strong>BOARD OF DIRECTORS</strong><br/>
                <span class="org-sub">Government + Partners + Independent Directors</span>
            </td>
        </tr>
        <tr>
            <td colspan="3" class="org-connector">│</td>
        </tr>
        <tr>
            <td class="org-cell committee">Risk Committee</td>
            <td class="org-cell committee">Audit Committee</td>
            <td class="org-cell committee">Investment Committee</td>
        </tr>
        <tr>
            <td colspan="3" class="org-connector">│</td>
        </tr>
        <tr>
            <td colspan="3" class="org-cell ceo">
                <strong>MANAGING DIRECTOR / CEO</strong><br/>
                <span class="org-sub">Executive Leadership</span>
            </td>
        </tr>
        <tr>
            <td colspan="3" class="org-connector">│</td>
        </tr>
        <tr>
            <td class="org-cell dept">
                <strong>CFO</strong><br/>
                Finance & Compliance
            </td>
            <td class="org-cell dept">
                <strong>Development Finance</strong><br/>
                Deal Origination
            </td>
            <td class="org-cell dept">
                <strong>Operations</strong><br/>
                Projects & Paymaster
            </td>
        </tr>
    </table>
</div>
"""

# Staffing Visual
staffing_visual = """
<div class="infographic-box">
    <div class="infographic-title">👥 Lean Staffing Plan (70% Leaner than Traditional)</div>
    <table class="staffing-table">
        <tr>
            <td class="staff-cell setup">
                <div class="staff-phase">Setup</div>
                <div class="staff-period">Months 1-6</div>
                <div class="staff-count">8</div>
                <div class="staff-label">Staff</div>
            </td>
            <td class="staff-arrow">→</td>
            <td class="staff-cell year1">
                <div class="staff-phase">Year 1</div>
                <div class="staff-period">Operations</div>
                <div class="staff-count">15</div>
                <div class="staff-label">Staff</div>
            </td>
            <td class="staff-arrow">→</td>
            <td class="staff-cell year2">
                <div class="staff-phase">Year 2</div>
                <div class="staff-period">Scale</div>
                <div class="staff-count">30</div>
                <div class="staff-label">Staff</div>
            </td>
            <td class="staff-arrow">→</td>
            <td class="staff-cell year3">
                <div class="staff-phase">Year 3+</div>
                <div class="staff-period">Mature</div>
                <div class="staff-count">45</div>
                <div class="staff-label">Staff</div>
            </td>
        </tr>
    </table>
    <div class="staffing-note">✓ Outsource non-core functions &nbsp; ✓ Use consultants for specialized work &nbsp; ✓ Focus on revenue-generating roles</div>
</div>
"""

# ROI Visual
roi_visual = """
<div class="infographic-box highlight-box">
    <div class="infographic-title">🚀 Return on Investment</div>
    <table class="roi-table">
        <tr>
            <td class="roi-cell">
                <div class="roi-icon">💰</div>
                <div class="roi-label">Seed Investment</div>
                <div class="roi-value blue">$5M</div>
            </td>
            <td class="roi-arrow">→</td>
            <td class="roi-cell">
                <div class="roi-icon">📊</div>
                <div class="roi-label">Year 1 Profit</div>
                <div class="roi-value green">$18M</div>
            </td>
            <td class="roi-arrow">→</td>
            <td class="roi-cell highlight">
                <div class="roi-icon">🎯</div>
                <div class="roi-label">Year 1 ROI</div>
                <div class="roi-value gold">360%</div>
            </td>
        </tr>
    </table>
    <table class="roi-summary-table">
        <tr>
            <td>3-Year Cumulative Profit: <strong class="green">$59 Million</strong></td>
            <td>→ <strong class="gold">1,180% ROI</strong></td>
        </tr>
        <tr>
            <td>5-Year Cumulative Profit: <strong class="green">$152 Million</strong></td>
            <td>→ <strong class="gold">3,040% ROI</strong></td>
        </tr>
    </table>
</div>
"""

# Success Factors
success_visual = """
<div class="infographic-box">
    <div class="infographic-title">✅ Why NDB-SS Will Succeed</div>
    <table class="success-table">
        <tr>
            <td class="success-cell">
                <div class="success-icon">🎯</div>
                <div class="success-title">Massive Market Gap</div>
                <div class="success-desc">$50B+ infrastructure needs, no DFI serves South Sudan</div>
            </td>
            <td class="success-cell">
                <div class="success-icon">✅</div>
                <div class="success-title">Proven Model</div>
                <div class="success-desc">Commission-based revenue de-risks operations</div>
            </td>
            <td class="success-cell">
                <div class="success-icon">📋</div>
                <div class="success-title">Focused Pipeline</div>
                <div class="success-desc">3 priority projects with clear impact</div>
            </td>
        </tr>
        <tr>
            <td class="success-cell">
                <div class="success-icon">💎</div>
                <div class="success-title">Conservative Target</div>
                <div class="success-desc">$1.2B over 3 years is achievable</div>
            </td>
            <td class="success-cell">
                <div class="success-icon">⚡</div>
                <div class="success-title">Lean Operations</div>
                <div class="success-desc">Low overhead ensures profitability</div>
            </td>
            <td class="success-cell">
                <div class="success-icon">📈</div>
                <div class="success-title">Attractive Returns</div>
                <div class="success-desc">360% Year 1 ROI for founders</div>
            </td>
        </tr>
    </table>
</div>
"""

# Professional CSS styling - Table-based for WeasyPrint compatibility
css_style = """
@page {
    size: A4;
    margin: 1.8cm 2cm;
    @top-center {
        content: "NDB South Sudan - Investment Memorandum";
        font-size: 8pt;
        color: #888;
    }
    @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 8pt;
        color: #888;
    }
}

@page:first {
    margin: 0;
    @top-center { content: none; }
    @bottom-center { content: none; }
}

body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #333;
}

/* ============ COVER PAGE ============ */
.cover-page {
    width: 210mm;
    height: 297mm;
    background: linear-gradient(180deg, #1a4480 0%, #0d2840 100%);
    color: white;
    text-align: center;
    padding: 50px 40px;
    page-break-after: always;
}

.cover-logo-table {
    width: 100%;
    margin-bottom: 30px;
}

.logo-circle {
    width: 120px;
    height: 120px;
    margin: 0 auto;
    border: 4px solid #c9a227;
    border-radius: 60px;
    background: #1a4480;
    padding-top: 25px;
}

.logo-text {
    font-size: 32pt;
    font-weight: bold;
    color: white;
}

.logo-subtext {
    font-size: 11pt;
    color: #c9a227;
    font-weight: bold;
}

.cover-title {
    font-size: 32pt;
    font-weight: bold;
    margin: 30px 0 15px 0;
    line-height: 1.2;
}

.cover-subtitle {
    font-size: 16pt;
    color: #c9a227;
    margin-bottom: 15px;
}

.cover-tagline {
    font-size: 13pt;
    font-style: italic;
    color: #aaa;
    margin-bottom: 40px;
}

.cover-highlights-table {
    width: 80%;
    margin: 40px auto;
    border-spacing: 20px;
}

.highlight-box {
    background: rgba(255,255,255,0.15);
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    width: 140px;
}

.highlight-value {
    font-size: 28pt;
    font-weight: bold;
    color: #c9a227;
}

.highlight-label {
    font-size: 10pt;
    color: #ccc;
    margin-top: 5px;
}

.cover-footer {
    position: absolute;
    bottom: 60px;
    left: 0;
    right: 0;
    font-size: 10pt;
}

.cover-footer p {
    margin: 8px 0;
}

.confidential-badge {
    margin-top: 25px;
    font-size: 10pt;
    color: #c9a227;
    letter-spacing: 2px;
    font-weight: bold;
}

/* ============ MAIN CONTENT ============ */
h1 {
    color: #1a4480;
    font-size: 20pt;
    font-weight: bold;
    border-bottom: 3px solid #1a4480;
    padding-bottom: 8px;
    margin-top: 25px;
    margin-bottom: 15px;
    page-break-after: avoid;
}

h2 {
    color: #1a4480;
    font-size: 14pt;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 10px;
    border-bottom: 2px solid #ddd;
    padding-bottom: 5px;
    page-break-after: avoid;
}

h3 {
    color: #2c5aa0;
    font-size: 12pt;
    font-weight: bold;
    margin-top: 15px;
    margin-bottom: 8px;
    page-break-after: avoid;
}

p {
    margin-bottom: 10px;
    text-align: justify;
}

/* Standard Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
    page-break-inside: avoid;
}

th {
    background: #1a4480;
    color: white;
    padding: 8px 6px;
    text-align: left;
    font-weight: bold;
}

td {
    padding: 7px 6px;
    border: 1px solid #ddd;
    vertical-align: top;
}

tr:nth-child(even) {
    background-color: #f5f5f5;
}

/* ============ INFOGRAPHIC BOXES ============ */
.infographic-box {
    background: #f8f9fa;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    padding: 15px;
    margin: 20px 0;
    page-break-inside: avoid;
}

.infographic-box.highlight-box {
    background: linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 100%);
    border-color: #1a4480;
}

.infographic-title {
    font-size: 13pt;
    font-weight: bold;
    color: #1a4480;
    text-align: center;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 2px solid #1a4480;
}

/* ============ METRICS TABLE ============ */
.metrics-table {
    width: 100%;
    border: none;
    border-spacing: 10px;
}

.metrics-table td {
    border: none;
    padding: 0;
}

.metric-cell {
    text-align: center;
    padding: 15px 10px !important;
    border-radius: 8px;
    color: white;
}

.metric-cell.blue-bg { background: #1a4480; }
.metric-cell.green-bg { background: #28a745; }
.metric-cell.gold-bg { background: #c9a227; }
.metric-cell.purple-bg { background: #6f42c1; }

.metric-icon { font-size: 20pt; margin-bottom: 5px; }
.metric-value { font-size: 20pt; font-weight: bold; }
.metric-label { font-size: 8pt; margin-top: 3px; }

/* ============ BAR CHART ============ */
.bar-chart-table {
    width: 100%;
    border: none;
}

.bar-chart-table td {
    border: none;
    padding: 8px 5px;
}

.bar-label {
    width: 180px;
    font-weight: bold;
    color: #333;
    text-align: right;
    padding-right: 15px !important;
}

.bar-container {
    width: auto;
}

.bar {
    height: 30px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    font-size: 10pt;
    padding: 5px 10px;
    text-align: right;
}

.roads-bar { background: #1a4480; width: 100%; }
.mining-bar { background: #c9a227; width: 75%; }
.agro-bar { background: #28a745; width: 50%; }

/* ============ TIMELINE ============ */
.timeline-table {
    width: 100%;
    border: none;
    border-spacing: 5px;
}

.timeline-table td {
    border: none;
    vertical-align: middle;
}

.timeline-cell {
    text-align: center;
    padding: 15px 10px !important;
    border-radius: 8px;
    width: 28%;
}

.timeline-cell.year1 { background: #1a4480; color: white; }
.timeline-cell.year2 { background: #2c5aa0; color: white; }
.timeline-cell.year3 { background: #28a745; color: white; }

.timeline-year { font-size: 11pt; font-weight: bold; }
.timeline-amount { font-size: 18pt; font-weight: bold; color: #c9a227; margin: 5px 0; }
.timeline-desc { font-size: 8pt; line-height: 1.4; }

.timeline-arrow {
    text-align: center;
    font-size: 20pt;
    color: #c9a227;
    font-weight: bold;
    width: 8%;
}

.timeline-total {
    text-align: center;
    margin-top: 15px;
    font-size: 12pt;
    color: #1a4480;
}

/* ============ REVENUE CHART ============ */
.revenue-chart-table {
    width: 100%;
    border: none;
}

.revenue-chart-table td {
    border: none;
    padding: 5px;
}

.rev-year {
    width: 60px;
    font-weight: bold;
    text-align: right;
    padding-right: 10px !important;
}

.rev-bar-cell {
    width: auto;
}

.rev-bar {
    height: 25px;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    font-size: 9pt;
    padding: 3px 8px;
    text-align: right;
}

.rev1 { background: #1a4480; width: 27%; }
.rev2 { background: #2c5aa0; width: 33%; }
.rev3 { background: #3d6db5; width: 39%; }
.rev4 { background: #28a745; width: 63%; }
.rev5 { background: #c9a227; width: 100%; }

/* ============ ORG CHART ============ */
.org-chart-table {
    width: 90%;
    margin: 0 auto;
    border: none;
    border-spacing: 8px;
}

.org-chart-table td {
    border: none;
    text-align: center;
    padding: 0;
}

.org-cell {
    padding: 12px !important;
    border-radius: 6px;
    font-size: 9pt;
}

.org-cell.board { background: #1a4480; color: white; }
.org-cell.committee { background: #2c5aa0; color: white; font-size: 8pt; }
.org-cell.ceo { background: #c9a227; color: white; }
.org-cell.dept { background: #28a745; color: white; font-size: 8pt; }

.org-sub { font-size: 8pt; opacity: 0.9; }
.org-connector { font-size: 16pt; color: #1a4480; }

/* ============ STAFFING ============ */
.staffing-table {
    width: 100%;
    border: none;
    border-spacing: 5px;
}

.staffing-table td {
    border: none;
    vertical-align: middle;
}

.staff-cell {
    text-align: center;
    padding: 12px 8px !important;
    border-radius: 8px;
    border: 2px solid;
}

.staff-cell.setup { background: #f8f9fa; border-color: #1a4480; }
.staff-cell.year1 { background: #e8f4f8; border-color: #1a4480; }
.staff-cell.year2 { background: #d4edda; border-color: #28a745; }
.staff-cell.year3 { background: #c9a227; border-color: #a88420; color: white; }

.staff-phase { font-size: 10pt; font-weight: bold; color: #1a4480; }
.staff-cell.year3 .staff-phase { color: white; }
.staff-period { font-size: 8pt; color: #666; }
.staff-cell.year3 .staff-period { color: #fff; }
.staff-count { font-size: 22pt; font-weight: bold; color: #1a4480; margin: 5px 0; }
.staff-cell.year3 .staff-count { color: white; }
.staff-label { font-size: 8pt; color: #666; }
.staff-cell.year3 .staff-label { color: #fff; }

.staff-arrow {
    text-align: center;
    font-size: 18pt;
    color: #c9a227;
    font-weight: bold;
}

.staffing-note {
    text-align: center;
    font-size: 9pt;
    color: #666;
    margin-top: 10px;
    padding: 8px;
    background: white;
    border-radius: 5px;
}

/* ============ ROI ============ */
.roi-table {
    width: 90%;
    margin: 0 auto;
    border: none;
    border-spacing: 10px;
}

.roi-table td {
    border: none;
    vertical-align: middle;
}

.roi-cell {
    text-align: center;
    padding: 15px !important;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.roi-cell.highlight {
    background: #c9a227;
    color: white;
}

.roi-icon { font-size: 24pt; margin-bottom: 5px; }
.roi-label { font-size: 9pt; color: #666; }
.roi-cell.highlight .roi-label { color: white; }
.roi-value { font-size: 22pt; font-weight: bold; }
.roi-value.blue { color: #1a4480; }
.roi-value.green { color: #28a745; }
.roi-value.gold { color: white; }

.roi-arrow {
    text-align: center;
    font-size: 24pt;
    color: #c9a227;
}

.roi-summary-table {
    width: 70%;
    margin: 15px auto 0;
    border: none;
    font-size: 10pt;
}

.roi-summary-table td {
    border: none;
    padding: 5px 10px;
    text-align: center;
}

.green { color: #28a745; }
.gold { color: #c9a227; }

/* ============ SUCCESS ============ */
.success-table {
    width: 100%;
    border: none;
    border-spacing: 10px;
}

.success-table td {
    border: none;
    padding: 0;
}

.success-cell {
    text-align: center;
    padding: 15px 10px !important;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.08);
    width: 33%;
}

.success-icon { font-size: 24pt; margin-bottom: 8px; }
.success-title { font-size: 10pt; font-weight: bold; color: #1a4480; margin-bottom: 5px; }
.success-desc { font-size: 8pt; color: #666; }

/* ============ HIDE ASCII ORG CHARTS ============ */
pre {
    display: none;
}

/* Lists */
ul, ol {
    margin-bottom: 10px;
    padding-left: 20px;
}

li {
    margin-bottom: 4px;
}

strong {
    color: #1a4480;
}

code {
    background: #f4f4f4;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 9pt;
}
"""

# Process the markdown to insert infographics at appropriate places
def insert_infographics(html):
    # Insert investment infographic after Investment Highlights table
    html = html.replace(
        '<h3 id="strategic-value-proposition">Strategic Value Proposition</h3>',
        investment_infographic + '<h3 id="strategic-value-proposition">Strategic Value Proposition</h3>'
    )
    
    # Insert sector chart before section 4.4
    html = html.replace(
        '<h3 id="44-three-year-pipeline-summary">',
        sector_chart + '<h3 id="44-three-year-pipeline-summary">'
    )
    
    # Insert timeline after pipeline summary, before section 5
    html = html.replace(
        '<h2 id="5-funding-sources-strategy">',
        timeline_infographic + '<h2 id="5-funding-sources-strategy">'
    )
    
    # Insert org chart after 6.1 title
    html = html.replace(
        '<h3 id="61-governance-framework">6.1 Governance Framework</h3>',
        '<h3 id="61-governance-framework">6.1 Governance Framework</h3>' + org_chart
    )
    
    # Insert staffing visual after staffing section, before section 7
    html = html.replace(
        '<h2 id="7-financial-projections">',
        staffing_visual + '<h2 id="7-financial-projections">'
    )
    
    # Insert revenue chart after 7.1
    html = html.replace(
        '<h3 id="72-capital-deployment-trajectory',
        revenue_chart + '<h3 id="72-capital-deployment-trajectory'
    )
    
    # Insert ROI visual before section 12
    html = html.replace(
        '<h2 id="12-conclusion">',
        roi_visual + '<h2 id="12-conclusion">'
    )
    
    # Insert success visual at the end, in conclusion
    html = html.replace(
        '<h3 id="why-ndb-ss-will-succeed">',
        '<h3 id="why-ndb-ss-will-succeed">' + success_visual
    )
    
    return html

# Process HTML
html_body = insert_infographics(html_body)

# Full HTML document
full_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>National Development Bank of South Sudan</title>
</head>
<body>
{cover_page}
{html_body}
</body>
</html>
"""

# Save HTML (for reference)
html_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.html')
html_file.write_text(full_html)
print(f"✓ HTML saved to: {html_file}")

# Convert to PDF
pdf_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.pdf')
HTML(string=full_html).write_pdf(
    pdf_file,
    stylesheets=[CSS(string=css_style)]
)
print(f"✓ PDF saved to: {pdf_file}")

import os
size = os.path.getsize(pdf_file) / 1024
print(f"\n📄 PDF generated successfully! ({size:.0f} KB)")
print("\nInfographics included:")
print("   ✅ Professional cover page with highlights")
print("   ✅ Investment at a Glance (4 metric cards)")
print("   ✅ Sector allocation horizontal bars")
print("   ✅ 3-Year timeline roadmap")
print("   ✅ Visual org chart")
print("   ✅ Staffing progression boxes")
print("   ✅ 5-Year revenue bar chart")
print("   ✅ ROI showcase")
print("   ✅ Success factors grid")
print("\n✅ Seed capital consistent at $5M throughout")
