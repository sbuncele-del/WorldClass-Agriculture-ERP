import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Space, Row, Col, Tag, Modal, Form, Input, Select, 
  message, Tooltip, Badge, Checkbox
} from 'antd';
import { 
  PlusOutlined, CopyOutlined, EditOutlined, DeleteOutlined, 
  StarOutlined, StarFilled, FolderOutlined, CheckSquareOutlined,
  CalendarOutlined, TeamOutlined, BarChartOutlined
} from '@ant-design/icons';
import apiClient from '../../../services/api';
import './ProjectTemplates.css';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tasks: number;
  milestones: number;
  duration: string;
  favorite: boolean;
  usageCount: number;
  lastUsed?: string;
  features: string[];
}

// Note: Template data is now fetched from /api/projects/templates API endpoint

const categoryColors: Record<string, string> = {
  'Development': '#1890ff',
  'Design': '#722ed1',
  'Marketing': '#fa541c',
  'Product': '#13c2c2',
  'Operations': '#52c41a'
};

const ProjectTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [useTemplateModal, setUseTemplateModal] = useState<Template | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await apiClient.get('/api/projects/templates');
        setTemplates(response.data?.data || response.data || []);
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const categories = [...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = !categoryFilter || t.category === categoryFilter;
    const matchesFavorites = !showFavoritesOnly || t.favorite;
    return matchesCategory && matchesFavorites;
  });

  const toggleFavorite = (id: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, favorite: !t.favorite } : t
    ));
  };

  const handleUseTemplate = (values: any) => {
    message.success(`Project "${values.name}" created from template "${useTemplateModal?.name}"`);
    setUseTemplateModal(null);
  };

  const handleCreateTemplate = (values: any) => {
    const newTemplate: Template = {
      id: String(Date.now()),
      name: values.name,
      description: values.description,
      category: values.category,
      tasks: 0,
      milestones: 0,
      duration: values.duration,
      favorite: false,
      usageCount: 0,
      features: values.features?.split(',').map((f: string) => f.trim()) || []
    };
    setTemplates([newTemplate, ...templates]);
    setCreateModalVisible(false);
    form.resetFields();
    message.success('Template created');
  };

  const handleDeleteTemplate = (id: string) => {
    Modal.confirm({
      title: 'Delete Template',
      content: 'Are you sure you want to delete this template?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setTemplates(templates.filter(t => t.id !== id));
        message.success('Template deleted');
      }
    });
  };

  return (
    <div className="project-templates">
      {/* Header */}
      <div className="page-header">
        <h1>Project Templates</h1>
        <Space>
          <Checkbox 
            checked={showFavoritesOnly} 
            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
          >
            <StarFilled style={{ color: '#faad14' }} /> Favorites only
          </Checkbox>
          <Select
            placeholder="All Categories"
            allowClear
            style={{ width: 150 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
          >
            {categories.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            Create Template
          </Button>
        </Space>
      </div>

      {/* Template Grid */}
      <Row gutter={[16, 16]}>
        {filteredTemplates.map(template => (
          <Col xs={24} sm={12} lg={8} xl={6} key={template.id}>
            <Card 
              className="template-card"
              actions={[
                <Tooltip title="Use Template">
                  <Button type="text" icon={<CopyOutlined />} onClick={() => setUseTemplateModal(template)}>
                    Use
                  </Button>
                </Tooltip>,
                <Tooltip title="Edit">
                  <Button type="text" icon={<EditOutlined />} />
                </Tooltip>,
                <Tooltip title="Delete">
                  <Button type="text" icon={<DeleteOutlined />} onClick={() => handleDeleteTemplate(template.id)} />
                </Tooltip>
              ]}
            >
              <div className="template-header">
                <Tag color={categoryColors[template.category]}>{template.category}</Tag>
                <Button 
                  type="text" 
                  size="small"
                  icon={template.favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                  onClick={() => toggleFavorite(template.id)}
                />
              </div>
              <h3 className="template-name">{template.name}</h3>
              <p className="template-description">{template.description}</p>
              
              <div className="template-meta">
                <span><CheckSquareOutlined /> {template.tasks} tasks</span>
                <span><FolderOutlined /> {template.milestones} milestones</span>
                <span><CalendarOutlined /> {template.duration}</span>
              </div>

              <div className="template-features">
                {template.features.slice(0, 3).map((feature, idx) => (
                  <Tag key={idx} className="feature-tag">{feature}</Tag>
                ))}
                {template.features.length > 3 && (
                  <Tag>+{template.features.length - 3} more</Tag>
                )}
              </div>

              <div className="template-footer">
                <Badge status="default" text={`Used ${template.usageCount} times`} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredTemplates.length === 0 && (
        <div className="empty-state">
          <FolderOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <p>No templates found</p>
        </div>
      )}

      {/* Use Template Modal */}
      <Modal
        title={`Create Project from "${useTemplateModal?.name}"`}
        open={!!useTemplateModal}
        onCancel={() => setUseTemplateModal(null)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleUseTemplate}>
          <Form.Item name="name" label="Project Name" rules={[{ required: true }]}>
            <Input placeholder="Enter project name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Project description" />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          
          {useTemplateModal && (
            <div className="template-preview">
              <h4>Template includes:</h4>
              <ul>
                <li><CheckSquareOutlined /> {useTemplateModal.tasks} tasks</li>
                <li><FolderOutlined /> {useTemplateModal.milestones} milestones</li>
                <li><CalendarOutlined /> Est. duration: {useTemplateModal.duration}</li>
              </ul>
            </div>
          )}

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setUseTemplateModal(null)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create Project</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Template Modal */}
      <Modal
        title="Create New Template"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTemplate}>
          <Form.Item name="name" label="Template Name" rules={[{ required: true }]}>
            <Input placeholder="Enter template name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Describe this template" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select placeholder="Select category">
                  {categories.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="Est. Duration">
                <Input placeholder="e.g., 2 weeks" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="features" label="Key Features (comma separated)">
            <Input placeholder="e.g., Planning, Design, Development" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create Template</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectTemplates;
