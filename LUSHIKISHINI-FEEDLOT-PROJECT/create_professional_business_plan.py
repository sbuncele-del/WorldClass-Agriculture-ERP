#!/usr/bin/env python3
"""
Professional Business Plan PDF Generator
Lushikishini Cattle Feedlot Cooperative
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT

# Colors
DARK_GREEN = HexColor('#1B5E20')
MEDIUM_GREEN = HexColor('#2E7D32')
LIGHT_GREEN = HexColor('#4CAF50')
ACCENT_GREEN = HexColor('#81C784')
GOLD = HexColor('#FFD700')
DARK_GOLD = HexColor('#FFC107')
LIGHT_BG = HexColor('#E8F5E9')
DARK_TEXT = HexColor('#212121')
GRAY_TEXT = HexColor('#616161')

WIDTH, HEIGHT = A4

def draw_cover_page(c):
    """Draw a professional cover page"""
    # Full page green gradient background
    c.setFillColor(DARK_GREEN)
    c.rect(0, 0, WIDTH, HEIGHT, fill=True, stroke=False)
    
    # Lighter green overlay at top
    c.setFillColor(MEDIUM_GREEN)
    c.rect(0, HEIGHT * 0.4, WIDTH, HEIGHT * 0.6, fill=True, stroke=False)
    
    # Decorative diagonal stripe
    c.setFillColor(LIGHT_GREEN)
    c.setStrokeColor(LIGHT_GREEN)
    path = c.beginPath()
    path.moveTo(0, HEIGHT * 0.35)
    path.lineTo(WIDTH, HEIGHT * 0.45)
    path.lineTo(WIDTH, HEIGHT * 0.42)
    path.lineTo(0, HEIGHT * 0.32)
    path.close()
    c.drawPath(path, fill=True, stroke=False)
    
    # Cow icon (simple representation)
    icon_y = HEIGHT - 4*cm
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 60)
    c.drawCentredString(WIDTH/2, icon_y, "🐄")
    
    # Main Title - LUSHIKISHINI
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 48)
    c.drawCentredString(WIDTH/2, HEIGHT - 7*cm, "LUSHIKISHINI")
    
    # Subtitle - Cattle Feedlot Cooperative
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(WIDTH/2, HEIGHT - 8.5*cm, "Cattle Feedlot Cooperative")
    
    # Decorative line
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.line(WIDTH/2 - 4*cm, HEIGHT - 10*cm, WIDTH/2 + 4*cm, HEIGHT - 10*cm)
    
    # Document Type
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(WIDTH/2, HEIGHT - 11.5*cm, "BUSINESS PLAN")
    
    # Amount Box
    c.setFillColor(GOLD)
    c.roundRect(WIDTH/2 - 5*cm, HEIGHT - 15*cm, 10*cm, 2.5*cm, 10, fill=True, stroke=False)
    c.setFillColor(DARK_GREEN)
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(WIDTH/2, HEIGHT - 14*cm, "E500,000")
    
    # Subtitle under amount
    c.setFillColor(white)
    c.setFont("Helvetica", 14)
    c.drawCentredString(WIDTH/2, HEIGHT - 16.5*cm, "Regional Development Fund Grant Application")
    
    # Info Box at bottom
    box_y = 3*cm
    box_height = 5*cm
    c.setFillColor(HexColor('#1A4D1A'))
    c.roundRect(2*cm, box_y, WIDTH - 4*cm, box_height, 10, fill=True, stroke=False)
    
    # Info text
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(3*cm, box_y + 4*cm, "Location:")
    c.drawString(3*cm, box_y + 3*cm, "Traditional Authority:")
    c.drawString(3*cm, box_y + 2*cm, "Members:")
    c.drawString(3*cm, box_y + 1*cm, "Date:")
    
    c.setFillColor(white)
    c.setFont("Helvetica", 10)
    c.drawString(8.5*cm, box_y + 4*cm, "Lushikishini, kaMavuso, Phondo Inkhundla")
    c.drawString(8.5*cm, box_y + 3*cm, "Chief Somtsewu")
    c.drawString(8.5*cm, box_y + 2*cm, "10 Community Members")
    c.drawString(8.5*cm, box_y + 1*cm, "January 2026")
    
    # Footer
    c.setFillColor(HexColor('#AAAAAA'))
    c.setFont("Helvetica", 9)
    c.drawCentredString(WIDTH/2, 1.5*cm, "Kingdom of Eswatini")

def draw_header(c, page_num, title="Business Plan"):
    """Draw page header"""
    c.setFillColor(DARK_GREEN)
    c.rect(0, HEIGHT - 1.5*cm, WIDTH, 1.5*cm, fill=True, stroke=False)
    
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, HEIGHT - 1*cm, "Lushikishini Cattle Feedlot Cooperative")
    
    c.setFont("Helvetica", 10)
    c.drawRightString(WIDTH - 2*cm, HEIGHT - 1*cm, title)
    
    # Page number footer
    c.setFillColor(GRAY_TEXT)
    c.setFont("Helvetica", 9)
    c.drawCentredString(WIDTH/2, 1*cm, f"Page {page_num}")

def draw_section_title(c, y, title):
    """Draw a section title with green background"""
    c.setFillColor(DARK_GREEN)
    c.roundRect(2*cm, y - 0.3*cm, WIDTH - 4*cm, 1*cm, 5, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(2.5*cm, y, title)
    return y - 1.5*cm

def draw_subsection_title(c, y, title):
    """Draw a subsection title"""
    c.setFillColor(MEDIUM_GREEN)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(2*cm, y, title)
    c.setStrokeColor(LIGHT_GREEN)
    c.setLineWidth(2)
    c.line(2*cm, y - 0.2*cm, 8*cm, y - 0.2*cm)
    return y - 0.8*cm

def draw_text(c, y, text, indent=2*cm):
    """Draw paragraph text"""
    c.setFillColor(DARK_TEXT)
    c.setFont("Helvetica", 10)
    
    # Simple word wrap
    words = text.split()
    lines = []
    current_line = ""
    max_width = WIDTH - 4*cm
    
    for word in words:
        test_line = current_line + " " + word if current_line else word
        if c.stringWidth(test_line, "Helvetica", 10) < max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    
    for line in lines:
        c.drawString(indent, y, line)
        y -= 0.5*cm
    
    return y - 0.3*cm

def draw_bullet(c, y, text, indent=2.5*cm):
    """Draw a bullet point"""
    c.setFillColor(MEDIUM_GREEN)
    c.circle(indent - 0.3*cm, y + 0.1*cm, 0.1*cm, fill=True)
    c.setFillColor(DARK_TEXT)
    c.setFont("Helvetica", 10)
    c.drawString(indent, y, text)
    return y - 0.6*cm

def draw_info_box(c, y, items, box_color=LIGHT_BG):
    """Draw an info box with key-value pairs"""
    box_height = len(items) * 0.7*cm + 0.5*cm
    c.setFillColor(box_color)
    c.roundRect(2*cm, y - box_height + 0.3*cm, WIDTH - 4*cm, box_height, 5, fill=True, stroke=False)
    
    c.setStrokeColor(MEDIUM_GREEN)
    c.setLineWidth(2)
    c.line(2*cm, y - box_height + 0.3*cm, 2*cm, y + 0.3*cm)
    
    for label, value in items:
        c.setFillColor(MEDIUM_GREEN)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(2.5*cm, y, f"{label}:")
        c.setFillColor(DARK_TEXT)
        c.setFont("Helvetica", 10)
        c.drawString(7.5*cm, y, value)  # Moved value further right for proper spacing
        y -= 0.7*cm
    
    return y - 0.5*cm

def draw_stat_cards(c, y, stats):
    """Draw statistics cards"""
    card_width = (WIDTH - 5*cm) / len(stats)
    x = 2*cm
    
    for icon, value, label in stats:
        # Card background
        c.setFillColor(white)
        c.roundRect(x, y - 2*cm, card_width - 0.5*cm, 2.5*cm, 8, fill=True, stroke=False)
        
        # Border
        c.setStrokeColor(MEDIUM_GREEN)
        c.setLineWidth(2)
        c.roundRect(x, y - 2*cm, card_width - 0.5*cm, 2.5*cm, 8, fill=False, stroke=True)
        
        # Top accent
        c.setFillColor(MEDIUM_GREEN)
        c.rect(x, y + 0.2*cm, card_width - 0.5*cm, 0.3*cm, fill=True, stroke=False)
        
        # Value
        c.setFillColor(DARK_GREEN)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(x + (card_width - 0.5*cm)/2, y - 0.5*cm, value)
        
        # Label
        c.setFillColor(GRAY_TEXT)
        c.setFont("Helvetica", 8)
        c.drawCentredString(x + (card_width - 0.5*cm)/2, y - 1.3*cm, label)
        
        x += card_width
    
    return y - 3*cm

def draw_table(c, y, headers, data, col_widths=None):
    """Draw a professional table"""
    if col_widths is None:
        col_widths = [(WIDTH - 4*cm) / len(headers)] * len(headers)
    
    row_height = 0.7*cm
    x = 2*cm
    
    # Header row
    c.setFillColor(DARK_GREEN)
    c.rect(x, y - row_height, sum(col_widths), row_height, fill=True, stroke=False)
    
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    curr_x = x
    for i, header in enumerate(headers):
        c.drawString(curr_x + 0.2*cm, y - row_height + 0.25*cm, header)
        curr_x += col_widths[i]
    
    y -= row_height
    
    # Data rows
    for row_idx, row in enumerate(data):
        bg_color = HexColor('#F5F5F5') if row_idx % 2 == 0 else white
        
        # Check if it's a total row
        is_total = row_idx == len(data) - 1 and any('TOTAL' in str(cell).upper() for cell in row)
        if is_total:
            bg_color = LIGHT_BG
        
        c.setFillColor(bg_color)
        c.rect(x, y - row_height, sum(col_widths), row_height, fill=True, stroke=False)
        
        c.setFillColor(DARK_TEXT)
        c.setFont("Helvetica-Bold" if is_total else "Helvetica", 9)
        
        curr_x = x
        for i, cell in enumerate(row):
            c.drawString(curr_x + 0.2*cm, y - row_height + 0.25*cm, str(cell))
            curr_x += col_widths[i]
        
        # Row border
        c.setStrokeColor(HexColor('#E0E0E0'))
        c.setLineWidth(0.5)
        c.line(x, y - row_height, x + sum(col_widths), y - row_height)
        
        y -= row_height
    
    # Table border
    c.setStrokeColor(DARK_GREEN)
    c.setLineWidth(1)
    total_height = row_height * (len(data) + 1)
    c.rect(x, y, sum(col_widths), total_height, fill=False, stroke=True)
    
    return y - 0.5*cm

def draw_highlight_box(c, y, title, content, bg_color=GOLD):
    """Draw a highlighted information box"""
    box_height = 2*cm
    c.setFillColor(bg_color)
    c.roundRect(2*cm, y - box_height, WIDTH - 4*cm, box_height, 8, fill=True, stroke=False)
    
    c.setFillColor(DARK_GREEN)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(WIDTH/2, y - 0.6*cm, title)
    
    c.setFont("Helvetica", 10)
    c.drawCentredString(WIDTH/2, y - 1.3*cm, content)
    
    return y - box_height - 0.5*cm

def create_business_plan():
    """Create the complete business plan PDF"""
    c = canvas.Canvas("LUSHIKISHINI-BUSINESS-PLAN-FINAL.pdf", pagesize=A4)
    
    # Page 1: Cover
    draw_cover_page(c)
    c.showPage()
    
    # Page 2: Executive Summary
    draw_header(c, 2, "Executive Summary")
    y = HEIGHT - 3*cm
    
    y = draw_section_title(c, y, "EXECUTIVE SUMMARY")
    
    y = draw_text(c, y, "The Lushikishini Cattle Feedlot Cooperative is a community-driven agricultural initiative established by 10 members from Lushikishini, kaMavuso. We seek E500,000 from the Regional Development Fund to establish a sustainable cattle feedlot operation that will transform the economic prospects of our community.")
    
    y -= 0.5*cm
    stats = [
        ("💰", "E500,000", "Grant Requested"),
        ("🤝", "E60,000", "Own Contribution"),
        ("👥", "10", "Members"),
        ("🐄", "40", "Cattle Capacity"),
    ]
    y = draw_stat_cards(c, y, stats)
    
    y = draw_subsection_title(c, y, "Project Highlights")
    
    bullets = [
        "Strong Team: 10 committed members including qualified agronomist, accountant, and experienced cattle handlers",
        "Proven Concept: Feedlot farming is established and profitable across Southern Africa",
        "Demonstrated Commitment: E60,000 own contribution (4 cattle + existing kraal + labour)",
        "Market Access: Established relationships with abattoir buyers who collect from farm",
        "Community Support: Operating on communal land approved by Chief Somtsewu",
    ]
    for bullet in bullets:
        y = draw_bullet(c, y, bullet)
    
    y -= 0.5*cm
    y = draw_highlight_box(c, y, "EXPECTED MONTHLY PROFIT: E50,100", "E4,008 per member per month • E48,096 per member annually")
    
    y -= 0.3*cm
    stats2 = [
        ("📈", "107%", "Annual ROI"),
        ("⏱️", "11 mo", "Payback"),
        ("📊", "6 cattle", "Break-even"),
    ]
    y = draw_stat_cards(c, y, stats2)
    
    c.showPage()
    
    # Page 3: Project Description
    draw_header(c, 3, "Project Description")
    y = HEIGHT - 3*cm
    
    y = draw_section_title(c, y, "PROJECT DESCRIPTION")
    
    y = draw_subsection_title(c, y, "What We Do")
    y = draw_text(c, y, "The project operates a cattle feedlot business using a batch feeding and rotational sales model:")
    
    steps = [
        ("Step 1: Purchase", "Buy weaner calves (180-220 kg) at market prices (~E6,500 each)"),
        ("Step 2: Feed", "Intensive feeding for 90-120 days using crop residues and supplements"),
        ("Step 3: Sell", "Sell finished cattle (380-450 kg) to abattoirs at ~E14,000 each"),
        ("Step 4: Repeat", "Continue cycle with new batch - selling 10 cattle every month"),
    ]
    
    for step_title, step_desc in steps:
        c.setFillColor(LIGHT_BG)
        c.roundRect(2*cm, y - 1.2*cm, WIDTH - 4*cm, 1.4*cm, 5, fill=True, stroke=False)
        c.setFillColor(DARK_GREEN)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(2.3*cm, y - 0.4*cm, step_title)
        c.setFillColor(DARK_TEXT)
        c.setFont("Helvetica", 9)
        c.drawString(2.3*cm, y - 0.9*cm, step_desc)
        y -= 1.6*cm
    
    y -= 0.5*cm
    y = draw_subsection_title(c, y, "Infrastructure Plan")
    
    headers = ["Infrastructure", "Details", "Cost"]
    data = [
        ["Feedlot 1 (existing)", "Already built - own contribution", "E10,000 (own)"],
        ["Feedlots 2, 3 & 4", "3 new units @ E35,000 each", "E105,000"],
        ["Feeding troughs", "12 units @ E2,000 each", "E24,000"],
        ["Water system", "Tanks, pipes, drinking troughs", "E25,000"],
        ["Handling crush", "For treatment & weighing", "E15,000"],
        ["Feed storage shed", "Secure storage facility", "E20,000"],
        ["TOTAL INFRASTRUCTURE", "", "E199,000"],
    ]
    y = draw_table(c, y, headers, data, [4*cm, 6.5*cm, 4.5*cm])
    
    c.showPage()
    
    # Page 4: Team
    draw_header(c, 4, "Our Team")
    y = HEIGHT - 3*cm
    
    y = draw_section_title(c, y, "OUR TEAM")
    
    y = draw_text(c, y, "The cooperative brings together 10 dedicated members from the Lushikishini community, combining professional expertise with hands-on cattle farming experience.")
    
    y = draw_subsection_title(c, y, "Leadership Team")
    
    leaders = [
        ("Sibusiso Mavuso", "Chairperson & Project Leader", "Qualified Accountant • Overall leadership and financial oversight"),
        ("Sibusiso Dlamini", "Technical Director", "Technical expertise • Equipment and infrastructure management"),
        ("Seluleko Ndwandwe", "Operations Manager", "Experienced cattle handler • Daily operations management"),
        ("Sanele Dlamini", "Technical Advisor (Agronomy)", "BSc Agriculture (UNESWA) • Feed formulation and animal nutrition"),
        ("Zakhele Dlamini", "Secretary & Environmental", "Qualified Environmentalist • Records and sustainable practices"),
    ]
    
    for name, role, desc in leaders:
        c.setFillColor(white)
        c.roundRect(2*cm, y - 1.8*cm, WIDTH - 4*cm, 2*cm, 5, fill=True, stroke=False)
        c.setStrokeColor(MEDIUM_GREEN)
        c.setLineWidth(2)
        c.line(2*cm, y - 1.8*cm, 2*cm, y + 0.2*cm)
        
        c.setFillColor(DARK_GREEN)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(2.5*cm, y - 0.3*cm, name)
        
        c.setFillColor(MEDIUM_GREEN)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(2.5*cm, y - 0.9*cm, role)
        
        c.setFillColor(GRAY_TEXT)
        c.setFont("Helvetica", 8)
        c.drawString(2.5*cm, y - 1.4*cm, desc)
        
        y -= 2.3*cm
    
    y -= 0.5*cm
    y = draw_subsection_title(c, y, "All Members")
    
    headers = ["#", "Name", "Role"]
    data = [
        ["1", "Sibusiso Mavuso", "Chairperson / Project Leader"],
        ["2", "Sibusiso Dlamini", "Technical Director"],
        ["3", "Seluleko Ndwandwe", "Operations Manager"],
        ["4", "Sanele Dlamini", "Technical Advisor (Agronomy)"],
        ["5", "Zakhele Dlamini", "Secretary"],
        ["6", "Temancele Mavuso", "Member / Worker"],
        ["7", "Gugu Vilakati", "Member / Worker"],
        ["8", "Vuyo Motsa", "Member / Worker"],
        ["9", "Neliso Mavuso", "Member / Worker"],
        ["10", "Sphumelele Shabangu", "Member / Worker"],
    ]
    y = draw_table(c, y, headers, data, [1.5*cm, 6*cm, 6*cm])
    
    c.showPage()
    
    # Page 5: Financial Projections
    draw_header(c, 5, "Financial Projections")
    y = HEIGHT - 3*cm
    
    y = draw_section_title(c, y, "FINANCIAL PROJECTIONS")
    
    y = draw_subsection_title(c, y, "Capital Requirements")
    
    headers = ["Item", "Amount"]
    data = [
        ["A. INFRASTRUCTURE", ""],
        ["   Feedlot construction (3 units @ E35,000)", "E105,000"],
        ["   Feeding troughs (12 units @ E2,000)", "E24,000"],
        ["   Water system (tanks, pipes, troughs)", "E25,000"],
        ["   Handling crush", "E15,000"],
        ["   Feed storage shed", "E20,000"],
        ["   Subtotal Infrastructure", "E189,000"],
        ["B. LIVESTOCK", ""],
        ["   36 Weaner cattle @ E6,500 each", "E234,000"],
        ["C. OPERATING CAPITAL", ""],
        ["   Feed (3 months @ E19,000/month)", "E57,000"],
        ["   Veterinary supplies", "E10,000"],
        ["   Transport & miscellaneous", "E10,000"],
        ["   Subtotal Operating", "E77,000"],
        ["TOTAL GRANT REQUESTED", "E500,000"],
    ]
    y = draw_table(c, y, headers, data, [10*cm, 5*cm])
    
    y -= 0.5*cm
    y = draw_subsection_title(c, y, "Funding Summary")
    
    headers = ["Source", "Amount", "Percentage"]
    data = [
        ["RDF Grant Requested", "E500,000", "89.1%"],
        ["Own Contribution", "E60,000", "10.9%"],
        ["TOTAL PROJECT", "E560,000", "100%"],
    ]
    y = draw_table(c, y, headers, data, [6*cm, 4.5*cm, 4.5*cm])
    
    c.showPage()
    
    # Page 6: Monthly Revenue
    draw_header(c, 6, "Revenue & Profit")
    y = HEIGHT - 3*cm
    
    y = draw_section_title(c, y, "MONTHLY REVENUE (At Full Operation)")
    
    y = draw_subsection_title(c, y, "Income")
    headers = ["Description", "Amount"]
    data = [
        ["Sale of 10 finished cattle @ E14,000", "E140,000"],
    ]
    y = draw_table(c, y, headers, data, [10*cm, 5*cm])
    
    y = draw_subsection_title(c, y, "Expenses")
    data = [
        ["Replacement weaners (10 @ E6,500)", "E65,000"],
        ["Feed costs", "E18,900"],
        ["Veterinary & medicine", "E2,000"],
        ["Utilities & transport", "E4,000"],
        ["TOTAL EXPENSES", "E89,900"],
    ]
    y = draw_table(c, y, headers, data, [10*cm, 5*cm])
    
    y -= 0.5*cm
    # Big profit highlight
    c.setFillColor(DARK_GREEN)
    c.roundRect(2*cm, y - 3*cm, WIDTH - 4*cm, 3.5*cm, 10, fill=True, stroke=False)
    
    c.setFillColor(white)
    c.setFont("Helvetica", 12)
    c.drawCentredString(WIDTH/2, y - 0.5*cm, "MONTHLY NET PROFIT")
    
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(WIDTH/2, y - 1.5*cm, "E50,100")
    
    c.setFillColor(white)
    c.setFont("Helvetica", 10)
    c.drawCentredString(WIDTH/2, y - 2.3*cm, "After 20% reserves → E40,080 distributed to members")
    c.drawCentredString(WIDTH/2, y - 2.7*cm, "E4,008 per member per month")
    
    y -= 4*cm
    
    # Key indicators
    y = draw_subsection_title(c, y, "Key Financial Indicators")
    stats = [
        ("📈", "107%", "Annual ROI"),
        ("⏱️", "11 mo", "Payback"),
        ("📊", "6 cattle", "Break-even"),
        ("🛡️", "40%", "Safety Margin"),
    ]
    y = draw_stat_cards(c, y, stats)
    
    c.showPage()
    
    # Page 7: 5-Year Projection
    draw_header(c, 7, "5-Year Projection")
    y = HEIGHT - 3*cm
    
    y = draw_section_title(c, y, "5-YEAR FINANCIAL PROJECTION")
    
    headers = ["Year", "Revenue", "Costs", "Profit", "Per Member*"]
    data = [
        ["Year 1", "E980,000", "E629,300", "E350,700", "E28,056"],
        ["Year 2", "E1,680,000", "E1,078,800", "E601,200", "E48,096"],
        ["Year 3", "E1,680,000", "E1,078,800", "E601,200", "E48,096"],
        ["Year 4", "E1,680,000", "E1,078,800", "E601,200", "E48,096"],
        ["Year 5", "E1,680,000", "E1,078,800", "E601,200", "E48,096"],
        ["5-YR TOTAL", "E7,700,000", "E4,944,500", "E2,755,500", "E220,440"],
    ]
    y = draw_table(c, y, headers, data, [2.5*cm, 3.5*cm, 3.5*cm, 3*cm, 3*cm])
    
    y = draw_text(c, y, "*Per member amounts after 20% reserve retained for business growth")
    
    y -= 1*cm
    y = draw_subsection_title(c, y, "Risk Analysis")
    
    headers = ["Risk", "Likelihood", "Impact", "Mitigation"]
    data = [
        ["Disease outbreak", "Medium", "High", "Vaccination, quarantine, vet"],
        ["Feed price increase", "Medium", "Medium", "Bulk buying, grow fodder"],
        ["Cattle theft", "Low", "High", "Security, night watch"],
        ["Market price drop", "Medium", "Medium", "Quality focus, contracts"],
    ]
    y = draw_table(c, y, headers, data, [3.5*cm, 2.5*cm, 2*cm, 7*cm])
    
    c.showPage()
    
    # Page 8: Implementation
    draw_header(c, 8, "Implementation Plan")
    y = HEIGHT - 3*cm
    
    y = draw_section_title(c, y, "IMPLEMENTATION TIMELINE")
    
    timeline = [
        ("Month 1", "Grant approval & disbursement", "Procurement planning, site preparation, order materials"),
        ("Month 2", "Construction begins", "Build Feedlot 2, install water system, purchase first 10 weaners"),
        ("Month 3", "Expansion continues", "Build Feedlot 3, purchase second batch, begin feeding"),
        ("Month 4", "Complete infrastructure", "Build Feedlot 4, storage shed, purchase third batch"),
        ("Month 5", "First sales!", "Sell first 10 finished cattle, purchase fourth batch"),
        ("Month 6+", "Full operation", "Monthly cycle: Buy 10, Feed 40, Sell 10"),
    ]
    
    for month, title, desc in timeline:
        # Timeline dot
        c.setFillColor(DARK_GREEN)
        c.circle(2.5*cm, y - 0.3*cm, 0.2*cm, fill=True)
        
        # Connector line
        if month != "Month 6+":
            c.setStrokeColor(LIGHT_GREEN)
            c.setLineWidth(2)
            c.line(2.5*cm, y - 0.5*cm, 2.5*cm, y - 1.8*cm)
        
        # Content box
        c.setFillColor(LIGHT_BG)
        c.roundRect(3.2*cm, y - 1.5*cm, WIDTH - 5.2*cm, 1.6*cm, 5, fill=True, stroke=False)
        
        c.setFillColor(MEDIUM_GREEN)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(3.5*cm, y - 0.4*cm, month)
        
        c.setFillColor(DARK_GREEN)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(5.5*cm, y - 0.4*cm, title)
        
        c.setFillColor(DARK_TEXT)
        c.setFont("Helvetica", 9)
        c.drawString(3.5*cm, y - 1*cm, desc)
        
        y -= 2*cm
    
    y -= 0.5*cm
    y = draw_subsection_title(c, y, "Sustainability")
    y = draw_highlight_box(c, y, "SELF-SUSTAINING AFTER INITIAL GRANT", "Monthly profits fund ongoing operations, maintenance, and future growth")
    
    c.showPage()
    
    # Final page: Contact
    draw_header(c, 9, "Contact Information")
    y = HEIGHT - 3*cm
    
    y = draw_section_title(c, y, "CONTACT INFORMATION")
    
    info = [
        ("Project Name", "Lushikishini Cattle Feedlot Cooperative"),
        ("Contact Person", "Sibusiso Mavuso (Chairperson)"),
        ("Location", "Lushikishini, kaMavuso, Phondo Inkhundla"),
        ("Traditional Authority", "Chief Somtsewu"),
        ("Region", "Kingdom of Eswatini"),
    ]
    y = draw_info_box(c, y, info)
    
    y -= 1*cm
    c.setFillColor(DARK_GREEN)
    c.roundRect(2*cm, y - 3*cm, WIDTH - 4*cm, 3*cm, 10, fill=True, stroke=False)
    
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(WIDTH/2, y - 0.8*cm, "Thank you for considering our application")
    
    c.setFont("Helvetica", 11)
    c.drawCentredString(WIDTH/2, y - 1.5*cm, "Together, we can transform our community through")
    c.drawCentredString(WIDTH/2, y - 2*cm, "sustainable agricultural enterprise")
    
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(WIDTH/2, y - 2.7*cm, "Lushikishini Cattle Feedlot Cooperative")
    
    c.save()
    print("✅ Created: LUSHIKISHINI-BUSINESS-PLAN-FINAL.pdf")

if __name__ == "__main__":
    create_business_plan()
