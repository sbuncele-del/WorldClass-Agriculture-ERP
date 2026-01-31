import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FooterPages.css';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

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
            <h1>Contact Us</h1>
            <p className="subtitle">We'd love to hear from you</p>
          </header>

          <div className="contact-grid">
            <section className="contact-info">
              <h2>Get in Touch</h2>
              <p>
                Have questions about SiyaBusa? Want to schedule a demo? Our team is here to help.
              </p>

              <div className="contact-methods">
                <div className="contact-method">
                  <div className="contact-icon">📧</div>
                  <div>
                    <h3>General Inquiries</h3>
                    <a href="mailto:hello@siyabusa.co.za">hello@siyabusa.co.za</a>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="contact-icon">💼</div>
                  <div>
                    <h3>Sales</h3>
                    <a href="mailto:sales@siyabusa.co.za">sales@siyabusa.co.za</a>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="contact-icon">🛠️</div>
                  <div>
                    <h3>Support</h3>
                    <a href="mailto:support@siyabusa.co.za">support@siyabusa.co.za</a>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="contact-icon">📍</div>
                  <div>
                    <h3>Office</h3>
                    <p>Centurion, Gauteng<br />South Africa</p>
                  </div>
                </div>
              </div>

              <div className="company-info-box">
                <h3>Masaphokati Technologies (Pty) Ltd</h3>
                <p>
                  The company behind SiyaBusa, dedicated to transforming how African 
                  businesses manage their operations.
                </p>
              </div>
            </section>

            <section className="contact-form-section">
              {submitted ? (
                <div className="form-success">
                  <div className="success-icon">✓</div>
                  <h2>Message Sent!</h2>
                  <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  <button onClick={() => setSubmitted(false)} className="btn-secondary">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2>Send us a Message</h2>
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company">Company</label>
                      <input
                        type="text"
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">Subject *</label>
                      <select
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        required
                      >
                        <option value="">Select a topic</option>
                        <option value="demo">Request a Demo</option>
                        <option value="pricing">Pricing Information</option>
                        <option value="support">Technical Support</option>
                        <option value="partnership">Partnership Inquiry</option>
                        <option value="media">Media & Press</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Message *</label>
                      <textarea
                        id="message"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                      />
                    </div>

                    <button type="submit" className="btn-primary">
                      Send Message
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </motion.div>
      </main>

      <footer className="footer-page-footer">
        <p>© {new Date().getFullYear()} SiyaBusa by Masaphokati Technologies (Pty) Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Contact;
