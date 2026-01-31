/**
 * Phase 2: AI-Enhanced Content Creation
 * 
 * Features:
 * - AI analyzes client data and industry
 * - Generates draft sections automatically
 * - User refines content with AI suggestions
 * - Smart templates adapt to content length
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Typography, Space, Button, Input, Select, Tabs,
  Tag, Tooltip, Badge, Spin, Progress, List, Collapse, Modal,
  Dropdown, Menu, Switch, Slider, message, Alert, Divider, Empty
} from 'antd';
import {
  BulbOutlined, ThunderboltOutlined, EditOutlined, CopyOutlined,
  SyncOutlined, CheckCircleOutlined, RobotOutlined, ReloadOutlined,
  PlusOutlined, DeleteOutlined, DragOutlined, EyeOutlined, StarOutlined,
  StarFilled, HistoryOutlined, UndoOutlined, RedoOutlined, FileTextOutlined,
  OrderedListOutlined, UnorderedListOutlined, BoldOutlined, ItalicOutlined,
  ExpandOutlined, CompressOutlined, SendOutlined, ExperimentOutlined
} from '@ant-design/icons';
import type { ProposalSection, ProposalData } from '../../WorldClassProposalBuilder';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

interface PhaseAIContentProps {
  proposal: ProposalData;
  onSectionsUpdate: (sections: ProposalSection[]) => void;
  onTitleUpdate: (title: string) => void;
  onPhaseComplete: (progress: number) => void;
}

// AI Content Generation Templates
const aiContentTemplates: Record<string, (ctx: any) => string> = {
  'executive-summary': (ctx) => `
${ctx.company || 'Our Company'} is pleased to present this ${ctx.type?.name?.toLowerCase() || 'proposal'} to ${ctx.client?.company || 'your organization'}.

**Overview**
This proposal outlines our comprehensive approach to addressing ${ctx.client?.company || 'your'}'s requirements in the ${ctx.client?.industry || 'industry'} sector. Our solution combines proven methodologies with innovative approaches to deliver measurable results.

**Key Value Propositions**
• Deep expertise in ${ctx.client?.industry || 'your industry'} with proven track record
• Tailored approach designed for ${ctx.client?.size === 'enterprise' ? 'enterprise-scale' : 'your'} operations
• Clear deliverables with defined milestones and KPIs
• Competitive investment with transparent pricing
• Ongoing support and knowledge transfer

**Expected Outcomes**
We anticipate this engagement will deliver significant value through improved efficiency, reduced costs, and enhanced capabilities that position ${ctx.client?.company || 'your organization'} for sustainable growth.
  `.trim(),
  
  'problem': (ctx) => `
**Current Challenges**

Organizations in the ${ctx.client?.industry || 'industry'} sector face increasingly complex challenges:

1. **Market Dynamics**
   The rapidly evolving landscape demands agility and innovation to maintain competitive advantage.

2. **Operational Efficiency**
   Legacy processes and systems often create bottlenecks that impact productivity and profitability.

3. **Digital Transformation**
   The need to modernize technology infrastructure while maintaining business continuity.

4. **Regulatory Compliance**
   Growing regulatory requirements necessitate robust governance and reporting capabilities.

5. **Talent & Skills**
   Attracting and retaining skilled professionals in a competitive talent market.

**Impact Analysis**

These challenges, if unaddressed, can result in:
• Reduced market share and competitive positioning
• Increased operational costs and inefficiencies
• Compliance risks and potential penalties
• Missed opportunities for growth and innovation
  `.trim(),
  
  'solution': (ctx) => `
**Our Proposed Solution**

We recommend a comprehensive, phased approach tailored to ${ctx.client?.company || 'your organization'}'s specific needs:

**Phase 1: Assessment & Planning**
• Detailed current state analysis
• Stakeholder engagement and requirements gathering
• Gap analysis and opportunity identification
• Strategic roadmap development

**Phase 2: Design & Development**
• Solution architecture and design
• Process optimization frameworks
• Technology selection and integration planning
• Change management strategy

**Phase 3: Implementation**
• Phased rollout with minimal disruption
• Training and capability building
• Quality assurance and testing
• Performance monitoring and optimization

**Phase 4: Sustainment & Growth**
• Ongoing support and maintenance
• Continuous improvement initiatives
• Knowledge transfer and documentation
• Future enhancement roadmap

**Key Differentiators**
Our approach stands apart through:
• Industry-specific expertise and best practices
• Proven methodology with documented success
• Flexible engagement models
• Commitment to measurable outcomes
  `.trim(),
  
  'methodology': (ctx) => `
**Our Approach**

We employ a structured, proven methodology that ensures consistent delivery and measurable outcomes:

**Discovery Phase (Weeks 1-2)**
• Executive interviews and stakeholder workshops
• Document review and data collection
• Current state assessment
• Requirements validation

**Analysis Phase (Weeks 3-4)**
• Gap analysis and benchmarking
• Risk assessment and mitigation planning
• Solution design and architecture
• Business case development

**Implementation Phase (Weeks 5-10)**
• Iterative development and deployment
• User acceptance testing
• Training and change management
• Documentation and knowledge capture

**Optimization Phase (Weeks 11-12)**
• Performance tuning and refinement
• Lessons learned documentation
• Transition to operations
• Success measurement and reporting

**Quality Assurance**
• Regular status reporting and steering committees
• Defined escalation procedures
• Risk and issue management protocols
• Change control processes
  `.trim(),
  
  'timeline': (ctx) => `
**Project Timeline**

| Phase | Activities | Duration | Milestones |
|-------|-----------|----------|------------|
| 1. Initiation | Kickoff, team mobilization, planning | Week 1 | Project charter signed |
| 2. Discovery | Requirements, current state analysis | Weeks 2-3 | Assessment report delivered |
| 3. Design | Solution architecture, detailed planning | Weeks 4-5 | Design approved |
| 4. Build | Development, configuration, testing | Weeks 6-9 | UAT complete |
| 5. Deploy | Go-live, training, stabilization | Weeks 10-11 | System live |
| 6. Close | Documentation, handover, lessons learned | Week 12 | Project closure |

**Key Milestones**
• Project Kickoff: Week 1
• Design Sign-off: Week 5
• User Acceptance: Week 9
• Go-Live: Week 10
• Project Closure: Week 12

**Dependencies & Assumptions**
• Client resource availability as agreed
• Timely access to systems and data
• Decision turnaround within 5 business days
• No significant scope changes post-design
  `.trim(),
  
  'pricing': (ctx) => `
**Investment Summary**

**Professional Services**

| Component | Description | Investment |
|-----------|-------------|------------|
| Project Management | Dedicated PM for full engagement | R 75,000 |
| Consulting Services | Senior consultants and SMEs | R 250,000 |
| Technical Implementation | Development and configuration | R 125,000 |
| Training & Knowledge Transfer | Workshops and documentation | R 50,000 |

**Investment Breakdown**
• Subtotal: R 500,000
• VAT (15%): R 75,000
• **Total Investment: R 575,000**

**Payment Schedule**
• 30% upon contract signature (R 172,500)
• 30% upon design approval (R 172,500)
• 30% upon go-live (R 172,500)
• 10% upon project closure (R 57,500)

**What's Included**
✓ Dedicated project team
✓ Weekly status reporting
✓ All documentation and deliverables
✓ 30-day post-implementation support
✓ Knowledge transfer sessions

**Optional Enhancements**
• Extended support package: R 25,000/month
• Additional training sessions: R 15,000/day
• On-site resources: Available upon request
  `.trim(),
  
  'team': (ctx) => `
**Your Dedicated Team**

We will assign a team of experienced professionals to ensure project success:

**Project Leadership**
• **Project Director** - Strategic oversight and executive sponsor
• **Engagement Manager** - Day-to-day delivery and client liaison

**Core Team**
• **Senior Consultant** - Domain expertise and solution design
• **Technical Lead** - Architecture and implementation oversight
• **Business Analyst** - Requirements and process analysis
• **Change Manager** - Training and adoption support

**Extended Team (As Needed)**
• Subject Matter Experts
• Technical Specialists
• Quality Assurance Resources

**Team Credentials**
Our team brings:
• Average 10+ years industry experience
• Professional certifications (PMP, TOGAF, ITIL, etc.)
• Proven track record on similar engagements
• Deep ${ctx.client?.industry || 'industry'} sector knowledge

**Commitment to You**
• Single point of accountability
• Consistent team throughout engagement
• Knowledge continuity and transfer
• Post-project support availability
  `.trim(),
  
  'case-studies': (ctx) => `
**Relevant Experience**

**Case Study 1: Enterprise Transformation**
*Major ${ctx.client?.industry || 'Industry'} Organization*

**Challenge:** Legacy systems causing operational inefficiencies and compliance risks
**Solution:** Comprehensive modernization program over 18 months
**Results:**
• 40% reduction in operational costs
• 99.5% system uptime achieved
• Full regulatory compliance maintained
• Employee satisfaction improved by 35%

---

**Case Study 2: Digital Innovation**
*Leading Regional Provider*

**Challenge:** Need for digital capabilities to compete in evolving market
**Solution:** Agile transformation with new digital platform
**Results:**
• 60% faster time-to-market
• 25% increase in customer acquisition
• R50M in new revenue streams
• Award-winning user experience

---

**Case Study 3: Operational Excellence**
*Multi-site Operations*

**Challenge:** Inconsistent processes across locations affecting quality
**Solution:** Standardized operating procedures with enabling technology
**Results:**
• 50% reduction in process variations
• 30% improvement in productivity
• Significant quality improvements
• Best practice sharing across sites
  `.trim(),
  
  'terms': (ctx) => `
**Terms & Conditions**

**1. Engagement Terms**
This proposal is valid for 30 days from the date of issue. Acceptance of this proposal constitutes agreement to the terms outlined herein.

**2. Scope Management**
• Scope is as defined in this proposal
• Changes require written approval
• Additional scope subject to change order process
• Material changes may impact timeline and investment

**3. Payment Terms**
• Invoices payable within 30 days
• Payment schedule as defined in Investment section
• Late payments subject to interest at prime + 2%
• Expenses billed at cost plus 10% handling

**4. Intellectual Property**
• Pre-existing IP remains with respective parties
• Project deliverables owned by client upon payment
• Methodology and tools remain our property
• License to use provided tools during engagement

**5. Confidentiality**
• Mutual NDA in effect
• Information shared only on need-to-know basis
• Return or destruction of materials upon request
• Survives termination indefinitely

**6. Liability**
• Limited to fees paid under this engagement
• Excludes consequential and indirect damages
• Professional indemnity insurance maintained
• Force majeure provisions apply

**7. Termination**
• Either party may terminate with 30 days notice
• Payment due for work completed to termination
• Deliverables provided upon final payment
• Transition assistance available

**8. Acceptance**
Signature below indicates acceptance of this proposal and agreement to the terms and conditions stated.
  `.trim()
};

// AI Enhancement suggestions
const getAISuggestions = (sectionType: string, content: string): string[] => {
  const baseSuggestions: Record<string, string[]> = {
    'executive-summary': [
      'Add a compelling hook in the opening paragraph',
      'Include specific metrics or ROI projections',
      'Mention a unique differentiator or innovation',
      'End with a clear call-to-action'
    ],
    'problem': [
      'Quantify the impact of each challenge',
      'Include industry statistics to validate pain points',
      'Add a competitor comparison angle',
      'Link problems to business outcomes'
    ],
    'solution': [
      'Add visual diagram of the solution architecture',
      'Include client success metrics from similar projects',
      'Highlight innovation or unique approach',
      'Add risk mitigation strategies'
    ],
    'pricing': [
      'Add ROI calculation showing payback period',
      'Include flexible payment options',
      'Show value comparison vs. alternatives',
      'Add optional add-on services'
    ]
  };
  
  return baseSuggestions[sectionType] || [
    'Enhance with specific examples',
    'Add supporting data or statistics',
    'Include visual elements',
    'Strengthen the narrative flow'
  ];
};

const PhaseAIContent: React.FC<PhaseAIContentProps> = ({
  proposal,
  onSectionsUpdate,
  onTitleUpdate,
  onPhaseComplete
}) => {
  const [sections, setSections] = useState<ProposalSection[]>(proposal.sections);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    proposal.sections[0]?.id || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'formal'>('professional');
  const [contentLength, setContentLength] = useState<'concise' | 'standard' | 'detailed'>('standard');
  const [proposalTitle, setProposalTitle] = useState(proposal.title);
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [undoStack, setUndoStack] = useState<ProposalSection[][]>([]);
  const [redoStack, setRedoStack] = useState<ProposalSection[][]>([]);
  
  // Calculate completion progress
  useEffect(() => {
    const completedSections = sections.filter(s => s.content.length > 100).length;
    const progress = Math.round((completedSections / Math.max(sections.length, 1)) * 100);
    onPhaseComplete(progress);
  }, [sections]);
  
  // Update parent state when sections change
  useEffect(() => {
    onSectionsUpdate(sections);
  }, [sections]);
  
  // Generate title suggestion
  useEffect(() => {
    if (!proposalTitle && proposal.type && proposal.client) {
      const suggestedTitle = `${proposal.type.name} - ${proposal.client.company}`;
      setProposalTitle(suggestedTitle);
      onTitleUpdate(suggestedTitle);
    }
  }, [proposal.type, proposal.client]);
  
  const getCompanyInfo = () => {
    try {
      const auth = localStorage.getItem('siyabusa_auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        return parsed.tenant?.name || 'Our Company';
      }
    } catch (e) {}
    return 'Our Company';
  };
  
  // Generate AI content for a section
  const generateSectionContent = async (section: ProposalSection) => {
    setGeneratingSection(section.id);
    setIsGenerating(true);
    
    // Save current state for undo
    setUndoStack(prev => [...prev, [...sections]]);
    setRedoStack([]);
    
    // Simulate AI generation with context
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const context = {
      company: getCompanyInfo(),
      type: proposal.type,
      client: proposal.client,
      tone: aiTone,
      length: contentLength
    };
    
    const generator = aiContentTemplates[section.type];
    const generatedContent = generator ? generator(context) : 
      `[AI-Generated content for ${section.title}]\n\nThis section would contain professionally written content tailored to your ${proposal.client?.company || 'client'} and the ${proposal.type?.name || 'proposal'} type.`;
    
    const updatedSections = sections.map(s => 
      s.id === section.id 
        ? { 
            ...s, 
            content: generatedContent, 
            aiGenerated: true,
            aiSuggestions: getAISuggestions(section.type, generatedContent)
          }
        : s
    );
    
    setSections(updatedSections);
    setIsGenerating(false);
    setGeneratingSection(null);
    message.success(`Generated content for "${section.title}"`);
  };
  
  // Generate all sections
  const generateAllSections = async () => {
    setIsGenerating(true);
    setUndoStack(prev => [...prev, [...sections]]);
    setRedoStack([]);
    
    const context = {
      company: getCompanyInfo(),
      type: proposal.type,
      client: proposal.client,
      tone: aiTone,
      length: contentLength
    };
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      setGeneratingSection(section.id);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const generator = aiContentTemplates[section.type];
      const generatedContent = generator ? generator(context) : 
        `[Content for ${section.title}]`;
      
      setSections(prev => prev.map(s => 
        s.id === section.id 
          ? { ...s, content: generatedContent, aiGenerated: true }
          : s
      ));
    }
    
    setIsGenerating(false);
    setGeneratingSection(null);
    message.success('All sections generated successfully!');
  };
  
  // Update section content
  const updateSectionContent = (sectionId: string, content: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, content, aiGenerated: false } : s
    ));
  };
  
  // Reorder sections
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) return;
    
    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    // Update order numbers
    newSections.forEach((s, i) => s.order = i);
    setSections(newSections);
  };
  
  // Delete section
  const deleteSection = (sectionId: string) => {
    Modal.confirm({
      title: 'Delete Section',
      content: 'Are you sure you want to remove this section?',
      onOk: () => {
        setSections(prev => prev.filter(s => s.id !== sectionId));
        if (activeSectionId === sectionId) {
          setActiveSectionId(sections[0]?.id || null);
        }
      }
    });
  };
  
  // Add new section
  const addSection = (type: string) => {
    const newSection: ProposalSection = {
      id: `section-${Date.now()}`,
      type: type as ProposalSection['type'],
      title: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      content: '',
      aiGenerated: false,
      order: sections.length,
      visible: true
    };
    setSections([...sections, newSection]);
    setActiveSectionId(newSection.id);
  };
  
  // Undo/Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, [...sections]]);
    setUndoStack(prev => prev.slice(0, -1));
    setSections(previousState);
  };
  
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, [...sections]]);
    setRedoStack(prev => prev.slice(0, -1));
    setSections(nextState);
  };
  
  const activeSection = sections.find(s => s.id === activeSectionId);

  return (
    <div style={{ height: 'calc(100vh - 280px)' }}>
      {/* Toolbar */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Input
                placeholder="Proposal Title"
                value={proposalTitle}
                onChange={e => {
                  setProposalTitle(e.target.value);
                  onTitleUpdate(e.target.value);
                }}
                style={{ width: 300, fontWeight: 600 }}
                prefix={<FileTextOutlined />}
              />
              <Divider type="vertical" />
              <Tooltip title="Undo">
                <Button 
                  icon={<UndoOutlined />} 
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                />
              </Tooltip>
              <Tooltip title="Redo">
                <Button 
                  icon={<RedoOutlined />}
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                />
              </Tooltip>
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Select 
                value={aiTone} 
                onChange={setAiTone}
                style={{ width: 130 }}
                size="small"
              >
                <Select.Option value="professional">Professional</Select.Option>
                <Select.Option value="friendly">Friendly</Select.Option>
                <Select.Option value="formal">Formal</Select.Option>
              </Select>
              
              <Select 
                value={contentLength} 
                onChange={setContentLength}
                style={{ width: 120 }}
                size="small"
              >
                <Select.Option value="concise">Concise</Select.Option>
                <Select.Option value="standard">Standard</Select.Option>
                <Select.Option value="detailed">Detailed</Select.Option>
              </Select>
              
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                loading={isGenerating}
                onClick={generateAllSections}
                style={{ 
                  background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)',
                  border: 'none'
                }}
              >
                Generate All Content
              </Button>
              
              <Button
                icon={showAISidebar ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => setShowAISidebar(!showAISidebar)}
              />
            </Space>
          </Col>
        </Row>
      </Card>
      
      <Row gutter={16} style={{ height: 'calc(100% - 60px)' }}>
        {/* Section List */}
        <Col span={5}>
          <Card 
            title={<Space><OrderedListOutlined /> Sections</Space>}
            size="small"
            style={{ height: '100%', overflow: 'auto' }}
            extra={
              <Dropdown
                menu={{
                  items: [
                    { key: 'cover', label: 'Cover Page' },
                    { key: 'executive-summary', label: 'Executive Summary' },
                    { key: 'problem', label: 'Problem Statement' },
                    { key: 'solution', label: 'Our Solution' },
                    { key: 'methodology', label: 'Methodology' },
                    { key: 'timeline', label: 'Timeline' },
                    { key: 'team', label: 'Team' },
                    { key: 'pricing', label: 'Pricing' },
                    { key: 'case-studies', label: 'Case Studies' },
                    { key: 'terms', label: 'Terms & Conditions' },
                    { key: 'custom', label: 'Custom Section' },
                  ],
                  onClick: ({ key }) => addSection(key)
                }}
              >
                <Button size="small" icon={<PlusOutlined />} />
              </Dropdown>
            }
          >
            <List
              dataSource={sections}
              renderItem={(section, index) => (
                <List.Item
                  onClick={() => setActiveSectionId(section.id)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: section.id === activeSectionId ? '#f0f5ff' : 'transparent',
                    borderRadius: 4,
                    marginBottom: 4
                  }}
                  actions={[
                    generatingSection === section.id ? (
                      <Spin size="small" key="loading" />
                    ) : section.content ? (
                      <CheckCircleOutlined 
                        key="done" 
                        style={{ color: '#52c41a' }} 
                      />
                    ) : (
                      <Badge 
                        key="badge"
                        status="default" 
                      />
                    )
                  ]}
                >
                  <Space size="small">
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {index + 1}
                    </Text>
                    <Text 
                      style={{ 
                        fontWeight: section.id === activeSectionId ? 600 : 400,
                        fontSize: 13
                      }}
                      ellipsis
                    >
                      {section.title}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        {/* Content Editor */}
        <Col span={showAISidebar ? 12 : 19}>
          <Card 
            title={
              activeSection ? (
                <Space>
                  <EditOutlined />
                  <span>{activeSection.title}</span>
                  {activeSection.aiGenerated && (
                    <Tag color="purple" icon={<RobotOutlined />}>AI Generated</Tag>
                  )}
                </Space>
              ) : 'Select a section'
            }
            size="small"
            style={{ height: '100%' }}
            extra={
              activeSection && (
                <Space>
                  <Tooltip title="Move Up">
                    <Button 
                      size="small" 
                      icon={<DragOutlined style={{ transform: 'rotate(-90deg)' }} />}
                      onClick={() => moveSection(activeSection.id, 'up')}
                    />
                  </Tooltip>
                  <Tooltip title="Move Down">
                    <Button 
                      size="small"
                      icon={<DragOutlined style={{ transform: 'rotate(90deg)' }} />}
                      onClick={() => moveSection(activeSection.id, 'down')}
                    />
                  </Tooltip>
                  <Tooltip title="Regenerate">
                    <Button 
                      size="small"
                      icon={<ReloadOutlined />}
                      loading={generatingSection === activeSection.id}
                      onClick={() => generateSectionContent(activeSection)}
                    />
                  </Tooltip>
                  <Tooltip title="Delete Section">
                    <Button 
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => deleteSection(activeSection.id)}
                    />
                  </Tooltip>
                </Space>
              )
            }
          >
            {activeSection ? (
              <div style={{ height: 'calc(100% - 40px)' }}>
                {/* Mini Toolbar */}
                <Space style={{ marginBottom: 8 }}>
                  <Tooltip title="Bold">
                    <Button size="small" icon={<BoldOutlined />} />
                  </Tooltip>
                  <Tooltip title="Italic">
                    <Button size="small" icon={<ItalicOutlined />} />
                  </Tooltip>
                  <Tooltip title="Bullet List">
                    <Button size="small" icon={<UnorderedListOutlined />} />
                  </Tooltip>
                  <Tooltip title="Numbered List">
                    <Button size="small" icon={<OrderedListOutlined />} />
                  </Tooltip>
                  <Divider type="vertical" />
                  <Button 
                    size="small"
                    type={activeSection.content ? 'default' : 'primary'}
                    icon={<ThunderboltOutlined />}
                    loading={generatingSection === activeSection.id}
                    onClick={() => generateSectionContent(activeSection)}
                  >
                    {activeSection.content ? 'Regenerate' : 'Generate with AI'}
                  </Button>
                </Space>
                
                <TextArea
                  value={activeSection.content}
                  onChange={e => updateSectionContent(activeSection.id, e.target.value)}
                  placeholder={`Enter content for ${activeSection.title}...\n\nOr click "Generate with AI" to create content automatically.`}
                  style={{ 
                    height: 'calc(100% - 50px)',
                    fontFamily: 'Georgia, serif',
                    fontSize: 14,
                    lineHeight: 1.8,
                    resize: 'none'
                  }}
                />
              </div>
            ) : (
              <Empty description="Select a section to edit" />
            )}
          </Card>
        </Col>
        
        {/* AI Suggestions Sidebar */}
        {showAISidebar && (
          <Col span={7}>
            <Card 
              title={
                <Space>
                  <BulbOutlined style={{ color: '#faad14' }} />
                  <span>AI Assistant</span>
                </Space>
              }
              size="small"
              style={{ height: '100%', overflow: 'auto', background: '#fafafa' }}
            >
              {activeSection ? (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* Context Info */}
                  <Card size="small" style={{ background: '#f0f5ff' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Context</Text>
                    <div style={{ marginTop: 8 }}>
                      <Tag color="blue">{proposal.type?.name || 'No type'}</Tag>
                      <Tag color="green">{proposal.client?.industry || 'No industry'}</Tag>
                    </div>
                    <Text style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                      Client: <strong>{proposal.client?.company || 'Not specified'}</strong>
                    </Text>
                  </Card>
                  
                  {/* AI Suggestions */}
                  <div>
                    <Text strong style={{ fontSize: 12 }}>
                      <ThunderboltOutlined style={{ color: '#722ed1' }} /> Enhancement Suggestions
                    </Text>
                    <List
                      size="small"
                      style={{ marginTop: 8 }}
                      dataSource={activeSection.aiSuggestions || getAISuggestions(activeSection.type, activeSection.content)}
                      renderItem={suggestion => (
                        <List.Item style={{ padding: '8px 0', borderBottom: '1px dashed #e8e8e8' }}>
                          <Space>
                            <BulbOutlined style={{ color: '#faad14' }} />
                            <Text style={{ fontSize: 12 }}>{suggestion}</Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </div>
                  
                  {/* Quick Actions */}
                  <div>
                    <Text strong style={{ fontSize: 12 }}>
                      <RobotOutlined /> Quick Actions
                    </Text>
                    <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size="small">
                      <Button 
                        block 
                        size="small"
                        icon={<SyncOutlined />}
                        onClick={() => generateSectionContent(activeSection)}
                        loading={generatingSection === activeSection.id}
                      >
                        Regenerate Content
                      </Button>
                      <Button block size="small" icon={<ExpandOutlined />}>
                        Expand Content
                      </Button>
                      <Button block size="small" icon={<CompressOutlined />}>
                        Make Concise
                      </Button>
                      <Button block size="small" icon={<EditOutlined />}>
                        Improve Tone
                      </Button>
                      <Button block size="small" icon={<StarOutlined />}>
                        Add Highlights
                      </Button>
                    </Space>
                  </div>
                  
                  {/* Word Count */}
                  <Card size="small" style={{ background: 'white' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic 
                          title="Words" 
                          value={activeSection.content.split(/\s+/).filter(w => w).length} 
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="Characters" 
                          value={activeSection.content.length} 
                        />
                      </Col>
                    </Row>
                  </Card>
                </Space>
              ) : (
                <Empty 
                  description="Select a section to see AI suggestions"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

// Mini Statistic component
const Statistic: React.FC<{ title: string; value: number }> = ({ title, value }) => (
  <div style={{ textAlign: 'center' }}>
    <Text type="secondary" style={{ fontSize: 11 }}>{title}</Text>
    <div style={{ fontSize: 18, fontWeight: 600 }}>{value.toLocaleString()}</div>
  </div>
);

export default PhaseAIContent;
