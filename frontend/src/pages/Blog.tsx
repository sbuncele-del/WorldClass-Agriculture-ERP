import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FooterPages.css';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 'erp-digital-transformation',
    title: 'Why ERP is the Foundation of Digital Transformation',
    excerpt: 'Discover how modern ERP systems are enabling businesses to transform their operations and compete in the digital age.',
    category: 'Industry Insights',
    date: 'December 5, 2025',
    readTime: '6 min read',
    author: 'SiyaBusa Team'
  },
  {
    id: 'popia-compliance-guide',
    title: 'POPIA Compliance: A Practical Guide for South African Businesses',
    excerpt: 'Understanding your obligations under the Protection of Personal Information Act and how to implement compliant processes.',
    category: 'Compliance',
    date: 'November 28, 2025',
    readTime: '8 min read',
    author: 'Sibusiso Mavuso'
  },
  {
    id: 'real-time-accounting',
    title: 'The Death of Month-End: Embracing Real-Time Accounting',
    excerpt: 'Why waiting until month-end to understand your financial position is costing your business—and how to fix it.',
    category: 'Financial Management',
    date: 'November 20, 2025',
    readTime: '5 min read',
    author: 'SiyaBusa Team'
  },
  {
    id: 'inventory-optimization',
    title: '5 Inventory Mistakes That Are Draining Your Cash Flow',
    excerpt: 'Common inventory management errors and practical strategies to optimize your stock levels and improve cash flow.',
    category: 'Operations',
    date: 'November 15, 2025',
    readTime: '7 min read',
    author: 'SiyaBusa Team'
  },
  {
    id: 'ai-in-erp',
    title: 'How AI is Revolutionizing Enterprise Resource Planning',
    excerpt: 'From predictive analytics to automated workflows, explore how artificial intelligence is transforming ERP systems.',
    category: 'Technology',
    date: 'November 8, 2025',
    readTime: '6 min read',
    author: 'SiyaBusa Team'
  },
  {
    id: 'scaling-with-erp',
    title: 'From Spreadsheets to Systems: When to Make the Switch',
    excerpt: 'Signs that your business has outgrown spreadsheets and how to transition to an integrated ERP system.',
    category: 'Growth',
    date: 'November 1, 2025',
    readTime: '5 min read',
    author: 'SiyaBusa Team'
  },
  {
    id: 'sme-erp-myths',
    title: 'Debunking 7 ERP Myths That Hold SMEs Back',
    excerpt: 'Enterprise software isn\'t just for enterprises. We tackle common misconceptions about ERP for small and medium businesses.',
    category: 'SME Focus',
    date: 'October 25, 2025',
    readTime: '6 min read',
    author: 'SiyaBusa Team'
  },
  {
    id: 'audit-ready',
    title: 'Audit-Ready: How Proper Systems Save You Time and Money',
    excerpt: 'Prepare for audits effortlessly by implementing proper controls and documentation from day one.',
    category: 'Compliance',
    date: 'October 18, 2025',
    readTime: '7 min read',
    author: 'Sibusiso Mavuso'
  }
];

const categories = ['All', 'Industry Insights', 'Compliance', 'Financial Management', 'Operations', 'Technology', 'Growth', 'SME Focus'];

const Blog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredPosts = selectedCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

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
            <h1>Blog</h1>
            <p className="subtitle">Insights, guides, and news from the SiyaBusa team</p>
          </header>

          <section className="content-section">
            <div className="blog-filters">
              {categories.map(category => (
                <button
                  key={category}
                  className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          <section className="content-section">
            <div className="blog-grid">
              {filteredPosts.map(post => (
                <article key={post.id} className="blog-card">
                  <div className="blog-card-header">
                    <span className="blog-category">{post.category}</span>
                    <span className="blog-date">{post.date}</span>
                  </div>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <div className="blog-card-footer">
                    <span className="blog-author">{post.author}</span>
                    <span className="blog-read-time">{post.readTime}</span>
                  </div>
                  <Link to={`/blog/${post.id}`} className="read-more">
                    Read Article →
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="content-section cta-section">
            <h2>Stay Updated</h2>
            <p>Subscribe to our newsletter for the latest insights and product updates.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit" className="btn-primary">Subscribe</button>
            </form>
            <p className="newsletter-note">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </section>
        </motion.div>
      </main>

      <footer className="footer-page-footer">
        <p>© {new Date().getFullYear()} SiyaBusa by Masaphokati Technologies (Pty) Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Blog;
