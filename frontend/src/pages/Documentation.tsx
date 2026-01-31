import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FooterPages.css';

const Documentation: React.FC = () => {
  const docCategories = [
    {
      title: 'Getting Started',
      icon: '🚀',
      docs: [
        { title: 'Quick Start Guide', description: 'Set up your SiyaBusa account in minutes', link: '#' },
        { title: 'System Requirements', description: 'Browser and device compatibility', link: '#' },
        { title: 'First-Time Setup', description: 'Configure your company and preferences', link: '#' },
        { title: 'User Management', description: 'Add team members and set permissions', link: '#' },
      ]
    },
    {
      title: 'Financial Management',
      icon: '💰',
      docs: [
        { title: 'Chart of Accounts', description: 'Set up your accounting structure', link: '#' },
        { title: 'General Ledger', description: 'Record and manage journal entries', link: '#' },
        { title: 'Accounts Receivable', description: 'Invoice customers and track payments', link: '#' },
        { title: 'Accounts Payable', description: 'Manage supplier invoices and payments', link: '#' },
        { title: 'Bank Reconciliation', description: 'Match transactions and reconcile accounts', link: '#' },
        { title: 'Financial Reports', description: 'Generate statements and analytics', link: '#' },
      ]
    },
    {
      title: 'Inventory & Warehouse',
      icon: '📦',
      docs: [
        { title: 'Product Management', description: 'Create and manage your product catalog', link: '#' },
        { title: 'Stock Control', description: 'Track inventory levels and movements', link: '#' },
        { title: 'Warehouse Setup', description: 'Configure locations and bins', link: '#' },
        { title: 'Stock Valuation', description: 'FIFO, LIFO, and weighted average methods', link: '#' },
        { title: 'Inventory Reports', description: 'Stock aging, movement, and variance reports', link: '#' },
      ]
    },
    {
      title: 'Sales & CRM',
      icon: '📈',
      docs: [
        { title: 'Customer Management', description: 'Manage customer records and history', link: '#' },
        { title: 'Quotes & Proposals', description: 'Create and send professional quotes', link: '#' },
        { title: 'Sales Orders', description: 'Process orders from quote to delivery', link: '#' },
        { title: 'Invoice Generation', description: 'Create and send customer invoices', link: '#' },
        { title: 'Sales Analytics', description: 'Track performance and trends', link: '#' },
      ]
    },
    {
      title: 'Procurement',
      icon: '🛒',
      docs: [
        { title: 'Supplier Management', description: 'Manage vendor information and terms', link: '#' },
        { title: 'Purchase Orders', description: 'Create and track purchase orders', link: '#' },
        { title: 'Goods Receipt', description: 'Process incoming deliveries', link: '#' },
        { title: 'Supplier Invoices', description: 'Match invoices to orders and receipts', link: '#' },
        { title: 'Procurement Reports', description: 'Analyze spending and supplier performance', link: '#' },
      ]
    },
    {
      title: 'Human Resources',
      icon: '👥',
      docs: [
        { title: 'Employee Records', description: 'Manage employee information', link: '#' },
        { title: 'Leave Management', description: 'Configure and track leave balances', link: '#' },
        { title: 'Payroll Setup', description: 'Configure pay structures and deductions', link: '#' },
        { title: 'Payroll Processing', description: 'Run payroll and generate payslips', link: '#' },
        { title: 'HR Reports', description: 'Headcount, turnover, and compliance reports', link: '#' },
      ]
    },
    {
      title: 'Integrations',
      icon: '🔗',
      docs: [
        { title: 'API Overview', description: 'Introduction to the SiyaBusa API', link: '#' },
        { title: 'Authentication', description: 'OAuth 2.0 and API key setup', link: '#' },
        { title: 'Bank Feeds', description: 'Connect your bank accounts', link: '#' },
        { title: 'Third-Party Apps', description: 'Available integrations and setup', link: '#' },
        { title: 'Webhooks', description: 'Real-time event notifications', link: '#' },
      ]
    },
    {
      title: 'Administration',
      icon: '⚙️',
      docs: [
        { title: 'Company Settings', description: 'Configure company-wide preferences', link: '#' },
        { title: 'Security Settings', description: 'MFA, SSO, and password policies', link: '#' },
        { title: 'Audit Logs', description: 'View system activity and changes', link: '#' },
        { title: 'Data Export', description: 'Export your data in various formats', link: '#' },
        { title: 'Backup & Recovery', description: 'Understand our backup policies', link: '#' },
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
            <h1>Documentation</h1>
            <p className="subtitle">Everything you need to master SiyaBusa</p>
          </header>

          <section className="content-section">
            <div className="search-box">
              <input type="search" placeholder="Search documentation..." />
              <button>🔍</button>
            </div>
          </section>

          <section className="content-section">
            <div className="doc-categories">
              {docCategories.map((category, index) => (
                <div key={index} className="doc-category">
                  <h2>
                    <span className="category-icon">{category.icon}</span>
                    {category.title}
                  </h2>
                  <ul className="doc-list">
                    {category.docs.map((doc, docIndex) => (
                      <li key={docIndex}>
                        <a href={doc.link}>
                          <strong>{doc.title}</strong>
                          <span>{doc.description}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="content-section cta-section">
            <h2>Can't Find What You Need?</h2>
            <p>Our support team is ready to help you with any questions.</p>
            <div className="cta-buttons">
              <Link to="/support" className="btn-primary">Contact Support</Link>
              <Link to="/contact" className="btn-secondary">Request Feature</Link>
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

export default Documentation;
