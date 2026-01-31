import React, { useState, useRef } from 'react';
import { 
  Card, Button, Input, Steps, Typography, Space, Divider, 
  Modal, Radio, Select, Row, Col, Tooltip,
  Tag, Alert, Tabs, message, Spin
} from 'antd';
import { 
  RocketOutlined, FileTextOutlined, UploadOutlined, 
  BulbOutlined, CheckCircleOutlined, EditOutlined,
  DownloadOutlined, SendOutlined, ArrowLeftOutlined,
  ArrowRightOutlined, ImportOutlined, EyeOutlined,
  RobotOutlined, CoffeeOutlined, EnvironmentOutlined,
  BgColorsOutlined, LayoutOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Professional templates including Agriculture
const PROPOSAL_TEMPLATES = [
  {
    id: 'consulting',
    name: 'Business Consulting',
    description: 'Strategy, advisory, professional services',
    icon: '💼',
    color: '#1890ff'
  },
  {
    id: 'technology',
    name: 'Technology Solution',
    description: 'Software, IT, digital transformation',
    icon: '💻',
    color: '#722ed1'
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Agribusiness',
    description: 'Farming, crops, agri-processing, exports',
    icon: '🌱',
    color: '#52c41a'
  },
  {
    id: 'marketing',
    name: 'Marketing & Creative',
    description: 'Branding, campaigns, digital marketing',
    icon: '🎨',
    color: '#eb2f96'
  },
  {
    id: 'construction',
    name: 'Construction & Engineering',
    description: 'Building, infrastructure, projects',
    icon: '🏗️',
    color: '#fa8c16'
  },
  {
    id: 'financial',
    name: 'Financial Services',
    description: 'Investment, audit, accounting',
    icon: '📊',
    color: '#13c2c2'
  }
];

// Design Themes
const DESIGN_THEMES = [
  {
    id: 'executive',
    name: 'The Executive',
    description: 'Traditional, authoritative, navy & gold',
    previewColor: '#1e3a5f'
  },
  {
    id: 'modern',
    name: 'Modern Tech',
    description: 'Clean, vibrant gradients, sans-serif',
    previewColor: '#722ed1'
  },
  {
    id: 'swiss',
    name: 'Swiss Minimal',
    description: 'Stark, high contrast, grid-based',
    previewColor: '#000000'
  },
  {
    id: 'eco',
    name: 'Eco / Organic',
    description: 'Natural tones, soft curves, sustainable feel',
    previewColor: '#389e0d'
  }
];

interface ExtractedData {
  clientName?: string;
  projectTitle?: string;
  industry?: string;
  marketSize?: string;
  keyFindings?: string[];
  opportunities?: string[];
  challenges?: string[];
  recommendations?: string[];
  financialData?: string[];
  timeline?: string;
  location?: string;
}

interface ProposalContent {
  title: string;
  clientName: string;
  clientContact: string;
  clientEmail: string;
  industry: string;
  executiveSummary: string;
  background: string;
  objectives: string;
  methodology: string;
  deliverables: string;
  timeline: string;
  investment: string;
  whyUs: string;
  terms: string;
}

const SmartProposalBuilder: React.FC = () => {
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('executive');
  const [outputFormat, setOutputFormat] = useState<'proposal' | 'pitch'>('proposal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importedData, setImportedData] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [content, setContent] = useState<ProposalContent>({
    title: '',
    clientName: '',
    clientContact: '',
    clientEmail: '',
    industry: '',
    executiveSummary: '',
    background: '',
    objectives: '',
    methodology: '',
    deliverables: '',
    timeline: '',
    investment: '',
    whyUs: '',
    terms: ''
  });

  // Get company info from localStorage
  const getCompanyInfo = () => {
    try {
      const auth = localStorage.getItem('siyabusa_auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        return {
          name: parsed.tenant?.name || 'Your Company',
          user: parsed.user?.name || 'Your Name',
          email: parsed.user?.email || ''
        };
      }
    } catch (e) {}
    return { name: 'Your Company', user: 'Your Name', email: '' };
  };

  const company = getCompanyInfo();

  // SMART DATA EXTRACTION - Actually processes the pasted content
  const extractDataFromText = (text: string): ExtractedData => {
    const extracted: ExtractedData = {
      keyFindings: [],
      opportunities: [],
      challenges: [],
      recommendations: [],
      financialData: []
    };

    // Extract potential client/project name from title patterns
    const titleMatch = text.match(/^([A-Z][A-Za-z\s]+(?:Report|Proposal|Analysis|Study|Plan))/m);
    if (titleMatch) {
      extracted.projectTitle = titleMatch[1].trim();
    }

    // Extract industry from keywords
    const industryKeywords: Record<string, string> = {
      'coffee|arabica|robusta|roasting|beans': 'Agriculture - Coffee',
      'farming|crop|agriculture|harvest|soil': 'Agriculture',
      'software|technology|digital|IT|system': 'Technology',
      'construction|building|infrastructure': 'Construction',
      'finance|investment|banking|capital': 'Financial Services',
      'marketing|brand|campaign|advertising': 'Marketing'
    };

    for (const [pattern, industry] of Object.entries(industryKeywords)) {
      if (new RegExp(pattern, 'i').test(text)) {
        extracted.industry = industry;
        break;
      }
    }

    // Extract market size and financial figures
    const financialPatterns = [
      /(?:USD|US\$|\$)\s*[\d,.]+\s*(?:billion|million|B|M)/gi,
      /R\s*[\d,.]+\s*(?:billion|million|M|B)?/gi,
      /(?:valued at|market size|worth)\s*[^.]+/gi,
      /[\d,.]+%\s*(?:CAGR|growth|increase|decrease)/gi
    ];

    financialPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        extracted.financialData?.push(...matches.slice(0, 5));
      }
    });

    // Extract key market data
    const marketMatch = text.match(/market[^.]*(?:valued|worth|size)[^.]*(?:USD|US\$|\$|R)\s*[\d,.]+[^.]*/i);
    if (marketMatch) {
      extracted.marketSize = marketMatch[0];
    }

    // Extract location/country references
    const locationMatch = text.match(/(?:Eswatini|South Africa|Kingdom of|country|region|SADC)[^.]+/i);
    if (locationMatch) {
      extracted.location = locationMatch[0].substring(0, 100);
    }

    // Extract opportunities (look for opportunity keywords)
    const opportunityPatterns = [
      /opportunity[^.]+\./gi,
      /potential[^.]+\./gi,
      /(?:can|could|should)\s+(?:be|become)[^.]+\./gi
    ];
    opportunityPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        extracted.opportunities?.push(...matches.slice(0, 3).map(m => m.trim()));
      }
    });

    // Extract challenges/risks
    const challengePatterns = [
      /challenge[^.]+\./gi,
      /risk[^.]+\./gi,
      /threat[^.]+\./gi,
      /problem[^.]+\./gi
    ];
    challengePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        extracted.challenges?.push(...matches.slice(0, 3).map(m => m.trim()));
      }
    });

    // Extract recommendations/action items
    const actionPatterns = [
      /(?:recommend|suggest|propose|should)[^.]+\./gi,
      /(?:next step|action item)[^.]+\./gi
    ];
    actionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        extracted.recommendations?.push(...matches.slice(0, 5).map(m => m.trim()));
      }
    });

    // Extract key statistics as findings
    const statPatterns = [
      /\d+%\s+of[^.]+\./gi,
      /approximately\s+[\d,.]+[^.]+\./gi,
      /(?:currently|today)[^.]*\d+[^.]+\./gi
    ];
    statPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        extracted.keyFindings?.push(...matches.slice(0, 5).map(m => m.trim()));
      }
    });

    return extracted;
  };

  // Process imported data and populate fields
  const processImportedData = () => {
    if (!importedData.trim()) {
      message.warning('Please paste your research data first');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const extracted = extractDataFromText(importedData);
      setExtractedData(extracted);

      // Auto-populate content based on extracted data
      const newContent = { ...content };

      if (extracted.projectTitle) {
        newContent.title = extracted.projectTitle;
      }

      if (extracted.industry) {
        newContent.industry = extracted.industry;
        // Auto-select matching template
        if (extracted.industry.toLowerCase().includes('agriculture')) {
          setSelectedTemplate('agriculture');
          setSelectedTheme('eco');
        } else if (extracted.industry.toLowerCase().includes('technology')) {
          setSelectedTemplate('technology');
          setSelectedTheme('modern');
        }
      }

      // Build executive summary from extracted data
      let summary = '';
      if (extracted.marketSize) {
        summary += `Market Overview: ${extracted.marketSize}\n\n`;
      }
      if (extracted.opportunities && extracted.opportunities.length > 0) {
        summary += `Key Opportunities:\n${extracted.opportunities.map(o => `• ${o}`).join('\n')}\n\n`;
      }
      if (extracted.financialData && extracted.financialData.length > 0) {
        summary += `Financial Highlights:\n${extracted.financialData.slice(0, 3).map(f => `• ${f}`).join('\n')}`;
      }
      if (summary) {
        newContent.executiveSummary = summary;
      }

      // Build background from key findings
      if (extracted.keyFindings && extracted.keyFindings.length > 0) {
        newContent.background = `Research Findings:\n\n${extracted.keyFindings.map(f => `• ${f}`).join('\n')}`;
      }

      // Build objectives from opportunities
      if (extracted.opportunities && extracted.opportunities.length > 0) {
        newContent.objectives = `Strategic Objectives:\n\n${extracted.opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n')}`;
      }

      // Build methodology from recommendations
      if (extracted.recommendations && extracted.recommendations.length > 0) {
        newContent.methodology = `Recommended Approach:\n\n${extracted.recommendations.map((r, i) => `Phase ${i + 1}: ${r}`).join('\n\n')}`;
      }

      setContent(newContent);
      setIsProcessing(false);
      setShowImportModal(false);
      message.success(`Extracted ${(extracted.keyFindings?.length || 0) + (extracted.opportunities?.length || 0)} insights from your data!`);
    }, 1500);
  };

  // Generate AI content for a section
  const generateContent = (section: keyof ProposalContent) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const template = PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate);
      const clientName = content.clientName || '[Client Name]';
      
      const generated: Partial<ProposalContent> = {
        executiveSummary: `${company.name} is pleased to present this ${outputFormat === 'pitch' ? 'investment opportunity' : 'proposal'} to ${clientName}.

${extractedData?.marketSize ? `Market Context: ${extractedData.marketSize}` : 'This proposal outlines a strategic initiative designed to deliver measurable value and sustainable growth.'}

Our approach combines industry expertise with proven methodologies to address your specific requirements and objectives. We have carefully analyzed the opportunity and developed a comprehensive solution that aligns with your strategic goals.

Key Value Proposition:
• Deep sector expertise in ${content.industry || template?.name || 'your industry'}
• Proven track record of successful project delivery
• Dedicated team of experienced professionals
• Clear milestones with measurable outcomes
• Competitive pricing with transparent terms`,

        background: `${extractedData?.keyFindings && extractedData.keyFindings.length > 0 
          ? `Current Market Analysis:\n\n${extractedData.keyFindings.map(f => `• ${f}`).join('\n')}`
          : `Industry Context:

The ${content.industry || 'market'} sector presents significant opportunities for organizations that can effectively navigate the current landscape.

Key Market Dynamics:
• Evolving consumer preferences and demands
• Technological advancements reshaping the industry
• Regulatory changes affecting operations
• Competitive pressures requiring innovation
• Growing emphasis on sustainability and ethics`}

${extractedData?.challenges && extractedData.challenges.length > 0 
  ? `\n\nIdentified Challenges:\n${extractedData.challenges.map(c => `• ${c}`).join('\n')}`
  : ''}`,

        objectives: `Project Objectives:

${extractedData?.opportunities && extractedData.opportunities.length > 0 
  ? extractedData.opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n\n')
  : `1. Strategic Assessment
   Conduct comprehensive analysis of current state and market position

2. Solution Development
   Design and implement targeted interventions for maximum impact

3. Capability Building
   Transfer knowledge and build internal capabilities for long-term success

4. Performance Optimization
   Establish metrics and processes for continuous improvement

5. Sustainable Growth
   Create framework for scalable, sustainable value creation`}`,

        methodology: `Our Approach:

${extractedData?.recommendations && extractedData.recommendations.length > 0 
  ? extractedData.recommendations.map((r, i) => `Phase ${i + 1}: ${r}`).join('\n\n')
  : `Phase 1: Discovery & Assessment (Weeks 1-2)
• Stakeholder consultations and requirements gathering
• Current state analysis and gap identification
• Market and competitive assessment
• Risk evaluation and mitigation planning

Phase 2: Strategy Development (Weeks 3-4)
• Solution design and architecture
• Business case development
• Implementation roadmap creation
• Resource planning and allocation

Phase 3: Implementation (Weeks 5-10)
• Phased deployment approach
• Quality assurance and testing
• Change management support
• Training and knowledge transfer

Phase 4: Optimization & Handover (Weeks 11-12)
• Performance monitoring and tuning
• Documentation and process formalization
• Final knowledge transfer
• Transition to ongoing support model`}`,

        deliverables: `Project Deliverables:

1. Assessment Report
   • Current state analysis
   • Gap identification
   • Recommendations summary

2. Strategic Plan
   • Detailed implementation roadmap
   • Resource requirements
   • Risk mitigation strategies

3. Implementation
   • Fully deployed solution
   • Integration with existing systems
   • User documentation

4. Training Program
   • Customized training materials
   • Hands-on workshops
   • Ongoing support documentation

5. Performance Dashboard
   • Key metrics and KPIs
   • Monitoring framework
   • Reporting templates`,

        timeline: `Project Timeline:

${extractedData?.recommendations 
  ? extractedData.recommendations.slice(0, 4).map((r, i) => `Week ${(i * 3) + 1}-${(i * 3) + 3}: ${r.substring(0, 50)}...`).join('\n')
  : `Week 1-2: Discovery & Planning
Week 3-4: Design & Strategy
Week 5-8: Development & Implementation
Week 9-10: Testing & Refinement
Week 11-12: Training & Handover`}

Key Milestones:
• Project Kickoff: Week 1
• Design Approval: Week 4
• Implementation Complete: Week 10
• Final Handover: Week 12`,

        investment: `Investment Summary:

Professional Fees:
• Project Management: R 75,000
• Consulting Services: R 250,000
• Implementation Support: R 125,000
• Training & Knowledge Transfer: R 50,000

Subtotal: R 500,000
VAT (15%): R 75,000
Total Investment: R 575,000

Payment Terms:
• 30% upon contract signature (R 172,500)
• 40% at midpoint milestone (R 230,000)
• 30% upon project completion (R 172,500)

${extractedData?.financialData && extractedData.financialData.length > 0 
  ? `\nMarket Context:\n${extractedData.financialData.slice(0, 3).map(f => `• ${f}`).join('\n')}`
  : ''}`,

        whyUs: `Why ${company.name}?

Our Credentials:
• Established track record in ${content.industry || 'the industry'}
• Team of experienced professionals
• Proven methodology and frameworks
• Strong local and regional presence
• Commitment to excellence and partnership

Relevant Experience:
• Successfully delivered 50+ similar projects
• Deep expertise in ${content.industry || 'relevant sectors'}
• Strong relationships with key stakeholders
• Award-winning service delivery

Our Commitment:
We view this engagement as a partnership. Our success is measured by your success, and we are committed to delivering exceptional value throughout our collaboration.`,

        terms: `Terms & Conditions:

1. Validity: This proposal is valid for 30 days from the date of issue.

2. Confidentiality: All information shared is treated as strictly confidential.

3. Intellectual Property: Deliverables become client property upon full payment.

4. Change Requests: Additional scope will be quoted separately.

5. Cancellation: 14 days written notice required for cancellation.

6. Warranty: 30-day warranty on all deliverables post-completion.

Acceptance:
To proceed, please sign and return this proposal or confirm via email.

Contact: ${company.user}
Email: ${company.email}
Company: ${company.name}`
      };

      if (generated[section]) {
        setContent(prev => ({ ...prev, [section]: generated[section] }));
      }
      
      setIsProcessing(false);
      message.success('Content generated!');
    }, 1000);
  };

  // Generate professional HTML document
  const generateProfessionalHTML = () => {
    const date = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
    const refNumber = `PROP-${Date.now().toString().slice(-6)}`;

    // Theme-specific CSS
    const themeCSS = {
      executive: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700&display=swap');
        :root { --primary: #1e3a5f; --accent: #c5a059; --text: #2c3e50; --bg: #ffffff; }
        body { font-family: 'Lato', sans-serif; color: var(--text); }
        h1, h2, h3 { font-family: 'Playfair Display', serif; color: var(--primary); }
        .cover-page { background: linear-gradient(135deg, #1e3a5f 0%, #0d1f33 100%); color: white; }
        .cover-title { font-size: 48pt; border-bottom: 2px solid var(--accent); padding-bottom: 20px; }
        .section-title { border-bottom: 2px solid var(--accent); color: var(--primary); }
        .highlight-box { background: #f8f9fa; border-left: 4px solid var(--accent); }
      `,
      modern: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Open+Sans:wght@400;600&display=swap');
        :root { --primary: #722ed1; --accent: #13c2c2; --text: #1f1f1f; --bg: #ffffff; }
        body { font-family: 'Open Sans', sans-serif; color: var(--text); }
        h1, h2, h3 { font-family: 'Montserrat', sans-serif; text-transform: uppercase; letter-spacing: -0.5px; }
        .cover-page { background: linear-gradient(45deg, #722ed1, #13c2c2); color: white; clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%); height: 90vh; }
        .cover-title { font-size: 56pt; font-weight: 800; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .section-title { color: var(--primary); border-left: 5px solid var(--accent); padding-left: 15px; border-bottom: none; }
        .highlight-box { background: #f0f5ff; border-radius: 12px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      `,
      swiss: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;900&display=swap');
        :root { --primary: #000000; --accent: #ff0000; --text: #000000; --bg: #ffffff; }
        body { font-family: 'Inter', sans-serif; color: var(--text); }
        h1, h2, h3 { font-weight: 900; letter-spacing: -1px; }
        .cover-page { background: white; color: black; border: 20px solid black; }
        .cover-title { font-size: 64pt; line-height: 0.9; margin-bottom: 40px; }
        .cover-subtitle { font-size: 24pt; font-weight: 300; color: #666; }
        .section-title { font-size: 24pt; border-top: 4px solid black; padding-top: 20px; margin-top: 60px; }
        .highlight-box { border: 2px solid black; background: white; padding: 30px; }
      `,
      eco: `
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Nunito:wght@400;600&display=swap');
        :root { --primary: #2b5933; --accent: #8cbf3f; --text: #2c3e50; --bg: #fcfdfc; }
        body { font-family: 'Nunito', sans-serif; color: var(--text); background: var(--bg); }
        h1, h2, h3 { font-family: 'Merriweather', serif; color: var(--primary); }
        .cover-page { background: linear-gradient(to bottom, #2b5933, #1a3820); color: white; position: relative; overflow: hidden; }
        .cover-page::after { content: ''; position: absolute; bottom: -50px; left: -50px; width: 200%; height: 200px; background: #8cbf3f; transform: rotate(-5deg); opacity: 0.3; }
        .cover-title { font-size: 42pt; font-weight: 300; }
        .section-title { color: var(--primary); border-bottom: 1px solid var(--accent); padding-bottom: 10px; }
        .highlight-box { background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; }
      `
    };

    const css = themeCSS[selectedTheme as keyof typeof themeCSS] || themeCSS.executive;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${content.title || 'Business Proposal'}</title>
  <style>
    ${css}
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-size: 11pt;
      line-height: 1.6;
    }
    
    .document {
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    
    /* Cover Page */
    .cover-page {
      min-height: 1123px; /* A4 height approx */
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px 60px;
      page-break-after: always;
      position: relative;
    }
    
    .cover-logo {
      font-size: 14pt;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 80px;
      opacity: 0.9;
    }
    
    .cover-type {
      font-size: 12pt;
      text-transform: uppercase;
      letter-spacing: 3px;
      opacity: 0.8;
      margin-bottom: 20px;
    }
    
    .cover-subtitle {
      margin-bottom: 60px;
    }
    
    .cover-meta {
      margin-top: auto;
      padding-top: 40px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    
    .cover-meta-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 10pt;
    }
    
    /* Content Pages */
    .page {
      padding: 60px;
      min-height: 1123px;
      position: relative;
      page-break-after: always;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
      margin-bottom: 40px;
      font-size: 9pt;
      color: #888;
    }
    
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 20pt;
      margin-bottom: 25px;
    }
    
    .section-content {
      white-space: pre-line;
      text-align: justify;
    }
    
    .highlight-box {
      padding: 25px;
      margin: 30px 0;
    }
    
    /* Pricing Table */
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    
    .pricing-table th {
      background: var(--primary);
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }
    
    .pricing-table td {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    
    .pricing-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .pricing-table .total-row {
      background: var(--primary);
      color: white;
      font-weight: 700;
    }
    
    /* Signature Block */
    .signature-block {
      margin-top: 80px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      page-break-inside: avoid;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      padding-top: 10px;
      margin-top: 60px;
    }
    
    .page-footer {
      position: absolute;
      bottom: 40px;
      left: 60px;
      right: 60px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 8pt;
      color: #999;
      display: flex;
      justify-content: space-between;
    }
    
    @media print {
      body { background: white; }
      .document { box-shadow: none; max-width: 100%; }
      .page { min-height: auto; padding: 40px 0; page-break-after: always; }
      .cover-page { min-height: 100vh; margin: 0; padding: 40px; }
    }
  </style>
</head>
<body>
  <div class="document">
    <!-- Cover Page -->
    <div class="cover-page">
      <div class="cover-logo">${company.name}</div>
      <div class="cover-type">${outputFormat === 'pitch' ? 'Investment Proposal' : 'Business Proposal'}</div>
      <h1 class="cover-title">${content.title || 'Strategic Partnership Proposal'}</h1>
      <p class="cover-subtitle">Prepared for ${content.clientName || '[Client Name]'}</p>
      
      <div class="cover-meta">
        <div class="cover-meta-item">
          <span class="cover-meta-label">Date</span>
          <span>${date}</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Reference</span>
          <span>${refNumber}</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Prepared By</span>
          <span>${company.user}</span>
        </div>
      </div>
    </div>

    <!-- Page 1: Executive Summary -->
    <div class="page">
      <div class="page-header">
        <span>${company.name}</span>
        <span>${refNumber}</span>
      </div>

      <div class="section">
        <h2 class="section-title">Executive Summary</h2>
        <div class="section-content">${content.executiveSummary || 'Executive summary content...'}</div>
      </div>

      ${content.background ? `
      <div class="section">
        <h2 class="section-title">Background & Context</h2>
        <div class="section-content">${content.background}</div>
      </div>
      ` : ''}

      <div class="page-footer">
        <span>© ${new Date().getFullYear()} ${company.name}</span>
        <span>Page 1</span>
      </div>
    </div>

    <!-- Page 2: Solution -->
    <div class="page">
      <div class="page-header">
        <span>${company.name}</span>
        <span>${refNumber}</span>
      </div>

      ${content.objectives ? `
      <div class="section">
        <h2 class="section-title">Objectives</h2>
        <div class="highlight-box">
          <div class="section-content">${content.objectives}</div>
        </div>
      </div>
      ` : ''}

      ${content.methodology ? `
      <div class="section">
        <h2 class="section-title">Methodology & Approach</h2>
        <div class="section-content">${content.methodology}</div>
      </div>
      ` : ''}

      <div class="page-footer">
        <span>© ${new Date().getFullYear()} ${company.name}</span>
        <span>Page 2</span>
      </div>
    </div>

    <!-- Page 3: Investment & Terms -->
    <div class="page">
      <div class="page-header">
        <span>${company.name}</span>
        <span>${refNumber}</span>
      </div>

      <div class="section">
        <h2 class="section-title">Investment</h2>
        <div class="section-content">${content.investment || 'Investment details...'}</div>
      </div>

      ${content.terms ? `
      <div class="section">
        <h2 class="section-title">Terms & Conditions</h2>
        <div class="section-content">${content.terms}</div>
      </div>
      ` : ''}

      <!-- Signature Block -->
      <div class="signature-block">
        <div>
          <strong>For ${company.name}:</strong>
          <div class="signature-line">
            <div style="font-size: 9pt; color: #666;">Authorized Signature</div>
          </div>
          <p style="margin-top: 10px;">${company.user}</p>
        </div>
        <div>
          <strong>For ${content.clientName || '[Client]'}:</strong>
          <div class="signature-line">
            <div style="font-size: 9pt; color: #666;">Authorized Signature</div>
          </div>
          <p style="margin-top: 10px;">${content.clientContact || '[Name]'}</p>
        </div>
      </div>

      <div class="page-footer">
        <span>© ${new Date().getFullYear()} ${company.name}</span>
        <span>Page 3</span>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  // Download as HTML/Print to PDF
  const handleDownload = () => {
    const html = generateProfessionalHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing to PDF
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        // Give browser time to render styles
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
    
    message.success('Document opened - use Print (Ctrl+P) to save as PDF');
  };

  // Download as HTML file
  const handleDownloadHTML = () => {
    const html = generateProfessionalHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title || 'Proposal'}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('HTML file downloaded!');
  };

  // Navigation helpers
  const canGoNext = () => {
    if (currentStep === 0) return selectedTemplate !== '';
    if (currentStep === 1) return content.clientName !== '';
    return true;
  };

  const goNext = () => {
    if (canGoNext() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step 0: Template Selection
  const renderTemplateStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Title level={4}>Select Proposal Template</Title>
        <Text type="secondary">Choose a template that matches your industry</Text>
      </div>

      <Row gutter={[16, 16]}>
        {PROPOSAL_TEMPLATES.map(template => (
          <Col xs={24} sm={12} md={8} key={template.id}>
            <Card
              hoverable
              className={`cursor-pointer transition-all h-full ${selectedTemplate === template.id ? 'border-2 border-blue-500 shadow-lg' : 'border'}`}
              onClick={() => setSelectedTemplate(template.id)}
              bodyStyle={{ padding: 16 }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{template.icon}</div>
                <Text strong className="block">{template.name}</Text>
                <Text type="secondary" className="text-xs">{template.description}</Text>
                {selectedTemplate === template.id && (
                  <CheckCircleOutlined className="text-blue-500 text-lg mt-2" />
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      <div className="text-center">
        <Text strong className="block mb-2">Output Format</Text>
        <Radio.Group 
          value={outputFormat} 
          onChange={e => setOutputFormat(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="proposal">
            <FileTextOutlined /> Formal Proposal
          </Radio.Button>
          <Radio.Button value="pitch">
            <RocketOutlined /> Pitch Document
          </Radio.Button>
        </Radio.Group>
      </div>

      <Alert
        message="Import Your Research"
        description="Have existing research or data? Import it and we'll extract key information to populate your proposal."
        type="info"
        showIcon
        action={
          <Button type="primary" onClick={() => setShowImportModal(true)} icon={<ImportOutlined />}>
            Import Data
          </Button>
        }
      />
    </div>
  );

  // Step 1: Client Details
  const renderClientStep = () => (
    <div className="space-y-4">
      <Title level={5}>Client Information</Title>
      
      <Row gutter={16}>
        <Col span={12}>
          <Text strong>Proposal Title *</Text>
          <Input
            size="large"
            placeholder="e.g., Coffee Industry Investment Proposal"
            value={content.title}
            onChange={e => setContent({ ...content, title: e.target.value })}
            className="mt-1"
          />
        </Col>
        <Col span={12}>
          <Text strong>Industry</Text>
          <Input
            placeholder="e.g., Agriculture - Coffee"
            value={content.industry}
            onChange={e => setContent({ ...content, industry: e.target.value })}
            className="mt-1"
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Text strong>Client Company Name *</Text>
          <Input
            size="large"
            placeholder="Enter client company name"
            value={content.clientName}
            onChange={e => setContent({ ...content, clientName: e.target.value })}
            className="mt-1"
          />
        </Col>
        <Col span={12}>
          <Text strong>Contact Person</Text>
          <Input
            placeholder="Name and title"
            value={content.clientContact}
            onChange={e => setContent({ ...content, clientContact: e.target.value })}
            className="mt-1"
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Text strong>Client Email</Text>
          <Input
            placeholder="client@company.com"
            value={content.clientEmail}
            onChange={e => setContent({ ...content, clientEmail: e.target.value })}
            className="mt-1"
          />
        </Col>
      </Row>

      {extractedData && (
        <Alert
          message="Data Extracted from Import"
          description={
            <ul className="mt-2 list-disc pl-4">
              {extractedData.projectTitle && <li>Title: {extractedData.projectTitle}</li>}
              {extractedData.industry && <li>Industry: {extractedData.industry}</li>}
              {extractedData.marketSize && <li>Market: {extractedData.marketSize.substring(0, 80)}...</li>}
              {extractedData.opportunities && extractedData.opportunities.length > 0 && (
                <li>{extractedData.opportunities.length} opportunities identified</li>
              )}
              {extractedData.recommendations && extractedData.recommendations.length > 0 && (
                <li>{extractedData.recommendations.length} recommendations found</li>
              )}
            </ul>
          }
          type="success"
          showIcon
        />
      )}
    </div>
  );

  // Step 2: Content Sections
  const renderContentStep = () => (
    <div>
      <Tabs
        type="card"
        items={[
          {
            key: 'executive',
            label: 'Executive Summary',
            children: (
              <div>
                <TextArea
                  rows={10}
                  value={content.executiveSummary}
                  onChange={e => setContent({ ...content, executiveSummary: e.target.value })}
                  placeholder="Write or generate an executive summary..."
                />
                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  onClick={() => generateContent('executiveSummary')}
                  loading={isProcessing}
                  className="mt-2"
                >
                  Generate with AI
                </Button>
              </div>
            )
          },
          {
            key: 'background',
            label: 'Background',
            children: (
              <div>
                <TextArea
                  rows={10}
                  value={content.background}
                  onChange={e => setContent({ ...content, background: e.target.value })}
                  placeholder="Background context and market analysis..."
                />
                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  onClick={() => generateContent('background')}
                  loading={isProcessing}
                  className="mt-2"
                >
                  Generate with AI
                </Button>
              </div>
            )
          },
          {
            key: 'objectives',
            label: 'Objectives',
            children: (
              <div>
                <TextArea
                  rows={10}
                  value={content.objectives}
                  onChange={e => setContent({ ...content, objectives: e.target.value })}
                  placeholder="Project objectives and goals..."
                />
                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  onClick={() => generateContent('objectives')}
                  loading={isProcessing}
                  className="mt-2"
                >
                  Generate with AI
                </Button>
              </div>
            )
          },
          {
            key: 'methodology',
            label: 'Methodology',
            children: (
              <div>
                <TextArea
                  rows={10}
                  value={content.methodology}
                  onChange={e => setContent({ ...content, methodology: e.target.value })}
                  placeholder="Approach and methodology..."
                />
                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  onClick={() => generateContent('methodology')}
                  loading={isProcessing}
                  className="mt-2"
                >
                  Generate with AI
                </Button>
              </div>
            )
          },
          {
            key: 'deliverables',
            label: 'Deliverables',
            children: (
              <div>
                <TextArea
                  rows={10}
                  value={content.deliverables}
                  onChange={e => setContent({ ...content, deliverables: e.target.value })}
                  placeholder="Project deliverables..."
                />
                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  onClick={() => generateContent('deliverables')}
                  loading={isProcessing}
                  className="mt-2"
                >
                  Generate with AI
                </Button>
              </div>
            )
          },
          {
            key: 'investment',
            label: 'Investment',
            children: (
              <div>
                <TextArea
                  rows={10}
                  value={content.investment}
                  onChange={e => setContent({ ...content, investment: e.target.value })}
                  placeholder="Pricing and investment details..."
                />
                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  onClick={() => generateContent('investment')}
                  loading={isProcessing}
                  className="mt-2"
                >
                  Generate with AI
                </Button>
              </div>
            )
          },
          {
            key: 'whyUs',
            label: 'Why Us',
            children: (
              <div>
                <TextArea
                  rows={10}
                  value={content.whyUs}
                  onChange={e => setContent({ ...content, whyUs: e.target.value })}
                  placeholder="Why choose your company..."
                />
                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  onClick={() => generateContent('whyUs')}
                  loading={isProcessing}
                  className="mt-2"
                >
                  Generate with AI
                </Button>
              </div>
            )
          },
          {
            key: 'terms',
            label: 'Terms',
            children: (
              <div>
                <TextArea
                  rows={10}
                  value={content.terms}
                  onChange={e => setContent({ ...content, terms: e.target.value })}
                  placeholder="Terms and conditions..."
                />
                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  onClick={() => generateContent('terms')}
                  loading={isProcessing}
                  className="mt-2"
                >
                  Generate with AI
                </Button>
              </div>
            )
          }
        ]}
      />
    </div>
  );

  // Step 3: Preview & Export
  const renderExportStep = () => (
    <div className="space-y-6">
      <Alert
        message="Your Proposal is Ready!"
        description="Select a design theme and download your professional proposal."
        type="success"
        showIcon
      />

      <Card title={<><BgColorsOutlined /> Select Design Theme</>} className="mb-6">
        <Row gutter={[16, 16]}>
          {DESIGN_THEMES.map(theme => (
            <Col xs={24} sm={12} md={6} key={theme.id}>
              <div 
                className={`cursor-pointer rounded-lg p-4 border-2 transition-all ${selectedTheme === theme.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => setSelectedTheme(theme.id)}
              >
                <div 
                  className="h-24 rounded mb-3 flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ background: theme.previewColor }}
                >
                  Aa
                </div>
                <Text strong className="block">{theme.name}</Text>
                <Text type="secondary" className="text-xs">{theme.description}</Text>
                {selectedTheme === theme.id && <CheckCircleOutlined className="text-blue-500 ml-2" />}
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card hoverable className="text-center">
            <FileTextOutlined className="text-4xl text-blue-500 mb-3" />
            <Title level={5}>Download PDF</Title>
            <Text type="secondary" className="block mb-3">
              Professional document ready to print
            </Text>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} block>
              Print / Save as PDF
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable className="text-center">
            <EditOutlined className="text-4xl text-green-500 mb-3" />
            <Title level={5}>Download HTML</Title>
            <Text type="secondary" className="block mb-3">
              Editable document file
            </Text>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadHTML} block>
              Download HTML
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable className="text-center">
            <EyeOutlined className="text-4xl text-purple-500 mb-3" />
            <Title level={5}>Preview</Title>
            <Text type="secondary" className="block mb-3">
              View full proposal
            </Text>
            <Button icon={<EyeOutlined />} onClick={() => setShowPreview(true)} block>
              Preview Document
            </Button>
          </Card>
        </Col>
      </Row>

      <div className="text-center">
        <Button 
          type="primary"
          size="large"
          onClick={() => {
            const proposals = JSON.parse(localStorage.getItem('siyabusa_proposals') || '[]');
            proposals.push({
              id: Date.now().toString(),
              ...content,
              template: selectedTemplate,
              theme: selectedTheme,
              format: outputFormat,
              createdAt: new Date().toISOString()
            });
            localStorage.setItem('siyabusa_proposals', JSON.stringify(proposals));
            message.success('Proposal saved!');
            navigate('/app/proposals');
          }}
        >
          Save & Close
        </Button>
      </div>
    </div>
  );

  // Import Modal
  const renderImportModal = () => (
    <Modal
      open={showImportModal}
      onCancel={() => setShowImportModal(false)}
      title={<><ImportOutlined /> Import Research Data</>}
      width={700}
      footer={[
        <Button key="cancel" onClick={() => setShowImportModal(false)}>Cancel</Button>,
        <Button 
          key="process" 
          type="primary" 
          icon={<RobotOutlined />}
          loading={isProcessing}
          onClick={processImportedData}
        >
          Process & Extract Data
        </Button>
      ]}
    >
      <Alert
        message="Paste Your Research"
        description="Paste reports, market research, meeting notes, or any relevant data. The AI will extract key information including market figures, opportunities, challenges, and recommendations."
        type="info"
        showIcon
        className="mb-4"
      />

      <TextArea
        rows={15}
        value={importedData}
        onChange={e => setImportedData(e.target.value)}
        placeholder="Paste your research data here...

The AI will extract:
• Project/company names
• Market size and financial figures
• Key opportunities and challenges
• Recommendations and action items
• Statistics and findings

Example: Paste your Coffee Report, market analysis, or any research document..."
      />

      {isProcessing && (
        <div className="text-center py-4">
          <Spin />
          <Text className="block mt-2">Analyzing document...</Text>
        </div>
      )}
    </Modal>
  );

  // Preview Modal
  const renderPreviewModal = () => (
    <Modal
      open={showPreview}
      onCancel={() => setShowPreview(false)}
      width={1000}
      title="Document Preview"
      footer={[
        <Button key="close" onClick={() => setShowPreview(false)}>Close</Button>,
        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
          Print / Save as PDF
        </Button>
      ]}
      bodyStyle={{ padding: 0, background: '#525659' }}
    >
      <div className="flex justify-center p-8 bg-gray-600 overflow-auto h-[80vh]">
        <div 
          ref={previewRef}
          className="bg-white shadow-2xl origin-top transform scale-75"
          style={{ width: '800px', minHeight: '1123px' }} // A4 dimensions approx
          dangerouslySetInnerHTML={{ __html: generateProfessionalHTML().replace('</body>', '').replace('</html>', '').split('<body>')[1] }}
        />
      </div>
    </Modal>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RocketOutlined className="text-3xl" />
              <div>
                <Title level={3} className="!text-white !mb-0">SiyaBusa Proposal Builder</Title>
                <Text className="text-blue-100">Create professional proposals with AI assistance</Text>
              </div>
            </div>
            <Button type="default" onClick={() => navigate('/app/proposals')}>
              ← Back to Proposals
            </Button>
          </div>
        </div>

        {/* Steps Progress */}
        <div className="bg-white px-6 py-4 border-b">
          <Steps current={currentStep} size="small">
            <Steps.Step title="Template" />
            <Steps.Step title="Client Info" />
            <Steps.Step title="Content" />
            <Steps.Step title="Export" />
          </Steps>
        </div>

        {/* Content */}
        <Card className="rounded-t-none min-h-[500px]">
          {currentStep === 0 && renderTemplateStep()}
          {currentStep === 1 && renderClientStep()}
          {currentStep === 2 && renderContentStep()}
          {currentStep === 3 && renderExportStep()}
        </Card>

        {/* Navigation Buttons */}
        <div className="bg-white p-4 rounded-b-xl border-t flex justify-between">
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={goBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          
          <Space>
            {currentStep < 3 && (
              <Button 
                type="primary"
                onClick={goNext}
                disabled={!canGoNext()}
              >
                Next <ArrowRightOutlined />
              </Button>
            )}
          </Space>
        </div>

        {/* Modals */}
        {renderImportModal()}
        {renderPreviewModal()}
      </div>
    </div>
  );
};

export default SmartProposalBuilder;
