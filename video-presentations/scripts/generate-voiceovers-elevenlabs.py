#!/usr/bin/env python3
"""
SiyaBusa Video Presentation - Voiceover Generator
Uses ElevenLabs for ultra-realistic professional voiceovers
"""

from elevenlabs.client import ElevenLabs
import os
from pathlib import Path

# Create output directory
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "audio" / "voiceover"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ElevenLabs API Key
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY", "")

# Voice selection - Roger: Professional and resonant
VOICE_NAME = "CwhRBWXzGAHq8TQ4Fs17"

# Voiceover scripts (reduced brand name mentions for better pronunciation)
VOICEOVER_SCRIPTS = {
    "01-title": "Enterprise Resource Planning, designed for Africa. Seed investment round, quarter one twenty twenty six.",
    "02-gap": "South African mid-market companies face two bad choices. Enterprise ERP at fifty to two hundred thousand rand per month, with six to eighteen month rollouts and costly localization. Or basic accounting tools with no operations, no warehouse, no payroll, no compliance. The result: disconnected systems, manual SARS prep, compliance risk, and slow decisions.",
    "03-what-it-does": "This platform unifies finance, operations, people, and compliance in one cloud system. Native South African compliance is built in: VAT, PAYE, UIF, SDL, POPIA, B-BBEE. An AI assistant plus nine domain agents answer questions and take actions, from drafting purchase orders to preparing SARS-ready files.",
    "04-architecture": "The platform is cloud-native on AWS: EC2 for compute, Postgres for data, S3 for storage, Redis for speed. Multi-tenant isolation is designed in. Four hundred plus REST APIs make integration straightforward. Docker everywhere for portability and fast deployments.",
    "05-modules": "Modules that matter. Finance: general ledger, accounts payable and receivable, cash management, treasury, multi-entity. Operations: inventory, warehouse, manufacturing, projects, logistics. People: HR, payroll, leave, performance. Compliance and audit hubs tie everything together with full traceability.",
    "06-verticals": "Industry playbooks are included. Healthcare: patient journeys, claims, pharmacy stock. Mining: mineral tracking, safety, shaft operations. Construction and property: project costing, progress billing, leases and maintenance. Manufacturing: production planning and shop floor control. Practice management for professional services.",
    "07-compliance": "Compliance is native. SARS Sentinel keeps deadlines visible and prepares submission files. Audit Ready captures full audit trails, evidence, and findings. Regulatory Hub tracks POPIA, FICA, King Four, and B-BBEE scorecards. No expensive localization project required.",
    "08-ai": "AI that works today. Ask in plain language: what were sales last month, which customers are overdue, how much stock is at risk, what is cash on hand. Nine domain agents cover sales, finance, HR, procurement, analytics, treasury, logistics, compliance, and support. They surface risks, draft purchase orders, and prep SARS-ready exports.",
    "09-journey": "Customer journey. Discovery: walkthrough processes and fit assessment. Configure: chart of accounts, roles, approvals, tax settings, document templates. Go-live: migrate data, train teams, activate hypercare. A modern ERP without the usual twelve month slog.",
    "10-implementation": "Implementation speed. The platform is production-ready today on AWS. Typical rollout: two to six weeks, not six to eighteen months. Each industry has a playbook so configuration is faster and less risky.",
    "11-business-model": "Business model. Per-user SaaS pricing at roughly forty percent below global peers. Implementation from twenty five thousand to one hundred fifty thousand rand depending on scope. Recurring success and support included so customers stay live and confident.",
    "12-market": "Market opportunity. South African ERP market is four hundred fifty million dollars a year. The mid-market wedge is one hundred eighty million dollars and underserved. Ideal customers: fifty to five hundred employees, revenue ten to five hundred million rand, too big for Xero, too cost sensitive for SAP.",
    "13-traction": "Traction and readiness. Product complete: twenty five plus modules and over four hundred APIs. AWS live: EC2, RDS, S3, Dockerized. Documentation ready: investor PDFs, deployment guides, playbooks. Multi-tenant architecture and audit trails built in.",
    "14-roadmap": "Roadmap twenty twenty six to twenty twenty nine. Quarter one: seed round, ten beta partners. Quarter two: fifteen paying customers, one hundred fifty thousand monthly recurring revenue. Twenty twenty eight: Series A and two hundred customers. Twenty twenty nine: AltX path.",
    "15-why-win": "Why we win. Right-sized: full ERP without enterprise bloat. Local-first: compliance is native, not a bolt-on. Modern UX plus AI: faster adoption and lower support cost. Faster time to value than any enterprise alternative in this market.",
    "16-contact": "Let's build the future of African enterprise together. Website: siyabusaerp dot co dot za. Request a demo today. We rule. We govern. We empower."
}

def generate_voiceover(name: str, text: str, client):
    """Generate a single voiceover file using ElevenLabs"""
    output_path = OUTPUT_DIR / f"{name}.mp3"
    
    print(f"Generating voiceover: {name}...")
    
    try:
        audio = client.text_to_speech.convert(
            text=text,
            voice_id=VOICE_NAME,
            model_id="eleven_turbo_v2_5"
        )
        
        with open(str(output_path), "wb") as f:
            for chunk in audio:
                f.write(chunk)
        
        print(f"  ✓ Saved to {output_path}")
        return output_path
        
    except Exception as e:
        print(f"  ✗ Error generating {name}: {str(e)}")
        return None

def generate_all_voiceovers():
    """Generate all voiceover files"""
    print(f"\n🎙️  Voiceover Generator (ElevenLabs)")
    print(f"   Voice: {VOICE_NAME}")
    print(f"   Output: {OUTPUT_DIR}\n")
    
    if not ELEVEN_API_KEY:
        print("❌ ELEVEN_API_KEY environment variable not set!")
        return
    
    client = ElevenLabs(api_key=ELEVEN_API_KEY)
    
    results = []
    for name, text in VOICEOVER_SCRIPTS.items():
        result = generate_voiceover(name, text, client)
        if result:
            results.append(result)
    
    print(f"\n✅ Generated {len(results)} voiceover files!")

if __name__ == "__main__":
    generate_all_voiceovers()
