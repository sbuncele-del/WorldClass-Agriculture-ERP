#!/usr/bin/env python3
"""Convert NDB Proposal - FINAL CORRECTED VERSION
1. Restores Headers
2. Fixes 'Empty' Infographics (using Tables)
3. FIXES MISSING CONTACT INFO
4. REPLACES ASCII OPERATIONAL MODEL WITH GRAPHIC
5. INJECTS INFOGRAPHICS AT CORRECT LOCATIONS (No placeholders)
"""

import markdown
from weasyprint import HTML, CSS
from pathlib import Path
import re

# 1. Read and update markdown
md_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.md')
md_content = md_file.read_text()

# --- CONTENT FIXES ---
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
    <table style="width: 100%; border-spacing: 10px; border-collapse: separate;">
        <tr>
            <td style="background-color: #0a2540; color: white; padding: 15px; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 24pt; font-weight: bold;">$5M</div>
                <div style="font-size: 9pt; opacity: 0.9;">Seed Capital</div>
            </td>
            <td style="background-color: #28a745; color: white; padding: 15px; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 24pt; font-weight: bold;">$1.2B</div>
                <div style="font-size: 9pt; opacity: 0.9;">3-Year Target</div>
            </td>
            <td style="background-color: #d4af37; color: white; padding: 15px; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 24pt; font-weight: bold;">360%</div>
                <div style="font-size: 9pt; opacity: 0.9;">Year 1 ROI</div>
            </td>
            <td style="background-color: #6f42c1; color: white; padding: 15px; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 24pt; font-weight: bold;">$60M</div>
                <div style="font-size: 9pt; opacity: 0.9;">3-Year Commission</div>
            </td>
        </tr>
    </table>
</div>
"""

# Operational Model (Replaces ASCII)
op_model_box = """
<div style="margin: 20px 0; page-break-inside: avoid;">
    <h3 style="color: #0a2540; border-bottom: 2px solid #0a2540; padding-bottom: 5px;">3.3 Operational Model</h3>
    
    <!-- Model 1 -->
    <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px; color: #1a4480;">Model 1: Deal Connector (Commission Model)</h4>
        <table style="width: 100%; text-align: center;">
            <tr>
                <td style="width: 25%; background: #eef; padding: 10px; border-radius: 5px; font-weight: bold;">Funder<br/><span style="font-size: 8pt; font-weight: normal;">(DFI/Investor)</span></td>
                <td style="width: 10%; color: #d4af37; font-size: 20pt;">&#8594;</td>
                <td style="width: 30%; background: #0a2540; color: white; padding: 10px; border-radius: 5px; position: relative;">
                    <b>NDB-SS</b>
                    <div style="position: absolute; bottom: -25px; left: 0; right: 0; color: #d4af37; font-size: 8pt; font-weight: bold;">5% Commission</div>
                </td>
                <td style="width: 10%; color: #d4af37; font-size: 20pt;">&#8594;</td>
                <td style="width: 25%; background: #eef; padding: 10px; border-radius: 5px; font-weight: bold;">National Project</td>
            </tr>
        </table>
        <div style="height: 20px;"></div>
    </div>

    <!-- Model 2 -->
    <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px; color: #1a4480;">Model 2: Paymaster (Transaction Model)</h4>
        <table style="width: 100%; text-align: center;">
            <tr>
                <td style="width: 25%; background: #eef; padding: 10px; border-radius: 5px; font-weight: bold;">Funder</td>
                <td style="width: 10%; color: #28a745; font-size: 20pt;">&#8594;</td>
                <td style="width: 30%; background: #0a2540; color: white; padding: 10px; border-radius: 5px; position: relative;">
                    <b>NDB-SS Account</b>
                    <div style="position: absolute; bottom: -25px; left: 0; right: 0; color: #28a745; font-size: 8pt; font-weight: bold;">Fund Mgmt Fee</div>
                </td>
                <td style="width: 10%; color: #28a745; font-size: 20pt;">&#8594;</td>
                <td style="width: 25%; background: #eef; padding: 10px; border-radius: 5px; font-weight: bold;">
                    Project Disbursements
                    <div style="color: #28a745; font-size: 8pt; margin-top: 5px;">Transaction Fees (0.5%)</div>
                </td>
            </tr>
        </table>
        <div style="height: 20px;"></div>
    </div>

    <!-- Model 3 -->
    <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
        <h4 style="margin: 0 0 10px; color: #1a4480;">Model 3: Co-Investment</h4>
        <table style="width: 100%; text-align: center;">
            <tr>
                <td style="width: 40%; background: #0a2540; color: white; padding: 10px; border-radius: 5px; font-weight: bold;">
                    NDB-SS Capital + Partner Capital
                </td>
                <td style="width: 10%; color: #d4af37; font-size: 20pt;">&#8594;</td>
                <td style="width: 40%; background: #d4af37; color: white; padding: 10px; border-radius: 5px; font-weight: bold;">
                    Project
                    <div style="color: #0a2540; font-size: 8pt; margin-top: 5px; background: rgba(255,255,255,0.8); padding: 2px; border-radius: 3px;">Returns + Carried Interest</div>
                </td>
            </tr>
        </table>
    </div>
</div>
"""

# Sectors Allocation
sector_box = """
<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #0a2540;">Priority Sectors Allocation</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
            <td style="width: 160px; text-align: right; padding-right: 15px; font-weight: bold;">Roads (Juba-Nimule)</td>
            <td style="padding: 5px 0;"><div style="background-color: #0a2540; width: 100%; color: white; padding: 5px 10px; font-weight: bold; border-radius: 4px;">$400M (44%)</div></td>
        </tr>
        <tr>
            <td style="width: 160px; text-align: right; padding-right: 15px; font-weight: bold;">Gold Mining</td>
            <td style="padding: 5px 0;"><div style="background-color: #d4af37; width: 75%; color: white; padding: 5px 10px; font-weight: bold; border-radius: 4px;">$300M (33%)</div></td>
        </tr>
        <tr>
            <td style="width: 160px; text-align: right; padding-right: 15px; font-weight: bold;">Agro-processing</td>
            <td style="padding: 5px 0;"><div style="background-color: #28a745; width: 50%; color: white; padding: 5px 10px; font-weight: bold; border-radius: 4px;">$200M (22%)</div></td>
        </tr>
    </table>
</div>
"""

# Governance / Org Structure
org_box = """
<div style="margin: 20px 0; border: 1px solid #ddd; padding: 15px; border-radius: 8px; page-break-inside: avoid;">
    <h3 style="text-align: center; color: #0a2540; margin-top: 0;">Governance Structure</h3>
    <table style="width: 100%; border-spacing: 5px; border-collapse: separate;">
        <tr><td colspan="3" style="background: #0a2540; color: white; text-align: center; padding: 10px; border-radius: 5px;"><div style="font-weight: bold;">BOARD OF DIRECTORS</div><div style="font-size: 8pt; opacity: 0.8;">Government + Partners + Independent</div></td></tr>
        <tr><td colspan="3" style="text-align: center; font-size: 14pt; color: #0a2540; padding: 0;">|</td></tr>
        <tr>
            <td style="background: #1a4480; color: white; text-align: center; padding: 8px; border-radius: 5px; width: 33%; font-size: 9pt;">Risk Committee</td>
            <td style="background: #1a4480; color: white; text-align: center; padding: 8px; border-radius: 5px; width: 33%; font-size: 9pt;">Audit Committee</td>
            <td style="background: #1a4480; color: white; text-align: center; padding: 8px; border-radius: 5px; width: 33%; font-size: 9pt;">Investment Committee</td>
        </tr>
        <tr><td colspan="3" style="text-align: center; font-size: 14pt; color: #0a2540; padding: 0;">|</td></tr>
        <tr><td colspan="3" style="background: #d4af37; color: white; text-align: center; padding: 10px; border-radius: 5px; font-weight: bold; color: #000;">MANAGING DIRECTOR / CEO</td></tr>
        <tr><td colspan="3" style="text-align: center; font-size: 14pt; color: #0a2540; padding: 0;">|</td></tr>
        <tr>
            <td style="background: #28a745; color: white; text-align: center; padding: 8px; border-radius: 5px; width: 33%;"><div style="font-weight: bold; font-size: 9pt;">CFO</div><div style="font-size: 8pt;">Finance</div></td>
            <td style="background: #28a745; color: white; text-align: center; padding: 8px; border-radius: 5px; width: 33%;"><div style="font-weight: bold; font-size: 9pt;">Dev Finance</div><div style="font-size: 8pt;">Deals</div></td>
            <td style="background: #28a745; color: white; text-align: center; padding: 8px; border-radius: 5px; width: 33%;"><div style="font-weight: bold; font-size: 9pt;">Operations</div><div style="font-size: 8pt;">Projects</div></td>
        </tr>
    </table>
</div>
"""

# Revenue Chart
revenue_box = """
<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #0a2540;">5-Year Revenue Projection</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr><td style="width: 60px; font-weight: bold; padding: 4px 0;">Year 1</td><td style="padding: 4px 0;"><div style="background: #0a2540; width: 27%; height: 20px; border-radius: 3px;"></div></td><td style="width: 50px; text-align: right; font-weight: bold;">$24M</td></tr>
        <tr><td style="width: 60px; font-weight: bold; padding: 4px 0;">Year 2</td><td style="padding: 4px 0;"><div style="background: #1a4480; width: 33%; height: 20px; border-radius: 3px;"></div></td><td style="width: 50px; text-align: right; font-weight: bold;">$29M</td></tr>
        <tr><td style="width: 60px; font-weight: bold; padding: 4px 0;">Year 3</td><td style="padding: 4px 0;"><div style="background: #2c5aa0; width: 39%; height: 20px; border-radius: 3px;"></div></td><td style="width: 50px; text-align: right; font-weight: bold;">$34M</td></tr>
        <tr><td style="width: 60px; font-weight: bold; padding: 4px 0;">Year 4</td><td style="padding: 4px 0;"><div style="background: #28a745; width: 63%; height: 20px; border-radius: 3px;"></div></td><td style="width: 50px; text-align: right; font-weight: bold;">$55M</td></tr>
        <tr><td style="width: 60px; font-weight: bold; padding: 4px 0;">Year 5</td><td style="padding: 4px 0;"><div style="background: #d4af37; width: 100%; height: 20px; border-radius: 3px;"></div></td><td style="width: 50px; text-align: right; font-weight: bold;">$88M</td></tr>
    </table>
</div>
"""

# ROI
roi_box = """
<div style="background: #eef6ff; border: 2px solid #0a2540; border-radius: 8px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #0a2540;">Return on Investment</h3>
    <table style="width: 100%; border-spacing: 15px; border-collapse: separate;">
        <tr>
            <td style="background: white; border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 8px;">
                <div style="font-size: 9pt; color: #666;">Seed</div>
                <div style="font-size: 20pt; font-weight: bold; color: #0a2540;">$5M</div>
            </td>
            <td style="text-align: center; font-size: 24pt; color: #d4af37; width: 30px;">&#8594;</td>
            <td style="background: white; border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 8px;">
                <div style="font-size: 9pt; color: #666;">Y1 Profit</div>
                <div style="font-size: 20pt; font-weight: bold; color: #28a745;">$18M</div>
            </td>
            <td style="text-align: center; font-size: 24pt; color: #d4af37; width: 30px;">&#8594;</td>
            <td style="background: #d4af37; padding: 15px; text-align: center; border-radius: 8px; color: white;">
                <div style="font-size: 9pt; opacity: 0.9;">Y1 ROI</div>
                <div style="font-size: 20pt; font-weight: bold;">360%</div>
            </td>
        </tr>
    </table>
    <div style="text-align: center; margin-top: 15px; font-size: 11pt;">
        3-Year: <b style="color:#28a745">$59M</b> Profit = <b style="color:#d4af37">1,180% ROI</b>
    </div>
</div>
"""

# 4. INJECT HTML AT SPECIFIC ANCHORS (The Magic Step)

# A. Investment at a Glance -> Executive Summary
# Insert after "Year 1 Return on Seed Investment | **360%** |" which ends the Investment Highlights table
highlight_anchor = "| **Year 1 Return on Seed Investment** | **360%** |"
if highlight_anchor in html_body:
    # We find this text and append the big visual box after the table closes
    # The table closes with </tbody></table> usually. 
    # Let's simple append it after the anchor, but we need to step out of the table first.
    # Actually, the markdown conversion puts the table there.
    # Let's insert it BEFORE "### Strategic Value Proposition"
    target = '<h3 id="strategic-value-proposition">Strategic Value Proposition</h3>'
    if target in html_body:
        html_body = html_body.replace(target, investment_box + target)
    else:
        # Fallback to text match if ID generation differs
        html_body = html_body.replace('<h3>Strategic Value Proposition</h3>', investment_box + '<h3>Strategic Value Proposition</h3>')

# B. Operational Model -> Remove ASCII, Insert Graphic
# We need to find the ASCII block. In HTML it will be <div class="codehilite"> or <pre><code>
start_op = '<h3 id="33-operational-model">3.3 Operational Model</h3>'
# We want to replace everything from here until "## 4. Strategic Sectors"
end_op = '<h2 id="4-strategic-sectors">4. Strategic Sectors</h2>'

# Regex to find the ASCII blocks in HTML
# The structure is H3 -> P -> PRE/CODE -> P -> PRE/CODE...
# It's safer to find the section header and inject the visual immediately after, shielding the ASCII art from view or removing it.
if start_op in html_body:
    # We will inject the visual box. The ASCII art below it is ugly. We should try to remove it.
    # The ASCII art is likely in <pre> tags.
    # Let's just insert the new model and CSS hide the pre tags in that specific section if possible? Hard.
    # Better: We replaced the ASCII in Markdown step? No, I commented that out to be safe.
    # Let's use the replacement_marker approach if we can find the text.
    pass 

# Let's retry the ASCII removal using the HTML content which is predictable
# It usually looks like: <p><strong>Model 1: ...</strong></p>\n<pre><code>...</code></pre>
# We can just replace the whole section.
op_section_pattern = re.compile(r'<h3[^>]*>3\.3 Operational Model</h3>.*?<h2[^>]*>4\. Strategic Sectors</h2>', re.DOTALL)
html_body = op_section_pattern.sub(op_model_box + '<div style="page-break-before: always;"></div><h2 id="4-strategic-sectors">4. Strategic Sectors</h2>', html_body)


# C. Sector Allocation -> Insert before "Conservative Mobilization Target"
target_sector = '<p><strong>Conservative Mobilization Target: $1.2 Billion over 3 Years</strong></p>'
if target_sector in html_body:
    html_body = html_body.replace(target_sector, sector_box + target_sector)

# D. Org Structure -> Replace the ASCII art
# Identify the ASCII art container. usually <pre><code>┌─...
org_pattern = re.compile(r'<h3[^>]*>6\.1 Governance Framework</h3>\s*<pre><code>.*?</code></pre>', re.DOTALL)
html_body = org_pattern.sub('<h3 id="61-governance-framework">6.1 Governance Framework</h3>' + org_box, html_body)

# E. Revenue Chart -> After the revenue table
# The table ends before "### 7.2 Capital Deployment"
target_rev = '<h3 id="72-capital-deployment-trajectory-conservative">7.2 Capital Deployment Trajectory (Conservative)</h3>'
if target_rev in html_body:
    html_body = html_body.replace(target_rev, revenue_box + target_rev)

# F. ROI -> After "11.2 Return Profile"
roi_target = '<h3 id="113-strategic-partnership-opportunity">11.3 Strategic Partnership Opportunity</h3>'
if roi_target in html_body:
    html_body = html_body.replace(roi_target, roi_box + roi_target)


# 5. CSS
css = """
@page { 
    size: A4; 
    margin: 2.5cm 2cm; 
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

@page :first { 
    margin: 0; 
    @top-center { content: none; }
    @bottom-center { content: none; }
}

body { 
    font-family: Arial, Helvetica, sans-serif; 
    font-size: 11pt; 
    line-height: 1.6; 
    color: #333; 
}

/* Typography */
h1 { color: #0a2540; font-size: 22pt; border-bottom: 2px solid #0a2540; padding-bottom: 10px; margin-top: 30px; }
h2 { color: #0a2540; font-size: 16pt; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 25px; }
h3 { color: #1a4480; font-size: 13pt; margin-top: 20px; }
p { margin-bottom: 12px; text-align: justify; }

/* Standard Tables */
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #0a2540; color: white; padding: 10px; text-align: left; }
td { border: 1px solid #ddd; padding: 10px; }
code { white-space: pre-wrap; } 

/* Cover Page Specifics */
.cover { 
    width: 210mm; 
    height: 297mm; 
    background: #0a2540; 
    background: linear-gradient(180deg, #0a2540 0%, #1a4480 100%);
    color: white; 
    text-align: center; 
}
.cover-inner { padding-top: 60px; padding-left: 40px; padding-right: 40px; }
"""

# Cover Page (Same as before)
cover_page = """
<div class="cover">
    <div class="cover-inner">
        <div style="display: inline-block; padding: 20px; border: 4px solid #d4af37; border-radius: 50%; width: 100px; height: 100px; margin-bottom: 20px;">
            <div style="font-size: 32pt; font-weight: bold; color: #fff; line-height: 1;">NDB</div>
            <div style="font-size: 8pt; color: #d4af37; font-weight: bold; margin-top: 5px;">SOUTH SUDAN</div>
        </div>
        
        <h1 style="font-size: 32pt; color: #fff; margin: 20px 0;">National Development Bank<br/>of South Sudan</h1>
        
        <p style="font-size: 16pt; color: #d4af37; margin-bottom: 40px;">Investment & Development Finance Business Plan</p>
        
        <table style="width: 100%; margin: 40px auto; border-spacing: 20px; border-collapse: separate;">
            <tr>
                <td style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; text-align: center; width: 33%;">
                    <div style="font-size: 36pt; font-weight: bold; color: #d4af37;">$1.2B</div>
                    <div style="font-size: 10pt; color: #ccc; text-transform: uppercase;">3-Year Target</div>
                </td>
                <td style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; text-align: center; width: 33%;">
                    <div style="font-size: 36pt; font-weight: bold; color: #d4af37;">$5M</div>
                    <div style="font-size: 10pt; color: #ccc; text-transform: uppercase;">Seed Capital</div>
                </td>
                <td style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; text-align: center; width: 33%;">
                    <div style="font-size: 36pt; font-weight: bold; color: #d4af37;">360%</div>
                    <div style="font-size: 10pt; color: #ccc; text-transform: uppercase;">Year 1 ROI</div>
                </td>
            </tr>
        </table>
        
        <div style="margin-top: 60px; font-size: 11pt; line-height: 1.8; color: #eee;">
            <p><b>Presented to:</b> Strategic Investment Partners</p>
            <p><b>Prepared by:</b> Alex Tsela Global Finance</p>
            <p><b>Contact:</b> Alex@satsi.co.za | +27 66 472 5666</p>
            <p><b>Date:</b> January 2026</p>
            <div style="margin-top: 30px; color: #d4af37; letter-spacing: 2px; font-size: 9pt;">CONFIDENTIAL — INVESTMENT MEMORANDUM</div>
        </div>
    </div>
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
