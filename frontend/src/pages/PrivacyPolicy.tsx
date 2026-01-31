import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FooterPages.css';

const PrivacyPolicy: React.FC = () => {
  const lastUpdated = 'December 9, 2025';

  return (
    <div className="footer-page legal-page">
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
            <h1>Privacy Policy</h1>
            <p className="subtitle">Last Updated: {lastUpdated}</p>
          </header>

          <div className="legal-content">
            <section className="legal-section">
              <h2>1. Introduction</h2>
              <p>
                Masaphokati Technologies (Pty) Ltd ("we", "us", "our", or "Masaphokati Technologies"), 
                operating under the brand SiyaBusa, is committed to protecting your personal information 
                and respecting your privacy. This Privacy Policy explains how we collect, use, store, 
                and protect your personal information in accordance with the Protection of Personal 
                Information Act 4 of 2013 ("POPIA") and other applicable South African legislation.
              </p>
              <p>
                By using our services, website, or platform, you acknowledge that you have read, 
                understood, and agree to be bound by this Privacy Policy.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Responsible Party</h2>
              <p>For the purposes of POPIA, the responsible party is:</p>
              <div className="info-block">
                <p><strong>Company:</strong> Masaphokati Technologies (Pty) Ltd</p>
                <p><strong>Trading As:</strong> SiyaBusa</p>
                <p><strong>Address:</strong> Centurion, Gauteng, South Africa</p>
                <p><strong>Email:</strong> privacy@siyabusa.co.za</p>
                <p><strong>Information Officer:</strong> Sibusiso Mavuso</p>
              </div>
            </section>

            <section className="legal-section">
              <h2>3. Personal Information We Collect</h2>
              <p>We collect and process the following categories of personal information:</p>
              
              <h3>3.1 Information You Provide Directly</h3>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, phone number, company name, job title, and password</li>
                <li><strong>Business Information:</strong> Company registration details, VAT numbers, banking details, and business addresses</li>
                <li><strong>Financial Data:</strong> Transaction records, invoices, payment information, and accounting data you enter into our platform</li>
                <li><strong>Communication Data:</strong> Correspondence with our support team, feedback, and survey responses</li>
                <li><strong>Employment Data:</strong> For HR module users—employee records, payroll information, leave records, and performance data</li>
              </ul>

              <h3>3.2 Information Collected Automatically</h3>
              <ul>
                <li><strong>Usage Data:</strong> How you interact with our platform, features used, time spent, and actions taken</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
                <li><strong>Log Data:</strong> Access times, pages viewed, referring URLs, and system activity</li>
                <li><strong>Cookies:</strong> Session cookies, preference cookies, and analytics cookies (see Section 9)</li>
              </ul>

              <h3>3.3 Information from Third Parties</h3>
              <ul>
                <li><strong>Banking Integrations:</strong> Transaction data from connected bank accounts (with your explicit consent)</li>
                <li><strong>Payment Processors:</strong> Payment confirmation and billing information</li>
                <li><strong>Business Registries:</strong> Company verification data from public sources</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Purpose of Processing</h2>
              <p>We process your personal information for the following purposes:</p>
              <ul>
                <li><strong>Service Delivery:</strong> To provide, maintain, and improve our ERP platform and services</li>
                <li><strong>Account Management:</strong> To create and manage your account, authenticate your identity, and provide customer support</li>
                <li><strong>Billing:</strong> To process payments, generate invoices, and manage your subscription</li>
                <li><strong>Communication:</strong> To send service-related notices, updates, security alerts, and support messages</li>
                <li><strong>Compliance:</strong> To meet legal obligations including tax reporting, audit requirements, and regulatory compliance</li>
                <li><strong>Security:</strong> To detect, prevent, and respond to fraud, abuse, security risks, and technical issues</li>
                <li><strong>Improvement:</strong> To analyze usage patterns, conduct research, and enhance our products</li>
                <li><strong>Marketing:</strong> With your consent, to send promotional communications about our products and services</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Legal Basis for Processing</h2>
              <p>Under POPIA, we process your personal information based on the following lawful grounds:</p>
              <ul>
                <li><strong>Consent:</strong> Where you have given explicit consent (e.g., marketing communications)</li>
                <li><strong>Contract:</strong> Where processing is necessary to fulfill our contractual obligations to you</li>
                <li><strong>Legal Obligation:</strong> Where we are required by law (e.g., tax records, SARS reporting)</li>
                <li><strong>Legitimate Interest:</strong> Where we have a legitimate business interest that does not override your rights (e.g., security, fraud prevention)</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>6. Data Sharing and Disclosure</h2>
              <p>We do not sell your personal information. We may share your information with:</p>
              
              <h3>6.1 Service Providers</h3>
              <p>
                Third-party vendors who assist us in providing our services, including cloud hosting providers, 
                payment processors, email service providers, and analytics services. All service providers are 
                bound by data processing agreements that comply with POPIA.
              </p>

              <h3>6.2 Business Partners</h3>
              <p>
                With your consent, we may share information with integration partners (e.g., banking APIs, 
                accounting software) that you choose to connect to your account.
              </p>

              <h3>6.3 Legal Requirements</h3>
              <p>We may disclose information when required by law, including:</p>
              <ul>
                <li>In response to valid legal processes (court orders, subpoenas)</li>
                <li>To comply with regulatory requirements (SARS, CIPC, sector regulators)</li>
                <li>To protect our rights, property, or safety, or that of our users</li>
                <li>In connection with any merger, acquisition, or sale of company assets</li>
              </ul>

              <h3>6.4 Your Employees and Team Members</h3>
              <p>
                Information may be visible to other authorized users within your organization based on 
                permission levels you configure.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Cross-Border Data Transfers</h2>
              <p>
                Our primary data processing occurs in South Africa. Where we transfer personal information 
                to countries outside South Africa (e.g., for cloud hosting), we ensure that:
              </p>
              <ul>
                <li>The recipient country has adequate data protection laws, or</li>
                <li>Appropriate safeguards are in place (binding corporate rules, standard contractual clauses), or</li>
                <li>You have provided explicit consent for the transfer</li>
              </ul>
              <p>
                We primarily use AWS (Amazon Web Services) data centers with options for South African 
                or European hosting to minimize cross-border transfers.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Data Retention</h2>
              <p>We retain your personal information for as long as necessary to:</p>
              <ul>
                <li>Provide our services and maintain your account</li>
                <li>Comply with legal obligations (e.g., tax records must be kept for 5 years)</li>
                <li>Resolve disputes and enforce our agreements</li>
              </ul>
              <p>
                When your account is terminated, we will delete or anonymize your personal information 
                within 90 days, except where retention is required by law. You may request earlier 
                deletion subject to legal retention requirements.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Cookies and Tracking Technologies</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul>
                <li><strong>Essential Cookies:</strong> Enable core functionality (authentication, security)</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics Cookies:</strong> Understand how users interact with our platform</li>
                <li><strong>Marketing Cookies:</strong> With consent, deliver relevant advertisements</li>
              </ul>
              <p>
                You can control cookies through your browser settings. Note that disabling essential 
                cookies may affect platform functionality.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Your Rights Under POPIA</h2>
              <p>As a data subject, you have the following rights:</p>
              <ul>
                <li><strong>Right to Access:</strong> Request confirmation of what personal information we hold about you and obtain a copy</li>
                <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Right to Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing</li>
                <li><strong>Right to Restrict:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured, commonly used format</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
                <li><strong>Right to Lodge a Complaint:</strong> Lodge a complaint with the Information Regulator</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at{' '}
                <a href="mailto:privacy@siyabusa.co.za">privacy@siyabusa.co.za</a>. We will respond within 
                30 days as required by POPIA.
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
              <ul>
                <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Multi-factor authentication options</li>
                <li>Regular security assessments and penetration testing</li>
                <li>Access controls and audit logging</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
              <p>
                While we strive to protect your information, no method of transmission over the internet 
                is 100% secure. We cannot guarantee absolute security but commit to notifying you and 
                relevant authorities of any breach as required by law.
              </p>
            </section>

            <section className="legal-section">
              <h2>12. Children's Privacy</h2>
              <p>
                Our services are not directed at individuals under the age of 18. We do not knowingly 
                collect personal information from children. If you believe we have inadvertently 
                collected such information, please contact us immediately.
              </p>
            </section>

            <section className="legal-section">
              <h2>13. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant 
                changes by email or through our platform. Your continued use of our services after such 
                changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="legal-section">
              <h2>14. Contact Us</h2>
              <p>For any questions, concerns, or requests regarding this Privacy Policy or our data practices:</p>
              <div className="info-block">
                <p><strong>Email:</strong> <a href="mailto:privacy@siyabusa.co.za">privacy@siyabusa.co.za</a></p>
                <p><strong>Postal Address:</strong> Masaphokati Technologies (Pty) Ltd, Centurion, Gauteng, South Africa</p>
                <p><strong>Information Officer:</strong> Sibusiso Mavuso</p>
              </div>
            </section>

            <section className="legal-section">
              <h2>15. Information Regulator</h2>
              <p>
                If you are not satisfied with our response to any privacy-related concern, you have the 
                right to lodge a complaint with the Information Regulator:
              </p>
              <div className="info-block">
                <p><strong>Website:</strong> <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">https://inforegulator.org.za</a></p>
                <p><strong>Email:</strong> complaints.IR@justice.gov.za</p>
                <p><strong>Address:</strong> JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001</p>
              </div>
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

export default PrivacyPolicy;
