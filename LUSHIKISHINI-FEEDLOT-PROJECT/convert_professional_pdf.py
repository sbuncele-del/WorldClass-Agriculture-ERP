#!/usr/bin/env python3
"""Convert Lushikishini Cattle Feedlot Business Plan to Professional PDF
Grant application-ready document with infographics and professional styling.
Modeled after the successful ATG-PSPF Proposal format.
"""

from weasyprint import HTML, CSS
from pathlib import Path

# ==================== CSS STYLING ====================
css = """
@page { 
    size: A4; 
    margin: 2cm 2cm 2.5cm 2cm;
    @top-center {
        content: "Lushikishini Cattle Feedlot Cooperative — Business Plan";
        font-family: Arial, sans-serif;
        font-size: 9pt;
        color: #666;
        border-bottom: 1px solid #ddd;
        width: 100%;
        padding-bottom: 8px;
    }
    @bottom-center {
        content: "Page " counter(page) " | Regional Development Fund Application";
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

@page cover {
    margin: 0;
    @top-center { content: none; }
    @bottom-center { content: none; }
}

body { 
    font-family: 'Segoe UI', Arial, Helvetica, sans-serif; 
    font-size: 10.5pt; 
    line-height: 1.6; 
    color: #333; 
    margin: 0;
    padding: 0;
}

/* Typography */
h1 { 
    color: #1B5E20; 
    font-size: 22pt; 
    border-bottom: 3px solid #FFB300; 
    padding-bottom: 10px; 
    margin-top: 30px; 
}
h2 { 
    color: #1B5E20; 
    font-size: 16pt; 
    border-bottom: 2px solid #2E7D32; 
    padding-bottom: 8px; 
    margin-top: 25px;
    page-break-after: avoid;
}
h3 { 
    color: #388E3C; 
    font-size: 13pt; 
    margin-top: 20px;
    border-left: 4px solid #FFB300;
    padding-left: 10px;
}
h4 {
    color: #1B5E20;
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
    background: #1B5E20; 
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
    background-color: #E8F5E9;
}

/* Blockquotes */
blockquote {
    border-left: 4px solid #FFB300;
    margin: 15px 0;
    padding: 10px 20px;
    background: #FFF8E1;
    font-style: italic;
    color: #555;
}

/* Strong text */
strong {
    color: #1B5E20;
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
    border-top: 2px solid #FFB300;
    margin: 30px 0;
}

.content {
    padding: 0 20px;
}

.page-break {
    page-break-before: always;
}
"""

# ==================== COVER PAGE ====================
cover_page = """
<div style="width: 210mm; height: 297mm; background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%); color: white; page-break-after: always;">
    <table style="width: 100%; height: 100%; border: 0; border-collapse: collapse;">
        <tr>
            <td style="vertical-align: middle; text-align: center; border: 0; padding: 40px;">
                
                <!-- Icon & Logo -->
                <div style="margin-bottom: 30px;">
                    <div style="font-size: 72pt; margin-bottom: 15px;">🐄</div>
                    <div style="display: inline-block; padding: 25px 45px; border: 4px solid #FFB300; border-radius: 10px; background: rgba(255,255,255,0.08);">
                        <div style="font-size: 32pt; font-weight: bold; color: #fff; letter-spacing: 2px;">LUSHIKISHINI</div>
                        <div style="font-size: 13pt; color: #FFB300; font-weight: bold; letter-spacing: 2px; margin-top: 5px;">CATTLE FEEDLOT COOPERATIVE</div>
                    </div>
                </div>
                
                <!-- Title -->
                <h1 style="font-size: 26pt; color: #fff; margin: 0 0 8px 0; border: none; letter-spacing: 1px; line-height: 1.3;">
                    Business Plan & Grant Application
                </h1>
                <p style="font-size: 13pt; color: #FFB300; margin-bottom: 35px; font-weight: 300; text-align: center;">
                    Regional Development Fund • Kingdom of Eswatini
                </p>
                
                <!-- Key Stats -->
                <table style="width: 90%; margin: 0 auto 35px auto; border-spacing: 12px; border-collapse: separate; border: 0;">
                    <tr>
                        <td style="background: #FFB300; padding: 18px; border-radius: 10px; text-align: center; width: 33%;">
                            <div style="font-size: 28pt; font-weight: bold; color: #1B5E20;">E500,000</div>
                            <div style="font-size: 10pt; color: #1B5E20; text-transform: uppercase; letter-spacing: 1px;">Grant Requested</div>
                        </td>
                        <td style="background: rgba(255,255,255,0.15); padding: 18px; border-radius: 10px; text-align: center; width: 33%; border: 1px solid rgba(255,255,255,0.3);">
                            <div style="font-size: 28pt; font-weight: bold; color: #fff;">10</div>
                            <div style="font-size: 10pt; color: #FFB300; text-transform: uppercase; letter-spacing: 1px;">Members</div>
                        </td>
                        <td style="background: rgba(255,255,255,0.15); padding: 18px; border-radius: 10px; text-align: center; width: 33%; border: 1px solid rgba(255,255,255,0.3);">
                            <div style="font-size: 28pt; font-weight: bold; color: #fff;">40</div>
                            <div style="font-size: 10pt; color: #FFB300; text-transform: uppercase; letter-spacing: 1px;">Cattle Capacity</div>
                        </td>
                    </tr>
                </table>
                
                <!-- Return Metrics -->
                <table style="width: 80%; margin: 0 auto 35px auto; border-spacing: 15px; border-collapse: separate; border: 0;">
                    <tr>
                        <td style="background: rgba(255,255,255,0.12); padding: 18px 25px; border-radius: 10px; text-align: center; width: 50%; border: 2px solid rgba(255,255,255,0.25);">
                            <div style="font-size: 32pt; font-weight: bold; color: #FFB300;">142%</div>
                            <div style="font-size: 10pt; color: #fff; text-transform: uppercase; letter-spacing: 1px;">Return on Investment</div>
                        </td>
                        <td style="background: rgba(255,255,255,0.12); padding: 18px 25px; border-radius: 10px; text-align: center; width: 50%; border: 2px solid rgba(255,255,255,0.25);">
                            <div style="font-size: 32pt; font-weight: bold; color: #FFB300;">E50,100</div>
                            <div style="font-size: 10pt; color: #fff; text-transform: uppercase; letter-spacing: 1px;">Monthly Profit</div>
                        </td>
                    </tr>
                </table>
                
                <!-- Project Info -->
                <div style="font-size: 11pt; line-height: 2; color: #e0e0e0;">
                    <p style="margin: 5px 0; text-align: center;"><b style="color: #FFB300;">Location:</b> Lushikishini, kaMavuso, Phondo Inkhundla</p>
                    <p style="margin: 5px 0; text-align: center;"><b style="color: #FFB300;">Traditional Authority:</b> Chief Somtsewu</p>
                    <p style="margin: 5px 0; text-align: center;"><b style="color: #FFB300;">Project Leader:</b> Sibusiso Mavuso</p>
                    <p style="margin: 5px 0; text-align: center;"><b style="color: #FFB300;">Date:</b> January 2026</p>
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 30px; color: #FFB300; letter-spacing: 3px; font-size: 9pt; text-transform: uppercase; opacity: 0.9;">
                    Community-Driven Agriculture • Sustainable Livelihoods
                </div>

            </td>
        </tr>
    </table>
</div>
"""

# ==================== EXECUTIVE SUMMARY INFOGRAPHIC ====================
executive_summary = """
<div style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border: 2px solid #1B5E20; border-radius: 12px; padding: 25px; margin: 25px 0; page-break-inside: avoid;">
    <h2 style="text-align: center; margin-top: 0; color: #1B5E20; border: none; padding: 0; font-size: 18pt;">Executive Summary</h2>
    <p style="text-align: center; font-size: 11pt; color: #555; margin-bottom: 20px;">
        A community-driven cattle feedlot enterprise creating sustainable income for 10 families
    </p>
    <table style="width: 100%; border-spacing: 12px; border-collapse: separate; margin-top: 15px;">
        <tr>
            <td style="background: #1B5E20; color: white; padding: 18px; border-radius: 10px; text-align: center; width: 25%; border: none;">
                <div style="font-size: 22pt; font-weight: bold;">E500K</div>
                <div style="font-size: 9pt; opacity: 0.9; margin-top: 5px;">Grant Request</div>
            </td>
            <td style="background: #2E7D32; color: white; padding: 18px; border-radius: 10px; text-align: center; width: 25%; border: none;">
                <div style="font-size: 22pt; font-weight: bold;">E60K</div>
                <div style="font-size: 9pt; opacity: 0.9; margin-top: 5px;">Own Contribution</div>
            </td>
            <td style="background: #FFB300; color: #1B5E20; padding: 18px; border-radius: 10px; text-align: center; width: 25%; border: none;">
                <div style="font-size: 22pt; font-weight: bold;">E601K</div>
                <div style="font-size: 9pt; margin-top: 5px;">Annual Profit</div>
            </td>
            <td style="background: #43A047; color: white; padding: 18px; border-radius: 10px; text-align: center; width: 25%; border: none;">
                <div style="font-size: 22pt; font-weight: bold;">50+</div>
                <div style="font-size: 9pt; opacity: 0.9; margin-top: 5px;">Beneficiaries</div>
            </td>
        </tr>
    </table>
</div>
"""

# ==================== PROJECT OVERVIEW ====================
project_overview = """
<h2>1. Project Overview</h2>

<p>The <strong>Lushikishini Cattle Feedlot Cooperative</strong> is a community-driven agricultural initiative established by 10 members from Lushikishini, kaMavuso area. We seek <strong>E500,000</strong> from the Regional Development Fund to establish a sustainable cattle feedlot operation that will transform the economic prospects of our community.</p>

<div style="background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #1B5E20; border: none; padding: 0;">Business Model Overview</h3>
    <table style="width: 100%; border-spacing: 15px; border-collapse: separate; margin-top: 15px;">
        <tr>
            <td style="background: #E3F2FD; border-top: 5px solid #1565C0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; width: 25%;">
                <div style="font-size: 28pt; margin-bottom: 8px;">📥</div>
                <div style="font-size: 11pt; font-weight: bold; color: #1565C0;">PURCHASE</div>
                <div style="font-size: 9pt; color: #666; margin-top: 8px;">Buy weaners<br/>180-220 kg<br/><strong>E6,500 each</strong></div>
            </td>
            <td style="background: #E8F5E9; border-top: 5px solid #2E7D32; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; width: 25%;">
                <div style="font-size: 28pt; margin-bottom: 8px;">🌾</div>
                <div style="font-size: 11pt; font-weight: bold; color: #2E7D32;">FEED</div>
                <div style="font-size: 9pt; color: #666; margin-top: 8px;">90-120 days<br/>intensive feeding<br/><strong>+200 kg gain</strong></div>
            </td>
            <td style="background: #FFF8E1; border-top: 5px solid #FF8F00; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; width: 25%;">
                <div style="font-size: 28pt; margin-bottom: 8px;">📤</div>
                <div style="font-size: 11pt; font-weight: bold; color: #FF8F00;">SELL</div>
                <div style="font-size: 9pt; color: #666; margin-top: 8px;">To abattoirs<br/>380-450 kg<br/><strong>E14,000 each</strong></div>
            </td>
            <td style="background: #FFEBEE; border-top: 5px solid #C62828; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; width: 25%;">
                <div style="font-size: 28pt; margin-bottom: 8px;">💰</div>
                <div style="font-size: 11pt; font-weight: bold; color: #C62828;">PROFIT</div>
                <div style="font-size: 9pt; color: #666; margin-top: 8px;">Per cattle<br/>after costs<br/><strong>E5,010 profit</strong></div>
            </td>
        </tr>
    </table>
    <div style="text-align: center; margin-top: 15px; padding: 12px; background: #E8F5E9; border-radius: 8px;">
        <strong>Monthly Cycle:</strong> Buy 10 weaners → Feed 40 cattle → Sell 10 finished = <span style="color: #1B5E20; font-size: 14pt; font-weight: bold;">E50,100 profit/month</span>
    </div>
</div>
"""

# ==================== INFRASTRUCTURE PLAN ====================
infrastructure_plan = """
<h2>2. Infrastructure Plan</h2>

<p>Our feedlot operation requires four separate enclosures to manage the 4-month feeding cycle effectively. This allows cattle to be grouped by entry date and ensures a steady monthly sales flow.</p>

<div style="background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #1B5E20; border: none; padding: 0;">Feedlot Infrastructure</h3>
    <table style="width: 100%; border-spacing: 15px; border-collapse: separate; margin-top: 15px;">
        <tr>
            <td style="background: #C8E6C9; padding: 20px; text-align: center; border-radius: 10px; width: 25%; border: 3px solid #2E7D32;">
                <div style="font-size: 11pt; font-weight: bold; color: #1B5E20; margin-bottom: 5px;">FEEDLOT 1</div>
                <div style="font-size: 36pt; margin: 10px 0;">✅</div>
                <div style="font-size: 10pt; color: #2E7D32; font-weight: bold;">EXISTING</div>
                <div style="font-size: 9pt; color: #666; margin-top: 8px;">10 cattle capacity<br/>10×12m kraal<br/><strong>E10,000 value</strong></div>
            </td>
            <td style="background: #E3F2FD; padding: 20px; text-align: center; border-radius: 10px; width: 25%; border: 2px dashed #1565C0;">
                <div style="font-size: 11pt; font-weight: bold; color: #1565C0; margin-bottom: 5px;">FEEDLOT 2</div>
                <div style="font-size: 36pt; margin: 10px 0;">🔨</div>
                <div style="font-size: 10pt; color: #1565C0; font-weight: bold;">TO BUILD</div>
                <div style="font-size: 9pt; color: #666; margin-top: 8px;">10 cattle capacity<br/>Month 2<br/><strong>E35,000</strong></div>
            </td>
            <td style="background: #E3F2FD; padding: 20px; text-align: center; border-radius: 10px; width: 25%; border: 2px dashed #1565C0;">
                <div style="font-size: 11pt; font-weight: bold; color: #1565C0; margin-bottom: 5px;">FEEDLOT 3</div>
                <div style="font-size: 36pt; margin: 10px 0;">🔨</div>
                <div style="font-size: 10pt; color: #1565C0; font-weight: bold;">TO BUILD</div>
                <div style="font-size: 9pt; color: #666; margin-top: 8px;">10 cattle capacity<br/>Month 3<br/><strong>E35,000</strong></div>
            </td>
            <td style="background: #E3F2FD; padding: 20px; text-align: center; border-radius: 10px; width: 25%; border: 2px dashed #1565C0;">
                <div style="font-size: 11pt; font-weight: bold; color: #1565C0; margin-bottom: 5px;">FEEDLOT 4</div>
                <div style="font-size: 36pt; margin: 10px 0;">🔨</div>
                <div style="font-size: 10pt; color: #1565C0; font-weight: bold;">TO BUILD</div>
                <div style="font-size: 9pt; color: #666; margin-top: 8px;">10 cattle capacity<br/>Month 4<br/><strong>E35,000</strong></div>
            </td>
        </tr>
    </table>
    <div style="text-align: center; margin-top: 15px; padding: 12px; background: #E8F5E9; border-radius: 8px;">
        <strong>Total Capacity:</strong> 40 cattle | <strong>Total Infrastructure:</strong> E115,000 (E105,000 grant + E10,000 own)
    </div>
</div>
"""

# ==================== TEAM SECTION ====================
team_section = """
<h2>3. Our Team</h2>

<p>The cooperative brings together <strong>10 dedicated members</strong> from the Lushikishini community, combining professional expertise with hands-on cattle farming experience.</p>

<div style="background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #1B5E20; border: none; padding: 0;">Leadership Team</h3>
    <table style="width: 100%; border-spacing: 12px; border-collapse: separate; margin-top: 15px;">
        <tr>
            <td style="background: linear-gradient(135deg, #1B5E20, #2E7D32); color: white; padding: 18px; border-radius: 10px; text-align: center; width: 25%;">
                <div style="font-size: 9pt; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Project Leader</div>
                <div style="font-size: 12pt; font-weight: bold; margin-top: 8px;">Sibusiso Mavuso</div>
                <div style="font-size: 9pt; margin-top: 5px; opacity: 0.9;">Qualified Accountant</div>
            </td>
            <td style="background: linear-gradient(135deg, #2E7D32, #43A047); color: white; padding: 18px; border-radius: 10px; text-align: center; width: 25%;">
                <div style="font-size: 9pt; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Technical Advisor</div>
                <div style="font-size: 12pt; font-weight: bold; margin-top: 8px;">Sanele Dlamini</div>
                <div style="font-size: 9pt; margin-top: 5px; opacity: 0.9;">BSc Agriculture (UNESWA)</div>
            </td>
            <td style="background: linear-gradient(135deg, #43A047, #66BB6A); color: white; padding: 18px; border-radius: 10px; text-align: center; width: 25%;">
                <div style="font-size: 9pt; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Secretary</div>
                <div style="font-size: 12pt; font-weight: bold; margin-top: 8px;">Zakhele Dlamini</div>
                <div style="font-size: 9pt; margin-top: 5px; opacity: 0.9;">Environmentalist</div>
            </td>
            <td style="background: linear-gradient(135deg, #66BB6A, #81C784); color: white; padding: 18px; border-radius: 10px; text-align: center; width: 25%;">
                <div style="font-size: 9pt; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Operations Manager</div>
                <div style="font-size: 12pt; font-weight: bold; margin-top: 8px;">Seluleko Ndwandwe</div>
                <div style="font-size: 9pt; margin-top: 5px; opacity: 0.9;">Cattle Handler</div>
            </td>
        </tr>
    </table>
</div>

<table>
    <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 30%;">Name</th>
        <th style="width: 30%;">Role</th>
        <th style="width: 35%;">Contribution</th>
    </tr>
    <tr>
        <td>1</td>
        <td><strong>Sibusiso Mavuso</strong></td>
        <td>Project Leader / Treasurer</td>
        <td>Leadership, 4 cattle (E40,000)</td>
    </tr>
    <tr>
        <td>2</td>
        <td><strong>Sanele Dlamini</strong></td>
        <td>Technical Advisor (Agronomist)</td>
        <td>Feed formulation, animal nutrition</td>
    </tr>
    <tr>
        <td>3</td>
        <td><strong>Zakhele Dlamini</strong></td>
        <td>Secretary / Environmental</td>
        <td>Administration, sustainability</td>
    </tr>
    <tr>
        <td>4</td>
        <td><strong>Seluleko Ndwandwe</strong></td>
        <td>Operations Manager</td>
        <td>Daily operations oversight</td>
    </tr>
    <tr>
        <td>5</td>
        <td><strong>Sibusiso Dlamini</strong></td>
        <td>Cattle Handler</td>
        <td>Labour, cattle experience</td>
    </tr>
    <tr>
        <td>6</td>
        <td><strong>Temancele Mavuso</strong></td>
        <td>Member / Worker</td>
        <td>Labour contribution</td>
    </tr>
    <tr>
        <td>7</td>
        <td><strong>Gugu Vilakati</strong></td>
        <td>Member / Worker</td>
        <td>Labour contribution</td>
    </tr>
    <tr>
        <td>8</td>
        <td><strong>Vuyo Motsa</strong></td>
        <td>Member / Worker</td>
        <td>Labour contribution</td>
    </tr>
    <tr>
        <td>9</td>
        <td><strong>Neliso Mavuso</strong></td>
        <td>Member / Worker</td>
        <td>Labour contribution</td>
    </tr>
    <tr>
        <td>10</td>
        <td><strong>Sphumelele Shabangu</strong></td>
        <td>Member / Worker</td>
        <td>Labour contribution</td>
    </tr>
</table>
"""

# ==================== BUDGET BREAKDOWN ====================
budget_section = """
<div class="page-break"></div>
<h2>4. Budget & Funding Request</h2>

<div style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border: 2px solid #1B5E20; border-radius: 12px; padding: 25px; margin: 25px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #1B5E20; border: none; padding: 0; font-size: 16pt;">Funding Summary</h3>
    <table style="width: 100%; border-spacing: 15px; border-collapse: separate; margin-top: 15px;">
        <tr>
            <td style="background: #1B5E20; color: white; padding: 20px; border-radius: 10px; text-align: center; width: 33%; border: none;">
                <div style="font-size: 24pt; font-weight: bold;">E500,000</div>
                <div style="font-size: 10pt; opacity: 0.9; margin-top: 5px;">RDF Grant (89.1%)</div>
            </td>
            <td style="background: #FFB300; color: #1B5E20; padding: 20px; border-radius: 10px; text-align: center; width: 33%; border: none;">
                <div style="font-size: 24pt; font-weight: bold;">E60,000</div>
                <div style="font-size: 10pt; margin-top: 5px;">Own Contribution (10.9%)</div>
            </td>
            <td style="background: #2E7D32; color: white; padding: 20px; border-radius: 10px; text-align: center; width: 33%; border: none;">
                <div style="font-size: 24pt; font-weight: bold;">E560,000</div>
                <div style="font-size: 10pt; opacity: 0.9; margin-top: 5px;">Total Project Cost</div>
            </td>
        </tr>
    </table>
</div>

<h3>Detailed Budget Breakdown</h3>

<table>
    <tr>
        <th colspan="2" style="background: #1B5E20;">Item Description</th>
        <th style="background: #1B5E20;">Amount</th>
    </tr>
    <tr style="background: #E8F5E9;">
        <td colspan="3"><strong>A. INFRASTRUCTURE</strong></td>
    </tr>
    <tr>
        <td></td>
        <td>3 Feedlot constructions (poles, wire, cement)</td>
        <td style="text-align: right;"><strong>E105,000</strong></td>
    </tr>
    <tr>
        <td></td>
        <td>Feeding troughs (12 units @ E2,000)</td>
        <td style="text-align: right;"><strong>E24,000</strong></td>
    </tr>
    <tr>
        <td></td>
        <td>Water system (tanks, pipes, troughs)</td>
        <td style="text-align: right;"><strong>E25,000</strong></td>
    </tr>
    <tr>
        <td></td>
        <td>Handling crush</td>
        <td style="text-align: right;"><strong>E15,000</strong></td>
    </tr>
    <tr>
        <td></td>
        <td>Feed storage shed</td>
        <td style="text-align: right;"><strong>E20,000</strong></td>
    </tr>
    <tr style="background: #C8E6C9;">
        <td></td>
        <td><strong>Infrastructure Subtotal</strong></td>
        <td style="text-align: right;"><strong>E189,000</strong></td>
    </tr>
    <tr style="background: #E8F5E9;">
        <td colspan="3"><strong>B. LIVESTOCK</strong></td>
    </tr>
    <tr>
        <td></td>
        <td>36 Weaner cattle @ E6,500 each</td>
        <td style="text-align: right;"><strong>E234,000</strong></td>
    </tr>
    <tr style="background: #E8F5E9;">
        <td colspan="3"><strong>C. OPERATING CAPITAL</strong></td>
    </tr>
    <tr>
        <td></td>
        <td>Feed supplies (3 months)</td>
        <td style="text-align: right;"><strong>E57,000</strong></td>
    </tr>
    <tr>
        <td></td>
        <td>Veterinary supplies & medicines</td>
        <td style="text-align: right;"><strong>E10,000</strong></td>
    </tr>
    <tr>
        <td></td>
        <td>Transport & miscellaneous</td>
        <td style="text-align: right;"><strong>E10,000</strong></td>
    </tr>
    <tr style="background: #1B5E20; color: white;">
        <td colspan="2"><strong>TOTAL GRANT REQUESTED</strong></td>
        <td style="text-align: right;"><strong>E500,000</strong></td>
    </tr>
</table>

<h3>Own Contribution Detail</h3>

<table>
    <tr>
        <th>Contribution Type</th>
        <th>Description</th>
        <th style="text-align: right;">Value</th>
    </tr>
    <tr>
        <td>Existing Cattle</td>
        <td>4 cattle owned by Sibusiso Mavuso</td>
        <td style="text-align: right;"><strong>E40,000</strong></td>
    </tr>
    <tr>
        <td>Existing Infrastructure</td>
        <td>1 kraal (10×12m) already built</td>
        <td style="text-align: right;"><strong>E10,000</strong></td>
    </tr>
    <tr>
        <td>Labour Contribution</td>
        <td>Construction labour from all members</td>
        <td style="text-align: right;"><strong>E10,000</strong></td>
    </tr>
    <tr style="background: #FFB300;">
        <td colspan="2"><strong>TOTAL OWN CONTRIBUTION</strong></td>
        <td style="text-align: right;"><strong>E60,000</strong></td>
    </tr>
</table>
"""

# ==================== FINANCIAL PROJECTIONS ====================
financial_section = """
<div class="page-break"></div>
<h2>5. Financial Projections</h2>

<div style="background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #1B5E20; border: none; padding: 0;">Monthly Profit Calculation (at Full Operation)</h3>
    <table style="width: 100%; border-spacing: 12px; border-collapse: separate; margin-top: 15px;">
        <tr>
            <td style="width: 45%; vertical-align: top; padding: 0;">
                <div style="background: #E8F5E9; padding: 15px; border-radius: 10px; border-left: 5px solid #2E7D32;">
                    <div style="font-size: 11pt; font-weight: bold; color: #2E7D32; margin-bottom: 10px;">📈 INCOME</div>
                    <table style="width: 100%; font-size: 10pt; margin: 0;">
                        <tr><td>Sale of 10 finished cattle</td><td style="text-align: right;"><strong>E140,000</strong></td></tr>
                        <tr><td>@ E14,000 each</td><td></td></tr>
                    </table>
                </div>
            </td>
            <td style="width: 10%; text-align: center; font-size: 28pt; color: #1B5E20; vertical-align: middle;">−</td>
            <td style="width: 45%; vertical-align: top; padding: 0;">
                <div style="background: #FFEBEE; padding: 15px; border-radius: 10px; border-left: 5px solid #C62828;">
                    <div style="font-size: 11pt; font-weight: bold; color: #C62828; margin-bottom: 10px;">📉 EXPENSES</div>
                    <table style="width: 100%; font-size: 10pt; margin: 0;">
                        <tr><td>Replacement weaners (10)</td><td style="text-align: right;">E65,000</td></tr>
                        <tr><td>Feed costs</td><td style="text-align: right;">E18,900</td></tr>
                        <tr><td>Vet & medicine</td><td style="text-align: right;">E2,000</td></tr>
                        <tr><td>Utilities & transport</td><td style="text-align: right;">E4,000</td></tr>
                        <tr style="border-top: 1px solid #ddd;"><td><strong>Total</strong></td><td style="text-align: right;"><strong>E89,900</strong></td></tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>
    <div style="text-align: center; margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #1B5E20, #2E7D32); border-radius: 10px; color: white;">
        <div style="font-size: 12pt; margin-bottom: 8px;">MONTHLY NET PROFIT</div>
        <div style="font-size: 36pt; font-weight: bold;">E50,100</div>
        <div style="font-size: 11pt; margin-top: 8px; opacity: 0.9;">E4,008 per member (after 20% reserves)</div>
    </div>
</div>

<h3>5-Year Revenue Projection</h3>

<div style="background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr>
            <td style="width: 60px; font-weight: bold; padding: 12px 0; border: none;">Year 1</td>
            <td style="padding: 12px 0; border: none;"><div style="background: linear-gradient(90deg, #1B5E20, #2E7D32); width: 22%; height: 30px; border-radius: 5px;"></div></td>
            <td style="width: 100px; text-align: right; font-weight: bold; color: #1B5E20; border: none;">E 350,700</td>
        </tr>
        <tr>
            <td style="width: 60px; font-weight: bold; padding: 12px 0; border: none;">Year 2</td>
            <td style="padding: 12px 0; border: none;"><div style="background: linear-gradient(90deg, #1B5E20, #2E7D32); width: 38%; height: 30px; border-radius: 5px;"></div></td>
            <td style="width: 100px; text-align: right; font-weight: bold; color: #1B5E20; border: none;">E 601,200</td>
        </tr>
        <tr>
            <td style="width: 60px; font-weight: bold; padding: 12px 0; border: none;">Year 3</td>
            <td style="padding: 12px 0; border: none;"><div style="background: linear-gradient(90deg, #1B5E20, #2E7D32); width: 38%; height: 30px; border-radius: 5px;"></div></td>
            <td style="width: 100px; text-align: right; font-weight: bold; color: #1B5E20; border: none;">E 601,200</td>
        </tr>
        <tr>
            <td style="width: 60px; font-weight: bold; padding: 12px 0; border: none;">Year 4</td>
            <td style="padding: 12px 0; border: none;"><div style="background: linear-gradient(90deg, #1B5E20, #2E7D32); width: 38%; height: 30px; border-radius: 5px;"></div></td>
            <td style="width: 100px; text-align: right; font-weight: bold; color: #1B5E20; border: none;">E 601,200</td>
        </tr>
        <tr>
            <td style="width: 60px; font-weight: bold; padding: 12px 0; border: none;">Year 5</td>
            <td style="padding: 12px 0; border: none;"><div style="background: linear-gradient(90deg, #FFB300, #FFC107); width: 38%; height: 30px; border-radius: 5px;"></div></td>
            <td style="width: 100px; text-align: right; font-weight: bold; color: #FF8F00; border: none;">E 601,200</td>
        </tr>
    </table>
    <div style="text-align: center; margin-top: 20px; padding: 15px; background: #E8F5E9; border-radius: 8px;">
        <strong>5-Year Cumulative Profit:</strong> <span style="color: #1B5E20; font-size: 18pt; font-weight: bold;">E 2,755,500</span>
    </div>
</div>
"""

# ==================== ROI VISUALIZATION ====================
roi_section = """
<h3>Return on Investment</h3>

<div style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border: 2px solid #1B5E20; border-radius: 12px; padding: 25px; margin: 25px 0; page-break-inside: avoid;">
    <table style="width: 100%; border-spacing: 15px; border-collapse: separate;">
        <tr>
            <td style="background: white; border: 2px solid #1B5E20; padding: 20px; text-align: center; border-radius: 10px; width: 28%;">
                <div style="font-size: 10pt; color: #666; font-weight: bold; text-transform: uppercase;">Investment</div>
                <div style="font-size: 24pt; font-weight: bold; color: #1B5E20; margin-top: 8px;">E500,000</div>
            </td>
            <td style="text-align: center; font-size: 32pt; color: #FFB300; width: 8%; border: none;">→</td>
            <td style="background: white; border: 2px solid #43A047; padding: 20px; text-align: center; border-radius: 10px; width: 28%;">
                <div style="font-size: 10pt; color: #666; font-weight: bold; text-transform: uppercase;">Annual Profit</div>
                <div style="font-size: 24pt; font-weight: bold; color: #43A047; margin-top: 8px;">E601,200</div>
            </td>
            <td style="text-align: center; font-size: 32pt; color: #FFB300; width: 8%; border: none;">→</td>
            <td style="background: #FFB300; padding: 20px; text-align: center; border-radius: 10px; width: 28%;">
                <div style="font-size: 10pt; color: #1B5E20; font-weight: bold; text-transform: uppercase;">ROI</div>
                <div style="font-size: 28pt; font-weight: bold; color: #1B5E20; margin-top: 8px;">142%</div>
            </td>
        </tr>
    </table>
    <div style="text-align: center; margin-top: 20px; font-size: 12pt; color: #555;">
        <table style="width: 60%; margin: 0 auto; border: none;">
            <tr>
                <td style="text-align: center; border: none; padding: 10px;">
                    <div style="font-size: 10pt; color: #666;">Payback Period</div>
                    <div style="font-size: 18pt; font-weight: bold; color: #1B5E20;">8.4 months</div>
                </td>
                <td style="text-align: center; border: none; padding: 10px;">
                    <div style="font-size: 10pt; color: #666;">Break-even</div>
                    <div style="font-size: 18pt; font-weight: bold; color: #1B5E20;">6 cattle/month</div>
                </td>
                <td style="text-align: center; border: none; padding: 10px;">
                    <div style="font-size: 10pt; color: #666;">Safety Margin</div>
                    <div style="font-size: 18pt; font-weight: bold; color: #1B5E20;">40%</div>
                </td>
            </tr>
        </table>
    </div>
</div>
"""

# ==================== IMPLEMENTATION TIMELINE ====================
timeline_section = """
<div class="page-break"></div>
<h2>6. Implementation Timeline</h2>

<div style="background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <table style="width: 100%; border-spacing: 0; border-collapse: collapse;">
        <tr>
            <td style="background: #1B5E20; color: white; padding: 15px; text-align: center; width: 15%; border-radius: 10px 0 0 0;">
                <div style="font-size: 10pt; opacity: 0.8;">MONTH</div>
                <div style="font-size: 24pt; font-weight: bold;">1</div>
            </td>
            <td style="background: #E8F5E9; padding: 15px; border-bottom: 2px solid white;">
                <strong style="color: #1B5E20;">Grant Approval & Setup</strong><br/>
                <span style="font-size: 10pt; color: #666;">Receive funds • Order materials • Site preparation • Purchase first 10 weaners</span>
            </td>
        </tr>
        <tr>
            <td style="background: #2E7D32; color: white; padding: 15px; text-align: center; width: 15%;">
                <div style="font-size: 10pt; opacity: 0.8;">MONTH</div>
                <div style="font-size: 24pt; font-weight: bold;">2</div>
            </td>
            <td style="background: #E8F5E9; padding: 15px; border-bottom: 2px solid white;">
                <strong style="color: #2E7D32;">Construction Begins</strong><br/>
                <span style="font-size: 10pt; color: #666;">Build Feedlot 2 • Install water system • Purchase second batch (10 weaners)</span>
            </td>
        </tr>
        <tr>
            <td style="background: #388E3C; color: white; padding: 15px; text-align: center; width: 15%;">
                <div style="font-size: 10pt; opacity: 0.8;">MONTH</div>
                <div style="font-size: 24pt; font-weight: bold;">3</div>
            </td>
            <td style="background: #E8F5E9; padding: 15px; border-bottom: 2px solid white;">
                <strong style="color: #388E3C;">Expansion Continues</strong><br/>
                <span style="font-size: 10pt; color: #666;">Build Feedlot 3 • Storage shed • Purchase third batch (10 weaners)</span>
            </td>
        </tr>
        <tr>
            <td style="background: #43A047; color: white; padding: 15px; text-align: center; width: 15%;">
                <div style="font-size: 10pt; opacity: 0.8;">MONTH</div>
                <div style="font-size: 24pt; font-weight: bold;">4</div>
            </td>
            <td style="background: #E8F5E9; padding: 15px; border-bottom: 2px solid white;">
                <strong style="color: #43A047;">Complete Infrastructure</strong><br/>
                <span style="font-size: 10pt; color: #666;">Build Feedlot 4 • Handling crush • Purchase fourth batch (10 weaners) • Full capacity!</span>
            </td>
        </tr>
        <tr>
            <td style="background: #FFB300; color: #1B5E20; padding: 15px; text-align: center; width: 15%;">
                <div style="font-size: 10pt;">MONTH</div>
                <div style="font-size: 24pt; font-weight: bold;">5</div>
            </td>
            <td style="background: #FFF8E1; padding: 15px; border-bottom: 2px solid white;">
                <strong style="color: #FF8F00;">🎉 FIRST SALES!</strong><br/>
                <span style="font-size: 10pt; color: #666;">Sell first 10 finished cattle • Revenue begins • Continuous cycle starts</span>
            </td>
        </tr>
        <tr>
            <td style="background: #FF8F00; color: white; padding: 15px; text-align: center; width: 15%; border-radius: 0 0 0 10px;">
                <div style="font-size: 10pt; opacity: 0.8;">MONTH</div>
                <div style="font-size: 24pt; font-weight: bold;">6+</div>
            </td>
            <td style="background: #FFF3E0; padding: 15px; border-radius: 0 0 10px 0;">
                <strong style="color: #E65100;">Full Operation</strong><br/>
                <span style="font-size: 10pt; color: #666;">Monthly cycle: Buy 10 → Feed 40 → Sell 10 = <strong>E50,100 profit every month</strong></span>
            </td>
        </tr>
    </table>
</div>
"""

# ==================== RISK ANALYSIS ====================
risk_section = """
<h2>7. Risk Analysis & Mitigation</h2>

<table>
    <tr>
        <th style="width: 25%;">Risk</th>
        <th style="width: 12%;">Likelihood</th>
        <th style="width: 12%;">Impact</th>
        <th style="width: 51%;">Mitigation Strategy</th>
    </tr>
    <tr>
        <td><strong>Disease outbreak</strong></td>
        <td style="background: #FFF3E0; color: #E65100; text-align: center;"><strong>Medium</strong></td>
        <td style="background: #FFEBEE; color: #C62828; text-align: center;"><strong>High</strong></td>
        <td>Vaccination program, quarantine protocols, veterinary relationship, biosecurity measures</td>
    </tr>
    <tr>
        <td><strong>Feed price increase</strong></td>
        <td style="background: #FFF3E0; color: #E65100; text-align: center;"><strong>Medium</strong></td>
        <td style="background: #FFF3E0; color: #E65100; text-align: center;"><strong>Medium</strong></td>
        <td>Bulk purchasing agreements, grow own fodder, diversify feed sources, crop residue contracts</td>
    </tr>
    <tr>
        <td><strong>Cattle theft</strong></td>
        <td style="background: #E8F5E9; color: #2E7D32; text-align: center;"><strong>Low</strong></td>
        <td style="background: #FFEBEE; color: #C62828; text-align: center;"><strong>High</strong></td>
        <td>Security fencing, night watch rotation, community awareness, brand registration</td>
    </tr>
    <tr>
        <td><strong>Market price drop</strong></td>
        <td style="background: #FFF3E0; color: #E65100; text-align: center;"><strong>Medium</strong></td>
        <td style="background: #FFF3E0; color: #E65100; text-align: center;"><strong>Medium</strong></td>
        <td>Quality focus for premium prices, multiple buyer relationships, timing flexibility</td>
    </tr>
    <tr>
        <td><strong>Drought/Feed shortage</strong></td>
        <td style="background: #FFF3E0; color: #E65100; text-align: center;"><strong>Medium</strong></td>
        <td style="background: #FFF3E0; color: #E65100; text-align: center;"><strong>Medium</strong></td>
        <td>Feed storage facility, emergency reserve fund, farmer network for crop residues</td>
    </tr>
</table>
"""

# ==================== IMPACT & SUSTAINABILITY ====================
impact_section = """
<h2>8. Impact & Sustainability</h2>

<div style="background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
    <h3 style="text-align: center; margin-top: 0; color: #1B5E20; border: none; padding: 0;">Project Impact</h3>
    <table style="width: 100%; border-spacing: 12px; border-collapse: separate; margin-top: 15px;">
        <tr>
            <td style="background: linear-gradient(135deg, #E8F5E9, #C8E6C9); padding: 20px; border-radius: 10px; text-align: center; width: 25%; border-left: 5px solid #1B5E20;">
                <div style="font-size: 28pt; font-weight: bold; color: #1B5E20;">10</div>
                <div style="font-size: 10pt; color: #666; margin-top: 5px;">Direct Beneficiaries<br/>(Members)</div>
            </td>
            <td style="background: linear-gradient(135deg, #E3F2FD, #BBDEFB); padding: 20px; border-radius: 10px; text-align: center; width: 25%; border-left: 5px solid #1565C0;">
                <div style="font-size: 28pt; font-weight: bold; color: #1565C0;">50+</div>
                <div style="font-size: 10pt; color: #666; margin-top: 5px;">Indirect Beneficiaries<br/>(Families)</div>
            </td>
            <td style="background: linear-gradient(135deg, #FFF8E1, #FFECB3); padding: 20px; border-radius: 10px; text-align: center; width: 25%; border-left: 5px solid #FF8F00;">
                <div style="font-size: 28pt; font-weight: bold; color: #FF8F00;">E54K</div>
                <div style="font-size: 10pt; color: #666; margin-top: 5px;">Annual Income<br/>Per Member</div>
            </td>
            <td style="background: linear-gradient(135deg, #FCE4EC, #F8BBD9); padding: 20px; border-radius: 10px; text-align: center; width: 25%; border-left: 5px solid #C2185B;">
                <div style="font-size: 28pt; font-weight: bold; color: #C2185B;">120</div>
                <div style="font-size: 10pt; color: #666; margin-top: 5px;">Cattle Sold<br/>Per Year</div>
            </td>
        </tr>
    </table>
</div>

<h3>Sustainability Plan</h3>

<div style="background: #FFF8E1; border-left: 5px solid #FFB300; padding: 20px; margin: 20px 0; border-radius: 0 10px 10px 0;">
    <p style="margin: 0;"><strong>This project is fully self-sustaining after the initial grant.</strong></p>
    <p>Monthly profits fund all ongoing operations, maintenance, and future growth. The cooperative builds reserves to handle emergencies and expand capacity over time.</p>
</div>

<table>
    <tr>
        <th>Reserve Fund</th>
        <th>Monthly Allocation</th>
        <th>Purpose</th>
    </tr>
    <tr>
        <td><strong>Emergency Reserve</strong></td>
        <td>E5,010 (10% of profit)</td>
        <td>Disease outbreaks, cattle deaths, unexpected costs</td>
    </tr>
    <tr>
        <td><strong>Development Fund</strong></td>
        <td>E5,010 (10% of profit)</td>
        <td>Maintenance, equipment replacement, future expansion</td>
    </tr>
</table>
"""

# ==================== CONCLUSION ====================
conclusion_section = """
<div class="page-break"></div>
<h2>9. Conclusion</h2>

<div style="background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%); color: white; padding: 30px; border-radius: 12px; margin: 25px 0;">
    <h3 style="text-align: center; margin-top: 0; color: white; border: none; padding: 0; font-size: 18pt;">Why Invest in Lushikishini Cattle Feedlot?</h3>
    <table style="width: 100%; margin-top: 20px;">
        <tr>
            <td style="padding: 10px; vertical-align: top; width: 50%; border: none;">
                <p style="color: #C8E6C9; text-align: left;"><strong style="color: #FFB300;">✓ Proven Business Model:</strong> Feedlot farming is established and profitable across Southern Africa</p>
                <p style="color: #C8E6C9; text-align: left;"><strong style="color: #FFB300;">✓ Strong Team:</strong> Qualified agronomist, accountant, and experienced cattle handlers</p>
                <p style="color: #C8E6C9; text-align: left;"><strong style="color: #FFB300;">✓ Demonstrated Commitment:</strong> E60,000 own contribution (10.9% of project)</p>
            </td>
            <td style="padding: 10px; vertical-align: top; width: 50%; border: none;">
                <p style="color: #C8E6C9; text-align: left;"><strong style="color: #FFB300;">✓ Market Access:</strong> Established relationships with abattoir buyers</p>
                <p style="color: #C8E6C9; text-align: left;"><strong style="color: #FFB300;">✓ Community Support:</strong> Operating on communal land approved by Chief Somtsewu</p>
                <p style="color: #C8E6C9; text-align: left;"><strong style="color: #FFB300;">✓ Excellent Returns:</strong> 142% ROI, 8.4-month payback period</p>
            </td>
        </tr>
    </table>
</div>

<div style="text-align: center; margin: 40px 0;">
    <p style="font-size: 14pt; color: #1B5E20;"><strong>We respectfully request E500,000 from the Regional Development Fund</strong></p>
    <p style="font-size: 12pt; color: #555;">to transform the economic prospects of our community through sustainable cattle farming.</p>
</div>

<hr/>

<div style="text-align: center; margin-top: 40px; color: #666;">
    <p><strong>Lushikishini Cattle Feedlot Cooperative</strong></p>
    <p>Lushikishini, kaMavuso • Phondo Inkhundla • Chief Somtsewu</p>
    <p>Kingdom of Eswatini</p>
    <p style="margin-top: 15px;">January 2026</p>
</div>
"""

# ==================== BUILD FULL HTML ====================
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
{executive_summary}
{project_overview}
{infrastructure_plan}
{team_section}
{budget_section}
{financial_section}
{roi_section}
{timeline_section}
{risk_section}
{impact_section}
{conclusion_section}
</div>
</body>
</html>
"""

# ==================== WRITE PDF ====================
output_dir = Path('/workspaces/WorldClass-ERP/LUSHIKISHINI-FEEDLOT-PROJECT')
output_file = output_dir / 'LUSHIKISHINI-BUSINESS-PLAN-PROFESSIONAL.pdf'

HTML(string=full_html).write_pdf(str(output_file))
print(f"✅ Business Plan PDF generated: {output_file}")
print(f"   Size: {output_file.stat().st_size / 1024:.1f} KB")
