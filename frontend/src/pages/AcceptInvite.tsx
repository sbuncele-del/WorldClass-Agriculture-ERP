/**
 * AcceptInvite - Accept team invitation and set password
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert, Space, Result } from 'antd';
import { LockOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';
import apiClient from '../services/api';
import './Login.css';

const { Title, Text, Paragraph } = Typography;

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('');
  const [form] = Form.useForm();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please check your email for the correct link.');
    }
  }, [token]);

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/auth/accept-invite', {
        token,
        password: values.password
      });

      if (response.data.success) {
        setSuccess(true);
        setTenantName(response.data.tenant?.name || 'your organization');
      } else {
        setError(response.data.message || 'Failed to activate account');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate account. The invitation may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-container">
          <Card className="login-card">
            <Result
              status="success"
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              title="Account Activated!"
              subTitle={`Welcome to ${tenantName}. Your account is now ready to use.`}
              extra={[
                <Button type="primary" key="login" onClick={() => navigate('/login')}>
                  Sign In Now
                </Button>
              ]}
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <Card className="login-card">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <TeamOutlined style={{ fontSize: 32, color: 'white' }} />
            </div>
            <Title level={3} style={{ margin: 0 }}>Accept Invitation</Title>
            <Paragraph type="secondary">
              Set your password to complete your account setup
            </Paragraph>
          </div>

          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              style={{ marginBottom: 24 }} 
              closable
              onClose={() => setError(null)}
            />
          )}

          {!token ? (
            <Alert
              message="Invalid Invitation"
              description="This invitation link is invalid or has expired. Please contact your administrator for a new invitation."
              type="error"
              showIcon
            />
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
            >
              <Form.Item
                name="password"
                label="Create Password"
                rules={[
                  { required: true, message: 'Please create a password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase and number'
                  }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Create a strong password"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirm your password"
                  size="large"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                >
                  Activate Account
                </Button>
              </Form.Item>
            </Form>
          )}

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Space>
              <Text type="secondary">Already have an account?</Text>
              <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0 }}>
                Sign In
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AcceptInvite;
