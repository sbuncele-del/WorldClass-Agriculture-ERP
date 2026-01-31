import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Form,
  Tabs,
  Typography,
  Space,
  Divider,
  Switch,
  DatePicker,
  InputNumber,
  Table,
  Tag,
  Collapse,
  message,
  Modal,
  Upload,
  List,
  Avatar,
} from 'antd';
import {
  SaveOutlined,
  EyeOutlined,
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
  DragOutlined,
  FileImageOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  TableOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  BoldOutlined,
  ItalicOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  LinkOutlined,
  UploadOutlined,
  CopyOutlined,
  UndoOutlined,
  RedoOutlined,
  SettingOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import './ProposalEditor.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

interface Section {
  id: string;
  type: 'text' | 'pricing' | 'image' | 'video' | 'signature' | 'terms';
  title: string;
  content: string;
  visible: boolean;
}

interface LineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

const ProposalEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState('content');
  const [showPreview, setShowPreview] = useState(false);
  const [form] = Form.useForm();

  // Sample proposal sections
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      type: 'text',
      title: 'Executive Summary',
      content: '<p>Thank you for considering our proposal. We are excited to present our solution for your business needs...</p>',
      visible: true,
    },
    {
      id: '2',
      type: 'text',
      title: 'Our Approach',
      content: '<p>Our proven methodology ensures successful project delivery...</p>',
      visible: true,
    },
    {
      id: '3',
      type: 'pricing',
      title: 'Investment',
      content: '',
      visible: true,
    },
    {
      id: '4',
      type: 'text',
      title: 'Timeline',
      content: '<p>The project will be delivered in phases...</p>',
      visible: true,
    },
    {
      id: '5',
      type: 'terms',
      title: 'Terms & Conditions',
      content: '<p>This proposal is valid for 30 days...</p>',
      visible: true,
    },
    {
      id: '6',
      type: 'signature',
      title: 'Acceptance',
      content: '',
      visible: true,
    },
  ]);

  // Sample line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      name: 'Implementation Services',
      description: 'Full system implementation including setup and configuration',
      quantity: 1,
      unitPrice: 45000,
      discount: 0,
      total: 45000,
    },
    {
      id: '2',
      name: 'Training & Onboarding',
      description: '5-day onsite training for your team',
      quantity: 5,
      unitPrice: 2000,
      discount: 10,
      total: 9000,
    },
    {
      id: '3',
      name: 'Annual Support Package',
      description: 'Premium 24/7 support with dedicated account manager',
      quantity: 1,
      unitPrice: 18000,
      discount: 0,
      total: 18000,
    },
  ]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate total
        const discountAmount = (updated.quantity * updated.unitPrice) * (updated.discount / 100);
        updated.total = (updated.quantity * updated.unitPrice) - discountAmount;
        return updated;
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleSave = () => {
    message.success('Proposal saved');
  };

  const handleSend = () => {
    Modal.confirm({
      title: 'Send Proposal',
      content: 'Send this proposal to the client?',
      okText: 'Send',
      onOk: () => {
        message.success('Proposal sent to client');
        navigate('/proposals/list');
      },
    });
  };

  const sectionTypes = [
    { key: 'text', icon: <FileTextOutlined />, label: 'Text Block' },
    { key: 'pricing', icon: <TableOutlined />, label: 'Pricing Table' },
    { key: 'image', icon: <FileImageOutlined />, label: 'Image' },
    { key: 'video', icon: <VideoCameraOutlined />, label: 'Video' },
    { key: 'signature', icon: <FileTextOutlined />, label: 'Signature' },
    { key: 'terms', icon: <FileTextOutlined />, label: 'Terms' },
  ];

  const addSection = (type: string) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type: type as Section['type'],
      title: type === 'pricing' ? 'Investment' : 'New Section',
      content: '',
      visible: true,
    };
    setSections([...sections, newSection]);
  };

  return (
    <div className="proposal-editor">
      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <Title level={4} style={{ margin: 0 }}>
            {isEditing ? 'Edit Proposal' : 'Create Proposal'}
          </Title>
          <Text type="secondary">Draft - Auto-saved</Text>
        </div>
        <Space>
          <Button icon={<UndoOutlined />} />
          <Button icon={<RedoOutlined />} />
          <Button icon={<EyeOutlined />} onClick={() => navigate(`/proposals/preview/${id || 'new'}`)}>
            Preview
          </Button>
          <Button icon={<SaveOutlined />} onClick={handleSave}>
            Save Draft
          </Button>
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
            Send Proposal
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        {/* Main Editor */}
        <Col xs={24} lg={18}>
          <Card className="editor-card">
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <Tabs.TabPane tab="Content" key="content">
                {/* Cover Section */}
                <div className="proposal-cover">
                  <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Proposal Title">
                      <Input 
                        placeholder="Enter proposal title"
                        defaultValue="Enterprise Software Implementation"
                        className="proposal-title-input"
                      />
                    </Form.Item>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="client" label="Client">
                          <Select
                            placeholder="Select client"
                            defaultValue="techcorp"
                            options={[
                              { value: 'techcorp', label: 'TechCorp Industries' },
                              { value: 'abc', label: 'ABC Manufacturing' },
                              { value: 'global', label: 'Global Logistics Ltd' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="template" label="Template">
                          <Select
                            placeholder="Select template"
                            defaultValue="enterprise"
                            options={[
                              { value: 'enterprise', label: 'Enterprise Solution' },
                              { value: 'professional', label: 'Professional Services' },
                              { value: 'consulting', label: 'Consulting' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </div>

                <Divider />

                {/* Content Sections */}
                <div className="sections-container">
                  <Collapse defaultActiveKey={['1', '3']}>
                    {sections.filter(s => s.visible).map((section) => (
                      <Panel
                        key={section.id}
                        header={
                          <div className="section-header">
                            <DragOutlined className="drag-handle" />
                            <span>{section.title}</span>
                            <Tag>{section.type}</Tag>
                          </div>
                        }
                        extra={
                          <Space onClick={(e) => e.stopPropagation()}>
                            <Switch 
                              size="small" 
                              checked={section.visible}
                              onChange={(checked) => {
                                setSections(sections.map(s => 
                                  s.id === section.id ? { ...s, visible: checked } : s
                                ));
                              }}
                            />
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<DeleteOutlined />}
                              onClick={() => setSections(sections.filter(s => s.id !== section.id))}
                            />
                          </Space>
                        }
                      >
                        {section.type === 'text' && (
                          <div className="text-editor">
                            <div className="editor-toolbar">
                              <Space>
                                <Button type="text" icon={<BoldOutlined />} size="small" />
                                <Button type="text" icon={<ItalicOutlined />} size="small" />
                                <Divider type="vertical" />
                                <Button type="text" icon={<AlignLeftOutlined />} size="small" />
                                <Button type="text" icon={<AlignCenterOutlined />} size="small" />
                                <Button type="text" icon={<AlignRightOutlined />} size="small" />
                                <Divider type="vertical" />
                                <Button type="text" icon={<UnorderedListOutlined />} size="small" />
                                <Button type="text" icon={<OrderedListOutlined />} size="small" />
                                <Button type="text" icon={<LinkOutlined />} size="small" />
                              </Space>
                            </div>
                            <TextArea 
                              rows={6}
                              defaultValue={section.content.replace(/<[^>]*>/g, '')}
                              placeholder="Enter content..."
                            />
                          </div>
                        )}

                        {section.type === 'pricing' && (
                          <div className="pricing-editor">
                            <Table
                              dataSource={lineItems}
                              rowKey="id"
                              pagination={false}
                              size="small"
                              columns={[
                                {
                                  title: 'Item',
                                  key: 'item',
                                  width: 250,
                                  render: (_, record) => (
                                    <div>
                                      <Input 
                                        value={record.name}
                                        onChange={(e) => updateLineItem(record.id, 'name', e.target.value)}
                                        placeholder="Item name"
                                        style={{ marginBottom: 4 }}
                                      />
                                      <Input 
                                        value={record.description}
                                        onChange={(e) => updateLineItem(record.id, 'description', e.target.value)}
                                        placeholder="Description"
                                        size="small"
                                      />
                                    </div>
                                  ),
                                },
                                {
                                  title: 'Qty',
                                  key: 'quantity',
                                  width: 80,
                                  render: (_, record) => (
                                    <InputNumber 
                                      value={record.quantity}
                                      onChange={(v) => updateLineItem(record.id, 'quantity', v || 0)}
                                      min={1}
                                      style={{ width: '100%' }}
                                    />
                                  ),
                                },
                                {
                                  title: 'Unit Price',
                                  key: 'unitPrice',
                                  width: 120,
                                  render: (_, record) => (
                                    <InputNumber 
                                      value={record.unitPrice}
                                      onChange={(v) => updateLineItem(record.id, 'unitPrice', v || 0)}
                                      formatter={(v) => `$ ${v}`}
                                      parser={(v) => parseFloat(v?.replace(/\$\s?/g, '') || '0')}
                                      style={{ width: '100%' }}
                                    />
                                  ),
                                },
                                {
                                  title: 'Discount',
                                  key: 'discount',
                                  width: 80,
                                  render: (_, record) => (
                                    <InputNumber 
                                      value={record.discount}
                                      onChange={(v) => updateLineItem(record.id, 'discount', v || 0)}
                                      min={0}
                                      max={100}
                                      formatter={(v) => `${v}%`}
                                      parser={(v) => parseFloat(v?.replace('%', '') || '0')}
                                      style={{ width: '100%' }}
                                    />
                                  ),
                                },
                                {
                                  title: 'Total',
                                  key: 'total',
                                  width: 120,
                                  render: (_, record) => (
                                    <Text strong>${record.total.toLocaleString()}</Text>
                                  ),
                                },
                                {
                                  title: '',
                                  key: 'actions',
                                  width: 50,
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
                            />
                            <Button 
                              type="dashed" 
                              icon={<PlusOutlined />} 
                              onClick={addLineItem}
                              style={{ marginTop: 16, width: '100%' }}
                            >
                              Add Line Item
                            </Button>
                            <div className="pricing-summary">
                              <div className="summary-row">
                                <Text>Subtotal</Text>
                                <Text>${subtotal.toLocaleString()}</Text>
                              </div>
                              <div className="summary-row">
                                <Text>Tax (10%)</Text>
                                <Text>${tax.toLocaleString()}</Text>
                              </div>
                              <Divider style={{ margin: '8px 0' }} />
                              <div className="summary-row total">
                                <Text strong>Total</Text>
                                <Title level={4} style={{ margin: 0 }}>${grandTotal.toLocaleString()}</Title>
                              </div>
                            </div>
                          </div>
                        )}

                        {section.type === 'image' && (
                          <Upload.Dragger>
                            <p className="ant-upload-drag-icon">
                              <FileImageOutlined />
                            </p>
                            <p>Click or drag image to upload</p>
                          </Upload.Dragger>
                        )}

                        {section.type === 'signature' && (
                          <div className="signature-section">
                            <Row gutter={24}>
                              <Col span={12}>
                                <div className="signature-box">
                                  <Text strong>Client Signature</Text>
                                  <div className="signature-line">
                                    <Text type="secondary">Click here to sign</Text>
                                  </div>
                                  <Text type="secondary">Date: ______________</Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="signature-box">
                                  <Text strong>Your Signature</Text>
                                  <div className="signature-line signed">
                                    <Text italic>John Smith</Text>
                                  </div>
                                  <Text type="secondary">Date: {dayjs().format('MMM D, YYYY')}</Text>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        )}

                        {section.type === 'terms' && (
                          <TextArea 
                            rows={6}
                            defaultValue="1. This proposal is valid for 30 days from the date of issue.\n2. Payment terms: 50% upfront, 50% upon completion.\n3. Additional services may be quoted separately.\n4. All prices are exclusive of applicable taxes."
                          />
                        )}
                      </Panel>
                    ))}
                  </Collapse>
                </div>

                {/* Add Section */}
                <div className="add-section">
                  <Text type="secondary">Add Section:</Text>
                  <Space wrap>
                    {sectionTypes.map((type) => (
                      <Button 
                        key={type.key}
                        icon={type.icon}
                        onClick={() => addSection(type.key)}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </Space>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Settings" key="settings">
                <Form layout="vertical">
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label="Proposal Number">
                        <Input defaultValue="PROP-2024-0042" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Valid Until">
                        <DatePicker 
                          style={{ width: '100%' }}
                          defaultValue={dayjs().add(30, 'days')}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Client Contact">
                    <Select
                      placeholder="Select contact"
                      defaultValue="john"
                      options={[
                        { value: 'john', label: 'John Doe - CEO' },
                        { value: 'jane', label: 'Jane Smith - CFO' },
                        { value: 'bob', label: 'Bob Wilson - CTO' },
                      ]}
                    />
                  </Form.Item>

                  <Divider>Email Settings</Divider>

                  <Form.Item label="Email Subject">
                    <Input defaultValue="Proposal: Enterprise Software Implementation" />
                  </Form.Item>

                  <Form.Item label="Email Message">
                    <TextArea 
                      rows={4}
                      defaultValue="Dear John,\n\nPlease find attached our proposal for the Enterprise Software Implementation project. We look forward to discussing this with you.\n\nBest regards,\nJohn Smith"
                    />
                  </Form.Item>

                  <Divider>Notifications</Divider>

                  <Form.Item label="Notify me when">
                    <Space direction="vertical">
                      <Switch defaultChecked /> <Text>Proposal is viewed</Text>
                      <br />
                      <Switch defaultChecked /> <Text>Proposal is accepted</Text>
                      <br />
                      <Switch defaultChecked /> <Text>Comment is added</Text>
                    </Space>
                  </Form.Item>
                </Form>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Activity" key="activity">
                <List
                  itemLayout="horizontal"
                  dataSource={[
                    { action: 'Created', user: 'John Smith', time: '2 hours ago' },
                    { action: 'Edited pricing section', user: 'John Smith', time: '1 hour ago' },
                    { action: 'Added terms section', user: 'Sarah Johnson', time: '45 minutes ago' },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={item.action}
                        description={`${item.user} - ${item.time}`}
                      />
                    </List.Item>
                  )}
                />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={6}>
          {/* Client Info */}
          <Card title="Client" className="sidebar-card">
            <div className="client-preview">
              <Avatar size={48}>T</Avatar>
              <div>
                <Text strong>TechCorp Industries</Text>
                <Text type="secondary" className="client-contact">John Doe - CEO</Text>
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="info-row">
                <UserOutlined /> procurement@techcorp.com
              </div>
              <div className="info-row">
                <CalendarOutlined /> Valid until Feb 13, 2024
              </div>
            </Space>
          </Card>

          {/* Proposal Summary */}
          <Card title="Summary" className="sidebar-card">
            <div className="summary-stat">
              <Text type="secondary">Total Value</Text>
              <Title level={3} style={{ margin: 0 }}>${grandTotal.toLocaleString()}</Title>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div className="summary-stat">
              <Text type="secondary">Sections</Text>
              <Text strong>{sections.filter(s => s.visible).length}</Text>
            </div>
            <div className="summary-stat">
              <Text type="secondary">Line Items</Text>
              <Text strong>{lineItems.length}</Text>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" className="sidebar-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button icon={<EyeOutlined />} block>Preview</Button>
              <Button icon={<CopyOutlined />} block>Duplicate</Button>
              <Button icon={<UploadOutlined />} block>Export PDF</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProposalEditor;
