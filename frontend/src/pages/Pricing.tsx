/**
 * SiyaBusa ERP - Pricing Page
 * Public pricing page for marketing
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, X, Zap, Building2, Rocket, Crown, Phone, Mail } from 'lucide-react';
import './Pricing.css';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  perUserPrice: number;
  maxUsers: number | 'unlimited';
  popular?: boolean;
  features: string[];
  notIncluded?: string[];
  cta: string;
  icon: React.ReactNode;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses getting started',
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    perUserPrice: 299,
    maxUsers: 10,
    icon: <Zap className="tier-icon" />,
    features: [
      'Financial Accounting',
      'Sales & Invoicing',
      'Basic Inventory',
      'HR Essentials',
      'Up to 10 users',
      '1 Warehouse',
      'Email Support',
      '14-day free trial',
    ],
    notIncluded: [
      'Industry Modules',
      'Multi-Entity',
      'API Access',
      'Priority Support',
    ],
    cta: 'Start Free Trial',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses that need more power',
    monthlyPrice: 3999,
    yearlyPrice: 39990,
    perUserPrice: 449,
    maxUsers: 50,
    popular: true,
    icon: <Building2 className="tier-icon" />,
    features: [
      'Everything in Starter',
      'Purchase Management',
      'Full Inventory & Warehousing',
      'Complete HR & Payroll',
      'Cash Management',
      'Up to 50 users',
      '5 Warehouses',
      '1 Industry Module',
      'Phone & Email Support',
      'Basic Analytics',
    ],
    notIncluded: [
      'Multi-Entity',
      'Asset Management',
      'Custom Integrations',
    ],
    cta: 'Start Free Trial',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for established businesses',
    monthlyPrice: 9999,
    yearlyPrice: 99990,
    perUserPrice: 599,
    maxUsers: 200,
    icon: <Rocket className="tier-icon" />,
    features: [
      'Everything in Professional',
      'All Industry Modules',
      'Multi-Entity & Consolidation',
      'Asset Management (IAS 16)',
      'Project Management',
      'Advanced Analytics & BI',
      'Compliance Hub',
      'API Access',
      'Up to 200 users',
      'Unlimited Warehouses',
      'Dedicated Account Manager',
      'Priority Support (4hr SLA)',
    ],
    cta: 'Contact Sales',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'For large organizations with custom needs',
    monthlyPrice: 24999,
    yearlyPrice: 249990,
    perUserPrice: 499,
    maxUsers: 'unlimited',
    icon: <Crown className="tier-icon" />,
    features: [
      'Everything in Enterprise',
      'Unlimited Users',
      'Unlimited Entities',
      'Custom Integrations',
      'White-labeling Available',
      'On-premise Option',
      '24/7 Support (2hr SLA)',
      'Quarterly Business Reviews',
      'Dedicated Implementation Team',
      'Custom Development Hours',
    ],
    cta: 'Contact Sales',
  },
];

const industryModules = [
  { name: 'Healthcare', price: 2999, description: 'Patient management, medical inventory' },
  { name: 'Mining', price: 3999, description: 'Mineral tracking, safety compliance' },
  { name: 'Construction', price: 2999, description: 'Project costing, progress billing' },
  { name: 'Logistics', price: 2499, description: 'Fleet management, fuel tracking' },
  { name: 'Agriculture', price: 1999, description: 'Crop cycles, farm operations' },
];

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! All plans come with a 14-day free trial. No credit card required to start.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Absolutely. You can upgrade or downgrade at any time. Changes take effect on your next billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, EFT, and debit orders for South African customers.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use bank-grade encryption, and your data is hosted on secure AWS infrastructure in Europe.',
  },
  {
    q: 'Do you offer implementation support?',
    a: 'Yes. Professional and Enterprise plans include guided onboarding. Full implementation services are available for all plans.',
  },
  {
    q: 'Can I integrate with other systems?',
    a: 'Enterprise and Corporate plans include API access for custom integrations. We also have pre-built connectors for popular tools.',
  },
];

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPrice = (tier: PricingTier) => {
    return billingCycle === 'monthly' ? tier.monthlyPrice : Math.round(tier.yearlyPrice / 12);
  };

  const getSavings = (tier: PricingTier) => {
    const monthlyCost = tier.monthlyPrice * 12;
    const yearlyCost = tier.yearlyPrice;
    return Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100);
  };

  const handleSelectPlan = (tierId: string) => {
    if (tierId === 'enterprise' || tierId === 'corporate') {
      navigate('/contact?plan=' + tierId);
    } else {
      navigate('/signup?plan=' + tierId);
    }
  };

  return (
    <div className="pricing-page">
      {/* Header */}
      <header className="pricing-header">
        <div className="pricing-header-content">
          <Link to="/" className="logo">
            <span className="logo-text">SiyaBusa</span>
            <span className="logo-erp">ERP</span>
          </Link>
          <nav className="pricing-nav">
            <Link to="/features">Features</Link>
            <Link to="/pricing" className="active">Pricing</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/signup" className="btn-signup">Start Free Trial</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pricing-hero">
        <h1>Simple, Transparent Pricing</h1>
        <p>Enterprise power at a fraction of the cost. No hidden fees.</p>
        
        {/* Billing Toggle */}
        <div className="billing-toggle">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
          <button 
            className="toggle-switch"
            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
          >
            <span className={`toggle-indicator ${billingCycle}`} />
          </button>
          <span className={billingCycle === 'yearly' ? 'active' : ''}>
            Yearly <span className="save-badge">Save up to 17%</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-cards">
        <div className="pricing-grid">
          {pricingTiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`pricing-card ${tier.popular ? 'popular' : ''}`}
            >
              {tier.popular && <div className="popular-badge">Most Popular</div>}
              
              <div className="card-header">
                {tier.icon}
                <h3>{tier.name}</h3>
                <p className="tier-description">{tier.description}</p>
              </div>

              <div className="card-pricing">
                <div className="price">
                  <span className="currency">R</span>
                  <span className="amount">{getPrice(tier).toLocaleString()}</span>
                  <span className="period">/month</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="yearly-note">
                    Billed annually ({formatPrice(tier.yearlyPrice)}/year)
                    <span className="savings">Save {getSavings(tier)}%</span>
                  </p>
                )}
                <p className="per-user">+ {formatPrice(tier.perUserPrice)}/user/month</p>
              </div>

              <ul className="features-list">
                {tier.features.map((feature, idx) => (
                  <li key={idx}>
                    <CheckCircle className="check-icon" />
                    {feature}
                  </li>
                ))}
                {tier.notIncluded?.map((feature, idx) => (
                  <li key={`not-${idx}`} className="not-included">
                    <X className="x-icon" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                className={`cta-button ${tier.popular ? 'primary' : 'secondary'}`}
                onClick={() => handleSelectPlan(tier.id)}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Industry Modules */}
      <section className="industry-modules">
        <h2>Industry-Specific Modules</h2>
        <p>Add specialized functionality for your industry</p>
        
        <div className="modules-grid">
          {industryModules.map((module) => (
            <div key={module.name} className="module-card">
              <h4>{module.name}</h4>
              <p>{module.description}</p>
              <div className="module-price">
                {formatPrice(module.price)}<span>/month</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="comparison-section">
        <h2>Why Choose SiyaBusa ERP?</h2>
        <p>Built for African businesses, priced for growth</p>
        
        <div className="value-props">
          <div className="value-prop">
            <CheckCircle className="value-icon" />
            <h4>Transparent Pricing</h4>
            <p>No hidden fees, no surprise costs. What you see is what you pay.</p>
          </div>
          <div className="value-prop">
            <CheckCircle className="value-icon" />
            <h4>Local Support</h4>
            <p>South African support team who understands your business environment.</p>
          </div>
          <div className="value-prop">
            <CheckCircle className="value-icon" />
            <h4>SARS Compliant</h4>
            <p>Built-in compliance features for South African tax requirements.</p>
          </div>
          <div className="value-prop">
            <CheckCircle className="value-icon" />
            <h4>14-Day Free Trial</h4>
            <p>Try everything before you commit. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={`faq-item ${expandedFaq === idx ? 'expanded' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <span className="faq-toggle">{expandedFaq === idx ? '−' : '+'}</span>
              </div>
              {expandedFaq === idx && (
                <div className="faq-answer">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Transform Your Business?</h2>
        <p>Start your 14-day free trial today. No credit card required.</p>
        <div className="cta-buttons">
          <button className="btn-primary" onClick={() => navigate('/signup')}>
            Start Free Trial
          </button>
          <button className="btn-secondary" onClick={() => navigate('/contact')}>
            <Phone size={18} /> Talk to Sales
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="pricing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-text">SiyaBusa</span>
            <span className="logo-erp">ERP</span>
            <p>Enterprise power for African businesses</p>
          </div>
          <div className="footer-links">
            <div>
              <h4>Product</h4>
              <Link to="/features">Features</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/industries">Industries</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/careers">Careers</Link>
            </div>
            <div>
              <h4>Support</h4>
              <Link to="/help">Help Center</Link>
              <Link to="/docs">Documentation</Link>
              <Link to="/status">System Status</Link>
            </div>
          </div>
          <div className="footer-contact">
            <h4>Contact Us</h4>
            <p><Mail size={16} /> hello@siyabusa.co.za</p>
            <p><Phone size={16} /> +27 11 123 4567</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 SiyaBusa ERP. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
