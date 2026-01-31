import React from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Space,
  Divider,
  Tag,
  Avatar,
  Table,
  Steps,
  Timeline,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SendOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import './ProposalPreview.css';

const { Title, Text, Paragraph } = Typography;

const ProposalPreview: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Sample proposal data
  const proposal = {
    id: '1',
    title: 'Enterprise Software Implementation',
    number: 'PROP-2024-0042',
    status: 'sent',
    client: {
      name: 'TechCorp Industries',
      contact: 'John Doe',
      title: 'CEO',
      email: 'john@techcorp.com',
      address: '123 Tech Boulevard, Silicon Valley, CA 94000',
    },
    company: {
      name: 'WorldClass ERP',
      contact: 'John Smith',
      title: 'Account Executive',
      email: 'john.smith@worldclass-erp.com',
      address: '456 Business Park, New York, NY 10001',
    },
    createdAt: '2024-01-12',
    validUntil: '2024-02-13',
    sections: [
      {
        title: 'Executive Summary',
        content: `Thank you for the opportunity to present this proposal for your enterprise software implementation needs. At WorldClass ERP, we understand the unique challenges facing your organization and have developed a comprehensive solution to address your requirements.

Our team has extensive experience implementing similar solutions for organizations in your industry. We are confident that our approach will deliver measurable results and provide a strong return on investment.`,
      },
      {
        title: 'Our Approach',
        content: `Our proven methodology ensures successful project delivery through:

• **Discovery Phase**: In-depth analysis of your current processes and requirements
• **Design Phase**: Custom solution architecture aligned with your business goals
• **Implementation Phase**: Phased rollout with minimal disruption to operations
• **Training Phase**: Comprehensive training program for all user levels
• **Support Phase**: Ongoing support and continuous improvement`,
      },
    ],
    lineItems: [
      {
        name: 'Implementation Services',
        description: 'Full system implementation including setup and configuration',
        quantity: 1,
        unitPrice: 45000,
        total: 45000,
      },
      {
        name: 'Training & Onboarding',
        description: '5-day onsite training for your team',
        quantity: 5,
        unitPrice: 2000,
        total: 9000,
      },
      {
        name: 'Annual Support Package',
        description: 'Premium 24/7 support with dedicated account manager',
        quantity: 1,
        unitPrice: 18000,
        total: 18000,
      },
    ],
    subtotal: 72000,
    tax: 7200,
    total: 79200,
    terms: [
      'This proposal is valid for 30 days from the date of issue.',
      'Payment terms: 50% upfront, 50% upon completion.',
      'Additional services may be quoted separately.',
      'All prices are exclusive of applicable taxes.',
      'Project timeline begins upon receipt of signed agreement and initial payment.',
    ],
  };

  const timeline = [
    { week: '1-2', phase: 'Discovery & Planning' },
    { week: '3-6', phase: 'Design & Development' },
    { week: '7-10', phase: 'Implementation & Testing' },
    { week: '11-12', phase: 'Training & Go-Live' },
  ];

  return (
    <div className="proposal-preview">
      {/* Header */}
      <div className="preview-header">
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/proposals/list')}
        >
          Back to Proposals
        </Button>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/proposals/edit/${id}`)}>
            Edit
          </Button>
          <Button icon={<PrinterOutlined />}>Print</Button>
          <Button icon={<DownloadOutlined />}>Download PDF</Button>
          <Button icon={<ShareAltOutlined />}>Share</Button>
          <Button type="primary" icon={<SendOutlined />}>
            Send to Client
          </Button>
        </Space>
      </div>

      {/* Preview Document */}
      <Card className="document-card">
        {/* Document Header */}
        <div className="document-header">
          <div className="company-logo">
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>WorldClass ERP</Title>
          </div>
          <div className="document-meta">
            <Tag color="processing">Proposal</Tag>
            <Text strong>{proposal.number}</Text>
          </div>
        </div>

        <Title level={1} className="proposal-title">{proposal.title}</Title>

        <Divider />

        {/* Client & Company Info */}
        <Row gutter={48} className="parties-section">
          <Col span={12}>
            <div className="party-box">
              <Text type="secondary" className="party-label">PREPARED FOR</Text>
              <Title level={4}>{proposal.client.name}</Title>
              <Text>{proposal.client.contact}, {proposal.client.title}</Text>
              <br />
              <Text type="secondary">{proposal.client.email}</Text>
              <br />
              <Text type="secondary">{proposal.client.address}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div className="party-box">
              <Text type="secondary" className="party-label">PREPARED BY</Text>
              <Title level={4}>{proposal.company.name}</Title>
              <Text>{proposal.company.contact}, {proposal.company.title}</Text>
              <br />
              <Text type="secondary">{proposal.company.email}</Text>
              <br />
              <Text type="secondary">{proposal.company.address}</Text>
            </div>
          </Col>
        </Row>

        <Row gutter={24} className="dates-row">
          <Col span={12}>
            <Space>
              <ClockCircleOutlined />
              <Text>Date: {dayjs(proposal.createdAt).format('MMMM D, YYYY')}</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <CheckCircleOutlined />
              <Text>Valid Until: {dayjs(proposal.validUntil).format('MMMM D, YYYY')}</Text>
            </Space>
          </Col>
        </Row>

        <Divider />

        {/* Content Sections */}
        {proposal.sections.map((section, index) => (
          <div key={index} className="content-section">
            <Title level={3}>{section.title}</Title>
            <Paragraph style={{ whiteSpace: 'pre-line' }}>{section.content}</Paragraph>
          </div>
        ))}

        {/* Timeline */}
        <div className="content-section">
          <Title level={3}>Project Timeline</Title>
          <div className="timeline-visual">
            {timeline.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-week">Week {item.week}</div>
                <div className="timeline-bar" style={{ width: `${100 / timeline.length}%` }} />
                <div className="timeline-phase">{item.phase}</div>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* Investment Section */}
        <div className="content-section">
          <Title level={3}>Investment</Title>
          <Table
            dataSource={proposal.lineItems}
            rowKey="name"
            pagination={false}
            columns={[
              { 
                title: 'Description', 
                key: 'description',
                render: (_, record) => (
                  <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Text type="secondary">{record.description}</Text>
                  </div>
                ),
              },
              { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 80 },
              { 
                title: 'Unit Price', 
                dataIndex: 'unitPrice', 
                key: 'unitPrice', 
                width: 120,
                render: (v) => `$${v.toLocaleString()}`,
              },
              { 
                title: 'Total', 
                dataIndex: 'total', 
                key: 'total', 
                width: 120,
                render: (v) => <Text strong>${v.toLocaleString()}</Text>,
              },
            ]}
            summary={() => (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <Text>Subtotal</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text>${proposal.subtotal.toLocaleString()}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <Text>Tax (10%)</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text>${proposal.tax.toLocaleString()}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <Text strong>Total Investment</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Title level={4} style={{ margin: 0 }}>${proposal.total.toLocaleString()}</Title>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            )}
          />
        </div>

        <Divider />

        {/* Terms */}
        <div className="content-section">
          <Title level={3}>Terms & Conditions</Title>
          <ol className="terms-list">
            {proposal.terms.map((term, index) => (
              <li key={index}><Text>{term}</Text></li>
            ))}
          </ol>
        </div>

        <Divider />

        {/* Signatures */}
        <div className="content-section signatures">
          <Title level={3}>Acceptance</Title>
          <Row gutter={48}>
            <Col span={12}>
              <div className="signature-block">
                <Text strong>Client Signature</Text>
                <div className="signature-line" />
                <Text type="secondary">{proposal.client.contact}</Text>
                <Text type="secondary" className="sig-date">Date: _________________</Text>
              </div>
            </Col>
            <Col span={12}>
              <div className="signature-block">
                <Text strong>WorldClass ERP</Text>
                <div className="signature-line signed">
                  <span className="signature-text">John Smith</span>
                </div>
                <Text type="secondary">{proposal.company.contact}</Text>
                <Text type="secondary" className="sig-date">Date: {dayjs().format('MMM D, YYYY')}</Text>
              </div>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default ProposalPreview;
