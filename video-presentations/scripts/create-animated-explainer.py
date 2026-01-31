#!/usr/bin/env python3
"""
Create an animated explainer video with text animations, moving graphics,
and visual effects - similar to whiteboard/doodle style videos.
"""

import os
from moviepy import *
from moviepy.video.fx import *
import numpy as np

# Paths
BASE_DIR = "/workspaces/WorldClass-ERP/video-presentations"
AUDIO_DIR = f"{BASE_DIR}/public/audio/voiceover"
MUSIC_FILE = f"{BASE_DIR}/public/audio/music/corporate-ambient-60s.wav"
OUTPUT = f"{BASE_DIR}/out/investor-pitch-animated.mp4"

# Brand colors
DEEP_NAVY = (30, 58, 138)       # #1e3a8a
ROYAL_BLUE = (30, 64, 175)      # #1e40af
PURPLE = (55, 48, 163)          # #3730a3
SKY_BLUE = (147, 197, 253)      # #93c5fd
WHITE = (255, 255, 255)
GOLD = (251, 191, 36)           # #fbbf24

# Convert RGB to MoviePy format (0-1)
def rgb(color):
    return tuple(c/255 for c in color)

# Scene content - each scene has title, bullets, and duration is from audio
SCENES = [
    {
        "audio": "01-title",
        "title": "SiyaBusa ERP",
        "subtitle": "Enterprise Software for Africa",
        "type": "title"
    },
    {
        "audio": "02-gap",
        "title": "The Problem",
        "bullets": [
            "African businesses struggle with fragmented systems",
            "Expensive Western solutions don't fit local needs",
            "Complex tax & compliance requirements",
            "Limited multi-currency support"
        ],
        "type": "problem"
    },
    {
        "audio": "03-what-it-does",
        "title": "The Solution",
        "bullets": [
            "All-in-one cloud ERP platform",
            "Built specifically for African markets",
            "25+ integrated business modules",
            "Local compliance built-in"
        ],
        "type": "solution"
    },
    {
        "audio": "04-architecture",
        "title": "Modern Architecture",
        "bullets": [
            "Cloud-native infrastructure",
            "Multi-tenant design",
            "Real-time data sync",
            "Mobile-first approach"
        ],
        "type": "content"
    },
    {
        "audio": "05-modules",
        "title": "Complete Module Suite",
        "bullets": [
            "Financial Accounting & GL",
            "Inventory & Warehouse",
            "Sales & CRM",
            "HR & Payroll",
            "Manufacturing & BOM"
        ],
        "type": "modules"
    },
    {
        "audio": "06-verticals",
        "title": "Industry Solutions",
        "bullets": [
            "Healthcare & Medical",
            "Mining & Resources",
            "Construction & Projects",
            "Agriculture & Farming",
            "Property Management"
        ],
        "type": "verticals"
    },
    {
        "audio": "07-compliance",
        "title": "Compliance & Security",
        "bullets": [
            "SARS eFiling Integration",
            "POPIA Data Protection",
            "IFRS & IAS Standards",
            "Complete Audit Trail"
        ],
        "type": "content"
    },
    {
        "audio": "08-ai",
        "title": "AI-Powered Assistant",
        "bullets": [
            "Natural language queries",
            "Automated reporting",
            "Smart recommendations",
            "Predictive analytics"
        ],
        "type": "ai"
    },
    {
        "audio": "09-journey",
        "title": "Our Journey",
        "bullets": [
            "400+ API endpoints built",
            "66 V2 controllers deployed",
            "Production-ready platform",
            "AWS infrastructure live"
        ],
        "type": "journey"
    },
    {
        "audio": "10-implementation",
        "title": "Easy Implementation",
        "bullets": [
            "30-day deployment",
            "Data migration support",
            "Training included",
            "24/7 support"
        ],
        "type": "content"
    },
    {
        "audio": "11-business-model",
        "title": "SaaS Business Model",
        "bullets": [
            "Monthly subscription",
            "Per-user pricing",
            "No upfront costs",
            "Scalable tiers"
        ],
        "type": "business"
    },
    {
        "audio": "12-market",
        "title": "Market Opportunity",
        "bullets": [
            "$10B+ African ERP market",
            "Growing 12% annually",
            "Low competition",
            "High demand"
        ],
        "type": "market"
    },
    {
        "audio": "13-traction",
        "title": "Traction",
        "bullets": [
            "Production platform live",
            "Pilot customers onboarding",
            "Strong pipeline",
            "Partnership discussions"
        ],
        "type": "traction"
    },
    {
        "audio": "14-roadmap",
        "title": "2026 Roadmap",
        "bullets": [
            "Q1: Seed funding round",
            "Q2: 10 paying customers",
            "Q3: Mobile app launch",
            "Q4: Regional expansion"
        ],
        "type": "roadmap"
    },
    {
        "audio": "15-why-win",
        "title": "Why We Win",
        "bullets": [
            "Local market expertise",
            "Complete solution",
            "Competitive pricing",
            "First-mover advantage"
        ],
        "type": "win"
    },
    {
        "audio": "16-contact",
        "title": "Let's Connect",
        "subtitle": "siyabusaerp.co.za",
        "tagline": "We Rule. We Govern. We Empower.",
        "type": "contact"
    }
]

def get_audio_duration(audio_file):
    """Get duration of audio file"""
    clip = AudioFileClip(audio_file)
    duration = clip.duration
    clip.close()
    return duration

def create_animated_text(text, fontsize, color, duration, delay=0):
    """Create text that types in letter by letter"""
    txt = TextClip(
        text=text,
        font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        font_size=fontsize,
        color=color,
        stroke_color='black',
        stroke_width=1
    )
    # Fade in effect
    txt = txt.with_duration(duration - delay).with_start(delay)
    txt = txt.with_effects([vfx.CrossFadeIn(0.5)])
    return txt

def create_bullet_animation(bullets, start_y, duration, scene_type):
    """Create animated bullet points that appear one by one"""
    clips = []
    bullet_delay = duration / (len(bullets) + 2)  # Space out bullets
    
    for i, bullet in enumerate(bullets):
        # Choose icon based on scene type
        icons = {
            "problem": "⚠️",
            "solution": "✅",
            "modules": "📦",
            "verticals": "🏢",
            "ai": "🤖",
            "journey": "🚀",
            "business": "💰",
            "market": "📈",
            "traction": "📊",
            "roadmap": "🗓️",
            "win": "🏆",
            "content": "▸"
        }
        icon = icons.get(scene_type, "▸")
        
        txt = TextClip(
            text=f"  {icon}  {bullet}",
            font="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            font_size=42,
            color="white"
        )
        
        delay = bullet_delay * (i + 1)
        txt = txt.with_duration(duration - delay).with_start(delay)
        txt = txt.with_position(("center", start_y + i * 70))
        txt = txt.with_effects([vfx.CrossFadeIn(0.4)])
        clips.append(txt)
    
    return clips

def create_title_scene(scene, duration):
    """Create animated title scene"""
    # Background gradient
    bg = ColorClip(size=(1920, 1080), color=rgb(DEEP_NAVY)).with_duration(duration)
    
    # Main title with animation
    title = TextClip(
        text=scene["title"],
        font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        font_size=120,
        color="white"
    ).with_duration(duration - 0.5).with_start(0.5)
    title = title.with_position(("center", 350))
    title = title.with_effects([vfx.CrossFadeIn(1.0)])
    
    # Subtitle
    subtitle = TextClip(
        text=scene.get("subtitle", ""),
        font="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        font_size=50,
        color=f"rgb{SKY_BLUE}"
    ).with_duration(duration - 1.5).with_start(1.5)
    subtitle = subtitle.with_position(("center", 520))
    subtitle = subtitle.with_effects([vfx.CrossFadeIn(0.8)])
    
    # Tagline if exists
    clips = [bg, title, subtitle]
    
    if "tagline" in scene:
        tagline = TextClip(
            text=scene["tagline"],
            font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            font_size=36,
            color=f"rgb{GOLD}"
        ).with_duration(duration - 2.5).with_start(2.5)
        tagline = tagline.with_position(("center", 650))
        tagline = tagline.with_effects([vfx.CrossFadeIn(0.6)])
        clips.append(tagline)
    
    return CompositeVideoClip(clips)

def create_content_scene(scene, duration):
    """Create animated content scene with bullets"""
    # Background
    bg_color = PURPLE if SCENES.index(scene) % 2 == 0 else ROYAL_BLUE
    bg = ColorClip(size=(1920, 1080), color=rgb(bg_color)).with_duration(duration)
    
    # Title
    title = TextClip(
        text=scene["title"],
        font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        font_size=72,
        color="white"
    ).with_duration(duration - 0.3).with_start(0.3)
    title = title.with_position(("center", 120))
    title = title.with_effects([vfx.CrossFadeIn(0.5)])
    
    # Accent line under title
    line = ColorClip(size=(400, 4), color=rgb(GOLD)).with_duration(duration - 0.5).with_start(0.5)
    line = line.with_position(("center", 220))
    line = line.with_effects([vfx.CrossFadeIn(0.3)])
    
    clips = [bg, title, line]
    
    # Animated bullets
    if "bullets" in scene:
        bullet_clips = create_bullet_animation(
            scene["bullets"], 
            300, 
            duration,
            scene.get("type", "content")
        )
        clips.extend(bullet_clips)
    
    return CompositeVideoClip(clips)

def create_contact_scene(scene, duration):
    """Create contact/closing scene"""
    bg = ColorClip(size=(1920, 1080), color=rgb(DEEP_NAVY)).with_duration(duration)
    
    # Title
    title = TextClip(
        text=scene["title"],
        font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        font_size=80,
        color="white"
    ).with_duration(duration - 0.5).with_start(0.5)
    title = title.with_position(("center", 280))
    title = title.with_effects([vfx.CrossFadeIn(0.8)])
    
    # Website
    website = TextClip(
        text=scene.get("subtitle", ""),
        font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        font_size=60,
        color=f"rgb{SKY_BLUE}"
    ).with_duration(duration - 1.5).with_start(1.5)
    website = website.with_position(("center", 450))
    website = website.with_effects([vfx.CrossFadeIn(0.6)])
    
    # Tagline
    tagline = TextClip(
        text=scene.get("tagline", ""),
        font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        font_size=40,
        color=f"rgb{GOLD}"
    ).with_duration(duration - 2.5).with_start(2.5)
    tagline = tagline.with_position(("center", 600))
    tagline = tagline.with_effects([vfx.CrossFadeIn(0.5)])
    
    return CompositeVideoClip([bg, title, website, tagline])

def main():
    print("🎬 Creating Animated Explainer Video")
    print("=" * 50)
    
    scene_clips = []
    
    for i, scene in enumerate(SCENES):
        audio_file = f"{AUDIO_DIR}/{scene['audio']}.mp3"
        duration = get_audio_duration(audio_file)
        
        print(f"  Scene {i+1:02d}: {scene['title']} ({duration:.1f}s)")
        
        # Create scene based on type
        if scene["type"] == "title":
            video = create_title_scene(scene, duration)
        elif scene["type"] == "contact":
            video = create_contact_scene(scene, duration)
        else:
            video = create_content_scene(scene, duration)
        
        # Add audio
        audio = AudioFileClip(audio_file)
        video = video.with_audio(audio)
        
        scene_clips.append(video)
    
    print("\n🔗 Concatenating scenes...")
    final_video = concatenate_videoclips(scene_clips, method="compose")
    
    # Add background music
    print("🎵 Adding background music...")
    music = AudioFileClip(MUSIC_FILE).with_effects([afx.AudioLoop(duration=final_video.duration)])
    music = music.with_effects([afx.MultiplyVolume(0.12)])  # 12% volume
    
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
