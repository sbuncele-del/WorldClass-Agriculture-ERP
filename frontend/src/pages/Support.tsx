import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FooterPages.css';

const Support: React.FC = () => {
  return (
    <div className="footer-page">
      <nav className="footer-page-nav">
        <Link to="/" className="logo">
          <span className="logo-icon">◈</span>
          <span>SiyaBusa</span>
        </Link>
        <Link to="/" className="back-link">← Back to Home</Link>
      </nav>

      <main className="footer-page-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <header className="page-header">
            <h1>Support Center</h1>
            <p className="subtitle">We're here to help you succeed</p>
          </header>

          <section className="content-section">
            <div className="support-options">
              <div className="support-card primary">
                <div className="support-icon">💬</div>
                <h2>Live Chat</h2>
                <p>Get instant help from our support team during business hours.</p>
                <p className="availability">Mon-Fri, 8:00 - 17:00 SAST</p>
                <button className="btn-primary">Start Chat</button>
              </div>

              <div className="support-card">
                <div className="support-icon">📧</div>
                <h2>Email Support</h2>
                <p>Send us a detailed message and we'll respond within 24 hours.</p>
                <a href="mailto:support@siyabusa.co.za" className="btn-secondary">
                  support@siyabusa.co.za
                </a>
              </div>

              <div className="support-card">
                <div className="support-icon">📚</div>
                <h2>Documentation</h2>
                <p>Browse our comprehensive guides, tutorials, and FAQs.</p>
                <Link to="/documentation" className="btn-secondary">
                  Browse Docs
                </Link>
              </div>

              <div className="support-card">
                <div className="support-icon">🎓</div>
                <h2>Training</h2>
                <p>Schedule a training session for you and your team.</p>
                <a href="mailto:training@siyabusa.co.za" className="btn-secondary">
                  Request Training
                </a>
              </div>
            </div>
          </section>

          <section className="content-section">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
              <details className="faq-item">
                <summary>How do I reset my password?</summary>
                <p>
                  Click "Forgot Password" on the login page and enter your email address. 
                  You'll receive a password reset link within a few minutes. If you don't 
                  receive the email, check your spam folder or contact support.
                </p>
              </details>

              <details className="faq-item">
                <summary>Can I import data from my existing system?</summary>
                <p>
                  Yes! SiyaBusa supports importing data from Excel, CSV files, and many 
                  popular accounting systems. Our implementation team can assist with 
                  complex migrations. Contact us to discuss your specific requirements.
                </p>
              </details>

              <details className="faq-item">
                <summary>What payment methods do you accept?</summary>
                <p>
                  We accept credit cards, debit cards, and EFT (bank transfer) for South 
                  African customers. Enterprise customers can request invoicing with 
                  payment terms.
                </p>
              </details>

              <details className="faq-item">
                <summary>Is my data backed up?</summary>
                <p>
                  Yes, we perform automated daily backups of all customer data. Backups 
                  are encrypted and stored in geographically separate locations. We 
                  retain backups for 30 days, and enterprise customers can request 
                  longer retention periods.
                </p>
              </details>

              <details className="faq-item">
                <summary>Can I cancel my subscription?</summary>
                <p>
                  You can cancel your subscription at any time from your account settings. 
                  Your access continues until the end of your current billing period. 
                  You can export your data within 30 days of cancellation.
                </p>
              </details>

              <details className="faq-item">
                <summary>How do I add more users?</summary>
                <p>
                  Account administrators can add users from the Settings → User Management 
                  section. Additional users may incur extra charges depending on your 
                  subscription plan. Each user receives their own login credentials.
                </p>
              </details>

              <details className="faq-item">
                <summary>Do you offer implementation assistance?</summary>
                <p>
                  Yes, we offer implementation packages to help you get started quickly. 
                  Our team will help configure the system, import your data, and train 
                  your staff. Contact sales for a custom quote.
                </p>
              </details>

              <details className="faq-item">
                <summary>What browsers are supported?</summary>
                <p>
                  SiyaBusa works best on the latest versions of Chrome, Firefox, Safari, 
                  and Edge. We recommend using Chrome for the best experience. Internet 
                  Explorer is not supported.
                </p>
              </details>
            </div>
          </section>

          <section className="content-section">
            <h2>Support Plans</h2>
            <div className="support-plans">
              <div className="plan-card">
                <h3>Standard</h3>
                <p className="plan-included">Included with all plans</p>
                <ul>
                  <li>✓ Email support (24-hour response)</li>
                  <li>✓ Documentation access</li>
                  <li>✓ Community forums</li>
                  <li>✓ System status updates</li>
                </ul>
              </div>

              <div className="plan-card featured">
                <h3>Priority</h3>
                <p className="plan-price">From R2,500/month</p>
                <ul>
                  <li>✓ Everything in Standard</li>
                  <li>✓ Live chat support</li>
                  <li>✓ 4-hour response time</li>
                  <li>✓ Phone support</li>
                  <li>✓ Quarterly business reviews</li>
                </ul>
              </div>

              <div className="plan-card">
                <h3>Enterprise</h3>
                <p className="plan-price">Custom pricing</p>
                <ul>
                  <li>✓ Everything in Priority</li>
                  <li>✓ Dedicated account manager</li>
                  <li>✓ 1-hour response time</li>
                  <li>✓ 24/7 emergency support</li>
                  <li>✓ On-site training</li>
                  <li>✓ Custom SLA</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="content-section">
            <h2>System Status</h2>
            <div className="status-box operational">
              <div className="status-indicator"></div>
              <span>All Systems Operational</span>
            </div>
            <p className="status-link">
              <a href="#" target="_blank" rel="noopener noreferrer">
                View detailed status page →
              </a>
            </p>
          </section>

          <section className="content-section cta-section">
            <h2>Still Need Help?</h2>
            <p>Our team is ready to assist you with any questions or issues.</p>
            <div className="cta-buttons">
              <a href="mailto:support@siyabusa.co.za" className="btn-primary">Email Support</a>
              <Link to="/contact" className="btn-secondary">Contact Us</Link>
            </div>
          </section>
        </motion.div>
      </main>

      <footer className="footer-page-footer">
        <p>© {new Date().getFullYear()} SiyaBusa by Masaphokati Technologies (Pty) Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Support;
