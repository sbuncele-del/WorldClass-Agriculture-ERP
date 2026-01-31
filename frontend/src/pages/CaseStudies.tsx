import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FooterPages.css';

interface CaseStudy {
  id: string;
  company: string;
  industry: string;
  title: string;
  challenge: string;
  solution: string;
  results: string[];
  quote?: {
    text: string;
    author: string;
    role: string;
  };
}

const caseStudies: CaseStudy[] = [
  {
    id: 'logistics-company',
    company: 'National Logistics Provider',
    industry: 'Logistics & Transport',
    title: 'Achieving Real-Time Visibility Across 50+ Vehicles',
    challenge: 'A growing logistics company with over 50 vehicles struggled with manual dispatch processes, lost paperwork, and no real-time visibility into fleet operations. Invoicing delays averaged 2 weeks.',
    solution: 'Implemented SiyaBusa with integrated fleet management, driver mobile app, and automated invoicing based on proof of delivery.',
    results: [
      '85% reduction in invoicing delays',
      'Real-time tracking of all 50+ vehicles',
      '40% improvement in dispatch efficiency',
      'Zero lost delivery documentation',
      '25% reduction in fuel costs through route optimization'
    ],
    quote: {
      text: 'SiyaBusa transformed how we operate. We went from chaos to complete visibility in weeks, not months.',
      author: 'Operations Director',
      role: 'National Logistics Provider'
    }
  },
  {
    id: 'manufacturing-firm',
    company: 'Mid-Size Manufacturer',
    industry: 'Manufacturing',
    title: 'Reducing Production Waste by 30%',
    challenge: 'A manufacturing company producing consumer goods had no visibility into material usage, leading to significant waste and inventory discrepancies that affected profitability.',
    solution: 'Deployed SiyaBusa manufacturing module with bill of materials tracking, real-time inventory updates, and production costing.',
    results: [
      '30% reduction in material waste',
      'Accurate real-time inventory levels',
      '15% improvement in production scheduling',
      'Full traceability from raw materials to finished goods',
      'Automated compliance documentation'
    ]
  },
  {
    id: 'retail-chain',
    company: 'Regional Retail Chain',
    industry: 'Wholesale & Retail',
    title: 'Unifying 12 Stores on One Platform',
    challenge: 'A retail chain with 12 locations used different systems in each store, making consolidated reporting impossible and inventory transfers a manual nightmare.',
    solution: 'Consolidated all locations onto SiyaBusa with multi-location inventory, centralized purchasing, and real-time sales reporting.',
    results: [
      'Single source of truth across all 12 stores',
      '60% faster month-end closing',
      'Inter-store transfers completed in minutes, not days',
      'Reduced stockouts by 45%',
      'Real-time sales dashboards for all locations'
    ],
    quote: {
      text: 'For the first time, I can see exactly what\'s happening across all my stores without waiting for reports.',
      author: 'CEO',
      role: 'Regional Retail Chain'
    }
  },
  {
    id: 'accounting-firm',
    company: 'Centurion Accounting Practice',
    industry: 'Professional Services',
    title: 'Managing 200+ Clients from One Dashboard',
    challenge: 'An accounting firm managing over 200 clients spent excessive time logging into different systems, compiling data, and chasing documents from clients.',
    solution: 'Onboarded clients onto SiyaBusa with accountant portal access, automated bank feeds, and collaborative document management.',
    results: [
      '70% reduction in data entry time',
      'Real-time access to client financials',
      'Automated bank reconciliation for all clients',
      'Secure document sharing and approval workflows',
      '50% faster VAT return preparation'
    ]
  },
  {
    id: 'construction-company',
    company: 'Construction & Development Firm',
    industry: 'Construction',
    title: 'Project-Based Profitability Visibility',
    challenge: 'A construction company couldn\'t accurately track costs per project, leading to surprises at project completion and difficulty quoting accurately for new work.',
    solution: 'Implemented project-based accounting in SiyaBusa with job costing, procurement tracking, and subcontractor management.',
    results: [
      'Real-time project profitability tracking',
      '25% improvement in quote accuracy',
      'Integrated subcontractor cost tracking',
      'Automated progress billing',
      'Complete audit trail for all project expenses'
    ],
    quote: {
      text: 'We finally know if we\'re making money on a project before it\'s too late to do anything about it.',
      author: 'Financial Manager',
      role: 'Construction & Development Firm'
    }
  },
  {
    id: 'agricultural-cooperative',
    company: 'Agricultural Cooperative',
    industry: 'Agriculture',
    title: 'Streamlining Farm-to-Market Operations',
    challenge: 'An agricultural cooperative struggled to track produce from member farms through processing to sale, with no visibility into true costs or margins by crop type.',
    solution: 'Deployed SiyaBusa with batch tracking, grower management, processing operations, and integrated sales.',
    results: [
      'Full traceability from farm to customer',
      'Accurate cost allocation by crop and grower',
      'Automated grower payment calculations',
      '35% reduction in produce waste',
      'Compliance with food safety traceability requirements'
    ]
  }
];

const CaseStudies: React.FC = () => {
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
            <h1>Case Studies</h1>
            <p className="subtitle">Real results from real businesses</p>
          </header>

          <section className="content-section">
            <p>
              Discover how businesses across industries are using SiyaBusa to transform their 
              operations, improve efficiency, and drive growth. These are their stories.
            </p>
          </section>

          <section className="content-section">
            <div className="case-studies-grid">
              {caseStudies.map(study => (
                <article key={study.id} className="case-study-card">
                  <div className="case-study-header">
                    <span className="case-study-industry">{study.industry}</span>
                    <h2>{study.title}</h2>
                    <p className="case-study-company">{study.company}</p>
                  </div>

                  <div className="case-study-body">
                    <div className="case-study-section">
                      <h3>The Challenge</h3>
                      <p>{study.challenge}</p>
                    </div>

                    <div className="case-study-section">
                      <h3>The Solution</h3>
                      <p>{study.solution}</p>
                    </div>

                    <div className="case-study-section">
                      <h3>The Results</h3>
                      <ul className="results-list">
                        {study.results.map((result, index) => (
                          <li key={index}>✓ {result}</li>
                        ))}
                      </ul>
                    </div>

                    {study.quote && (
                      <blockquote className="case-study-quote">
                        <p>"{study.quote.text}"</p>
                        <cite>— {study.quote.author}, {study.quote.role}</cite>
                      </blockquote>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="content-section cta-section">
            <h2>Ready to Write Your Success Story?</h2>
            <p>
              Join hundreds of businesses that have transformed their operations with SiyaBusa.
            </p>
            <div className="cta-buttons">
              <Link to="/#demo" className="btn-primary">Request a Demo</Link>
              <Link to="/contact" className="btn-secondary">Contact Sales</Link>
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

export default CaseStudies;
