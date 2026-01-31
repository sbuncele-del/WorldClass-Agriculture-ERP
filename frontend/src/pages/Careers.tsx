import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FooterPages.css';

interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
}

const jobListings: JobListing[] = [
  {
    id: 'se-001',
    title: 'Senior Full-Stack Developer',
    department: 'Engineering',
    location: 'Centurion, SA / Remote',
    type: 'Full-time',
    description: 'Build and scale our core ERP platform using React, Node.js, and PostgreSQL. You\'ll work on mission-critical features serving thousands of businesses.',
    requirements: [
      '5+ years of full-stack development experience',
      'Proficiency in TypeScript, React, and Node.js',
      'Experience with PostgreSQL and database optimization',
      'Understanding of ERP or financial systems is a plus',
      'Strong problem-solving and communication skills'
    ]
  },
  {
    id: 'se-002',
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Centurion, SA / Remote',
    type: 'Full-time',
    description: 'Design and maintain our cloud infrastructure, CI/CD pipelines, and ensure 99.9% uptime for our enterprise clients.',
    requirements: [
      '3+ years of DevOps or SRE experience',
      'Expertise in AWS or Azure cloud services',
      'Experience with Docker, Kubernetes, and Terraform',
      'Knowledge of monitoring tools (Prometheus, Grafana)',
      'Security-first mindset'
    ]
  },
  {
    id: 'pd-001',
    title: 'Product Manager - Financial Modules',
    department: 'Product',
    location: 'Centurion, SA',
    type: 'Full-time',
    description: 'Lead the vision and roadmap for our financial management modules, working closely with customers and engineering to deliver world-class solutions.',
    requirements: [
      '4+ years of product management experience',
      'Background in finance, accounting, or ERP systems',
      'Strong analytical and stakeholder management skills',
      'Experience with agile methodologies',
      'Excellent written and verbal communication'
    ]
  },
  {
    id: 'pd-002',
    title: 'UX/UI Designer',
    department: 'Product',
    location: 'Centurion, SA / Remote',
    type: 'Full-time',
    description: 'Create intuitive, beautiful interfaces that make complex enterprise operations feel simple. Design experiences that business owners love.',
    requirements: [
      '3+ years of product design experience',
      'Proficiency in Figma and design systems',
      'Portfolio demonstrating enterprise or B2B design work',
      'Understanding of accessibility standards',
      'Ability to translate complex workflows into simple UIs'
    ]
  },
  {
    id: 'cs-001',
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Johannesburg, SA',
    type: 'Full-time',
    description: 'Be the trusted advisor for our enterprise clients, ensuring they achieve maximum value from SiyaBusa while driving retention and expansion.',
    requirements: [
      '3+ years in customer success or account management',
      'Experience with SaaS or enterprise software',
      'Strong relationship-building skills',
      'Understanding of business operations and finance',
      'Data-driven approach to customer health'
    ]
  },
  {
    id: 'cs-002',
    title: 'Implementation Specialist',
    department: 'Customer Success',
    location: 'Cape Town / Johannesburg, SA',
    type: 'Full-time',
    description: 'Guide new customers through SiyaBusa implementation, configuring the system to match their business processes and ensuring successful go-live.',
    requirements: [
      '2+ years in software implementation or consulting',
      'Background in accounting or business operations',
      'Strong project management skills',
      'Patient and excellent at training users',
      'Travel flexibility within South Africa'
    ]
  },
  {
    id: 'sl-001',
    title: 'Enterprise Sales Executive',
    department: 'Sales',
    location: 'Johannesburg, SA',
    type: 'Full-time',
    description: 'Drive new business acquisition for mid-market and enterprise accounts. You\'ll own the full sales cycle from prospecting to close.',
    requirements: [
      '4+ years of B2B software sales experience',
      'Track record of exceeding quota',
      'Experience selling to C-suite executives',
      'Understanding of ERP, accounting, or business software',
      'Hunter mentality with consultative approach'
    ]
  },
  {
    id: 'sl-002',
    title: 'Business Development Representative',
    department: 'Sales',
    location: 'Centurion, SA',
    type: 'Full-time',
    description: 'Generate qualified pipeline for our sales team through outbound prospecting, lead qualification, and creative outreach campaigns.',
    requirements: [
      '1+ years in sales development or similar role',
      'Excellent communication and research skills',
      'Comfortable with high-volume outreach',
      'CRM experience (HubSpot, Salesforce)',
      'Hungry to learn and grow in sales'
    ]
  },
  {
    id: 'fn-001',
    title: 'Financial Controller',
    department: 'Finance',
    location: 'Centurion, SA',
    type: 'Full-time',
    description: 'Oversee financial operations, reporting, and compliance. Partner with leadership to drive financial strategy and operational efficiency.',
    requirements: [
      'CA(SA) or equivalent qualification',
      '5+ years of financial management experience',
      'Experience with SaaS revenue recognition',
      'Strong Excel and financial modeling skills',
      'Knowledge of IFRS and South African tax law'
    ]
  },
  {
    id: 'mk-001',
    title: 'Content Marketing Manager',
    department: 'Marketing',
    location: 'Remote (SA)',
    type: 'Full-time',
    description: 'Create compelling content that educates and engages our audience—from blog posts and case studies to webinars and thought leadership.',
    requirements: [
      '3+ years of B2B content marketing experience',
      'Excellent writing and storytelling skills',
      'Understanding of SEO and content distribution',
      'Experience in fintech or enterprise software',
      'Ability to explain complex topics simply'
    ]
  }
];

const Careers: React.FC = () => {
  const departments = [...new Set(jobListings.map(job => job.department))];

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
            <h1>Careers at SiyaBusa</h1>
            <p className="subtitle">Join us in transforming how businesses operate</p>
          </header>

          <section className="content-section">
            <h2>Why Work With Us?</h2>
            <p>
              At Masaphokati Technologies, we're building more than software—we're 
              creating tools that empower business owners across Africa and beyond. 
              Our team combines deep industry expertise with cutting-edge technology 
              to solve real problems for real businesses.
            </p>
            
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">💰</div>
                <h3>Competitive Compensation</h3>
                <p>Market-rate salaries with equity options for all full-time employees.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🏥</div>
                <h3>Health & Wellness</h3>
                <p>Comprehensive medical aid contribution and wellness programs.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🏠</div>
                <h3>Flexible Work</h3>
                <p>Remote-friendly culture with flexible hours for most roles.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">📚</div>
                <h3>Learning & Growth</h3>
                <p>Annual learning budget and mentorship opportunities.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🌴</div>
                <h3>Generous Leave</h3>
                <p>20+ days annual leave plus public holidays and family leave.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🚀</div>
                <h3>Impact</h3>
                <p>Work that matters—help thousands of businesses thrive.</p>
              </div>
            </div>
          </section>

          <section className="content-section">
            <h2>Open Positions</h2>
            <p className="section-intro">
              We're always looking for talented individuals who share our passion for 
              building exceptional software. Don't see a perfect fit? Send your CV to{' '}
              <a href="mailto:careers@siyabusa.co.za">careers@siyabusa.co.za</a>
            </p>

            {departments.map(department => (
              <div key={department} className="department-section">
                <h3 className="department-title">{department}</h3>
                <div className="job-listings">
                  {jobListings
                    .filter(job => job.department === department)
                    .map(job => (
                      <div key={job.id} className="job-card">
                        <div className="job-header">
                          <h4>{job.title}</h4>
                          <div className="job-meta">
                            <span className="job-location">📍 {job.location}</span>
                            <span className="job-type">{job.type}</span>
                          </div>
                        </div>
                        <p className="job-description">{job.description}</p>
                        <div className="job-requirements">
                          <strong>Requirements:</strong>
                          <ul>
                            {job.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                        <a 
                          href={`mailto:careers@siyabusa.co.za?subject=Application: ${job.title} (${job.id})`}
                          className="btn-apply"
                        >
                          Apply Now
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </section>

          <section className="content-section">
            <h2>Our Hiring Process</h2>
            <div className="process-steps">
              <div className="process-step">
                <div className="step-number">1</div>
                <h3>Application Review</h3>
                <p>We review every application within 5 business days.</p>
              </div>
              <div className="process-step">
                <div className="step-number">2</div>
                <h3>Initial Chat</h3>
                <p>30-minute call with our talent team to learn about you.</p>
              </div>
              <div className="process-step">
                <div className="step-number">3</div>
                <h3>Skills Assessment</h3>
                <p>Role-specific exercise or technical interview.</p>
              </div>
              <div className="process-step">
                <div className="step-number">4</div>
                <h3>Team Interview</h3>
                <p>Meet your potential teammates and leadership.</p>
              </div>
              <div className="process-step">
                <div className="step-number">5</div>
                <h3>Offer</h3>
                <p>Competitive offer within 48 hours of final interview.</p>
              </div>
            </div>
          </section>

          <section className="content-section cta-section">
            <h2>Ready to Join Us?</h2>
            <p>
              We're building something special. If you're passionate about creating 
              technology that makes a real difference, we want to hear from you.
            </p>
            <a href="mailto:careers@siyabusa.co.za" className="btn-primary">
              Send Your CV
            </a>
          </section>
        </motion.div>
      </main>

      <footer className="footer-page-footer">
        <p>© {new Date().getFullYear()} SiyaBusa by Masaphokati Technologies (Pty) Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Careers;
