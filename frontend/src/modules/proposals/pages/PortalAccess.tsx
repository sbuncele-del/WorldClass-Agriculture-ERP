import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Input, Button, message } from 'antd';
import { LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import './PortalAccess.css';

const PortalAccess: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Check if access code is in URL
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      // Auto-verify if code is in URL
      verifyCode(codeFromUrl);
    } else {
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyCode = async (code: string) => {
    setLoading(true);
    
    // Simulate API verification - in production, verify against backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo: accept any 6-character code or specific demo codes
    const validCodes = ['DEMO24', 'WC2024', 'EXCL99', code.toUpperCase()];
    
    if (code.length >= 4 && validCodes.includes(code.toUpperCase())) {
      // Store access in session
      sessionStorage.setItem(`proposal_access_${id}`, code);
      // Navigate to the actual portal
      navigate(`/portal/${id}/view`);
    } else {
      message.error('Invalid access code. Please check your email and try again.');
      setVerifying(false);
    }
    setLoading(false);
  };

  const handleSubmit = () => {
    if (!accessCode.trim()) {
      message.warning('Please enter your access code');
      return;
    }
    verifyCode(accessCode);
  };

  if (verifying) {
    return (
      <div className="portal-access">
        <div className="access-card">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Verifying your access...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-access">
      <div className="access-card">
        <div className="brand-section">
          <div className="brand-logo">W</div>
          <h1>WorldClass ERP</h1>
          <span>Exclusive Proposal Portal</span>
        </div>

        <div className="access-content">
          <div className="lock-icon">
            <LockOutlined />
          </div>
          <h2>Enter Your Access Code</h2>
          <p>
            Please enter the 6-digit access code from your email to view 
            your exclusive proposal.
          </p>

          <div className="code-input-section">
            <Input
              size="large"
              placeholder="Enter access code (e.g., WC2024)"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              onPressEnter={handleSubmit}
              maxLength={6}
              className="code-input"
            />
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={loading}
              icon={<ArrowRightOutlined />}
              className="access-button"
            >
              View Proposal
            </Button>
          </div>

          <div className="help-text">
            <p>
              Can't find your code? Check your spam folder or{' '}
              <a href="mailto:proposals@worldclass-erp.com">contact us</a>.
            </p>
          </div>
        </div>

        <div className="security-notice">
          <LockOutlined />
          <span>Secure & encrypted connection</span>
        </div>
      </div>
    </div>
  );
};

export default PortalAccess;
