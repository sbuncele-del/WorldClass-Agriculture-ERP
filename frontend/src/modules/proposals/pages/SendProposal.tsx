import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Input,
  Form,
  Switch,
  message,
  Steps,
  Divider,
  Alert,
  Tag,
  Modal,
} from 'antd';
import {
  SendOutlined,
  MailOutlined,
  FilePdfOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  EyeOutlined,
  UserOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ProposalEmailTemplate from '../components/ProposalEmailTemplate';
import '../components/ProposalEmailTemplate.css';
import './SendProposal.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SendProposal: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [form] = Form.useForm();

  // Generate a unique access code
  const generateAccessCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const [accessCode] = useState(generateAccessCode());
  const portalUrl = `${window.location.origin}/portal/${id}`;

  // Sample proposal data
  const proposal = {
    id: id,
    title: 'Enterprise Digital Transformation',
    number: 'PROP-2024-0042',
    total: 99200,
    validUntil: 'January 15, 2025',
  };

  const [sendOptions, setSendOptions] = useState({
    sendEmail: true,
    attachPdf: true,
    includePortalLink: true,
    sendCopy: true,
  });

  const handleSend = async () => {
    try {
      await form.validateFields();
      setSending(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSent(true);
      message.success('Proposal sent successfully!');
    } catch (error) {
      message.error('Please fill in all required fields');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} copied to clipboard!`);
  };

  if (sent) {
    return (
      <div className="send-proposal-page">
        <Card className="success-card">
          <div className="success-content">
            <div className="success-icon">
              <CheckCircleOutlined />
            </div>
            <Title level={2}>Proposal Sent Successfully!</Title>
            <Paragraph>
              Your proposal has been sent to the client. They will receive an email
              with the access code to view their exclusive proposal portal.
            </Paragraph>

            <div className="sent-details">
              <div className="detail-row">
                <Text type="secondary">Recipient</Text>
                <Text strong>{form.getFieldValue('recipientEmail')}</Text>
              </div>
              <div className="detail-row">
                <Text type="secondary">Access Code</Text>
                <div className="code-display">
                  <code>{accessCode}</code>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(accessCode, 'Access code')}
                  />
                </div>
              </div>
              <div className="detail-row">
                <Text type="secondary">Portal Link</Text>
                <div className="link-display">
                  <Text copyable>{`${portalUrl}?code=${accessCode}`}</Text>
                </div>
              </div>
            </div>

            <div className="success-actions">
              <Button type="primary" size="large" onClick={() => navigate('/app/proposals/list')}>
                Back to Proposals
              </Button>
              <Button size="large" onClick={() => window.open(`${portalUrl}?code=${accessCode}`, '_blank')}>
                Preview Portal
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="send-proposal-page">
      <div className="page-header">
        <div>
          <Title level={2}>Send Proposal</Title>
          <Text type="secondary">
            Send {proposal.number} to your client with exclusive portal access
          </Text>
        </div>
        <Tag color="blue" className="proposal-tag">{proposal.number}</Tag>
      </div>

      <Row gutter={32}>
        {/* Left Column - Form */}
        <Col xs={24} lg={12}>
          <Card className="form-card">
            <Steps
              current={currentStep}
              size="small"
              items={[
                { title: 'Recipient' },
                { title: 'Options' },
                { title: 'Review' },
              ]}
              style={{ marginBottom: 32 }}
            />

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                recipientName: '',
                recipientCompany: '',
                recipientEmail: '',
                personalMessage: `Hi,\n\nI'm excited to share this proposal for your review. This has been tailored specifically for your needs.\n\nPlease use the access code in this email to view your personalized proposal portal where you can review all details and accept when ready.\n\nLooking forward to working together!`,
              }}
            >
              {currentStep === 0 && (
                <div className="step-content">
                  <Title level={4}>Recipient Details</Title>
                  <Form.Item
                    name="recipientName"
                    label="Contact Name"
                    rules={[{ required: true, message: 'Please enter recipient name' }]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="e.g., Michael Chen"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name="recipientCompany"
                    label="Company Name"
                    rules={[{ required: true, message: 'Please enter company name' }]}
                  >
                    <Input
                      prefix={<BuildOutlined />}
                      placeholder="e.g., Acme Corporation"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name="recipientEmail"
                    label="Email Address"
                    rules={[
                      { required: true, message: 'Please enter email' },
                      { type: 'email', message: 'Please enter a valid email' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="e.g., michael@acmecorp.com"
                      size="large"
                    />
                  </Form.Item>
                </div>
              )}

              {currentStep === 1 && (
                <div className="step-content">
                  <Title level={4}>Send Options</Title>
                  
                  <div className="option-item">
                    <div className="option-info">
                      <MailOutlined className="option-icon" />
                      <div>
                        <Text strong>Send Email</Text>
                        <Text type="secondary" className="option-desc">
                          Send professional email with access code
                        </Text>
                      </div>
                    </div>
                    <Switch
                      checked={sendOptions.sendEmail}
                      onChange={(checked) => setSendOptions({ ...sendOptions, sendEmail: checked })}
                    />
                  </div>

                  <div className="option-item">
                    <div className="option-info">
                      <FilePdfOutlined className="option-icon" />
                      <div>
                        <Text strong>Attach PDF</Text>
                        <Text type="secondary" className="option-desc">
                          Include downloadable PDF version
                        </Text>
                      </div>
                    </div>
                    <Switch
                      checked={sendOptions.attachPdf}
                      onChange={(checked) => setSendOptions({ ...sendOptions, attachPdf: checked })}
                    />
                  </div>

                  <div className="option-item">
                    <div className="option-info">
                      <LinkOutlined className="option-icon" />
                      <div>
                        <Text strong>Portal Link</Text>
                        <Text type="secondary" className="option-desc">
                          Include direct link to proposal portal
                        </Text>
                      </div>
                    </div>
                    <Switch
                      checked={sendOptions.includePortalLink}
                      onChange={(checked) => setSendOptions({ ...sendOptions, includePortalLink: checked })}
                    />
                  </div>

                  <div className="option-item">
                    <div className="option-info">
                      <UserOutlined className="option-icon" />
                      <div>
                        <Text strong>Send Me a Copy</Text>
                        <Text type="secondary" className="option-desc">
                          Receive a copy for your records
                        </Text>
                      </div>
                    </div>
                    <Switch
                      checked={sendOptions.sendCopy}
                      onChange={(checked) => setSendOptions({ ...sendOptions, sendCopy: checked })}
                    />
                  </div>

                  <Divider />

                  <Form.Item
                    name="personalMessage"
                    label="Personal Message (Optional)"
                  >
                    <TextArea
                      rows={6}
                      placeholder="Add a personal note to your client..."
                    />
                  </Form.Item>
                </div>
              )}

              {currentStep === 2 && (
                <div className="step-content">
                  <Title level={4}>Review & Send</Title>
                  
                  <Alert
                    message="Ready to Send"
                    description="Review the details below and click Send when ready."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />

                  <div className="review-section">
                    <div className="review-item">
                      <Text type="secondary">Proposal</Text>
                      <Text strong>{proposal.title}</Text>
                    </div>
                    <div className="review-item">
                      <Text type="secondary">Value</Text>
                      <Text strong>${proposal.total.toLocaleString()}</Text>
                    </div>
                    <div className="review-item">
                      <Text type="secondary">Recipient</Text>
                      <Text strong>
                        {form.getFieldValue('recipientName')} ({form.getFieldValue('recipientEmail')})
                      </Text>
                    </div>
                    <div className="review-item">
                      <Text type="secondary">Access Code</Text>
                      <div className="access-code-preview">
                        <code>{accessCode}</code>
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(accessCode, 'Access code')}
                        />
                      </div>
                    </div>
                    <div className="review-item">
                      <Text type="secondary">Portal URL</Text>
                      <Text copyable={{ text: `${portalUrl}?code=${accessCode}` }}>
                        {portalUrl}
                      </Text>
                    </div>
                  </div>

                  <div className="included-items">
                    <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
                      Will include:
                    </Text>
                    {sendOptions.sendEmail && (
                      <Tag icon={<MailOutlined />} color="blue">Professional Email</Tag>
                    )}
                    {sendOptions.attachPdf && (
                      <Tag icon={<FilePdfOutlined />} color="red">PDF Attachment</Tag>
                    )}
                    {sendOptions.includePortalLink && (
                      <Tag icon={<LinkOutlined />} color="purple">Portal Link</Tag>
                    )}
                    {sendOptions.sendCopy && (
                      <Tag icon={<UserOutlined />} color="green">Copy to You</Tag>
                    )}
                  </div>
                </div>
              )}
            </Form>

            <div className="form-actions">
              {currentStep > 0 && (
                <Button size="large" onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}
              {currentStep < 2 && (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    if (currentStep === 0) {
                      form.validateFields(['recipientName', 'recipientCompany', 'recipientEmail'])
                        .then(() => setCurrentStep(currentStep + 1))
                        .catch(() => {});
                    } else {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                >
                  Continue
                </Button>
              )}
              {currentStep === 2 && (
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={sending}
                >
                  Send Proposal
                </Button>
              )}
            </div>
          </Card>
        </Col>

        {/* Right Column - Email Preview */}
        <Col xs={24} lg={12}>
          <Card
            className="preview-card"
            title={
              <div className="preview-header">
                <EyeOutlined />
                <span>Email Preview</span>
              </div>
            }
            extra={
              <Button
                type="link"
                onClick={() => setPreviewVisible(true)}
              >
                Full Preview
              </Button>
            }
          >
            <div className="email-preview-wrapper">
              <ProposalEmailTemplate
                recipientName={form.getFieldValue('recipientName') || 'Client'}
                recipientCompany={form.getFieldValue('recipientCompany') || 'Company'}
                proposalTitle={proposal.title}
                proposalNumber={proposal.number}
                proposalValue={proposal.total}
                validUntil={proposal.validUntil}
                senderName="Sarah Mitchell"
                senderTitle="Senior Solutions Architect"
                senderEmail="sarah.mitchell@worldclass-erp.com"
                senderPhone="+1 (555) 987-6543"
                accessCode={accessCode}
                portalUrl={portalUrl}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Full Preview Modal */}
      <Modal
        title="Email Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={720}
        centered
      >
        <ProposalEmailTemplate
          recipientName={form.getFieldValue('recipientName') || 'Client'}
          recipientCompany={form.getFieldValue('recipientCompany') || 'Company'}
          proposalTitle={proposal.title}
          proposalNumber={proposal.number}
          proposalValue={proposal.total}
          validUntil={proposal.validUntil}
          senderName="Sarah Mitchell"
          senderTitle="Senior Solutions Architect"
          senderEmail="sarah.mitchell@worldclass-erp.com"
          senderPhone="+1 (555) 987-6543"
          accessCode={accessCode}
          portalUrl={portalUrl}
        />
      </Modal>
    </div>
  );
};

export default SendProposal;
