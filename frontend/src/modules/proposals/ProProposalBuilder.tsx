import React, { useState, useCallback } from 'react';
import { 
  Card, Button, Input, Steps, Typography, Space, Divider, 
  Upload, message, Modal, Radio, Select, Row, Col, Tooltip,
  Progress, Tag, Alert, Tabs, List, Spin
} from 'antd';
import { 
  RocketOutlined, FileTextOutlined, UploadOutlined, 
  BulbOutlined, CheckCircleOutlined, EditOutlined,
  DownloadOutlined, SendOutlined, CopyOutlined,
  PlusOutlined, DeleteOutlined, EyeOutlined,
  FilePdfOutlined, DesktopOutlined, ImportOutlined,
  QuestionCircleOutlined, RobotOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

// Professional proposal templates
const PROPOSAL_TEMPLATES = [
  {
    id: 'consulting',
    name: 'Business Consulting',
    description: 'Professional services, strategy, and advisory',
    icon: '💼',
    color: '#1890ff',
    sections: ['executive_summary', 'client_challenges', 'proposed_solution', 'methodology', 'team', 'investment', 'timeline', 'why_us']
  },
  {
    id: 'technology',
    name: 'Technology Solution',
    description: 'Software, IT infrastructure, digital transformation',
    icon: '💻',
    color: '#722ed1',
    sections: ['executive_summary', 'current_state', 'proposed_solution', 'technical_approach', 'implementation', 'investment', 'support', 'why_us']
  },
  {
    id: 'marketing',
    name: 'Marketing & Creative',
    description: 'Branding, campaigns, digital marketing',
    icon: '🎨',
    color: '#eb2f96',
    sections: ['executive_summary', 'market_analysis', 'creative_strategy', 'campaign_plan', 'deliverables', 'investment', 'metrics', 'why_us']
  },
  {
    id: 'construction',
    name: 'Construction & Engineering',
    description: 'Building projects, infrastructure, engineering',
    icon: '🏗️',
    color: '#fa8c16',
    sections: ['executive_summary', 'project_scope', 'technical_specifications', 'methodology', 'safety', 'investment', 'timeline', 'why_us']
  },
  {
    id: 'financial',
    name: 'Financial Services',
    description: 'Investment, audit, accounting, tax',
    icon: '📊',
    color: '#52c41a',
    sections: ['executive_summary', 'scope_of_work', 'approach', 'compliance', 'deliverables', 'investment', 'team', 'why_us']
  },
  {
    id: 'custom',
    name: 'Custom Proposal',
    description: 'Build your own structure',
    icon: '✨',
    color: '#13c2c2',
    sections: ['executive_summary', 'proposed_solution', 'investment', 'why_us']
  }
];

// AI Questions for each section
const SECTION_QUESTIONS: Record<string, { question: string; placeholder: string; aiPrompt: string }[]> = {
  client_info: [
    { question: "What is the client's company name?", placeholder: "e.g., ABC Corporation", aiPrompt: "client company name" },
    { question: "Who is the primary contact?", placeholder: "e.g., John Smith, CEO", aiPrompt: "contact person and title" },
    { question: "What industry are they in?", placeholder: "e.g., Financial Services", aiPrompt: "industry sector" },
    { question: "What is their company size?", placeholder: "e.g., 500+ employees, R200M revenue", aiPrompt: "company size" },
  ],
  executive_summary: [
    { question: "What is the main objective of this proposal?", placeholder: "What are you proposing to do?", aiPrompt: "main proposal objective" },
    { question: "What key value will you deliver?", placeholder: "Cost savings, efficiency, growth, etc.", aiPrompt: "key value proposition" },
    { question: "What is the expected outcome?", placeholder: "Expected results or ROI", aiPrompt: "expected outcomes" },
  ],
  client_challenges: [
    { question: "What problem is the client facing?", placeholder: "Describe their main pain points", aiPrompt: "client pain points" },
    { question: "What impact does this problem have?", placeholder: "Financial, operational, strategic impact", aiPrompt: "problem impact" },
    { question: "What have they tried before?", placeholder: "Previous attempts to solve this", aiPrompt: "previous solutions attempted" },
  ],
  proposed_solution: [
    { question: "What solution are you proposing?", placeholder: "Describe your approach", aiPrompt: "proposed solution" },
    { question: "What makes this solution effective?", placeholder: "Key differentiators", aiPrompt: "solution benefits" },
    { question: "What deliverables will they receive?", placeholder: "Tangible outputs", aiPrompt: "deliverables" },
  ],
  methodology: [
    { question: "How will you execute this project?", placeholder: "Your approach and process", aiPrompt: "execution methodology" },
    { question: "What phases or stages are involved?", placeholder: "Project phases", aiPrompt: "project phases" },
  ],
  investment: [
    { question: "What is the total investment required?", placeholder: "e.g., R500,000", aiPrompt: "total investment" },
    { question: "How is it structured?", placeholder: "Payment terms, milestones", aiPrompt: "payment structure" },
  ],
  why_us: [
    { question: "What makes your company the right choice?", placeholder: "Your unique qualifications", aiPrompt: "company differentiators" },
    { question: "What relevant experience do you have?", placeholder: "Similar projects, credentials", aiPrompt: "relevant experience" },
  ]
};

interface ProposalData {
  template: string;
  format: 'proposal' | 'pitch';
  client: {
    company: string;
    contact: string;
    email: string;
    industry: string;
    size: string;
  };
  sections: Record<string, string>;
  lineItems: Array<{ description: string; quantity: number; rate: number }>;
  importedData: string;
}

const ProProposalBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'proposal' | 'pitch'>('proposal');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDataImport, setShowDataImport] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'ai' | 'user'; content: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  const [proposalData, setProposalData] = useState<ProposalData>({
    template: '',
    format: 'proposal',
    client: { company: '', contact: '', email: '', industry: '', size: '' },
    sections: {},
    lineItems: [{ description: '', quantity: 1, rate: 0 }],
    importedData: ''
  });

  // Get tenant info
  const getTenantInfo = () => {
    try {
      const auth = localStorage.getItem('siyabusa_auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        return {
          company: parsed.tenant?.name || 'Your Company',
          user: parsed.user?.name || 'Your Name'
        };
      }
    } catch (e) {}
    return { company: 'Your Company', user: 'Your Name' };
  };

  const tenantInfo = getTenantInfo();

  // AI Enhancement function
  const enhanceWithAI = async (section: string, currentContent: string) => {
    setIsAIProcessing(true);
    
    // Simulate AI processing with intelligent content generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const template = PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate);
    const clientName = proposalData.client.company || '[Client Name]';
    const industry = proposalData.client.industry || 'business';
    
    const aiContent: Record<string, string> = {
      executive_summary: `${tenantInfo.company} is pleased to present this ${outputFormat === 'pitch' ? 'investment opportunity' : 'proposal'} to ${clientName}.

After careful analysis of your requirements and objectives, we have developed a comprehensive solution designed to address your specific challenges and deliver measurable results.

**Key Highlights:**
• Tailored approach aligned with your strategic objectives
• Proven methodology with track record of success
• Dedicated team of experienced professionals
• Clear milestones and deliverables
• Transparent pricing with defined ROI metrics

We are confident that our partnership will create significant value for ${clientName} and look forward to discussing this proposal in detail.`,

      client_challenges: `Based on our initial discussions and analysis, ${clientName} is facing several critical challenges that require immediate attention:

**Primary Challenges:**
1. **Operational Efficiency** - Current processes are creating bottlenecks and limiting scalability
2. **Market Position** - Competitive pressures are impacting market share
3. **Resource Optimization** - Existing resources are not being utilized to their full potential

**Business Impact:**
• Estimated annual cost of current inefficiencies: R2-5M
• Opportunity cost of delayed transformation
• Risk of falling behind industry standards

**Root Cause Analysis:**
These challenges stem from ${currentContent || 'legacy systems and processes that have not kept pace with industry evolution'}.`,

      proposed_solution: `${tenantInfo.company} proposes a comprehensive solution tailored to ${clientName}'s specific needs:

**Solution Overview:**
Our ${template?.name || 'professional services'} offering addresses your challenges through a structured approach:

**Phase 1: Assessment & Planning**
• Detailed current state analysis
• Stakeholder workshops and requirements gathering
• Strategic roadmap development

**Phase 2: Implementation**
• Phased deployment approach
• Change management support
• Knowledge transfer and training

**Phase 3: Optimization**
• Performance monitoring and refinement
• Continuous improvement recommendations
• Ongoing support and maintenance

**Key Deliverables:**
✓ Comprehensive assessment report
✓ Strategic implementation plan
✓ Fully deployed solution
✓ Training and documentation
✓ Post-implementation support`,

      methodology: `Our proven methodology ensures successful delivery:

**1. Discovery (Week 1-2)**
• Stakeholder interviews and workshops
• Current state documentation
• Requirements validation

**2. Design (Week 3-4)**
• Solution architecture
• Process design
• Change impact assessment

**3. Build (Week 5-8)**
• Development and configuration
• Integration and testing
• User acceptance testing

**4. Deploy (Week 9-10)**
• Phased rollout
• Training delivery
• Go-live support

**5. Optimize (Ongoing)**
• Performance monitoring
• Continuous improvement
• Knowledge transfer

**Quality Assurance:**
• Regular progress reviews
• Defined quality gates
• Risk mitigation protocols`,

      investment: `**Investment Summary for ${clientName}:**

| Component | Investment |
|-----------|-----------|
| Professional Services | R350,000 |
| Implementation | R100,000 |
| Training & Change Management | R50,000 |
| **Total Investment** | **R500,000** |

**Payment Terms:**
• 30% upon contract signature
• 40% at midpoint milestone
• 30% upon completion

**Value Proposition:**
• Expected ROI: 300%+ within 18 months
• Payback period: 6-9 months
• Annual cost savings: R1.5M+

**Investment Protection:**
• Fixed-price engagement
• Satisfaction guarantee
• Post-implementation warranty`,

      why_us: `**Why ${tenantInfo.company}?**

**Track Record:**
• 10+ years of industry experience
• 200+ successful projects delivered
• 95% client retention rate

**Our Differentiators:**
✓ **Industry Expertise** - Deep understanding of ${industry} sector challenges
✓ **Proven Methodology** - Refined approach that minimizes risk
✓ **Dedicated Team** - Senior professionals assigned to your project
✓ **Local Presence** - On-the-ground support when you need it
✓ **Partnership Approach** - We succeed only when you succeed

**Client Testimonials:**
"${tenantInfo.company} delivered exceptional results, exceeding our expectations in both quality and timeline." - Fortune 500 Client

**Certifications & Accreditations:**
• ISO 9001:2015 Certified
• Industry-recognized partnerships
• Professional body memberships

**Our Commitment:**
We are committed to delivering excellence and building a long-term partnership with ${clientName}.`
    };

    const enhanced = aiContent[section] || `Enhanced content for ${section}:\n\n${currentContent || 'Professional content tailored to your needs.'}`;
    
    setProposalData(prev => ({
      ...prev,
      sections: { ...prev.sections, [section]: enhanced }
    }));
    
    setIsAIProcessing(false);
    message.success('Content enhanced with AI');
  };

  // Import and extract data
  const handleDataImport = async () => {
    if (!proposalData.importedData.trim()) {
      message.warning('Please paste your research data first');
      return;
    }

    setIsAIProcessing(true);
    setAiChatMessages([{ role: 'ai', content: 'Analyzing your research data...' }]);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract key information from imported data
    const data = proposalData.importedData.toLowerCase();
    
    // Try to extract company name
    const companyMatch = data.match(/company[:\s]+([A-Za-z0-9\s]+)|client[:\s]+([A-Za-z0-9\s]+)/i);
    const amountMatch = data.match(/r\s*[\d,]+(?:\.\d{2})?|[\d,]+\s*(?:million|m|rand)/gi);
    
    // Update with extracted data
    setProposalData(prev => ({
      ...prev,
      client: {
        ...prev.client,
        company: companyMatch ? (companyMatch[1] || companyMatch[2] || '').trim() : prev.client.company
      }
    }));

    setAiChatMessages([
      { role: 'ai', content: 'I\'ve analyzed your research data. Here\'s what I found:' },
      { role: 'ai', content: `📊 **Data Summary:**\n• Document length: ${proposalData.importedData.length} characters\n• ${amountMatch ? `Financial figures detected: ${amountMatch.slice(0, 3).join(', ')}` : 'No specific amounts detected'}\n• ${companyMatch ? `Company reference found: ${companyMatch[1] || companyMatch[2]}` : 'No company name detected'}` },
      { role: 'ai', content: 'I\'ll use this information to pre-populate relevant sections. You can review and edit each section as we go through the proposal builder.' }
    ]);

    setIsAIProcessing(false);
    setShowDataImport(false);
    message.success('Data imported and analyzed');
  };

  // Calculate total
  const calculateTotal = () => {
    const subtotal = proposalData.lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const vat = subtotal * 0.15;
    return { subtotal, vat, total: subtotal + vat };
  };

  // Render template selection
  const renderTemplateSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Title level={3}>Choose Your Proposal Template</Title>
        <Text type="secondary">Select a professional template that matches your industry</Text>
      </div>

      <Row gutter={[16, 16]}>
        {PROPOSAL_TEMPLATES.map(template => (
          <Col xs={24} sm={12} md={8} key={template.id}>
            <Card
              hoverable
              className={`cursor-pointer transition-all ${selectedTemplate === template.id ? 'border-2 border-blue-500 shadow-lg' : ''}`}
              onClick={() => {
                setSelectedTemplate(template.id);
                setProposalData(prev => ({ ...prev, template: template.id }));
              }}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{template.icon}</div>
                <Title level={5} className="mb-1">{template.name}</Title>
                <Text type="secondary" className="text-xs">{template.description}</Text>
                {selectedTemplate === template.id && (
                  <div className="mt-3">
                    <CheckCircleOutlined className="text-blue-500 text-xl" />
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      <div className="text-center">
        <Title level={5}>Output Format</Title>
        <Radio.Group 
          value={outputFormat} 
          onChange={e => {
            setOutputFormat(e.target.value);
            setProposalData(prev => ({ ...prev, format: e.target.value }));
          }}
          size="large"
          className="mt-3"
        >
          <Radio.Button value="proposal">
            <FileTextOutlined /> Formal Proposal
          </Radio.Button>
          <Radio.Button value="pitch">
            <DesktopOutlined /> Pitch Deck
          </Radio.Button>
        </Radio.Group>
        <div className="mt-2">
          <Text type="secondary" className="text-xs">
            {outputFormat === 'proposal' 
              ? 'Professional document format with detailed sections'
              : 'Presentation-ready slides for pitching'}
          </Text>
        </div>
      </div>

      <div className="text-center mt-6">
        <Button 
          type="primary" 
          size="large"
          icon={<ImportOutlined />}
          onClick={() => setShowDataImport(true)}
          className="mr-3"
        >
          Import Research Data
        </Button>
        <Button
          type="default"
          size="large"
          disabled={!selectedTemplate}
          onClick={() => setCurrentStep(1)}
        >
          Start from Scratch →
        </Button>
      </div>
    </div>
  );

  // Render AI-guided questions
  const renderAIGuidedBuilder = () => {
    const template = PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate);
    const allSections = ['client_info', ...(template?.sections || [])];
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <RobotOutlined className="text-2xl text-blue-600" />
            <div>
              <Text strong>SiyaBusa AI Assistant</Text>
              <br />
              <Text type="secondary" className="text-xs">
                I'll guide you through creating a professional {outputFormat}. Answer the questions and I'll help enhance each section.
              </Text>
            </div>
          </div>
        </div>

        <Tabs 
          defaultActiveKey="client_info"
          type="card"
          items={allSections.map(section => ({
            key: section,
            label: section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            children: (
              <div className="p-4">
                {section === 'client_info' ? (
                  <div className="space-y-4">
                    <div>
                      <Text strong>Client Company Name *</Text>
                      <Input
                        size="large"
                        placeholder="Enter client's company name"
                        value={proposalData.client.company}
                        onChange={e => setProposalData(prev => ({
                          ...prev,
                          client: { ...prev.client, company: e.target.value }
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text strong>Contact Person</Text>
                        <Input
                          placeholder="Name and title"
                          value={proposalData.client.contact}
                          onChange={e => setProposalData(prev => ({
                            ...prev,
                            client: { ...prev.client, contact: e.target.value }
                          }))}
                          className="mt-1"
                        />
                      </Col>
                      <Col span={12}>
                        <Text strong>Email</Text>
                        <Input
                          placeholder="client@company.com"
                          value={proposalData.client.email}
                          onChange={e => setProposalData(prev => ({
                            ...prev,
                            client: { ...prev.client, email: e.target.value }
                          }))}
                          className="mt-1"
                        />
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text strong>Industry</Text>
                        <Select
                          className="w-full mt-1"
                          placeholder="Select industry"
                          value={proposalData.client.industry || undefined}
                          onChange={val => setProposalData(prev => ({
                            ...prev,
                            client: { ...prev.client, industry: val }
                          }))}
                          options={[
                            { value: 'Financial Services', label: 'Financial Services' },
                            { value: 'Technology', label: 'Technology' },
                            { value: 'Healthcare', label: 'Healthcare' },
                            { value: 'Manufacturing', label: 'Manufacturing' },
                            { value: 'Retail', label: 'Retail' },
                            { value: 'Construction', label: 'Construction' },
                            { value: 'Mining', label: 'Mining' },
                            { value: 'Agriculture', label: 'Agriculture' },
                            { value: 'Government', label: 'Government' },
                            { value: 'Education', label: 'Education' },
                            { value: 'Other', label: 'Other' }
                          ]}
                        />
                      </Col>
                      <Col span={12}>
                        <Text strong>Company Size</Text>
                        <Select
                          className="w-full mt-1"
                          placeholder="Select size"
                          value={proposalData.client.size || undefined}
                          onChange={val => setProposalData(prev => ({
                            ...prev,
                            client: { ...prev.client, size: val }
                          }))}
                          options={[
                            { value: 'Startup (1-10)', label: 'Startup (1-10 employees)' },
                            { value: 'Small (11-50)', label: 'Small (11-50 employees)' },
                            { value: 'Medium (51-200)', label: 'Medium (51-200 employees)' },
                            { value: 'Large (201-1000)', label: 'Large (201-1000 employees)' },
                            { value: 'Enterprise (1000+)', label: 'Enterprise (1000+ employees)' }
                          ]}
                        />
                      </Col>
                    </Row>
                  </div>
                ) : section === 'investment' ? (
                  <div className="space-y-4">
                    <Alert
                      message="Pricing Section"
                      description="Add line items for your pricing. VAT (15%) will be calculated automatically."
                      type="info"
                      showIcon
                      className="mb-4"
                    />
                    
                    {proposalData.lineItems.map((item, index) => (
                      <Row gutter={16} key={index} align="middle">
                        <Col span={10}>
                          <Input
                            placeholder="Service/Product description"
                            value={item.description}
                            onChange={e => {
                              const newItems = [...proposalData.lineItems];
                              newItems[index].description = e.target.value;
                              setProposalData(prev => ({ ...prev, lineItems: newItems }));
                            }}
                          />
                        </Col>
                        <Col span={4}>
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={e => {
                              const newItems = [...proposalData.lineItems];
                              newItems[index].quantity = parseInt(e.target.value) || 0;
                              setProposalData(prev => ({ ...prev, lineItems: newItems }));
                            }}
                          />
                        </Col>
                        <Col span={6}>
                          <Input
                            type="number"
                            placeholder="Rate (R)"
                            prefix="R"
                            value={item.rate}
                            onChange={e => {
                              const newItems = [...proposalData.lineItems];
                              newItems[index].rate = parseFloat(e.target.value) || 0;
                              setProposalData(prev => ({ ...prev, lineItems: newItems }));
                            }}
                          />
                        </Col>
                        <Col span={4}>
                          <Text strong>R {(item.quantity * item.rate).toLocaleString()}</Text>
                          {proposalData.lineItems.length > 1 && (
                            <Button 
                              type="text" 
                              danger 
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                const newItems = proposalData.lineItems.filter((_, i) => i !== index);
                                setProposalData(prev => ({ ...prev, lineItems: newItems }));
                              }}
                            />
                          )}
                        </Col>
                      </Row>
                    ))}
                    
                    <Button 
                      type="dashed" 
                      icon={<PlusOutlined />}
                      onClick={() => setProposalData(prev => ({
                        ...prev,
                        lineItems: [...prev.lineItems, { description: '', quantity: 1, rate: 0 }]
                      }))}
                      block
                    >
                      Add Line Item
                    </Button>

                    <Divider />
                    
                    <div className="text-right space-y-2">
                      <div><Text>Subtotal: </Text><Text strong>R {calculateTotal().subtotal.toLocaleString()}</Text></div>
                      <div><Text>VAT (15%): </Text><Text>R {calculateTotal().vat.toLocaleString()}</Text></div>
                      <div className="text-lg"><Text>Total: </Text><Text strong className="text-blue-600">R {calculateTotal().total.toLocaleString()}</Text></div>
                    </div>

                    <Divider />

                    <div>
                      <Text strong>Additional Investment Details</Text>
                      <TextArea
                        rows={4}
                        placeholder="Payment terms, milestones, ROI details..."
                        value={proposalData.sections.investment || ''}
                        onChange={e => setProposalData(prev => ({
                          ...prev,
                          sections: { ...prev.sections, investment: e.target.value }
                        }))}
                        className="mt-2"
                      />
                      <Button
                        type="link"
                        icon={<BulbOutlined />}
                        loading={isAIProcessing}
                        onClick={() => enhanceWithAI('investment', proposalData.sections.investment || '')}
                      >
                        Enhance with AI
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <Text type="secondary">
                        <QuestionCircleOutlined className="mr-2" />
                        {SECTION_QUESTIONS[section]?.[0]?.question || `Describe the ${section.replace(/_/g, ' ')} for this proposal`}
                      </Text>
                    </div>
                    
                    <TextArea
                      rows={8}
                      placeholder={SECTION_QUESTIONS[section]?.[0]?.placeholder || `Enter ${section.replace(/_/g, ' ')} content...`}
                      value={proposalData.sections[section] || ''}
                      onChange={e => setProposalData(prev => ({
                        ...prev,
                        sections: { ...prev.sections, [section]: e.target.value }
                      }))}
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        icon={<BulbOutlined />}
                        loading={isAIProcessing}
                        onClick={() => enhanceWithAI(section, proposalData.sections[section] || '')}
                      >
                        Generate with AI
                      </Button>
                      <Tooltip title="AI will create professional content based on your client info and template">
                        <QuestionCircleOutlined className="text-gray-400" />
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            )
          }))}
        />

        <div className="flex justify-between mt-6">
          <Button onClick={() => setCurrentStep(0)}>
            ← Back to Templates
          </Button>
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => setShowPreview(true)}>
              Preview
            </Button>
            <Button type="primary" onClick={() => setCurrentStep(2)}>
              Continue to Export →
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  // Render export options
  const renderExportOptions = () => {
    const { total } = calculateTotal();
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
          <Title level={3}>Your {outputFormat === 'pitch' ? 'Pitch Deck' : 'Proposal'} is Ready!</Title>
          <Text type="secondary">
            {outputFormat === 'pitch' ? 'Presentation' : 'Document'} for {proposalData.client.company || 'Client'} • Total: R {total.toLocaleString()}
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card hoverable className="text-center h-full">
              <FilePdfOutlined className="text-5xl text-red-500 mb-4" />
              <Title level={5}>Export as PDF</Title>
              <Text type="secondary" className="block mb-4">
                Professional PDF document ready for email or print
              </Text>
              <Button type="primary" icon={<DownloadOutlined />} block>
                Download PDF
              </Button>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card hoverable className="text-center h-full">
              <DesktopOutlined className="text-5xl text-blue-500 mb-4" />
              <Title level={5}>Export as Slides</Title>
              <Text type="secondary" className="block mb-4">
                PowerPoint-style presentation for pitching
              </Text>
              <Button icon={<DownloadOutlined />} block>
                Download PPTX
              </Button>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card hoverable className="text-center h-full">
              <SendOutlined className="text-5xl text-green-500 mb-4" />
              <Title level={5}>Send via Email</Title>
              <Text type="secondary" className="block mb-4">
                Send directly to {proposalData.client.email || 'client'}
              </Text>
              <Button icon={<SendOutlined />} block>
                Send Now
              </Button>
            </Card>
          </Col>
        </Row>

        <Divider />

        <div className="flex justify-between">
          <Button onClick={() => setCurrentStep(1)}>
            ← Edit Content
          </Button>
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => setShowPreview(true)}>
              Preview Full {outputFormat === 'pitch' ? 'Deck' : 'Proposal'}
            </Button>
            <Button 
              type="primary" 
              icon={<CopyOutlined />}
              onClick={() => {
                // Save to localStorage
                const proposals = JSON.parse(localStorage.getItem('siyabusa_proposals') || '[]');
                proposals.push({
                  id: Date.now().toString(),
                  ...proposalData,
                  total,
                  createdAt: new Date().toISOString()
                });
                localStorage.setItem('siyabusa_proposals', JSON.stringify(proposals));
                message.success('Proposal saved!');
                navigate('/app/proposals');
              }}
            >
              Save & Close
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  // Preview Modal
  const renderPreviewModal = () => {
    const template = PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate);
    const { subtotal, vat, total } = calculateTotal();
    
    return (
      <Modal
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setShowPreview(false)}>Close</Button>,
          <Button key="pdf" type="primary" icon={<DownloadOutlined />}>Export PDF</Button>
        ]}
        title={null}
      >
        <div className="p-8 bg-white" style={{ fontFamily: 'Georgia, serif' }}>
          {/* Header */}
          <div className="border-b-4 border-blue-600 pb-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {outputFormat === 'pitch' ? 'INVESTMENT PROPOSAL' : 'BUSINESS PROPOSAL'}
                </h1>
                <p className="text-lg text-gray-600">{template?.name}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-semibold text-blue-600">{tenantInfo.company}</h2>
                <p className="text-gray-500">{new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Prepared For */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Prepared For</p>
            <h3 className="text-2xl font-semibold">{proposalData.client.company || '[Client Company]'}</h3>
            <p className="text-gray-600">{proposalData.client.contact}</p>
            <p className="text-gray-500">{proposalData.client.email}</p>
          </div>

          {/* Sections */}
          {template?.sections.filter(s => s !== 'investment').map((section, index) => (
            <div key={section} className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                {index + 1}. {section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {proposalData.sections[section] || `[${section.replace(/_/g, ' ')} content will appear here]`}
              </div>
            </div>
          ))}

          {/* Pricing Table */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Investment Summary
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border">Description</th>
                  <th className="text-center p-3 border w-24">Qty</th>
                  <th className="text-right p-3 border w-32">Rate</th>
                  <th className="text-right p-3 border w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                {proposalData.lineItems.filter(i => i.description).map((item, index) => (
                  <tr key={index}>
                    <td className="p-3 border">{item.description}</td>
                    <td className="text-center p-3 border">{item.quantity}</td>
                    <td className="text-right p-3 border">R {item.rate.toLocaleString()}</td>
                    <td className="text-right p-3 border">R {(item.quantity * item.rate).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right p-3 border font-semibold">Subtotal:</td>
                  <td className="text-right p-3 border">R {subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right p-3 border">VAT (15%):</td>
                  <td className="text-right p-3 border">R {vat.toLocaleString()}</td>
                </tr>
                <tr className="bg-blue-50">
                  <td colSpan={3} className="text-right p-3 border font-bold text-lg">Total:</td>
                  <td className="text-right p-3 border font-bold text-lg text-blue-600">R {total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-200 pt-6 mt-8">
            <div className="flex justify-between text-sm text-gray-500">
              <div>
                <p className="font-semibold">{tenantInfo.company}</p>
                <p>Confidential Business Proposal</p>
              </div>
              <div className="text-right">
                <p>Valid for 30 days</p>
                <p>Reference: PROP-{Date.now().toString().slice(-6)}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  // Data Import Modal
  const renderDataImportModal = () => (
    <Modal
      open={showDataImport}
      onCancel={() => setShowDataImport(false)}
      title={
        <div className="flex items-center gap-2">
          <ImportOutlined className="text-blue-500" />
          <span>Import Research Data</span>
        </div>
      }
      width={700}
      footer={[
        <Button key="cancel" onClick={() => setShowDataImport(false)}>Cancel</Button>,
        <Button 
          key="import" 
          type="primary" 
          icon={<RobotOutlined />}
          loading={isAIProcessing}
          onClick={handleDataImport}
        >
          Analyze & Extract
        </Button>
      ]}
    >
      <div className="space-y-4">
        <Alert
          message="Paste Your Research Data"
          description="Paste any research, notes, or existing content. SiyaBusa AI will analyze it and extract relevant information to populate your proposal."
          type="info"
          showIcon
        />

        <TextArea
          rows={12}
          placeholder={`Paste your research data here...

Examples of what to include:
• Client company information
• Project requirements
• Budget discussions
• Meeting notes
• Competitor analysis
• Market research
• Technical specifications
• Previous correspondence

The AI will extract relevant details and suggest content for your proposal.`}
          value={proposalData.importedData}
          onChange={e => setProposalData(prev => ({ ...prev, importedData: e.target.value }))}
        />

        <div className="flex gap-2">
          <Upload
            accept=".txt,.doc,.docx,.pdf"
            showUploadList={false}
            beforeUpload={(file) => {
              message.info('File upload coming soon - please paste content for now');
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>Upload File</Button>
          </Upload>
          <Text type="secondary" className="text-xs self-center">
            Supports: TXT, DOC, PDF (paste content for now)
          </Text>
        </div>

        {aiChatMessages.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <Text strong className="block mb-2">AI Analysis:</Text>
            {aiChatMessages.map((msg, i) => (
              <div key={i} className={`mb-2 ${msg.role === 'ai' ? 'text-blue-600' : ''}`}>
                <Text>{msg.content}</Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RocketOutlined className="text-3xl" />
              <div>
                <Title level={3} className="!text-white !mb-0">SiyaBusa Proposal Builder</Title>
                <Text className="text-blue-100">Create Fortune 500 quality proposals in minutes</Text>
              </div>
            </div>
            <Tag color="gold" className="text-sm">PRO</Tag>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white p-6 border-b">
          <Steps current={currentStep} size="small">
            <Step title="Template" description="Choose format" />
            <Step title="Content" description="AI-guided builder" />
            <Step title="Export" description="Download & send" />
          </Steps>
        </div>

        {/* Main Content */}
        <Card className="rounded-t-none">
          {currentStep === 0 && renderTemplateSelection()}
          {currentStep === 1 && renderAIGuidedBuilder()}
          {currentStep === 2 && renderExportOptions()}
        </Card>

        {/* Modals */}
        {renderPreviewModal()}
        {renderDataImportModal()}
      </div>
    </div>
  );
};

export default ProProposalBuilder;
