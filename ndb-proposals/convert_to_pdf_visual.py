#!/usr/bin/env python3
"""Convert NDB Proposal Markdown to professional PDF with infographics"""

import markdown
from weasyprint import HTML, CSS
from pathlib import Path

# Read markdown file
md_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.md')
md_content = md_file.read_text()

# Convert markdown to HTML
md_converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
html_body = md_converter.convert(md_content)

# Cover page HTML
cover_page = """
<div class="cover-page">
    <div class="cover-logo">
        <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="55" fill="#1a4480" stroke="#c9a227" stroke-width="4"/>
            <text x="60" y="50" text-anchor="middle" fill="white" font-size="24" font-weight="bold">NDB</text>
            <text x="60" y="75" text-anchor="middle" fill="#c9a227" font-size="14" font-weight="bold">SOUTH SUDAN</text>
        </svg>
    </div>
    <h1 class="cover-title">National Development Bank<br/>of South Sudan</h1>
    <div class="cover-subtitle">Investment & Development Finance Business Plan</div>
    <div class="cover-tagline">"Building Tomorrow's South Sudan Today"</div>
    
    <div class="cover-highlights">
        <div class="highlight-item">
            <div class="highlight-value">$1.2B</div>
            <div class="highlight-label">3-Year Target</div>
        </div>
        <div class="highlight-item">
            <div class="highlight-value">$5M</div>
            <div class="highlight-label">Seed Capital</div>
        </div>
        <div class="highlight-item">
            <div class="highlight-value">360%</div>
            <div class="highlight-label">Year 1 ROI</div>
        </div>
    </div>
    
    <div class="cover-footer">
        <p><strong>Presented to:</strong> Strategic Investment Partners</p>
        <p><strong>Prepared by:</strong> Alex Tsela Global (ATG) Holdings</p>
        <p><strong>Date:</strong> January 2026</p>
        <p class="confidential">CONFIDENTIAL — Investment Memorandum</p>
    </div>
</div>
"""

# Investment Highlights Infographic
investment_infographic = """
<div class="infographic-section">
    <h3>Investment at a Glance</h3>
    <div class="info-cards">
        <div class="info-card blue">
            <svg class="card-icon" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="#1a4480"/><text x="25" y="32" text-anchor="middle" fill="white" font-size="20">$</text></svg>
            <div class="card-value">$5M</div>
            <div class="card-label">Seed Capital Required</div>
        </div>
        <div class="info-card green">
            <svg class="card-icon" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="#28a745"/><text x="25" y="32" text-anchor="middle" fill="white" font-size="16">📈</text></svg>
            <div class="card-value">$1.2B</div>
            <div class="card-label">3-Year Mobilization</div>
        </div>
        <div class="info-card gold">
            <svg class="card-icon" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="#c9a227"/><text x="25" y="32" text-anchor="middle" fill="white" font-size="16">↑</text></svg>
            <div class="card-value">360%</div>
            <div class="card-label">Year 1 ROI</div>
        </div>
        <div class="info-card purple">
            <svg class="card-icon" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="#6f42c1"/><text x="25" y="32" text-anchor="middle" fill="white" font-size="16">💼</text></svg>
            <div class="card-value">$60M</div>
            <div class="card-label">3-Year Commission</div>
        </div>
    </div>
</div>
"""

# Sector Breakdown Pie Chart
sector_pie_chart = """
<div class="infographic-section">
    <h3>Priority Sectors - Capital Allocation</h3>
    <div class="pie-chart-container">
        <svg viewBox="0 0 400 250" class="pie-chart">
            <!-- Pie Chart -->
            <g transform="translate(120, 125)">
                <!-- Roads - 44% (160 degrees) -->
                <path d="M 0 0 L 80 0 A 80 80 0 0 1 -24 76 Z" fill="#1a4480"/>
                <!-- Mining - 33% (120 degrees) -->
                <path d="M 0 0 L -24 76 A 80 80 0 0 1 -76 -24 Z" fill="#c9a227"/>
                <!-- Agro-processing - 22% (80 degrees) -->
                <path d="M 0 0 L -76 -24 A 80 80 0 0 1 80 0 Z" fill="#28a745"/>
            </g>
            <!-- Labels -->
            <g font-size="12" fill="#333">
                <rect x="240" y="60" width="16" height="16" fill="#1a4480"/>
                <text x="262" y="73">Roads (Juba-Nimule) - $400M</text>
                <rect x="240" y="90" width="16" height="16" fill="#c9a227"/>
                <text x="262" y="103">Gold Mining - $300M</text>
                <rect x="240" y="120" width="16" height="16" fill="#28a745"/>
                <text x="262" y="133">Agro-processing - $200M</text>
            </g>
            <!-- Center text -->
            <text x="120" y="120" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">$900M</text>
            <text x="120" y="138" text-anchor="middle" font-size="10" fill="#666">Priority Projects</text>
        </svg>
    </div>
</div>
"""

# 3-Year Timeline
timeline_infographic = """
<div class="infographic-section">
    <h3>3-Year Capital Mobilization Roadmap</h3>
    <div class="timeline">
        <div class="timeline-item">
            <div class="timeline-marker year1"></div>
            <div class="timeline-content">
                <div class="timeline-year">Year 1</div>
                <div class="timeline-amount">$400M</div>
                <div class="timeline-details">
                    <span>• Foundation Building</span>
                    <span>• First Deals Closed</span>
                    <span>• 15 Staff</span>
                </div>
            </div>
        </div>
        <div class="timeline-connector"></div>
        <div class="timeline-item">
            <div class="timeline-marker year2"></div>
            <div class="timeline-content">
                <div class="timeline-year">Year 2</div>
                <div class="timeline-amount">$425M</div>
                <div class="timeline-details">
                    <span>• Track Record Built</span>
                    <span>• Expanded Funders</span>
                    <span>• 30 Staff</span>
                </div>
            </div>
        </div>
        <div class="timeline-connector"></div>
        <div class="timeline-item">
            <div class="timeline-marker year3"></div>
            <div class="timeline-content">
                <div class="timeline-year">Year 3</div>
                <div class="timeline-amount">$375M</div>
                <div class="timeline-details">
                    <span>• Proven Institution</span>
                    <span>• $1.2B Cumulative</span>
                    <span>• 45 Staff</span>
                </div>
            </div>
        </div>
    </div>
    <div class="timeline-total">
        <strong>Total 3-Year Target: $1.2 Billion</strong>
    </div>
</div>
"""

# Revenue Bar Chart
revenue_chart = """
<div class="infographic-section">
    <h3>5-Year Revenue Projection</h3>
    <div class="bar-chart">
        <svg viewBox="0 0 500 200" class="chart-svg">
            <!-- Y-axis labels -->
            <text x="30" y="30" font-size="10" fill="#666">$100M</text>
            <text x="30" y="80" font-size="10" fill="#666">$50M</text>
            <text x="30" y="130" font-size="10" fill="#666">$25M</text>
            <text x="30" y="180" font-size="10" fill="#666">$0</text>
            
            <!-- Grid lines -->
            <line x1="60" y1="30" x2="480" y2="30" stroke="#eee" stroke-width="1"/>
            <line x1="60" y1="80" x2="480" y2="80" stroke="#eee" stroke-width="1"/>
            <line x1="60" y1="130" x2="480" y2="130" stroke="#eee" stroke-width="1"/>
            <line x1="60" y1="180" x2="480" y2="180" stroke="#333" stroke-width="1"/>
            
            <!-- Bars -->
            <rect x="80" y="144" width="50" height="36" fill="#1a4480" rx="3"/>
            <text x="105" y="138" font-size="10" text-anchor="middle" fill="#1a4480" font-weight="bold">$24M</text>
            
            <rect x="160" y="136" width="50" height="44" fill="#2c5aa0" rx="3"/>
            <text x="185" y="130" font-size="10" text-anchor="middle" fill="#2c5aa0" font-weight="bold">$29M</text>
            
            <rect x="240" y="130" width="50" height="50" fill="#3d6db5" rx="3"/>
            <text x="265" y="124" font-size="10" text-anchor="middle" fill="#3d6db5" font-weight="bold">$34M</text>
            
            <rect x="320" y="97" width="50" height="83" fill="#28a745" rx="3"/>
            <text x="345" y="91" font-size="10" text-anchor="middle" fill="#28a745" font-weight="bold">$55M</text>
            
            <rect x="400" y="48" width="50" height="132" fill="#c9a227" rx="3"/>
            <text x="425" y="42" font-size="10" text-anchor="middle" fill="#c9a227" font-weight="bold">$88M</text>
            
            <!-- X-axis labels -->
            <text x="105" y="195" font-size="11" text-anchor="middle" fill="#333">Year 1</text>
            <text x="185" y="195" font-size="11" text-anchor="middle" fill="#333">Year 2</text>
            <text x="265" y="195" font-size="11" text-anchor="middle" fill="#333">Year 3</text>
            <text x="345" y="195" font-size="11" text-anchor="middle" fill="#333">Year 4</text>
            <text x="425" y="195" font-size="11" text-anchor="middle" fill="#333">Year 5</text>
        </svg>
    </div>
</div>
"""

# Organizational Structure Visual
org_chart = """
<div class="infographic-section">
    <h3>Governance Structure</h3>
    <div class="org-chart">
        <svg viewBox="0 0 500 320" class="org-svg">
            <!-- Board of Directors -->
            <rect x="150" y="10" width="200" height="50" rx="8" fill="#1a4480"/>
            <text x="250" y="30" text-anchor="middle" fill="white" font-size="11" font-weight="bold">BOARD OF DIRECTORS</text>
            <text x="250" y="48" text-anchor="middle" fill="#ccc" font-size="9">Government + Partners + Independent</text>
            
            <!-- Connector line -->
            <line x1="250" y1="60" x2="250" y2="85" stroke="#1a4480" stroke-width="2"/>
            
            <!-- Committees row -->
            <rect x="50" y="85" width="110" height="35" rx="5" fill="#2c5aa0"/>
            <text x="105" y="107" text-anchor="middle" fill="white" font-size="9">Risk Committee</text>
            
            <rect x="195" y="85" width="110" height="35" rx="5" fill="#2c5aa0"/>
            <text x="250" y="107" text-anchor="middle" fill="white" font-size="9">Audit Committee</text>
            
            <rect x="340" y="85" width="110" height="35" rx="5" fill="#2c5aa0"/>
            <text x="395" y="107" text-anchor="middle" fill="white" font-size="9">Investment Committee</text>
            
            <!-- Connector lines to committees -->
            <line x1="105" y1="85" x2="250" y2="60" stroke="#2c5aa0" stroke-width="1"/>
            <line x1="250" y1="85" x2="250" y2="60" stroke="#2c5aa0" stroke-width="1"/>
            <line x1="395" y1="85" x2="250" y2="60" stroke="#2c5aa0" stroke-width="1"/>
            
            <!-- MD/CEO -->
            <line x1="250" y1="120" x2="250" y2="145" stroke="#1a4480" stroke-width="2"/>
            <rect x="150" y="145" width="200" height="45" rx="8" fill="#c9a227"/>
            <text x="250" y="165" text-anchor="middle" fill="white" font-size="11" font-weight="bold">MANAGING DIRECTOR / CEO</text>
            <text x="250" y="180" text-anchor="middle" fill="white" font-size="9">Executive Leadership</text>
            
            <!-- Connector lines to departments -->
            <line x1="250" y1="190" x2="250" y2="210" stroke="#c9a227" stroke-width="2"/>
            <line x1="105" y1="210" x2="395" y2="210" stroke="#c9a227" stroke-width="1"/>
            <line x1="105" y1="210" x2="105" y2="230" stroke="#c9a227" stroke-width="1"/>
            <line x1="250" y1="210" x2="250" y2="230" stroke="#c9a227" stroke-width="1"/>
            <line x1="395" y1="210" x2="395" y2="230" stroke="#c9a227" stroke-width="1"/>
            
            <!-- Department boxes -->
            <rect x="40" y="230" width="130" height="60" rx="5" fill="#28a745"/>
            <text x="105" y="255" text-anchor="middle" fill="white" font-size="10" font-weight="bold">CFO</text>
            <text x="105" y="270" text-anchor="middle" fill="white" font-size="8">Finance &</text>
            <text x="105" y="282" text-anchor="middle" fill="white" font-size="8">Compliance</text>
            
            <rect x="185" y="230" width="130" height="60" rx="5" fill="#28a745"/>
            <text x="250" y="255" text-anchor="middle" fill="white" font-size="10" font-weight="bold">Development</text>
            <text x="250" y="270" text-anchor="middle" fill="white" font-size="8">Finance &</text>
            <text x="250" y="282" text-anchor="middle" fill="white" font-size="8">Deal Origination</text>
            
            <rect x="330" y="230" width="130" height="60" rx="5" fill="#28a745"/>
            <text x="395" y="255" text-anchor="middle" fill="white" font-size="10" font-weight="bold">Operations</text>
            <text x="395" y="270" text-anchor="middle" fill="white" font-size="8">& Projects</text>
            <text x="395" y="282" text-anchor="middle" fill="white" font-size="8">Management</text>
        </svg>
    </div>
</div>
"""

# Staffing Growth Visual
staffing_visual = """
<div class="infographic-section">
    <h3>Lean Staffing Plan</h3>
    <div class="staffing-chart">
        <svg viewBox="0 0 450 150" class="staffing-svg">
            <!-- Phase boxes with people icons -->
            <g transform="translate(20, 20)">
                <!-- Setup Phase -->
                <rect x="0" y="0" width="90" height="100" rx="5" fill="#f8f9fa" stroke="#1a4480" stroke-width="2"/>
                <text x="45" y="20" text-anchor="middle" font-size="10" fill="#1a4480" font-weight="bold">Setup</text>
                <text x="45" y="35" text-anchor="middle" font-size="8" fill="#666">Months 1-6</text>
                <text x="45" y="70" text-anchor="middle" font-size="28" fill="#1a4480" font-weight="bold">8</text>
                <text x="45" y="90" text-anchor="middle" font-size="9" fill="#666">Staff</text>
            </g>
            
            <!-- Arrow -->
            <polygon points="120,70 135,60 135,65 150,65 150,75 135,75 135,80" fill="#c9a227"/>
            
            <g transform="translate(160, 20)">
                <!-- Year 1 -->
                <rect x="0" y="0" width="90" height="100" rx="5" fill="#e8f4f8" stroke="#1a4480" stroke-width="2"/>
                <text x="45" y="20" text-anchor="middle" font-size="10" fill="#1a4480" font-weight="bold">Year 1</text>
                <text x="45" y="35" text-anchor="middle" font-size="8" fill="#666">Operations</text>
                <text x="45" y="70" text-anchor="middle" font-size="28" fill="#1a4480" font-weight="bold">15</text>
                <text x="45" y="90" text-anchor="middle" font-size="9" fill="#666">Staff</text>
            </g>
            
            <!-- Arrow -->
            <polygon points="260,70 275,60 275,65 290,65 290,75 275,75 275,80" fill="#c9a227"/>
            
            <g transform="translate(300, 20)">
                <!-- Year 2 -->
                <rect x="0" y="0" width="90" height="100" rx="5" fill="#d4edda" stroke="#28a745" stroke-width="2"/>
                <text x="45" y="20" text-anchor="middle" font-size="10" fill="#28a745" font-weight="bold">Year 2</text>
                <text x="45" y="35" text-anchor="middle" font-size="8" fill="#666">Scale</text>
                <text x="45" y="70" text-anchor="middle" font-size="28" fill="#28a745" font-weight="bold">30</text>
                <text x="45" y="90" text-anchor="middle" font-size="9" fill="#666">Staff</text>
            </g>
            
            <!-- Arrow -->
            <polygon points="400,70 415,60 415,65 430,65 430,75 415,75 415,80" fill="#c9a227"/>
            
            <g transform="translate(440, 20)">
                <!-- Year 3+ - smaller to fit -->
            </g>
        </svg>
        <div class="staffing-note">
            <strong>Lean Startup Approach:</strong> Outsource non-core functions • Use consultants for specialized work • Focus on revenue-generating roles
        </div>
    </div>
</div>
"""

# ROI Visual
roi_visual = """
<div class="infographic-section roi-section">
    <h3>Return on Investment</h3>
    <div class="roi-container">
        <div class="roi-box">
            <div class="roi-icon">💰</div>
            <div class="roi-label">Seed Investment</div>
            <div class="roi-value blue">$5M</div>
        </div>
        <div class="roi-arrow">→</div>
        <div class="roi-box">
            <div class="roi-icon">📊</div>
            <div class="roi-label">Year 1 Profit</div>
            <div class="roi-value green">$18M</div>
        </div>
        <div class="roi-arrow">→</div>
        <div class="roi-box highlight">
            <div class="roi-icon">🚀</div>
            <div class="roi-label">Year 1 ROI</div>
            <div class="roi-value gold">360%</div>
        </div>
    </div>
    <div class="roi-summary">
        <table class="roi-table">
            <tr><td>3-Year Cumulative Profit</td><td class="value">$59 Million</td><td class="roi">1,180% ROI</td></tr>
            <tr><td>5-Year Cumulative Profit</td><td class="value">$152 Million</td><td class="roi">3,040% ROI</td></tr>
        </table>
    </div>
</div>
"""

# Success Factors Visual
success_visual = """
<div class="infographic-section">
    <h3>Why NDB-SS Will Succeed</h3>
    <div class="success-grid">
        <div class="success-item">
            <div class="success-icon">🎯</div>
            <div class="success-title">Massive Market Gap</div>
            <div class="success-desc">$50B+ infrastructure needs, no DFI currently serves South Sudan</div>
        </div>
        <div class="success-item">
            <div class="success-icon">✅</div>
            <div class="success-title">Proven Model</div>
            <div class="success-desc">Commission-based revenue de-risks operations</div>
        </div>
        <div class="success-item">
            <div class="success-icon">📋</div>
            <div class="success-title">Focused Pipeline</div>
            <div class="success-desc">3 priority projects ($900M) with clear impact</div>
        </div>
        <div class="success-item">
            <div class="success-icon">💎</div>
            <div class="success-title">Conservative Target</div>
            <div class="success-desc">$1.2B over 3 years is achievable and credible</div>
        </div>
        <div class="success-item">
            <div class="success-icon">⚡</div>
            <div class="success-title">Lean Operations</div>
            <div class="success-desc">Low overhead ensures Year 1 profitability</div>
        </div>
        <div class="success-item">
            <div class="success-icon">📈</div>
            <div class="success-title">Attractive Returns</div>
            <div class="success-desc">360% Year 1 ROI for founding partners</div>
        </div>
    </div>
</div>
"""

# Professional CSS styling with infographics support
css_style = """
@page {
    size: A4;
    margin: 1.5cm 2cm;
    @top-center {
        content: "NDB South Sudan - Investment Memorandum";
        font-size: 8pt;
        color: #999;
    }
    @bottom-center {
        content: "Page " counter(page);
        font-size: 8pt;
        color: #999;
    }
}

@page:first {
    margin: 0;
    @top-center { content: none; }
    @bottom-center { content: none; }
}

* {
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Calibri, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #333;
}

/* Cover Page */
.cover-page {
    height: 297mm;
    background: linear-gradient(135deg, #1a4480 0%, #0d2840 100%);
    color: white;
    text-align: center;
    padding: 60px 40px;
    page-break-after: always;
}

.cover-logo {
    margin-bottom: 40px;
}

.cover-title {
    font-size: 36pt;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
    border: none;
    color: white;
}

.cover-subtitle {
    font-size: 16pt;
    color: #c9a227;
    margin-top: 15px;
    font-weight: 500;
}

.cover-tagline {
    font-size: 14pt;
    font-style: italic;
    color: #aaa;
    margin-top: 30px;
}

.cover-highlights {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-top: 60px;
}

.highlight-item {
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 25px 30px;
    min-width: 140px;
}

.highlight-value {
    font-size: 28pt;
    font-weight: 700;
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

.cover-footer .confidential {
    margin-top: 25px;
    font-size: 9pt;
    color: #c9a227;
    letter-spacing: 2px;
}

/* Main Content */
h1 {
    color: #1a4480;
    font-size: 22pt;
    font-weight: 700;
    border-bottom: 3px solid #1a4480;
    padding-bottom: 8px;
    margin-top: 30px;
    margin-bottom: 15px;
    page-break-after: avoid;
}

h2 {
    color: #1a4480;
    font-size: 16pt;
    font-weight: 600;
    margin-top: 25px;
    margin-bottom: 12px;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 6px;
    page-break-after: avoid;
}

h3 {
    color: #2c5aa0;
    font-size: 12pt;
    font-weight: 600;
    margin-top: 20px;
    margin-bottom: 10px;
    page-break-after: avoid;
}

h4 {
    color: #333;
    font-size: 11pt;
    font-weight: 600;
    margin-top: 15px;
    margin-bottom: 8px;
}

p {
    margin-bottom: 10px;
    text-align: justify;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    font-size: 9pt;
    page-break-inside: avoid;
}

th {
    background: linear-gradient(135deg, #1a4480 0%, #2c5aa0 100%);
    color: white;
    padding: 10px 8px;
    text-align: left;
    font-weight: 600;
}

td {
    padding: 8px;
    border: 1px solid #ddd;
    vertical-align: top;
}

tr:nth-child(even) {
    background-color: #f8f9fa;
}

/* Infographic Sections */
.infographic-section {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
    page-break-inside: avoid;
}

.infographic-section h3 {
    margin-top: 0;
    text-align: center;
    color: #1a4480;
    border-bottom: none;
}

/* Info Cards */
.info-cards {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 15px;
}

.info-card {
    background: white;
    border-radius: 10px;
    padding: 15px;
    text-align: center;
    min-width: 100px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.info-card .card-icon {
    width: 40px;
    height: 40px;
    margin: 0 auto 8px;
}

.info-card .card-value {
    font-size: 20pt;
    font-weight: 700;
}

.info-card .card-label {
    font-size: 8pt;
    color: #666;
}

.info-card.blue .card-value { color: #1a4480; }
.info-card.green .card-value { color: #28a745; }
.info-card.gold .card-value { color: #c9a227; }
.info-card.purple .card-value { color: #6f42c1; }

/* Pie Chart */
.pie-chart-container {
    text-align: center;
}

.pie-chart {
    max-width: 400px;
    margin: 0 auto;
}

/* Bar Chart */
.bar-chart {
    text-align: center;
}

.chart-svg {
    max-width: 100%;
}

/* Timeline */
.timeline {
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
    margin: 20px 0;
}

.timeline-item {
    text-align: center;
    flex: 1;
}

.timeline-marker {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin: 0 auto 10px;
}

.timeline-marker.year1 { background: #1a4480; }
.timeline-marker.year2 { background: #2c5aa0; }
.timeline-marker.year3 { background: #28a745; }

.timeline-year {
    font-weight: 700;
    color: #1a4480;
    font-size: 12pt;
}

.timeline-amount {
    font-size: 18pt;
    font-weight: 700;
    color: #c9a227;
}

.timeline-details {
    font-size: 8pt;
    color: #666;
}

.timeline-details span {
    display: block;
}

.timeline-connector {
    width: 40px;
    height: 3px;
    background: #c9a227;
    margin-top: 30px;
}

.timeline-total {
    text-align: center;
    margin-top: 15px;
    font-size: 12pt;
    color: #1a4480;
}

/* Org Chart */
.org-chart {
    text-align: center;
}

.org-svg {
    max-width: 100%;
}

/* Staffing */
.staffing-chart {
    text-align: center;
}

.staffing-svg {
    max-width: 100%;
}

.staffing-note {
    font-size: 9pt;
    color: #666;
    margin-top: 10px;
    padding: 10px;
    background: white;
    border-radius: 5px;
}

/* ROI Section */
.roi-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin: 20px 0;
}

.roi-box {
    background: white;
    border-radius: 10px;
    padding: 15px 20px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.roi-box.highlight {
    background: linear-gradient(135deg, #c9a227 0%, #a88420 100%);
    color: white;
}

.roi-icon {
    font-size: 24pt;
}

.roi-label {
    font-size: 9pt;
    color: #666;
}

.roi-box.highlight .roi-label {
    color: #fff;
}

.roi-value {
    font-size: 20pt;
    font-weight: 700;
}

.roi-value.blue { color: #1a4480; }
.roi-value.green { color: #28a745; }
.roi-value.gold { color: white; }

.roi-arrow {
    font-size: 24pt;
    color: #c9a227;
}

.roi-summary {
    margin-top: 15px;
}

.roi-table {
    max-width: 400px;
    margin: 0 auto;
    font-size: 10pt;
}

.roi-table td {
    padding: 8px 15px;
}

.roi-table .value {
    font-weight: 700;
    color: #28a745;
}

.roi-table .roi {
    font-weight: 700;
    color: #c9a227;
}

/* Success Grid */
.success-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
}

.success-item {
    background: white;
    border-radius: 8px;
    padding: 15px;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

.success-icon {
    font-size: 24pt;
    margin-bottom: 8px;
}

.success-title {
    font-weight: 700;
    color: #1a4480;
    font-size: 10pt;
    margin-bottom: 5px;
}

.success-desc {
    font-size: 8pt;
    color: #666;
}

/* Code blocks (for ASCII art replacement) */
pre {
    display: none;
}

/* Lists */
ul, ol {
    margin-bottom: 12px;
    padding-left: 20px;
}

li {
    margin-bottom: 5px;
}

/* Strong text */
strong {
    color: #1a4480;
}

/* Page breaks */
.page-break {
    page-break-before: always;
}
"""

# Process the markdown to insert infographics at appropriate places
def insert_infographics(html):
    # Insert investment infographic after Investment Highlights table
    html = html.replace(
        '<h3>Strategic Value Proposition</h3>',
        investment_infographic + '<h3>Strategic Value Proposition</h3>'
    )
    
    # Insert sector pie chart after section 4.3
    html = html.replace(
        '<h3>4.4 Three-Year Pipeline Summary</h3>',
        sector_pie_chart + '<h3>4.4 Three-Year Pipeline Summary</h3>'
    )
    
    # Insert timeline after pipeline summary
    html = html.replace(
        '<h2>5. Funding Sources Strategy</h2>',
        timeline_infographic + '<div class="page-break"></div><h2>5. Funding Sources Strategy</h2>'
    )
    
    # Replace ASCII org chart with visual
    html = html.replace(
        '<h3>6.1 Governance Framework</h3>',
        '<h3>6.1 Governance Framework</h3>' + org_chart
    )
    
    # Insert staffing visual after staffing plan
    html = html.replace(
        '<h2>7. Financial Projections</h2>',
        staffing_visual + '<div class="page-break"></div><h2>7. Financial Projections</h2>'
    )
    
    # Insert revenue chart after 7.1
    html = html.replace(
        '<h3>7.2 Capital Deployment Trajectory',
        revenue_chart + '<h3>7.2 Capital Deployment Trajectory'
    )
    
    # Insert ROI visual before section 12
    html = html.replace(
        '<h2>11. Investment Ask',
        roi_visual + '<div class="page-break"></div><h2>11. Investment Ask'
    )
    
    # Insert success visual before conclusion
    html = html.replace(
        '<h2>12. Conclusion</h2>',
        '<div class="page-break"></div><h2>12. Conclusion</h2>' + success_visual
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>National Development Bank of South Sudan - Investment Memorandum</title>
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
print("   ✅ Cover page with key highlights")
print("   ✅ Investment at a Glance infographic")
print("   ✅ Sector allocation pie chart")
print("   ✅ 3-Year timeline roadmap")
print("   ✅ Visual org chart")
print("   ✅ Staffing progression visual")
print("   ✅ Revenue bar chart")
print("   ✅ ROI showcase")
print("   ✅ Success factors grid")
