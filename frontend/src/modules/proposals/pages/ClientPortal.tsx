import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Button,
  Typography,
  Table,
  Input,
  message,
  Modal,
  Checkbox,
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  StarOutlined,
  RocketOutlined,
  CustomerServiceOutlined,
  LockOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import './ClientPortal.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ClientPortal: React.FC = () => {
  const { id } = useParams();
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Sample proposal data (would be fetched based on ID)
  const proposal = {
    id: '1',
    title: 'Enterprise Digital Transformation',
    number: 'PROP-2024-0042',
    status: 'sent',
    company: {
      name: 'WorldClass ERP',
      contact: 'Sarah Mitchell',
      title: 'Senior Solutions Architect',
      email: 'sarah.mitchell@worldclass-erp.com',
      phone: '+1 (555) 987-6543',
    },
    validUntil: '2025-01-15',
    createdAt: '2024-12-11',
    originalValue: 125000,
    discount: 25800,
    lineItems: [
      {
        key: '1',
        name: 'Enterprise Implementation Suite',
        description: 'Complete end-to-end system deployment with custom integrations, data migration, and security hardening',
        quantity: 1,
        unitPrice: 65000,
        total: 65000,
      },
      {
        key: '2',
        name: 'Executive Training Program',
        description: 'Comprehensive 10-day immersive training including leadership workshops and certification',
        quantity: 1,
        unitPrice: 15000,
        total: 15000,
      },
      {
        key: '3',
        name: 'Premium Support & Success Package',
        description: '24/7 dedicated support, quarterly business reviews, and priority feature requests',
        quantity: 1,
        unitPrice: 24000,
        total: 24000,
      },
    ],
    subtotal: 104000,
    tax: 0,
    total: 99200,
    savings: 25800,
    terms: [
      'Exclusive pricing valid for 30 days from proposal date',
      'Flexible payment: 40% upfront, 40% at milestone, 20% upon go-live',
      'Includes 90-day post-implementation support at no extra cost',
      'Money-back guarantee if not satisfied within first 60 days',
      'Free upgrades and new features for the first 12 months',
    ],
    included: [
      { icon: <RocketOutlined />, title: 'Fast-Track Deployment', desc: 'Go live in 8 weeks or less' },
      { icon: <TeamOutlined />, title: 'Dedicated Success Team', desc: '3 experts assigned to your account' },
      { icon: <CustomerServiceOutlined />, title: '24/7 Priority Support', desc: '15-minute response guarantee' },
      { icon: <LockOutlined />, title: 'Enterprise Security', desc: 'SOC 2 Type II certified' },
      { icon: <GlobalOutlined />, title: 'Global Infrastructure', desc: '99.99% uptime SLA' },
      { icon: <ThunderboltOutlined />, title: 'AI-Powered Insights', desc: 'Predictive analytics included' },
    ],
  };

  // Countdown timer
  useEffect(() => {
    const targetDate = new Date(proposal.validUntil).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [proposal.validUntil]);

  const handleAccept = () => {
    message.success({
      content: 'Congratulations! Your proposal has been accepted. Our team will contact you within 24 hours.',
      duration: 5,
      style: { marginTop: '20vh' },
    });
    setAcceptModalVisible(false);
    setAccepted(true);
  };

  const handleQuestion = () => {
    message.success('Your question has been sent. We typically respond within 2 hours.');
    setQuestionModalVisible(false);
  };

  // Success State
  if (accepted) {
    return (
      <div className="success-portal">
        <div className="success-card">
          <div className="success-icon">
            <CheckCircleOutlined />
          </div>
          <h2>Welcome Aboard!</h2>
          <p>
            Thank you for accepting proposal <strong>{proposal.number}</strong>. 
            Your dedicated success team has been notified and will reach out within 24 hours 
            to begin your transformation journey.
          </p>
          <div className="success-actions">
            <Button type="primary" size="large" icon={<DownloadOutlined />}>
              Download Signed Agreement
            </Button>
            <Button size="large">
              Schedule Kickoff Call
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-portal">
      {/* Premium Header */}
      <div className="portal-header">
        <div className="company-brand">
          <div className="brand-logo">W</div>
          <div className="brand-text">
            <h2>WorldClass ERP</h2>
            <span>Enterprise Solutions</span>
          </div>
        </div>
        <div className="portal-meta">
          <span className="proposal-badge">Exclusive Proposal</span>
          <span className="proposal-number">{proposal.number}</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="proposal-hero">
        <div className="exclusive-badge">
          <StarOutlined /> Prepared Exclusively For You
        </div>
        <h1>{proposal.title}</h1>
        <p className="subtitle">
          A comprehensive solution designed to revolutionize your operations, 
          reduce costs by up to 40%, and accelerate growth.
        </p>
        
        {/* Progress Timeline */}
        <div className="progress-timeline">
          <div className="timeline-step completed">
            <div className="step-icon"><FileTextOutlined /></div>
            <span className="step-label">Prepared</span>
          </div>
          <div className="timeline-step current">
            <div className="step-icon"><CheckCircleOutlined /></div>
            <span className="step-label">Reviewing</span>
          </div>
          <div className="timeline-step pending">
            <div className="step-icon"><TrophyOutlined /></div>
            <span className="step-label">Accepted</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="portal-content">
        <Row gutter={32}>
          {/* Left Column - Details */}
          <Col xs={24} lg={16}>
            <div className="premium-card">
              {/* Validity Banner */}
              <div className="validity-banner">
                <ClockCircleOutlined />
                <span>
                  This exclusive offer expires on <strong>{dayjs(proposal.validUntil).format('MMMM D, YYYY')}</strong>
                </span>
                <div className="countdown-timer">
                  <div className="countdown-unit">
                    <span className="countdown-value">{countdown.days}</span>
                    <span className="countdown-label">Days</span>
                  </div>
                  <div className="countdown-unit">
                    <span className="countdown-value">{countdown.hours}</span>
                    <span className="countdown-label">Hours</span>
                  </div>
                  <div className="countdown-unit">
                    <span className="countdown-value">{countdown.minutes}</span>
                    <span className="countdown-label">Mins</span>
                  </div>
                </div>
              </div>

              {/* Investment Section */}
              <div className="investment-section">
                <div className="section-header">
                  <h3>Your Investment</h3>
                  <div className="savings-badge">
                    <TrophyOutlined /> Save ${proposal.savings.toLocaleString()}
                  </div>
                </div>

                <Table
                  className="premium-table"
                  dataSource={proposal.lineItems}
                  rowKey="key"
                  pagination={false}
                  columns={[
                    {
                      title: 'Solution',
                      key: 'description',
                      render: (_, record) => (
                        <div>
                          <div className="item-name">{record.name}</div>
                          <div className="item-description">{record.description}</div>
                        </div>
                      ),
                    },
                    {
                      title: 'Value',
                      dataIndex: 'total',
                      key: 'total',
                      width: 140,
                      align: 'right' as const,
                      render: (v) => <span className="item-price">${v.toLocaleString()}</span>,
                    },
                  ]}
                />

                <div className="pricing-summary">
                  <div className="summary-row">
                    <span>Original Value</span>
                    <span className="value" style={{ textDecoration: 'line-through', opacity: 0.5 }}>
                      ${proposal.originalValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Exclusive Discount</span>
                    <span className="value" style={{ color: '#34d399' }}>
                      -${proposal.savings.toLocaleString()}
                    </span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Investment</span>
                    <span className="total-value">${proposal.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="included-section">
                <h3>Everything Included</h3>
                <div className="included-grid">
                  {proposal.included.map((item, index) => (
                    <div key={index} className="included-item">
                      <div className="included-icon">{item.icon}</div>
                      <div className="included-content">
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantee Section */}
              <div className="guarantee-section">
                <div className="guarantee-badge">
                  <SafetyCertificateOutlined />
                </div>
                <div className="guarantee-content">
                  <h4>60-Day Money-Back Guarantee</h4>
                  <p>
                    We're so confident you'll love our solution that we offer a full refund 
                    if you're not completely satisfied within the first 60 days. No questions asked.
                  </p>
                </div>
              </div>

              {/* Terms Section */}
              <div className="terms-section">
                <h3>Terms & Commitments</h3>
                <ul className="terms-list">
                  {proposal.terms.map((term, index) => (
                    <li key={index}>{term}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Col>

          {/* Right Column - Sidebar */}
          <Col xs={24} lg={8}>
            <div className="portal-sidebar">
              {/* CTA Card */}
              <div className="cta-card">
                <h3>Ready to Transform?</h3>
                <p>Secure this exclusive offer and join 500+ successful enterprises.</p>
                <Button 
                  className="cta-button"
                  onClick={() => setAcceptModalVisible(true)}
                >
                  <CheckCircleOutlined /> Accept Proposal
                </Button>
                <Button 
                  className="secondary-button"
                  icon={<DownloadOutlined />}
                >
                  Download PDF
                </Button>
              </div>

              {/* Trust Card */}
              <div className="trust-card">
                <h4>Why Companies Choose Us</h4>
                <div className="trust-items">
                  <div className="trust-item">
                    <div className="trust-icon"><TeamOutlined /></div>
                    <div className="trust-content">
                      <span>500+ Enterprise Clients</span>
                      <small>Across 40 countries worldwide</small>
                    </div>
                  </div>
                  <div className="trust-item">
                    <div className="trust-icon"><StarOutlined /></div>
                    <div className="trust-content">
                      <span>98% Customer Satisfaction</span>
                      <small>Based on 2,000+ reviews</small>
                    </div>
                  </div>
                  <div className="trust-item">
                    <div className="trust-icon"><TrophyOutlined /></div>
                    <div className="trust-content">
                      <span>Award-Winning Platform</span>
                      <small>Gartner & Forrester recognized</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="contact-card">
                <h4>Your Dedicated Contact</h4>
                <div className="contact-person">
                  <div className="contact-avatar">{proposal.company.contact[0]}</div>
                  <div className="contact-details">
                    <h5>{proposal.company.contact}</h5>
                    <span>{proposal.company.title}</span>
                  </div>
                </div>
                <div className="contact-info">
                  <div className="contact-row">
                    <span className="label">Email</span>
                    <span className="value">{proposal.company.email}</span>
                  </div>
                  <div className="contact-row">
                    <span className="label">Direct Line</span>
                    <span className="value">{proposal.company.phone}</span>
                  </div>
                </div>
                <Button 
                  className="question-button"
                  icon={<QuestionCircleOutlined />}
                  onClick={() => setQuestionModalVisible(true)}
                >
                  Ask a Question
                </Button>
              </div>

              {/* Testimonial */}
              <div className="testimonial-card">
                <p className="testimonial-quote">
                  WorldClass ERP transformed our operations completely. We saw 35% cost reduction 
                  in the first quarter alone. The implementation team was exceptional.
                </p>
                <div className="testimonial-author">
                  <div className="contact-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>M</div>
                  <div className="author-info">
                    <strong>Michael Chen</strong>
                    <span>CFO, TechCorp Industries</span>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Accept Modal */}
      <Modal
        title="Accept Proposal"
        open={acceptModalVisible}
        onCancel={() => setAcceptModalVisible(false)}
        className="premium-modal"
        footer={[
          <Button key="cancel" onClick={() => setAcceptModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="accept" 
            type="primary"
            size="large"
            disabled={!termsAccepted}
            onClick={handleAccept}
            style={{ background: '#6366f1', borderColor: '#6366f1' }}
          >
            Accept & Sign Agreement
          </Button>,
        ]}
        width={520}
      >
        <div className="accept-content">
          <p>
            By accepting this proposal, you're securing exclusive pricing and priority 
            implementation scheduling. A signed copy will be sent to your email immediately.
          </p>
          
          <div className="signature-section">
            <label>Your Digital Signature</label>
            <Input 
              placeholder="Type your full legal name" 
              size="large"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                borderColor: 'rgba(255,255,255,0.15)',
                color: '#fff'
              }}
            />
          </div>

          <div className="terms-checkbox">
            <Checkbox 
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            >
              I have reviewed and accept the terms, conditions, and pricing outlined in this proposal
            </Checkbox>
          </div>
        </div>
      </Modal>

      {/* Question Modal */}
      <Modal
        title="Ask a Question"
        open={questionModalVisible}
        onCancel={() => setQuestionModalVisible(false)}
        className="premium-modal"
        footer={[
          <Button key="cancel" onClick={() => setQuestionModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="send" type="primary" onClick={handleQuestion} style={{ background: '#6366f1', borderColor: '#6366f1' }}>
            Send Question
          </Button>,
        ]}
        width={520}
      >
        <div className="question-content">
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>
            Have a question? Our team typically responds within 2 hours during business hours.
          </p>
          <TextArea 
            rows={5} 
            placeholder="Type your question here..."
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderColor: 'rgba(255,255,255,0.15)',
              color: '#fff'
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ClientPortal;
