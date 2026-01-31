import React from 'react';
import './ProposalEmailTemplate.css';

interface ProposalEmailTemplateProps {
  recipientName: string;
  recipientCompany: string;
  proposalTitle: string;
  proposalNumber: string;
  proposalValue: number;
  validUntil: string;
  senderName: string;
  senderTitle: string;
  senderEmail: string;
  senderPhone: string;
  accessCode: string;
  portalUrl: string;
}

const ProposalEmailTemplate: React.FC<ProposalEmailTemplateProps> = ({
  recipientName = 'Michael',
  recipientCompany = 'Acme Corporation',
  proposalTitle = 'Enterprise Digital Transformation',
  proposalNumber = 'PROP-2024-0042',
  proposalValue = 99200,
  validUntil = 'January 15, 2025',
  senderName = 'Sarah Mitchell',
  senderTitle = 'Senior Solutions Architect',
  senderEmail = 'sarah.mitchell@worldclass-erp.com',
  senderPhone = '+1 (555) 987-6543',
  accessCode = 'WC2024',
  portalUrl = 'https://app.worldclass-erp.com/portal/1',
}) => {
  return (
    <div className="email-preview-container">
      <div className="email-preview-header">
        <span>Email Preview</span>
        <div className="email-meta">
          <span>To: {recipientName.toLowerCase()}@{recipientCompany.toLowerCase().replace(/\s/g, '')}.com</span>
          <span>Subject: Your Exclusive Proposal from WorldClass ERP - {proposalNumber}</span>
        </div>
      </div>
      
      <div className="email-template">
        {/* Email Header */}
        <div className="email-header">
          <div className="email-logo">W</div>
          <span>WorldClass ERP</span>
        </div>

        {/* Hero Section */}
        <div className="email-hero">
          <div className="exclusive-tag">✨ Prepared Exclusively For You</div>
          <h1>Your Proposal is Ready</h1>
          <p>Hi {recipientName}, we've prepared something special for {recipientCompany}.</p>
        </div>

        {/* Proposal Summary Card */}
        <div className="proposal-summary-card">
          <div className="summary-header">
            <span className="proposal-badge">{proposalNumber}</span>
          </div>
          <h2>{proposalTitle}</h2>
          <div className="proposal-details">
            <div className="detail-item">
              <span className="label">Total Investment</span>
              <span className="value">${proposalValue.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Valid Until</span>
              <span className="value highlight">{validUntil}</span>
            </div>
          </div>
        </div>

        {/* Access Code Section */}
        <div className="access-section">
          <h3>Your Exclusive Access</h3>
          <p>Use this code to view your personalized proposal portal:</p>
          <div className="access-code-box">
            <span className="code">{accessCode}</span>
          </div>
          <a href={`${portalUrl}?code=${accessCode}`} className="view-proposal-btn">
            View Your Proposal →
          </a>
          <p className="direct-link">
            Or visit: <a href={portalUrl}>{portalUrl}</a>
          </p>
        </div>

        {/* What's Included Preview */}
        <div className="included-preview">
          <h3>What's Included</h3>
          <div className="included-items">
            <div className="included-item">
              <span className="check">✓</span>
              <span>Full Enterprise Implementation</span>
            </div>
            <div className="included-item">
              <span className="check">✓</span>
              <span>Comprehensive Training Program</span>
            </div>
            <div className="included-item">
              <span className="check">✓</span>
              <span>24/7 Premium Support</span>
            </div>
            <div className="included-item">
              <span className="check">✓</span>
              <span>60-Day Money-Back Guarantee</span>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <div className="contact-avatar">{senderName[0]}</div>
          <div className="contact-info">
            <h4>Questions? I'm here to help.</h4>
            <p className="contact-name">{senderName}</p>
            <p className="contact-title">{senderTitle}</p>
            <div className="contact-details">
              <a href={`mailto:${senderEmail}`}>{senderEmail}</a>
              <span>•</span>
              <a href={`tel:${senderPhone}`}>{senderPhone}</a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="email-footer">
          <div className="footer-logo">W</div>
          <p>WorldClass ERP - Enterprise Solutions</p>
          <div className="footer-links">
            <a href="#">Website</a>
            <span>•</span>
            <a href="#">Privacy</a>
            <span>•</span>
            <a href="#">Unsubscribe</a>
          </div>
          <p className="copyright">© 2024 WorldClass ERP. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ProposalEmailTemplate;
