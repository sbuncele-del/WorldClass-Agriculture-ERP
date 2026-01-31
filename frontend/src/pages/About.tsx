import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FooterPages.css';

const About: React.FC = () => {
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
            <h1>About SiyaBusa</h1>
            <p className="subtitle">A product of Masaphokati Technologies</p>
          </header>

          <section className="content-section">
            <h2>Our Story</h2>
            <p>
              SiyaBusa is the flagship enterprise resource planning platform developed by 
              <strong> Masaphokati Technologies</strong>, a South African company dedicated to 
              transforming the fintech and enterprise software landscape. We believe that 
              business management systems should serve business owners—not just accountants.
            </p>
            <p>
              Our mission is to bridge the gap between operational excellence and financial 
              clarity, empowering businesses across Africa and beyond to make informed decisions 
              with real-time, accurate data.
            </p>
          </section>

          <section className="content-section founder-section">
            <h2>The Founder</h2>
            <div className="founder-content">
              <div className="founder-image">
                <div className="founder-placeholder">SM</div>
              </div>
              <div className="founder-bio">
                <h3>Sibusiso Mavuso</h3>
                <p className="founder-title">Founder & CEO, Masaphokati Technologies</p>
                <p>
                  Sibusiso Mavuso is a qualified accountant and the founder of a thriving 
                  accounting practice based in Centurion, South Africa. Through years of 
                  hands-on experience serving businesses across multiple industries, he 
                  witnessed a recurring pain point: traditional business systems were built 
                  for accountants, not for business owners.
                </p>
                <p>
                  This fundamental disconnect resulted in chronic challenges—document backlogs, 
                  failed audits, fragmented data across multiple platforms, and business owners 
                  unable to gauge whether their ventures were growing or stagnating. Without 
                  real-time, unified insights, strategic decision-making became guesswork.
                </p>
                <p>
                  Driven by a passion to solve these problems, Sibusiso embarked on a journey 
                  to study systems architecture and software development. His goal was singular: 
                  to create a platform that bridges the gap between business owners and their 
                  financial reality—making enterprise-grade tools accessible, intuitive, and 
                  genuinely useful.
                </p>
                <p>
                  SiyaBusa is the culmination of that vision—a system designed from the ground 
                  up to serve the people who run businesses, not just the people who audit them.
                </p>
              </div>
            </div>
          </section>

          <section className="content-section">
            <h2>Our Vision</h2>
            <p>
              To become Africa's leading enterprise operating system, enabling businesses of 
              all sizes to operate with the same efficiency, insight, and compliance capabilities 
              as Fortune 500 companies—at a fraction of the cost and complexity.
            </p>
          </section>

          <section className="content-section">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🎯</div>
                <h3>Owner-First Design</h3>
                <p>Every feature is built with business owners in mind, not just accountants.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🔍</div>
                <h3>Radical Transparency</h3>
                <p>Real-time data and honest insights—no hidden fees, no surprises.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🌍</div>
                <h3>African Innovation</h3>
                <p>Built in Africa, for Africa, with global standards and local understanding.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3>Compliance as Care</h3>
                <p>We believe compliance isn't a burden—it's how we protect our clients.</p>
              </div>
            </div>
          </section>

          <section className="content-section">
            <h2>About Masaphokati Technologies</h2>
            <p>
              Masaphokati Technologies (Pty) Ltd is a South African technology company 
              specializing in enterprise software solutions, fintech innovation, and 
              digital transformation services. Headquartered in Centurion, Gauteng, the 
              company was founded with a commitment to changing the narrative in how 
              African businesses interact with technology.
            </p>
            <p>
              The name "Masaphokati" reflects our mission—to position ourselves at the 
              center of business operations, connecting all aspects of an organization 
              into one cohesive, intelligent system.
            </p>
            <div className="company-details">
              <p><strong>Registered Name:</strong> Masaphokati Technologies (Pty) Ltd</p>
              <p><strong>Country:</strong> South Africa</p>
              <p><strong>Headquarters:</strong> Centurion, Gauteng</p>
              <p><strong>Industry:</strong> Enterprise Software, FinTech</p>
            </div>
          </section>

          <section className="content-section cta-section">
            <h2>Join Us on This Journey</h2>
            <p>
              Whether you're a business owner seeking clarity, an accountant looking for 
              better tools, or a professional wanting to join our team, we'd love to 
              connect with you.
            </p>
            <div className="cta-buttons">
              <Link to="/#demo" className="btn-primary">Request a Demo</Link>
              <Link to="/careers" className="btn-secondary">View Careers</Link>
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

export default About;
