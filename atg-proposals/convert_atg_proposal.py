#!/usr/bin/env python3
"""Convert ATG-PSPF Consolidated Proposal to Professional PDF
Investor-ready document with infographics and professional styling.
"""

import markdown
from weasyprint import HTML, CSS
from pathlib import Path
import re

# 1. Read markdown
md_file = Path('/workspaces/WorldClass-ERP/atg-proposals/ATG-PSPF-CONSOLIDATED-PROPOSAL.md')
md_content = md_file.read_text()

# 2. Convert to HTML
md_converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
html_body = md_converter.convert(md_content)

# 3. CSS Styling
css = """
@page { 
    size: A4; 
    margin: 2cm 2cm 2.5cm 2cm;
    @top-center {
        content: "ATG Holdings — Consolidated Investment Proposal";
        font-family: Arial, sans-serif;
        font-size: 9pt;
        color: #666;
        border-bottom: 1px solid #ddd;
        width: 100%;
        padding-bottom: 8px;
    }
    @bottom-center {
        content: "Page " counter(page) " | Confidential";
        font-family: Arial, sans-serif;
        font-size: 8pt;
        color: #888;
    }
}

@page :first { 
    margin: 0; 
    @top-center { content: none; }
    @bottom-center { content: none; }
}

body { 
    font-family: 'Segoe UI', Arial, Helvetica, sans-serif; 
    font-size: 10.5pt; 
    line-height: 1.5; 
    color: #333; 
    margin: 0;
    padding: 0;
}

/* Typography */
h1 { 
    color: #1a472a; 
    font-size: 22pt; 
    border-bottom: 3px solid #d4af37; 
    padding-bottom: 10px; 
    margin-top: 30px; 
}
h2 { 
    color: #1a472a; 
    font-size: 16pt; 
    border-bottom: 2px solid #1a472a; 
    padding-bottom: 8px; 
    margin-top: 25px;
    page-break-after: avoid;
}
h3 { 
    color: #2d5a3d; 
    font-size: 13pt; 
    margin-top: 20px;
    border-left: 4px solid #d4af37;
    padding-left: 10px;
}
h4 {
    color: #1a472a;
    font-size: 11pt;
    margin-top: 15px;
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
    font-size: 10pt;
    page-break-inside: avoid;
}
th { 
    background: #1a472a; 
    color: white; 
    padding: 10px 8px; 
    text-align: left; 
    font-weight: bold;
}
td { 
    border: 1px solid #ddd; 
    padding: 8px; 
    vertical-align: top;
}
tr:nth-child(even) {
    background-color: #f8f9fa;
}
tr:hover {
    background-color: #f0f4f0;
}

/* Code blocks (for diagrams) */
pre {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 15px;
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    overflow-x: auto;
    page-break-inside: avoid;
}
code {
    font-family: 'Courier New', monospace;
    background: #f0f0f0;
    padding: 2px 5px;
    border-radius: 3px;
}

/* Blockquotes */
blockquote {
    border-left: 4px solid #d4af37;
    margin: 15px 0;
    padding: 10px 20px;
    background: #fffbf0;
    font-style: italic;
    color: #555;
}

/* Strong text */
strong {
    color: #1a472a;
}

/* Lists */
ul, ol {
    margin: 10px 0;
    padding-left: 25px;
}
li {
    margin-bottom: 5px;
}

/* Horizontal rules */
hr {
    border: none;
    border-top: 2px solid #d4af37;
    margin: 30px 0;
}

/* Cover Page */
.cover-page {
    width: 210mm;
    height: 297mm;
    background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 50%, #1a472a 100%);
    color: white;
    page-break-after: always;
}
"""

# Cover Page HTML
cover_page = """
<div class="cover-page">
    <table style="width: 100%; height: 100%; border: 0; border-collapse: collapse;">
        <tr>
            <td style="vertical-align: middle; text-align: center; border: 0; padding: 40px;">
                
                <!-- Logo Area -->
                <div style="margin-bottom: 40px;">
                    <div style="display: inline-block; padding: 30px 50px; border: 4px solid #d4af37; border-radius: 8px; background: rgba(255,255,255,0.05);">
                        <div style="font-size: 42pt; font-weight: bold; color: #fff; letter-spacing: 3px;">ATG</div>
                        <div style="font-size: 11pt; color: #d4af37; font-weight: bold; letter-spacing: 2px; margin-top: 5px;">HOLDINGS</div>
                    </div>
                </div>
                
                <!-- Title -->
                <h1 style="font-size: 28pt; color: #fff; margin: 0 0 10px 0; border: none; letter-spacing: 1px; line-height: 1.3;">
                    Consolidated Investment Proposal
                </h1>
                <p style="font-size: 14pt; color: #d4af37; margin-bottom: 40px; font-weight: 300; text-align: center;">
                    Integrated Agriculture, Agro-Processing & Dairy Value Chain Initiative
                </p>
                
                <!-- Three Pillars -->
                <table style="width: 90%; margin: 0 auto 40px auto; border-spacing: 15px; border-collapse: separate; border: 0;">
                    <tr>
                        <td style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; text-align: center; width: 33%; border: 1px solid rgba(255,255,255,0.2);">
                            <div style="font-size: 10pt; color: #d4af37; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Pillar 1</div>
                            <div style="font-size: 20pt; font-weight: bold; color: #fff;">Coffee</div>
                            <div style="font-size: 11pt; color: #ccc; margin-top: 5px;">E 9.4M</div>
                        </td>
                        <td style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; text-align: center; width: 33%; border: 1px solid rgba(255,255,255,0.2);">
                            <div style="font-size: 10pt; color: #d4af37; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Pillar 2</div>
                            <div style="font-size: 20pt; font-weight: bold; color: #fff;">Water</div>
                            <div style="font-size: 11pt; color: #ccc; margin-top: 5px;">E 0.3M</div>
                        </td>
                        <td style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; text-align: center; width: 33%; border: 1px solid rgba(255,255,255,0.2);">
                            <div style="font-size: 10pt; color: #d4af37; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Pillar 3</div>
                            <div style="font-size: 20pt; font-weight: bold; color: #fff;">Dairy</div>
                            <div style="font-size: 11pt; color: #ccc; margin-top: 5px;">R 32M</div>
                        </td>
                    </tr>
                </table>
                
                <!-- Key Stats -->
                <table style="width: 80%; margin: 0 auto 50px auto; border-spacing: 20px; border-collapse: separate; border: 0;">
                    <tr>
                        <td style="background: #d4af37; padding: 20px; border-radius: 8px; text-align: center; width: 50%;">
                            <div style="font-size: 32pt; font-weight: bold; color: #1a472a;">E 41.7M</div>
                            <div style="font-size: 10pt; color: #1a472a; text-transform: uppercase; letter-spacing: 1px;">Total Investment</div>
                        </td>
                        <td style="background: #d4af37; padding: 20px; border-radius: 8px; text-align: center; width: 50%;">
                            <div style="font-size: 32pt; font-weight: bold; color: #1a472a;">396%</div>
                            <div style="font-size: 10pt; color: #1a472a; text-transform: uppercase; letter-spacing: 1px;">5-Year ROI</div>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer Info -->
                <div style="font-size: 11pt; line-height: 1.8; color: #e0e0e0;">
                    <p style="margin: 5px 0; text-align: center;"><b>Submitted to:</b> Public Service Pensions Fund (PSPF)</p>
                    <p style="margin: 5px 0; text-align: center;"><b>Prepared by:</b> Alex Tsela Global (ATG) Holdings</p>
                    <p style="margin: 5px 0; text-align: center;"><b>Contact:</b> Alex@satsi.co.za | +27 66 472 5666</p>
                    <p style="margin: 5px 0; text-align: center;"><b>Date:</b> January 2026</p>
                    <div style="margin-top: 30px; color: #d4af37; letter-spacing: 2px; font-size: 9pt; text-transform: uppercase; opacity: 0.9;">
                        Confidential — Investment Memorandum
                    </div>
                </div>

            </td>
        </tr>
    </table>
</div>
"""

# Investment Summary Infographic
investment_summary = """
<div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid #1a472a; border-radius: 10px; padding: 25px; margin: 25px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #1a472a; border: none; padding: 0; font-size: 16pt;">Investment at a Glance</h3>
    <table style="width: 100%; border-spacing: 15px; border-collapse: separate; margin-top: 20px;">
        <tr>
            <td style="background: #1a472a; color: white; padding: 20px; border-radius: 8px; text-align: center; width: 25%; border: none;">
                <div style="font-size: 24pt; font-weight: bold;">E 41.7M</div>
                <div style="font-size: 9pt; opacity: 0.9; margin-top: 5px;">Total Investment</div>
            </td>
            <td style="background: #2d5a3d; color: white; padding: 20px; border-radius: 8px; text-align: center; width: 25%; border: none;">
                <div style="font-size: 24pt; font-weight: bold;">620+</div>
                <div style="font-size: 9pt; opacity: 0.9; margin-top: 5px;">Jobs Created</div>
            </td>
            <td style="background: #d4af37; color: #1a472a; padding: 20px; border-radius: 8px; text-align: center; width: 25%; border: none;">
                <div style="font-size: 24pt; font-weight: bold;">396%</div>
                <div style="font-size: 9pt; opacity: 0.9; margin-top: 5px;">5-Year ROI</div>
            </td>
            <td style="background: #28a745; color: white; padding: 20px; border-radius: 8px; text-align: center; width: 25%; border: none;">
                <div style="font-size: 24pt; font-weight: bold;">E 558M</div>
                <div style="font-size: 9pt; opacity: 0.9; margin-top: 5px;">5-Year Revenue</div>
            </td>
        </tr>
    </table>
</div>
"""

# Pillar Allocation Chart
pillar_allocation = """
<div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #1a472a; border: none; padding: 0;">Investment Allocation by Pillar</h3>
    <table style="width: 100%; border-spacing: 15px; border-collapse: separate; margin-top: 15px;">
        <tr>
            <td style="width: 33%; background: #f0f7f2; border-top: 5px solid #1a472a; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                <div style="font-size: 10pt; font-weight: bold; color: #1a472a; text-transform: uppercase; letter-spacing: 1px;">Coffee</div>
                <div style="font-size: 28pt; font-weight: bold; color: #1a472a; margin: 10px 0;">22%</div>
                <div style="font-size: 14pt; color: #333; font-weight: bold;">E 9.4M</div>
                <div style="font-size: 9pt; color: #666; margin-top: 5px;">60 Ha, 240K trees</div>
            </td>
            <td style="width: 33%; background: #e3f2fd; border-top: 5px solid #1976d2; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                <div style="font-size: 10pt; font-weight: bold; color: #1976d2; text-transform: uppercase; letter-spacing: 1px;">Spring Water</div>
                <div style="font-size: 28pt; font-weight: bold; color: #1976d2; margin: 10px 0;">1%</div>
                <div style="font-size: 14pt; color: #333; font-weight: bold;">E 0.3M</div>
                <div style="font-size: 9pt; color: #666; margin-top: 5px;">Immediate cash flow</div>
            </td>
            <td style="width: 33%; background: #fff8e1; border-top: 5px solid #d4af37; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                <div style="font-size: 10pt; font-weight: bold; color: #997e2f; text-transform: uppercase; letter-spacing: 1px;">Dairy</div>
                <div style="font-size: 28pt; font-weight: bold; color: #d4af37; margin: 10px 0;">77%</div>
                <div style="font-size: 14pt; color: #333; font-weight: bold;">R 32M</div>
                <div style="font-size: 9pt; color: #666; margin-top: 5px;">3M L/year capacity</div>
            </td>
        </tr>
    </table>
</div>
"""

# 5-Year Revenue Chart
revenue_chart = """
<div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #1a472a; border: none; padding: 0;">5-Year Revenue Projection</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
            <td style="width: 70px; font-weight: bold; padding: 10px 0; border: none;">Year 1</td>
            <td style="padding: 10px 0; border: none;"><div style="background: linear-gradient(90deg, #1a472a, #2d5a3d); width: 33%; height: 28px; border-radius: 4px;"></div></td>
            <td style="width: 80px; text-align: right; font-weight: bold; color: #1a472a; border: none;">E 62.9M</td>
        </tr>
        <tr>
            <td style="width: 70px; font-weight: bold; padding: 10px 0; border: none;">Year 2</td>
            <td style="padding: 10px 0; border: none;"><div style="background: linear-gradient(90deg, #1a472a, #2d5a3d); width: 36%; height: 28px; border-radius: 4px;"></div></td>
            <td style="width: 80px; text-align: right; font-weight: bold; color: #1a472a; border: none;">E 69.2M</td>
        </tr>
        <tr>
            <td style="width: 70px; font-weight: bold; padding: 10px 0; border: none;">Year 3</td>
            <td style="padding: 10px 0; border: none;"><div style="background: linear-gradient(90deg, #1a472a, #2d5a3d); width: 49%; height: 28px; border-radius: 4px;"></div></td>
            <td style="width: 80px; text-align: right; font-weight: bold; color: #1a472a; border: none;">E 93.8M</td>
        </tr>
        <tr>
            <td style="width: 70px; font-weight: bold; padding: 10px 0; border: none;">Year 4</td>
            <td style="padding: 10px 0; border: none;"><div style="background: linear-gradient(90deg, #1a472a, #2d5a3d); width: 73%; height: 28px; border-radius: 4px;"></div></td>
            <td style="width: 80px; text-align: right; font-weight: bold; color: #1a472a; border: none;">E 140.1M</td>
        </tr>
        <tr>
            <td style="width: 70px; font-weight: bold; padding: 10px 0; border: none;">Year 5</td>
            <td style="padding: 10px 0; border: none;"><div style="background: linear-gradient(90deg, #d4af37, #e8c252); width: 100%; height: 28px; border-radius: 4px;"></div></td>
            <td style="width: 80px; text-align: right; font-weight: bold; color: #d4af37; border: none;">E 192.0M</td>
        </tr>
    </table>
    <div style="text-align: center; margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
        <strong>5-Year Cumulative Revenue: </strong><span style="color: #1a472a; font-size: 14pt; font-weight: bold;">E 558 Million</span>
    </div>
</div>
"""

# ROI Calculation Visual
roi_visual = """
<div style="background: linear-gradient(135deg, #f0f7f2 0%, #e8f5e9 100%); border: 2px solid #1a472a; border-radius: 10px; padding: 25px; margin: 25px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #1a472a; border: none; padding: 0; font-size: 16pt;">Return on Investment</h3>
    <table style="width: 100%; border-spacing: 20px; border-collapse: separate; margin-top: 15px;">
        <tr>
            <td style="background: white; border: 2px solid #1a472a; padding: 20px; text-align: center; border-radius: 8px; width: 30%;">
                <div style="font-size: 10pt; color: #666; font-weight: bold; text-transform: uppercase;">Investment</div>
                <div style="font-size: 26pt; font-weight: bold; color: #1a472a; margin-top: 8px;">E 41.7M</div>
            </td>
            <td style="text-align: center; font-size: 28pt; color: #d4af37; width: 10%; border: none;">→</td>
            <td style="background: white; border: 2px solid #28a745; padding: 20px; text-align: center; border-radius: 8px; width: 30%;">
                <div style="font-size: 10pt; color: #666; font-weight: bold; text-transform: uppercase;">5-Year Net Profit</div>
                <div style="font-size: 26pt; font-weight: bold; color: #28a745; margin-top: 8px;">E 165M+</div>
            </td>
            <td style="text-align: center; font-size: 28pt; color: #d4af37; width: 10%; border: none;">→</td>
            <td style="background: #d4af37; padding: 20px; text-align: center; border-radius: 8px; width: 20%;">
                <div style="font-size: 10pt; color: #1a472a; font-weight: bold; text-transform: uppercase;">5-Year ROI</div>
                <div style="font-size: 30pt; font-weight: bold; color: #1a472a; margin-top: 8px;">396%</div>
            </td>
        </tr>
    </table>
    <div style="text-align: center; margin-top: 15px; font-size: 12pt; color: #555;">
        <strong>Payback Period:</strong> 18-24 months (Dairy + Spring Water provide early cash flow)
    </div>
</div>
"""

# Inject visuals into HTML
# After Executive Summary heading
exec_summary_target = '<h2>Executive Summary</h2>'
if exec_summary_target in html_body:
    html_body = html_body.replace(exec_summary_target, exec_summary_target)

# After Investment Highlights table  
highlights_target = '<h3>Investment Highlights at a Glance</h3>'
if highlights_target in html_body:
    # Find and replace after the table
    html_body = html_body.replace(highlights_target, investment_summary + highlights_target)

# After "The Three Pillars" section
pillars_target = '<h2>2. The Three Pillars — Project Overview</h2>'
if pillars_target in html_body:
    html_body = html_body.replace(pillars_target, pillars_target + pillar_allocation)

# Before Consolidated Revenue section
revenue_target = '<h2>13. Consolidated Revenue Projections</h2>'
if revenue_target in html_body:
    html_body = html_body.replace(revenue_target, revenue_target + revenue_chart)

# After ROI mention
roi_target = '<h3>18.1 Investment Thesis</h3>'
if roi_target in html_body:
    html_body = html_body.replace(roi_target, roi_visual + roi_target)

# Build full HTML
full_html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{css}</style>
</head>
<body>
{cover_page}
<div class="content">
{html_body}
</div>
</body>
</html>
"""

# Write PDF
output_file = Path('/workspaces/WorldClass-ERP/atg-proposals/ATG-PSPF-CONSOLIDATED-PROPOSAL.pdf')
HTML(string=full_html, base_url=str(md_file.parent)).write_pdf(str(output_file))
print(f"✅ PDF generated: {output_file} ({output_file.stat().st_size / 1024:.1f} KB)")
