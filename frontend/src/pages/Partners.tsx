import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FooterPages.css';

const Partners: React.FC = () => {
  const partnerTypes = [
    {
      type: 'Technology Partners',
      icon: '🔧',
      description: 'Integrate your software with SiyaBusa to create seamless workflows for shared customers.',
      benefits: [
        'API access and technical documentation',
        'Co-marketing opportunities',
        'Joint customer success initiatives',
        'Partner portal access',
      ]
    },
    {
      type: 'Implementation Partners',
      icon: '🛠️',
      description: 'Help businesses implement and customize SiyaBusa while growing your consulting practice.',
      benefits: [
        'Implementation certification training',
        'Lead referrals from our sales team',
        'Commission on referred subscriptions',
        'Technical support for partner projects',
      ]
    },
    {
      type: 'Reseller Partners',
      icon: '🤝',
      description: 'Sell SiyaBusa to your client base and earn recurring revenue on subscriptions.',
      benefits: [
        'Competitive partner pricing',
        'Sales and product training',
        'Marketing materials and collateral',
        'Dedicated partner account manager',
      ]
    },
    {
      type: 'Accounting Firms',
      icon: '📊',
      description: 'Recommend SiyaBusa to your clients and benefit from streamlined collaboration.',
      benefits: [
        'Free accountant portal access',
        'Multi-client management dashboard',
        'Referral commissions',
        'Priority support for client issues',
      ]
    },
  ];

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
            <h1>Partner Program</h1>
            <p className="subtitle">Grow your business with SiyaBusa</p>
          </header>

          <section className="content-section">
            <h2>Why Partner With Us?</h2>
            <p>
              The SiyaBusa Partner Program is designed to help you grow your business while 
              delivering exceptional value to your clients. Whether you're a technology company, 
              consulting firm, or accounting practice, we have a partnership model that fits 
              your business.
            </p>

            <div className="partner-stats">
              <div className="stat">
                <span className="stat-number">200+</span>
                <span className="stat-label">Active Partners</span>
              </div>
              <div className="stat">
                <span className="stat-number">95%</span>
                <span className="stat-label">Partner Satisfaction</span>
              </div>
              <div className="stat">
                <span className="stat-number">30%</span>
                <span className="stat-label">Avg. Revenue Growth</span>
              </div>
            </div>
          </section>

          <section className="content-section">
            <h2>Partnership Types</h2>
            <div className="partner-types">
              {partnerTypes.map((partner, index) => (
                <div key={index} className="partner-type-card">
                  <div className="partner-icon">{partner.icon}</div>
                  <h3>{partner.type}</h3>
                  <p>{partner.description}</p>
                  <h4>Benefits:</h4>
                  <ul>
                    {partner.benefits.map((benefit, i) => (
                      <li key={i}>✓ {benefit}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="content-section">
            <h2>Partner Tiers</h2>
            <div className="tier-table">
              <div className="tier registered">
                <h3>Registered</h3>
                <p>Starting tier for new partners</p>
                <ul>
                  <li>Partner portal access</li>
                  <li>Basic training materials</li>
                  <li>10% referral commission</li>
                </ul>
              </div>
              <div className="tier silver">
                <h3>Silver</h3>
                <p>For established partners</p>
                <ul>
                  <li>All Registered benefits</li>
                  <li>Co-marketing funds</li>
                  <li>15% referral commission</li>
                  <li>Lead sharing</li>
                </ul>
              </div>
              <div className="tier gold">
                <h3>Gold</h3>
                <p>Top-performing partners</p>
                <ul>
                  <li>All Silver benefits</li>
                  <li>Dedicated partner manager</li>
                  <li>20% referral commission</li>
                  <li>Priority support</li>
                  <li>Conference invitations</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="content-section">
            <h2>Success Stories</h2>
            <div className="partner-testimonials">
              <blockquote className="testimonial">
                <p>
                  "Partnering with SiyaBusa has transformed our consulting practice. We've 
                  increased revenue by 40% and our clients love the integrated solution."
                </p>
                <cite>— Partner, Johannesburg Consulting Firm</cite>
              </blockquote>
              <blockquote className="testimonial">
                <p>
                  "The partner program is genuinely collaborative. The team treats us as 
                  true partners, not just resellers."
                </p>
                <cite>— Partner, Cape Town Accounting Practice</cite>
              </blockquote>
            </div>
          </section>

          <section className="content-section cta-section">
            <h2>Ready to Partner?</h2>
            <p>
              Join our growing partner ecosystem and help businesses across Africa 
              transform their operations.
            </p>
            <div className="cta-buttons">
              <a href="mailto:partners@siyabusa.co.za?subject=Partnership Inquiry" className="btn-primary">
                Apply Now
              </a>
              <a href="mailto:partners@siyabusa.co.za" className="btn-secondary">
                Contact Partner Team
              </a>
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

export default Partners;
