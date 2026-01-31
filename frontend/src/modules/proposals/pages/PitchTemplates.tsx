import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Typography, Tag, Modal, Input, Form, Select, message } from 'antd';
import {
  RocketOutlined,
  BankOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  BuildOutlined,
  TeamOutlined,
  DollarOutlined,
  EyeOutlined,
  CopyOutlined,
  CheckOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import './PitchTemplates.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  slides: number;
  style: 'light' | 'dark' | 'corporate';
  industries: string[];
  preview: string;
}

const templates: Template[] = [
  {
    id: 'investment-pitch',
    name: 'Investment Pitch',
    description: 'Clean, professional template for investment proposals. Perfect for presenting to pension funds, VCs, and institutional investors.',
    category: 'Finance',
    icon: <LineChartOutlined />,
    color: '#0f766e',
    slides: 14,
    style: 'light',
    industries: ['Finance', 'Investment', 'Agriculture', 'Infrastructure'],
    preview: 'investment',
  },
  {
    id: 'corporate-proposal',
    name: 'Corporate Proposal',
    description: 'Enterprise-grade template with sophisticated design. Ideal for B2B proposals and professional services.',
    category: 'Corporate',
    icon: <BankOutlined />,
    color: '#1e40af',
    slides: 12,
    style: 'corporate',
    industries: ['Consulting', 'Technology', 'Manufacturing'],
    preview: 'corporate',
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    description: 'Modern, bold design for technology companies. Great for seed funding and Series A pitches.',
    category: 'Technology',
    icon: <RocketOutlined />,
    color: '#7c3aed',
    slides: 10,
    style: 'dark',
    industries: ['Technology', 'SaaS', 'Fintech', 'AI/ML'],
    preview: 'tech',
  },
  {
    id: 'audit-proposal',
    name: 'Audit & Assurance',
    description: 'Professional template for audit engagement proposals. Compliance-focused with trust indicators.',
    category: 'Professional Services',
    icon: <SafetyCertificateOutlined />,
    color: '#0369a1',
    slides: 11,
    style: 'light',
    industries: ['Accounting', 'Audit', 'Compliance'],
    preview: 'audit',
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure Project',
    description: 'Government and large-scale project template. Includes impact metrics and stakeholder sections.',
    category: 'Public Sector',
    icon: <BuildOutlined />,
    color: '#065f46',
    slides: 15,
    style: 'corporate',
    industries: ['Government', 'Construction', 'Energy', 'Utilities'],
    preview: 'infrastructure',
  },
  {
    id: 'advisory-services',
    name: 'Advisory Services',
    description: 'Consulting and advisory engagement template. Focus on expertise and methodology.',
    category: 'Consulting',
    icon: <TeamOutlined />,
    color: '#92400e',
    slides: 9,
    style: 'light',
    industries: ['Consulting', 'Strategy', 'M&A', 'HR'],
    preview: 'advisory',
  },
];

// Template preview slide data with realistic content
const templatePreviews: Record<string, { slides: { title: string; content: string; metrics?: { label: string; value: string }[]; bullets?: string[]; highlight?: { label: string; value: string; desc: string } }[] }> = {
  'investment-pitch': {
    slides: [
      { 
        title: 'Dairy Value Chain Investment', 
        content: 'A Strategic Investment for Food Security, Rural Empowerment, and Import Substitution',
        metrics: [
          { label: 'Presented by', value: 'ATG Finance' },
          { label: 'Presented to', value: 'Public Service Pensions Fund' },
          { label: 'Investment Request', value: 'R14,315,710' },
          { label: 'Target IRR', value: '18.5%' },
        ],
        highlight: { label: 'Key Investment Return', value: '15%', desc: 'Annual interest payment within first five years' }
      },
      { 
        title: 'Executive Summary', 
        content: 'Transforming Eswatini\'s dairy sector through integrated value chain development',
        bullets: [
          'R14.3M investment to establish 500-cow dairy operation',
          'Projected 18.5% IRR over 7-year investment horizon',
          '200+ direct jobs created in rural communities',
          'Import substitution of 40% within 5 years'
        ]
      },
      { 
        title: 'Market Opportunity', 
        content: 'Eswatini imports 85% of dairy products worth R450M annually',
        metrics: [
          { label: 'Market Size', value: 'R450M' },
          { label: 'Import Dependency', value: '85%' },
          { label: 'Growth Rate', value: '12% YoY' },
          { label: 'Target Share', value: '40%' },
        ]
      },
      { 
        title: 'The Problem', 
        content: 'Critical gaps in local dairy production capacity',
        bullets: [
          'No commercial-scale dairy operations in the country',
          'Foreign exchange drain of R380M annually',
          'Rural unemployment at 42% in target regions',
          'Food security vulnerability to supply chain disruptions'
        ]
      },
      { 
        title: 'Our Solution', 
        content: 'Integrated dairy value chain from farm to consumer',
        bullets: [
          'Modern 500-cow dairy farm with imported genetics',
          'Processing facility for pasteurized milk & yogurt',
          'Cold chain distribution to 200+ retail points',
          'Smallholder outgrower program for 50 farmers'
        ]
      },
      { 
        title: 'Business Model', 
        content: 'Vertically integrated operations ensuring margin capture at every stage',
        metrics: [
          { label: 'Gross Margin', value: '45%' },
          { label: 'EBITDA Margin', value: '28%' },
          { label: 'Payback Period', value: '4.2 years' },
          { label: 'Break-even', value: 'Month 18' },
        ]
      },
      { 
        title: 'Competitive Advantage', 
        content: 'First-mover advantage in underserved market',
        bullets: [
          'Exclusive import license for premium Holstein genetics',
          'Government partnership with subsidized land lease',
          'Established retail relationships with Pick n Pay, Shoprite',
          'Proprietary feed formulation reducing costs by 20%'
        ]
      },
      { 
        title: 'Leadership Team', 
        content: 'Experienced management with proven track record',
        bullets: [
          'CEO: Dr. Themba Dlamini - 20 years agricultural development',
          'COO: Sarah van der Berg - Former Clover Operations Director',
          'CFO: Michael Okonkwo - Ex-Standard Bank Agri Finance',
          'CTO: Dr. James Sibanda - Veterinary & Genetics Expert'
        ]
      },
      { 
        title: 'Financial Projections', 
        content: '5-year revenue and profitability forecast',
        metrics: [
          { label: 'Year 1 Revenue', value: 'R12.5M' },
          { label: 'Year 3 Revenue', value: 'R45.8M' },
          { label: 'Year 5 Revenue', value: 'R78.2M' },
          { label: 'Year 5 EBITDA', value: 'R21.9M' },
        ]
      },
      { 
        title: 'Investment Structure', 
        content: 'Seeking R14,315,710 in growth capital',
        metrics: [
          { label: 'Senior Debt', value: 'R8.5M' },
          { label: 'Equity', value: 'R5.8M' },
          { label: 'Instrument', value: 'Convertible Note' },
          { label: 'Term', value: '7 Years' },
        ],
        highlight: { label: 'Equity Stake Offered', value: '35%', desc: 'With board seat and quarterly reporting' }
      },
      { 
        title: 'Return Analysis', 
        content: 'Attractive risk-adjusted returns for institutional investors',
        metrics: [
          { label: 'Project IRR', value: '18.5%' },
          { label: 'Equity Multiple', value: '2.8x' },
          { label: 'Cash-on-Cash', value: '15%' },
          { label: 'NPV (12%)', value: 'R22.4M' },
        ]
      },
      { 
        title: 'Risk Mitigation', 
        content: 'Comprehensive risk management framework',
        bullets: [
          'Weather risk: Covered infrastructure with backup water',
          'Market risk: 3-year offtake agreements secured',
          'Operational risk: Insurance coverage at 120% asset value',
          'Political risk: MIGA guarantee application submitted'
        ]
      },
      { 
        title: 'Implementation Timeline', 
        content: 'Phased rollout over 24 months',
        bullets: [
          'Q1-Q2 2025: Land preparation & facility construction',
          'Q3 2025: Livestock import & team onboarding',
          'Q4 2025: Production commencement & retail launch',
          'Q2 2026: Full capacity operations achieved'
        ]
      },
      { 
        title: 'Next Steps', 
        content: 'Partner with us to transform Eswatini\'s dairy industry',
        bullets: [
          'Schedule site visit to proposed facility location',
          'Review detailed financial model and projections',
          'Meet management team and advisory board',
          'Complete due diligence and term sheet negotiation'
        ],
        highlight: { label: 'Contact', value: 'invest@atgfinance.com', desc: '+268 2404 1234 | www.atgfinance.com' }
      },
    ],
  },
  'corporate-proposal': {
    slides: [
      { 
        title: 'Digital Transformation Partnership', 
        content: 'Enterprise Technology Modernization Proposal for Meridian Holdings',
        metrics: [
          { label: 'Prepared for', value: 'Meridian Holdings Ltd' },
          { label: 'Prepared by', value: 'Nexus Consulting' },
          { label: 'Date', value: 'December 2025' },
          { label: 'Proposal #', value: 'NC-2025-0847' },
        ]
      },
      { 
        title: 'About Nexus Consulting', 
        content: 'Global technology consulting with 15 years of enterprise transformation',
        metrics: [
          { label: 'Founded', value: '2010' },
          { label: 'Employees', value: '2,400+' },
          { label: 'Countries', value: '28' },
          { label: 'Fortune 500 Clients', value: '45' },
        ]
      },
      { 
        title: 'Understanding Your Needs', 
        content: 'Key challenges identified during discovery sessions',
        bullets: [
          'Legacy ERP system limiting operational efficiency',
          'Data silos preventing real-time business insights',
          'Manual processes causing 40% productivity loss',
          'Compliance gaps in financial reporting workflows'
        ]
      },
      { 
        title: 'Our Approach', 
        content: 'Proven 4-phase transformation methodology',
        bullets: [
          'Phase 1: Assessment & Architecture Design',
          'Phase 2: Core Platform Implementation',
          'Phase 3: Integration & Data Migration',
          'Phase 4: Training & Change Management'
        ]
      },
      { 
        title: 'Proposed Solution', 
        content: 'Cloud-native ERP with AI-powered analytics',
        bullets: [
          'SAP S/4HANA Cloud deployment with industry templates',
          'Custom analytics dashboards using Power BI',
          'Automated workflow engine for approvals',
          'Mobile-first interface for field operations'
        ]
      },
      { 
        title: 'Dedicated Team', 
        content: 'Senior consultants with Meridian industry expertise',
        bullets: [
          'Project Director: Amanda Chen (18 years exp.)',
          'Solution Architect: Robert Khumalo',
          'Change Lead: Dr. Priya Sharma',
          'Technical Team: 8 certified consultants'
        ]
      },
      { 
        title: 'Success Stories', 
        content: 'Similar transformations delivered on time and budget',
        metrics: [
          { label: 'Apex Mining', value: '35% cost reduction' },
          { label: 'TechCorp SA', value: '60% faster reporting' },
          { label: 'Global Retail', value: '99.9% uptime' },
          { label: 'FinServ Ltd', value: 'Full compliance' },
        ]
      },
      { 
        title: 'Project Timeline', 
        content: '18-month implementation with quarterly milestones',
        bullets: [
          'Months 1-3: Discovery & Design',
          'Months 4-9: Build & Configure',
          'Months 10-14: Test & Migrate',
          'Months 15-18: Deploy & Optimize'
        ]
      },
      { 
        title: 'Investment Summary', 
        content: 'Transparent pricing with flexible payment terms',
        metrics: [
          { label: 'Professional Services', value: 'R4,850,000' },
          { label: 'Software Licenses', value: 'R2,200,000' },
          { label: 'Training & Support', value: 'R650,000' },
          { label: 'Total Investment', value: 'R7,700,000' },
        ]
      },
      { 
        title: 'Expected ROI', 
        content: 'Measurable business outcomes within 24 months',
        metrics: [
          { label: 'Process Efficiency', value: '+45%' },
          { label: 'Operating Costs', value: '-30%' },
          { label: 'Revenue Growth', value: '+18%' },
          { label: 'Payback Period', value: '14 months' },
        ],
        highlight: { label: '3-Year NPV', value: 'R24.5M', desc: 'Based on conservative growth assumptions' }
      },
      { 
        title: 'Terms & Conditions', 
        content: 'Standard engagement framework with SLA guarantees',
        bullets: [
          'Fixed-price delivery with milestone payments',
          '99.5% uptime SLA during first year',
          '24/7 support during go-live period',
          '12-month warranty on all custom development'
        ]
      },
      { 
        title: 'Let\'s Get Started', 
        content: 'We\'re ready to begin your transformation journey',
        bullets: [
          'Sign proposal and initiate kickoff meeting',
          'Complete stakeholder interviews (Week 1-2)',
          'Deliver detailed project charter (Week 3)',
          'Begin Phase 1 execution (Week 4)'
        ],
        highlight: { label: 'Your Contact', value: 'Amanda Chen', desc: 'amanda.chen@nexusconsulting.com | +27 11 555 0100' }
      },
    ],
  },
  'tech-startup': {
    slides: [
      { 
        title: 'FluxPay', 
        content: 'The Future of Cross-Border Payments in Africa',
        metrics: [
          { label: 'Stage', value: 'Series A' },
          { label: 'Raising', value: '$8M' },
          { label: 'Valuation', value: '$40M' },
          { label: 'Traction', value: '$2.3M ARR' },
        ]
      },
      { 
        title: 'The Problem', 
        content: 'Cross-border payments in Africa are slow, expensive, and unreliable',
        metrics: [
          { label: 'Avg. Transfer Fee', value: '9.2%' },
          { label: 'Settlement Time', value: '3-5 days' },
          { label: 'Failed Payments', value: '23%' },
          { label: 'Annual Volume', value: '$48B' },
        ]
      },
      { 
        title: 'Our Solution', 
        content: 'Instant, low-cost transfers powered by blockchain rails',
        bullets: [
          'Real-time settlement using stablecoin infrastructure',
          '0.5% flat fee vs. 9% industry average',
          'API-first for seamless business integration',
          'Local currency on/off ramps in 12 countries'
        ]
      },
      { 
        title: 'Market Size', 
        content: 'Massive opportunity in underserved markets',
        metrics: [
          { label: 'TAM', value: '$48B' },
          { label: 'SAM', value: '$12B' },
          { label: 'SOM (5yr)', value: '$600M' },
          { label: 'CAGR', value: '24%' },
        ]
      },
      { 
        title: 'Traction', 
        content: 'Exponential growth since launch 18 months ago',
        metrics: [
          { label: 'ARR', value: '$2.3M' },
          { label: 'MoM Growth', value: '28%' },
          { label: 'Active Users', value: '45,000' },
          { label: 'Volume Processed', value: '$180M' },
        ],
        highlight: { label: 'Net Revenue Retention', value: '145%', desc: 'Indicating strong product-market fit' }
      },
      { 
        title: 'Business Model', 
        content: 'Multiple revenue streams with strong unit economics',
        metrics: [
          { label: 'Gross Margin', value: '72%' },
          { label: 'CAC', value: '$45' },
          { label: 'LTV', value: '$380' },
          { label: 'LTV:CAC', value: '8.4x' },
        ]
      },
      { 
        title: 'Competition', 
        content: 'Differentiated position in fragmented market',
        bullets: [
          'vs. Banks: 10x faster, 18x cheaper',
          'vs. Western Union: Digital-first, no branches',
          'vs. Wise: Africa-focused local expertise',
          'vs. Crypto: Regulatory compliant, fiat rails'
        ]
      },
      { 
        title: 'Team', 
        content: 'Operators who\'ve built fintech at scale',
        bullets: [
          'CEO: Amara Osei - Ex-Stripe Africa Lead',
          'CTO: David Kim - Former Coinbase Engineer',
          'COO: Fatima Hassan - Built Jumia Payments',
          'Advisors: Execs from Flutterwave, Chipper Cash'
        ]
      },
      { 
        title: 'Financials', 
        content: 'Path to profitability with Series A capital',
        metrics: [
          { label: '2024 Revenue', value: '$2.3M' },
          { label: '2025 Projected', value: '$8.5M' },
          { label: '2026 Projected', value: '$24M' },
          { label: 'Breakeven', value: 'Q3 2026' },
        ]
      },
      { 
        title: 'The Ask', 
        content: 'Raising $8M to accelerate growth',
        bullets: [
          'Product: New currencies & enterprise features (40%)',
          'Go-to-market: Sales & partnerships (35%)',
          'Compliance: Licenses in 5 new markets (15%)',
          'Team: Key engineering & ops hires (10%)'
        ],
        highlight: { label: 'Committed', value: '$4.2M', desc: 'From Andreessen Horowitz & existing investors' }
      },
    ],
  },
  'audit-proposal': {
    slides: [
      { 
        title: 'Audit & Assurance Proposal', 
        content: 'External Audit Services for Horizon Manufacturing Ltd',
        metrics: [
          { label: 'Prepared by', value: 'Sterling & Associates' },
          { label: 'For FY Ending', value: '31 December 2025' },
          { label: 'Proposal Date', value: '15 December 2025' },
          { label: 'Valid Until', value: '15 January 2026' },
        ]
      },
      { 
        title: 'Firm Profile', 
        content: 'Top 10 audit firm with manufacturing expertise',
        metrics: [
          { label: 'Established', value: '1987' },
          { label: 'Partners', value: '42' },
          { label: 'Professional Staff', value: '380' },
          { label: 'Manufacturing Clients', value: '65+' },
        ]
      },
      { 
        title: 'Understanding Horizon', 
        content: 'Key aspects of your business we\'ve considered',
        bullets: [
          'R850M revenue with 3 manufacturing facilities',
          'Complex inventory valuation (FIFO method)',
          'Related party transactions with group entities',
          'IFRS compliance with first-time BEE reporting'
        ]
      },
      { 
        title: 'Scope of Work', 
        content: 'Comprehensive audit covering all material areas',
        bullets: [
          'Statutory audit of annual financial statements',
          'Review of internal controls over financial reporting',
          'Tax compliance review and optimization',
          'BEE verification support and documentation'
        ]
      },
      { 
        title: 'Our Methodology', 
        content: 'Risk-based approach aligned with ISA standards',
        bullets: [
          'Phase 1: Planning & risk assessment',
          'Phase 2: Interim testing of controls',
          'Phase 3: Year-end substantive procedures',
          'Phase 4: Reporting & management letter'
        ]
      },
      { 
        title: 'Your Engagement Team', 
        content: 'Experienced professionals dedicated to Horizon',
        bullets: [
          'Engagement Partner: CA(SA) Peter Naidoo - 22 years',
          'Audit Manager: CA(SA) Linda Mokoena - 12 years',
          'Senior Associate: Thabo Sithole - Manufacturing specialist',
          'IT Auditor: Priya Pillay - Systems controls expert'
        ]
      },
      { 
        title: 'Timeline', 
        content: 'Efficient execution minimizing business disruption',
        bullets: [
          'Nov 2025: Planning & interim fieldwork',
          'Jan 2026: Year-end inventory observation',
          'Feb 2026: Final audit fieldwork',
          'Mar 2026: Audit opinion & AGM support'
        ]
      },
      { 
        title: 'Deliverables', 
        content: 'Comprehensive reporting package',
        bullets: [
          'Independent auditor\'s report (unqualified target)',
          'Detailed management letter with recommendations',
          'Audit committee presentation',
          'Tax computation review memorandum'
        ]
      },
      { 
        title: 'Professional Fees', 
        content: 'Competitive pricing reflecting scope and expertise',
        metrics: [
          { label: 'Statutory Audit', value: 'R485,000' },
          { label: 'Tax Review', value: 'R65,000' },
          { label: 'BEE Verification', value: 'R35,000' },
          { label: 'Total Fees', value: 'R585,000' },
        ]
      },
      { 
        title: 'Our Commitment', 
        content: 'Quality assurance at every stage',
        bullets: [
          'IRBA registered with clean inspection record',
          'Engagement quality control review on all audits',
          'Partner involvement minimum 20% of audit hours',
          '48-hour response time for all queries'
        ]
      },
      { 
        title: 'Engagement Terms', 
        content: 'Standard terms aligned with professional standards',
        bullets: [
          'Engagement letter per ISA 210 requirements',
          'Payment: 50% on acceptance, 50% on completion',
          'Scope changes subject to mutual agreement',
          'Professional indemnity: R50M coverage'
        ],
        highlight: { label: 'Contact', value: 'Peter Naidoo', desc: 'peter.naidoo@sterling.co.za | +27 11 784 5500' }
      },
    ],
  },
  'infrastructure': {
    slides: [
      { 
        title: 'Solar Energy Park Development', 
        content: 'Renewable Energy Infrastructure for Eastern Province',
        metrics: [
          { label: 'Proponent', value: 'GreenGrid Energy' },
          { label: 'Capacity', value: '150 MW' },
          { label: 'Investment', value: 'R2.8 Billion' },
          { label: 'Jobs Created', value: '1,200+' },
        ]
      },
      { 
        title: 'Project Background', 
        content: 'Addressing the national energy crisis through renewable infrastructure',
        bullets: [
          'Load shedding causing R500M daily economic losses',
          'Government target: 30% renewable by 2030',
          'Eastern Province has optimal solar irradiance',
          'Grid infrastructure already in place'
        ]
      },
      { 
        title: 'Project Objectives', 
        content: 'Aligned with national development priorities',
        bullets: [
          'Add 150MW clean energy to national grid',
          'Reduce carbon emissions by 280,000 tons/year',
          'Create 1,200 construction & 85 permanent jobs',
          'Develop local manufacturing supply chain'
        ]
      },
      { 
        title: 'Technical Scope', 
        content: '150MW utility-scale photovoltaic installation',
        metrics: [
          { label: 'Panel Count', value: '320,000' },
          { label: 'Land Area', value: '280 hectares' },
          { label: 'Annual Output', value: '285 GWh' },
          { label: 'Grid Connection', value: '132kV' },
        ]
      },
      { 
        title: 'Key Stakeholders', 
        content: 'Multi-party collaboration for project success',
        bullets: [
          'GreenGrid Energy: Developer & operator',
          'Department of Energy: Regulatory oversight',
          'Eskom: Grid connection & offtake',
          'Eastern Province Government: Land & permits'
        ]
      },
      { 
        title: 'Engineering Approach', 
        content: 'Proven technology with local adaptation',
        bullets: [
          'Tier 1 bifacial panels (JA Solar, Longi)',
          'Single-axis tracking for 25% yield boost',
          'Battery storage: 50MWh for grid stability',
          'Smart monitoring with AI predictive maintenance'
        ]
      },
      { 
        title: 'Environmental Impact', 
        content: 'Positive environmental outcomes verified by independent EIA',
        metrics: [
          { label: 'CO2 Avoided', value: '280,000 t/yr' },
          { label: 'Water Saved', value: '450M liters/yr' },
          { label: 'Land Rehab', value: '40 hectares' },
          { label: 'Biodiversity', value: 'Net positive' },
        ]
      },
      { 
        title: 'Social Impact', 
        content: 'Meaningful community development outcomes',
        bullets: [
          '1,200 construction jobs (80% local hiring)',
          '85 permanent operations positions',
          'R15M community trust fund annually',
          'Skills training for 500 youth'
        ]
      },
      { 
        title: 'Risk Assessment', 
        content: 'Comprehensive risk identification and mitigation',
        bullets: [
          'Construction: Fixed-price EPC contract',
          'Resource: 10-year solar data from NASA',
          'Offtake: 20-year PPA with Eskom',
          'Currency: Rand-denominated financing'
        ]
      },
      { 
        title: 'Budget Breakdown', 
        content: 'R2.8 billion capital investment',
        metrics: [
          { label: 'EPC Contract', value: 'R2.1B' },
          { label: 'Grid Connection', value: 'R280M' },
          { label: 'Development Costs', value: 'R180M' },
          { label: 'Contingency', value: 'R240M' },
        ]
      },
      { 
        title: 'Project Timeline', 
        content: '36-month development and construction schedule',
        bullets: [
          'Year 1: Permitting & financial close',
          'Year 2: Civil works & equipment procurement',
          'Year 3: Installation & commissioning',
          'Year 3 Q4: Commercial operation date'
        ]
      },
      { 
        title: 'Governance Structure', 
        content: 'Robust project management framework',
        bullets: [
          'Project Steering Committee: Quarterly oversight',
          'Independent Engineer: Technical monitoring',
          'Lenders\' Technical Advisor: Financial compliance',
          'Community Liaison: Stakeholder engagement'
        ]
      },
      { 
        title: 'Success Metrics', 
        content: 'Key performance indicators for project monitoring',
        metrics: [
          { label: 'Availability', value: '≥98%' },
          { label: 'Performance Ratio', value: '≥82%' },
          { label: 'Local Content', value: '≥45%' },
          { label: 'Safety', value: '0 LTIs' },
        ]
      },
      { 
        title: 'Approvals Required', 
        content: 'Clear path to implementation',
        bullets: [
          'Environmental authorization: Approved ✓',
          'Grid connection agreement: In progress',
          'Water use license: Submitted',
          'PPA negotiation: Final stages'
        ]
      },
      { 
        title: 'Supporting Documentation', 
        content: 'Comprehensive technical appendices available',
        bullets: [
          'Appendix A: Detailed engineering specifications',
          'Appendix B: Environmental impact assessment',
          'Appendix C: Financial model & assumptions',
          'Appendix D: Legal due diligence report'
        ],
        highlight: { label: 'Project Contact', value: 'projects@greengrid.co.za', desc: '+27 21 555 8800 | www.greengrid.co.za' }
      },
    ],
  },
  'advisory-services': {
    slides: [
      { 
        title: 'M&A Advisory Services', 
        content: 'Strategic Acquisition Support for Quantum Industries',
        metrics: [
          { label: 'Advisor', value: 'Catalyst Partners' },
          { label: 'Client', value: 'Quantum Industries' },
          { label: 'Target', value: 'TechFlow Systems' },
          { label: 'Deal Size', value: 'R180-220M' },
        ]
      },
      { 
        title: 'About Catalyst Partners', 
        content: 'Boutique M&A advisory with deep sector expertise',
        metrics: [
          { label: 'Deals Closed', value: '85+' },
          { label: 'Deal Value', value: 'R12B+' },
          { label: 'Success Rate', value: '94%' },
          { label: 'Avg. Premium', value: '32%' },
        ]
      },
      { 
        title: 'Transaction Overview', 
        content: 'Horizontal acquisition to accelerate growth strategy',
        bullets: [
          'TechFlow: R180M revenue, 35% growth, profitable',
          'Strategic fit: Complementary products, shared customers',
          'Synergies: R25M annual cost savings identified',
          'Timeline: Target close by Q2 2026'
        ]
      },
      { 
        title: 'Our Approach', 
        content: 'Full-service advisory from strategy to integration',
        bullets: [
          'Phase 1: Valuation & deal structuring',
          'Phase 2: Due diligence coordination',
          'Phase 3: Negotiation & documentation',
          'Phase 4: Closing & integration support'
        ]
      },
      { 
        title: 'Workstream Details', 
        content: 'Comprehensive service delivery',
        bullets: [
          'Financial DD: Analysis of 3-year financials & forecasts',
          'Commercial DD: Market position & customer analysis',
          'Legal DD: Contracts, IP, litigation review',
          'Integration: Day 1 readiness & 100-day plan'
        ]
      },
      { 
        title: 'Your Advisory Team', 
        content: 'Senior partners leading every workstream',
        bullets: [
          'Lead Partner: James Molefe - 45 deals, R8B value',
          'Financial DD: Sarah Chen, CFA - PE background',
          'Commercial: Dr. Aisha Patel - Strategy consultant',
          'Legal: Adv. Michael Thompson - M&A specialist'
        ]
      },
      { 
        title: 'Track Record', 
        content: 'Recent relevant transactions',
        metrics: [
          { label: 'DataCorp/InfoTech', value: 'R250M - 2024' },
          { label: 'Apex/Zenith', value: 'R180M - 2024' },
          { label: 'Nova/Stellar', value: 'R120M - 2023' },
          { label: 'Prime/Select', value: 'R95M - 2023' },
        ]
      },
      { 
        title: 'Fees & Timeline', 
        content: 'Success-aligned fee structure',
        metrics: [
          { label: 'Retainer', value: 'R350,000' },
          { label: 'Success Fee', value: '1.5% of deal value' },
          { label: 'Timeline', value: '4-6 months' },
          { label: 'Expenses', value: 'Capped at R75K' },
        ],
        highlight: { label: 'Estimated Total', value: 'R3.1-3.7M', desc: 'Based on R180-220M transaction value' }
      },
      { 
        title: 'Next Steps', 
        content: 'Ready to commence upon your instruction',
        bullets: [
          'Execute engagement letter & NDA',
          'Kick-off meeting with management team',
          'Issue preliminary information request',
          'Deliver initial valuation within 3 weeks'
        ],
        highlight: { label: 'Contact', value: 'James Molefe', desc: 'james@catalystpartners.co.za | +27 11 447 3200' }
      },
    ],
  },
};

const PitchTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [form] = Form.useForm();

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setCurrentSlide(0);
    setIsPreviewOpen(true);
  };

  const nextSlide = () => {
    if (previewTemplate) {
      const slides = templatePreviews[previewTemplate.id]?.slides || [];
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      }
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleCreatePitch = () => {
    message.success(`Creating pitch from "${selectedTemplate?.name}" template`);
    setIsModalOpen(false);
    navigate('/app/proposals/pitch/builder');
  };

  return (
    <div className="pitch-templates-page">
      {/* Header */}
      <div className="templates-header">
        <div>
          <Title level={2}>Pitch Templates</Title>
          <Text type="secondary">Fortune 500-level presentation templates for every use case</Text>
        </div>
        <Button type="primary" icon={<RocketOutlined />} onClick={() => navigate('/app/proposals/pitch/builder')}>
          Start from Scratch
        </Button>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <Button type="text" className="active">All Templates</Button>
        <Button type="text">Finance</Button>
        <Button type="text">Corporate</Button>
        <Button type="text">Technology</Button>
        <Button type="text">Professional Services</Button>
        <Button type="text">Public Sector</Button>
      </div>

      {/* Templates Grid */}
      <Row gutter={[24, 24]} className="templates-grid">
        {templates.map((template) => (
          <Col xs={24} sm={12} lg={8} key={template.id}>
            <Card 
              className={`template-card style-${template.style}`}
              hoverable
            >
              {/* Preview Area */}
              <div 
                className="template-preview"
                style={{ 
                  background: template.style === 'dark' 
                    ? `linear-gradient(135deg, ${template.color} 0%, #1f2937 100%)`
                    : template.style === 'corporate'
                    ? `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`
                    : '#ffffff'
                }}
              >
                {/* Mini Preview */}
                <div className="mini-preview">
                  <div className="preview-header" style={{ borderColor: template.color }}>
                    <div className="preview-logo" style={{ background: template.color }}>
                      {template.icon}
                    </div>
                    <div className="preview-title-area">
                      <div className="preview-title-bar" style={{ background: template.color }}></div>
                      <div className="preview-subtitle-bar"></div>
                    </div>
                  </div>
                  <div className="preview-content">
                    <div className="preview-box"></div>
                    <div className="preview-box"></div>
                    <div className="preview-box"></div>
                  </div>
                </div>
                
                {/* Hover Actions */}
                <div className="preview-actions">
                  <Button icon={<EyeOutlined />} ghost onClick={() => handlePreview(template)}>Preview</Button>
                  <Button type="primary" icon={<CopyOutlined />} onClick={() => handleUseTemplate(template)}>
                    Use Template
                  </Button>
                </div>
              </div>

              {/* Card Content */}
              <div className="template-content">
                <div className="template-icon" style={{ background: `${template.color}15`, color: template.color }}>
                  {template.icon}
                </div>
                <div className="template-info">
                  <Title level={5}>{template.name}</Title>
                  <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                    {template.description}
                  </Paragraph>
                </div>
                <div className="template-meta">
                  <Tag color={template.color}>{template.category}</Tag>
                  <Text type="secondary">{template.slides} slides</Text>
                </div>
                <div className="template-industries">
                  {template.industries.slice(0, 3).map((ind, i) => (
                    <Tag key={i}>{ind}</Tag>
                  ))}
                  {template.industries.length > 3 && (
                    <Tag>+{template.industries.length - 3}</Tag>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Featured Section */}
      <div className="featured-section">
        <div className="featured-header">
          <Title level={4}>⭐ Featured: Investment Pitch Template</Title>
          <Text type="secondary">Our most popular template for financial proposals</Text>
        </div>
        <Card className="featured-card">
          <Row gutter={48}>
            <Col span={14}>
              {/* Full Preview */}
              <div className="full-preview investment-style">
                <div className="preview-slide">
                  <div className="slide-header">
                    <div className="company-badge">
                      <span className="badge-icon">ATG</span>
                      <div className="badge-text">
                        <span className="badge-title">DAIRY VALUE CHAIN INVESTMENT</span>
                        <span className="badge-subtitle">Strategic Initiative for Food Security</span>
                      </div>
                    </div>
                    <span className="slide-number">1/14</span>
                  </div>
                  <div className="slide-accent-bar"></div>
                  <div className="slide-content">
                    <h2>Transforming Eswatini's Dairy Sector</h2>
                    <p>A Strategic Investment for Food Security, Rural Empowerment, and Import Substitution</p>
                    <div className="slide-info-boxes">
                      <div className="info-box">
                        <span className="label">Presented by</span>
                        <span className="value">ATG Finance</span>
                      </div>
                      <div className="info-box">
                        <span className="label">Presented to</span>
                        <span className="value">Public Service Pensions Fund (PSPF)</span>
                      </div>
                      <div className="info-box">
                        <span className="label">Investment Request</span>
                        <span className="value highlight">R14,315,710.00</span>
                      </div>
                      <div className="info-box">
                        <span className="label">Year</span>
                        <span className="value">2025</span>
                      </div>
                    </div>
                    <div className="slide-highlight-box">
                      <span className="highlight-label">Key Investment Return:</span>
                      <span className="highlight-value">15%</span>
                      <span className="highlight-desc">Interest payment return within first five years of operation</span>
                    </div>
                  </div>
                  <div className="slide-dots">
                    <span className="dot active"></span>
                    {[...Array(13)].map((_, i) => <span key={i} className="dot"></span>)}
                  </div>
                </div>
              </div>
            </Col>
            <Col span={10}>
              <div className="featured-info">
                <Title level={3}>Investment Pitch Template</Title>
                <Paragraph>
                  Professional, clean design optimized for pension funds, institutional investors, 
                  and government bodies. Features include:
                </Paragraph>
                <ul className="feature-list">
                  <li><CheckOutlined /> Clean light theme with accent colors</li>
                  <li><CheckOutlined /> Key metrics prominently displayed</li>
                  <li><CheckOutlined /> Professional info boxes layout</li>
                  <li><CheckOutlined /> ROI/Return highlight section</li>
                  <li><CheckOutlined /> Slide progress indicator</li>
                  <li><CheckOutlined /> Corporate branding integration</li>
                  <li><CheckOutlined /> 14 pre-designed slides</li>
                </ul>
                <div className="featured-actions">
                  <Button type="primary" size="large" icon={<CopyOutlined />} onClick={() => handleUseTemplate(templates[0])}>
                    Use This Template
                  </Button>
                  <Button size="large" icon={<EyeOutlined />} onClick={() => handlePreview(templates[0])}>
                    Full Preview
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Create from Template Modal */}
      <Modal
        title={`Create Pitch from "${selectedTemplate?.name}"`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Pitch Name" name="pitchName" rules={[{ required: true }]}>
            <Input placeholder="e.g., Q1 2025 Investment Proposal" />
          </Form.Item>
          <Form.Item label="Client/Company Name" name="clientName" rules={[{ required: true }]}>
            <Input placeholder="e.g., Nexus Industries Ltd" />
          </Form.Item>
          <Form.Item label="Your Company Name" name="companyName">
            <Input placeholder="e.g., WorldClass ERP" defaultValue="WorldClass ERP" />
          </Form.Item>
          <Form.Item label="Industry" name="industry">
            <Select placeholder="Select industry">
              {selectedTemplate?.industries.map((ind) => (
                <Option key={ind} value={ind}>{ind}</Option>
              ))}
            </Select>
          </Form.Item>
          <div className="modal-actions">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={handleCreatePitch}>
              Create Pitch
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Template Preview Modal */}
      <Modal
        title={null}
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={null}
        width={1000}
        className="template-preview-modal"
        centered
      >
        {previewTemplate && (
          <div className="preview-modal-content">
            {/* Preview Header */}
            <div className="preview-modal-header">
              <div className="preview-template-info">
                <div className="preview-template-icon" style={{ background: `${previewTemplate.color}15`, color: previewTemplate.color }}>
                  {previewTemplate.icon}
                </div>
                <div>
                  <Title level={4} style={{ margin: 0 }}>{previewTemplate.name}</Title>
                  <Text type="secondary">{previewTemplate.slides} slides • {previewTemplate.style} theme</Text>
                </div>
              </div>
              <Button type="primary" icon={<CopyOutlined />} onClick={() => { setIsPreviewOpen(false); handleUseTemplate(previewTemplate); }}>
                Use This Template
              </Button>
            </div>

            {/* Slide Preview Area */}
            <div 
              className={`preview-slide-area theme-${previewTemplate.style}`}
              style={{ 
                '--accent-color': previewTemplate.color,
                background: previewTemplate.style === 'dark' 
                  ? `linear-gradient(135deg, ${previewTemplate.color} 0%, #1f2937 100%)`
                  : previewTemplate.style === 'corporate'
                  ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                  : '#ffffff'
              } as React.CSSProperties}
            >
              {/* Slide Content */}
              <div className="preview-slide-content">
                <div className="slide-badge" style={{ background: previewTemplate.color }}>
                  {previewTemplate.icon}
                </div>
                <h2 className={previewTemplate.style === 'dark' ? 'text-white' : ''}>
                  {templatePreviews[previewTemplate.id]?.slides[currentSlide]?.title || 'Slide'}
                </h2>
                <p className={previewTemplate.style === 'dark' ? 'text-white-secondary' : ''}>
                  {templatePreviews[previewTemplate.id]?.slides[currentSlide]?.content || 'Content'}
                </p>
                
                {/* Metrics Grid */}
                {templatePreviews[previewTemplate.id]?.slides[currentSlide]?.metrics && (
                  <div className="preview-metrics-grid">
                    {templatePreviews[previewTemplate.id]?.slides[currentSlide]?.metrics?.map((metric, idx) => (
                      <div key={idx} className={`preview-metric-box ${previewTemplate.style === 'dark' ? 'dark' : ''}`}>
                        <span className="metric-label">{metric.label}</span>
                        <span className="metric-value" style={{ color: previewTemplate.color }}>{metric.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bullet Points */}
                {templatePreviews[previewTemplate.id]?.slides[currentSlide]?.bullets && (
                  <ul className={`preview-bullets ${previewTemplate.style === 'dark' ? 'dark' : ''}`}>
                    {templatePreviews[previewTemplate.id]?.slides[currentSlide]?.bullets?.map((bullet, idx) => (
                      <li key={idx}>
                        <CheckOutlined style={{ color: previewTemplate.color, marginRight: 8 }} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Highlight Box */}
                {templatePreviews[previewTemplate.id]?.slides[currentSlide]?.highlight && (
                  <div className="preview-highlight-box" style={{ borderColor: previewTemplate.color, background: `${previewTemplate.color}10` }}>
                    <span className="highlight-label">{templatePreviews[previewTemplate.id]?.slides[currentSlide]?.highlight?.label}</span>
                    <span className="highlight-value" style={{ color: previewTemplate.color }}>
                      {templatePreviews[previewTemplate.id]?.slides[currentSlide]?.highlight?.value}
                    </span>
                    <span className="highlight-desc">{templatePreviews[previewTemplate.id]?.slides[currentSlide]?.highlight?.desc}</span>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="preview-navigation">
                <Button 
                  onClick={prevSlide} 
                  disabled={currentSlide === 0}
                >
                  Previous
                </Button>
                <div className="preview-slide-counter">
                  <span style={{ color: previewTemplate.color, fontWeight: 600 }}>{currentSlide + 1}</span>
                  <span> / {templatePreviews[previewTemplate.id]?.slides.length || previewTemplate.slides}</span>
                </div>
                <Button 
                  onClick={nextSlide}
                  disabled={currentSlide >= (templatePreviews[previewTemplate.id]?.slides.length || previewTemplate.slides) - 1}
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Slide Thumbnails */}
            <div className="preview-thumbnails">
              {(templatePreviews[previewTemplate.id]?.slides || []).map((slide, index) => (
                <div 
                  key={index}
                  className={`preview-thumbnail ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  style={{ borderColor: index === currentSlide ? previewTemplate.color : 'transparent' }}
                >
                  <span className="thumbnail-number">{index + 1}</span>
                  <span className="thumbnail-title">{slide.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PitchTemplates;
