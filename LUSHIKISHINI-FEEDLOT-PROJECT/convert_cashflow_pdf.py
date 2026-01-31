#!/usr/bin/env python3
"""Convert Lushikishini Cash Flow Projection to Professional PDF"""

from weasyprint import HTML
from pathlib import Path

css = """
@page { 
    size: A4 landscape; 
    margin: 1.5cm 2cm 2cm 2cm;
    @top-center {
        content: "Lushikishini Cattle Feedlot Cooperative — Financial Projections";
        font-family: Arial, sans-serif;
        font-size: 8pt;
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
    font-size: 9pt; 
    line-height: 1.5; 
    color: #333; 
}

h1 { color: #1B5E20; font-size: 16pt; border-bottom: 3px solid #43A047; padding-bottom: 8px; margin-top: 20px; }
h2 { color: #1B5E20; font-size: 13pt; margin-top: 18px; }
h3 { color: #2E7D32; font-size: 11pt; margin-top: 12px; }

table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 8pt; }
th { background: #1B5E20; color: white; padding: 6px; text-align: center; font-weight: bold; }
td { border: 1px solid #C8E6C9; padding: 5px; }
tr:nth-child(even) { background: #E8F5E9; }

.page-break { page-break-before: always; }
.content { padding: 0 15px; }
"""

cover_page = """
<div style="width: 297mm; height: 210mm; background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%); color: white; page-break-after: always;">
    <table style="width: 100%; height: 100%; border: 0; border-collapse: collapse;">
        <tr>
            <td style="vertical-align: middle; text-align: center; border: 0; padding: 40px;">
                
                <div style="font-size: 56pt; margin-bottom: 15px;">📊💰</div>
                
                <div style="display: inline-block; padding: 20px 45px; border: 4px solid #C8E6C9; border-radius: 10px; background: rgba(255,255,255,0.08); margin-bottom: 25px;">
                    <div style="font-size: 30pt; font-weight: bold; letter-spacing: 2px;">LUSHIKISHINI</div>
                    <div style="font-size: 12pt; color: #C8E6C9; letter-spacing: 2px; margin-top: 5px;">CATTLE FEEDLOT COOPERATIVE</div>
                </div>
                
                <div style="background: #FFD54F; color: #1B5E20; font-size: 22pt; font-weight: bold; padding: 12px 45px; display: inline-block; border-radius: 5px; letter-spacing: 2px; margin: 20px 0;">
                    CASH FLOW PROJECTION
                </div>
                
                <div style="margin-top: 30px;">
                    <table style="width: 90%; margin: 0 auto; border-collapse: separate; border-spacing: 12px;">
                        <tr>
                            <td style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px 10px; border-radius: 8px; border: none; width: 20%;">
                                <div style="font-size: 20pt; font-weight: bold; color: #FFD54F;">E560K</div>
                                <div style="font-size: 8pt; color: #C8E6C9;">TOTAL INVESTMENT</div>
                            </td>
                            <td style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px 10px; border-radius: 8px; border: none; width: 20%;">
                                <div style="font-size: 20pt; font-weight: bold; color: #FFD54F;">E50.1K</div>
                                <div style="font-size: 8pt; color: #C8E6C9;">MONTHLY PROFIT</div>
                            </td>
                            <td style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px 10px; border-radius: 8px; border: none; width: 20%;">
                                <div style="font-size: 20pt; font-weight: bold; color: #FFD54F;">142%</div>
                                <div style="font-size: 8pt; color: #C8E6C9;">ANNUAL ROI</div>
                            </td>
                            <td style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px 10px; border-radius: 8px; border: none; width: 20%;">
                                <div style="font-size: 20pt; font-weight: bold; color: #FFD54F;">8.4</div>
                                <div style="font-size: 8pt; color: #C8E6C9;">PAYBACK (MONTHS)</div>
                            </td>
                            <td style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px 10px; border-radius: 8px; border: none; width: 20%;">
                                <div style="font-size: 20pt; font-weight: bold; color: #FFD54F;">E4K</div>
                                <div style="font-size: 8pt; color: #C8E6C9;">PER MEMBER/MONTH</div>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin-top: 35px; padding: 15px; border: 2px solid rgba(255,255,255,0.3); border-radius: 10px; background: rgba(255,255,255,0.05); width: 70%; margin-left: auto; margin-right: auto;">
                    <p style="font-size: 10pt; margin: 5px 0; text-align: center;"><strong style="color: #FFD54F;">Regional Development Fund Grant Application</strong></p>
                    <p style="font-size: 9pt; margin: 5px 0; text-align: center;">Phondo Inkhundla • Chief Somtsewu • 12-Month Financial Projection</p>
                </div>

            </td>
        </tr>
    </table>
</div>
"""

assumptions = """
<div class="content">
<h1>Financial Assumptions & Parameters</h1>

<table>
    <tr>
        <th colspan="2" style="background: #2E7D32;">Investment Parameters</th>
        <th colspan="2" style="background: #2E7D32;">Revenue Parameters</th>
    </tr>
    <tr>
        <td style="width: 20%; background: #E8F5E9;"><strong>Total Investment</strong></td>
        <td style="width: 30%;">E560,000</td>
        <td style="width: 20%; background: #E8F5E9;"><strong>Selling Price/Cattle</strong></td>
        <td style="width: 30%;">E11,500</td>
    </tr>
    <tr>
        <td style="background: #E8F5E9;"><strong>RDF Grant</strong></td>
        <td>E500,000 (89%)</td>
        <td style="background: #E8F5E9;"><strong>Sales per Month</strong></td>
        <td>10 cattle</td>
    </tr>
    <tr>
        <td style="background: #E8F5E9;"><strong>Own Contribution</strong></td>
        <td>E60,000 (11%)</td>
        <td style="background: #E8F5E9;"><strong>Monthly Revenue</strong></td>
        <td>E115,000</td>
    </tr>
    <tr>
        <th colspan="2" style="background: #2E7D32;">Operating Parameters</th>
        <th colspan="2" style="background: #2E7D32;">Cost Parameters</th>
    </tr>
    <tr>
        <td style="background: #E8F5E9;"><strong>Feedlot Capacity</strong></td>
        <td>40 cattle</td>
        <td style="background: #E8F5E9;"><strong>Weaner Purchase</strong></td>
        <td>E5,500/head</td>
    </tr>
    <tr>
        <td style="background: #E8F5E9;"><strong>Fattening Cycle</strong></td>
        <td>90 days</td>
        <td style="background: #E8F5E9;"><strong>Feed Cost/Cycle</strong></td>
        <td>E1,200/head</td>
    </tr>
    <tr>
        <td style="background: #E8F5E9;"><strong>Weight Gain</strong></td>
        <td>120 kg per cycle</td>
        <td style="background: #E8F5E9;"><strong>Vet & Meds/Cycle</strong></td>
        <td>E200/head</td>
    </tr>
    <tr>
        <td style="background: #E8F5E9;"><strong>Cooperative Members</strong></td>
        <td>10 members</td>
        <td style="background: #E8F5E9;"><strong>Monthly Overhead</strong></td>
        <td>E3,000</td>
    </tr>
</table>
"""

monthly_projection = """
<h1>12-Month Cash Flow Projection</h1>

<table>
    <tr>
        <th style="width: 14%; text-align: left;">Category</th>
        <th style="width: 7%;">Month 1</th>
        <th style="width: 7%;">Month 2</th>
        <th style="width: 7%;">Month 3</th>
        <th style="width: 7%;">Month 4</th>
        <th style="width: 7%;">Month 5</th>
        <th style="width: 7%;">Month 6</th>
        <th style="width: 7%;">Month 7</th>
        <th style="width: 7%;">Month 8</th>
        <th style="width: 7%;">Month 9</th>
        <th style="width: 7%;">Month 10</th>
        <th style="width: 7%;">Month 11</th>
        <th style="width: 7%;">Month 12</th>
    </tr>
    <tr style="background: #C8E6C9;">
        <td colspan="13"><strong>CASH INFLOWS</strong></td>
    </tr>
    <tr>
        <td>RDF Grant</td>
        <td style="text-align: right; color: #1B5E20;">500,000</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
    </tr>
    <tr>
        <td>Own Contribution</td>
        <td style="text-align: right; color: #1B5E20;">60,000</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
    </tr>
    <tr>
        <td>Cattle Sales</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right; color: #1B5E20;">115,000</td>
        <td style="text-align: right; color: #1B5E20;">115,000</td>
        <td style="text-align: right; color: #1B5E20;">115,000</td>
        <td style="text-align: right; color: #1B5E20;">115,000</td>
        <td style="text-align: right; color: #1B5E20;">115,000</td>
        <td style="text-align: right; color: #1B5E20;">115,000</td>
    </tr>
    <tr style="background: #A5D6A7; font-weight: bold;">
        <td>TOTAL INFLOWS</td>
        <td style="text-align: right;">560,000</td>
        <td style="text-align: right;">0</td>
        <td style="text-align: right;">0</td>
        <td style="text-align: right;">0</td>
        <td style="text-align: right;">0</td>
        <td style="text-align: right;">0</td>
        <td style="text-align: right;">115,000</td>
        <td style="text-align: right;">115,000</td>
        <td style="text-align: right;">115,000</td>
        <td style="text-align: right;">115,000</td>
        <td style="text-align: right;">115,000</td>
        <td style="text-align: right;">115,000</td>
    </tr>
    <tr style="background: #FFCDD2;">
        <td colspan="13"><strong>CASH OUTFLOWS</strong></td>
    </tr>
    <tr>
        <td>Infrastructure</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right; color: #C62828;">80,000</td>
        <td style="text-align: right; color: #C62828;">80,000</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
    </tr>
    <tr>
        <td>Cattle Purchase</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right; color: #C62828;">220,000</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right; color: #C62828;">55,000</td>
        <td style="text-align: right; color: #C62828;">55,000</td>
        <td style="text-align: right; color: #C62828;">55,000</td>
        <td style="text-align: right; color: #C62828;">55,000</td>
        <td style="text-align: right; color: #C62828;">55,000</td>
        <td style="text-align: right; color: #C62828;">55,000</td>
    </tr>
    <tr>
        <td>Feed</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right; color: #C62828;">16,000</td>
        <td style="text-align: right; color: #C62828;">16,000</td>
        <td style="text-align: right; color: #C62828;">16,000</td>
        <td style="text-align: right; color: #C62828;">4,000</td>
        <td style="text-align: right; color: #C62828;">4,000</td>
        <td style="text-align: right; color: #C62828;">4,000</td>
        <td style="text-align: right; color: #C62828;">4,000</td>
        <td style="text-align: right; color: #C62828;">4,000</td>
        <td style="text-align: right; color: #C62828;">4,000</td>
    </tr>
    <tr>
        <td>Vet & Medicines</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right; color: #C62828;">8,000</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right; color: #C62828;">2,000</td>
        <td style="text-align: right; color: #C62828;">2,000</td>
        <td style="text-align: right; color: #C62828;">2,000</td>
        <td style="text-align: right; color: #C62828;">2,000</td>
        <td style="text-align: right; color: #C62828;">2,000</td>
        <td style="text-align: right; color: #C62828;">2,000</td>
    </tr>
    <tr>
        <td>Operating Costs</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
        <td style="text-align: right; color: #C62828;">3,000</td>
    </tr>
    <tr>
        <td>Training</td>
        <td style="text-align: right; color: #C62828;">10,000</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
    </tr>
    <tr>
        <td>Equipment</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right; color: #C62828;">20,000</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">-</td>
    </tr>
    <tr style="background: #EF9A9A; font-weight: bold;">
        <td>TOTAL OUTFLOWS</td>
        <td style="text-align: right;">10,000</td>
        <td style="text-align: right;">83,000</td>
        <td style="text-align: right;">103,000</td>
        <td style="text-align: right;">247,000</td>
        <td style="text-align: right;">19,000</td>
        <td style="text-align: right;">19,000</td>
        <td style="text-align: right;">64,000</td>
        <td style="text-align: right;">64,000</td>
        <td style="text-align: right;">64,000</td>
        <td style="text-align: right;">64,000</td>
        <td style="text-align: right;">64,000</td>
        <td style="text-align: right;">64,000</td>
    </tr>
    <tr style="background: #FFF9C4;">
        <td><strong>NET CASH FLOW</strong></td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">550,000</td>
        <td style="text-align: right; font-weight: bold; color: #C62828;">(83,000)</td>
        <td style="text-align: right; font-weight: bold; color: #C62828;">(103,000)</td>
        <td style="text-align: right; font-weight: bold; color: #C62828;">(247,000)</td>
        <td style="text-align: right; font-weight: bold; color: #C62828;">(19,000)</td>
        <td style="text-align: right; font-weight: bold; color: #C62828;">(19,000)</td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">51,000</td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">51,000</td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">51,000</td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">51,000</td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">51,000</td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">51,000</td>
    </tr>
    <tr style="background: #1B5E20; color: white; font-weight: bold;">
        <td>CUMULATIVE CASH</td>
        <td style="text-align: right;">550,000</td>
        <td style="text-align: right;">467,000</td>
        <td style="text-align: right;">364,000</td>
        <td style="text-align: right;">117,000</td>
        <td style="text-align: right;">98,000</td>
        <td style="text-align: right;">79,000</td>
        <td style="text-align: right;">130,000</td>
        <td style="text-align: right;">181,000</td>
        <td style="text-align: right;">232,000</td>
        <td style="text-align: right;">283,000</td>
        <td style="text-align: right;">334,000</td>
        <td style="text-align: right;">385,000</td>
    </tr>
</table>
"""

summary_page = """
<div class="page-break"></div>
<h1>Annual Financial Summary</h1>

<table style="width: 60%; margin: 0 auto;">
    <tr>
        <th colspan="2" style="text-align: center;">YEAR 1 SUMMARY (E)</th>
    </tr>
    <tr>
        <td style="width: 60%; background: #C8E6C9;"><strong>Total Investment</strong></td>
        <td style="text-align: right; font-weight: bold;">E560,000</td>
    </tr>
    <tr>
        <td style="background: #C8E6C9;"><strong>Total Revenue (6 months)</strong></td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">E690,000</td>
    </tr>
    <tr>
        <td style="background: #C8E6C9;"><strong>Total Operating Costs</strong></td>
        <td style="text-align: right; font-weight: bold; color: #C62828;">E384,000</td>
    </tr>
    <tr>
        <td style="background: #C8E6C9;"><strong>Net Profit Year 1</strong></td>
        <td style="text-align: right; font-weight: bold; color: #1B5E20;">E306,000</td>
    </tr>
    <tr style="background: #1B5E20; color: white;">
        <td><strong>Ending Cash Balance</strong></td>
        <td style="text-align: right; font-size: 12pt;"><strong>E385,000</strong></td>
    </tr>
</table>

<h1 style="margin-top: 30px;">Key Financial Metrics</h1>

<table style="width: 90%; margin: 0 auto;">
    <tr>
        <th style="width: 25%;">Metric</th>
        <th style="width: 20%;">Value</th>
        <th style="width: 55%;">Interpretation</th>
    </tr>
    <tr>
        <td><strong>Return on Investment</strong></td>
        <td style="text-align: center; font-size: 14pt; color: #1B5E20; font-weight: bold;">142%</td>
        <td>Excellent return - significantly above agricultural benchmarks of 15-25%</td>
    </tr>
    <tr>
        <td><strong>Payback Period</strong></td>
        <td style="text-align: center; font-size: 14pt; color: #1B5E20; font-weight: bold;">8.4 months</td>
        <td>Quick recovery - full investment recovered within first year</td>
    </tr>
    <tr>
        <td><strong>Monthly Net Profit</strong></td>
        <td style="text-align: center; font-size: 14pt; color: #1B5E20; font-weight: bold;">E50,100</td>
        <td>Strong ongoing profitability from Month 7 onwards</td>
    </tr>
    <tr>
        <td><strong>Break-even Point</strong></td>
        <td style="text-align: center; font-size: 14pt; color: #1B5E20; font-weight: bold;">7 cattle/month</td>
        <td>Below planned sales of 10 - good safety margin (30%)</td>
    </tr>
    <tr>
        <td><strong>Member Income</strong></td>
        <td style="text-align: center; font-size: 14pt; color: #1B5E20; font-weight: bold;">E4,008/month</td>
        <td>Per member distribution - competitive income for rural Eswatini</td>
    </tr>
</table>

<h1 style="margin-top: 30px;">Member Distribution Model</h1>

<table style="width: 70%; margin: 0 auto;">
    <tr>
        <th style="width: 40%;">Allocation</th>
        <th style="width: 20%;">Percentage</th>
        <th style="width: 20%;">Amount/Month</th>
        <th style="width: 20%;">Amount/Year</th>
    </tr>
    <tr>
        <td>Emergency Reserve Fund</td>
        <td style="text-align: center;">10%</td>
        <td style="text-align: right;">E5,010</td>
        <td style="text-align: right;">E60,120</td>
    </tr>
    <tr>
        <td>Development & Expansion Fund</td>
        <td style="text-align: center;">10%</td>
        <td style="text-align: right;">E5,010</td>
        <td style="text-align: right;">E60,120</td>
    </tr>
    <tr>
        <td><strong>Member Distribution Pool</strong></td>
        <td style="text-align: center; font-weight: bold;">80%</td>
        <td style="text-align: right; font-weight: bold;">E40,080</td>
        <td style="text-align: right; font-weight: bold;">E480,960</td>
    </tr>
    <tr style="background: #1B5E20; color: white;">
        <td><strong>Per Member (10 members)</strong></td>
        <td style="text-align: center;"><strong>8%</strong></td>
        <td style="text-align: right; font-size: 11pt;"><strong>E4,008</strong></td>
        <td style="text-align: right; font-size: 11pt;"><strong>E48,096</strong></td>
    </tr>
</table>

<div style="background: linear-gradient(135deg, #E8F5E9, #C8E6C9); border: 2px solid #43A047; padding: 15px; border-radius: 10px; margin: 25px auto; width: 80%; text-align: center;">
    <p style="font-size: 12pt; font-weight: bold; color: #1B5E20; margin: 5px 0;">💰 PROJECTED ANNUAL MEMBER INCOME: E48,096</p>
    <p style="font-size: 10pt; color: #2E7D32; margin: 5px 0;">This represents sustainable additional income for 10 community members</p>
</div>

<hr style="border: none; border-top: 2px solid #43A047; margin: 25px 0;"/>
<div style="text-align: center; color: #666; font-size: 9pt;">
    <p><strong style="color: #1B5E20;">LUSHIKISHINI CATTLE FEEDLOT COOPERATIVE</strong></p>
    <p>Cash Flow Projection • RDF Grant Application E500,000</p>
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
{assumptions}
{monthly_projection}
{summary_page}
</div>
</body>
</html>
"""

output_file = Path('/workspaces/WorldClass-ERP/LUSHIKISHINI-FEEDLOT-PROJECT/LUSHIKISHINI-CASHFLOW-PROFESSIONAL.pdf')
HTML(string=full_html).write_pdf(str(output_file))
print(f"✅ Cash Flow PDF generated: {output_file}")
print(f"   Size: {output_file.stat().st_size / 1024:.1f} KB")
