import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Input,
  Form,
  Select,
  Steps,
  Upload,
  Tag,
  message,
  Divider,
  Switch,
  Slider,
  InputNumber,
  DatePicker,
  Radio,
} from 'antd';
import {
  RocketOutlined,
  TeamOutlined,
  DollarOutlined,
  BarChartOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  BulbOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  DownloadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import './PitchBuilder.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TeamMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  linkedin?: string;
}

interface Milestone {
  id: string;
  phase: string;
  description: string;
  duration: string;
  deliverables: string[];
}

interface CaseStudy {
  id: string;
  company: string;
  industry: string;
  challenge: string;
  solution: string;
  result: string;
  metrics: { label: string; value: string }[];
}

const PitchBuilder: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [form] = Form.useForm();

  // Form state
  const [pitchData, setPitchData] = useState({
    // Company Info
    companyName: 'WorldClass ERP',
    tagline: 'Enterprise Solutions That Transform',
    logo: null,
    
    // Project Details
    projectName: '',
    projectType: 'implementation',
    industry: '',
    clientName: '',
    clientLogo: null,
    
    // Problem & Solution
    problemStatement: '',
    keyPainPoints: ['', '', ''],
    solutionOverview: '',
    uniqueValue: ['', '', ''],
    
    // Team
    team: [] as TeamMember[],
    
    // Timeline & Milestones
    projectDuration: 12,
    milestones: [] as Milestone[],
    
    // Pricing
    pricingModel: 'fixed',
    investmentAmount: 0,
    roi: '',
    paybackPeriod: '',
    
    // Case Studies
    caseStudies: [] as CaseStudy[],
    
    // Closing
    callToAction: '',
    urgency: '',
    guarantee: '',
  });

  const [team, setTeam] = useState<TeamMember[]>([
    { id: '1', name: '', role: '', experience: '', linkedin: '' },
  ]);

  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', phase: 'Discovery', description: '', duration: '2 weeks', deliverables: [''] },
  ]);

  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);

  const steps = [
    { title: 'Overview', icon: <FileTextOutlined /> },
    { title: 'Problem', icon: <BulbOutlined /> },
    { title: 'Solution', icon: <ThunderboltOutlined /> },
    { title: 'Team', icon: <TeamOutlined /> },
    { title: 'Timeline', icon: <BarChartOutlined /> },
    { title: 'Investment', icon: <DollarOutlined /> },
    { title: 'Proof', icon: <TrophyOutlined /> },
    { title: 'Close', icon: <RocketOutlined /> },
  ];

  const industries = [
    'Financial Services', 'Healthcare', 'Manufacturing', 'Retail',
    'Technology', 'Professional Services', 'Logistics', 'Energy',
    'Real Estate', 'Education', 'Government', 'Non-Profit',
  ];

  const projectTypes = [
    { value: 'implementation', label: 'System Implementation' },
    { value: 'consulting', label: 'Strategic Consulting' },
    { value: 'transformation', label: 'Digital Transformation' },
    { value: 'integration', label: 'Systems Integration' },
    { value: 'audit', label: 'Audit & Compliance' },
    { value: 'advisory', label: 'Advisory Services' },
  ];

  const addTeamMember = () => {
    setTeam([...team, { 
      id: Date.now().toString(), 
      name: '', 
      role: '', 
      experience: '',
      linkedin: '' 
    }]);
  };

  const removeTeamMember = (id: string) => {
    setTeam(team.filter(m => m.id !== id));
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      id: Date.now().toString(),
      phase: `Phase ${milestones.length + 1}`,
      description: '',
      duration: '2 weeks',
      deliverables: [''],
    }]);
  };

  const addCaseStudy = () => {
    setCaseStudies([...caseStudies, {
      id: Date.now().toString(),
      company: '',
      industry: '',
      challenge: '',
      solution: '',
      result: '',
      metrics: [{ label: '', value: '' }],
    }]);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Overview
        return (
          <div className="step-content">
            <div className="step-header">
              <Title level={3}>Project Overview</Title>
              <Text type="secondary">Set the stage for your pitch</Text>
            </div>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Project Name" required>
                  <Input
                    size="large"
                    placeholder="e.g., Enterprise Digital Transformation"
                    value={pitchData.projectName}
                    onChange={(e) => setPitchData({ ...pitchData, projectName: e.target.value })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Project Type" required>
                  <Select
                    size="large"
                    placeholder="Select project type"
                    value={pitchData.projectType}
                    onChange={(v) => setPitchData({ ...pitchData, projectType: v })}
                  >
                    {projectTypes.map(pt => (
                      <Option key={pt.value} value={pt.value}>{pt.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Client Name" required>
                  <Input
                    size="large"
                    placeholder="e.g., Acme Corporation"
                    value={pitchData.clientName}
                    onChange={(e) => setPitchData({ ...pitchData, clientName: e.target.value })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Industry" required>
                  <Select
                    size="large"
                    placeholder="Select industry"
                    value={pitchData.industry}
                    onChange={(v) => setPitchData({ ...pitchData, industry: v })}
                  >
                    {industries.map(ind => (
                      <Option key={ind} value={ind}>{ind}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Executive Summary">
              <TextArea
                rows={4}
                placeholder="A compelling 2-3 sentence summary that captures the essence of this engagement..."
                value={pitchData.solutionOverview}
                onChange={(e) => setPitchData({ ...pitchData, solutionOverview: e.target.value })}
              />
            </Form.Item>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Client Logo">
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    beforeUpload={() => false}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      case 1: // Problem
        return (
          <div className="step-content">
            <div className="step-header">
              <Title level={3}>The Challenge</Title>
              <Text type="secondary">Articulate the problem clearly to show you understand their pain</Text>
            </div>

            <Form.Item label="Problem Statement" required>
              <TextArea
                rows={4}
                placeholder="Describe the core challenge the client is facing. Be specific about the business impact..."
                value={pitchData.problemStatement}
                onChange={(e) => setPitchData({ ...pitchData, problemStatement: e.target.value })}
              />
            </Form.Item>

            <Form.Item label="Key Pain Points">
              <div className="pain-points-list">
                {pitchData.keyPainPoints.map((point, index) => (
                  <div key={index} className="pain-point-item">
                    <span className="pain-number">{index + 1}</span>
                    <Input
                      size="large"
                      placeholder={`Pain point ${index + 1}...`}
                      value={point}
                      onChange={(e) => {
                        const newPoints = [...pitchData.keyPainPoints];
                        newPoints[index] = e.target.value;
                        setPitchData({ ...pitchData, keyPainPoints: newPoints });
                      }}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => setPitchData({ 
                    ...pitchData, 
                    keyPainPoints: [...pitchData.keyPainPoints, ''] 
                  })}
                >
                  Add Pain Point
                </Button>
              </div>
            </Form.Item>

            <div className="impact-section">
              <Title level={5}>Business Impact</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Card className="impact-card">
                    <div className="impact-icon" style={{ background: '#fee2e2' }}>
                      <DollarOutlined style={{ color: '#ef4444' }} />
                    </div>
                    <Form.Item label="Revenue at Risk">
                      <InputNumber
                        size="large"
                        style={{ width: '100%' }}
                        formatter={v => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        placeholder="0"
                      />
                    </Form.Item>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card className="impact-card">
                    <div className="impact-icon" style={{ background: '#fef3c7' }}>
                      <BarChartOutlined style={{ color: '#f59e0b' }} />
                    </div>
                    <Form.Item label="Efficiency Loss">
                      <InputNumber
                        size="large"
                        style={{ width: '100%' }}
                        formatter={v => `${v}%`}
                        placeholder="0"
                      />
                    </Form.Item>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card className="impact-card">
                    <div className="impact-icon" style={{ background: '#dbeafe' }}>
                      <TeamOutlined style={{ color: '#3b82f6' }} />
                    </div>
                    <Form.Item label="Employee Hours Wasted/Month">
                      <InputNumber
                        size="large"
                        style={{ width: '100%' }}
                        placeholder="0"
                      />
                    </Form.Item>
                  </Card>
                </Col>
              </Row>
            </div>
          </div>
        );

      case 2: // Solution
        return (
          <div className="step-content">
            <div className="step-header">
              <Title level={3}>Our Solution</Title>
              <Text type="secondary">Present your unique approach to solving their challenge</Text>
            </div>

            <Form.Item label="Solution Overview" required>
              <TextArea
                rows={4}
                placeholder="Describe your proposed solution and approach..."
                value={pitchData.solutionOverview}
                onChange={(e) => setPitchData({ ...pitchData, solutionOverview: e.target.value })}
              />
            </Form.Item>

            <Form.Item label="Unique Value Propositions">
              <div className="value-props-list">
                {pitchData.uniqueValue.map((prop, index) => (
                  <div key={index} className="value-prop-item">
                    <div className="value-icon">
                      {index === 0 && <ThunderboltOutlined />}
                      {index === 1 && <SafetyCertificateOutlined />}
                      {index === 2 && <GlobalOutlined />}
                      {index > 2 && <CheckCircleOutlined />}
                    </div>
                    <Input
                      size="large"
                      placeholder={`Value proposition ${index + 1}...`}
                      value={prop}
                      onChange={(e) => {
                        const newProps = [...pitchData.uniqueValue];
                        newProps[index] = e.target.value;
                        setPitchData({ ...pitchData, uniqueValue: newProps });
                      }}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => setPitchData({
                    ...pitchData,
                    uniqueValue: [...pitchData.uniqueValue, '']
                  })}
                >
                  Add Value Proposition
                </Button>
              </div>
            </Form.Item>

            <Divider />

            <Title level={5}>Key Deliverables</Title>
            <Row gutter={16}>
              {['Phase 1: Foundation', 'Phase 2: Implementation', 'Phase 3: Optimization'].map((phase, i) => (
                <Col span={8} key={i}>
                  <Card className="deliverable-card">
                    <Title level={5}>{phase}</Title>
                    <TextArea
                      rows={3}
                      placeholder={`Key deliverables for ${phase.toLowerCase()}...`}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );

      case 3: // Team
        return (
          <div className="step-content">
            <div className="step-header">
              <Title level={3}>Your Dedicated Team</Title>
              <Text type="secondary">Showcase the experts who will deliver results</Text>
            </div>

            <div className="team-grid">
              {team.map((member, index) => (
                <Card key={member.id} className="team-card">
                  <div className="team-card-header">
                    <Title level={5}>Team Member {index + 1}</Title>
                    {team.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeTeamMember(member.id)}
                      />
                    )}
                  </div>
                  <Form.Item label="Full Name">
                    <Input
                      placeholder="e.g., Sarah Mitchell"
                      value={member.name}
                      onChange={(e) => {
                        const newTeam = [...team];
                        newTeam[index].name = e.target.value;
                        setTeam(newTeam);
                      }}
                    />
                  </Form.Item>
                  <Form.Item label="Role">
                    <Input
                      placeholder="e.g., Project Lead"
                      value={member.role}
                      onChange={(e) => {
                        const newTeam = [...team];
                        newTeam[index].role = e.target.value;
                        setTeam(newTeam);
                      }}
                    />
                  </Form.Item>
                  <Form.Item label="Experience Highlight">
                    <Input
                      placeholder="e.g., 15+ years in enterprise systems"
                      value={member.experience}
                      onChange={(e) => {
                        const newTeam = [...team];
                        newTeam[index].experience = e.target.value;
                        setTeam(newTeam);
                      }}
                    />
                  </Form.Item>
                </Card>
              ))}
            </div>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addTeamMember}
              className="add-team-btn"
            >
              Add Team Member
            </Button>
          </div>
        );

      case 4: // Timeline
        return (
          <div className="step-content">
            <div className="step-header">
              <Title level={3}>Project Timeline</Title>
              <Text type="secondary">Define clear milestones and deliverables</Text>
            </div>

            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Form.Item label="Total Project Duration (Weeks)">
                  <Slider
                    min={4}
                    max={52}
                    value={pitchData.projectDuration}
                    onChange={(v) => setPitchData({ ...pitchData, projectDuration: v })}
                    marks={{
                      4: '1 month',
                      12: '3 months',
                      26: '6 months',
                      52: '1 year',
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Estimated Start Date">
                  <DatePicker size="large" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <div className="milestones-list">
              {milestones.map((milestone, index) => (
                <Card key={milestone.id} className="milestone-card">
                  <Row gutter={16} align="middle">
                    <Col span={1}>
                      <div className="milestone-number">{index + 1}</div>
                    </Col>
                    <Col span={5}>
                      <Form.Item label="Phase Name" style={{ marginBottom: 0 }}>
                        <Input
                          value={milestone.phase}
                          onChange={(e) => {
                            const newMilestones = [...milestones];
                            newMilestones[index].phase = e.target.value;
                            setMilestones(newMilestones);
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item label="Description" style={{ marginBottom: 0 }}>
                        <Input
                          value={milestone.description}
                          placeholder="What will be achieved..."
                          onChange={(e) => {
                            const newMilestones = [...milestones];
                            newMilestones[index].description = e.target.value;
                            setMilestones(newMilestones);
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item label="Duration" style={{ marginBottom: 0 }}>
                        <Select
                          value={milestone.duration}
                          onChange={(v) => {
                            const newMilestones = [...milestones];
                            newMilestones[index].duration = v;
                            setMilestones(newMilestones);
                          }}
                        >
                          <Option value="1 week">1 week</Option>
                          <Option value="2 weeks">2 weeks</Option>
                          <Option value="3 weeks">3 weeks</Option>
                          <Option value="4 weeks">4 weeks</Option>
                          <Option value="6 weeks">6 weeks</Option>
                          <Option value="8 weeks">8 weeks</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4} style={{ textAlign: 'right' }}>
                      {milestones.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => setMilestones(milestones.filter(m => m.id !== milestone.id))}
                        />
                      )}
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addMilestone}
            >
              Add Milestone
            </Button>
          </div>
        );

      case 5: // Investment
        return (
          <div className="step-content">
            <div className="step-header">
              <Title level={3}>Investment & ROI</Title>
              <Text type="secondary">Present the financial case for this engagement</Text>
            </div>

            <Form.Item label="Pricing Model">
              <Radio.Group
                value={pitchData.pricingModel}
                onChange={(e) => setPitchData({ ...pitchData, pricingModel: e.target.value })}
              >
                <Radio.Button value="fixed">Fixed Price</Radio.Button>
                <Radio.Button value="retainer">Monthly Retainer</Radio.Button>
                <Radio.Button value="hybrid">Hybrid</Radio.Button>
                <Radio.Button value="value">Value-Based</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Total Investment">
                  <InputNumber
                    size="large"
                    style={{ width: '100%' }}
                    formatter={v => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={v => v!.replace(/\$\s?|(,*)/g, '')}
                    value={pitchData.investmentAmount}
                    onChange={(v) => setPitchData({ ...pitchData, investmentAmount: v || 0 })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Expected ROI">
                  <Input
                    size="large"
                    placeholder="e.g., 300% in first year"
                    value={pitchData.roi}
                    onChange={(e) => setPitchData({ ...pitchData, roi: e.target.value })}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Payback Period">
                  <Input
                    size="large"
                    placeholder="e.g., 6 months"
                    value={pitchData.paybackPeriod}
                    onChange={(e) => setPitchData({ ...pitchData, paybackPeriod: e.target.value })}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Investment Breakdown</Title>
            <div className="investment-breakdown">
              <Row gutter={16}>
                {['Discovery & Planning', 'Implementation', 'Training & Support'].map((item, i) => (
                  <Col span={8} key={i}>
                    <Card className="breakdown-card">
                      <Text type="secondary">{item}</Text>
                      <InputNumber
                        style={{ width: '100%', marginTop: 8 }}
                        formatter={v => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={v => v!.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        );

      case 6: // Proof
        return (
          <div className="step-content">
            <div className="step-header">
              <Title level={3}>Proof of Success</Title>
              <Text type="secondary">Build credibility with case studies and testimonials</Text>
            </div>

            {caseStudies.length === 0 ? (
              <div className="empty-case-studies">
                <TrophyOutlined className="empty-icon" />
                <Title level={5}>Add Case Studies</Title>
                <Text type="secondary">
                  Showcase your past successes to build trust and credibility
                </Text>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addCaseStudy}
                  style={{ marginTop: 16 }}
                >
                  Add Case Study
                </Button>
              </div>
            ) : (
              <>
                {caseStudies.map((cs, index) => (
                  <Card key={cs.id} className="case-study-form">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Company Name">
                          <Input
                            placeholder="e.g., TechCorp Industries"
                            value={cs.company}
                            onChange={(e) => {
                              const newCS = [...caseStudies];
                              newCS[index].company = e.target.value;
                              setCaseStudies(newCS);
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Industry">
                          <Select
                            placeholder="Select industry"
                            value={cs.industry}
                            onChange={(v) => {
                              const newCS = [...caseStudies];
                              newCS[index].industry = v;
                              setCaseStudies(newCS);
                            }}
                          >
                            {industries.map(ind => (
                              <Option key={ind} value={ind}>{ind}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label="Challenge">
                      <TextArea
                        rows={2}
                        placeholder="What challenge did they face?"
                        value={cs.challenge}
                        onChange={(e) => {
                          const newCS = [...caseStudies];
                          newCS[index].challenge = e.target.value;
                          setCaseStudies(newCS);
                        }}
                      />
                    </Form.Item>
                    <Form.Item label="Result">
                      <TextArea
                        rows={2}
                        placeholder="What results did you achieve?"
                        value={cs.result}
                        onChange={(e) => {
                          const newCS = [...caseStudies];
                          newCS[index].result = e.target.value;
                          setCaseStudies(newCS);
                        }}
                      />
                    </Form.Item>
                    <Title level={5}>Key Metrics</Title>
                    <Row gutter={8}>
                      {['Metric 1', 'Metric 2', 'Metric 3'].map((_, i) => (
                        <Col span={8} key={i}>
                          <Input placeholder="e.g., 40% cost reduction" />
                        </Col>
                      ))}
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addCaseStudy}
                >
                  Add Another Case Study
                </Button>
              </>
            )}
          </div>
        );

      case 7: // Close
        return (
          <div className="step-content">
            <div className="step-header">
              <Title level={3}>The Close</Title>
              <Text type="secondary">Create urgency and make it easy to say yes</Text>
            </div>

            <Form.Item label="Call to Action">
              <TextArea
                rows={3}
                placeholder="What specific action do you want them to take? e.g., 'Schedule a kickoff call to begin your transformation...'"
                value={pitchData.callToAction}
                onChange={(e) => setPitchData({ ...pitchData, callToAction: e.target.value })}
              />
            </Form.Item>

            <Form.Item label="Urgency Driver">
              <TextArea
                rows={2}
                placeholder="Why should they act now? e.g., 'Limited availability in Q1 / Market opportunity window closing...'"
                value={pitchData.urgency}
                onChange={(e) => setPitchData({ ...pitchData, urgency: e.target.value })}
              />
            </Form.Item>

            <Form.Item label="Guarantee / Risk Reversal">
              <TextArea
                rows={2}
                placeholder="e.g., '60-day satisfaction guarantee / No questions asked refund...'"
                value={pitchData.guarantee}
                onChange={(e) => setPitchData({ ...pitchData, guarantee: e.target.value })}
              />
            </Form.Item>

            <Divider />

            <div className="closing-checklist">
              <Title level={5}>Final Checklist</Title>
              <div className="checklist-items">
                {[
                  'Problem clearly articulated',
                  'Solution benefits highlighted',
                  'Team credentials included',
                  'Timeline is realistic',
                  'ROI is compelling',
                  'Social proof added',
                  'Clear next steps defined',
                ].map((item, i) => (
                  <div key={i} className="checklist-item">
                    <CheckCircleOutlined style={{ color: '#10b981' }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pitch-builder-page">
      <div className="pitch-header">
        <div>
          <Title level={2}>Pitch Deck Builder</Title>
          <Text type="secondary">Create Fortune 500-level pitch presentations</Text>
        </div>
        <div className="header-actions">
          <Button icon={<EyeOutlined />} onClick={() => setPreviewMode(true)}>
            Preview
          </Button>
          <Button icon={<DownloadOutlined />}>
            Export
          </Button>
          <Button type="primary" icon={<RocketOutlined />}>
            Generate Pitch
          </Button>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={6}>
          <Card className="steps-card">
            <Steps
              direction="vertical"
              current={currentStep}
              onChange={setCurrentStep}
              items={steps.map((step, index) => ({
                title: step.title,
                icon: step.icon,
                status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait',
              }))}
            />
          </Card>
        </Col>
        <Col span={18}>
          <Card className="content-card">
            <Form form={form} layout="vertical">
              {renderStepContent()}
            </Form>

            <div className="step-navigation">
              {currentStep > 0 && (
                <Button size="large" onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Continue
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button
                  type="primary"
                  size="large"
                  icon={<RocketOutlined />}
                  onClick={() => message.success('Pitch deck generated!')}
                >
                  Generate Pitch Deck
                </Button>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PitchBuilder;
