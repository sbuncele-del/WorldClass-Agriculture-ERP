import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Tag, Space, message, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, MessageOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import '../../styles/erp-ui.css';

const { TextArea } = Input;
const { Option } = Select;

interface Correspondence {
  correspondence_id: number;
  reference_number: string;
  sars_reference: string;
  correspondence_type_id: number;
  type_name: string;
  category: string;
  client_id: string;
  client_name: string;
  taxpayer_number: string;
  subject: string;
  description: string;
  received_date: string;
  deadline_date: string;
  days_to_deadline: number;
  urgency_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'NEW' | 'IN_PROGRESS' | 'REVIEW' | 'SUBMITTED' | 'COMPLETED' | 'CLOSED';
  assigned_to: string;
  deadline_status: string;
}

interface CorrespondenceType {
  type_id: number;
  type_code: string;
  type_name: string;
  category: string;
  default_urgency: string;
  default_response_days: number;
}

const CorrespondencePage: React.FC = () => {
  const [correspondence, setCorrespondence] = useState<Correspondence[]>([]);
  const [correspondenceTypes, setCorrespondenceTypes] = useState<CorrespondenceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedCorrespondence, setSelectedCorrespondence] = useState<Correspondence | null>(null);
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [stats, setStats] = useState({ total: 0, critical: 0, overdue: 0, dueThisWeek: 0 });

  useEffect(() => {
    fetchCorrespondence();
    fetchCorrespondenceTypes();
  }, []);

  const fetchCorrespondence = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/sars-sentinel/correspondence', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        const data = result.data?.correspondence || [];
        setCorrespondence(data);
        
        // Calculate stats
        const critical = data.filter((c: Correspondence) => c.urgency_level === 'CRITICAL').length;
        const overdue = data.filter((c: Correspondence) => c.days_to_deadline < 0).length;
        const dueThisWeek = data.filter((c: Correspondence) => c.days_to_deadline >= 0 && c.days_to_deadline <= 7).length;
        setStats({ total: data.length, critical, overdue, dueThisWeek });
      }
    } catch (error) {
      console.error('Error fetching correspondence:', error);
      message.error('Failed to load correspondence');
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrespondenceTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/sars-sentinel/correspondence-types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setCorrespondenceTypes(result.data?.types || []);
      }
    } catch (error) {
      console.error('Error fetching correspondence types:', error);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/sars-sentinel/correspondence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correspondenceTypeId: values.correspondence_type_id,
          clientName: values.client_name,
          taxpayerNumber: values.taxpayer_number,
          subject: values.subject,
          description: values.description,
          receivedDate: values.received_date?.format('YYYY-MM-DD'),
          deadlineDate: values.deadline_date?.format('YYYY-MM-DD'),
          urgencyLevel: values.urgency_level
        })
      });
      const result = await response.json();
      if (result.success) {
        message.success('Correspondence created successfully!');
        setIsModalVisible(false);
        form.resetFields();
        fetchCorrespondence();
      } else {
        message.error(result.error || 'Failed to create correspondence');
      }
    } catch (error) {
      console.error('Error creating correspondence:', error);
      message.error('Failed to create correspondence');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v2/sars-sentinel/correspondence/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (result.success) {
        message.success('Status updated successfully!');
        fetchCorrespondence();
      } else {
        message.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update status');
    }
  };

  const handleAddComment = async (values: any) => {
    if (!selectedCorrespondence) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v2/sars-sentinel/correspondence/${selectedCorrespondence.correspondence_id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commentText: values.comment,
          isInternal: true
        })
      });
      const result = await response.json();
      if (result.success) {
        message.success('Comment added successfully!');
        setIsCommentModalVisible(false);
        commentForm.resetFields();
      } else {
        message.error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('Failed to add comment');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'gold';
      case 'LOW': return 'green';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'blue';
      case 'IN_PROGRESS': return 'purple';
      case 'REVIEW': return 'cyan';
      case 'SUBMITTED': return 'geekblue';
      case 'COMPLETED': return 'green';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Reference',
      dataIndex: 'reference_number',
      key: 'reference_number',
      render: (text: string, record: Correspondence) => (
        <div>
          <strong>{text}</strong>
          {record.sars_reference && <div style={{ fontSize: 12, color: '#666' }}>SARS: {record.sars_reference}</div>}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type_name',
      key: 'type_name',
      render: (text: string, record: Correspondence) => (
        <div>
          <div>{text}</div>
          <Tag color="blue">{record.category}</Tag>
        </div>
      )
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      render: (text: string, record: Correspondence) => (
        <div>
          <div>{text || 'N/A'}</div>
          {record.taxpayer_number && <div style={{ fontSize: 12, color: '#666' }}>Tax: {record.taxpayer_number}</div>}
        </div>
      )
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      width: 200
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline_date',
      key: 'deadline_date',
      render: (date: string, record: Correspondence) => {
        const days = record.days_to_deadline;
        const color = days < 0 ? 'red' : days <= 3 ? 'orange' : days <= 7 ? 'gold' : 'green';
        return (
          <div>
            <div>{dayjs(date).format('DD MMM YYYY')}</div>
            <Tag color={color}>
              {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}
            </Tag>
          </div>
        );
      }
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency_level',
      key: 'urgency_level',
      render: (urgency: string) => <Tag color={getUrgencyColor(urgency)}>{urgency}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.replace('_', ' ')}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Correspondence) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedCorrespondence(record);
              setIsViewModalVisible(true);
            }}
          />
          <Button
            size="small"
            icon={<MessageOutlined />}
            onClick={() => {
              setSelectedCorrespondence(record);
              setIsCommentModalVisible(true);
            }}
          />
          {record.status !== 'COMPLETED' && record.status !== 'CLOSED' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleUpdateStatus(record.correspondence_id, 'COMPLETED')}
            >
              Complete
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Active" value={stats.total} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Critical" value={stats.critical} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Overdue" value={stats.overdue} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Due This Week" value={stats.dueThisWeek} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>📥 SARS Correspondence</h1>
          <p style={{ color: '#666', margin: 0 }}>Manage SARS letters, queries, and deadlines</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          size="large"
        >
          New Correspondence
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={correspondence}
          rowKey="correspondence_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="New SARS Correspondence"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="correspondence_type_id"
                label="Correspondence Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select placeholder="Select type">
                  {correspondenceTypes.map(type => (
                    <Option key={type.type_id} value={type.type_id}>
                      {type.type_name} ({type.category})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="urgency_level"
                label="Urgency Level"
                rules={[{ required: true, message: 'Please select urgency' }]}
              >
                <Select placeholder="Select urgency">
                  <Option value="CRITICAL">🔴 Critical</Option>
                  <Option value="HIGH">🟠 High</Option>
                  <Option value="MEDIUM">🟡 Medium</Option>
                  <Option value="LOW">🟢 Low</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="client_name" label="Client Name">
                <Input placeholder="Enter client name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taxpayer_number" label="Taxpayer Number">
                <Input placeholder="e.g., 9012345678" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter subject' }]}
          >
            <Input placeholder="Brief description of the correspondence" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Detailed notes about this correspondence" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="received_date"
                label="Date Received"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deadline_date"
                label="Response Deadline"
                rules={[{ required: true, message: 'Please select deadline' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Correspondence
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Correspondence Details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>Close</Button>
        ]}
        width={600}
      >
        {selectedCorrespondence && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>Reference:</strong> {selectedCorrespondence.reference_number}
              </Col>
              <Col span={12}>
                <strong>SARS Ref:</strong> {selectedCorrespondence.sars_reference || 'N/A'}
              </Col>
              <Col span={12}>
                <strong>Type:</strong> {selectedCorrespondence.type_name}
              </Col>
              <Col span={12}>
                <strong>Category:</strong> <Tag color="blue">{selectedCorrespondence.category}</Tag>
              </Col>
              <Col span={12}>
                <strong>Client:</strong> {selectedCorrespondence.client_name || 'N/A'}
              </Col>
              <Col span={12}>
                <strong>Tax Number:</strong> {selectedCorrespondence.taxpayer_number || 'N/A'}
              </Col>
              <Col span={24}>
                <strong>Subject:</strong> {selectedCorrespondence.subject}
              </Col>
              <Col span={24}>
                <strong>Description:</strong> {selectedCorrespondence.description || 'N/A'}
              </Col>
              <Col span={12}>
                <strong>Received:</strong> {dayjs(selectedCorrespondence.received_date).format('DD MMM YYYY')}
              </Col>
              <Col span={12}>
                <strong>Deadline:</strong> {dayjs(selectedCorrespondence.deadline_date).format('DD MMM YYYY')}
              </Col>
              <Col span={12}>
                <strong>Urgency:</strong> <Tag color={getUrgencyColor(selectedCorrespondence.urgency_level)}>{selectedCorrespondence.urgency_level}</Tag>
              </Col>
              <Col span={12}>
                <strong>Status:</strong> <Tag color={getStatusColor(selectedCorrespondence.status)}>{selectedCorrespondence.status}</Tag>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Comment Modal */}
      <Modal
        title="Add Comment"
        open={isCommentModalVisible}
        onCancel={() => {
          setIsCommentModalVisible(false);
          commentForm.resetFields();
        }}
        footer={null}
      >
        <Form form={commentForm} layout="vertical" onFinish={handleAddComment}>
          <Form.Item
            name="comment"
            label="Comment"
            rules={[{ required: true, message: 'Please enter a comment' }]}
          >
            <TextArea rows={4} placeholder="Enter your comment..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsCommentModalVisible(false);
                commentForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Add Comment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CorrespondencePage;
