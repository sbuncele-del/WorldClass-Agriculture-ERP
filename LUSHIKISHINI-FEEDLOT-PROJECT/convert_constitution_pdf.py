#!/usr/bin/env python3
"""Convert Lushikishini Constitution to Professional PDF"""

from weasyprint import HTML
from pathlib import Path

css = """
@page { 
    size: A4; 
    margin: 2cm 2.5cm 2.5cm 2.5cm;
    @top-center {
        content: "Lushikishini Cattle Feedlot Cooperative — Constitution";
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

h1 { color: #4A148C; font-size: 18pt; border-bottom: 3px solid #7B1FA2; padding-bottom: 8px; margin-top: 25px; }
h2 { color: #4A148C; font-size: 14pt; margin-top: 20px; }
h3 { color: #7B1FA2; font-size: 12pt; margin-top: 15px; border-left: 4px solid #E1BEE7; padding-left: 10px; }

table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; page-break-inside: avoid; }
th { background: #4A148C; color: white; padding: 10px; text-align: left; }
td { border: 1px solid #ddd; padding: 8px; }
tr:nth-child(even) { background: #F3E5F5; }

ol { margin: 10px 0; padding-left: 25px; }
li { margin-bottom: 6px; }

.content { padding: 0 15px; }
.page-break { page-break-before: always; }
"""

cover_page = """
<div style="width: 210mm; height: 297mm; background: linear-gradient(135deg, #4A148C 0%, #7B1FA2 50%, #9C27B0 100%); color: white; page-break-after: always;">
    <table style="width: 100%; height: 100%; border: 0; border-collapse: collapse;">
        <tr>
            <td style="vertical-align: middle; text-align: center; border: 0; padding: 50px;">
                
                <div style="font-size: 64pt; margin-bottom: 25px;">⚖️</div>
                
                <div style="display: inline-block; padding: 25px 45px; border: 4px solid #E1BEE7; border-radius: 10px; background: rgba(255,255,255,0.08); margin-bottom: 30px;">
                    <div style="font-size: 32pt; font-weight: bold; letter-spacing: 2px;">LUSHIKISHINI</div>
                    <div style="font-size: 13pt; color: #E1BEE7; letter-spacing: 2px; margin-top: 5px;">CATTLE FEEDLOT COOPERATIVE</div>
                </div>
                
                <div style="background: #E1BEE7; color: #4A148C; font-size: 24pt; font-weight: bold; padding: 15px 50px; display: inline-block; border-radius: 5px; letter-spacing: 3px; margin: 30px 0;">
                    CONSTITUTION
                </div>
                
                <div style="margin-top: 40px; padding: 25px; border: 2px solid rgba(255,255,255,0.3); border-radius: 10px; background: rgba(255,255,255,0.05);">
                    <p style="font-size: 12pt; margin: 8px 0; text-align: center;"><strong style="color: #E1BEE7;">Established:</strong> January 2026</p>
                    <p style="font-size: 12pt; margin: 8px 0; text-align: center;"><strong style="color: #E1BEE7;">Members:</strong> 10 Founding Members</p>
                    <p style="font-size: 12pt; margin: 8px 0; text-align: center;"><strong style="color: #E1BEE7;">Location:</strong> Lushikishini, kaMavuso</p>
                    <p style="font-size: 12pt; margin: 8px 0; text-align: center;"><strong style="color: #E1BEE7;">Authority:</strong> Chief Somtsewu, Phondo Inkhundla</p>
                </div>
                
                <div style="margin-top: 50px; font-size: 10pt; opacity: 0.8; letter-spacing: 2px;">
                    COOPERATIVE SOCIETIES ACT, 2003 • KINGDOM OF ESWATINI
                </div>

            </td>
        </tr>
    </table>
</div>
"""

preamble = """
<div class="content">
<h1>Preamble</h1>

<div style="background: linear-gradient(135deg, #F3E5F5, #E1BEE7); border-left: 5px solid #7B1FA2; padding: 20px; border-radius: 0 10px 10px 0; margin: 20px 0;">
    <p style="text-align: justify; margin: 0;">
        We, the undersigned founding members, residents of <strong>Lushikishini, kaMavuso area</strong>, under the jurisdiction of <strong>Phondo Inkhundla</strong> and traditional authority of <strong>Chief Somtsewu</strong>, hereby voluntarily associate ourselves to form a cooperative society for our mutual benefit and economic advancement.
    </p>
    <p style="text-align: justify; margin-top: 15px; margin-bottom: 0;">
        We commit to operate in accordance with the internationally recognized cooperative principles of voluntary membership, democratic control, member economic participation, autonomy, education, cooperation among cooperatives, and concern for community.
    </p>
</div>
"""

article_1 = """
<h1>Article 1: Name, Location & Objectives</h1>

<h2>1.1 Name</h2>
<p>The name of the cooperative shall be <strong>"Lushikishini Cattle Feedlot Cooperative"</strong> (hereinafter referred to as "the Cooperative").</p>

<h2>1.2 Registered Office</h2>
<div style="background: #F3E5F5; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p style="margin: 5px 0;"><strong>Physical Address:</strong></p>
    <p style="margin: 5px 0 5px 20px;">Lushikishini Area, kaMavuso<br/>Phondo Inkhundla<br/>Under Chief Somtsewu<br/>Kingdom of Eswatini</p>
</div>

<h2>1.3 Objectives</h2>
<p>The primary objectives of the Cooperative shall be:</p>
<ol>
    <li>To operate a cattle feedlot enterprise for the economic benefit of members;</li>
    <li>To purchase, fatten, and sell cattle for profit;</li>
    <li>To provide employment and income generation for members;</li>
    <li>To promote sustainable agricultural practices in cattle farming;</li>
    <li>To contribute to food security in the Kingdom of Eswatini;</li>
    <li>To foster cooperation and unity among community members;</li>
    <li>To provide training and skills development in livestock management;</li>
    <li>To serve as a model for community-based agricultural enterprises.</li>
</ol>
"""

article_2 = """
<div class="page-break"></div>
<h1>Article 2: Membership</h1>

<h2>2.1 Founding Members</h2>
<p>The Cooperative is established with <strong>ten (10) founding members</strong> as listed in Schedule A of this Constitution.</p>

<h2>2.2 Eligibility for Membership</h2>
<p>Membership shall be open to any person who:</p>
<ol>
    <li>Is a citizen of the Kingdom of Eswatini or permanent resident;</li>
    <li>Is 18 years of age or older;</li>
    <li>Resides within or has strong ties to the Lushikishini/kaMavuso community;</li>
    <li>Agrees to abide by this Constitution and decisions of the Cooperative;</li>
    <li>Is willing to participate actively in the activities of the Cooperative;</li>
    <li>Is approved by a two-thirds majority vote of existing members.</li>
</ol>

<h2>2.3 Application Process</h2>
<ol>
    <li>Applications for membership shall be submitted in writing to the Executive Committee;</li>
    <li>The Executive Committee shall review applications within 30 days;</li>
    <li>Recommended applications shall be presented to the next General Meeting;</li>
    <li>Membership becomes effective upon payment of the membership fee.</li>
</ol>

<h2>2.4 Membership Fee</h2>
<table>
    <tr>
        <th>Type</th>
        <th>Amount</th>
        <th>Notes</th>
    </tr>
    <tr>
        <td>Joining Fee</td>
        <td><strong>E500</strong></td>
        <td>One-time, non-refundable</td>
    </tr>
    <tr>
        <td>Annual Subscription</td>
        <td><strong>E200</strong></td>
        <td>Due January each year</td>
    </tr>
</table>

<h2>2.5 Termination of Membership</h2>
<p>Membership may be terminated by:</p>
<ol>
    <li>Voluntary resignation with 30 days written notice;</li>
    <li>Death of the member;</li>
    <li>Expulsion by two-thirds majority vote for serious misconduct;</li>
    <li>Non-payment of fees for more than 6 months after due date.</li>
</ol>
"""

article_3 = """
<h1>Article 3: Rights & Duties of Members</h1>

<h2>3.1 Rights of Members</h2>
<p>Every member in good standing shall have the right to:</p>
<ol>
    <li>Attend and participate in all General Meetings;</li>
    <li>Vote on all matters brought before the membership (one member, one vote);</li>
    <li>Stand for election to the Executive Committee;</li>
    <li>Receive a share of the annual surplus according to Article 7;</li>
    <li>Access to financial records and reports of the Cooperative;</li>
    <li>Participate in training and capacity building activities;</li>
    <li>Submit proposals for consideration by the Cooperative.</li>
</ol>

<h2>3.2 Duties of Members</h2>
<p>Every member shall be obligated to:</p>
<ol>
    <li>Abide by this Constitution and all lawful decisions of the Cooperative;</li>
    <li>Pay all fees, levies, and contributions as determined by the Cooperative;</li>
    <li>Participate actively in meetings and activities of the Cooperative;</li>
    <li>Contribute labor as required according to the work schedule;</li>
    <li>Protect the property and interests of the Cooperative;</li>
    <li>Act in good faith and in the best interests of the Cooperative;</li>
    <li>Not engage in activities that compete with or harm the Cooperative.</li>
</ol>

<div style="background: #FFF3E0; border-left: 5px solid #FF9800; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
    <strong>⚠️ Important:</strong> Members who fail to fulfill their duties may face disciplinary action as outlined in Article 8.
</div>
"""

article_4 = """
<div class="page-break"></div>
<h1>Article 4: Governance Structure</h1>

<h2>4.1 General Meeting</h2>
<p>The General Meeting is the <strong>supreme governing body</strong> of the Cooperative, comprising all members in good standing.</p>

<h2>4.2 Executive Committee</h2>
<p>The Executive Committee shall consist of:</p>

<table>
    <tr>
        <th>Position</th>
        <th>Current Holder</th>
        <th>Key Responsibilities</th>
    </tr>
    <tr>
        <td><strong>Chairperson</strong></td>
        <td>Sibusiso Mavuso</td>
        <td>Overall leadership, chair meetings, external representation</td>
    </tr>
    <tr>
        <td><strong>Vice-Chairperson</strong></td>
        <td>Seluleko Ndwandwe</td>
        <td>Deputize for Chairperson, operations oversight</td>
    </tr>
    <tr>
        <td><strong>Secretary</strong></td>
        <td>Zakhele Dlamini</td>
        <td>Records, correspondence, meeting minutes</td>
    </tr>
    <tr>
        <td><strong>Treasurer</strong></td>
        <td>Sibusiso Mavuso</td>
        <td>Financial management, accounting, reporting</td>
    </tr>
    <tr>
        <td><strong>Technical Advisor</strong></td>
        <td>Sanele Dlamini</td>
        <td>Agricultural expertise, feed management, animal health</td>
    </tr>
</table>

<h2>4.3 Term of Office</h2>
<ol>
    <li>Executive Committee members serve for <strong>two (2) years</strong>;</li>
    <li>Members may be re-elected for a maximum of <strong>two consecutive terms</strong>;</li>
    <li>Elections shall be held at the Annual General Meeting;</li>
    <li>Vacancies may be filled at any Special General Meeting.</li>
</ol>
"""

article_5_6 = """
<h1>Article 5: Meetings</h1>

<h2>5.1 Annual General Meeting (AGM)</h2>
<ol>
    <li>Shall be held once per year, not later than <strong>March 31</strong>;</li>
    <li>Members shall receive at least <strong>14 days written notice</strong>;</li>
    <li>Agenda shall include: Annual report, audited accounts, elections, annual plan.</li>
</ol>

<h2>5.2 Ordinary General Meetings</h2>
<ol>
    <li>Shall be held at least <strong>once per month</strong>;</li>
    <li>Notice of at least <strong>7 days</strong> shall be given;</li>
    <li>Shall review operations, finances, and make operational decisions.</li>
</ol>

<h2>5.3 Quorum and Voting</h2>
<table>
    <tr>
        <th>Meeting Type</th>
        <th>Quorum Required</th>
        <th>Voting Threshold</th>
    </tr>
    <tr>
        <td>General Meetings</td>
        <td>50% + 1 members</td>
        <td>Simple majority (50% + 1)</td>
    </tr>
    <tr>
        <td>Constitutional Amendments</td>
        <td>Two-thirds members</td>
        <td>Two-thirds majority</td>
    </tr>
    <tr>
        <td>Expulsion of Member</td>
        <td>Two-thirds members</td>
        <td>Two-thirds majority</td>
    </tr>
    <tr>
        <td>Dissolution</td>
        <td>All members</td>
        <td>Three-quarters majority</td>
    </tr>
</table>

<h1>Article 6: Financial Provisions</h1>

<h2>6.1 Financial Year</h2>
<p>The financial year shall run from <strong>1 April to 31 March</strong>.</p>

<h2>6.2 Bank Account</h2>
<ol>
    <li>The Cooperative shall maintain a bank account at a registered financial institution;</li>
    <li>All transactions require <strong>two signatories</strong>: Chairperson AND Treasurer;</li>
    <li>Monthly bank reconciliation shall be performed and reported to members.</li>
</ol>
"""

article_7 = """
<div class="page-break"></div>
<h1>Article 7: Distribution of Surplus</h1>

<h2>7.1 Surplus Allocation</h2>
<p>The annual surplus (net profit) shall be distributed as follows:</p>

<table>
    <tr>
        <th>Allocation</th>
        <th>Percentage</th>
        <th>Purpose</th>
    </tr>
    <tr>
        <td><strong>Emergency Reserve</strong></td>
        <td>10%</td>
        <td>Unforeseen expenses, disease outbreaks, emergencies</td>
    </tr>
    <tr>
        <td><strong>Development Fund</strong></td>
        <td>10%</td>
        <td>Expansion, infrastructure, equipment replacement</td>
    </tr>
    <tr>
        <td><strong>Member Distribution</strong></td>
        <td>80%</td>
        <td>Equal distribution to all members in good standing</td>
    </tr>
</table>

<div style="background: linear-gradient(135deg, #F3E5F5, #E1BEE7); border: 2px solid #7B1FA2; padding: 20px; border-radius: 10px; margin: 20px 0;">
    <h3 style="margin-top: 0; border: none; padding: 0; text-align: center;">7.2 Equal Distribution Principle</h3>
    <p style="text-align: center;">With 10 members, each member receives <strong>10% of the distributable surplus</strong> (8% of total surplus).</p>
    <p style="text-align: center; margin-bottom: 0;"><strong>Example:</strong> If monthly profit is E50,100:<br/>
    Emergency Reserve: E5,010 | Development Fund: E5,010 | Member Distribution: E40,080 (<strong>E4,008 per member</strong>)</p>
</div>

<h2>7.3 Distribution Schedule</h2>
<ol>
    <li>Monthly distributions may be made from operating profits;</li>
    <li>Final annual distribution after year-end accounts are prepared;</li>
    <li>New members receive distribution from their second month of membership.</li>
</ol>
"""

article_8_9_10 = """
<h1>Article 8: Discipline & Dispute Resolution</h1>

<h2>8.1 Disciplinary Offenses</h2>
<ol>
    <li>Theft or misappropriation of Cooperative funds or property;</li>
    <li>Willful damage to Cooperative property;</li>
    <li>Failure to perform assigned duties without reasonable cause;</li>
    <li>Bringing the Cooperative into disrepute;</li>
    <li>Persistent failure to attend meetings without apology;</li>
    <li>Engaging in competing business activities.</li>
</ol>

<h2>8.2 Disciplinary Procedure</h2>
<ol>
    <li><strong>Written Warning:</strong> First offense (minor matters)</li>
    <li><strong>Final Warning:</strong> Second offense or first serious offense</li>
    <li><strong>Suspension:</strong> Up to 3 months, with loss of distribution</li>
    <li><strong>Expulsion:</strong> Serious misconduct, requires 2/3 majority vote</li>
</ol>

<h1>Article 9: Amendment of Constitution</h1>
<ol>
    <li>This Constitution may only be amended at a General Meeting;</li>
    <li>Proposed amendments must be circulated <strong>21 days</strong> before the meeting;</li>
    <li>Amendments require <strong>two-thirds majority</strong> of members present;</li>
    <li>Amendments take effect upon registration with relevant authorities.</li>
</ol>

<h1>Article 10: Dissolution</h1>
<ol>
    <li>The Cooperative may only be dissolved by a <strong>three-quarters majority</strong> of all members;</li>
    <li>Upon dissolution, assets shall be liquidated;</li>
    <li>Proceeds shall first settle all liabilities;</li>
    <li>Remaining assets distributed equally among members;</li>
    <li>The Registrar of Cooperatives shall be notified.</li>
</ol>
"""

schedule_a = """
<div class="page-break"></div>
<h1>Schedule A: Founding Members</h1>

<p style="text-align: center; font-style: italic; margin-bottom: 20px;">
    The following ten (10) persons are recognized as the Founding Members of the Lushikishini Cattle Feedlot Cooperative:
</p>

<table>
    <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 25%;">Full Name</th>
        <th style="width: 25%;">Role</th>
        <th style="width: 25%;">ID Number</th>
        <th style="width: 20%;">Signature</th>
    </tr>
    <tr>
        <td>1</td>
        <td><strong>Sibusiso Mavuso</strong></td>
        <td>Chairperson & Treasurer</td>
        <td style="border-bottom: 1px solid #999;">_____________</td>
        <td style="border-bottom: 1px solid #999;"></td>
    </tr>
    <tr>
        <td>2</td>
        <td><strong>Sanele Dlamini</strong></td>
        <td>Technical Advisor</td>
        <td style="border-bottom: 1px solid #999;">_____________</td>
        <td style="border-bottom: 1px solid #999;"></td>
    </tr>
    <tr>
        <td>3</td>
        <td><strong>Zakhele Dlamini</strong></td>
        <td>Secretary</td>
        <td style="border-bottom: 1px solid #999;">_____________</td>
        <td style="border-bottom: 1px solid #999;"></td>
    </tr>
    <tr>
        <td>4</td>
        <td><strong>Seluleko Ndwandwe</strong></td>
        <td>Vice-Chairperson</td>
        <td style="border-bottom: 1px solid #999;">_____________</td>
        <td style="border-bottom: 1px solid #999;"></td>
    </tr>
    <tr>
        <td>5</td>
        <td><strong>Sibusiso Dlamini</strong></td>
        <td>Member</td>
        <td style="border-bottom: 1px solid #999;">_____________</td>
        <td style="border-bottom: 1px solid #999;"></td>
    </tr>
    <tr>
        <td>6</td>
        <td><strong>Temancele Mavuso</strong></td>
        <td>Member</td>
        <td style="border-bottom: 1px solid #999;">_____________</td>
        <td style="border-bottom: 1px solid #999;"></td>
    </tr>
    <tr>
        <td>7</td>
        <td><strong>Gugu Vilakati</strong></td>
        <td>Member</td>
        <td style="border-bottom: 1px solid #999;">_____________</td>
        <td style="border-bottom: 1px solid #999;"></td>
    </tr>
    <tr>
        <td>8</td>
        <td><strong>Vuyo Motsa</strong></td>
        <td>Member</td>
        <td style="border-bottom: 1px solid #999;">_____________</td>
        <td style="border-bottom: 1px solid #999;"></td>
    </tr>
    <tr>
        <td>9</td>
        <td><strong>Neliso Mavuso</strong></td>
        <td>Member</td>
        <td style="border-bottom: 1px solid #999;">_____________</td>
        <td style="border-bottom: 1px solid #999;"></td>
    </tr>
    <tr>
        <td>10</td>
        <td><strong>Sphumelele Shabangu</strong></td>
        <td>Member</td>
        <td style="border-bottom: 1px solid #999;">_____________</td>
        <td style="border-bottom: 1px solid #999;"></td>
    </tr>
</table>
"""

schedule_b = """
<h1>Schedule B: Adoption & Certification</h1>

<div style="background: linear-gradient(135deg, #F3E5F5, #E1BEE7); border: 2px solid #7B1FA2; padding: 25px; border-radius: 10px; margin: 25px 0;">
    <p style="text-align: center; font-size: 14pt; font-weight: bold; color: #4A148C; margin-bottom: 15px;">CERTIFICATE OF ADOPTION</p>
    <p style="text-align: justify;">
        We, the undersigned founding members of the Lushikishini Cattle Feedlot Cooperative, do hereby certify that this Constitution was duly adopted at a meeting of the founding members held at Lushikishini, kaMavuso, on this day.
    </p>
</div>

<h2>Executive Committee Signatures</h2>

<table style="border: none;">
    <tr>
        <td style="width: 50%; border: none; padding: 20px;">
            <p><strong>Chairperson:</strong> Sibusiso Mavuso</p>
            <div style="border-bottom: 2px solid #333; height: 50px; margin: 20px 0;"></div>
            <p style="font-size: 9pt; color: #666;">Signature & Date</p>
        </td>
        <td style="width: 50%; border: none; padding: 20px;">
            <p><strong>Secretary:</strong> Zakhele Dlamini</p>
            <div style="border-bottom: 2px solid #333; height: 50px; margin: 20px 0;"></div>
            <p style="font-size: 9pt; color: #666;">Signature & Date</p>
        </td>
    </tr>
</table>

<p style="text-align: center; margin: 30px 0;">
    <strong>Date of Adoption:</strong> _______ day of _________________ 2026
</p>

<h2>Traditional Authority Endorsement</h2>

<div style="background: #F5F5F5; border: 2px solid #7B1FA2; padding: 25px; border-radius: 10px; margin: 20px 0;">
    <p><strong>Witnessed and Endorsed by the Office of Chief Somtsewu:</strong></p>
    <table style="border: none; width: 100%; margin-top: 20px;">
        <tr>
            <td style="width: 50%; border: none; padding: 10px;">
                <p>Chief's Signature/Stamp:</p>
                <div style="border: 2px dashed #7B1FA2; height: 80px; margin: 15px 0; border-radius: 5px;"></div>
            </td>
            <td style="width: 50%; border: none; padding: 10px;">
                <p>Witness Name & Signature:</p>
                <div style="border-bottom: 2px solid #333; height: 40px; margin: 15px 0;"></div>
                <div style="border-bottom: 2px solid #333; height: 40px; margin: 15px 0;"></div>
            </td>
        </tr>
    </table>
    <p>Date: _______________________________</p>
</div>

<hr style="border: none; border-top: 3px solid #7B1FA2; margin: 40px 0;"/>

<div style="text-align: center; color: #666;">
    <p><strong style="color: #4A148C;">LUSHIKISHINI CATTLE FEEDLOT COOPERATIVE</strong></p>
    <p>Constitution Adopted January 2026</p>
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
{preamble}
{article_1}
{article_2}
{article_3}
{article_4}
{article_5_6}
{article_7}
{article_8_9_10}
{schedule_a}
{schedule_b}
</div>
</body>
</html>
"""

output_file = Path('/workspaces/WorldClass-ERP/LUSHIKISHINI-FEEDLOT-PROJECT/LUSHIKISHINI-CONSTITUTION-PROFESSIONAL.pdf')
HTML(string=full_html).write_pdf(str(output_file))
print(f"✅ Constitution PDF generated: {output_file}")
print(f"   Size: {output_file.stat().st_size / 1024:.1f} KB")
