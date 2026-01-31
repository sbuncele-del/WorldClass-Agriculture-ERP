#!/usr/bin/env python3
"""
Create professional animated explainer video with:
- Animated graphics and icons
- Text reveal animations
- Smooth transitions
- Background music
- Female voiceover
"""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import *
from moviepy.video.fx import *
import math

# Paths
BASE_DIR = "/workspaces/WorldClass-ERP/video-presentations"
AUDIO_DIR = f"{BASE_DIR}/public/audio/voiceover-v2"
MUSIC_FILE = f"{BASE_DIR}/public/audio/music/corporate-ambient-60s.wav"
OUTPUT = f"{BASE_DIR}/out/investor-pitch-v2.mp4"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# Brand colors (RGB tuples for PIL)
DEEP_NAVY = (30, 58, 138)
ROYAL_BLUE = (30, 64, 175)
PURPLE = (55, 48, 163)
SKY_BLUE = (147, 197, 253)
WHITE = (255, 255, 255)
GOLD = (251, 191, 36)
DARK_BG = (15, 23, 42)

# Scene definitions with visual descriptions
SCENES = [
    {"audio": "01-intro", "title": "Welcome", "visual": "intro"},
    {"audio": "02-hook", "title": "The Question", "visual": "question"},
    {"audio": "03-problem", "title": "The Problem", "visual": "problem"},
    {"audio": "04-solution", "title": "Our Solution", "visual": "solution"},
    {"audio": "05-how-it-works", "title": "How It Works", "visual": "architecture"},
    {"audio": "06-modules", "title": "25+ Modules", "visual": "modules"},
    {"audio": "07-verticals", "title": "Industry Solutions", "visual": "verticals"},
    {"audio": "08-compliance", "title": "Compliance Built-In", "visual": "compliance"},
    {"audio": "09-ai", "title": "AI-Powered", "visual": "ai"},
    {"audio": "10-traction", "title": "Where We Are", "visual": "traction"},
    {"audio": "11-business-model", "title": "Business Model", "visual": "business"},
    {"audio": "12-market", "title": "Market Opportunity", "visual": "market"},
    {"audio": "13-roadmap", "title": "2026 Roadmap", "visual": "roadmap"},
    {"audio": "14-why-us", "title": "Why We Win", "visual": "win"},
    {"audio": "15-ask", "title": "The Ask", "visual": "ask"},
    {"audio": "16-closing", "title": "Let's Connect", "visual": "closing"},
]

def create_gradient_background(width, height, color1, color2, vertical=True):
    """Create a smooth gradient background"""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    for i in range(height if vertical else width):
        ratio = i / (height if vertical else width)
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        
        if vertical:
            draw.line([(0, i), (width, i)], fill=(r, g, b))
        else:
            draw.line([(i, 0), (i, height)], fill=(r, g, b))
    
    return img

def draw_circle_icon(draw, x, y, radius, color, icon_type="check"):
    """Draw an animated-style circle icon"""
    # Circle background
    draw.ellipse([x-radius, y-radius, x+radius, y+radius], fill=color)
    
    # Icon inside
    inner_color = WHITE
    if icon_type == "check":
        # Checkmark
        draw.line([(x-radius//2, y), (x-radius//4, y+radius//3), (x+radius//2, y-radius//3)], 
                  fill=inner_color, width=4)
    elif icon_type == "arrow":
        # Arrow right
        draw.polygon([(x-radius//3, y-radius//3), (x+radius//3, y), (x-radius//3, y+radius//3)], 
                    fill=inner_color)

def draw_animated_chart(draw, x, y, width, height, values, colors):
    """Draw a simple animated-style bar chart"""
    bar_width = width // len(values) - 10
    for i, (val, color) in enumerate(zip(values, colors)):
        bar_height = int(height * val)
        bx = x + i * (bar_width + 10)
        by = y + height - bar_height
        draw.rectangle([bx, by, bx + bar_width, y + height], fill=color)

def create_scene_frame(scene_data, width=1920, height=1080):
    """Create a single frame for a scene"""
    visual = scene_data["visual"]
    title = scene_data["title"]
    
    # Create gradient background
    if visual in ["intro", "closing"]:
        img = create_gradient_background(width, height, DEEP_NAVY, (10, 30, 80))
    elif visual in ["problem", "question"]:
        img = create_gradient_background(width, height, (40, 20, 60), PURPLE)
    elif visual in ["solution", "modules", "architecture"]:
        img = create_gradient_background(width, height, ROYAL_BLUE, DEEP_NAVY)
    else:
        img = create_gradient_background(width, height, DEEP_NAVY, PURPLE)
    
    draw = ImageDraw.Draw(img)
    
    # Load fonts
    try:
        font_title = ImageFont.truetype(FONT_BOLD, 72)
        font_subtitle = ImageFont.truetype(FONT_REGULAR, 36)
        font_large = ImageFont.truetype(FONT_BOLD, 120)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = font_title
        font_large = font_title
    
    # Draw decorative elements based on visual type
    if visual == "intro":
        # Welcome screen with logo-style text
        draw.text((width//2, height//2 - 100), "SiyaBusa", font=font_large, 
                  fill=WHITE, anchor="mm")
        draw.text((width//2, height//2 + 50), "Enterprise Resource Planning", 
                  font=font_subtitle, fill=SKY_BLUE, anchor="mm")
        draw.text((width//2, height//2 + 120), "Built for Africa", 
                  font=font_subtitle, fill=GOLD, anchor="mm")
        # Decorative line
        draw.rectangle([width//2 - 200, height//2 + 180, width//2 + 200, height//2 + 184], fill=GOLD)
        
    elif visual == "question":
        # Question mark visual
        draw.text((width//2, 200), "?", font=ImageFont.truetype(FONT_BOLD, 200), 
                  fill=GOLD, anchor="mm")
        draw.text((width//2, height//2), "How do African businesses", 
                  font=font_title, fill=WHITE, anchor="mm")
        draw.text((width//2, height//2 + 80), "manage their operations?", 
                  font=font_title, fill=SKY_BLUE, anchor="mm")
                  
    elif visual == "problem":
        draw.text((width//2, 150), "THE PROBLEM", font=font_title, fill=GOLD, anchor="mm")
        # Problem icons
        problems = ["Outdated Systems", "Expensive Software", "No Local Support", "Compliance Gaps"]
        for i, prob in enumerate(problems):
            y = 350 + i * 120
            draw.ellipse([200, y-30, 260, y+30], fill=(200, 50, 50))
            draw.text((150, y), "✗", font=font_subtitle, fill=WHITE, anchor="mm")
            draw.text((300, y), prob, font=font_subtitle, fill=WHITE, anchor="lm")
            
    elif visual == "solution":
        draw.text((width//2, 150), "THE SOLUTION", font=font_title, fill=GOLD, anchor="mm")
        # Solution - central circle with connections
        cx, cy = width//2, height//2 + 50
        draw.ellipse([cx-100, cy-100, cx+100, cy+100], fill=GOLD)
        draw.text((cx, cy), "ERP", font=font_title, fill=DEEP_NAVY, anchor="mm")
        # Surrounding modules
        modules = ["Finance", "HR", "Sales", "Inventory", "Mfg"]
        for i, mod in enumerate(modules):
            angle = i * (2 * math.pi / len(modules)) - math.pi/2
            mx = cx + int(250 * math.cos(angle))
            my = cy + int(250 * math.sin(angle))
            draw.ellipse([mx-50, my-50, mx+50, my+50], fill=SKY_BLUE)
            draw.text((mx, my), mod[:3], font=font_subtitle, fill=DEEP_NAVY, anchor="mm")
            # Connection line
            draw.line([(cx, cy), (mx, my)], fill=WHITE, width=2)
            
    elif visual == "modules":
        draw.text((width//2, 100), "25+ INTEGRATED MODULES", font=font_title, fill=GOLD, anchor="mm")
        # Module grid
        modules = ["📊 Finance", "📦 Inventory", "💼 Sales", "👥 HR", "🏭 Manufacturing",
                   "📈 Analytics", "🛒 Procurement", "📋 Projects", "🏥 Healthcare", "⛏️ Mining"]
        cols = 5
        for i, mod in enumerate(modules):
            row, col = i // cols, i % cols
            x = 200 + col * 320
            y = 300 + row * 200
            draw.rounded_rectangle([x, y, x+280, y+150], radius=15, fill=(40, 60, 120))
            draw.text((x+140, y+75), mod, font=font_subtitle, fill=WHITE, anchor="mm")
            
    elif visual == "compliance":
        draw.text((width//2, 150), "COMPLIANCE BUILT-IN", font=font_title, fill=GOLD, anchor="mm")
        items = [("✓ SARS", "e-Filing Integration"), ("✓ POPIA", "Data Protection"),
                 ("✓ IFRS", "Accounting Standards"), ("✓ Audit", "Complete Trail")]
        for i, (check, desc) in enumerate(items):
            y = 350 + i * 130
            draw.rounded_rectangle([300, y-40, 1620, y+40], radius=10, fill=(30, 80, 60))
            draw.text((350, y), check, font=font_subtitle, fill=(100, 255, 100), anchor="lm")
            draw.text((550, y), desc, font=font_subtitle, fill=WHITE, anchor="lm")
            
    elif visual == "ai":
        draw.text((width//2, 150), "AI-POWERED ASSISTANT", font=font_title, fill=GOLD, anchor="mm")
        # AI brain visual
        draw.ellipse([width//2-150, 350, width//2+150, 650], outline=SKY_BLUE, width=4)
        draw.text((width//2, 500), "🤖", font=ImageFont.truetype(FONT_BOLD, 100), fill=WHITE, anchor="mm")
        draw.text((width//2, 750), "\"Show me last month's top customers\"", 
                  font=font_subtitle, fill=SKY_BLUE, anchor="mm")
        draw.text((width//2, 850), "Natural Language • Smart Recommendations • 24/7", 
                  font=font_subtitle, fill=WHITE, anchor="mm")
                  
    elif visual == "traction":
        draw.text((width//2, 150), "WHERE WE ARE TODAY", font=font_title, fill=GOLD, anchor="mm")
        stats = [("400+", "API Endpoints"), ("66", "Controllers"), ("Live", "on AWS")]
        for i, (num, label) in enumerate(stats):
            x = 400 + i * 400
            draw.text((x, 450), num, font=font_large, fill=GOLD, anchor="mm")
            draw.text((x, 550), label, font=font_subtitle, fill=WHITE, anchor="mm")
            
    elif visual == "market":
        draw.text((width//2, 150), "MARKET OPPORTUNITY", font=font_title, fill=GOLD, anchor="mm")
        draw.text((width//2, 400), "$10B+", font=font_large, fill=GOLD, anchor="mm")
        draw.text((width//2, 520), "African ERP Market", font=font_subtitle, fill=WHITE, anchor="mm")
        draw.text((width//2, 650), "📈 12% Annual Growth", font=font_subtitle, fill=SKY_BLUE, anchor="mm")
        draw.text((width//2, 750), "🌍 Massive Untapped Potential", font=font_subtitle, fill=SKY_BLUE, anchor="mm")
        
    elif visual == "roadmap":
        draw.text((width//2, 100), "2026 ROADMAP", font=font_title, fill=GOLD, anchor="mm")
        quarters = [("Q1", "Seed Funding", GOLD), ("Q2", "10 Customers", SKY_BLUE),
                    ("Q3", "Mobile App", SKY_BLUE), ("Q4", "Regional Expansion", SKY_BLUE)]
        for i, (q, desc, color) in enumerate(quarters):
            x = 250 + i * 400
            # Timeline dot
            draw.ellipse([x-20, 400, x+20, 440], fill=color)
            if i < 3:
                draw.line([(x+20, 420), (x+380, 420)], fill=WHITE, width=3)
            draw.text((x, 500), q, font=font_title, fill=color, anchor="mm")
            draw.text((x, 580), desc, font=font_subtitle, fill=WHITE, anchor="mm")
            
    elif visual == "win":
        draw.text((width//2, 150), "WHY WE WIN", font=font_title, fill=GOLD, anchor="mm")
        reasons = ["🎯 Local Market Expertise", "🔧 Complete Solution", 
                   "💰 Competitive Pricing", "🚀 First Mover Advantage"]
        for i, reason in enumerate(reasons):
            y = 350 + i * 130
            draw.rounded_rectangle([400, y-40, 1520, y+40], radius=20, fill=(40, 80, 40))
            draw.text((width//2, y), reason, font=font_subtitle, fill=WHITE, anchor="mm")
            
    elif visual == "ask":
        draw.text((width//2, 300), "THE ASK", font=font_title, fill=GOLD, anchor="mm")
        draw.text((width//2, 500), "Seed Funding", font=font_large, fill=WHITE, anchor="mm")
        draw.text((width//2, 650), "To accelerate growth and capture", font=font_subtitle, fill=SKY_BLUE, anchor="mm")
        draw.text((width//2, 720), "this massive market opportunity", font=font_subtitle, fill=SKY_BLUE, anchor="mm")
        
    elif visual == "closing":
        draw.text((width//2, 250), "Let's Build Together", font=font_large, fill=WHITE, anchor="mm")
        draw.text((width//2, 450), "siyabusaerp.co.za", font=font_title, fill=GOLD, anchor="mm")
        draw.rectangle([width//2 - 250, 530, width//2 + 250, 534], fill=GOLD)
        draw.text((width//2, 650), "We Rule. We Govern. We Empower.", font=font_subtitle, fill=SKY_BLUE, anchor="mm")
        draw.text((width//2, 800), "Thank You!", font=font_title, fill=WHITE, anchor="mm")
    
    else:
        # Default
        draw.text((width//2, height//2), title, font=font_title, fill=WHITE, anchor="mm")
    
    return img

def create_animated_scene(scene_data, duration):
    """Create an animated scene with zoom and fade effects"""
    # Create the frame
    frame = create_scene_frame(scene_data)
    frame_array = np.array(frame)
    
    # Create video clip with zoom effect
    def make_frame(t):
        # Subtle zoom: start at 100%, end at 105%
        zoom = 1 + 0.05 * (t / duration)
        h, w = frame_array.shape[:2]
        
        # Calculate crop region
        new_h = int(h / zoom)
        new_w = int(w / zoom)
        y1 = (h - new_h) // 2
        x1 = (w - new_w) // 2
        
        # Crop and resize back
        cropped = frame_array[y1:y1+new_h, x1:x1+new_w]
        
        # Resize back to original
        from PIL import Image
        img = Image.fromarray(cropped)
        img = img.resize((w, h), Image.Resampling.LANCZOS)
        return np.array(img)
    
    clip = VideoClip(make_frame, duration=duration).with_fps(30)
    
    # Add fade effects
    clip = clip.with_effects([vfx.CrossFadeIn(0.5), vfx.CrossFadeOut(0.5)])
    
    return clip

def get_audio_duration(audio_file):
    """Get duration of audio file"""
    clip = AudioFileClip(audio_file)
    duration = clip.duration
    clip.close()
    return duration

def main():
    print("🎬 Creating Professional Animated Video")
    print("=" * 50)
    
    scene_clips = []
    
    for i, scene in enumerate(SCENES):
        audio_file = f"{AUDIO_DIR}/{scene['audio']}.mp3"
        duration = get_audio_duration(audio_file)
        
        print(f"  Scene {i+1:02d}: {scene['title']} ({duration:.1f}s)")
        
        # Create animated scene
        video = create_animated_scene(scene, duration)
        
        # Add audio
        audio = AudioFileClip(audio_file)
        video = video.with_audio(audio)
        
        scene_clips.append(video)
    
    print("\n🔗 Concatenating scenes...")
    final_video = concatenate_videoclips(scene_clips, method="compose")
    
    # Add background music
    print("🎵 Adding background music...")
    music = AudioFileClip(MUSIC_FILE).with_effects([afx.AudioLoop(duration=final_video.duration)])
    music = music.with_effects([afx.MultiplyVolume(0.08)])  # 8% volume (subtle)
    
    # Mix voiceover with music
    final_audio = CompositeAudioClip([final_video.audio, music])
    final_video = final_video.with_audio(final_audio)
    
    print(f"\n📹 Rendering video ({final_video.duration:.0f}s)...")
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
