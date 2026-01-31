#!/usr/bin/env python3
"""Convert NDB Proposal - FINAL CORRECTED VERSION
1. Restores Headers
2. Fixes 'Empty' Infographics (using Tables)
3. FIXES MISSING CONTACT INFO
4. REPLACES ASCII OPERATIONAL MODEL WITH GRAPHIC
"""

import markdown
from weasyprint import HTML, CSS
from pathlib import Path
import re

# 1. Read and update markdown
md_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.md')
md_content = md_file.read_text()

# --- FIX 1: UPDATE TEXT & CONTACT INFO ---
md_content = md_content.replace('Alex Tsela Global (ATG) Holdings', 'Alex Tsela Global Finance')
md_content = md_content.replace('Email: [To be provided]', 'Email: Alex@satsi.co.za')
md_content = md_content.replace('Phone: [To be provided]', 'Phone: +27 66 472 5666')

# --- FIX 2: REMOVE ASCII ART OPERATIONAL MODEL ---
# We use regex to find the section and replace it with our marker
op_model_pattern = r"### 3.3 Operational Model.*?Returns \+ Carried Interest\n```"
replacement_marker = "$$OPERATIONAL_MODEL_VISUAL$$"
# Note: DOTALL flag needed to match across newlines
# We'll do a simpler string replacement for safety if regex is tricky with specific chars
# The specific block to remove:
ascii_block = """### 3.3 Operational Model

**Model 1: Deal Connector (Commission Model)**
```
Funder (DFI/Investor) ──► NDB-SS ──► National Project
                            │
                       5% Commission
                     for locking deal
```

**Model 2: Paymaster (Transaction Model)**
```
Funder ──► NDB-SS Account ──► Project Disbursements
               │                      │
         Fund Management         Transaction Fees
              Fee                   (0.5-1%)
```

**Model 3: Co-Investment**
```
NDB-SS Capital + Partner Capital ──► Project
              │
        Returns + Carried Interest
```"""

# Try direct replace first (lines might differ slightly in whitespace)
if ascii_block in md_content:
    md_content = md_content.replace(ascii_block, replacement_marker)
else:
    # If exact match fails, fallback to regex 
    # (The user screenshot showed standard arrows, but the file read showed special chars. 
    # We will try to just inject the visual *after* 3.2 and *before* 4. Strategic Sectors, masking 3.3 text manually if needed)
    # Let's try to just find the header and cut until Section 4
    start_marker = "### 3.3 Operational Model"
    end_marker = "## 4. Strategic Sectors"
    start_idx = md_content.find(start_marker)
    end_idx = md_content.find(end_marker)
    
    if start_idx != -1 and end_idx != -1:
        # Keep the rest, replace the middle
        md_content = md_content[:start_idx] + replacement_marker + "\n\n<div style='page-break-before: always;'></div>\n\n" + md_content[end_idx:]

# 2. Convert to HTML
md_converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
html_body = md_converter.convert(md_content)

# 3. HTML Components

# Cover Page
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

# Operational Model Logic Visuals
op_model_box = """
<div style="margin: 20px 0;">
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

# Other Components (Same as Fix 1)
investment_box = """
<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0;">
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

sector_box = """
<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="text-align: center; margin-top: 0; color: #0a2540;">Priority Sectors Allocation</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
            <td style="width: 140px; text-align: right; padding-right: 15px; font-weight: bold;">Roads (Juba)</td>
            <td style="padding: 5px 0;"><div style="background-color: #0a2540; width: 100%; color: white; padding: 5px 10px; font-weight: bold; border-radius: 4px;">$400M</div></td>
        </tr>
        <tr>
            <td style="width: 140px; text-align: right; padding-right: 15px; font-weight: bold;">Gold Mining</td>
            <td style="padding: 5px 0;"><div style="background-color: #d4af37; width: 75%; color: white; padding: 5px 10px; font-weight: bold; border-radius: 4px;">$300M</div></td>
        </tr>
        <tr>
            <td style="width: 140px; text-align: right; padding-right: 15px; font-weight: bold;">Agro-processing</td>
            <td style="padding: 5px 0;"><div style="background-color: #28a745; width: 50%; color: white; padding: 5px 10px; font-weight: bold; border-radius: 4px;">$200M</div></td>
        </tr>
    </table>
</div>
"""

timeline_box = """
<div style="background: #eef6ff; border: 1px solid #bce0fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="text-align: center; margin-top: 0; color: #0a2540;">Mobilization Roadmap</h3>
    <table style="width: 100%; border-spacing: 5px; border-collapse: separate;">
        <tr>
            <td style="background-color: #0a2540; color: white; padding: 15px; border-radius: 6px; width: 30%; text-align: center; vertical-align: top;">
                <div style="font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 5px; margin-bottom: 5px;">YEAR 1</div>
                <div style="font-size: 18pt; font-weight: bold; color: #d4af37;">$400M</div>
                <div style="font-size: 8pt; margin-top: 5px;">Foundation • 15 Staff</div>
            </td>
            <td style="width: 5%; text-align: center; font-size: 20pt; color: #ccc;">&#8594;</td>
            <td style="background-color: #1a4480; color: white; padding: 15px; border-radius: 6px; width: 30%; text-align: center; vertical-align: top;">
                <div style="font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 5px; margin-bottom: 5px;">YEAR 2</div>
                <div style="font-size: 18pt; font-weight: bold; color: #d4af37;">$425M</div>
                <div style="font-size: 8pt; margin-top: 5px;">Growth • 30 Staff</div>
            </td>
            <td style="width: 5%; text-align: center; font-size: 20pt; color: #ccc;">&#8594;</td>
            <td style="background-color: #28a745; color: white; padding: 15px; border-radius: 6px; width: 30%; text-align: center; vertical-align: top;">
                <div style="font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 5px; margin-bottom: 5px;">YEAR 3</div>
                <div style="font-size: 18pt; font-weight: bold; color: #d4af37;">$375M</div>
                <div style="font-size: 8pt; margin-top: 5px;">Maturity • 45 Staff</div>
            </td>
        </tr>
    </table>
</div>
"""

revenue_box = """
<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0;">
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

org_box = """
<div style="margin: 20px 0; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
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

roi_box = """
<div style="background: #eef6ff; border: 2px solid #0a2540; border-radius: 8px; padding: 20px; margin: 20px 0;">
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

# 4. Inject
# Replace standard place holders
html_body = html_body.replace('$$INVESTMENT_SUMMARY$$', investment_box)
html_body = html_body.replace('$$SECTOR_ALLOCATION$$', sector_box)
html_body = html_body.replace('$$TIMELINE_VISUAL$$', timeline_box)
html_body = html_body.replace('$$REVENUE_CHART$$', revenue_box)
html_body = html_body.replace('$$ORG_STRUCTURE$$', org_box)
html_body = html_body.replace('$$ROI_VISUAL$$', roi_box)
# Replace NEW Operational Model Marker
html_body = html_body.replace(replacement_marker, op_model_box)


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

# 6. Assembly
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
