#!/usr/bin/env python3
"""Convert Lushikishini RDF Application Form to Professional PDF"""

from weasyprint import HTML
from pathlib import Path

css = """
@page { 
    size: A4; 
    margin: 2cm 2.5cm 2.5cm 2.5cm;
    @top-center {
        content: "Regional Development Fund — Grant Application";
        font-family: Arial, sans-serif;
        font-size: 9pt;
        color: #666;
        border-bottom: 1px solid #ddd;
    }
    @bottom-center {
        content: "Page " counter(page);
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
    font-family: 'Segoe UI', Arial, sans-serif; 
    font-size: 10.5pt; 
    line-height: 1.6; 
    color: #333; 
}

h1 { color: #0D47A1; font-size: 18pt; border-bottom: 3px solid #1976D2; padding-bottom: 8px; margin-top: 25px; }
h2 { color: #0D47A1; font-size: 14pt; margin-top: 20px; }
h3 { color: #1976D2; font-size: 12pt; margin-top: 15px; border-left: 4px solid #BBDEFB; padding-left: 10px; }

table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
th { background: #0D47A1; color: white; padding: 10px; text-align: left; }
td { border: 1px solid #BBDEFB; padding: 8px; }
tr:nth-child(even) { background: #E3F2FD; }

.content { padding: 0 15px; }
.page-break { page-break-before: always; }

.form-field {
    border: 1px solid #1976D2;
    padding: 8px 12px;
    min-height: 20px;
    background: #FAFAFA;
    border-radius: 4px;
    margin: 5px 0;
}

.section-box {
    background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
    border-left: 5px solid #1976D2;
    padding: 15px 20px;
    border-radius: 0 8px 8px 0;
    margin: 15px 0;
}
"""

cover_page = """
<div style="width: 210mm; height: 297mm; background: linear-gradient(135deg, #0D47A1 0%, #1565C3 50%, #1976D2 100%); color: white; page-break-after: always;">
    <table style="width: 100%; height: 100%; border: 0; border-collapse: collapse;">
        <tr>
            <td style="vertical-align: middle; text-align: center; border: 0; padding: 50px;">
                
                <div style="font-size: 48pt; margin-bottom: 15px;">🏛️</div>
                
                <div style="display: inline-block; padding: 20px 40px; border: 4px solid #BBDEFB; border-radius: 10px; background: rgba(255,255,255,0.08); margin-bottom: 25px;">
                    <div style="font-size: 20pt; font-weight: bold; color: #BBDEFB; letter-spacing: 3px;">KINGDOM OF ESWATINI</div>
                    <div style="font-size: 28pt; font-weight: bold; letter-spacing: 2px; margin-top: 8px;">REGIONAL DEVELOPMENT FUND</div>
                </div>
                
                <div style="background: #FFD54F; color: #0D47A1; font-size: 22pt; font-weight: bold; padding: 15px 50px; display: inline-block; border-radius: 5px; letter-spacing: 2px; margin: 25px 0;">
                    GRANT APPLICATION FORM
                </div>
                
                <div style="margin-top: 40px; padding: 30px 40px; border: 2px solid rgba(255,255,255,0.3); border-radius: 10px; background: rgba(255,255,255,0.05);">
                    <p style="font-size: 13pt; margin: 5px 0; text-align: center;"><strong style="color: #FFD54F;">Project Name:</strong></p>
                    <p style="font-size: 20pt; margin: 10px 0; text-align: center; font-weight: bold;">LUSHIKISHINI CATTLE FEEDLOT PROJECT</p>
                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 20px 0;"/>
                    <p style="font-size: 12pt; margin: 8px 0; text-align: center;"><strong style="color: #FFD54F;">Applicant:</strong> Lushikishini Cattle Feedlot Cooperative</p>
                    <p style="font-size: 12pt; margin: 8px 0; text-align: center;"><strong style="color: #FFD54F;">Grant Requested:</strong> E500,000.00</p>
                    <p style="font-size: 12pt; margin: 8px 0; text-align: center;"><strong style="color: #FFD54F;">Location:</strong> Phondo Inkhundla, Manzini Region</p>
                </div>
                
                <div style="margin-top: 40px;">
                    <table style="width: 80%; margin: 0 auto; border-collapse: separate; border-spacing: 15px;">
                        <tr>
                            <td style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; border: none;">
                                <div style="font-size: 22pt; font-weight: bold; color: #FFD54F;">E560,000</div>
                                <div style="font-size: 9pt; color: #BBDEFB;">TOTAL BUDGET</div>
                            </td>
                            <td style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; border: none;">
                                <div style="font-size: 22pt; font-weight: bold; color: #FFD54F;">10</div>
                                <div style="font-size: 9pt; color: #BBDEFB;">BENEFICIARIES</div>
                            </td>
                            <td style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; border: none;">
                                <div style="font-size: 22pt; font-weight: bold; color: #FFD54F;">40</div>
                                <div style="font-size: 9pt; color: #BBDEFB;">JOBS CREATED</div>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin-top: 40px; font-size: 9pt; opacity: 0.8; letter-spacing: 1px;">
                    MINISTRY OF TINKHUNDLA ADMINISTRATION AND DEVELOPMENT<br/>
                    PHONDO INKHUNDLA • CHIEF SOMTSEWU • JANUARY 2026
                </div>

            </td>
        </tr>
    </table>
</div>
"""

part_a = """
<div class="content">
<h1>Part A: Applicant Information</h1>

<h2>A.1 Organization Details</h2>
<table>
    <tr>
        <td style="width: 35%; background: #E3F2FD;"><strong>Organization Name</strong></td>
        <td>Lushikishini Cattle Feedlot Cooperative</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Type of Organization</strong></td>
        <td>Community Cooperative</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Registration Number</strong></td>
        <td><em style="color: #666;">(To be assigned upon registration)</em></td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Date of Establishment</strong></td>
        <td>January 2026</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Number of Members</strong></td>
        <td>10 Founding Members</td>
    </tr>
</table>

<h2>A.2 Physical Address</h2>
<table>
    <tr>
        <td style="width: 35%; background: #E3F2FD;"><strong>Area/Locality</strong></td>
        <td>Lushikishini, kaMavuso</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Inkhundla</strong></td>
        <td>Phondo Inkhundla</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Region</strong></td>
        <td>Manzini Region</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Traditional Authority</strong></td>
        <td>Chief Somtsewu</td>
    </tr>
</table>

<h2>A.3 Contact Person</h2>
<table>
    <tr>
        <td style="width: 35%; background: #E3F2FD;"><strong>Full Name</strong></td>
        <td>Sibusiso Mavuso</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Position</strong></td>
        <td>Chairperson & Treasurer</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Mobile Number</strong></td>
        <td>+268 7609 1419</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Email Address</strong></td>
        <td>sibusisomavusocv@gmail.com</td>
    </tr>
</table>
"""

part_b = """
<div class="page-break"></div>
<h1>Part B: Project Details</h1>

<h2>B.1 Project Title</h2>
<div class="section-box">
    <p style="font-size: 14pt; font-weight: bold; color: #0D47A1; margin: 0;">Lushikishini Community Cattle Feedlot Project</p>
</div>

<h2>B.2 Project Summary</h2>
<div style="background: #FAFAFA; border: 1px solid #1976D2; padding: 15px; border-radius: 8px; text-align: justify;">
    <p style="margin: 0;">The Lushikishini Cattle Feedlot Project is a community-owned agricultural enterprise designed to fatten cattle for the beef market. The cooperative will establish four (4) feedlot units with a combined capacity of 40 cattle. Operating on a 90-day fattening cycle, the project will add an average of 120kg to each animal's weight, producing premium market-ready cattle for sale to abattoirs and local butcheries.</p>
</div>

<h2>B.3 Project Location</h2>
<table>
    <tr>
        <td style="width: 35%; background: #E3F2FD;"><strong>Site Name</strong></td>
        <td>Lushikishini Community Land</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Coordinates</strong></td>
        <td>kaMavuso Area, Phondo Inkhundla</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Land Tenure</strong></td>
        <td>Swazi Nation Land (Community Allocation)</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Land Size</strong></td>
        <td>2 hectares</td>
    </tr>
    <tr>
        <td style="background: #E3F2FD;"><strong>Water Source</strong></td>
        <td>Nearby river and borehole access</td>
    </tr>
</table>

<h2>B.4 Project Objectives</h2>
<ol>
    <li><strong>Economic Development:</strong> Create sustainable income for 10 cooperative members</li>
    <li><strong>Employment Creation:</strong> Generate 40 direct and indirect jobs in the community</li>
    <li><strong>Food Security:</strong> Contribute to national beef production and food security</li>
    <li><strong>Skills Transfer:</strong> Develop livestock management capabilities in the community</li>
    <li><strong>Model Enterprise:</strong> Establish a replicable model for community-based agriculture</li>
</ol>

<h2>B.5 Expected Outputs</h2>
<table>
    <tr>
        <th>Output</th>
        <th>Year 1</th>
        <th>Year 2</th>
        <th>Year 3</th>
    </tr>
    <tr>
        <td>Cattle Fattened & Sold</td>
        <td style="text-align: center;">120</td>
        <td style="text-align: center;">144</td>
        <td style="text-align: center;">180</td>
    </tr>
    <tr>
        <td>Revenue Generated</td>
        <td style="text-align: center;">E1,380,000</td>
        <td style="text-align: center;">E1,656,000</td>
        <td style="text-align: center;">E2,070,000</td>
    </tr>
    <tr>
        <td>Member Income (each)</td>
        <td style="text-align: center;">E48,096/yr</td>
        <td style="text-align: center;">E60,120/yr</td>
        <td style="text-align: center;">E78,156/yr</td>
    </tr>
    <tr>
        <td>Jobs Supported</td>
        <td style="text-align: center;">40</td>
        <td style="text-align: center;">50</td>
        <td style="text-align: center;">60</td>
    </tr>
</table>
"""

part_c = """
<h1>Part C: Budget & Funding</h1>

<h2>C.1 Summary of Funding Sources</h2>

<table>
    <tr>
        <th style="width: 50%;">Source</th>
        <th style="width: 25%;">Amount (SZL)</th>
        <th style="width: 25%;">Percentage</th>
    </tr>
    <tr>
        <td><strong>RDF Grant Requested</strong></td>
        <td style="text-align: right; font-weight: bold; color: #0D47A1;">E500,000.00</td>
        <td style="text-align: center;">89.3%</td>
    </tr>
    <tr>
        <td><strong>Own Contribution (In-Kind)</strong></td>
        <td style="text-align: right;">E60,000.00</td>
        <td style="text-align: center;">10.7%</td>
    </tr>
    <tr style="background: #0D47A1; color: white;">
        <td><strong>TOTAL PROJECT COST</strong></td>
        <td style="text-align: right; font-weight: bold;">E560,000.00</td>
        <td style="text-align: center;"><strong>100%</strong></td>
    </tr>
</table>

<h2>C.2 Detailed Budget — RDF Grant (E500,000)</h2>
<table>
    <tr>
        <th style="width: 45%;">Item</th>
        <th style="width: 15%;">Qty</th>
        <th style="width: 20%;">Unit Cost</th>
        <th style="width: 20%;">Total</th>
    </tr>
    <tr>
        <td colspan="4" style="background: #1976D2; color: white;"><strong>A. Infrastructure</strong></td>
    </tr>
    <tr>
        <td>Feedlot construction (4 units)</td>
        <td style="text-align: center;">4</td>
        <td style="text-align: right;">E25,000</td>
        <td style="text-align: right;">E100,000</td>
    </tr>
    <tr>
        <td>Water system & troughs</td>
        <td style="text-align: center;">1</td>
        <td style="text-align: right;">E35,000</td>
        <td style="text-align: right;">E35,000</td>
    </tr>
    <tr>
        <td>Storage shed (feed)</td>
        <td style="text-align: center;">1</td>
        <td style="text-align: right;">E25,000</td>
        <td style="text-align: right;">E25,000</td>
    </tr>
    <tr>
        <td colspan="3" style="text-align: right;"><strong>Infrastructure Subtotal:</strong></td>
        <td style="text-align: right; font-weight: bold;">E160,000</td>
    </tr>
    <tr>
        <td colspan="4" style="background: #1976D2; color: white;"><strong>B. Livestock</strong></td>
    </tr>
    <tr>
        <td>Weaner cattle (initial stock)</td>
        <td style="text-align: center;">40</td>
        <td style="text-align: right;">E5,500</td>
        <td style="text-align: right;">E220,000</td>
    </tr>
    <tr>
        <td colspan="3" style="text-align: right;"><strong>Livestock Subtotal:</strong></td>
        <td style="text-align: right; font-weight: bold;">E220,000</td>
    </tr>
    <tr>
        <td colspan="4" style="background: #1976D2; color: white;"><strong>C. Equipment & Feed</strong></td>
    </tr>
    <tr>
        <td>Feed (3 months initial supply)</td>
        <td style="text-align: center;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">E50,000</td>
    </tr>
    <tr>
        <td>Veterinary supplies & medicines</td>
        <td style="text-align: center;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">E20,000</td>
    </tr>
    <tr>
        <td>Equipment (scales, tools)</td>
        <td style="text-align: center;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">E20,000</td>
    </tr>
    <tr>
        <td colspan="3" style="text-align: right;"><strong>Equipment Subtotal:</strong></td>
        <td style="text-align: right; font-weight: bold;">E90,000</td>
    </tr>
    <tr>
        <td colspan="4" style="background: #1976D2; color: white;"><strong>D. Operations & Training</strong></td>
    </tr>
    <tr>
        <td>Working capital (3 months)</td>
        <td style="text-align: center;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">E20,000</td>
    </tr>
    <tr>
        <td>Training & capacity building</td>
        <td style="text-align: center;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">E10,000</td>
    </tr>
    <tr>
        <td colspan="3" style="text-align: right;"><strong>Operations Subtotal:</strong></td>
        <td style="text-align: right; font-weight: bold;">E30,000</td>
    </tr>
    <tr style="background: #0D47A1; color: white;">
        <td colspan="3"><strong>TOTAL RDF GRANT REQUESTED</strong></td>
        <td style="text-align: right; font-size: 12pt;"><strong>E500,000</strong></td>
    </tr>
</table>

<h2>C.3 Own Contribution (In-Kind) — E60,000</h2>
<table>
    <tr>
        <th>Item</th>
        <th>Value</th>
        <th>Notes</th>
    </tr>
    <tr>
        <td>Cattle (4 head)</td>
        <td style="text-align: right;">E40,000</td>
        <td>From members' existing herds</td>
    </tr>
    <tr>
        <td>Existing kraal structure</td>
        <td style="text-align: right;">E10,000</td>
        <td>Community infrastructure</td>
    </tr>
    <tr>
        <td>Labor contribution</td>
        <td style="text-align: right;">E10,000</td>
        <td>Construction and setup labor</td>
    </tr>
    <tr style="background: #E3F2FD;">
        <td><strong>Total Own Contribution</strong></td>
        <td style="text-align: right; font-weight: bold;">E60,000</td>
        <td><strong>10.7% of total project</strong></td>
    </tr>
</table>
"""

part_d = """
<div class="page-break"></div>
<h1>Part D: Implementation Plan</h1>

<h2>D.1 Project Timeline</h2>
<table>
    <tr>
        <th style="width: 15%;">Month</th>
        <th style="width: 55%;">Activity</th>
        <th style="width: 30%;">Milestone</th>
    </tr>
    <tr>
        <td style="text-align: center;"><strong>1</strong></td>
        <td>
            • Cooperative registration<br/>
            • Bank account opening<br/>
            • Secure land allocation letter
        </td>
        <td>Legal formation complete</td>
    </tr>
    <tr>
        <td style="text-align: center;"><strong>2</strong></td>
        <td>
            • Site preparation<br/>
            • Begin feedlot construction<br/>
            • Procure building materials
        </td>
        <td>Construction commences</td>
    </tr>
    <tr>
        <td style="text-align: center;"><strong>3</strong></td>
        <td>
            • Complete feedlot units<br/>
            • Install water system<br/>
            • Construct feed storage
        </td>
        <td>Infrastructure complete</td>
    </tr>
    <tr>
        <td style="text-align: center;"><strong>4</strong></td>
        <td>
            • Procure initial feed stock<br/>
            • Purchase 40 weaner cattle<br/>
            • Member training on operations
        </td>
        <td>Operations begin</td>
    </tr>
    <tr>
        <td style="text-align: center;"><strong>5-6</strong></td>
        <td>
            • Daily feeding and care<br/>
            • Veterinary monitoring<br/>
            • Record keeping training
        </td>
        <td>Fattening in progress</td>
    </tr>
    <tr>
        <td style="text-align: center;"><strong>7</strong></td>
        <td>
            • First batch reaches target weight<br/>
            • Negotiate sale contracts<br/>
            • Sell first 10 cattle
        </td>
        <td style="color: #1B5E20; font-weight: bold;">FIRST REVENUE</td>
    </tr>
    <tr>
        <td style="text-align: center;"><strong>8+</strong></td>
        <td>
            • Continuous monthly sales<br/>
            • Reinvest in replacement stock<br/>
            • Scale up operations
        </td>
        <td>Self-sustaining operations</td>
    </tr>
</table>

<h2>D.2 Management Structure</h2>
<table>
    <tr>
        <th>Position</th>
        <th>Name</th>
        <th>Responsibilities</th>
    </tr>
    <tr>
        <td>Chairperson</td>
        <td><strong>Sibusiso Mavuso</strong></td>
        <td>Overall leadership, external relations, strategic decisions</td>
    </tr>
    <tr>
        <td>Vice-Chairperson</td>
        <td><strong>Seluleko Ndwandwe</strong></td>
        <td>Operations oversight, deputize for Chairperson</td>
    </tr>
    <tr>
        <td>Secretary</td>
        <td><strong>Zakhele Dlamini</strong></td>
        <td>Records, correspondence, meeting coordination</td>
    </tr>
    <tr>
        <td>Treasurer</td>
        <td><strong>Sibusiso Mavuso</strong></td>
        <td>Financial management, reporting, procurement</td>
    </tr>
    <tr>
        <td>Technical Advisor</td>
        <td><strong>Sanele Dlamini</strong></td>
        <td>Feed management, animal health, technical guidance</td>
    </tr>
</table>
"""

part_e = """
<h1>Part E: Sustainability & Risk Management</h1>

<h2>E.1 Financial Sustainability</h2>
<div class="section-box">
    <p style="margin: 0;"><strong>The project will achieve financial sustainability from Month 7 onwards.</strong> After the initial fattening cycle, the cooperative will generate sufficient revenue to cover all operating costs and provide member income without additional external funding.</p>
</div>

<table>
    <tr>
        <th>Indicator</th>
        <th>Value</th>
        <th>Assessment</th>
    </tr>
    <tr>
        <td>Monthly Profit (from Month 7)</td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">E50,100</td>
        <td>Strong positive cash flow</td>
    </tr>
    <tr>
        <td>Return on Investment (ROI)</td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">142%</td>
        <td>Highly attractive return</td>
    </tr>
    <tr>
        <td>Payback Period</td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">8.4 months</td>
        <td>Quick investment recovery</td>
    </tr>
    <tr>
        <td>Break-even Point</td>
        <td style="text-align: right;">7 cattle/month</td>
        <td>Below sales target of 10</td>
    </tr>
</table>

<h2>E.2 Risk Management</h2>
<table>
    <tr>
        <th style="width: 25%;">Risk</th>
        <th style="width: 15%;">Likelihood</th>
        <th style="width: 60%;">Mitigation Strategy</th>
    </tr>
    <tr>
        <td>Disease outbreak</td>
        <td style="text-align: center; background: #FFCDD2;">High</td>
        <td>Regular veterinary checkups, vaccination schedule, quarantine protocols for new animals</td>
    </tr>
    <tr>
        <td>Feed price increase</td>
        <td style="text-align: center; background: #FFE0B2;">Medium</td>
        <td>Establish contracts with suppliers, explore local feed sources, maintain 3-month buffer stock</td>
    </tr>
    <tr>
        <td>Market price drop</td>
        <td style="text-align: center; background: #FFE0B2;">Medium</td>
        <td>Pre-sale agreements with buyers, diversify sales channels, quality premium pricing</td>
    </tr>
    <tr>
        <td>Theft/security</td>
        <td style="text-align: center; background: #C8E6C9;">Low</td>
        <td>Community watch, secure fencing, insurance coverage, member responsibility</td>
    </tr>
    <tr>
        <td>Drought</td>
        <td style="text-align: center; background: #FFE0B2;">Medium</td>
        <td>Water storage facilities, borehole access, reduce herd if necessary</td>
    </tr>
</table>

<h2>E.3 Environmental Sustainability</h2>
<ol>
    <li><strong>Waste Management:</strong> Manure will be collected and sold/used as fertilizer</li>
    <li><strong>Water Conservation:</strong> Efficient watering systems to minimize wastage</li>
    <li><strong>Land Management:</strong> Proper drainage to prevent pollution</li>
    <li><strong>Carrying Capacity:</strong> Stocking rates within sustainable limits</li>
</ol>
"""

part_f = """
<div class="page-break"></div>
<h1>Part F: Community Impact</h1>

<h2>F.1 Direct Beneficiaries</h2>
<table>
    <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 25%;">Full Name</th>
        <th style="width: 15%;">Gender</th>
        <th style="width: 15%;">Age Group</th>
        <th style="width: 25%;">Role</th>
    </tr>
    <tr>
        <td>1</td>
        <td>Sibusiso Mavuso</td>
        <td style="text-align: center;">Male</td>
        <td style="text-align: center;">35-44</td>
        <td>Chairperson/Treasurer</td>
    </tr>
    <tr>
        <td>2</td>
        <td>Sanele Dlamini</td>
        <td style="text-align: center;">Male</td>
        <td style="text-align: center;">25-34</td>
        <td>Technical Advisor</td>
    </tr>
    <tr>
        <td>3</td>
        <td>Zakhele Dlamini</td>
        <td style="text-align: center;">Male</td>
        <td style="text-align: center;">25-34</td>
        <td>Secretary</td>
    </tr>
    <tr>
        <td>4</td>
        <td>Seluleko Ndwandwe</td>
        <td style="text-align: center;">Male</td>
        <td style="text-align: center;">35-44</td>
        <td>Vice-Chairperson</td>
    </tr>
    <tr>
        <td>5</td>
        <td>Sibusiso Dlamini</td>
        <td style="text-align: center;">Male</td>
        <td style="text-align: center;">25-34</td>
        <td>Member</td>
    </tr>
    <tr>
        <td>6</td>
        <td>Temancele Mavuso</td>
        <td style="text-align: center;">Female</td>
        <td style="text-align: center;">45-54</td>
        <td>Member</td>
    </tr>
    <tr>
        <td>7</td>
        <td>Gugu Vilakati</td>
        <td style="text-align: center;">Female</td>
        <td style="text-align: center;">25-34</td>
        <td>Member</td>
    </tr>
    <tr>
        <td>8</td>
        <td>Vuyo Motsa</td>
        <td style="text-align: center;">Male</td>
        <td style="text-align: center;">25-34</td>
        <td>Member</td>
    </tr>
    <tr>
        <td>9</td>
        <td>Neliso Mavuso</td>
        <td style="text-align: center;">Male</td>
        <td style="text-align: center;">18-24</td>
        <td>Member</td>
    </tr>
    <tr>
        <td>10</td>
        <td>Sphumelele Shabangu</td>
        <td style="text-align: center;">Male</td>
        <td style="text-align: center;">25-34</td>
        <td>Member</td>
    </tr>
</table>

<h2>F.2 Indirect Community Benefits</h2>
<table>
    <tr>
        <th>Benefit Category</th>
        <th>Description</th>
        <th>Estimated Impact</th>
    </tr>
    <tr>
        <td>Employment</td>
        <td>Casual labor, transportation, feed suppliers</td>
        <td>30 additional jobs</td>
    </tr>
    <tr>
        <td>Skills Development</td>
        <td>Training in livestock management, business skills</td>
        <td>20+ people trained</td>
    </tr>
    <tr>
        <td>Local Economy</td>
        <td>Spending at local businesses</td>
        <td>E300,000+ annually</td>
    </tr>
    <tr>
        <td>Food Security</td>
        <td>Local beef production</td>
        <td>120+ cattle/year to market</td>
    </tr>
    <tr>
        <td>Model Enterprise</td>
        <td>Replication potential</td>
        <td>3+ similar projects possible</td>
    </tr>
</table>
"""

declarations = """
<h1>Part G: Declarations & Signatures</h1>

<h2>G.1 Applicant Declaration</h2>
<div style="background: linear-gradient(135deg, #E3F2FD, #BBDEFB); border: 2px solid #1976D2; padding: 20px; border-radius: 10px; margin: 20px 0;">
    <p style="text-align: justify;">I, <strong>Sibusiso Mavuso</strong>, as the authorized representative of the Lushikishini Cattle Feedlot Cooperative, do hereby declare that:</p>
    <ol style="text-align: justify;">
        <li>All information provided in this application is true and accurate to the best of my knowledge;</li>
        <li>The cooperative has not received funding from other sources for this same project;</li>
        <li>All members have agreed to participate in this project and have contributed to this application;</li>
        <li>The cooperative commits to use the grant funds solely for the purposes stated in this application;</li>
        <li>The cooperative will maintain proper records and submit progress reports as required;</li>
        <li>The cooperative understands that misuse of funds may result in legal action and recovery.</li>
    </ol>
</div>

<h2>G.2 Signature Block</h2>
<table style="border: none;">
    <tr>
        <td style="width: 50%; border: none; padding: 20px;">
            <p><strong>Chairperson:</strong></p>
            <p>Name: <span style="border-bottom: 1px solid #333; display: inline-block; width: 150px;">Sibusiso Mavuso</span></p>
            <p>Signature: <span style="border-bottom: 1px solid #333; display: inline-block; width: 150px;"></span></p>
            <p>Date: <span style="border-bottom: 1px solid #333; display: inline-block; width: 150px;"></span></p>
        </td>
        <td style="width: 50%; border: none; padding: 20px;">
            <p><strong>Secretary:</strong></p>
            <p>Name: <span style="border-bottom: 1px solid #333; display: inline-block; width: 150px;">Zakhele Dlamini</span></p>
            <p>Signature: <span style="border-bottom: 1px solid #333; display: inline-block; width: 150px;"></span></p>
            <p>Date: <span style="border-bottom: 1px solid #333; display: inline-block; width: 150px;"></span></p>
        </td>
    </tr>
</table>

<h2>G.3 Chief's Endorsement</h2>
<div style="background: #FFF8E1; border: 2px solid #FFB300; padding: 20px; border-radius: 10px; margin: 20px 0;">
    <p>I, as representative of the Office of <strong>Chief Somtsewu</strong>, Phondo Inkhundla, hereby confirm that:</p>
    <ol>
        <li>The applicant cooperative is known to this office;</li>
        <li>The project location falls within our traditional authority area;</li>
        <li>Land has been allocated for this project;</li>
        <li>This office supports the implementation of this project.</li>
    </ol>
    <table style="border: none; margin-top: 20px;">
        <tr>
            <td style="width: 50%; border: none;">
                <p>Name & Title:</p>
                <div style="border-bottom: 1px solid #333; height: 30px;"></div>
            </td>
            <td style="width: 50%; border: none;">
                <p>Signature/Stamp:</p>
                <div style="border: 2px dashed #FFB300; height: 60px; border-radius: 5px;"></div>
            </td>
        </tr>
        <tr>
            <td colspan="2" style="border: none;">
                <p>Date: _______________________________</p>
            </td>
        </tr>
    </table>
</div>

<hr style="border: none; border-top: 3px solid #1976D2; margin: 40px 0;"/>

<div style="text-align: center; color: #666;">
    <p><strong style="color: #0D47A1;">REGIONAL DEVELOPMENT FUND — GRANT APPLICATION</strong></p>
    <p>Lushikishini Cattle Feedlot Cooperative • E500,000 Request</p>
    <p>Phondo Inkhundla • Chief Somtsewu • Kingdom of Eswatini</p>
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
{part_a}
{part_b}
{part_c}
{part_d}
{part_e}
{part_f}
{declarations}
</div>
</body>
</html>
"""

output_file = Path('/workspaces/WorldClass-ERP/LUSHIKISHINI-FEEDLOT-PROJECT/LUSHIKISHINI-RDF-APPLICATION-PROFESSIONAL.pdf')
HTML(string=full_html).write_pdf(str(output_file))
print(f"✅ RDF Application PDF generated: {output_file}")
print(f"   Size: {output_file.stat().st_size / 1024:.1f} KB")
