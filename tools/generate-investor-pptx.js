const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// Brand Colors
const COLORS = {
  primary: '1a365d',      // Dark blue
  secondary: '3182ce',    // Medium blue
  accent: '00d4aa',       // Teal/green
  white: 'ffffff',
  lightGray: 'f7fafc',
  darkGray: '2d3748'
};

function createInvestorPitch() {
  const pptx = new pptxgen();
  
  // Set presentation properties
  pptx.author = 'Masaphokati Technologies';
  pptx.title = 'SiyaBusa ERP - Investor Pitch Deck';
  pptx.subject = 'Investment Opportunity';
  pptx.company = 'Masaphokati Technologies (Pty) Ltd';
  
  // Define master slide
  pptx.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: COLORS.primary },
    objects: [
      { text: { text: 'SiyaBusa ERP', options: { x: 0.5, y: 7.0, w: 3, h: 0.4, fontSize: 10, color: COLORS.accent, fontFace: 'Arial' } } }
    ]
  });

  // ============ SLIDE 1: COVER ============
  let slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('SiyaBusa ERP', { x: 0.5, y: 2.0, w: 9, h: 1.2, fontSize: 54, bold: true, color: COLORS.white, fontFace: 'Arial' });
  slide.addText('INVESTOR PITCH DECK', { x: 0.5, y: 3.2, w: 9, h: 0.6, fontSize: 24, color: COLORS.accent, fontFace: 'Arial' });
  slide.addText('Enterprise Software for Growing African Businesses', { x: 0.5, y: 4.0, w: 9, h: 0.5, fontSize: 18, color: COLORS.white, fontFace: 'Arial' });
  slide.addText([
    { text: 'Seeking: ', options: { bold: true } },
    { text: 'R200,000 Bridge Round (4-Month Runway)' }
  ], { x: 0.5, y: 5.5, w: 9, h: 0.5, fontSize: 20, color: COLORS.accent, fontFace: 'Arial' });
  slide.addText('Masaphokati Technologies (Pty) Ltd\nJanuary 2026', { x: 0.5, y: 6.2, w: 9, h: 0.8, fontSize: 14, color: COLORS.white, fontFace: 'Arial' });

  // ============ SLIDE 2: THE PROBLEM ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('The Problem', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });
  slide.addText('African Mid-Market Companies Face an Impossible Choice', { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 20, color: COLORS.accent, fontFace: 'Arial' });
  
  // Three options
  const optionY = 2.2;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: optionY, w: 2.8, h: 2.5, fill: { color: '2c5282' } });
  slide.addText('Enterprise Giants', { x: 0.6, y: optionY + 0.1, w: 2.6, h: 0.4, fontSize: 14, bold: true, color: COLORS.white });
  slide.addText('• SAP, Oracle, Dynamics\n• R5M-R50M to implement\n• 18-24 month deployment\n• Overkill for most', { x: 0.6, y: optionY + 0.5, w: 2.6, h: 2, fontSize: 11, color: COLORS.white });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.5, y: optionY, w: 2.8, h: 2.5, fill: { color: '2c5282' } });
  slide.addText('Basic Tools', { x: 3.6, y: optionY + 0.1, w: 2.6, h: 0.4, fontSize: 14, bold: true, color: COLORS.white });
  slide.addText('• QuickBooks, Xero\n• Accounting only\n• No real ERP features\n• Can\'t scale', { x: 3.6, y: optionY + 0.5, w: 2.6, h: 2, fontSize: 11, color: COLORS.white });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.5, y: optionY, w: 2.8, h: 2.5, fill: { color: '2c5282' } });
  slide.addText('Legacy Systems', { x: 6.6, y: optionY + 0.1, w: 2.6, h: 0.4, fontSize: 14, bold: true, color: COLORS.white });
  slide.addText('• Sage Desktop, Pastel\n• On-premise only\n• Limited cloud\n• High maintenance', { x: 6.6, y: optionY + 0.5, w: 2.6, h: 2, fontSize: 11, color: COLORS.white });

  slide.addText('Result: African SMEs pay 10-50x more than global competitors for incomplete systems', { x: 0.5, y: 5.2, w: 9, h: 0.6, fontSize: 16, bold: true, color: COLORS.accent, fontFace: 'Arial' });

  // ============ SLIDE 3: THE SOLUTION ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('The Solution', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });
  slide.addText('Introducing SiyaBusa ERP', { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 20, color: COLORS.accent, fontFace: 'Arial' });
  
  const features = [
    { icon: '✅', text: 'Comprehensive: 25+ integrated modules' },
    { icon: '✅', text: 'Industry-Specific: Healthcare, Mining, Construction, Property, Agriculture' },
    { icon: '✅', text: 'Compliance Built-In: SARS, VAT, PAYE, B-BBEE, POPIA ready' },
    { icon: '✅', text: 'AI-Powered: Natural language queries, intelligent automation' },
    { icon: '✅', text: 'Fast Deployment: 2-4 weeks, not 18 months' },
    { icon: '✅', text: 'Fair Pricing: R980/user/month vs R2,500-R5,000 (SAP)' }
  ];
  
  features.forEach((f, i) => {
    slide.addText(`${f.icon}  ${f.text}`, { x: 0.5, y: 2.0 + (i * 0.55), w: 9, h: 0.5, fontSize: 16, color: COLORS.white, fontFace: 'Arial' });
  });

  slide.addText('Technology: Node.js, React, PostgreSQL, AWS Cape Town', { x: 0.5, y: 5.5, w: 9, h: 0.4, fontSize: 14, color: COLORS.accent, fontFace: 'Arial' });

  // ============ SLIDE 4: PRODUCT MODULES ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('25+ Modules | Single Platform', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });
  
  // Module categories in boxes
  const modules = [
    { title: 'Financial', items: 'General Ledger, AP/AR\nCash Management\nAsset Management (IAS 16)\nBudget & Forecasting' },
    { title: 'Operations', items: 'Inventory & Warehousing\nPurchase Management\nSales & CRM\nManufacturing (BOM)' },
    { title: 'People', items: 'HR & Payroll\nTime Tracking\nProject Management\nPractice Management' },
    { title: 'Industries', items: 'Healthcare\nMining & Construction\nProperty Management\nAgriculture' }
  ];
  
  modules.forEach((mod, i) => {
    const x = 0.5 + (i * 2.35);
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: x, y: 1.5, w: 2.2, h: 2.8, fill: { color: '2c5282' } });
    slide.addText(mod.title, { x: x + 0.1, y: 1.6, w: 2, h: 0.4, fontSize: 14, bold: true, color: COLORS.accent });
    slide.addText(mod.items, { x: x + 0.1, y: 2.1, w: 2, h: 2.2, fontSize: 10, color: COLORS.white });
  });

  slide.addText('+ 400 REST API Endpoints | Multi-tenant | Mobile Responsive', { x: 0.5, y: 4.8, w: 9, h: 0.4, fontSize: 14, color: COLORS.accent });

  // ============ SLIDE 5: MARKET OPPORTUNITY ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('Market Opportunity', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });
  slide.addText('The Underserved Middle Market', { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 20, color: COLORS.accent, fontFace: 'Arial' });

  // Market size visualization
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 2.0, w: 4, h: 0.6, fill: { color: 'e53e3e' } });
  slide.addText('SAP/Oracle: R50K-R200K/month — Top 5% only', { x: 0.6, y: 2.1, w: 3.8, h: 0.4, fontSize: 11, color: COLORS.white });

  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 2.8, w: 4, h: 1.2, fill: { color: COLORS.accent } });
  slide.addText('THE GAP: 95,000 SA businesses\nR5M - R100M revenue\nOutgrown basics, can\'t afford enterprise', { x: 0.6, y: 2.9, w: 3.8, h: 1, fontSize: 11, bold: true, color: COLORS.primary });

  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 4.2, w: 4, h: 0.6, fill: { color: '38a169' } });
  slide.addText('SiyaBusa: R980/user — WE ARE HERE', { x: 0.6, y: 4.3, w: 3.8, h: 0.4, fontSize: 11, bold: true, color: COLORS.white });

  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 5.0, w: 4, h: 0.6, fill: { color: '718096' } });
  slide.addText('QuickBooks/Xero: Accounting only', { x: 0.6, y: 5.1, w: 3.8, h: 0.4, fontSize: 11, color: COLORS.white });

  // Stats on right
  slide.addText('Target Market', { x: 5.5, y: 2.0, w: 4, h: 0.5, fontSize: 16, bold: true, color: COLORS.accent });
  slide.addText('• 95,000 addressable businesses\n• 10-100 employees\n• R5M-R100M revenue\n• Cannot justify R100K+/month\n• Decision: Owner, FD, Ops Manager', { x: 5.5, y: 2.5, w: 4, h: 2.5, fontSize: 12, color: COLORS.white });

  // ============ SLIDE 6: PRICING MODEL ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('Pricing Model', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });
  slide.addText('R980 per user per month — Every user pays', { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 20, color: COLORS.accent, fontFace: 'Arial' });

  // Pricing table
  const pricingRows = [
    ['Tier', 'Per User', 'Min Users', 'Min Monthly'],
    ['Starter', 'R980', '5', 'R4,900'],
    ['Professional', 'R931 (5% off)', '10', 'R9,310'],
    ['Enterprise', 'R882 (10% off)', '25', 'R22,050']
  ];
  
  slide.addTable(pricingRows, {
    x: 0.5, y: 2.0, w: 5,
    fill: { color: '2c5282' },
    color: COLORS.white,
    fontSize: 12,
    border: { pt: 1, color: COLORS.primary },
    align: 'center',
    valign: 'middle'
  });

  // Unit economics
  slide.addText('Unit Economics', { x: 6, y: 2.0, w: 3.5, h: 0.4, fontSize: 16, bold: true, color: COLORS.accent });
  slide.addText('Cost to serve: R380/user\nMargin: R600/user (61%)\nAvg customer: 10 users\n= R9,800/month\n\nBreak-even: 5-6 customers', { x: 6, y: 2.5, w: 3.5, h: 2.5, fontSize: 12, color: COLORS.white });

  // Comparison
  slide.addText('vs Competition:', { x: 0.5, y: 4.5, w: 9, h: 0.4, fontSize: 14, bold: true, color: COLORS.accent });
  slide.addText('SAP: R2,500-R5,000/user  |  Sage: R1,000-R2,000/user  |  SiyaBusa: R980/user (60% cheaper)', { x: 0.5, y: 5.0, w: 9, h: 0.4, fontSize: 13, color: COLORS.white });

  // ============ SLIDE 7: TRACTION & ROADMAP ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('Traction & Roadmap', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });
  slide.addText('Production-Ready | First Customer Target: May 2026', { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 20, color: COLORS.accent, fontFace: 'Arial' });

  // Current status
  slide.addText('Current Status (Jan 2026)', { x: 0.5, y: 2.0, w: 4.5, h: 0.4, fontSize: 14, bold: true, color: COLORS.accent });
  slide.addText('✅ Product: 100% complete, deployed\n✅ Infrastructure: AWS Cape Town\n✅ Codebase: 400+ APIs, 25+ modules\n✅ Documentation: Complete\n🎯 Status: Pre-revenue, ready to launch', { x: 0.5, y: 2.5, w: 4.5, h: 2, fontSize: 11, color: COLORS.white });

  // 4-month plan
  slide.addText('4-Month Plan', { x: 5.5, y: 2.0, w: 4, h: 0.4, fontSize: 14, bold: true, color: COLORS.accent });
  const planRows = [
    ['Month', 'Focus', 'Spend'],
    ['Feb', 'Marketing launch', 'R35,000'],
    ['Mar', 'Beta + lead gen', 'R42,000'],
    ['Apr', 'Sales push, demos', 'R46,000'],
    ['May', 'Sign first customer 🎉', 'R77,000']
  ];
  slide.addTable(planRows, {
    x: 5.5, y: 2.5, w: 4,
    fill: { color: '2c5282' },
    color: COLORS.white,
    fontSize: 10,
    border: { pt: 1, color: COLORS.primary }
  });

  // ============ SLIDE 8: COMPETITIVE LANDSCAPE ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('Competitive Landscape', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });

  const compRows = [
    ['', 'SiyaBusa', 'SAP/Oracle', 'Sage', 'QuickBooks'],
    ['Target', 'Mid-market SME', 'Enterprise R1B+', 'SME/Mid', 'Micro/Small'],
    ['Per User/Mo', 'R980', 'R2,500-R5,000', 'R1,000-R2,000', 'N/A'],
    ['Deploy Time', '2-4 weeks', '6-18 months', '3 months', '1 day'],
    ['Modules', '25+', '100+', '15+', '5'],
    ['SA Compliance', '✅ Built-in', '❌ Custom', '⚠️ Limited', '⚠️ Basic'],
    ['Cloud Native', '✅ Yes', '⚠️ Hybrid', '❌ Desktop', '✅ Yes'],
    ['AI Features', '✅ Yes', '✅ Premium $$', '❌ No', '❌ No']
  ];
  
  slide.addTable(compRows, {
    x: 0.3, y: 1.4, w: 9.4,
    fill: { color: '2c5282' },
    color: COLORS.white,
    fontSize: 10,
    border: { pt: 1, color: COLORS.primary },
    align: 'center'
  });

  slide.addText('Our Advantage: Right-sized, SA-first, Modern tech, Fast, 60% cheaper', { x: 0.5, y: 5.2, w: 9, h: 0.4, fontSize: 14, bold: true, color: COLORS.accent });

  // ============ SLIDE 9: USE OF FUNDS ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('Use of Funds', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });
  slide.addText('R200,000 Bridge Round | 4-Month Runway', { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 20, color: COLORS.accent, fontFace: 'Arial' });

  const fundsRows = [
    ['Category', 'Amount', '%'],
    ['Development & Operations', 'R82,500', '41%'],
    ['Marketing', 'R35,500', '18%'],
    ['Infrastructure (AWS)', 'R27,500', '14%'],
    ['Customer Operations', 'R19,500', '10%'],
    ['Legal & Compliance', 'R14,000', '7%'],
    ['Business Setup', 'R9,500', '5%'],
    ['Contingency', 'R11,500', '6%'],
    ['TOTAL', 'R200,000', '100%']
  ];
  
  slide.addTable(fundsRows, {
    x: 0.5, y: 2.0, w: 5,
    fill: { color: '2c5282' },
    color: COLORS.white,
    fontSize: 11,
    border: { pt: 1, color: COLORS.primary }
  });

  // Milestones
  slide.addText('Milestones', { x: 6, y: 2.0, w: 3.5, h: 0.4, fontSize: 14, bold: true, color: COLORS.accent });
  slide.addText('✅ First paying customer by May\n✅ R7,840+ MRR (8 users)\n✅ Break-even path validated\n✅ Ready for seed round (R2M-R5M)', { x: 6, y: 2.5, w: 3.5, h: 2, fontSize: 12, color: COLORS.white });

  // ============ SLIDE 10: FINANCIAL PROJECTIONS ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('Financial Projections', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });
  slide.addText('Conservative Growth Path (R980/User)', { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 20, color: COLORS.accent, fontFace: 'Arial' });

  const projRows = [
    ['Date', 'Customers', 'Avg Users', 'MRR', 'ARR Run Rate'],
    ['May 2026', '1', '8', 'R7,840', 'R94K'],
    ['Aug 2026', '3', '10', 'R29,400', 'R353K'],
    ['Dec 2026', '8', '10', 'R78,400', 'R941K'],
    ['Jun 2027', '20', '12', 'R235,200', 'R2.8M'],
    ['Dec 2027', '40', '15', 'R588,000', 'R7.1M']
  ];
  
  slide.addTable(projRows, {
    x: 0.5, y: 2.0, w: 9,
    fill: { color: '2c5282' },
    color: COLORS.white,
    fontSize: 11,
    border: { pt: 1, color: COLORS.primary },
    align: 'center'
  });

  slide.addText('Break-even: 5-6 customers (Q3 2026)  |  Gross Margin: 61%', { x: 0.5, y: 4.5, w: 9, h: 0.4, fontSize: 14, bold: true, color: COLORS.accent });

  // ============ SLIDE 11: TEAM ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('The Team', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });

  slide.addText('Founder & CEO: Sibusiso Buncele', { x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 18, bold: true, color: COLORS.accent });
  slide.addText('• Full-stack developer with ERP domain expertise\n• Built entire system: 400+ APIs, 25+ modules\n• 9 months from concept to production-ready\n• Vision: Democratize enterprise software for Africa', { x: 0.5, y: 2.1, w: 5, h: 1.8, fontSize: 12, color: COLORS.white });

  slide.addText('Immediate Hires (Post-Funding)', { x: 5.5, y: 1.5, w: 4, h: 0.5, fontSize: 14, bold: true, color: COLORS.accent });
  slide.addText('• CTO/Tech Lead (Month 1)\n• Sales Manager (Month 1)\n• Customer Success (Month 3)', { x: 5.5, y: 2.1, w: 4, h: 1.5, fontSize: 12, color: COLORS.white });

  // ============ SLIDE 12: INVESTMENT TERMS ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('Investment Terms', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });
  slide.addText('R200,000 Bridge Round | Flexible Terms', { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 20, color: COLORS.accent, fontFace: 'Arial' });

  // Option boxes
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 2.0, w: 2.8, h: 2.5, fill: { color: '2c5282' } });
  slide.addText('Option A: Convertible', { x: 0.6, y: 2.1, w: 2.6, h: 0.4, fontSize: 12, bold: true, color: COLORS.accent });
  slide.addText('• 12-month term\n• 0% interest\n• 20% discount to seed\n• Auto-convert at >R2M', { x: 0.6, y: 2.6, w: 2.6, h: 1.8, fontSize: 10, color: COLORS.white });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.5, y: 2.0, w: 2.8, h: 2.5, fill: { color: '2c5282' } });
  slide.addText('Option B: SAFE', { x: 3.6, y: 2.1, w: 2.6, h: 0.4, fontSize: 12, bold: true, color: COLORS.accent });
  slide.addText('• R5M valuation cap\n• 20% discount\n• Pro-rata rights\n• MFN clause', { x: 3.6, y: 2.6, w: 2.6, h: 1.8, fontSize: 10, color: COLORS.white });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.5, y: 2.0, w: 2.8, h: 2.5, fill: { color: '2c5282' } });
  slide.addText('Option C: Equity', { x: 6.6, y: 2.1, w: 2.6, h: 0.4, fontSize: 12, bold: true, color: COLORS.accent });
  slide.addText('• R200,000 for 4%\n• R5M pre-money\n• Board observer seat\n• Full shareholder rights', { x: 6.6, y: 2.6, w: 2.6, h: 1.8, fontSize: 10, color: COLORS.white });

  slide.addText('What Investors Get: Weekly updates, early access, pro-rata for seed round', { x: 0.5, y: 5.0, w: 9, h: 0.4, fontSize: 13, bold: true, color: COLORS.accent });

  // ============ SLIDE 13: WHY NOW ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('Why Now?', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });

  const reasons = [
    { title: 'Product is DONE', desc: 'Not a mockup — full production ERP on AWS' },
    { title: 'Market is READY', desc: 'Post-COVID digitization wave accelerating' },
    { title: 'Competition is EXPENSIVE', desc: 'SAP/Oracle haven\'t adjusted for SME market' },
    { title: 'Compliance MANDATES', desc: 'SARS e-filing, POPIA driving software adoption' },
    { title: 'Gap EXISTS', desc: 'Sage stuck on desktop, Odoo limited SA presence' }
  ];

  reasons.forEach((r, i) => {
    slide.addText(`${i + 1}. ${r.title}`, { x: 0.5, y: 1.5 + (i * 0.9), w: 4, h: 0.4, fontSize: 16, bold: true, color: COLORS.accent });
    slide.addText(r.desc, { x: 0.5, y: 1.9 + (i * 0.9), w: 9, h: 0.4, fontSize: 14, color: COLORS.white });
  });

  // ============ SLIDE 14: CALL TO ACTION ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('Let\'s Build Together', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: COLORS.white, fontFace: 'Arial' });

  slide.addText('What We Need', { x: 0.5, y: 1.5, w: 4.5, h: 0.4, fontSize: 18, bold: true, color: COLORS.accent });
  slide.addText('• R200,000 bridge capital\n• Strategic advisors\n• Intros to beta partners', { x: 0.5, y: 2.0, w: 4.5, h: 1.5, fontSize: 14, color: COLORS.white });

  slide.addText('What You Get', { x: 5.5, y: 1.5, w: 4, h: 0.4, fontSize: 18, bold: true, color: COLORS.accent });
  slide.addText('• Early entry at R5M cap\n• Weekly progress updates\n• Pro-rata for seed round\n• Proof before larger commit', { x: 5.5, y: 2.0, w: 4, h: 1.8, fontSize: 14, color: COLORS.white });

  slide.addText('Next Steps', { x: 0.5, y: 4.0, w: 9, h: 0.4, fontSize: 18, bold: true, color: COLORS.accent });
  slide.addText('1. Review  →  2. Demo  →  3. Meet  →  4. Decide (2-week close)', { x: 0.5, y: 4.5, w: 9, h: 0.5, fontSize: 16, color: COLORS.white });

  // ============ SLIDE 15: THANK YOU ============
  slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slide.addText('Thank You', { x: 0.5, y: 2.0, w: 9, h: 1, fontSize: 48, bold: true, color: COLORS.white, fontFace: 'Arial', align: 'center' });
  slide.addText('"We rule. We govern. We empower."', { x: 0.5, y: 3.2, w: 9, h: 0.5, fontSize: 20, italic: true, color: COLORS.accent, align: 'center' });
  
  slide.addText('Sibusiso Buncele\nFounder & CEO\nMasaphokati Technologies (Pty) Ltd', { x: 0.5, y: 4.5, w: 9, h: 1, fontSize: 16, color: COLORS.white, align: 'center' });
  slide.addText('info@masaphokati.co.za  |  siyabusaerp.co.za', { x: 0.5, y: 5.8, w: 9, h: 0.4, fontSize: 14, color: COLORS.accent, align: 'center' });

  // Save the file
  const outputPath = path.join(__dirname, '..', 'investor-docs', 'SiyaBusa-ERP-Investor-Pitch.pptx');
  pptx.writeFile({ fileName: outputPath })
    .then(() => {
      console.log('✅ PowerPoint created: investor-docs/SiyaBusa-ERP-Investor-Pitch.pptx');
      console.log('📊 15 slides ready for presentation mode!');
    })
    .catch(err => {
      console.error('Error creating PPTX:', err);
    });
}

createInvestorPitch();
