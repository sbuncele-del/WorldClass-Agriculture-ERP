import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  message,
  Badge,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  FileTextOutlined,
  LaptopOutlined,
  ToolOutlined,
  TeamOutlined,
  DollarOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Templates.css';

const { Title, Text, Paragraph } = Typography;

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  industry?: string;
  sections: number;
  lastUsed?: string;
  usageCount: number;
  isFavorite: boolean;
  isPremium: boolean;
  thumbnail: string;
  icon: React.ReactNode;
}

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'services', label: 'Professional Services' },
    { value: 'software', label: 'Software & IT' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'finance', label: 'Financial Services' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'custom', label: 'Custom Templates' },
  ];

  const templates: Template[] = [
    {
      id: '1',
      name: 'Enterprise Solution',
      description: 'Comprehensive template for large enterprise software implementations with detailed pricing and timeline sections.',
      category: 'software',
      sections: 8,
      usageCount: 156,
      isFavorite: true,
      isPremium: false,
      thumbnail: '#1890ff',
      icon: <LaptopOutlined />,
    },
    {
      id: '2',
      name: 'Professional Services',
      description: 'Perfect for accounting, legal, and other professional service engagements.',
      category: 'services',
      sections: 6,
      usageCount: 89,
      isFavorite: true,
      isPremium: false,
      thumbnail: '#52c41a',
      icon: <FileTextOutlined />,
    },
    {
      id: '3',
      name: 'IT Services & Support',
      description: 'Template designed for managed IT services, support contracts, and maintenance agreements.',
      category: 'software',
      sections: 7,
      usageCount: 67,
      isFavorite: false,
      isPremium: false,
      thumbnail: '#722ed1',
      icon: <ToolOutlined />,
    },
    {
      id: '4',
      name: 'Consulting Engagement',
      description: 'Strategic consulting proposal with scope definition, deliverables, and milestone payments.',
      category: 'consulting',
      sections: 6,
      usageCount: 45,
      isFavorite: false,
      isPremium: false,
      thumbnail: '#fa8c16',
      icon: <TeamOutlined />,
    },
    {
      id: '5',
      name: 'Financial Services',
      description: 'Proposal template for financial advisory, wealth management, and investment services.',
      category: 'finance',
      sections: 7,
      usageCount: 34,
      isFavorite: false,
      isPremium: true,
      thumbnail: '#13c2c2',
      icon: <BankOutlined />,
    },
    {
      id: '6',
      name: 'Marketing Campaign',
      description: 'Creative proposal for marketing campaigns, brand strategy, and digital marketing services.',
      category: 'marketing',
      sections: 8,
      usageCount: 28,
      isFavorite: false,
      isPremium: true,
      thumbnail: '#eb2f96',
      icon: <DollarOutlined />,
    },
    {
      id: '7',
      name: 'SaaS Subscription',
      description: 'Template for SaaS products with recurring pricing, features comparison, and onboarding.',
      category: 'software',
      sections: 5,
      usageCount: 52,
      isFavorite: false,
      isPremium: false,
      thumbnail: '#2f54eb',
      icon: <LaptopOutlined />,
    },
    {
      id: '8',
      name: 'Project Retainer',
      description: 'Ongoing retainer agreement with monthly hours allocation and scope.',
      category: 'services',
      sections: 5,
      usageCount: 41,
      isFavorite: false,
      isPremium: false,
      thumbnail: '#389e0d',
      icon: <FileTextOutlined />,
    },
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchText.toLowerCase()) ||
      t.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const favoriteTemplates = templates.filter(t => t.isFavorite);

  const handleUseTemplate = (template: Template) => {
    message.success(`Creating proposal from "${template.name}" template`);
    navigate('/proposals/new');
  };

  const handleToggleFavorite = (id: string) => {
    message.success('Updated favorites');
  };

  return (
    <div className="templates-page">
      <div className="page-header">
        <div>
          <Title level={4} style={{ margin: 0 }}>Proposal Templates</Title>
          <Text type="secondary">Start with a professional template and customize</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>
          Create Template
        </Button>
      </div>

      {/* Favorites Section */}
      {favoriteTemplates.length > 0 && (
        <Card title={<><StarFilled style={{ color: '#faad14' }} /> Favorites</>} className="favorites-card">
          <Row gutter={16}>
            {favoriteTemplates.map((template) => (
              <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
                <div 
                  className="favorite-item"
                  onClick={() => handleUseTemplate(template)}
                >
                  <div 
                    className="template-icon" 
                    style={{ background: template.thumbnail }}
                  >
                    {template.icon}
                  </div>
                  <div className="favorite-info">
                    <Text strong>{template.name}</Text>
                    <Text type="secondary">{template.usageCount} uses</Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Filters */}
      <Card className="filters-card">
        <Space wrap>
          <Input
            placeholder="Search templates..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 180 }}
            options={categories}
          />
        </Space>
      </Card>

      {/* Templates Grid */}
      <Row gutter={[16, 16]}>
        {filteredTemplates.map((template) => (
          <Col key={template.id} xs={24} sm={12} lg={8} xl={6}>
            <Card 
              className="template-card"
              hoverable
              cover={
                <div 
                  className="template-cover"
                  style={{ background: template.thumbnail }}
                >
                  <div className="cover-icon">{template.icon}</div>
                  {template.isPremium && (
                    <Badge.Ribbon text="Premium" color="gold" />
                  )}
                </div>
              }
              actions={[
                <Tooltip title="Preview" key="preview">
                  <EyeOutlined onClick={() => setPreviewTemplate(template)} />
                </Tooltip>,
                <Tooltip title="Use Template" key="use">
                  <CopyOutlined onClick={() => handleUseTemplate(template)} />
                </Tooltip>,
                <Tooltip title={template.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} key="favorite">
                  {template.isFavorite ? 
                    <StarFilled style={{ color: '#faad14' }} onClick={() => handleToggleFavorite(template.id)} /> : 
                    <StarOutlined onClick={() => handleToggleFavorite(template.id)} />
                  }
                </Tooltip>,
              ]}
            >
              <Card.Meta
                title={template.name}
                description={
                  <>
                    <Paragraph 
                      type="secondary" 
                      ellipsis={{ rows: 2 }}
                      style={{ marginBottom: 8 }}
                    >
                      {template.description}
                    </Paragraph>
                    <Space>
                      <Tag>{template.sections} sections</Tag>
                      <Text type="secondary">{template.usageCount} uses</Text>
                    </Space>
                  </>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Preview Modal */}
      <Modal
        title={previewTemplate?.name}
        open={!!previewTemplate}
        onCancel={() => setPreviewTemplate(null)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewTemplate(null)}>
            Close
          </Button>,
          <Button 
            key="use" 
            type="primary" 
            icon={<CopyOutlined />}
            onClick={() => {
              if (previewTemplate) {
                handleUseTemplate(previewTemplate);
              }
            }}
          >
            Use This Template
          </Button>,
        ]}
      >
        {previewTemplate && (
          <div className="template-preview">
            <div 
              className="preview-header-bar"
              style={{ background: previewTemplate.thumbnail }}
            >
              <div className="preview-icon">{previewTemplate.icon}</div>
            </div>
            <div className="preview-content">
              <Paragraph>{previewTemplate.description}</Paragraph>
              <Title level={5}>Included Sections:</Title>
              <ul>
                <li>Cover Page</li>
                <li>Executive Summary</li>
                <li>Scope of Work</li>
                <li>Investment / Pricing</li>
                <li>Timeline & Milestones</li>
                <li>Terms & Conditions</li>
                <li>Acceptance Signature</li>
                {previewTemplate.sections > 7 && <li>Case Studies / References</li>}
              </ul>
              <Space style={{ marginTop: 16 }}>
                <Tag color="blue">{previewTemplate.category}</Tag>
                <Text type="secondary">{previewTemplate.usageCount} proposals created</Text>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Templates;
