#!/usr/bin/env python3
"""
Generate professional video slides matching SiyaBusa brand design
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import os

OUTPUT_DIR = Path(__file__).parent.parent / "out" / "slides"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Brand Colors (from PDF Design Standard)
COLORS = {
    'deep_navy': '#1e3a8a',
    'midnight_blue': '#020617',
    'navy_50': '#172554',
    'royal_blue': '#1e40af',
    'purple_accent': '#3730a3',
    'white': '#ffffff',
    'light_blue': '#bfdbfe',
    'sky_blue': '#93c5fd',
    'text_primary': '#1f2937',
    'muted': '#9ca3af'
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_gradient(width, height, color1, color2, direction='horizontal'):
    """Create a gradient background"""
    base = Image.new('RGB', (width, height), color1)
    top = Image.new('RGB', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = []
    
    if direction == 'horizontal':
        for x in range(width):
            mask_data.extend([int(255 * (x / width))] * height)
    else:  # vertical
        for y in range(height):
            mask_data.extend([int(255 * (y / height))] * width)
    
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base


# Slide content
SLIDES = [
    {
        "type": "cover",
        "title": "SiyaBusa ERP",
        "subtitle": "Enterprise Resource Planning for Africa",
        "tagline": "We Rule. We Govern. We Empower.",
        "footer": "Seed Investment Round • Q1 2026"
    },
    {
        "type": "content",
        "title": "The Gap We Solve",
        "bullets": [
            "Enterprise ERP: R50K–R200K/month, 6–18 month rollouts",
            "Basic tools: accounting only, no operations, no compliance",
            "Result: disconnected systems, manual SARS prep, compliance risk"
        ],
        "accent": "purple"
    },
    {
        "type": "content",
        "title": "What SiyaBusa Does",
        "bullets": [
            "Full ERP: finance, operations, people, compliance in one",
            "Native SA compliance: SARS, VAT, PAYE, POPIA, B-BBEE",
            "AI assistant + 9 agents: answers, actions, automation"
        ],
        "accent": "blue"
    },
    {
        "type": "content",
        "title": "Platform & Architecture",
        "bullets": [
            "Cloud-native on AWS: EC2, RDS Postgres, S3, Redis",
            "Multi-tenant by design: secure tenant isolation",
            "API-first: 400+ REST endpoints, ready for integrations"
        ],
        "accent": "purple"
    },
    {
        "type": "content",
        "title": "Modules That Matter",
        "bullets": [
            "Finance: GL, AP/AR, Cash, Treasury, Multi-entity",
            "Operations: Inventory, Warehouse, Manufacturing, Projects",
            "People: HR, Payroll, Leave, Performance"
        ],
        "accent": "blue"
    },
    {
        "type": "content",
        "title": "Industry Playbooks",
        "bullets": [
            "Healthcare: patients, claims, pharmacy stock",
            "Mining: mineral tracking, safety, shaft ops",
            "Construction & Property: costing, progress billing, leases"
        ],
        "accent": "purple"
    },
    {
        "type": "content",
        "title": "Compliance Engine",
        "bullets": [
            "SARS Sentinel: deadline dashboard, submission prep",
            "Audit Ready: full audit trails, evidence, findings",
            "Regulatory Hub: POPIA, FICA, King IV, B-BBEE tracking"
        ],
        "accent": "blue"
    },
    {
        "type": "content",
        "title": "AI That Works Today",
        "bullets": [
            "Ask in plain language: sales, cash, inventory, HR",
            "9 domain agents: Sales, Finance, HR, Procurement, Analytics",
            "Actions: draft POs, surface risks, prep SARS files"
        ],
        "accent": "purple"
    },
    {
        "type": "content",
        "title": "Customer Journey",
        "bullets": [
            "Discovery: process walkthrough, fit assessment",
            "Configure: chart of accounts, roles, approvals, tax",
            "Go-live: data migration, training, hypercare"
        ],
        "accent": "blue"
    },
    {
        "type": "content",
        "title": "Implementation Speed",
        "bullets": [
            "Ready now: production deployed on AWS",
            "2–6 week rollout: not 6–18 months",
            "Playbooks per industry: faster config, less risk"
        ],
        "accent": "purple"
    },
    {
        "type": "content",
        "title": "Business Model",
        "bullets": [
            "Per-user SaaS, 40% below global peers",
            "Implementation R25K–R150K, sized to scope",
            "Recurring support and success built-in"
        ],
        "accent": "blue"
    },
    {
        "type": "content",
        "title": "Market Opportunity",
        "bullets": [
            "SA ERP: $450M/yr; mid-market wedge: $180M",
            "Target: 50–500 employee firms, R10M–R500M revenue",
            "Underserved: too big for Xero, too cost-sensitive for SAP"
        ],
        "accent": "purple"
    },
    {
        "type": "content",
        "title": "Traction & Readiness",
        "bullets": [
            "Product complete: 25+ modules, 400+ APIs",
            "AWS live: EC2, RDS, S3, Dockerized",
            "Docs & playbooks: investor PDFs, deployment guides"
        ],
        "accent": "blue"
    },
    {
        "type": "content",
        "title": "Roadmap 2026–2029",
        "bullets": [
            "Q1 2026: Seed, 10 beta partners",
            "Q2 2026: 15 paying, R150K MRR",
            "2028: Series A, 200 customers; 2029: AltX path"
        ],
        "accent": "purple"
    },
    {
        "type": "content",
        "title": "Why We Win",
        "bullets": [
            "Right-sized: full ERP without enterprise bloat",
            "Local-first: compliance native, not a bolt-on",
            "Modern UX + AI: faster adoption, lower support cost"
        ],
        "accent": "blue"
    },
    {
        "type": "closing",
        "title": "Let’s Build Together",
        "subtitle": "SiyaBusa ERP | siyabusaerp.co.za",
        "bullets": [
            "investor@siyabusa.co.za",
            "partners@siyabusa.co.za",
            "www.siyabusaerp.co.za"
        ],
        "footer": "Request a demo • We Rule. We Govern. We Empower."
    }
]


def create_cover_slide(slide_data, width=1920, height=1080):
    """Create a professional cover slide with gradient and branding"""
    # Create gradient background (midnight blue to navy)
    img = create_gradient(width, height, 
                         hex_to_rgb(COLORS['midnight_blue']), 
                         hex_to_rgb(COLORS['navy_50']),
                         'vertical')
    draw = ImageDraw.Draw(img)
    
    # Add grid overlay effect
    for i in range(0, width, 100):
        draw.line([(i, 0), (i, height)], fill=(255, 255, 255, 10), width=1)
    for i in range(0, height, 100):
        draw.line([(0, i), (width, i)], fill=(255, 255, 255, 10), width=1)
    
    # Load fonts
    try:
        logo_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 120)
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
        subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 42)
        footer_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        tagline_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
    except:
        logo_font = title_font = subtitle_font = footer_font = tagline_font = ImageFont.load_default()
    
    y_pos = 280
    
    # Logo/Brand
    logo = "SiyaBusa ERP"
    bbox = draw.textbbox((0, 0), logo, font=logo_font)
    logo_width = bbox[2] - bbox[0]
    draw.text(((width - logo_width) // 2, y_pos), logo, 
             fill=hex_to_rgb(COLORS['white']), font=logo_font)
    y_pos += 150
    
    # Title
    title = slide_data['title']
    bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = bbox[2] - bbox[0]
    draw.text(((width - title_width) // 2, y_pos), title, 
             fill=hex_to_rgb(COLORS['light_blue']), font=title_font)
    y_pos += 120
    
    # Subtitle
    if 'subtitle' in slide_data:
        subtitle = slide_data['subtitle']
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        subtitle_width = bbox[2] - bbox[0]
        draw.text(((width - subtitle_width) // 2, y_pos), subtitle, 
                 fill=hex_to_rgb(COLORS['sky_blue']), font=subtitle_font)
        y_pos += 150
    
    # Tagline
    if 'tagline' in slide_data:
        tagline = slide_data['tagline'].upper()
        bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
        tagline_width = bbox[2] - bbox[0]
        draw.text(((width - tagline_width) // 2, y_pos), tagline, 
                 fill=hex_to_rgb(COLORS['sky_blue']), font=tagline_font)
    
    # Footer
    if 'footer' in slide_data:
        footer = slide_data['footer']
        bbox = draw.textbbox((0, 0), footer, font=footer_font)
        footer_width = bbox[2] - bbox[0]
        draw.text(((width - footer_width) // 2, height - 120), footer, 
                 fill=hex_to_rgb(COLORS['white']), font=footer_font)
    
    return img

def create_content_slide(slide_data, width=1920, height=1080):
    """Create a content slide with bullets and glass overlay"""
    accent = slide_data.get('accent', 'blue')

    # Base gradient
    if accent == 'purple':
        bg = create_gradient(width, height,
                             hex_to_rgb(COLORS['deep_navy']),
                             hex_to_rgb(COLORS['purple_accent']),
                             'horizontal')
    else:
        bg = create_gradient(width, height,
                             hex_to_rgb(COLORS['deep_navy']),
                             hex_to_rgb(COLORS['royal_blue']),
                             'horizontal')

    img = bg.convert('RGBA')
    draw = ImageDraw.Draw(img)

    # Glass card overlay
    card = Image.new('RGBA', (int(width * 0.8), int(height * 0.62)), (10, 20, 40, 180))
    img.paste(card, (int(width * 0.1), int(height * 0.25)), card)

    # Accent bar
    bar_color = COLORS['sky_blue'] if accent != 'purple' else COLORS['light_blue']
    draw.rectangle([int(width * 0.1), int(height * 0.25), int(width * 0.104), int(height * 0.87)],
                   fill=hex_to_rgb(bar_color) + (220,))

    # Load fonts
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 88)
        bullet_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 44)
    except:
        title_font = bullet_font = ImageFont.load_default()

    # Title
    title = slide_data['title']
    draw.text((int(width * 0.14), int(height * 0.28)), title, fill=hex_to_rgb(COLORS['white']), font=title_font)
    draw.rectangle([int(width * 0.14), int(height * 0.39), int(width * 0.32), int(height * 0.395)],
                   fill=hex_to_rgb(bar_color) + (255,))

    # Bullets
    y_pos = int(height * 0.45)
    for bullet in slide_data.get('bullets', []):
        draw.ellipse([int(width * 0.14), y_pos + 12, int(width * 0.148), y_pos + 32],
                     fill=hex_to_rgb(bar_color) + (255,))
        draw.text((int(width * 0.16), y_pos), bullet,
                  fill=hex_to_rgb(COLORS['white']), font=bullet_font)
        y_pos += 90

    return img.convert('RGB')

def create_closing_slide(slide_data, width=1920, height=1080):
    """Create a closing/contact slide"""
    # Create gradient background
    img = create_gradient(width, height,
                         hex_to_rgb(COLORS['midnight_blue']),
                         hex_to_rgb(COLORS['deep_navy']),
                         'vertical')
    draw = ImageDraw.Draw(img)
    
    # Load fonts
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 100)
        subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 48)
        contact_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 50)
        footer_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
    except:
        title_font = subtitle_font = contact_font = footer_font = ImageFont.load_default()
    
    y_pos = 250
    
    # Title
    title = slide_data['title']
    bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = bbox[2] - bbox[0]
    draw.text(((width - title_width) // 2, y_pos), title, 
             fill=hex_to_rgb(COLORS['white']), font=title_font)
    y_pos += 150
    
    # Subtitle
    if 'subtitle' in slide_data:
        subtitle = slide_data['subtitle']
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        subtitle_width = bbox[2] - bbox[0]
        draw.text(((width - subtitle_width) // 2, y_pos), subtitle, 
                 fill=hex_to_rgb(COLORS['light_blue']), font=subtitle_font)
        y_pos += 120
    
    # Contact info
    for contact in slide_data.get('bullets', []):
        bbox = draw.textbbox((0, 0), contact, font=contact_font)
        contact_width = bbox[2] - bbox[0]
        draw.text(((width - contact_width) // 2, y_pos), contact, 
                 fill=hex_to_rgb(COLORS['sky_blue']), font=contact_font)
        y_pos += 90
    
    # Footer
    if 'footer' in slide_data:
        footer = slide_data['footer']
        bbox = draw.textbbox((0, 0), footer, font=footer_font)
        footer_width = bbox[2] - bbox[0]
        draw.text(((width - footer_width) // 2, height - 120), footer, 
                 fill=hex_to_rgb(COLORS['white']), font=footer_font)
    
    return img

def create_slide(index, slide_data, width=1920, height=1080):
    """Create a slide image based on type"""
    slide_type = slide_data.get('type', 'content')
    
    if slide_type == 'cover':
        img = create_cover_slide(slide_data, width, height)
    elif slide_type == 'closing':
        img = create_closing_slide(slide_data, width, height)
    else:
        img = create_content_slide(slide_data, width, height)
    
    # Save
    output_path = OUTPUT_DIR / f"slide_{index:02d}.png"
    img.save(str(output_path))
    print(f"✓ Created: slide_{index:02d}.png")
    return output_path


def main():
    print("\n🎨 Generating Professional Brand Slides...")
    print(f"   Output: {OUTPUT_DIR}")
    print(f"   Brand: SiyaBusa ERP")
    print(f"   Colors: Deep Navy, Royal Blue, Purple Accent\n")
    
    for i, slide in enumerate(SLIDES):
        create_slide(i + 1, slide)
    
    print(f"\n✅ Generated {len(SLIDES)} professional slide images!")
    print("   Ready for FFmpeg video generation\n")

if __name__ == "__main__":
    main()

