#!/usr/bin/env python3
"""Convert NDB Proposal Markdown to professional PDF - Fixed Version"""

import markdown
from weasyprint import HTML, CSS
from pathlib import Path

# Read markdown file
md_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.md')
md_content = md_file.read_text()

# Update company name in markdown content
md_content = md_content.replace('Alex Tsela Global (ATG) Holdings', 'Alex Tsela Global Finance')

# Convert markdown to HTML
md_converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
html_body = md_converter.convert(md_content)

# Cover page HTML - FIXED layout
cover_page = """
<div class="cover-page">
    <div class="cover-content">
        <div class="logo-container">
            <div class="logo-circle">
                <span class="logo-ndb">NDB</span>
                <span class="logo-ss">SOUTH SUDAN</span>
            </div>
        </div>
        
        <h1 class="cover-main-title">National Development Bank<br/>of South Sudan</h1>
        <p class="cover-subtitle">Investment & Development Finance Business Plan</p>
        <p class="cover-tagline">"Building Tomorrow's South Sudan Today"</p>
        
        <table class="cover-metrics">
            <tr>
                <td class="metric-box">
                    <span class="metric-val">$1.2B</span>
                    <span class="metric-lbl">3-Year Target</span>
                </td>
                <td class="metric-box">
                    <span class="metric-val">$5M</span>
                    <span class="metric-lbl">Seed Capital</span>
                </td>
                <td class="metric-box">
                    <span class="metric-val">360%</span>
                    <span class="metric-lbl">Year 1 ROI</span>
                </td>
            </tr>
        </table>
        
        <div class="cover-footer-info">
            <p><strong>Presented to:</strong> Strategic Investment Partners</p>
            <p><strong>Prepared by:</strong> Alex Tsela Global Finance</p>
            <p><strong>Contact:</strong> Alex@satsi.co.za | +27 66 472 5666</p>
            <p><strong>Date:</strong> January 2026</p>
            <p class="confidential">CONFIDENTIAL — Investment Memorandum</p>
        </div>
    </div>
</div>
"""

# Investment at a Glance
investment_infographic = """
<div class="info-box">
    <p class="info-title">💼 Investment at a Glance</p>
    <table class="metrics-grid">
        <tr>
            <td class="m-card blue"><span class="m-icon">💰</span><span class="m-val">$5M</span><span class="m-lbl">Seed Capital</span></td>
            <td class="m-card green"><span class="m-icon">📈</span><span class="m-val">$1.2B</span><span class="m-lbl">3-Year Mobilization</span></td>
            <td class="m-card gold"><span class="m-icon">🚀</span><span class="m-val">360%</span><span class="m-lbl">Year 1 ROI</span></td>
            <td class="m-card purple"><span class="m-icon">💎</span><span class="m-val">$60M</span><span class="m-lbl">3-Year Commission</span></td>
        </tr>
    </table>
</div>
"""

# Sector Allocation Chart
sector_chart = """
<div class="info-box">
    <p class="info-title">🎯 Priority Sectors - Capital Allocation ($900M Total)</p>
    <table class="bar-table">
        <tr>
            <td class="bar-lbl">Roads (Juba-Nimule)</td>
            <td class="bar-cell"><div class="hbar roads">$400M (44%)</div></td>
        </tr>
        <tr>
            <td class="bar-lbl">Gold Mining (Kapoeta)</td>
            <td class="bar-cell"><div class="hbar mining">$300M (33%)</div></td>
        </tr>
        <tr>
            <td class="bar-lbl">Agro-processing</td>
            <td class="bar-cell"><div class="hbar agro">$200M (22%)</div></td>
        </tr>
    </table>
</div>
"""

# Timeline
timeline_infographic = """
<div class="info-box">
    <p class="info-title">📅 3-Year Capital Mobilization Roadmap</p>
    <table class="timeline-grid">
        <tr>
            <td class="tl-box y1">
                <span class="tl-yr">YEAR 1</span>
                <span class="tl-amt">$400M</span>
                <span class="tl-txt">Foundation Building • First Deals • 15 Staff</span>
            </td>
            <td class="tl-arrow">➜</td>
            <td class="tl-box y2">
                <span class="tl-yr">YEAR 2</span>
                <span class="tl-amt">$425M</span>
                <span class="tl-txt">Track Record Built • Expanded Funders • 30 Staff</span>
            </td>
            <td class="tl-arrow">➜</td>
            <td class="tl-box y3">
                <span class="tl-yr">YEAR 3</span>
                <span class="tl-amt">$375M</span>
                <span class="tl-txt">Proven Institution • $1.2B Cumulative • 45 Staff</span>
            </td>
        </tr>
    </table>
    <p class="tl-total">📊 Total 3-Year Target: <strong>$1.2 Billion</strong></p>
</div>
"""

# Revenue Chart
revenue_chart = """
<div class="info-box">
    <p class="info-title">📊 5-Year Revenue Projection</p>
    <table class="rev-table">
        <tr><td class="rev-yr">Year 1</td><td class="rev-bar-td"><div class="rev-bar r1">$24M</div></td></tr>
        <tr><td class="rev-yr">Year 2</td><td class="rev-bar-td"><div class="rev-bar r2">$29M</div></td></tr>
        <tr><td class="rev-yr">Year 3</td><td class="rev-bar-td"><div class="rev-bar r3">$34M</div></td></tr>
        <tr><td class="rev-yr">Year 4</td><td class="rev-bar-td"><div class="rev-bar r4">$55M</div></td></tr>
        <tr><td class="rev-yr">Year 5</td><td class="rev-bar-td"><div class="rev-bar r5">$88M</div></td></tr>
    </table>
</div>
"""

# Org Chart
org_chart = """
<div class="info-box">
    <p class="info-title">🏛️ Governance Structure</p>
    <table class="org-table">
        <tr><td colspan="3" class="org-box board"><strong>BOARD OF DIRECTORS</strong><br/><small>Government + Partners + Independent Directors</small></td></tr>
        <tr><td colspan="3" class="org-line">│</td></tr>
        <tr>
            <td class="org-box comm">Risk Committee</td>
            <td class="org-box comm">Audit Committee</td>
            <td class="org-box comm">Investment Committee</td>
        </tr>
        <tr><td colspan="3" class="org-line">│</td></tr>
        <tr><td colspan="3" class="org-box ceo"><strong>MANAGING DIRECTOR / CEO</strong></td></tr>
        <tr><td colspan="3" class="org-line">│</td></tr>
        <tr>
            <td class="org-box dept"><strong>CFO</strong><br/>Finance & Compliance</td>
            <td class="org-box dept"><strong>Development Finance</strong><br/>Deal Origination</td>
            <td class="org-box dept"><strong>Operations</strong><br/>Projects & Paymaster</td>
        </tr>
    </table>
</div>
"""

# Staffing Visual
staffing_visual = """
<div class="info-box">
    <p class="info-title">👥 Lean Staffing Plan (70% Leaner)</p>
    <table class="staff-table">
        <tr>
            <td class="staff-box s0"><span class="s-phase">Setup</span><span class="s-num">8</span><span class="s-lbl">Staff</span></td>
            <td class="staff-arr">➜</td>
            <td class="staff-box s1"><span class="s-phase">Year 1</span><span class="s-num">15</span><span class="s-lbl">Staff</span></td>
            <td class="staff-arr">➜</td>
            <td class="staff-box s2"><span class="s-phase">Year 2</span><span class="s-num">30</span><span class="s-lbl">Staff</span></td>
            <td class="staff-arr">➜</td>
            <td class="staff-box s3"><span class="s-phase">Year 3+</span><span class="s-num">45</span><span class="s-lbl">Staff</span></td>
        </tr>
    </table>
    <p class="staff-note">✓ Outsource non-core functions ✓ Use consultants ✓ Focus on revenue-generating roles</p>
</div>
"""

# ROI Visual
roi_visual = """
<div class="info-box highlight">
    <p class="info-title">🚀 Return on Investment</p>
    <table class="roi-grid">
        <tr>
            <td class="roi-box"><span class="roi-icon">💰</span><span class="roi-lbl">Seed Investment</span><span class="roi-val blue">$5M</span></td>
            <td class="roi-arr">➜</td>
            <td class="roi-box"><span class="roi-icon">📊</span><span class="roi-lbl">Year 1 Profit</span><span class="roi-val green">$18M</span></td>
            <td class="roi-arr">➜</td>
            <td class="roi-box gold-box"><span class="roi-icon">🎯</span><span class="roi-lbl">Year 1 ROI</span><span class="roi-val">360%</span></td>
        </tr>
    </table>
    <table class="roi-summary">
        <tr><td>3-Year Cumulative Profit: <strong class="green">$59 Million</strong></td><td class="roi-pct">➜ <strong class="gold">1,180% ROI</strong></td></tr>
        <tr><td>5-Year Cumulative Profit: <strong class="green">$152 Million</strong></td><td class="roi-pct">➜ <strong class="gold">3,040% ROI</strong></td></tr>
    </table>
</div>
"""

# Success Visual
success_visual = """
<div class="info-box">
    <p class="info-title">✅ Why NDB-SS Will Succeed</p>
    <table class="success-grid">
        <tr>
            <td class="success-box"><span class="suc-icon">🎯</span><span class="suc-title">Massive Market Gap</span><span class="suc-txt">$50B+ infrastructure needs</span></td>
            <td class="success-box"><span class="suc-icon">✅</span><span class="suc-title">Proven Model</span><span class="suc-txt">Commission-based revenue</span></td>
            <td class="success-box"><span class="suc-icon">📋</span><span class="suc-title">Focused Pipeline</span><span class="suc-txt">3 priority projects</span></td>
        </tr>
        <tr>
            <td class="success-box"><span class="suc-icon">💎</span><span class="suc-title">Conservative Target</span><span class="suc-txt">$1.2B over 3 years</span></td>
            <td class="success-box"><span class="suc-icon">⚡</span><span class="suc-title">Lean Operations</span><span class="suc-txt">Profitable from Year 1</span></td>
            <td class="success-box"><span class="suc-icon">📈</span><span class="suc-title">Attractive Returns</span><span class="suc-txt">360% Year 1 ROI</span></td>
        </tr>
    </table>
</div>
"""

# CSS - FIXED
css_style = """
@page {
    size: A4;
    margin: 2cm 2cm 2.5cm 2cm;
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

@page cover {
    margin: 0;
    @top-center { content: none; }
    @bottom-center { content: none; }
}

* { box-sizing: border-box; }

body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #333;
}

/* ========== COVER PAGE ========== */
.cover-page {
    page: cover;
    width: 210mm;
    height: 297mm;
    background: #1a4480;
    background: linear-gradient(180deg, #1a4480 0%, #0d2840 100%);
    color: white;
    text-align: center;
    padding: 0;
    page-break-after: always;
}

.cover-content {
    padding: 40px 50px;
}

.logo-container {
    margin-bottom: 25px;
}

.logo-circle {
    display: inline-block;
    width: 110px;
    height: 110px;
    border: 4px solid #c9a227;
    border-radius: 55px;
    padding-top: 20px;
    background: rgba(255,255,255,0.1);
}

.logo-ndb {
    display: block;
    font-size: 28pt;
    font-weight: bold;
    color: white;
}

.logo-ss {
    display: block;
    font-size: 10pt;
    color: #c9a227;
    font-weight: bold;
    margin-top: 2px;
}

.cover-main-title {
    font-size: 28pt;
    font-weight: bold;
    margin: 20px 0 10px 0;
    line-height: 1.2;
    color: white;
    border: none;
}

.cover-subtitle {
    font-size: 14pt;
    color: #c9a227;
    margin: 0 0 10px 0;
}

.cover-tagline {
    font-size: 12pt;
    font-style: italic;
    color: #aaa;
    margin: 0 0 30px 0;
}

.cover-metrics {
    width: 80%;
    margin: 30px auto;
    border-collapse: separate;
    border-spacing: 15px;
}

.cover-metrics td {
    border: none;
    padding: 0;
}

.metric-box {
    background: rgba(255,255,255,0.15);
    border-radius: 8px;
    padding: 18px 15px;
    text-align: center;
    vertical-align: middle;
}

.metric-val {
    display: block;
    font-size: 24pt;
    font-weight: bold;
    color: #c9a227;
}

.metric-lbl {
    display: block;
    font-size: 9pt;
    color: #ccc;
    margin-top: 5px;
}

.cover-footer-info {
    margin-top: 40px;
    font-size: 10pt;
}

.cover-footer-info p {
    margin: 6px 0;
    text-align: center;
}

.cover-footer-info .confidential {
    margin-top: 20px;
    font-size: 10pt;
    color: #c9a227;
    letter-spacing: 1px;
    font-weight: bold;
}

/* ========== HEADINGS ========== */
h1 {
    color: #1a4480;
    font-size: 18pt;
    font-weight: bold;
    border-bottom: 3px solid #1a4480;
    padding-bottom: 6px;
    margin-top: 20px;
    margin-bottom: 12px;
    page-break-after: avoid;
}

h2 {
    color: #1a4480;
    font-size: 14pt;
    font-weight: bold;
    margin-top: 18px;
    margin-bottom: 10px;
    border-bottom: 2px solid #ddd;
    padding-bottom: 4px;
    page-break-after: avoid;
    page-break-before: always;
}

/* First h2 after cover shouldn't break */
.cover-page + h2, h1 + h2 {
    page-break-before: auto;
}

h3 {
    color: #2c5aa0;
    font-size: 11pt;
    font-weight: bold;
    margin-top: 14px;
    margin-bottom: 8px;
    page-break-after: avoid;
}

h4 {
    color: #333;
    font-size: 10pt;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 6px;
}

p {
    margin-bottom: 8px;
    text-align: justify;
    orphans: 3;
    widows: 3;
}

/* ========== TABLES ========== */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 9pt;
    page-break-inside: avoid;
}

th {
    background: #1a4480;
    color: white;
    padding: 8px 6px;
    text-align: left;
    font-weight: bold;
    border: 1px solid #1a4480;
}

td {
    padding: 6px;
    border: 1px solid #ddd;
    vertical-align: top;
}

tr:nth-child(even) {
    background-color: #f5f5f5;
}

/* Keep table headers with tables */
thead {
    display: table-header-group;
}

tbody {
    page-break-inside: avoid;
}

tr {
    page-break-inside: avoid;
    page-break-after: auto;
}

/* ========== INFOGRAPHIC BOXES ========== */
.info-box {
    background: #f8f9fa;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px 15px;
    margin: 15px 0;
    page-break-inside: avoid;
}

.info-box.highlight {
    background: linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 100%);
    border-color: #1a4480;
}

.info-title {
    font-size: 12pt;
    font-weight: bold;
    color: #1a4480;
    text-align: center;
    margin: 0 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #1a4480;
}

/* ========== METRICS GRID ========== */
.metrics-grid {
    border: none;
    border-spacing: 8px;
    margin: 0;
}

.metrics-grid td {
    border: none;
    padding: 0;
}

.m-card {
    text-align: center;
    padding: 12px 8px;
    border-radius: 6px;
    color: white;
    width: 25%;
}

.m-card.blue { background: #1a4480; }
.m-card.green { background: #28a745; }
.m-card.gold { background: #c9a227; }
.m-card.purple { background: #6f42c1; }

.m-icon { display: block; font-size: 16pt; }
.m-val { display: block; font-size: 18pt; font-weight: bold; margin: 4px 0; }
.m-lbl { display: block; font-size: 7pt; }

/* ========== BAR CHART ========== */
.bar-table {
    border: none;
    margin: 0;
}

.bar-table td {
    border: none;
    padding: 6px 4px;
}

.bar-lbl {
    width: 160px;
    font-weight: bold;
    text-align: right;
    padding-right: 12px !important;
    font-size: 9pt;
}

.bar-cell {
    width: auto;
}

.hbar {
    height: 26px;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    font-size: 9pt;
    padding: 4px 10px;
    text-align: right;
    line-height: 18px;
}

.hbar.roads { background: #1a4480; width: 100%; }
.hbar.mining { background: #c9a227; width: 75%; }
.hbar.agro { background: #28a745; width: 50%; }

/* ========== TIMELINE ========== */
.timeline-grid {
    border: none;
    border-spacing: 5px;
    margin: 0;
}

.timeline-grid td {
    border: none;
    vertical-align: middle;
    padding: 0;
}

.tl-box {
    text-align: center;
    padding: 12px 8px;
    border-radius: 6px;
    width: 30%;
    color: white;
}

.tl-box.y1 { background: #1a4480; }
.tl-box.y2 { background: #2c5aa0; }
.tl-box.y3 { background: #28a745; }

.tl-yr { display: block; font-size: 10pt; font-weight: bold; }
.tl-amt { display: block; font-size: 16pt; font-weight: bold; color: #c9a227; margin: 4px 0; }
.tl-txt { display: block; font-size: 7pt; line-height: 1.3; }

.tl-arrow {
    text-align: center;
    font-size: 16pt;
    color: #c9a227;
    width: 5%;
}

.tl-total {
    text-align: center;
    margin: 10px 0 0 0;
    font-size: 11pt;
    color: #1a4480;
}

/* ========== REVENUE CHART ========== */
.rev-table {
    border: none;
    margin: 0;
}

.rev-table td {
    border: none;
    padding: 4px;
}

.rev-yr {
    width: 50px;
    font-weight: bold;
    text-align: right;
    padding-right: 8px !important;
    font-size: 9pt;
}

.rev-bar-td {
    width: auto;
}

.rev-bar {
    height: 22px;
    border-radius: 3px;
    color: white;
    font-weight: bold;
    font-size: 8pt;
    padding: 3px 8px;
    text-align: right;
    line-height: 16px;
}

.r1 { background: #1a4480; width: 27%; }
.r2 { background: #2c5aa0; width: 33%; }
.r3 { background: #3d6db5; width: 39%; }
.r4 { background: #28a745; width: 63%; }
.r5 { background: #c9a227; width: 100%; }

/* ========== ORG CHART ========== */
.org-table {
    width: 85%;
    margin: 0 auto;
    border: none;
    border-spacing: 6px;
}

.org-table td {
    border: none;
    text-align: center;
    padding: 0;
}

.org-box {
    padding: 10px 8px;
    border-radius: 5px;
    font-size: 8pt;
    color: white;
}

.org-box.board { background: #1a4480; }
.org-box.comm { background: #2c5aa0; font-size: 7pt; }
.org-box.ceo { background: #c9a227; }
.org-box.dept { background: #28a745; font-size: 7pt; }

.org-box small { font-size: 7pt; opacity: 0.9; }

.org-line {
    font-size: 14pt;
    color: #1a4480;
    padding: 0 !important;
}

/* ========== STAFFING ========== */
.staff-table {
    border: none;
    border-spacing: 4px;
    margin: 0;
}

.staff-table td {
    border: none;
    vertical-align: middle;
    padding: 0;
}

.staff-box {
    text-align: center;
    padding: 10px 6px;
    border-radius: 6px;
    border: 2px solid;
    width: 22%;
}

.staff-box.s0 { background: #f8f9fa; border-color: #1a4480; }
.staff-box.s1 { background: #e8f4f8; border-color: #1a4480; }
.staff-box.s2 { background: #d4edda; border-color: #28a745; }
.staff-box.s3 { background: #c9a227; border-color: #a88420; color: white; }

.s-phase { display: block; font-size: 9pt; font-weight: bold; color: #1a4480; }
.staff-box.s3 .s-phase { color: white; }
.s-num { display: block; font-size: 20pt; font-weight: bold; color: #1a4480; margin: 3px 0; }
.staff-box.s3 .s-num { color: white; }
.s-lbl { display: block; font-size: 7pt; color: #666; }
.staff-box.s3 .s-lbl { color: #fff; }

.staff-arr {
    text-align: center;
    font-size: 14pt;
    color: #c9a227;
    width: 4%;
}

.staff-note {
    text-align: center;
    font-size: 8pt;
    color: #666;
    margin: 8px 0 0 0;
    padding: 6px;
    background: white;
    border-radius: 4px;
}

/* ========== ROI ========== */
.roi-grid {
    width: 90%;
    margin: 0 auto;
    border: none;
    border-spacing: 8px;
}

.roi-grid td {
    border: none;
    vertical-align: middle;
    padding: 0;
}

.roi-box {
    text-align: center;
    padding: 12px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    width: 28%;
}

.roi-box.gold-box {
    background: #c9a227;
    color: white;
}

.roi-icon { display: block; font-size: 20pt; margin-bottom: 4px; }
.roi-lbl { display: block; font-size: 8pt; color: #666; }
.roi-box.gold-box .roi-lbl { color: white; }
.roi-val { display: block; font-size: 18pt; font-weight: bold; margin-top: 4px; }
.roi-val.blue { color: #1a4480; }
.roi-val.green { color: #28a745; }

.roi-arr {
    text-align: center;
    font-size: 20pt;
    color: #c9a227;
    width: 8%;
}

.roi-summary {
    width: 70%;
    margin: 12px auto 0;
    border: none;
    font-size: 9pt;
}

.roi-summary td {
    border: none;
    padding: 4px 8px;
    text-align: center;
}

.roi-pct {
    text-align: left !important;
}

.green { color: #28a745; }
.gold { color: #c9a227; }
.blue { color: #1a4480; }

/* ========== SUCCESS GRID ========== */
.success-grid {
    border: none;
    border-spacing: 8px;
    margin: 0;
}

.success-grid td {
    border: none;
    padding: 0;
}

.success-box {
    text-align: center;
    padding: 12px 8px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    width: 33%;
}

.suc-icon { display: block; font-size: 20pt; margin-bottom: 6px; }
.suc-title { display: block; font-size: 9pt; font-weight: bold; color: #1a4480; margin-bottom: 4px; }
.suc-txt { display: block; font-size: 7pt; color: #666; }

/* ========== HIDE ASCII ========== */
pre {
    display: none;
}

/* ========== LISTS ========== */
ul, ol {
    margin-bottom: 8px;
    padding-left: 18px;
}

li {
    margin-bottom: 3px;
}

strong {
    color: #1a4480;
}

code {
    background: #f4f4f4;
    padding: 1px 3px;
    border-radius: 2px;
    font-size: 9pt;
}
"""

# Process the markdown to insert infographics
def insert_infographics(html):
    # After Investment Highlights table
    html = html.replace(
        '<h3 id="strategic-value-proposition">Strategic Value Proposition</h3>',
        investment_infographic + '<h3 id="strategic-value-proposition">Strategic Value Proposition</h3>'
    )
    
    # Before section 4.4
    html = html.replace(
        '<h3 id="44-three-year-pipeline-summary">',
        sector_chart + '<h3 id="44-three-year-pipeline-summary">'
    )
    
    # Before section 5
    html = html.replace(
        '<h2 id="5-funding-sources-strategy">',
        timeline_infographic + '<h2 id="5-funding-sources-strategy">'
    )
    
    # After 6.1 title
    html = html.replace(
        '<h3 id="61-governance-framework">6.1 Governance Framework</h3>',
        '<h3 id="61-governance-framework">6.1 Governance Framework</h3>' + org_chart
    )
    
    # Before section 7
    html = html.replace(
        '<h2 id="7-financial-projections">',
        staffing_visual + '<h2 id="7-financial-projections">'
    )
    
    # After 7.1
    html = html.replace(
        '<h3 id="72-capital-deployment-trajectory',
        revenue_chart + '<h3 id="72-capital-deployment-trajectory'
    )
    
    # Before section 12
    html = html.replace(
        '<h2 id="12-conclusion">',
        roi_visual + '<h2 id="12-conclusion">'
    )
    
    # In conclusion
    html = html.replace(
        '<h3 id="why-ndb-ss-will-succeed">',
        '<h3 id="why-ndb-ss-will-succeed">' + success_visual
    )
    
    return html

# Process HTML
html_body = insert_infographics(html_body)

# Full HTML document
full_html = f"""<!DOCTYPE html>
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

# Save HTML
html_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.html')
html_file.write_text(full_html)
print(f"✓ HTML saved: {html_file}")

# Convert to PDF
pdf_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.pdf')
HTML(string=full_html).write_pdf(pdf_file, stylesheets=[CSS(string=css_style)])

import os
size = os.path.getsize(pdf_file) / 1024
print(f"✓ PDF saved: {pdf_file}")
print(f"\n📄 PDF generated ({size:.0f} KB)")
print("\n✅ Fixed:")
print("   • Cover page layout")
print("   • Table headers stay with tables")
print("   • Page breaks on major sections")
print("   • Company: Alex Tsela Global Finance")
print("   • Email: Alex@satsi.co.za")
print("   • Phone: +27 66 472 5666")
print("   • Seed capital consistent at $5M")
