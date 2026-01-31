#!/usr/bin/env python3
"""
Create highly visual explainer video with:
- Rich gradient backgrounds
- Icon-based visuals (minimal text)
- Proper audio sync
- Smooth animations
- Female voiceover
"""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from moviepy import *
from moviepy.video.fx import *
import math

# Paths
BASE_DIR = "/workspaces/WorldClass-ERP/video-presentations"
AUDIO_DIR = f"{BASE_DIR}/public/audio/voiceover-v2"
ICONS_DIR = f"{BASE_DIR}/assets/icons"
MUSIC_FILE = f"{BASE_DIR}/public/audio/music/corporate-ambient-60s.wav"
OUTPUT = f"{BASE_DIR}/out/investor-pitch-visual.mp4"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# Brand colors (RGB)
DEEP_NAVY = (30, 58, 138)
ROYAL_BLUE = (30, 64, 175)
PURPLE = (55, 48, 163)
SKY_BLUE = (147, 197, 253)
WHITE = (255, 255, 255)
GOLD = (251, 191, 36)
DARK_BG = (15, 23, 42)
TEAL = (20, 184, 166)
RED = (239, 68, 68)
GREEN = (34, 197, 94)

# Scene definitions - visual-first approach
SCENES = [
    {"audio": "01-intro", "type": "intro"},
    {"audio": "02-hook", "type": "question"},
    {"audio": "03-problem", "type": "problem"},
    {"audio": "04-solution", "type": "solution"},
    {"audio": "05-how-it-works", "type": "architecture"},
    {"audio": "06-modules", "type": "modules"},
    {"audio": "07-verticals", "type": "verticals"},
    {"audio": "08-compliance", "type": "compliance"},
    {"audio": "09-ai", "type": "ai"},
    {"audio": "10-traction", "type": "traction"},
    {"audio": "11-business-model", "type": "business"},
    {"audio": "12-market", "type": "market"},
    {"audio": "13-roadmap", "type": "roadmap"},
    {"audio": "14-why-us", "type": "win"},
    {"audio": "15-ask", "type": "ask"},
    {"audio": "16-closing", "type": "closing"},
]

def create_radial_gradient(width, height, center_color, edge_color, center=(0.5, 0.5)):
    """Create a radial gradient background"""
    img = Image.new('RGB', (width, height))
    pixels = img.load()
    
    cx, cy = int(width * center[0]), int(height * center[1])
    max_dist = math.sqrt(width**2 + height**2) / 2
    
    for y in range(height):
        for x in range(width):
            dist = math.sqrt((x - cx)**2 + (y - cy)**2)
            ratio = min(dist / max_dist, 1.0)
            
            r = int(center_color[0] * (1 - ratio) + edge_color[0] * ratio)
            g = int(center_color[1] * (1 - ratio) + edge_color[1] * ratio)
            b = int(center_color[2] * (1 - ratio) + edge_color[2] * ratio)
            
            pixels[x, y] = (r, g, b)
    
    return img

def create_gradient(width, height, color1, color2, angle=0):
    """Create a linear gradient at an angle"""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    if angle == 0:  # Vertical
        for i in range(height):
            ratio = i / height
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.line([(0, i), (width, i)], fill=(r, g, b))
    elif angle == 45:  # Diagonal
        for i in range(width + height):
            ratio = i / (width + height)
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.line([(0, i), (i, 0)], fill=(r, g, b))
    else:  # Horizontal
        for i in range(width):
            ratio = i / width
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.line([(i, 0), (i, height)], fill=(r, g, b))
    
    return img

def load_icon(name, size=150):
    """Load and resize an icon"""
    try:
        path = f"{ICONS_DIR}/{name}"
        if os.path.exists(path):
            icon = Image.open(path).convert("RGBA")
            icon = icon.resize((size, size), Image.Resampling.LANCZOS)
            return icon
    except:
        pass
    return None

def draw_glow_circle(draw, x, y, radius, color, glow_radius=20):
    """Draw a glowing circle"""
    for i in range(glow_radius, 0, -2):
        alpha = int(100 * (1 - i/glow_radius))
        glow_color = (*color, alpha)
        draw.ellipse([x-radius-i, y-radius-i, x+radius+i, y+radius+i], 
                     fill=None, outline=color, width=2)
    draw.ellipse([x-radius, y-radius, x+radius, y+radius], fill=color)

def paste_icon(base_img, icon, position):
    """Paste icon with transparency"""
    if icon and icon.mode == 'RGBA':
        base_img.paste(icon, position, icon)
    elif icon:
        base_img.paste(icon, position)

def create_scene_intro(width, height):
    """Welcome scene - visual with Africa icon"""
    img = create_radial_gradient(width, height, ROYAL_BLUE, DEEP_NAVY, (0.5, 0.6))
    draw = ImageDraw.Draw(img)
    
    # Load fonts
    font_large = ImageFont.truetype(FONT_BOLD, 100)
    font_sub = ImageFont.truetype(FONT_REGULAR, 36)
    font_tag = ImageFont.truetype(FONT_REGULAR, 28)
    
    # Africa icon
    africa = load_icon("africa.png", 200)
    if africa:
        paste_icon(img, africa, (width//2 - 100, 180))
    
    # Brand name with glow effect
    draw.text((width//2, 480), "SiyaBusa", font=font_large, fill=WHITE, anchor="mm")
    
    # Tagline
    draw.text((width//2, 580), "Enterprise Resource Planning", font=font_sub, fill=SKY_BLUE, anchor="mm")
    
    # Gold accent line
    draw.rectangle([width//2 - 150, 640, width//2 + 150, 644], fill=GOLD)
    
    # Motto
    draw.text((width//2, 700), "Built for Africa • By Africans", font=font_tag, fill=GOLD, anchor="mm")
    
    return img

def create_scene_question(width, height):
    """Question scene - big question mark visual"""
    img = create_gradient(width, height, PURPLE, DEEP_NAVY, 45)
    draw = ImageDraw.Draw(img)
    
    font_huge = ImageFont.truetype(FONT_BOLD, 300)
    font_sub = ImageFont.truetype(FONT_REGULAR, 40)
    
    # Question icon
    question = load_icon("question.png", 250)
    if question:
        paste_icon(img, question, (width//2 - 125, 150))
    else:
        draw.text((width//2, 280), "?", font=font_huge, fill=GOLD, anchor="mm")
    
    # Question text
    draw.text((width//2, 550), "How do African businesses", font=font_sub, fill=WHITE, anchor="mm")
    draw.text((width//2, 610), "manage their operations today?", font=font_sub, fill=SKY_BLUE, anchor="mm")
    
    # Stats visual
    draw.rounded_rectangle([300, 720, 700, 820], radius=15, fill=(50, 30, 80))
    draw.text((500, 770), "70% use outdated systems", font=ImageFont.truetype(FONT_REGULAR, 28), fill=WHITE, anchor="mm")
    
    draw.rounded_rectangle([750, 720, 1200, 820], radius=15, fill=(50, 30, 80))
    draw.text((975, 770), "Most can't afford SAP/Oracle", font=ImageFont.truetype(FONT_REGULAR, 28), fill=WHITE, anchor="mm")
    
    return img

def create_scene_problem(width, height):
    """Problem scene - visual pain points"""
    img = create_gradient(width, height, (60, 20, 40), DEEP_NAVY)
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 60)
    font_item = ImageFont.truetype(FONT_REGULAR, 32)
    
    # Title with error icon
    error = load_icon("error.png", 80)
    if error:
        paste_icon(img, error, (width//2 - 200, 80))
    draw.text((width//2 + 40, 120), "The Problem", font=font_title, fill=RED, anchor="lm")
    
    # Visual problem cards
    problems = [
        ("💰", "Expensive Software", "$100K+ for enterprise tools"),
        ("🔧", "No Local Support", "Foreign vendors, distant help"),
        ("📋", "Compliance Gaps", "SARS, POPIA not built-in"),
        ("🔌", "Disconnected Systems", "Data scattered everywhere"),
    ]
    
    card_width = 400
    card_height = 180
    start_x = 200
    start_y = 280
    
    for i, (emoji, title, desc) in enumerate(problems):
        row, col = i // 2, i % 2
        x = start_x + col * (card_width + 100)
        y = start_y + row * (card_height + 40)
        
        # Card background
        draw.rounded_rectangle([x, y, x + card_width, y + card_height], radius=20, 
                              fill=(80, 30, 50), outline=RED, width=2)
        
        # Emoji/icon
        draw.text((x + 50, y + card_height//2), emoji, 
                 font=ImageFont.truetype(FONT_REGULAR, 60), fill=WHITE, anchor="mm")
        
        # Text
        draw.text((x + 120, y + 60), title, font=ImageFont.truetype(FONT_BOLD, 28), fill=WHITE, anchor="lm")
        draw.text((x + 120, y + 110), desc, font=ImageFont.truetype(FONT_REGULAR, 22), fill=SKY_BLUE, anchor="lm")
    
    return img

def create_scene_solution(width, height):
    """Solution scene - central hub visual"""
    img = create_radial_gradient(width, height, TEAL, DEEP_NAVY, (0.5, 0.5))
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 60)
    font_label = ImageFont.truetype(FONT_BOLD, 24)
    
    # Title
    check = load_icon("check.png", 70)
    if check:
        paste_icon(img, check, (width//2 - 220, 60))
    draw.text((width//2 + 30, 95), "The Solution", font=font_title, fill=GREEN, anchor="lm")
    
    # Central circle
    cx, cy = width//2, height//2 + 50
    draw.ellipse([cx-120, cy-120, cx+120, cy+120], fill=GOLD, outline=WHITE, width=4)
    draw.text((cx, cy - 20), "SiyaBusa", font=ImageFont.truetype(FONT_BOLD, 36), fill=DEEP_NAVY, anchor="mm")
    draw.text((cx, cy + 25), "ERP", font=ImageFont.truetype(FONT_BOLD, 48), fill=DEEP_NAVY, anchor="mm")
    
    # Surrounding modules with icons
    modules = [
        ("📊", "Finance", 0),
        ("📦", "Inventory", 60),
        ("💼", "Sales", 120),
        ("👥", "HR", 180),
        ("🏭", "Manufacturing", 240),
        ("📈", "Analytics", 300),
    ]
    
    radius = 280
    for emoji, name, angle_deg in modules:
        angle = math.radians(angle_deg - 90)
        mx = cx + int(radius * math.cos(angle))
        my = cy + int(radius * math.sin(angle))
        
        # Connection line
        draw.line([(cx, cy), (mx, my)], fill=(100, 200, 180), width=3)
        
        # Module circle
        draw.ellipse([mx-50, my-50, mx+50, my+50], fill=SKY_BLUE, outline=WHITE, width=2)
        draw.text((mx, my - 5), emoji, font=ImageFont.truetype(FONT_REGULAR, 30), fill=DEEP_NAVY, anchor="mm")
        draw.text((mx, my + 70), name, font=font_label, fill=WHITE, anchor="mm")
    
    return img

def create_scene_architecture(width, height):
    """Architecture scene - cloud/mobile visual"""
    img = create_gradient(width, height, ROYAL_BLUE, PURPLE)
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 50)
    font_item = ImageFont.truetype(FONT_REGULAR, 28)
    
    # Title
    draw.text((width//2, 80), "How It Works", font=font_title, fill=WHITE, anchor="mm")
    
    # Three pillars visual
    pillars = [
        ("☁️", "Cloud-Native", ["AWS Hosted", "Always Available", "Auto-Scaling"]),
        ("🔗", "API-First", ["400+ Endpoints", "Real-time Sync", "Easy Integration"]),
        ("📱", "Multi-Platform", ["Web Dashboard", "Mobile Ready", "Offline Mode"]),
    ]
    
    pillar_width = 350
    start_x = (width - 3 * pillar_width - 100) // 2
    
    for i, (emoji, title, features) in enumerate(pillars):
        x = start_x + i * (pillar_width + 50)
        y = 180
        
        # Pillar background
        draw.rounded_rectangle([x, y, x + pillar_width, y + 600], radius=30, 
                              fill=(40, 50, 120), outline=SKY_BLUE, width=2)
        
        # Icon
        draw.text((x + pillar_width//2, y + 80), emoji, 
                 font=ImageFont.truetype(FONT_REGULAR, 80), fill=WHITE, anchor="mm")
        
        # Title
        draw.text((x + pillar_width//2, y + 180), title, 
                 font=ImageFont.truetype(FONT_BOLD, 32), fill=GOLD, anchor="mm")
        
        # Features
        for j, feature in enumerate(features):
            fy = y + 260 + j * 80
            draw.ellipse([x + 40, fy - 10, x + 60, fy + 10], fill=GREEN)
            draw.text((x + 80, fy), feature, font=font_item, fill=WHITE, anchor="lm")
    
    return img

def create_scene_modules(width, height):
    """Modules scene - grid of capabilities"""
    img = create_gradient(width, height, DEEP_NAVY, (20, 30, 60))
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 50)
    font_label = ImageFont.truetype(FONT_REGULAR, 22)
    
    # Title
    draw.text((width//2, 70), "25+ Integrated Modules", font=font_title, fill=GOLD, anchor="mm")
    
    # Module grid with emojis
    modules = [
        "📊 Finance", "📦 Inventory", "💼 Sales", "👥 HR", "🏭 Manufacturing",
        "📈 Analytics", "🛒 Procurement", "📋 Projects", "🚚 Logistics", "💳 Payments",
        "📑 Documents", "📧 Email", "📞 Comms", "🔐 Security", "⚙️ Settings"
    ]
    
    cols = 5
    rows = 3
    card_w = 280
    card_h = 120
    gap = 30
    
    total_w = cols * card_w + (cols - 1) * gap
    start_x = (width - total_w) // 2
    start_y = 180
    
    for i, module in enumerate(modules):
        row, col = i // cols, i % cols
        x = start_x + col * (card_w + gap)
        y = start_y + row * (card_h + gap)
        
        # Card
        color = [(40, 70, 140), (50, 60, 130), (45, 55, 125)][row]
        draw.rounded_rectangle([x, y, x + card_w, y + card_h], radius=15, fill=color, outline=SKY_BLUE, width=1)
        draw.text((x + card_w//2, y + card_h//2), module, font=font_label, fill=WHITE, anchor="mm")
    
    # Bottom text
    draw.text((width//2, 700), "All modules work together seamlessly", 
             font=ImageFont.truetype(FONT_REGULAR, 28), fill=SKY_BLUE, anchor="mm")
    
    return img

def create_scene_verticals(width, height):
    """Industry verticals - icons for each industry"""
    img = create_gradient(width, height, PURPLE, DEEP_NAVY, 45)
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 50)
    font_label = ImageFont.truetype(FONT_BOLD, 26)
    
    # Title
    draw.text((width//2, 70), "Industry-Specific Solutions", font=font_title, fill=GOLD, anchor="mm")
    
    # Industry cards with large emojis
    industries = [
        ("🏥", "Healthcare", "Patient records, Medical inventory"),
        ("⛏️", "Mining", "Mineral tracking, Safety compliance"),
        ("🏗️", "Construction", "Project costing, Progress billing"),
        ("🏠", "Property", "Lease management, Tenant billing"),
        ("🌾", "Agriculture", "Crop tracking, Farm operations"),
        ("🏭", "Manufacturing", "Production, Quality control"),
    ]
    
    cols = 3
    card_w = 350
    card_h = 200
    gap = 50
    
    total_w = cols * card_w + (cols - 1) * gap
    start_x = (width - total_w) // 2
    start_y = 180
    
    for i, (emoji, name, desc) in enumerate(industries):
        row, col = i // cols, i % cols
        x = start_x + col * (card_w + gap)
        y = start_y + row * (card_h + 80)
        
        # Card
        draw.rounded_rectangle([x, y, x + card_w, y + card_h], radius=20, 
                              fill=(60, 40, 100), outline=SKY_BLUE, width=2)
        
        # Emoji
        draw.text((x + card_w//2, y + 60), emoji, 
                 font=ImageFont.truetype(FONT_REGULAR, 60), fill=WHITE, anchor="mm")
        
        # Name
        draw.text((x + card_w//2, y + 130), name, font=font_label, fill=GOLD, anchor="mm")
        
        # Description
        draw.text((x + card_w//2, y + 170), desc, 
                 font=ImageFont.truetype(FONT_REGULAR, 18), fill=SKY_BLUE, anchor="mm")
    
    return img

def create_scene_compliance(width, height):
    """Compliance scene - checkmarks visual"""
    img = create_gradient(width, height, (20, 60, 50), DEEP_NAVY)
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 50)
    font_item = ImageFont.truetype(FONT_BOLD, 36)
    font_desc = ImageFont.truetype(FONT_REGULAR, 24)
    
    # Title
    cert = load_icon("certificate.png", 70)
    if cert:
        paste_icon(img, cert, (width//2 - 250, 50))
    draw.text((width//2 + 40, 85), "Compliance Built-In", font=font_title, fill=GREEN, anchor="lm")
    
    # Compliance items with big checkmarks
    items = [
        ("SARS", "e-Filing Integration", "Submit returns directly"),
        ("POPIA", "Data Protection", "Privacy compliance ready"),
        ("IFRS", "Accounting Standards", "International reporting"),
        ("Audit Trail", "Complete History", "Every action tracked"),
    ]
    
    start_y = 220
    for i, (name, title, desc) in enumerate(items):
        y = start_y + i * 160
        
        # Green bar
        draw.rounded_rectangle([200, y, width - 200, y + 120], radius=15, fill=(30, 80, 60))
        
        # Big checkmark circle
        draw.ellipse([250, y + 20, 330, y + 100], fill=GREEN)
        draw.text((290, y + 60), "✓", font=ImageFont.truetype(FONT_BOLD, 50), fill=WHITE, anchor="mm")
        
        # Text
        draw.text((380, y + 40), name, font=font_item, fill=GOLD, anchor="lm")
        draw.text((580, y + 40), f"• {title}", font=font_desc, fill=WHITE, anchor="lm")
        draw.text((580, y + 80), desc, font=ImageFont.truetype(FONT_REGULAR, 20), fill=SKY_BLUE, anchor="lm")
    
    return img

def create_scene_ai(width, height):
    """AI scene - brain/robot visual"""
    img = create_radial_gradient(width, height, PURPLE, DEEP_NAVY, (0.5, 0.4))
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 50)
    font_chat = ImageFont.truetype(FONT_REGULAR, 28)
    
    # Title
    draw.text((width//2, 70), "AI-Powered Assistant", font=font_title, fill=GOLD, anchor="mm")
    
    # AI icon
    ai = load_icon("ai.png", 200)
    if ai:
        paste_icon(img, ai, (width//2 - 100, 140))
    else:
        draw.text((width//2, 250), "🤖", font=ImageFont.truetype(FONT_REGULAR, 150), fill=WHITE, anchor="mm")
    
    # Chat bubbles
    questions = [
        ("👤", "Show me last month's top customers", True),
        ("🤖", "Here are your top 5 customers by revenue...", False),
        ("👤", "Create a sales report for Q4", True),
        ("🤖", "Generating comprehensive Q4 report...", False),
    ]
    
    start_y = 420
    for i, (icon, text, is_user) in enumerate(questions):
        y = start_y + i * 100
        if is_user:
            x = 400
            color = (50, 70, 140)
        else:
            x = 600
            color = (40, 100, 80)
        
        # Chat bubble
        draw.rounded_rectangle([x, y, x + 800, y + 70], radius=20, fill=color)
        draw.text((x + 20, y + 35), icon, font=ImageFont.truetype(FONT_REGULAR, 30), fill=WHITE, anchor="lm")
        draw.text((x + 70, y + 35), text, font=font_chat, fill=WHITE, anchor="lm")
    
    return img

def create_scene_traction(width, height):
    """Traction scene - big numbers"""
    img = create_gradient(width, height, ROYAL_BLUE, DEEP_NAVY)
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 50)
    font_big = ImageFont.truetype(FONT_BOLD, 120)
    font_label = ImageFont.truetype(FONT_REGULAR, 28)
    
    # Title
    rocket = load_icon("rocket.png", 70)
    if rocket:
        paste_icon(img, rocket, (width//2 - 220, 50))
    draw.text((width//2 + 40, 85), "Where We Are Today", font=font_title, fill=GOLD, anchor="lm")
    
    # Big stats
    stats = [
        ("400+", "API Endpoints", "Complete backend"),
        ("66", "Controllers", "All modules ready"),
        ("LIVE", "on AWS", "Production deployed"),
    ]
    
    total_w = len(stats) * 400
    start_x = (width - total_w) // 2
    
    for i, (num, label, sub) in enumerate(stats):
        x = start_x + i * 400 + 200
        
        # Circle background
        draw.ellipse([x - 150, 280, x + 150, 580], fill=(40, 60, 140), outline=GOLD, width=4)
        
        # Number
        draw.text((x, 400), num, font=font_big, fill=GOLD, anchor="mm")
        
        # Labels
        draw.text((x, 520), label, font=font_label, fill=WHITE, anchor="mm")
        draw.text((x, 650), sub, font=ImageFont.truetype(FONT_REGULAR, 22), fill=SKY_BLUE, anchor="mm")
    
    return img

def create_scene_business(width, height):
    """Business model scene - SaaS pricing visual"""
    img = create_gradient(width, height, TEAL, DEEP_NAVY, 45)
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 50)
    font_tier = ImageFont.truetype(FONT_BOLD, 32)
    font_price = ImageFont.truetype(FONT_BOLD, 48)
    font_feature = ImageFont.truetype(FONT_REGULAR, 20)
    
    # Title
    draw.text((width//2, 70), "SaaS Business Model", font=font_title, fill=WHITE, anchor="mm")
    
    # Pricing tiers
    tiers = [
        ("Starter", "$49", "/user/mo", ["Core modules", "5 users", "Email support"]),
        ("Business", "$99", "/user/mo", ["All modules", "Unlimited users", "Priority support", "Custom reports"]),
        ("Enterprise", "Custom", "pricing", ["White-label", "Dedicated server", "SLA guarantee", "On-site training"]),
    ]
    
    card_w = 350
    gap = 80
    total_w = 3 * card_w + 2 * gap
    start_x = (width - total_w) // 2
    
    for i, (name, price, suffix, features) in enumerate(tiers):
        x = start_x + i * (card_w + gap)
        y = 180
        
        # Card (highlight middle)
        is_featured = i == 1
        card_h = 620 if is_featured else 580
        y_offset = -20 if is_featured else 0
        fill = (40, 100, 90) if is_featured else (30, 60, 80)
        outline = GOLD if is_featured else SKY_BLUE
        
        draw.rounded_rectangle([x, y + y_offset, x + card_w, y + card_h + y_offset], 
                              radius=25, fill=fill, outline=outline, width=3 if is_featured else 2)
        
        if is_featured:
            draw.rectangle([x, y - 20, x + card_w, y + 20], fill=GOLD)
            draw.text((x + card_w//2, y), "POPULAR", font=ImageFont.truetype(FONT_BOLD, 18), fill=DEEP_NAVY, anchor="mm")
        
        # Tier name
        draw.text((x + card_w//2, y + 80 + y_offset), name, font=font_tier, fill=WHITE, anchor="mm")
        
        # Price
        draw.text((x + card_w//2, y + 160 + y_offset), price, font=font_price, fill=GOLD, anchor="mm")
        draw.text((x + card_w//2, y + 210 + y_offset), suffix, font=ImageFont.truetype(FONT_REGULAR, 20), fill=SKY_BLUE, anchor="mm")
        
        # Features
        for j, feature in enumerate(features):
            fy = y + 280 + j * 50 + y_offset
            draw.text((x + 50, fy), "✓", font=ImageFont.truetype(FONT_REGULAR, 24), fill=GREEN, anchor="lm")
            draw.text((x + 90, fy), feature, font=font_feature, fill=WHITE, anchor="lm")
    
    return img

def create_scene_market(width, height):
    """Market opportunity scene - big TAM number"""
    img = create_radial_gradient(width, height, GOLD, DEEP_NAVY, (0.5, 0.3))
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 50)
    font_huge = ImageFont.truetype(FONT_BOLD, 180)
    font_sub = ImageFont.truetype(FONT_REGULAR, 36)
    font_stat = ImageFont.truetype(FONT_BOLD, 32)
    
    # Title
    chart = load_icon("chart.png", 70)
    if chart:
        paste_icon(img, chart, (width//2 - 260, 50))
    draw.text((width//2 + 30, 85), "Market Opportunity", font=font_title, fill=WHITE, anchor="lm")
    
    # Big TAM number
    draw.text((width//2, 350), "$10B+", font=font_huge, fill=GOLD, anchor="mm")
    draw.text((width//2, 480), "African ERP Market", font=font_sub, fill=WHITE, anchor="mm")
    
    # Supporting stats
    stats = [
        ("📈", "12%", "Annual Growth"),
        ("🌍", "54", "Countries"),
        ("🏢", "Millions", "of SMEs"),
    ]
    
    total_w = len(stats) * 350
    start_x = (width - total_w) // 2
    
    for i, (emoji, num, label) in enumerate(stats):
        x = start_x + i * 350 + 175
        y = 650
        
        draw.rounded_rectangle([x - 140, y - 30, x + 140, y + 100], radius=15, fill=(50, 40, 30))
        draw.text((x - 80, y + 35), emoji, font=ImageFont.truetype(FONT_REGULAR, 40), fill=WHITE, anchor="mm")
        draw.text((x + 20, y + 20), num, font=font_stat, fill=GOLD, anchor="lm")
        draw.text((x + 20, y + 60), label, font=ImageFont.truetype(FONT_REGULAR, 20), fill=SKY_BLUE, anchor="lm")
    
    return img

def create_scene_roadmap(width, height):
    """Roadmap scene - timeline visual (CORRECTED)"""
    img = create_gradient(width, height, ROYAL_BLUE, PURPLE)
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 50)
    font_q = ImageFont.truetype(FONT_BOLD, 36)
    font_item = ImageFont.truetype(FONT_REGULAR, 24)
    
    # Title
    draw.text((width//2, 70), "2026 Roadmap", font=font_title, fill=GOLD, anchor="mm")
    
    # Timeline - CORRECTED to match voiceover
    quarters = [
        ("Q1", "💰", "Seed Funding", "Raise capital"),
        ("Q2", "👥", "10 Customers", "Paying clients"),
        ("Q3", "📱", "Mobile App", "On-the-go access"),
        ("Q4", "🌍", "Regional Expansion", "Beyond South Africa"),
    ]
    
    # Timeline line
    line_y = 450
    draw.rectangle([200, line_y - 3, width - 200, line_y + 3], fill=WHITE)
    
    gap = (width - 400) // (len(quarters) - 1)
    
    for i, (q, emoji, title, desc) in enumerate(quarters):
        x = 200 + i * gap
        
        # Timeline dot
        is_current = i == 0  # Q1 is current
        dot_color = GOLD if is_current else SKY_BLUE
        dot_size = 30 if is_current else 20
        
        draw.ellipse([x - dot_size, line_y - dot_size, x + dot_size, line_y + dot_size], 
                    fill=dot_color, outline=WHITE, width=3)
        
        # Quarter label
        draw.text((x, line_y - 80), q, font=font_q, fill=GOLD, anchor="mm")
        
        # Card above or below timeline
        card_y = 180 if i % 2 == 0 else 550
        
        draw.rounded_rectangle([x - 120, card_y, x + 120, card_y + 180], 
                              radius=20, fill=(50, 60, 140), outline=dot_color, width=2)
        
        # Emoji
        draw.text((x, card_y + 50), emoji, font=ImageFont.truetype(FONT_REGULAR, 50), fill=WHITE, anchor="mm")
        
        # Title and description
        draw.text((x, card_y + 110), title, font=ImageFont.truetype(FONT_BOLD, 22), fill=WHITE, anchor="mm")
        draw.text((x, card_y + 145), desc, font=ImageFont.truetype(FONT_REGULAR, 18), fill=SKY_BLUE, anchor="mm")
    
    return img

def create_scene_win(width, height):
    """Why we win scene - trophy visual"""
    img = create_gradient(width, height, (30, 80, 40), DEEP_NAVY)
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 50)
    font_item = ImageFont.truetype(FONT_BOLD, 28)
    
    # Title with trophy
    trophy = load_icon("trophy.png", 80)
    if trophy:
        paste_icon(img, trophy, (width//2 - 220, 50))
    draw.text((width//2 + 40, 90), "Why We Win", font=font_title, fill=GOLD, anchor="lm")
    
    # Advantages
    advantages = [
        ("🎯", "Local Expertise", "We understand African business deeply"),
        ("🔧", "Complete Solution", "Not piecemeal - everything integrated"),
        ("💰", "Competitive Pricing", "Accessible to SMEs, not just enterprises"),
        ("🚀", "First Mover", "Building for this market before anyone else"),
    ]
    
    start_y = 220
    for i, (emoji, title, desc) in enumerate(advantages):
        y = start_y + i * 160
        
        # Card
        draw.rounded_rectangle([250, y, width - 250, y + 130], radius=20, 
                              fill=(40, 90, 60), outline=GREEN, width=2)
        
        # Number badge
        draw.ellipse([280, y + 30, 350, y + 100], fill=GOLD)
        draw.text((315, y + 65), str(i + 1), font=ImageFont.truetype(FONT_BOLD, 36), fill=DEEP_NAVY, anchor="mm")
        
        # Emoji
        draw.text((420, y + 65), emoji, font=ImageFont.truetype(FONT_REGULAR, 50), fill=WHITE, anchor="mm")
        
        # Text
        draw.text((500, y + 45), title, font=font_item, fill=WHITE, anchor="lm")
        draw.text((500, y + 90), desc, font=ImageFont.truetype(FONT_REGULAR, 22), fill=SKY_BLUE, anchor="lm")
    
    return img

def create_scene_ask(width, height):
    """The ask scene - investment visual"""
    img = create_radial_gradient(width, height, GOLD, DEEP_NAVY, (0.5, 0.5))
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(FONT_BOLD, 60)
    font_sub = ImageFont.truetype(FONT_REGULAR, 36)
    font_item = ImageFont.truetype(FONT_REGULAR, 28)
    
    # Money icon
    money = load_icon("money.png", 150)
    if money:
        paste_icon(img, money, (width//2 - 75, 100))
    
    # Title
    draw.text((width//2, 320), "The Ask", font=font_title, fill=WHITE, anchor="mm")
    
    # Subtitle
    draw.text((width//2, 400), "Seed Funding Round", font=font_sub, fill=GOLD, anchor="mm")
    
    # Use of funds
    draw.text((width//2, 520), "Use of Funds:", font=ImageFont.truetype(FONT_BOLD, 32), fill=WHITE, anchor="mm")
    
    uses = [
        ("👥", "Expand Sales Team"),
        ("💻", "Enhance Platform"),
        ("🌍", "Market Expansion"),
    ]
    
    total_w = len(uses) * 350
    start_x = (width - total_w) // 2
    
    for i, (emoji, use) in enumerate(uses):
        x = start_x + i * 350 + 175
        y = 620
        
        draw.rounded_rectangle([x - 140, y, x + 140, y + 120], radius=15, fill=(60, 50, 30))
        draw.text((x, y + 40), emoji, font=ImageFont.truetype(FONT_REGULAR, 40), fill=WHITE, anchor="mm")
        draw.text((x, y + 90), use, font=font_item, fill=WHITE, anchor="mm")
    
    return img

def create_scene_closing(width, height):
    """Closing scene - thank you + contact"""
    img = create_radial_gradient(width, height, ROYAL_BLUE, DEEP_NAVY, (0.5, 0.4))
    draw = ImageDraw.Draw(img)
    
    font_big = ImageFont.truetype(FONT_BOLD, 80)
    font_url = ImageFont.truetype(FONT_BOLD, 48)
    font_tag = ImageFont.truetype(FONT_REGULAR, 32)
    
    # Handshake icon
    handshake = load_icon("handshake.png", 150)
    if handshake:
        paste_icon(img, handshake, (width//2 - 75, 120))
    
    # Thank you
    draw.text((width//2, 350), "Thank You!", font=font_big, fill=WHITE, anchor="mm")
    
    # Gold line
    draw.rectangle([width//2 - 200, 420, width//2 + 200, 426], fill=GOLD)
    
    # Website
    draw.text((width//2, 520), "siyabusaerp.co.za", font=font_url, fill=GOLD, anchor="mm")
    
    # Tagline
    draw.text((width//2, 620), "We Rule. We Govern. We Empower.", font=font_tag, fill=SKY_BLUE, anchor="mm")
    
    # CTA
    draw.rounded_rectangle([width//2 - 250, 700, width//2 + 250, 780], radius=30, fill=GOLD)
    draw.text((width//2, 740), "Let's Build Together", font=ImageFont.truetype(FONT_BOLD, 32), fill=DEEP_NAVY, anchor="mm")
    
    return img

# Scene creator mapping
SCENE_CREATORS = {
    "intro": create_scene_intro,
    "question": create_scene_question,
    "problem": create_scene_problem,
    "solution": create_scene_solution,
    "architecture": create_scene_architecture,
    "modules": create_scene_modules,
    "verticals": create_scene_verticals,
    "compliance": create_scene_compliance,
    "ai": create_scene_ai,
    "traction": create_scene_traction,
    "business": create_scene_business,
    "market": create_scene_market,
    "roadmap": create_scene_roadmap,
    "win": create_scene_win,
    "ask": create_scene_ask,
    "closing": create_scene_closing,
}

def create_animated_scene(scene_type, duration, width=1920, height=1080):
    """Create an animated scene with Ken Burns effect"""
    creator = SCENE_CREATORS.get(scene_type)
    if not creator:
        return None
    
    # Create the frame
    frame = creator(width, height)
    frame_array = np.array(frame)
    
    # Create video clip with subtle zoom
    def make_frame(t):
        # Subtle zoom: 100% -> 105%
        zoom = 1 + 0.04 * (t / duration)
        h, w = frame_array.shape[:2]
        
        new_h = int(h / zoom)
        new_w = int(w / zoom)
        y1 = (h - new_h) // 2
        x1 = (w - new_w) // 2
        
        cropped = frame_array[y1:y1+new_h, x1:x1+new_w]
        
        from PIL import Image
        img = Image.fromarray(cropped)
        img = img.resize((w, h), Image.Resampling.LANCZOS)
        return np.array(img)
    
    clip = VideoClip(make_frame, duration=duration).with_fps(30)
    
    # Add fade transitions
    clip = clip.with_effects([vfx.CrossFadeIn(0.4), vfx.CrossFadeOut(0.4)])
    
    return clip

def get_audio_duration(audio_file):
    """Get duration of audio file"""
    clip = AudioFileClip(audio_file)
    duration = clip.duration
    clip.close()
    return duration

def main():
    print("🎬 Creating Visual-First Explainer Video")
    print("=" * 50)
    
    scene_clips = []
    total_duration = 0
    
    for i, scene in enumerate(SCENES):
        audio_file = f"{AUDIO_DIR}/{scene['audio']}.mp3"
        duration = get_audio_duration(audio_file)
        total_duration += duration
        
        print(f"  Scene {i+1:02d}: {scene['type']:15} ({duration:.1f}s)")
        
        # Create animated scene
        video = create_animated_scene(scene['type'], duration)
        
        # Add audio
        audio = AudioFileClip(audio_file)
        video = video.with_audio(audio)
        
        scene_clips.append(video)
    
    print(f"\n📊 Total duration: {total_duration:.0f}s ({total_duration/60:.1f} min)")
    print("\n🔗 Concatenating scenes...")
    final_video = concatenate_videoclips(scene_clips, method="compose")
    
    # Add background music
    print("🎵 Adding background music...")
    music = AudioFileClip(MUSIC_FILE).with_effects([afx.AudioLoop(duration=final_video.duration)])
    music = music.with_effects([afx.MultiplyVolume(0.06)])  # 6% volume (very subtle)
    
    # Mix voiceover with music
    final_audio = CompositeAudioClip([final_video.audio, music])
    final_video = final_video.with_audio(final_audio)
    
    print(f"\n📹 Rendering video...")
    final_video.write_videofile(
        OUTPUT,
        fps=30,
        codec="libx264",
        audio_codec="aac",
        audio_bitrate="192k",
        preset="fast",
        threads=4
    )
    
    print(f"\n✅ Video saved: {OUTPUT}")
    
    # Cleanup
    final_video.close()
    for clip in scene_clips:
        clip.close()

if __name__ == "__main__":
    main()
