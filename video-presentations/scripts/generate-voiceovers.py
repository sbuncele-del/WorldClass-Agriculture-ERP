#!/usr/bin/env python3
"""
SiyaBusa Video Presentation - Voiceover Generator
Uses Amazon Polly Neural TTS for professional-quality voiceovers
"""

import boto3
import os
from pathlib import Path
from contextlib import closing

# Create output directory
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "audio" / "voiceover"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Voice selection - Amazon Polly Neural Voices
# Options: Matthew (US Male), Joanna (US Female), Amy (British Female), Brian (British Male)
VOICE = "Matthew"  # US Male Neural Voice - Professional and authoritative
ENGINE = "neural"  # Use neural engine for best quality

# Voiceover scripts for each slide (timed to match animations)
VOICEOVER_SCRIPTS = {
    "01-title": {
        "text": '<speak>See-ya-boo-sa ERP. Enterprise Resource Planning, designed for Africa. Seed Investment Round, Q1 2026.</speak>'
    },
    "02-problem": {
        "text": "<speak>Over sixty thousand mid-market businesses in South Africa are stuck. Enterprise ERP systems cost fifty to two hundred thousand rand per month, plus expensive localization. Basic accounting software is affordable, but lacks critical features. The result? Disconnected systems, inefficiency, and compliance risk.</speak>"
    },
    "03-solution": {
        "text": '<speak>See-ya-boo-sa is the solution. A full ERP suite with twenty-five plus integrated modules. Native South African compliance built in. AI-powered intelligence. Cloud-native architecture. More than basic accounting. Less than enterprise pricing.</speak>'
    },
    "04-modules": {
        "text": "<speak>Twenty-five plus integrated modules. Finance, Operations, Human Resources, Compliance, Industry verticals, and Platform features. Everything your business needs, in one unified platform.</speak>"
    },
    "05-market": {
        "text": '<speak>The market opportunity is massive. Eight point six four billion rand total addressable market. Sixty thousand plus target businesses. Revenue range ten to five hundred million rand. See-ya-boo-sa fills the gap between enterprise and basic solutions, perfectly.</speak>'
    },
    "06-differentiators": {
        "text": '<speak>Why See-ya-boo-sa wins. Native South African compliance, saving up to two million rand in localization. Best value pricing at forty percent lower cost. AI-powered intelligence with twenty-four-seven assistance. Modern cloud-native architecture with no on-premise infrastructure.</speak>'
    },
    "07-roadmap": {
        "text": "<speak>Our path to JSE AltX listing. Seed round in Q1 2026. First customers in Q2. Growth to twenty-five customers by year end. Series A in 2028. Scale to two hundred customers. AltX IPO by Q2 2029.</speak>"
    },
    "08-financials": {
        "text": "<speak>Conservative growth projections. Twenty-five customers and one point eight million ARR in 2026. Eighty customers and eleven point five million ARR in 2027. Two hundred customers and twenty-eight point eight million ARR by 2028. Profitability expected in Q2 2027.</speak>"
    },
    "09-investment": {
        "text": "<speak>The investment opportunity. Seed round of two million rand at ten million pre-money valuation. Sixteen point six seven percent equity offered. Funds will drive sales, team expansion, operations, and product enhancement. Target returns: twenty x or more via JSE AltX IPO.</speak>"
    },
    "10-contact": {
        "text": '<speak>Thank you. Let\'s build the future of African enterprise together. Contact us at investor at see-ya-boo-sa dot co dot za or visit www dot see-ya-boo-sa dot co dot za. Request a demo today.</speak>'
    },
    "teaser": {
        "text": '<speak>See-ya-boo-sa ERP. Sixty thousand businesses need better solutions. Full ERP, native South African compliance, AI-powered. Eight point six four billion rand market. Seed round open. Two million rand at ten million valuation. Twenty x plus target return. Contact investor at see-ya-boo-sa dot co dot za.</speak>'
    }
}

async def generate_voiceover(name: str, config: dict):
    """Generate a single voiceover file"""
    output_path = OUTPUT_DIR / f"{name}.mp3"
    
    print(f"Generating voiceover: {name}...")
    
    communicate = edge_tts.Communicate(
        text=config["text"],
        voice=VOICE,
        rate=config.get("rate", "+0%"),
        pitch=config.get("pitch", "+0Hz")
    )
    
    await communicate.save(str(output_path))
    print(f"  ✓ Saved to {output_path}")
    
    return output_path

async def generate_all_voiceovers():
    """Generate all voiceover files"""
def generate_voiceover(name: str, config: dict, polly_client):
    """Generate a single voiceover file using Amazon Polly"""
    output_path = OUTPUT_DIR / f"{name}.mp3"
    
    print(f"Generating voiceover: {name}...")
    
    try:
        response = polly_client.synthesize_speech(
            Text=config["text"],
            OutputFormat="mp3",
            VoiceId=VOICE,
            Engine=ENGINE,
            TextType="ssml"
        )
        
        if "AudioStream" in response:
            with closing(response["AudioStream"]) as stream:
                with open(str(output_path), "wb") as file:
                    file.write(stream.read())
            print(f"  ✓ Saved to {output_path}")
            return output_path
        else:
            print(f"  ✗ Failed to generate {name}")
            return None
            
    except Exception as e:
        print(f"  ✗ Error generating {name}: {str(e)}")
        return None

def generate_all_voiceovers():
    """Generate all voiceover files"""
    print(f"\n🎙️  SiyaBusa Voiceover Generator (Amazon Polly)")
    print(f"   Voice: {VOICE} ({ENGINE})")
    print(f"   Output: {OUTPUT_DIR}\n")
    
    # Initialize Polly client
    polly_client = boto3.client('polly', region_name='eu-north-1')
    
    results = []
    for name, config in VOICEOVER_SCRIPTS.items():
        result = generate_voiceover(name, config, polly_client)
        if result:
            results.append(result)
    
    print(f"\n✅ Generated {len(results)} voiceover files!")
    print(f"\nFiles ready for use in Remotion video compositions.")

if __name__ == "__main__":
    generate_all_voiceovers()
