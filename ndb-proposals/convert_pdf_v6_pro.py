#!/usr/bin/env python3
"""Convert NDB Proposal - V6 PROFESSIONAL FIX
1. Cover Page: Uses HTML Table for vertical centering (100% reliable in WeasyPrint).
2. Page Breaks: Explicit `page-break-after: always` prevents overflow.
3. Margins: Zero margins for cover, standard margins for content.
"""

import markdown
from weasyprint import HTML, CSS
from pathlib import Path
import re

# 1. Read Content
md_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.md')
md_content = md_file.read_text()

# Fix Contact Info
md_content = md_content.replace('Alex Tsela Global (ATG) Holdings', 'Alex Tsela Global Finance')
md_content = md_content.replace('Email: [To be provided]', 'Email: Alex@satsi.co.za')
md_content = md_content.replace('Phone: [To be provided]', 'Phone: +27 66 472 5666')

# 2. Convert to HTML
md_converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
html_body = md_converter.convert(md_content)

# 3. Define Visual Components (HTML Tables)

# Investment Cards
investment_box = """
<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 30px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #0a2540; border-bottom: 2px solid #0a2540; padding-bottom: 10px; margin-bottom: 20px;">Investment at a Glance</h3>
    <table style="width: 100%; border-spacing: 12px; border-collapse: separate;">
        <tr>
            <td style="background-color: #0a2540; color: white; padding: 15px; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 22pt; font-weight: bold;">$5M</div>
                <div style="font-size: 8pt; opacity: 0.9; margin-top: 4px;">Seed Capital</div>
            </td>
            <td style="background-color: #28a745; color: white; padding: 15px; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 22pt; font-weight: bold;">$1.2B</div>
                <div style="font-size: 8pt; opacity: 0.9; margin-top: 4px;">3-Year Target</div>
            </td>
            <td style="background-color: #d4af37; color: white; padding: 15px; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 22pt; font-weight: bold;">360%</div>
                <div style="font-size: 8pt; opacity: 0.9; margin-top: 4px;">Year 1 ROI</div>
            </td>
            <td style="background-color: #6f42c1; color: white; padding: 15px; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 22pt; font-weight: bold;">$60M</div>
                <div style="font-size: 8pt; opacity: 0.9; margin-top: 4px;">3-Year Commission</div>
            </td>
        </tr>
    </table>
</div>
"""

# Operational Model 
op_model_box = """
<div style="margin: 30px 0; page-break-inside: avoid;">
    <h3 style="color: #0a2540; border-bottom: 2px solid #0a2540; padding-bottom: 5px;">3.3 Operational Model (Visualized)</h3>
    
    <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px; color: #1a4480;">Model 1: Deal Connector</h4>
        <table style="width: 100%; text-align: center;">
            <tr>
                <td style="width: 25%; background: #e0e7ff; padding: 12px; border-radius: 6px; font-weight: bold; color: #1a4480;">Funder</td>
                <td style="width: 12%; color: #d4af37; font-size: 24pt;">&#8594;</td>
                <td style="width: 26%; background: #0a2540; color: white; padding: 12px; border-radius: 6px; position: relative;">
                    <b>NDB-SS</b>
                    <br/><span style="font-size: 8pt; color: #d4af37;">5% Commission</span>
                </td>
                <td style="width: 12%; color: #d4af37; font-size: 24pt;">&#8594;</td>
                <td style="width: 25%; background: #e0e7ff; padding: 12px; border-radius: 6px; font-weight: bold; color: #1a4480;">Project</td>
            </tr>
        </table>
    </div>

    <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px; color: #1a4480;">Model 2: Paymaster</h4>
        <table style="width: 100%; text-align: center;">
            <tr>
                <td style="width: 25%; background: #e8f5e9; padding: 12px; border-radius: 6px; font-weight: bold; color: #28a745;">Funder</td>
                <td style="width: 12%; color: #28a745; font-size: 24pt;">&#8594;</td>
                <td style="width: 26%; background: #0a2540; color: white; padding: 12px; border-radius: 6px;">
                    <b>NDB Account</b>
                    <br/><span style="font-size: 8pt; color: #28a745;">Mgmt Fee</span>
                </td>
                <td style="width: 12%; color: #28a745; font-size: 24pt;">&#8594;</td>
                <td style="width: 25%; background: #e8f5e9; padding: 12px; border-radius: 6px; font-weight: bold; color: #28a745;">Disbursements</td>
            </tr>
        </table>
    </div>

    <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
        <h4 style="margin: 0 0 10px; color: #1a4480;">Model 3: Co-Investment</h4>
        <table style="width: 100%; text-align: center;">
            <tr>
                <td style="width: 40%; background: #0a2540; color: white; padding: 12px; border-radius: 6px; font-weight: bold;">
                    NDB-SS + Partners
                </td>
                <td style="width: 15%; color: #d4af37; font-size: 24pt;">&#8594;</td>
                <td style="width: 40%; background: #d4af37; color: white; padding: 12px; border-radius: 6px; font-weight: bold; color: #0a2540;">
                    Project Yield
                    <br/><span style="font-size: 8pt; opacity: 0.8;">Returns + Carry</span>
                </td>
            </tr>
        </table>
    </div>
</div>
"""

# Sectors Allocation (Card Design)
sector_box = """
<div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin: 20px 0; page-break-inside: avoid; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h3 style="text-align: center; margin-top: 0; color: #0a2540;">Priority Sectors Allocation</h3>
    <p style="text-align: center; color: #666; font-size: 10pt; margin-bottom: 20px; font-style: italic;">$900 Million (Total of Top 3 Priorities)</p>
    
    <table style="width: 100%; border-spacing: 15px; border-collapse: separate;">
        <tr>
            <!-- Roads Card -->
            <td style="width: 33%; background: #f0f4f8; border-top: 5px solid #0a2540; padding: 20px; text-align: center; border-radius: 0 0 6px 6px;">
                <div style="font-size: 10pt; font-weight: bold; color: #0a2540; text-transform: uppercase; letter-spacing: 1px;">Roads</div>
                <div style="font-size: 32pt; font-weight: bold; color: #0a2540; margin: 10px 0;">44%</div>
                <div style="font-size: 14pt; color: #333; font-weight: bold;">$400M</div>
                <div style="font-size: 9pt; color: #666; margin-top: 5px;">Juba-Nimule</div>
            </td>
            
            <!-- Mining Card -->
            <td style="width: 33%; background: #fff8e1; border-top: 5px solid #d4af37; padding: 20px; text-align: center; border-radius: 0 0 6px 6px;">
                <div style="font-size: 10pt; font-weight: bold; color: #997e2f; text-transform: uppercase; letter-spacing: 1px;">Mining</div>
                <div style="font-size: 32pt; font-weight: bold; color: #d4af37; margin: 10px 0;">33%</div>
                <div style="font-size: 14pt; color: #333; font-weight: bold;">$300M</div>
                <div style="font-size: 9pt; color: #666; margin-top: 5px;">Gold (Kapoeta)</div>
            </td>
            
            <!-- Agro Card -->
            <td style="width: 33%; background: #e8f5e9; border-top: 5px solid #28a745; padding: 20px; text-align: center; border-radius: 0 0 6px 6px;">
                <div style="font-size: 10pt; font-weight: bold; color: #2e7d32; text-transform: uppercase; letter-spacing: 1px;">Agriculture</div>
                <div style="font-size: 32pt; font-weight: bold; color: #28a745; margin: 10px 0;">22%</div>
                <div style="font-size: 14pt; color: #333; font-weight: bold;">$200M</div>
                <div style="font-size: 9pt; color: #666; margin-top: 5px;">Processing</div>
            </td>
        </tr>
    </table>
</div>
"""

# Governance / Org Structure
org_box = """
<div style="margin: 20px 0; border: 1px solid #ddd; padding: 15px; border-radius: 8px; page-break-inside: avoid;">
    <h3 style="text-align: center; color: #0a2540; margin-top: 0;">Governance Structure</h3>
    <table style="width: 100%; border-spacing: 8px; border-collapse: separate;">
        <tr>
            <td colspan="3" style="background: #0a2540; color: white; text-align: center; padding: 12px; border-radius: 6px;">
                <div style="font-weight: bold; letter-spacing: 1px;">BOARD OF DIRECTORS</div>
                <div style="font-size: 8pt; opacity: 0.8; margin-top: 4px;">Government + Partners + Independent</div>
            </td>
        </tr>
        <tr><td colspan="3" style="text-align: center; font-size: 14pt; color: #ccc; padding: 0; line-height: 1;">|</td></tr>
        <tr>
            <td style="background: #1a4480; color: white; text-align: center; padding: 10px; border-radius: 6px; width: 33%; font-size: 9pt;">Risk Committee</td>
            <td style="background: #1a4480; color: white; text-align: center; padding: 10px; border-radius: 6px; width: 33%; font-size: 9pt;">Audit Committee</td>
            <td style="background: #1a4480; color: white; text-align: center; padding: 10px; border-radius: 6px; width: 33%; font-size: 9pt;">Investment Committee</td>
        </tr>
        <tr><td colspan="3" style="text-align: center; font-size: 14pt; color: #ccc; padding: 0; line-height: 1;">|</td></tr>
        <tr>
            <td colspan="3" style="background: #d4af37; color: white; text-align: center; padding: 12px; border-radius: 6px; font-weight: bold; color: #000; letter-spacing: 1px;">
                MANAGING DIRECTOR / CEO
            </td>
        </tr>
        <tr><td colspan="3" style="text-align: center; font-size: 14pt; color: #ccc; padding: 0; line-height: 1;">|</td></tr>
        <tr>
            <td style="background: #28a745; color: white; text-align: center; padding: 10px; border-radius: 6px; width: 33%;">
                <div style="font-weight: bold; font-size: 10pt;">CFO</div>
                <div style="font-size: 8pt;">Finance</div>
            </td>
            <td style="background: #28a745; color: white; text-align: center; padding: 10px; border-radius: 6px; width: 33%;">
                <div style="font-weight: bold; font-size: 10pt;">Dev Finance</div>
                <div style="font-size: 8pt;">Deals</div>
            </td>
            <td style="background: #28a745; color: white; text-align: center; padding: 10px; border-radius: 6px; width: 33%;">
                <div style="font-weight: bold; font-size: 10pt;">Operations</div>
                <div style="font-size: 8pt;">Projects</div>
            </td>
        </tr>
    </table>
</div>
"""

# Revenue Chart
revenue_box = """
<div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #0a2540;">5-Year Revenue Projection</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr><td style="width: 60px; font-weight: bold; padding: 8px 0;">Year 1</td><td style="padding: 8px 0;"><div style="background: #0a2540; width: 27%; height: 24px; border-radius: 4px;"></div></td><td style="width: 60px; text-align: right; font-weight: bold; color: #0a2540;">$24M</td></tr>
        <tr><td style="width: 60px; font-weight: bold; padding: 8px 0;">Year 2</td><td style="padding: 8px 0;"><div style="background: #1a4480; width: 33%; height: 24px; border-radius: 4px;"></div></td><td style="width: 60px; text-align: right; font-weight: bold; color: #1a4480;">$29M</td></tr>
        <tr><td style="width: 60px; font-weight: bold; padding: 8px 0;">Year 3</td><td style="padding: 8px 0;"><div style="background: #2c5aa0; width: 39%; height: 24px; border-radius: 4px;"></div></td><td style="width: 60px; text-align: right; font-weight: bold; color: #2c5aa0;">$34M</td></tr>
        <tr><td style="width: 60px; font-weight: bold; padding: 8px 0;">Year 4</td><td style="padding: 8px 0;"><div style="background: #28a745; width: 63%; height: 24px; border-radius: 4px;"></div></td><td style="width: 60px; text-align: right; font-weight: bold; color: #28a745;">$55M</td></tr>
        <tr><td style="width: 60px; font-weight: bold; padding: 8px 0;">Year 5</td><td style="padding: 8px 0;"><div style="background: #d4af37; width: 100%; height: 24px; border-radius: 4px;"></div></td><td style="width: 60px; text-align: right; font-weight: bold; color: #d4af37;">$88M</td></tr>
    </table>
</div>
"""

# ROI Cards
roi_box = """
<div style="background: #eef6ff; border: 2px solid #0a2540; border-radius: 8px; padding: 25px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #0a2540; margin-bottom: 20px;">Return on Investment</h3>
    <table style="width: 100%; border-spacing: 20px; border-collapse: separate;">
        <tr>
            <td style="background: white; border: 1px solid #ddd; padding: 20px; text-align: center; border-radius: 8px; width: 25%;">
                <div style="font-size: 10pt; color: #666; font-weight: bold; text-transform: uppercase;">Seed</div>
                <div style="font-size: 24pt; font-weight: bold; color: #0a2540; margin-top: 5px;">$5M</div>
            </td>
            <td style="text-align: center; font-size: 24pt; color: #d4af37; width: 10%;">&#8594;</td>
            <td style="background: white; border: 1px solid #ddd; padding: 20px; text-align: center; border-radius: 8px; width: 25%;">
                <div style="font-size: 10pt; color: #666; font-weight: bold; text-transform: uppercase;">Y1 Profit</div>
                <div style="font-size: 24pt; font-weight: bold; color: #28a745; margin-top: 5px;">$18M</div>
            </td>
            <td style="text-align: center; font-size: 24pt; color: #d4af37; width: 10%;">&#8594;</td>
            <td style="background: #d4af37; padding: 20px; text-align: center; border-radius: 8px; color: white; width: 30%;">
                <div style="font-size: 10pt; opacity: 0.9; font-weight: bold; text-transform: uppercase;">Y1 ROI</div>
                <div style="font-size: 28pt; font-weight: bold; margin-top: 5px;">360%</div>
            </td>
        </tr>
    </table>
</div>
"""

# 4. INJECT HTML AT SPECIFIC ANCHORS

# A. Investment at a Glance 
target = '<h3 id="strategic-value-proposition">Strategic Value Proposition</h3>'
if target in html_body:
    html_body = html_body.replace(target, investment_box + target)
else:
    html_body = html_body.replace('<h3>Strategic Value Proposition</h3>', investment_box + '<h3>Strategic Value Proposition</h3>')

# B. Operational Model
op_section_pattern = re.compile(r'<h3[^>]*>3\.3 Operational Model</h3>.*?<h2[^>]*>4\. Strategic Sectors</h2>', re.DOTALL)
html_body = op_section_pattern.sub(op_model_box + '<div style="page-break-before: always;"></div><h2 id="4-strategic-sectors">4. Strategic Sectors</h2>', html_body)

# C. Sector Allocation
target_sector = '<p><strong>Conservative Mobilization Target: $1.2 Billion over 3 Years</strong></p>'
if target_sector in html_body:
    html_body = html_body.replace(target_sector, sector_box + target_sector)

# D. Org Structure
org_pattern = re.compile(r'<h3[^>]*>6\.1 Governance Framework</h3>\s*<pre><code>.*?</code></pre>', re.DOTALL)
html_body = org_pattern.sub('<h3 id="61-governance-framework">6.1 Governance Framework</h3>' + org_box, html_body)

# E. Revenue Chart
target_rev = '<h3 id="72-capital-deployment-trajectory-conservative">7.2 Capital Deployment Trajectory (Conservative)</h3>'
if target_rev in html_body:
    html_body = html_body.replace(target_rev, revenue_box + target_rev)

# F. ROI
roi_target = '<h3 id="113-strategic-partnership-opportunity">11.3 Strategic Partnership Opportunity</h3>'
if roi_target in html_body:
    html_body = html_body.replace(roi_target, roi_box + roi_target)


# 5. CSS Strategy
css = """
/* Page Settings */
@page { 
    size: A4; 
    margin: 2.5cm 2cm; /* Standard margins for content pages */
    @top-center {
        content: "NDB South Sudan - Investment Memorandum";
        font-family: Arial, sans-serif;
        font-size: 9pt;
        color: #888;
        border-bottom: 1px solid #eee;
        width: 100%;
        padding-bottom: 10px;
    }
    @bottom-center {
        content: "Page " counter(page);
        font-family: Arial, sans-serif;
        font-size: 9pt;
        color: #888;
    }
}

/* Cover Page Specific Settings */
@page :first { 
    margin: 0; /* Zero margin for full bleed */
    @top-center { content: none; }
    @bottom-center { content: none; }
}

body { 
    font-family: Arial, Helvetica, sans-serif; 
    font-size: 11pt; 
    line-height: 1.6; 
    color: #333; 
    margin: 0;
    padding: 0;
}

/* Typography */
h1 { color: #0a2540; font-size: 22pt; border-bottom: 2px solid #0a2540; padding-bottom: 10px; margin-top: 30px; }
h2 { color: #0a2540; font-size: 16pt; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 25px; }
h3 { color: #1a4480; font-size: 13pt; margin-top: 20px; }
p { margin-bottom: 12px; text-align: justify; }

/* Tables */
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #0a2540; color: white; padding: 10px; text-align: left; }
td { border: 1px solid #ddd; padding: 10px; }
code { white-space: pre-wrap; } 

/* Cover Page Component */
.cover-page {
    width: 210mm;
    height: 297mm;
    background: linear-gradient(180deg, #0a2540 0%, #1a4480 100%);
    color: white;
    box-sizing: border-box;
    page-break-after: always; /* KEY FIX: Forces new page */
}
"""

# Cover Page HTML using TABLE for flawless vertical centering
cover_page = """
<div class="cover-page">
    <table style="width: 100%; height: 100%; border: 0; border-collapse: collapse;">
        <tr>
            <td style="vertical-align: middle; text-align: center; border: 0; padding: 40px;">
                
                <!-- Logo -->
                <div style="display: inline-block; padding: 25px; border: 4px solid #d4af37; border-radius: 50%; width: 120px; height: 120px; margin-bottom: 30px; background: rgba(255,255,255,0.05);">
                    <div style="font-size: 36pt; font-weight: bold; color: #fff; line-height: 1; margin-top: 10px;">NDB</div>
                    <div style="font-size: 9pt; color: #d4af37; font-weight: bold; margin-top: 8px;">SOUTH SUDAN</div>
                </div>
                
                <!-- Title -->
                <h1 style="font-size: 34pt; color: #fff; margin: 0 0 15px 0; border: none; letter-spacing: 1px;">National Development Bank<br/>of South Sudan</h1>
                
                <p style="font-size: 16pt; color: #d4af37; margin-bottom: 50px; font-weight: 300; text-align: center;">Investment & Development Finance Business Plan</p>
                
                <!-- Stats -->
                <table style="width: 100%; margin: 0 auto 50px auto; border-spacing: 20px; border-collapse: separate; border: 0;">
                    <tr>
                        <td style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 12px; text-align: center; width: 33%; border: 1px solid rgba(255,255,255,0.1);">
                            <div style="font-size: 38pt; font-weight: bold; color: #d4af37;">$1.2B</div>
                            <div style="font-size: 10pt; color: #ccc; text-transform: uppercase; letter-spacing: 1px;">3-Year Target</div>
                        </td>
                        <td style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 12px; text-align: center; width: 33%; border: 1px solid rgba(255,255,255,0.1);">
                            <div style="font-size: 38pt; font-weight: bold; color: #d4af37;">$5M</div>
                            <div style="font-size: 10pt; color: #ccc; text-transform: uppercase; letter-spacing: 1px;">Seed Capital</div>
                        </td>
                        <td style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 12px; text-align: center; width: 33%; border: 1px solid rgba(255,255,255,0.1);">
                            <div style="font-size: 38pt; font-weight: bold; color: #d4af37;">360%</div>
                            <div style="font-size: 10pt; color: #ccc; text-transform: uppercase; letter-spacing: 1px;">Year 1 ROI</div>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer Info -->
                <div style="font-size: 11pt; line-height: 1.8; color: #e0e0e0;">
                    <p style="margin: 5px 0; text-align: center;"><b>Presented to:</b> Strategic Investment Partners</p>
                    <p style="margin: 5px 0; text-align: center;"><b>Prepared by:</b> Alex Tsela Global Finance</p>
                    <p style="margin: 5px 0; text-align: center;"><b>Contact:</b> Alex@satsi.co.za | +27 66 472 5666</p>
                    <p style="margin: 5px 0; text-align: center;"><b>Date:</b> January 2026</p>
                    <div style="margin-top: 40px; color: #d4af37; letter-spacing: 3px; font-size: 9pt; text-transform: uppercase; opacity: 0.8;">Confidential — Investment Memorandum</div>
                </div>

            </td>
        </tr>
    </table>
</div>
"""

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

# 7. Write PDF
output_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.pdf')
HTML(string=full_html, base_url=str(md_file.parent)).write_pdf(str(output_file))
print(f"✅ PDF generated: {output_file} ({output_file.stat().st_size / 1024:.1f} KB)")
