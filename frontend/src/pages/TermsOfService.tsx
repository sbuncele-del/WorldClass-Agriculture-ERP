import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FooterPages.css';

const TermsOfService: React.FC = () => {
  const lastUpdated = 'December 9, 2025';
  const effectiveDate = 'December 9, 2025';

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
            <h1>Terms of Service</h1>
            <p className="subtitle">Last Updated: {lastUpdated} | Effective: {effectiveDate}</p>
          </header>

          <div className="legal-content">
            <section className="legal-section">
              <h2>1. Agreement to Terms</h2>
              <p>
                These Terms of Service ("Terms") constitute a legally binding agreement between you 
                ("Customer", "you", or "your") and Masaphokati Technologies (Pty) Ltd, a company 
                registered in South Africa, trading as SiyaBusa ("Company", "we", "us", or "our").
              </p>
              <p>
                By accessing or using the SiyaBusa platform, website, mobile applications, or any 
                related services (collectively, the "Services"), you acknowledge that you have read, 
                understood, and agree to be bound by these Terms. If you do not agree to these Terms, 
                you must not access or use our Services.
              </p>
              <p>
                If you are entering into these Terms on behalf of a business or other legal entity, 
                you represent that you have the authority to bind such entity to these Terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Description of Services</h2>
              <p>
                SiyaBusa is a cloud-based enterprise resource planning (ERP) platform that provides 
                business management tools including, but not limited to:
              </p>
              <ul>
                <li>Financial management and accounting</li>
                <li>Inventory and warehouse management</li>
                <li>Sales and customer relationship management</li>
                <li>Procurement and supplier management</li>
                <li>Human resources and payroll</li>
                <li>Manufacturing and production planning</li>
                <li>Business intelligence and reporting</li>
                <li>Compliance and audit management</li>
              </ul>
              <p>
                The specific features available to you depend on your subscription plan and any 
                additional modules you have purchased.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Account Registration and Security</h2>
              
              <h3>3.1 Account Creation</h3>
              <p>
                To use our Services, you must create an account by providing accurate, current, and 
                complete information. You agree to update your information to maintain its accuracy.
              </p>

              <h3>3.2 Account Security</h3>
              <p>You are responsible for:</p>
              <ul>
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access or security breach</li>
                <li>Ensuring your employees and authorized users comply with these Terms</li>
              </ul>

              <h3>3.3 Account Administrator</h3>
              <p>
                The person who creates the account is designated as the Account Administrator and has 
                the authority to manage users, permissions, billing, and account settings.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Subscription and Fees</h2>

              <h3>4.1 Subscription Plans</h3>
              <p>
                We offer various subscription plans as detailed on our website. Your subscription 
                grants you a limited, non-exclusive, non-transferable right to access and use the 
                Services during the subscription term.
              </p>

              <h3>4.2 Fees and Payment</h3>
              <ul>
                <li>All fees are quoted in South African Rand (ZAR) unless otherwise specified</li>
                <li>Fees are exclusive of VAT and other applicable taxes</li>
                <li>Payment is due in advance for the billing period selected</li>
                <li>We accept payment via credit card, debit order, or EFT</li>
              </ul>

              <h3>4.3 Price Changes</h3>
              <p>
                We may modify our pricing with 30 days' notice. Price changes will not affect your 
                current subscription term but will apply upon renewal.
              </p>

              <h3>4.4 Late Payment</h3>
              <p>
                If payment is not received within 7 days of the due date, we may suspend access to 
                your account. Interest on overdue amounts accrues at the maximum rate permitted by 
                South African law.
              </p>

              <h3>4.5 Refunds</h3>
              <p>
                Subscription fees are non-refundable except as required by applicable consumer 
                protection laws or as explicitly stated in these Terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Your Data</h2>

              <h3>5.1 Ownership</h3>
              <p>
                You retain all ownership rights to the data you input into the Services ("Customer Data"). 
                We do not claim ownership of your Customer Data.
              </p>

              <h3>5.2 License to Us</h3>
              <p>
                You grant us a limited license to access, process, and store your Customer Data solely 
                to provide the Services and as described in our Privacy Policy.
              </p>

              <h3>5.3 Data Export</h3>
              <p>
                You may export your Customer Data at any time during your subscription through our 
                standard export features. Upon termination, we will provide data export assistance 
                for 30 days.
              </p>

              <h3>5.4 Data Backup</h3>
              <p>
                We maintain regular backups of Customer Data. However, you are responsible for 
                maintaining your own backups of critical data.
              </p>

              <h3>5.5 Aggregated Data</h3>
              <p>
                We may use anonymized, aggregated data derived from your use of the Services for 
                analytics, benchmarking, and service improvement. Such data will not identify you 
                or your business.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Acceptable Use</h2>

              <h3>6.1 Permitted Use</h3>
              <p>You may use the Services only for lawful business purposes in accordance with these Terms.</p>

              <h3>6.2 Prohibited Activities</h3>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Services for any illegal purpose or in violation of any laws</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems or other accounts</li>
                <li>Interfere with or disrupt the Services or servers</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Services</li>
                <li>Resell, sublicense, or share your account access with third parties</li>
                <li>Use automated systems to scrape or extract data from the Services</li>
                <li>Circumvent any usage limits or access controls</li>
                <li>Use the Services to store or transmit defamatory, fraudulent, or misleading content</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>7. Intellectual Property</h2>

              <h3>7.1 Our Intellectual Property</h3>
              <p>
                The Services, including all software, designs, text, graphics, logos, and other content, 
                are owned by Masaphokati Technologies or our licensors and are protected by South African 
                and international intellectual property laws.
              </p>

              <h3>7.2 Limited License</h3>
              <p>
                We grant you a limited, non-exclusive, non-transferable license to access and use the 
                Services during your subscription term. This license does not include the right to:
              </p>
              <ul>
                <li>Modify, adapt, or create derivative works</li>
                <li>Distribute, sublicense, or transfer the Services</li>
                <li>Remove any proprietary notices or labels</li>
              </ul>

              <h3>7.3 Feedback</h3>
              <p>
                If you provide suggestions, ideas, or feedback about the Services, you grant us a 
                perpetual, irrevocable, royalty-free license to use such feedback without restriction.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Third-Party Integrations</h2>
              <p>
                The Services may integrate with third-party applications and services. Your use of 
                such integrations is subject to the third party's terms and privacy policies. We are 
                not responsible for third-party services and make no warranties regarding their 
                availability, accuracy, or security.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Service Level and Availability</h2>

              <h3>9.1 Uptime Commitment</h3>
              <p>
                We strive to maintain 99.9% uptime for the Services, excluding scheduled maintenance. 
                Specific service level commitments may be detailed in your subscription agreement.
              </p>

              <h3>9.2 Maintenance</h3>
              <p>
                We may perform scheduled maintenance during off-peak hours with reasonable advance 
                notice. Emergency maintenance may be performed without notice when necessary to 
                protect the Services or Customer Data.
              </p>

              <h3>9.3 Support</h3>
              <p>
                Support availability and response times depend on your subscription plan. Standard 
                support is provided via email during South African business hours.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Disclaimer of Warranties</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICES ARE PROVIDED "AS IS" 
                AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR 
                STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR 
                A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p>We do not warrant that:</p>
              <ul>
                <li>The Services will meet all your requirements</li>
                <li>The Services will be uninterrupted, timely, secure, or error-free</li>
                <li>Any errors will be corrected</li>
                <li>Results obtained from the Services will be accurate or reliable</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>11. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
              </p>
              <ul>
                <li>
                  <strong>Exclusion of Consequential Damages:</strong> We shall not be liable for any 
                  indirect, incidental, special, consequential, or punitive damages, including loss 
                  of profits, data, business opportunities, or goodwill.
                </li>
                <li>
                  <strong>Cap on Liability:</strong> Our total cumulative liability arising from or 
                  related to these Terms shall not exceed the fees paid by you in the twelve (12) 
                  months preceding the claim.
                </li>
              </ul>
              <p>
                These limitations apply regardless of the theory of liability (contract, tort, 
                negligence, or otherwise) and even if we have been advised of the possibility 
                of such damages.
              </p>
              <p>
                Nothing in these Terms excludes or limits liability for fraud, gross negligence, 
                willful misconduct, or death or personal injury caused by our negligence.
              </p>
            </section>

            <section className="legal-section">
              <h2>12. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Masaphokati Technologies, its 
                officers, directors, employees, and agents from and against any claims, liabilities, 
                damages, losses, costs, and expenses (including reasonable legal fees) arising from:
              </p>
              <ul>
                <li>Your use of the Services</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Your Customer Data</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>13. Term and Termination</h2>

              <h3>13.1 Term</h3>
              <p>
                These Terms commence when you create an account and continue until terminated. Your 
                subscription term is specified in your subscription agreement and renews automatically 
                unless cancelled.
              </p>

              <h3>13.2 Termination by You</h3>
              <p>
                You may terminate your subscription at any time by providing notice through your 
                account settings. Termination takes effect at the end of your current billing period.
              </p>

              <h3>13.3 Termination by Us</h3>
              <p>We may terminate or suspend your access:</p>
              <ul>
                <li>Immediately for material breach of these Terms</li>
                <li>For non-payment after 30 days' notice</li>
                <li>For any reason with 90 days' notice</li>
              </ul>

              <h3>13.4 Effect of Termination</h3>
              <p>Upon termination:</p>
              <ul>
                <li>Your right to access the Services ends immediately</li>
                <li>You may export your Customer Data for 30 days</li>
                <li>We will delete your Customer Data after 90 days unless legally required to retain it</li>
                <li>Accrued rights and obligations survive termination</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>14. Confidentiality</h2>
              <p>
                Each party agrees to maintain the confidentiality of the other party's confidential 
                information and not to disclose it to third parties except as necessary to perform 
                under these Terms or as required by law. Confidential information does not include 
                information that is publicly available or independently developed.
              </p>
            </section>

            <section className="legal-section">
              <h2>15. Governing Law and Disputes</h2>

              <h3>15.1 Governing Law</h3>
              <p>
                These Terms are governed by and construed in accordance with the laws of the Republic 
                of South Africa, without regard to its conflict of law principles.
              </p>

              <h3>15.2 Dispute Resolution</h3>
              <p>
                Any dispute arising from these Terms shall first be submitted to good-faith negotiation 
                between the parties. If not resolved within 30 days, either party may submit the dispute 
                to mediation under the rules of the Arbitration Foundation of Southern Africa (AFSA).
              </p>

              <h3>15.3 Jurisdiction</h3>
              <p>
                If mediation fails, the dispute shall be submitted to the exclusive jurisdiction of 
                the courts of the Republic of South Africa, sitting in Gauteng.
              </p>
            </section>

            <section className="legal-section">
              <h2>16. General Provisions</h2>

              <h3>16.1 Entire Agreement</h3>
              <p>
                These Terms, together with the Privacy Policy and any subscription agreement, 
                constitute the entire agreement between you and us regarding the Services.
              </p>

              <h3>16.2 Amendments</h3>
              <p>
                We may modify these Terms at any time by posting the revised Terms on our website. 
                Material changes will be notified via email at least 30 days in advance. Your 
                continued use of the Services after changes take effect constitutes acceptance.
              </p>

              <h3>16.3 Assignment</h3>
              <p>
                You may not assign these Terms without our written consent. We may assign these 
                Terms to an affiliate or in connection with a merger, acquisition, or sale of assets.
              </p>

              <h3>16.4 Severability</h3>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining 
                provisions will continue in full force and effect.
              </p>

              <h3>16.5 Waiver</h3>
              <p>
                Our failure to enforce any right or provision of these Terms shall not constitute 
                a waiver of that right or provision.
              </p>

              <h3>16.6 Force Majeure</h3>
              <p>
                Neither party shall be liable for delays or failures in performance resulting from 
                circumstances beyond their reasonable control, including natural disasters, war, 
                terrorism, labor disputes, or government actions.
              </p>

              <h3>16.7 Notices</h3>
              <p>
                Notices to you will be sent to the email address associated with your account. 
                Notices to us should be sent to legal@siyabusa.co.za.
              </p>
            </section>

            <section className="legal-section">
              <h2>17. Contact Information</h2>
              <p>For questions about these Terms, please contact us:</p>
              <div className="info-block">
                <p><strong>Company:</strong> Masaphokati Technologies (Pty) Ltd</p>
                <p><strong>Email:</strong> <a href="mailto:legal@siyabusa.co.za">legal@siyabusa.co.za</a></p>
                <p><strong>Address:</strong> Centurion, Gauteng, South Africa</p>
              </div>
            </section>

            <section className="legal-section acknowledgment">
              <h2>Acknowledgment</h2>
              <p>
                BY USING THE SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, 
                UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS, 
                DO NOT USE THE SERVICES.
              </p>
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

export default TermsOfService;
