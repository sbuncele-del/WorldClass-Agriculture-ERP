#!/usr/bin/env python3
"""Convert NDB Proposal - CLEAN VERSION"""

import markdown
from weasyprint import HTML, CSS
from pathlib import Path

# Read and update markdown
md_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.md')
md_content = md_file.read_text()
md_content = md_content.replace('Alex Tsela Global (ATG) Holdings', 'Alex Tsela Global Finance')

# Convert to HTML
md_converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
html_body = md_converter.convert(md_content)

# Simple, clean cover page
cover_page = """
<div class="cover">
    <div class="cover-inner">
        <div class="logo">NDB<br/><span>SOUTH SUDAN</span></div>
        <h1>National Development Bank<br/>of South Sudan</h1>
        <p class="subtitle">Investment & Development Finance Business Plan</p>
        <p class="tagline">"Building Tomorrow's South Sudan Today"</p>
        
        <table class="cover-stats">
            <tr>
                <td><div class="stat-val">$1.2B</div><div class="stat-lbl">3-Year Target</div></td>
                <td><div class="stat-val">$5M</div><div class="stat-lbl">Seed Capital</div></td>
                <td><div class="stat-val">360%</div><div class="stat-lbl">Year 1 ROI</div></td>
            </tr>
        </table>
        
        <div class="cover-info">
            <p><b>Presented to:</b> Strategic Investment Partners</p>
            <p><b>Prepared by:</b> Alex Tsela Global Finance</p>
            <p><b>Contact:</b> Alex@satsi.co.za | +27 66 472 5666</p>
            <p><b>Date:</b> January 2026</p>
            <p class="conf">CONFIDENTIAL — Investment Memorandum</p>
        </div>
    </div>
</div>
"""

# Investment cards - FIXED with text values
investment_box = """
<div class="info-panel">
<p class="panel-title">Investment at a Glance</p>
<table class="cards-row">
<tr>
<td class="card card-blue"><div class="card-val">$5M</div><div class="card-txt">Seed Capital</div></td>
<td class="card card-green"><div class="card-val">$1.2B</div><div class="card-txt">3-Year Mobilization</div></td>
<td class="card card-gold"><div class="card-val">360%</div><div class="card-txt">Year 1 ROI</div></td>
<td class="card card-purple"><div class="card-val">$60M</div><div class="card-txt">3-Year Commission</div></td>
</tr>
</table>
</div>
"""

# Sector bars
sector_box = """
<div class="info-panel">
<p class="panel-title">Priority Sectors - Capital Allocation</p>
<table class="bars">
<tr><td class="bar-name">Roads (Juba-Nimule)</td><td><div class="bar bar-blue" style="width:100%">$400M</div></td></tr>
<tr><td class="bar-name">Gold Mining (Kapoeta)</td><td><div class="bar bar-gold" style="width:75%">$300M</div></td></tr>
<tr><td class="bar-name">Agro-processing</td><td><div class="bar bar-green" style="width:50%">$200M</div></td></tr>
</table>
</div>
"""

# Timeline
timeline_box = """
<div class="info-panel">
<p class="panel-title">3-Year Capital Mobilization Roadmap</p>
<table class="timeline">
<tr>
<td class="tl-cell tl-y1"><div class="tl-year">YEAR 1</div><div class="tl-amt">$400M</div><div class="tl-note">Foundation • 15 Staff</div></td>
<td class="tl-arr">→</td>
<td class="tl-cell tl-y2"><div class="tl-year">YEAR 2</div><div class="tl-amt">$425M</div><div class="tl-note">Growth • 30 Staff</div></td>
<td class="tl-arr">→</td>
<td class="tl-cell tl-y3"><div class="tl-year">YEAR 3</div><div class="tl-amt">$375M</div><div class="tl-note">Mature • 45 Staff</div></td>
</tr>
</table>
<p class="tl-total">Total: <b>$1.2 Billion</b></p>
</div>
"""

# Revenue chart
revenue_box = """
<div class="info-panel">
<p class="panel-title">5-Year Revenue Projection</p>
<table class="rev-bars">
<tr><td class="rv-yr">Year 1</td><td><div class="rv-bar rv1">$24M</div></td></tr>
<tr><td class="rv-yr">Year 2</td><td><div class="rv-bar rv2">$29M</div></td></tr>
<tr><td class="rv-yr">Year 3</td><td><div class="rv-bar rv3">$34M</div></td></tr>
<tr><td class="rv-yr">Year 4</td><td><div class="rv-bar rv4">$55M</div></td></tr>
<tr><td class="rv-yr">Year 5</td><td><div class="rv-bar rv5">$88M</div></td></tr>
</table>
</div>
"""

# Org chart
org_box = """
<div class="info-panel">
<p class="panel-title">Governance Structure</p>
<table class="org">
<tr><td colspan="3" class="org-cell org-board"><b>BOARD OF DIRECTORS</b><br/><small>Government + Partners + Independent</small></td></tr>
<tr><td colspan="3" class="org-ln">|</td></tr>
<tr><td class="org-cell org-comm">Risk Committee</td><td class="org-cell org-comm">Audit Committee</td><td class="org-cell org-comm">Investment Committee</td></tr>
<tr><td colspan="3" class="org-ln">|</td></tr>
<tr><td colspan="3" class="org-cell org-ceo"><b>MD / CEO</b></td></tr>
<tr><td colspan="3" class="org-ln">|</td></tr>
<tr><td class="org-cell org-dept"><b>CFO</b><br/>Finance</td><td class="org-cell org-dept"><b>Dev Finance</b><br/>Deals</td><td class="org-cell org-dept"><b>Operations</b><br/>Projects</td></tr>
</table>
</div>
"""

# Staffing
staff_box = """
<div class="info-panel">
<p class="panel-title">Lean Staffing Plan</p>
<table class="staff">
<tr>
<td class="st-box st0"><div class="st-ph">Setup</div><div class="st-n">8</div></td>
<td class="st-ar">→</td>
<td class="st-box st1"><div class="st-ph">Year 1</div><div class="st-n">15</div></td>
<td class="st-ar">→</td>
<td class="st-box st2"><div class="st-ph">Year 2</div><div class="st-n">30</div></td>
<td class="st-ar">→</td>
<td class="st-box st3"><div class="st-ph">Year 3+</div><div class="st-n">45</div></td>
</tr>
</table>
</div>
"""

# ROI
roi_box = """
<div class="info-panel highlight">
<p class="panel-title">Return on Investment</p>
<table class="roi">
<tr>
<td class="roi-box"><div class="roi-lbl">Seed</div><div class="roi-v blue">$5M</div></td>
<td class="roi-ar">→</td>
<td class="roi-box"><div class="roi-lbl">Y1 Profit</div><div class="roi-v green">$18M</div></td>
<td class="roi-ar">→</td>
<td class="roi-box roi-hl"><div class="roi-lbl">Y1 ROI</div><div class="roi-v">360%</div></td>
</tr>
</table>
<p class="roi-sum">3-Year: <b class="green">$59M</b> profit = <b class="gold">1,180% ROI</b> &nbsp;|&nbsp; 5-Year: <b class="green">$152M</b> = <b class="gold">3,040% ROI</b></p>
</div>
"""

# Success factors
success_box = """
<div class="info-panel">
<p class="panel-title">Why NDB-SS Will Succeed</p>
<table class="success">
<tr>
<td class="suc-box"><b>Massive Gap</b><br/>$50B+ needs</td>
<td class="suc-box"><b>Proven Model</b><br/>Commission-based</td>
<td class="suc-box"><b>Focused</b><br/>3 priority projects</td>
<td class="suc-box"><b>Conservative</b><br/>$1.2B / 3 years</td>
<td class="suc-box"><b>Lean Ops</b><br/>Profitable Y1</td>
<td class="suc-box"><b>Strong ROI</b><br/>360% Year 1</td>
</tr>
</table>
</div>
"""

# Clean CSS
css = """
@page { size: A4; margin: 2cm; }
@page:first { margin: 0; }

body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #222; }

/* COVER */
.cover { width: 210mm; height: 297mm; background: #0a2540; color: #fff; text-align: center; page-break-after: always; }
.cover-inner { padding: 50px 40px; }
.logo { font-size: 36pt; font-weight: bold; margin-bottom: 30px; border: 3px solid #d4af37; border-radius: 60px; width: 120px; height: 120px; display: inline-block; padding-top: 25px; }
.logo span { font-size: 10pt; color: #d4af37; display: block; margin-top: 5px; }
.cover h1 { font-size: 28pt; margin: 20px 0 15px; color: #fff; border: none; }
.cover .subtitle { font-size: 14pt; color: #d4af37; margin: 0 0 10px; }
.cover .tagline { font-size: 12pt; font-style: italic; color: #aaa; margin: 0 0 40px; }
.cover-stats { width: 85%; margin: 0 auto 40px; border-collapse: separate; border-spacing: 20px; }
.cover-stats td { background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; text-align: center; border: none; }
.stat-val { font-size: 26pt; font-weight: bold; color: #d4af37; }
.stat-lbl { font-size: 9pt; color: #ccc; margin-top: 5px; }
.cover-info { margin-top: 30px; font-size: 10pt; }
.cover-info p { margin: 6px 0; }
.cover-info .conf { margin-top: 20px; color: #d4af37; letter-spacing: 1px; }

/* HEADINGS */
h1 { color: #0a2540; font-size: 18pt; border-bottom: 2px solid #0a2540; padding-bottom: 5px; margin: 25px 0 12px; }
h2 { color: #0a2540; font-size: 13pt; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 20px 0 10px; }
h3 { color: #1a4480; font-size: 11pt; margin: 15px 0 8px; }
p { margin-bottom: 8px; }

/* TABLES */
table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }
th { background: #0a2540; color: #fff; padding: 8px; text-align: left; border: 1px solid #0a2540; }
td { padding: 6px 8px; border: 1px solid #ddd; }
tr:nth-child(even) { background: #f8f8f8; }

/* INFO PANELS */
.info-panel { background: #f5f7fa; border: 1px solid #ddd; border-radius: 6px; padding: 12px 15px; margin: 15px 0; }
.info-panel.highlight { background: #eef6ff; border-color: #0a2540; }
.panel-title { font-size: 11pt; font-weight: bold; color: #0a2540; text-align: center; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 2px solid #0a2540; }

/* CARDS */
.cards-row { border: none; border-spacing: 8px; }
.cards-row td { border: none; padding: 0; }
.card { text-align: center; padding: 15px 10px; border-radius: 6px; color: #fff; width: 25%; }
.card-blue { background: #0a2540; }
.card-green { background: #28a745; }
.card-gold { background: #d4af37; }
.card-purple { background: #6f42c1; }
.card-val { font-size: 20pt; font-weight: bold; display: block; }
.card-txt { font-size: 8pt; display: block; margin-top: 4px; }

/* BARS */
.bars { border: none; }
.bars td { border: none; padding: 5px 0; }
.bar-name { width: 150px; text-align: right; padding-right: 10px !important; font-weight: bold; font-size: 9pt; }
.bar { height: 28px; border-radius: 4px; color: #fff; font-weight: bold; font-size: 9pt; padding: 5px 10px; text-align: right; line-height: 18px; }
.bar-blue { background: #0a2540; }
.bar-gold { background: #d4af37; }
.bar-green { background: #28a745; }

/* TIMELINE */
.timeline { border: none; border-spacing: 5px; }
.timeline td { border: none; padding: 0; vertical-align: middle; }
.tl-cell { text-align: center; padding: 12px 8px; border-radius: 6px; color: #fff; width: 30%; }
.tl-y1 { background: #0a2540; }
.tl-y2 { background: #1a4480; }
.tl-y3 { background: #28a745; }
.tl-year { font-size: 10pt; font-weight: bold; }
.tl-amt { font-size: 18pt; font-weight: bold; color: #d4af37; margin: 4px 0; }
.tl-note { font-size: 8pt; }
.tl-arr { text-align: center; font-size: 18pt; color: #d4af37; width: 5%; }
.tl-total { text-align: center; margin: 8px 0 0; font-size: 11pt; color: #0a2540; }

/* REVENUE */
.rev-bars { border: none; }
.rev-bars td { border: none; padding: 3px 0; }
.rv-yr { width: 50px; text-align: right; padding-right: 8px !important; font-weight: bold; font-size: 9pt; }
.rv-bar { height: 22px; border-radius: 3px; color: #fff; font-weight: bold; font-size: 8pt; padding: 3px 8px; text-align: right; line-height: 16px; }
.rv1 { background: #0a2540; width: 27%; }
.rv2 { background: #1a4480; width: 33%; }
.rv3 { background: #2c5aa0; width: 39%; }
.rv4 { background: #28a745; width: 63%; }
.rv5 { background: #d4af37; width: 100%; }

/* ORG */
.org { width: 85%; margin: 0 auto; border: none; border-spacing: 5px; }
.org td { border: none; padding: 0; text-align: center; }
.org-cell { padding: 8px; border-radius: 4px; color: #fff; font-size: 8pt; }
.org-board { background: #0a2540; }
.org-comm { background: #1a4480; }
.org-ceo { background: #d4af37; }
.org-dept { background: #28a745; }
.org-ln { color: #0a2540; font-size: 14pt; padding: 0 !important; }

/* STAFF */
.staff { border: none; border-spacing: 4px; }
.staff td { border: none; padding: 0; vertical-align: middle; }
.st-box { text-align: center; padding: 10px; border-radius: 5px; border: 2px solid; width: 22%; }
.st0 { background: #f8f8f8; border-color: #0a2540; }
.st1 { background: #eef6ff; border-color: #0a2540; }
.st2 { background: #e8f5e9; border-color: #28a745; }
.st3 { background: #d4af37; border-color: #b8972f; color: #fff; }
.st-ph { font-size: 9pt; font-weight: bold; color: #0a2540; }
.st3 .st-ph { color: #fff; }
.st-n { font-size: 22pt; font-weight: bold; color: #0a2540; }
.st3 .st-n { color: #fff; }
.st-ar { text-align: center; font-size: 16pt; color: #d4af37; width: 4%; }

/* ROI */
.roi { width: 90%; margin: 0 auto; border: none; border-spacing: 10px; }
.roi td { border: none; padding: 0; vertical-align: middle; }
.roi-box { text-align: center; padding: 12px; background: #fff; border-radius: 6px; width: 28%; }
.roi-hl { background: #d4af37; color: #fff; }
.roi-lbl { font-size: 8pt; color: #666; }
.roi-hl .roi-lbl { color: #fff; }
.roi-v { font-size: 20pt; font-weight: bold; margin-top: 4px; }
.roi-v.blue { color: #0a2540; }
.roi-v.green { color: #28a745; }
.roi-ar { text-align: center; font-size: 20pt; color: #d4af37; width: 8%; }
.roi-sum { text-align: center; margin: 10px 0 0; font-size: 10pt; }
.green { color: #28a745; }
.gold { color: #d4af37; }

/* SUCCESS */
.success { border: none; border-spacing: 6px; }
.success td { border: none; padding: 0; }
.suc-box { text-align: center; padding: 10px 5px; background: #fff; border-radius: 5px; font-size: 8pt; width: 16%; }
.suc-box b { color: #0a2540; font-size: 9pt; display: block; margin-bottom: 3px; }

/* HIDE PRE */
pre { display: none; }

ul, ol { margin: 8px 0; padding-left: 18px; }
li { margin-bottom: 3px; }
strong { color: #0a2540; }
"""

# Insert infographics
def add_graphics(html):
    html = html.replace('<h3 id="strategic-value-proposition">', investment_box + '<h3 id="strategic-value-proposition">')
    html = html.replace('<h3 id="44-three-year-pipeline-summary">', sector_box + '<h3 id="44-three-year-pipeline-summary">')
    html = html.replace('<h2 id="5-funding-sources-strategy">', timeline_box + '<h2 id="5-funding-sources-strategy">')
    html = html.replace('<h3 id="61-governance-framework">6.1 Governance Framework</h3>', '<h3 id="61-governance-framework">6.1 Governance Framework</h3>' + org_box)
    html = html.replace('<h2 id="7-financial-projections">', staff_box + '<h2 id="7-financial-projections">')
    html = html.replace('<h3 id="72-capital-deployment-trajectory', revenue_box + '<h3 id="72-capital-deployment-trajectory')
    html = html.replace('<h2 id="12-conclusion">', roi_box + '<h2 id="12-conclusion">')
    html = html.replace('<h3 id="why-ndb-ss-will-succeed">', '<h3 id="why-ndb-ss-will-succeed">' + success_box)
    return html

html_body = add_graphics(html_body)

full_html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>NDB South Sudan</title></head>
<body>{cover_page}{html_body}</body></html>"""

# Save
html_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.html')
html_file.write_text(full_html)

pdf_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.pdf')
HTML(string=full_html).write_pdf(pdf_file, stylesheets=[CSS(string=css)])

import os
print(f"✓ PDF: {pdf_file} ({os.path.getsize(pdf_file)//1024} KB)")
