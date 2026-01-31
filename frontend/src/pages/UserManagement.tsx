import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Input,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Modal,
  Form,
  Select,
  message,
} from 'antd';
import {
  TeamOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  ReloadOutlined,
  UserAddOutlined,
  MailOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { HubLayout, HubHeader, StatusBanner, HubTabs } from '../components/hub';
import { workspaceApi } from '../services/api.service';
import apiClient from '../services/api';

interface AdminUser {
  user_id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  avatar_url?: string;
  email_verified?: boolean;
  mfa_enabled?: boolean;
  last_login_at?: string;
  last_active_at?: string;
  is_active?: boolean;
  status?: string;
  roles?: Array<{ role_id: string; role_name: string; role_code?: string }>;
}

interface Role {
  role_id: string;
  role_name: string;
  role_code?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm] = Form.useForm();

  const loadRoles = async () => {
    try {
      const response: any = await workspaceApi.admin.getRoles();
      const roleList = response?.roles || response?.data?.roles || response?.data || [];
      setRoles(Array.isArray(roleList) ? roleList : []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const handleInviteUser = async (values: any) => {
    setInviting(true);
    try {
      const response = await apiClient.post('/api/v2/admin/users/invite', values);
      if (response.data.success) {
        message.success(`Invitation sent to ${values.email}`);
        setInviteModalVisible(false);
        inviteForm.resetFields();
        loadUsers(); // Refresh user list
      } else {
        message.error(response.data.message || 'Failed to send invitation');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const loadUsers = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const term = query ?? search;
      const response: any = await workspaceApi.admin.getUsers({ limit: 200, search: term || undefined });
      // Handle different response formats from API
      const list = (response?.users || response?.data?.users || response?.data || []) as AdminUser[];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.is_active !== false).length;
    const mfa = users.filter(u => u.mfa_enabled).length;
    const roleNames = new Set<string>();
    users.forEach(u => (u.roles || []).forEach(r => roleNames.add(r.role_name)));
    return { total, active, mfa, roles: roleNames.size };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      [u.display_name, u.first_name, u.last_name, u.email, u.username]
        .filter(Boolean)
        .some(val => val?.toLowerCase().includes(term))
    );
  }, [users, search]);

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: AdminUser) => {
        const name = record.display_name || `${record.first_name || ''} ${record.last_name || ''}`.trim() || record.email;
        return (
          <Space>
            <Avatar src={record.avatar_url}>{name?.charAt(0)}</Avatar>
            <div>
              <div style={{ fontWeight: 600 }}>{name}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{record.email}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: AdminUser['roles']) =>
        roles && roles.length > 0 ? roles.map(r => <Tag key={r.role_id || r.role_name}>{r.role_name}</Tag>) : <Tag>—</Tag>,
    },
    {
      title: 'MFA',
      dataIndex: 'mfa_enabled',
      key: 'mfa_enabled',
      render: (enabled: boolean) => (enabled ? <Tag color="green">Enabled</Tag> : <Tag>Off</Tag>),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: AdminUser) => {
        if (record.status === 'invited') {
          return <Tag color="orange">Pending Invite</Tag>;
        }
        return <Tag color={record.is_active !== false ? 'green' : 'red'}>{record.is_active !== false ? 'Active' : 'Disabled'}</Tag>;
      },
    },
    {
      title: 'Last Login',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      render: (val: string) => (val ? new Date(val).toLocaleString() : '—'),
    },
  ];

  const content = () => {
    if (loading) {
      return (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <Spin size="large" tip="Loading users..." />
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          type="error"
          message="Failed to load users"
          description={error}
          action={<Button icon={<ReloadOutlined />} onClick={loadUsers}>Retry</Button>}
          showIcon
        />
      );
    }

    return (
      <>
        <Card style={{ marginBottom: 16 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Input.Search
              placeholder="Search users"
              allowClear
              value={search}
              onChange={e => setSearch(e.target.value)}
              onSearch={value => {
                setSearch(value);
                loadUsers(value);
              }}
              style={{ maxWidth: 320 }}
            />
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => loadUsers()}>Refresh</Button>
              <Button type="primary" icon={<UserAddOutlined />} onClick={() => setInviteModalVisible(true)}>
                Invite User
              </Button>
            </Space>
          </Space>
        </Card>

        <Table
          rowKey={record => record.user_id || record.email}
          columns={columns}
          dataSource={filteredUsers}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />

        {/* Invite User Modal */}
        <Modal
          title={<><MailOutlined /> Invite Team Member</>}
          open={inviteModalVisible}
          onCancel={() => { setInviteModalVisible(false); inviteForm.resetFields(); }}
          footer={null}
          destroyOnClose
        >
          <Form
            form={inviteForm}
            layout="vertical"
            onFinish={handleInviteUser}
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter email address' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="colleague@company.com" prefix={<MailOutlined />} />
            </Form.Item>
            <Form.Item name="first_name" label="First Name">
              <Input placeholder="John" />
            </Form.Item>
            <Form.Item name="last_name" label="Last Name">
              <Input placeholder="Doe" />
            </Form.Item>
            <Form.Item name="role_id" label="Role">
              <Select placeholder="Select a role (optional)">
                {roles.map(role => (
                  <Select.Option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="message" label="Personal Message (Optional)">
              <Input.TextArea 
                rows={3} 
                placeholder="Add a personal note to the invitation..."
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => { setInviteModalVisible(false); inviteForm.resetFields(); }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={inviting} icon={<SendOutlined />}>
                  Send Invitation
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  };

  return (
    <HubLayout>
      <HubHeader
        title="User Management"
        subtitle="Manage users, roles, permissions, and access control"
        icon={<TeamOutlined />}
        gradient="blue"
      />

      <StatusBanner
        gradient="blue"
        icon={<SafetyCertificateOutlined />}
        title="Directory Overview"
        subtitle="Tenant-scoped users"
        stats={[
          { title: 'Total Users', value: stats.total, prefix: <TeamOutlined /> },
          { title: 'Active Users', value: stats.active, valueStyle: { color: '#22c55e' } },
          { title: 'MFA Enabled', value: stats.mfa, prefix: <LockOutlined /> },
          { title: 'Roles Defined', value: stats.roles },
        ]}
      />

      <HubTabs
        theme="blue"
        tabs={[
          {
            key: 'users',
            label: 'Users',
            icon: <TeamOutlined />,
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic title="Total Users" value={stats.total} prefix={<TeamOutlined />} />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic title="Active" value={stats.active} valueStyle={{ color: '#22c55e' }} />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic title="MFA Enabled" value={stats.mfa} prefix={<LockOutlined />} />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic title="Roles" value={stats.roles} />
                      </Col>
                    </Row>
                    {content()}
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </HubLayout>
  );
};

export default UserManagement;
