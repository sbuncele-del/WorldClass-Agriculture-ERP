#!/usr/bin/env python3
"""
Generate conversational voiceovers using Edge TTS (Microsoft)
Female voice: en-GB-SoniaNeural (British, professional)
"""

import asyncio
import edge_tts
import os

OUTPUT_DIR = "/workspaces/WorldClass-ERP/video-presentations/public/audio/voiceover-v2"
VOICE = "en-GB-SoniaNeural"  # Professional British female voice

# Conversational, human script - like talking to an investor
SCRIPTS = {
    "01-intro": """
Hi there! Thank you so much for taking the time to watch this. 
I really appreciate the opportunity to share our vision with you.
My name is Sarah, and today I want to tell you about something 
we've been building that I'm genuinely excited about.
""",

    "02-hook": """
So let me ask you something. Have you ever thought about how 
businesses in Africa manage their operations? I'm talking about 
inventory, payroll, accounting, sales, all of it. 
The truth is, most are struggling with outdated systems, 
spreadsheets everywhere, and software that was never designed 
for African markets.
""",

    "03-problem": """
Here's the reality. African businesses are growing fast, 
but they're being held back by technology that doesn't fit. 
Western enterprise software costs a fortune, doesn't handle 
local tax requirements like SARS in South Africa, 
and honestly, it just wasn't built with African businesses in mind. 
We saw this gap, and we knew we had to do something about it.
""",

    "04-solution": """
That's why we built this platform. A complete enterprise 
resource planning system designed specifically for Africa. 
One platform that handles everything a business needs. 
Inventory management, financial accounting, HR and payroll, 
sales and customer relationships, manufacturing. 
All integrated, all in one place.
""",

    "05-how-it-works": """
Now, let me show you what makes this different. 
We're not just another ERP slapped together. 
We've built this from the ground up with modern cloud technology. 
It's multi-tenant, which means we can scale efficiently. 
It's mobile-first because that's how Africa does business. 
And most importantly, it understands local compliance 
right out of the box.
""",

    "06-modules": """
In terms of capabilities, we've got over 25 integrated modules. 
Think about it. Financial accounting with general ledger, 
inventory and warehouse management with real-time tracking, 
sales with CRM built in, procurement and supplier management, 
HR with full payroll processing. And the best part? 
They all talk to each other seamlessly.
""",

    "07-verticals": """
But here's where it gets really interesting. 
We haven't just built generic software. 
We've created specialized solutions for key African industries. 
Healthcare facilities managing patient records and medical inventory. 
Mining operations tracking minerals and safety compliance. 
Construction companies doing project costing. 
Agricultural businesses managing crops and farm operations. 
Even property management with lease tracking and tenant billing.
""",

    "08-compliance": """
Now, compliance. This is huge, and it's something our competitors 
completely miss. We've built in SARS e-filing integration for 
South African businesses. POPIA data protection is baked right in. 
We follow IFRS accounting standards. Every single transaction 
is tracked with a complete audit trail. For African businesses, 
this isn't a nice to have. It's essential.
""",

    "09-ai": """
And because we're building for the future, we've integrated 
AI capabilities throughout the platform. Users can ask questions 
in plain English. Things like show me last month's top customers 
or which products are running low. And get instant answers. 
The system provides smart recommendations and predictive analytics. 
It's like having a business advisor available twenty-four seven.
""",

    "10-traction": """
Now let me tell you where we are today. 
This isn't just a concept or a prototype. 
We have a production-ready platform live on AWS. 
We've built over 400 API endpoints, 66 controllers, 
and the full infrastructure is operational. 
We're onboarding pilot customers and the feedback has been incredible. 
We're seeing real businesses transform their operations.
""",

    "11-business-model": """
Our business model is straightforward SaaS, 
software as a service with monthly subscriptions. 
We price per user, which scales with our customers. 
No massive upfront costs that African businesses can't afford. 
They pay as they grow, and we grow with them. 
It's a model that just makes sense for this market.
""",

    "12-market": """
Let's talk about the opportunity here. 
The African ERP market is valued at over 10 billion dollars 
and growing at 12 percent annually. Digital transformation 
is accelerating across the continent. Small and medium businesses 
are desperate for affordable, local solutions. 
And honestly? The competition isn't keeping up. 
There's a massive gap waiting to be filled.
""",

    "13-roadmap": """
Looking ahead to our roadmap. We're raising seed funding this quarter. 
By Q2, we're targeting 10 paying customers. 
Q3, we launch our mobile app for on-the-go access. 
And by Q4, we begin regional expansion beyond South Africa. 
We've got a clear path forward and we're executing on it.
""",

    "14-why-us": """
So why will we win? First, we have deep local market expertise. 
We understand African business. Second, we offer a complete solution, 
not piecemeal software. Third, our pricing is competitive 
and accessible. And fourth, we're first movers in building 
enterprise software specifically for this market. 
That combination is powerful.
""",

    "15-ask": """
Here's what we're asking for. We're raising seed funding 
to accelerate our growth. To expand our sales team, 
enhance the platform, and capture this market opportunity. 
This is a chance to get in early on something that could 
transform how African businesses operate.
""",

    "16-closing": """
Thank you so much for your time today. 
I would love to continue this conversation and answer 
any questions you might have. You can reach us at 
siyabusaerp.co.za. We rule. We govern. We empower. 
Let's build the future of African enterprise together. 
Thanks again!
"""
}

async def generate_voiceover(name, text):
    """Generate voiceover using Edge TTS"""
    output_path = f"{OUTPUT_DIR}/{name}.mp3"
    
    communicate = edge_tts.Communicate(
        text.strip(), 
        VOICE,
        rate="-5%",  # Slightly slower for clarity
        pitch="+0Hz"
    )
    await communicate.save(output_path)
    return output_path

async def main():
    print("🎙️  Conversational Voiceover Generator (Edge TTS)")
    print(f"   Voice: {VOICE} (Female, Professional)")
    print(f"   Output: {OUTPUT_DIR}")
    print("")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for name, script in SCRIPTS.items():
        print(f"Generating: {name}...")
        try:
            result = await generate_voiceover(name, script)
            print(f"  ✓ Saved to {result}")
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    print(f"\n✅ Generated {len(SCRIPTS)} voiceover files!")

if __name__ == "__main__":
    asyncio.run(main())
