/**
 * Platform Admin Login
 * Special login for platform administrators
 * Separate from regular tenant login
 */

import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Alert } from 'antd';
import { SafetyCertificateOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text } = Typography;

const PlatformLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      // Use the standard login endpoint
      const response = await apiClient.post('/api/auth/login', {
        email: values.email,
        password: values.password,
      });

      // Handle the actual API response structure
      const responseData = response.data.data || response.data;
      const token = responseData.tokens?.accessToken || responseData.token;
      const user = responseData.user;

      if (!token || !user) {
        setError('Invalid response from server');
        return;
      }

      // Check if user has platform admin role
      if (!['platform_admin', 'support_agent', 'monitoring_user', 'super_admin', 'admin'].includes(user.role)) {
        setError('Access denied. You do not have platform administrator privileges.');
        return;
      }

      // Store platform admin token separately
      localStorage.setItem('platform_admin_token', token);
      localStorage.setItem('platform_admin_user', JSON.stringify(user));
      
      // Also set as regular token for API calls
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      message.success('Welcome to Platform Administration');
      navigate('/platform-admin/dashboard');
    } catch (err: any) {
      console.error('Platform login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 16px',
          }}>
            <SafetyCertificateOutlined style={{ fontSize: 36, color: 'white' }} />
          </div>
          <Title level={3} style={{ margin: 0 }}>Platform Administration</Title>
          <Text type="secondary">SiyaBusa ERP Management Console</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Admin Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                height: 48,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              Access Platform Admin
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            This console is for authorized platform administrators only.
            <br />
            Unauthorized access attempts are logged.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default PlatformLogin;
