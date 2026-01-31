/**
 * ProposalEditor - Full-featured proposal creator with AI enhancement
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Row, Col, Input, Button, Space, Form, Select, Typography,
  Divider, InputNumber, Table, Modal, message, Steps, Upload,
  Tooltip, Tag, Alert, Spin
} from 'antd';
import {
  SaveOutlined, SendOutlined, EyeOutlined, PlusOutlined,
  DeleteOutlined, ArrowLeftOutlined, RobotOutlined,
  FileTextOutlined, DownloadOutlined, CopyOutlined,
  BulbOutlined, ThunderboltOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Proposal {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';
  validDays: number;
  createdAt: string;
  updatedAt: string;
  // Content sections
  executiveSummary: string;
  problemStatement: string;
  proposedSolution: string;
  methodology: string;
  timeline: string;
  teamBios: string;
  whyUs: string;
  terms: string;
  // Line items
  items: ProposalItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
}

const ProposalEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      loadProposal(id);
    } else {
      // New proposal
      const newId = `PROP-${Date.now()}`;
      setProposal({
        id: newId,
        title: '',
        clientName: '',
        clientEmail: '',
        clientCompany: '',
        status: 'draft',
        validDays: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executiveSummary: '',
        problemStatement: '',
        proposedSolution: '',
        methodology: '',
        timeline: '',
        teamBios: '',
        whyUs: '',
        terms: 'Standard payment terms: 50% upfront, 50% on completion. All prices are in South African Rand (ZAR) and exclude VAT unless otherwise stated.',
        items: [],
        subtotal: 0,
        vatRate: 15,
        vatAmount: 0,
        total: 0,
      });
    }
  }, [id]);

  const loadProposal = (proposalId: string) => {
    const saved = localStorage.getItem('siyabusa_proposals');
    if (saved) {
      const proposals = JSON.parse(saved);
      const found = proposals.find((p: Proposal) => p.id === proposalId);
      if (found) {
        setProposal(found);
        setItems(found.items || []);
        form.setFieldsValue(found);
      }
    }
  };

  const saveProposal = async (status: 'draft' | 'sent' = 'draft') => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const vatAmount = subtotal * (proposal?.vatRate || 15) / 100;

      const updatedProposal: Proposal = {
        ...proposal!,
        ...values,
        status,
        items,
        subtotal,
        vatAmount,
        total: subtotal + vatAmount,
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage
      const saved = localStorage.getItem('siyabusa_proposals');
      let proposals = saved ? JSON.parse(saved) : [];
      const existingIndex = proposals.findIndex((p: Proposal) => p.id === updatedProposal.id);
      
      if (existingIndex >= 0) {
        proposals[existingIndex] = updatedProposal;
      } else {
        proposals.push(updatedProposal);
      }

      localStorage.setItem('siyabusa_proposals', JSON.stringify(proposals));
      setProposal(updatedProposal);
      
      message.success(status === 'sent' ? 'Proposal sent successfully!' : 'Proposal saved!');
      
      if (status === 'sent') {
        navigate('/app/proposals');
      }
    } catch (err) {
      message.error('Please fill in all required fields');
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    const newItem: ProposalItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const enhanceWithAI = async (field: string) => {
    setAiLoading(true);
    const currentValue = form.getFieldValue(field) || '';
    const title = form.getFieldValue('title') || 'this project';
    const clientCompany = form.getFieldValue('clientCompany') || 'the client';

    // Simulate AI enhancement (in production, this would call the AI API)
    await new Promise(resolve => setTimeout(resolve, 1500));

    let enhanced = '';
    switch (field) {
      case 'executiveSummary':
        enhanced = currentValue || `We are pleased to present this comprehensive proposal for ${title}. Our solution is specifically designed to address ${clientCompany}'s unique business requirements and deliver measurable results.\n\nThis proposal outlines our proven approach, methodology, and the tangible benefits your organization will gain through our partnership.`;
        break;
      case 'problemStatement':
        enhanced = currentValue || `${clientCompany} faces challenges common in today's competitive market:\n\n• Operational inefficiencies leading to increased costs\n• Manual processes limiting scalability\n• Data silos preventing informed decision-making\n• Need for modern, integrated business systems\n\nThese challenges, if unaddressed, can result in lost opportunities and competitive disadvantage.`;
        break;
      case 'proposedSolution':
        enhanced = currentValue || `Our proposed solution for ${title} includes:\n\n1. **Comprehensive Assessment** - Detailed analysis of current state and requirements\n2. **Custom Implementation** - Tailored solution designed for ${clientCompany}\n3. **Integration** - Seamless connection with existing systems\n4. **Training & Support** - Full knowledge transfer and ongoing assistance\n5. **Optimization** - Continuous improvement and performance monitoring`;
        break;
      case 'methodology':
        enhanced = currentValue || `Our proven methodology ensures successful delivery:\n\n**Phase 1: Discovery (Week 1-2)**\n• Stakeholder interviews\n• Requirements documentation\n• Current state assessment\n\n**Phase 2: Design (Week 3-4)**\n• Solution architecture\n• Process mapping\n• Technical specifications\n\n**Phase 3: Implementation (Week 5-8)**\n• System configuration\n• Data migration\n• Integration development\n\n**Phase 4: Go-Live (Week 9-10)**\n• User training\n• Testing & validation\n• Production deployment`;
        break;
      case 'whyUs':
        enhanced = currentValue || `**Why Choose SiyaBusa?**\n\n✓ **Local Expertise** - We understand the South African business landscape\n✓ **Proven Track Record** - Successful implementations across industries\n✓ **Dedicated Support** - Local team available for ongoing assistance\n✓ **Value for Money** - Enterprise capabilities at competitive pricing\n✓ **Innovation** - AI-powered features for modern businesses`;
        break;
      default:
        enhanced = currentValue;
    }

    form.setFieldValue(field, enhanced);
    setAiLoading(false);
    message.success('Content enhanced with AI!');
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = subtotal * (proposal?.vatRate || 15) / 100;
    return { subtotal, vatAmount, total: subtotal + vatAmount };
  };

  const totals = calculateTotals();

  const steps = [
    { title: 'Client Info', description: 'Who is this for?' },
    { title: 'Content', description: 'What are you proposing?' },
    { title: 'Pricing', description: 'How much does it cost?' },
    { title: 'Review', description: 'Final check' },
  ];

  const renderClientInfo = () => (
    <Card title="Client Information" style={{ marginBottom: 24 }}>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label="Proposal Title" name="title" rules={[{ required: true }]}>
            <Input placeholder="e.g., ERP Implementation Proposal for ABC Company" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Valid For" name="validDays" initialValue={30}>
            <Select>
              <Option value={14}>14 Days</Option>
              <Option value={30}>30 Days</Option>
              <Option value={60}>60 Days</Option>
              <Option value={90}>90 Days</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Client Name" name="clientName" rules={[{ required: true }]}>
            <Input placeholder="Contact person name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Client Email" name="clientEmail" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="email@company.com" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label="Client Company" name="clientCompany" rules={[{ required: true }]}>
            <Input placeholder="Company/Organization name" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderContent = () => (
    <>
      <Card title="Executive Summary" style={{ marginBottom: 24 }} extra={
        <Button icon={<RobotOutlined />} loading={aiLoading} onClick={() => enhanceWithAI('executiveSummary')}>
          Enhance with AI
        </Button>
      }>
        <Form.Item name="executiveSummary">
          <TextArea rows={6} placeholder="Provide a high-level overview of your proposal..." />
        </Form.Item>
      </Card>

      <Card title="Problem Statement" style={{ marginBottom: 24 }} extra={
        <Button icon={<BulbOutlined />} loading={aiLoading} onClick={() => enhanceWithAI('problemStatement')}>
          Suggest
        </Button>
      }>
        <Form.Item name="problemStatement">
          <TextArea rows={6} placeholder="What challenges does the client face?" />
        </Form.Item>
      </Card>

      <Card title="Proposed Solution" style={{ marginBottom: 24 }} extra={
        <Button icon={<ThunderboltOutlined />} loading={aiLoading} onClick={() => enhanceWithAI('proposedSolution')}>
          Enhance
        </Button>
      }>
        <Form.Item name="proposedSolution">
          <TextArea rows={8} placeholder="Describe your solution in detail..." />
        </Form.Item>
      </Card>

      <Card title="Methodology & Timeline" style={{ marginBottom: 24 }} extra={
        <Button icon={<RobotOutlined />} loading={aiLoading} onClick={() => enhanceWithAI('methodology')}>
          Generate
        </Button>
      }>
        <Form.Item name="methodology">
          <TextArea rows={8} placeholder="How will you deliver this project?" />
        </Form.Item>
      </Card>

      <Card title="Why Choose Us?" style={{ marginBottom: 24 }} extra={
        <Button icon={<BulbOutlined />} loading={aiLoading} onClick={() => enhanceWithAI('whyUs')}>
          Enhance
        </Button>
      }>
        <Form.Item name="whyUs">
          <TextArea rows={6} placeholder="What makes you the right choice?" />
        </Form.Item>
      </Card>
    </>
  );

  const renderPricing = () => (
    <Card title="Pricing & Line Items" style={{ marginBottom: 24 }}>
      <Table
        dataSource={items}
        rowKey="id"
        pagination={false}
        columns={[
          {
            title: 'Description',
            dataIndex: 'description',
            render: (_, record) => (
              <Input
                value={record.description}
                onChange={(e) => updateLineItem(record.id, 'description', e.target.value)}
                placeholder="Item/Service description"
              />
            ),
          },
          {
            title: 'Qty',
            dataIndex: 'quantity',
            width: 100,
            render: (_, record) => (
              <InputNumber
                min={1}
                value={record.quantity}
                onChange={(v) => updateLineItem(record.id, 'quantity', v || 1)}
              />
            ),
          },
          {
            title: 'Unit Price (R)',
            dataIndex: 'unitPrice',
            width: 150,
            render: (_, record) => (
              <InputNumber
                min={0}
                value={record.unitPrice}
                onChange={(v) => updateLineItem(record.id, 'unitPrice', v || 0)}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            ),
          },
          {
            title: 'Total (R)',
            dataIndex: 'total',
            width: 130,
            render: (total) => `R ${total.toLocaleString()}`,
          },
          {
            title: '',
            width: 60,
            render: (_, record) => (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeLineItem(record.id)}
              />
            ),
          },
        ]}
        footer={() => (
          <Button type="dashed" block icon={<PlusOutlined />} onClick={addLineItem}>
            Add Line Item
          </Button>
        )}
      />

      <Divider />

      <Row justify="end">
        <Col span={8}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 8 }}>
              <Text>Subtotal:</Text>
              <Text strong style={{ marginLeft: 16 }}>R {totals.subtotal.toLocaleString()}</Text>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text>VAT (15%):</Text>
              <Text strong style={{ marginLeft: 16 }}>R {totals.vatAmount.toLocaleString()}</Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <Text strong style={{ fontSize: 18 }}>Total:</Text>
              <Text strong style={{ marginLeft: 16, fontSize: 18, color: '#1890ff' }}>
                R {totals.total.toLocaleString()}
              </Text>
            </div>
          </div>
        </Col>
      </Row>

      <Card title="Terms & Conditions" style={{ marginTop: 24 }} size="small">
        <Form.Item name="terms">
          <TextArea rows={4} />
        </Form.Item>
      </Card>
    </Card>
  );

  const renderReview = () => {
    const values = form.getFieldsValue();
    return (
      <Card title="Review Your Proposal">
        <Alert
          message="Ready to send?"
          description="Review your proposal below before sending to the client."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Divider>Client Details</Divider>
        <Row gutter={16}>
          <Col span={8}><Text type="secondary">Client:</Text> <Text strong>{values.clientName}</Text></Col>
          <Col span={8}><Text type="secondary">Company:</Text> <Text strong>{values.clientCompany}</Text></Col>
          <Col span={8}><Text type="secondary">Email:</Text> <Text strong>{values.clientEmail}</Text></Col>
        </Row>

        <Divider>Proposal Content</Divider>
        <Title level={4}>{values.title}</Title>
        
        {values.executiveSummary && (
          <>
            <Text strong>Executive Summary</Text>
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{values.executiveSummary}</Paragraph>
          </>
        )}

        {values.proposedSolution && (
          <>
            <Text strong>Proposed Solution</Text>
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{values.proposedSolution}</Paragraph>
          </>
        )}

        <Divider>Pricing Summary</Divider>
        <Row>
          <Col span={12}>
            <Text type="secondary">Number of items:</Text> <Text strong>{items.length}</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Text strong style={{ fontSize: 20, color: '#1890ff' }}>
              Total: R {totals.total.toLocaleString()}
            </Text>
          </Col>
        </Row>
      </Card>
    );
  };

  if (!proposal) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/app/proposals')}>
                Back to Proposals
              </Button>
              <Divider type="vertical" />
              <Title level={4} style={{ margin: 0 }}>
                {id === 'new' ? 'Create New Proposal' : `Edit ${proposal.id}`}
              </Title>
              <Tag color={proposal.status === 'draft' ? 'default' : 'green'}>{proposal.status.toUpperCase()}</Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(true)}>Preview</Button>
              <Button icon={<SaveOutlined />} loading={loading} onClick={() => saveProposal('draft')}>
                Save Draft
              </Button>
              <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={() => saveProposal('sent')}>
                Save & Send
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

      <Form form={form} layout="vertical" initialValues={proposal}>
        {currentStep === 0 && renderClientInfo()}
        {currentStep === 1 && renderContent()}
        {currentStep === 2 && renderPricing()}
        {currentStep === 3 && renderReview()}
      </Form>

      <Card>
        <Row justify="space-between">
          <Col>
            {currentStep > 0 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>
            )}
          </Col>
          <Col>
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary" icon={<SendOutlined />} onClick={() => saveProposal('sent')}>
                Send Proposal
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Preview Modal */}
      <Modal
        title="Proposal Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>Close</Button>,
          <Button key="pdf" icon={<DownloadOutlined />}>Download PDF</Button>,
          <Button key="send" type="primary" icon={<SendOutlined />} onClick={() => { setPreviewVisible(false); saveProposal('sent'); }}>
            Send Now
          </Button>,
        ]}
      >
        <div style={{ padding: '24px', background: '#fff' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2}>Business Proposal</Title>
            <Title level={4} type="secondary">{form.getFieldValue('title')}</Title>
            <Text type="secondary">Prepared for {form.getFieldValue('clientCompany')}</Text>
          </div>

          <Divider />

          {form.getFieldValue('executiveSummary') && (
            <>
              <Title level={4}>Executive Summary</Title>
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{form.getFieldValue('executiveSummary')}</Paragraph>
            </>
          )}

          {form.getFieldValue('problemStatement') && (
            <>
              <Title level={4}>Understanding Your Challenges</Title>
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{form.getFieldValue('problemStatement')}</Paragraph>
            </>
          )}

          {form.getFieldValue('proposedSolution') && (
            <>
              <Title level={4}>Our Solution</Title>
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{form.getFieldValue('proposedSolution')}</Paragraph>
            </>
          )}

          {form.getFieldValue('methodology') && (
            <>
              <Title level={4}>Approach & Timeline</Title>
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{form.getFieldValue('methodology')}</Paragraph>
            </>
          )}

          {items.length > 0 && (
            <>
              <Title level={4}>Investment</Title>
              <Table
                dataSource={items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Description', dataIndex: 'description' },
                  { title: 'Qty', dataIndex: 'quantity', width: 60 },
                  { title: 'Unit Price', dataIndex: 'unitPrice', render: (v) => `R ${v.toLocaleString()}`, width: 120 },
                  { title: 'Total', dataIndex: 'total', render: (v) => `R ${v.toLocaleString()}`, width: 120 },
                ]}
              />
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Text strong style={{ fontSize: 18 }}>Total: R {totals.total.toLocaleString()} (incl. VAT)</Text>
              </div>
            </>
          )}

          {form.getFieldValue('whyUs') && (
            <>
              <Title level={4}>Why Choose Us</Title>
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{form.getFieldValue('whyUs')}</Paragraph>
            </>
          )}

          {form.getFieldValue('terms') && (
            <>
              <Divider />
              <Title level={5}>Terms & Conditions</Title>
              <Paragraph type="secondary" style={{ fontSize: 12 }}>{form.getFieldValue('terms')}</Paragraph>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProposalEditor;
