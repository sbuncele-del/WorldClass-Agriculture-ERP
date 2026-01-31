import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Zap, Shield, BarChart3, Truck, Users, Building2, Heart, Factory,
  ChevronRight, Check, X, Moon, Sun, Play, ArrowRight, Sparkles,
  Globe, Lock, Clock, TrendingUp, MessageSquare, Calculator,
  Menu, ChevronDown, Star, Award, Target, Layers, Cpu, Database,
  Wheat, HardHat, Stethoscope, Briefcase, Package, Wrench,
  FileCheck, Scale, BadgeCheck, AlertTriangle, BookOpen, Landmark,
  CircleDollarSign, ClipboardCheck, Activity, Leaf, Mountain, Hammer
} from 'lucide-react';
import './LandingPage.css';

// Types
interface ModuleFeature {
  title: string;
  description: string;
}

interface ComplianceItem {
  regulation: string;
  description: string;
}

interface Module {
  icon: React.ReactNode;
  title: string;
  tagline: string;
  businessBenefit: string;
  complianceBenefit: string;
  color: string;
  features: ModuleFeature[];
  compliance: ComplianceItem[];
  keyMetrics: string[];
  cta: string;
}

interface IndustrySolution {
  icon: React.ReactNode;
  industry: string;
  tagline: string;
  description: string;
  color: string;
  challenges: string[];
  solutions: string[];
  compliance: ComplianceItem[];
  roi: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  industry: string;
  result: string;
}

interface ComparisonRow {
  feature: string;
  aetheros: 'full' | 'partial' | 'none';
  traditional: 'full' | 'partial' | 'none';
  accounting: 'full' | 'partial' | 'none';
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

// Particle Background Component
const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      const count = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 170, ${p.opacity})`;
        ctx.fill();

        // Draw connections
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 212, 170, ${0.1 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
};

// 3D Platform Visualization (CSS-based for performance)
const PlatformVisualization: React.FC = () => {
  return (
    <div className="platform-viz">
      <div className="platform-core">
        <div className="core-ring ring-1" />
        <div className="core-ring ring-2" />
        <div className="core-ring ring-3" />
        <div className="core-center">
          <Cpu size={32} />
        </div>
      </div>
      <div className="platform-modules">
        {['Logistics', 'Finance', 'HR', 'Inventory', 'Sales', 'Compliance'].map((module, i) => (
          <motion.div
            key={module}
            className={`floating-module module-${i + 1}`}
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <span>{module}</span>
          </motion.div>
        ))}
      </div>
      <div className="data-streams">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`stream stream-${i + 1}`} />
        ))}
      </div>
    </div>
  );
};

// Navigation Component
const Navigation: React.FC<{ isDark: boolean; toggleTheme: () => void }> = ({ isDark, toggleTheme }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`nav ${isScrolled ? 'scrolled' : ''} ${isDark ? 'dark' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="nav-container">
        <div className="nav-brand">
          <div className="logo-icon">
            <Layers size={24} />
          </div>
          <span className="logo-text">SiyaBusa</span>
        </div>

        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#features">Features</a>
          <a href="#modules">Modules</a>
          <a href="#comparison">Why SiyaBusa</a>
          <a href="#industries">Industries</a>
          <a href="#pricing">Pricing</a>
        </div>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="btn-driver" onClick={() => navigate('/driver')} title="Driver Mobile App">
            🚚 Driver App
          </button>
          <button className="btn-secondary" onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="btn-primary" onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Request Demo
          </button>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu size={24} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

// Hero Section
const HeroSection: React.FC = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 400], [1, 0.9]);

  return (
    <motion.section className="hero" style={{ opacity, scale }}>
      <ParticleBackground />
      
      <div className="hero-content">
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles size={14} />
          <span>AI-Native Business Operating System</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          One System.<br />
          Every Department.<br />
          <span className="gradient-text">Total Clarity.</span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          The first AI-native business operating system that bridges 
          operations and accounting compliance in real-time.
        </motion.p>

        <motion.div
          className="hero-ctas"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button className="btn-primary large">
            <Play size={18} />
            Request AI-Powered Demo
          </button>
          <button className="btn-ghost large">
            Explore Modules
            <ArrowRight size={18} />
          </button>
        </motion.div>

        <motion.div
          className="hero-stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="stat">
            <span className="stat-value">300%</span>
            <span className="stat-label">Average ROI</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">60%</span>
            <span className="stat-label">Time Saved</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">99.9%</span>
            <span className="stat-label">Uptime SLA</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="hero-visual"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <PlatformVisualization />
      </motion.div>

      <div className="hero-scroll-indicator">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown size={24} />
        </motion.div>
      </div>
    </motion.section>
  );
};

// Value Proposition Section
const ValueProposition: React.FC = () => {
  return (
    <section className="value-prop" id="features">
      <div className="container">
        <motion.div
          className="section-header"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="section-badge">Why SiyaBusa</span>
          <h2>Where Business Operations Meet Accounting Compliance</h2>
          <p>Real-time translation between business metrics and accounting standards</p>
        </motion.div>

        <motion.div
          className="value-flow"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="flow-step" variants={fadeInUp}>
            <div className="flow-icon business">
              <TrendingUp size={28} />
            </div>
            <h3>Business Action</h3>
            <p>Record a sale, move inventory, approve a purchase</p>
          </motion.div>

          <div className="flow-arrow">
            <motion.div
              className="arrow-line"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <Sparkles className="ai-spark" size={20} />
          </div>

          <motion.div className="flow-step" variants={fadeInUp}>
            <div className="flow-icon ai">
              <Cpu size={28} />
            </div>
            <h3>AI Translation</h3>
            <p>Instant conversion to proper accounting treatment</p>
          </motion.div>

          <div className="flow-arrow">
            <motion.div
              className="arrow-line"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            />
            <Sparkles className="ai-spark" size={20} />
          </div>

          <motion.div className="flow-step" variants={fadeInUp}>
            <div className="flow-icon compliance">
              <Shield size={28} />
            </div>
            <h3>Compliance Output</h3>
            <p>IFRS, GAAP, Tax-ready entries automatically</p>
          </motion.div>
        </motion.div>

        <motion.div
          className="value-cards"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
            { icon: <Zap />, title: 'AI-Native Architecture', desc: 'Built from the ground up with AI, not bolted on' },
            { icon: <Clock />, title: 'Real-Time Sync', desc: 'Business and accounting always in perfect harmony' },
            { icon: <Globe />, title: 'Multi-Industry Ready', desc: 'Tailored solutions for your specific sector' },
            { icon: <Lock />, title: 'Compliance First', desc: 'IFRS, GAAP, local tax requirements built-in' }
          ].map((card, i) => (
            <motion.div key={i} className="value-card" variants={scaleIn}>
              <div className="card-icon">{card.icon}</div>
              <h4>{card.title}</h4>
              <p>{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// Module Showcase Section - Enhanced with Full Details
const ModuleShowcase: React.FC = () => {
  const [activeModule, setActiveModule] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  const modules: Module[] = [
    {
      icon: <Truck size={32} />,
      title: 'Logistics & Fleet',
      tagline: 'Move Faster. Spend Smarter. Stay Compliant.',
      businessBenefit: 'Real-time fleet tracking, AI-powered route optimization, delivery management with proof-of-delivery',
      complianceBenefit: 'Automated fuel tax calculations, vehicle depreciation schedules, cost allocation by route',
      color: '#00D4AA',
      features: [
        { title: 'Live GPS Tracking', description: 'Know where every vehicle is, in real-time. No more guessing.' },
        { title: 'Smart Route Optimization', description: 'AI calculates the fastest, most fuel-efficient routes automatically.' },
        { title: 'Digital Proof of Delivery', description: 'Client signatures, photos, timestamps — all captured on mobile.' },
        { title: 'Driver Performance Analytics', description: 'Track driving behavior, fuel efficiency, and on-time delivery rates.' },
        { title: 'Maintenance Scheduling', description: 'Predictive maintenance alerts before breakdowns happen.' },
        { title: 'Load Optimization', description: 'Maximize cargo capacity while respecting weight regulations.' }
      ],
      compliance: [
        { regulation: 'IFRS 16', description: 'Automatic lease vs. buy accounting for fleet vehicles' },
        { regulation: 'IAS 16', description: 'Proper asset recognition and depreciation for owned vehicles' },
        { regulation: 'Fuel Tax Compliance', description: 'IFTA/IRP reporting automated by jurisdiction' },
        { regulation: 'Driver Hours Regulations', description: 'Built-in compliance with driving hour limits' }
      ],
      keyMetrics: ['23% fuel cost reduction', '34% faster deliveries', '99.7% on-time rate'],
      cta: 'Transform Your Fleet Operations'
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Financial Management',
      tagline: 'See Your Future. Control Your Cash. Close Faster.',
      businessBenefit: 'Real-time cash flow visibility, automated budgeting, 3-day close cycle',
      complianceBenefit: 'Multi-GAAP reporting, complete audit trails, automated tax calculations',
      color: '#F4B400',
      features: [
        { title: 'Real-Time Dashboards', description: 'Live P&L, balance sheet, and cash flow — updated to the minute.' },
        { title: 'AI Cash Flow Forecasting', description: 'Predict cash positions 30, 60, 90 days out with 94% accuracy.' },
        { title: 'Automated Bank Reconciliation', description: 'AI matches transactions automatically — 10x faster.' },
        { title: 'Multi-Currency Support', description: 'Handle 150+ currencies with automatic rate updates.' },
        { title: 'Expense Management', description: 'Mobile receipt capture with AI categorization.' },
        { title: 'Budgeting & Planning', description: 'Rolling forecasts that adapt as conditions change.' }
      ],
      compliance: [
        { regulation: 'IFRS/GAAP', description: 'Switch between standards with one click — same data, different reports' },
        { regulation: 'SOX Compliance', description: 'Segregation of duties and approval workflows built-in' },
        { regulation: 'Tax Automation', description: 'VAT, GST, sales tax calculated and reported automatically' },
        { regulation: 'Audit Trail', description: 'Every change tracked, timestamped, and attributed' }
      ],
      keyMetrics: ['67% faster month-end close', '$2.4M avg. tax savings found', '100% audit ready'],
      cta: 'Take Control of Your Finances'
    },
    {
      icon: <Users size={32} />,
      title: 'HR & Payroll',
      tagline: 'Attract Top Talent. Pay Accurately. Stay Protected.',
      businessBenefit: 'Full employee lifecycle management, automated payroll, performance analytics',
      complianceBenefit: 'Labor law compliance, tax withholding accuracy, benefits administration',
      color: '#7C3AED',
      features: [
        { title: 'One-Click Payroll', description: 'Process payroll in minutes, not days. Zero calculation errors.' },
        { title: 'Employee Self-Service', description: 'Employees manage leave, payslips, and benefits themselves.' },
        { title: 'Performance Management', description: 'OKRs, 360° reviews, continuous feedback — all integrated.' },
        { title: 'Recruitment Pipeline', description: 'From job posting to onboarding — one seamless flow.' },
        { title: 'Time & Attendance', description: 'Biometric, mobile, or web-based — you choose.' },
        { title: 'Learning Management', description: 'Assign training, track certifications, ensure compliance.' }
      ],
      compliance: [
        { regulation: 'Labor Law Compliance', description: 'Automatic updates for minimum wage, overtime, leave rules by region' },
        { regulation: 'Tax Withholding', description: 'PAYE, FICA, state/local taxes calculated per jurisdiction' },
        { regulation: 'Benefits Compliance', description: 'ACA, pension regulations, benefits reporting automated' },
        { regulation: 'Data Privacy', description: 'GDPR, POPIA compliant employee data handling' }
      ],
      keyMetrics: ['99.9% payroll accuracy', '4.2 days avg. time-to-hire', '89% employee satisfaction'],
      cta: 'Empower Your Workforce'
    },
    {
      icon: <Building2 size={32} />,
      title: 'Inventory & Warehouse',
      tagline: 'Stock Smarter. Ship Faster. Never Run Out.',
      businessBenefit: 'AI-powered demand forecasting, multi-location management, real-time stock visibility',
      complianceBenefit: 'FIFO/LIFO/Weighted Average costing, valuation reports, shrinkage tracking',
      color: '#3B82F6',
      features: [
        { title: 'Demand Forecasting', description: 'AI predicts what you\'ll need before you know you need it.' },
        { title: 'Multi-Location Sync', description: 'See stock across all warehouses in one view.' },
        { title: 'Barcode/RFID Support', description: 'Scan to receive, pick, pack, ship — zero manual entry.' },
        { title: 'Reorder Automation', description: 'Smart reorder points based on lead time and demand.' },
        { title: 'Lot & Serial Tracking', description: 'Full traceability from supplier to customer.' },
        { title: 'Pick Path Optimization', description: 'AI-optimized picking routes cut warehouse time by 40%.' }
      ],
      compliance: [
        { regulation: 'IAS 2', description: 'Inventory valuation per IFRS standards — automatic' },
        { regulation: 'Costing Methods', description: 'FIFO, LIFO, weighted average — switch anytime, full audit trail' },
        { regulation: 'Obsolescence Tracking', description: 'Age analysis and write-down calculations automated' },
        { regulation: 'Cycle Count Compliance', description: 'Perpetual inventory with variance reporting' }
      ],
      keyMetrics: ['94% forecast accuracy', '32% inventory reduction', '99.5% order accuracy'],
      cta: 'Optimize Your Inventory'
    },
    {
      icon: <Factory size={32} />,
      title: 'Manufacturing',
      tagline: 'Build Better. Waste Less. Scale Infinitely.',
      businessBenefit: 'Production planning, quality control, BOM management, shop floor automation',
      complianceBenefit: 'Cost accounting, WIP valuation, scrap tracking, quality certifications',
      color: '#EF4444',
      features: [
        { title: 'Visual Production Planning', description: 'Drag-and-drop scheduling across work centers.' },
        { title: 'BOM Management', description: 'Multi-level bills of materials with version control.' },
        { title: 'Quality Control', description: 'Inspection checkpoints, defect tracking, CAPA workflows.' },
        { title: 'Shop Floor Control', description: 'Real-time job tracking, labor allocation, machine monitoring.' },
        { title: 'MRP Engine', description: 'Material requirements planning that actually works.' },
        { title: 'Yield & Scrap Analysis', description: 'Track efficiency by product, line, shift, or operator.' }
      ],
      compliance: [
        { regulation: 'IAS 2 (Production)', description: 'Proper absorption of production overheads into inventory' },
        { regulation: 'WIP Valuation', description: 'Work-in-progress valued correctly at every stage' },
        { regulation: 'Quality Standards', description: 'ISO 9001, GMP, FDA 21 CFR Part 11 workflows built-in' },
        { regulation: 'Environmental', description: 'Waste tracking for EPA, environmental reporting' }
      ],
      keyMetrics: ['27% productivity increase', '45% scrap reduction', '99.2% quality rate'],
      cta: 'Revolutionize Production'
    },
    {
      icon: <Briefcase size={32} />,
      title: 'Professional Services',
      tagline: 'Bill Accurately. Deliver Excellence. Grow Profitably.',
      businessBenefit: 'Project management, time tracking, resource allocation, client billing',
      complianceBenefit: 'Revenue recognition (IFRS 15), utilization reporting, engagement compliance',
      color: '#EC4899',
      features: [
        { title: 'Project Profitability', description: 'Real-time margin tracking by project, client, or service line.' },
        { title: 'Time Tracking', description: 'Effortless time capture with mobile, desktop, and calendar sync.' },
        { title: 'Resource Planning', description: 'See who\'s available, who\'s overbooked, plan ahead.' },
        { title: 'Client Portal', description: 'Share project status, invoices, documents with clients.' },
        { title: 'Expense Billing', description: 'Capture, approve, and bill expenses in one flow.' },
        { title: 'Retainer Management', description: 'Track prepaid hours, automatic drawdown, renewal alerts.' }
      ],
      compliance: [
        { regulation: 'IFRS 15', description: 'Revenue recognized over time or at a point — automatic' },
        { regulation: 'WIP Accounting', description: 'Unbilled work-in-progress tracked and valued correctly' },
        { regulation: 'Partner Compliance', description: 'Profit distribution, capital accounts, K-1 preparation' },
        { regulation: 'Ethics & Independence', description: 'Conflict checking, engagement letter management' }
      ],
      keyMetrics: ['18% utilization improvement', '23% faster billing', '95% client retention'],
      cta: 'Elevate Your Practice'
    }
  ];

  const currentModule = modules[activeModule];

  return (
    <section className="modules" id="modules">
      <div className="container">
        <motion.div
          className="section-header"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="section-badge">Unified Platform</span>
          <h2>One Platform. Infinite Possibilities.</h2>
          <p className="section-subhead">Every module seamlessly integrates business operations with accounting compliance — no more data silos, no more reconciliation nightmares.</p>
        </motion.div>

        <div className="modules-grid">
          <motion.div
            className="module-tabs"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {modules.map((module, i) => (
              <motion.button
                key={i}
                className={`module-tab ${activeModule === i ? 'active' : ''}`}
                onClick={() => { setActiveModule(i); setShowDetail(false); }}
                variants={fadeInUp}
                whileHover={{ x: 8 }}
                style={{ '--accent-color': module.color } as React.CSSProperties}
              >
                <div className="tab-icon">{module.icon}</div>
                <span>{module.title}</span>
                <ChevronRight size={18} />
              </motion.button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              className={`module-detail ${showDetail ? 'expanded' : ''}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ '--accent-color': currentModule.color } as React.CSSProperties}
            >
              <div className="detail-header">
                <div className="detail-icon">{currentModule.icon}</div>
                <div className="detail-title-group">
                  <h3>{currentModule.title}</h3>
                  <p className="module-tagline">{currentModule.tagline}</p>
                </div>
              </div>

              <div className="detail-benefits">
                <div className="benefit-card business">
                  <div className="benefit-label">
                    <TrendingUp size={16} />
                    Business Benefit
                  </div>
                  <p>{currentModule.businessBenefit}</p>
                </div>

                <div className="benefit-card compliance">
                  <div className="benefit-label">
                    <Shield size={16} />
                    Compliance Benefit
                  </div>
                  <p>{currentModule.complianceBenefit}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="module-metrics">
                {currentModule.keyMetrics.map((metric, i) => (
                  <div key={i} className="metric-badge">
                    <Check size={14} />
                    {metric}
                  </div>
                ))}
              </div>

              <button 
                className="btn-primary"
                onClick={() => setShowDetail(!showDetail)}
              >
                {showDetail ? 'Show Less' : `Learn More About ${currentModule.title}`}
                <ArrowRight size={16} className={showDetail ? 'rotate-up' : ''} />
              </button>

              {/* Expanded Detail View */}
              <AnimatePresence>
                {showDetail && (
                  <motion.div
                    className="module-expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Features Grid */}
                    <div className="expanded-section">
                      <h4><Zap size={18} /> Key Features</h4>
                      <div className="features-grid">
                        {currentModule.features.map((feature, i) => (
                          <div key={i} className="feature-item">
                            <h5>{feature.title}</h5>
                            <p>{feature.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Compliance Section */}
                    <div className="expanded-section compliance-section">
                      <h4><BadgeCheck size={18} /> Built-In Regulatory Compliance</h4>
                      <div className="compliance-grid">
                        {currentModule.compliance.map((item, i) => (
                          <div key={i} className="compliance-item">
                            <div className="compliance-badge">{item.regulation}</div>
                            <p>{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Section */}
                    <div className="expanded-cta">
                      <button className="btn-primary btn-large">
                        {currentModule.cta}
                        <ArrowRight size={18} />
                      </button>
                      <button className="btn-secondary">
                        <Play size={16} />
                        Watch Demo
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

// Industry Solutions Section - NEW
const IndustrySolutions: React.FC = () => {
  const [activeIndustry, setActiveIndustry] = useState<number | null>(null);

  const industries: IndustrySolution[] = [
    {
      icon: <Truck size={36} />,
      industry: 'Logistics & Transportation',
      tagline: 'Deliver More. Spend Less. Stay Compliant.',
      description: 'Purpose-built for freight forwarders, 3PLs, trucking companies, and delivery fleets. From dispatch to delivery, every transaction flows into compliant financials automatically.',
      color: '#00D4AA',
      challenges: [
        'Fuel costs eating into margins',
        'Complex multi-jurisdiction tax compliance',
        'Driver shortage and retention',
        'Asset tracking across locations'
      ],
      solutions: [
        'AI route optimization reduces fuel by 23%',
        'Automatic IFTA/IRP tax calculations',
        'Driver app with real-time communication',
        'GPS + telematics integration'
      ],
      compliance: [
        { regulation: 'IFTA Reporting', description: 'Fuel tax by jurisdiction — calculated automatically' },
        { regulation: 'FMCSA Hours of Service', description: 'ELD integration with violation alerts' },
        { regulation: 'DOT Compliance', description: 'Maintenance records, inspections, certifications tracked' }
      ],
      roi: '340% ROI in Year 1'
    },
    {
      icon: <Wheat size={36} />,
      industry: 'Agriculture & Agribusiness',
      tagline: 'Grow Smarter. Harvest Profits.',
      description: 'From seed to sale, manage farming operations, livestock, processing, and distribution. Track costs by field, crop, or animal — with accounting that understands agricultural cycles.',
      color: '#22C55E',
      challenges: [
        'Seasonal cash flow volatility',
        'Commodity price fluctuations',
        'Traceability requirements',
        'Complex subsidy and grant accounting'
      ],
      solutions: [
        'Cash flow forecasting for harvest cycles',
        'Commodity hedging integration',
        'Farm-to-fork traceability',
        'Grant and subsidy tracking'
      ],
      compliance: [
        { regulation: 'IAS 41', description: 'Biological asset accounting — crops and livestock valued correctly' },
        { regulation: 'Food Safety', description: 'FSMA, GlobalGAP compliance documentation' },
        { regulation: 'Subsidy Compliance', description: 'Farm bill, EU CAP grant tracking and reporting' }
      ],
      roi: '280% ROI in Year 1'
    },
    {
      icon: <Mountain size={36} />,
      industry: 'Mining & Extractives',
      tagline: 'Extract Value. Minimize Risk. Report Accurately.',
      description: 'Manage exploration, extraction, processing, and rehabilitation. Track assets from discovery to decommissioning with accounting that handles stripping costs, reserves, and depletion.',
      color: '#F59E0B',
      challenges: [
        'Complex asset lifecycles',
        'Environmental liabilities',
        'Remote site operations',
        'Commodity revenue volatility'
      ],
      solutions: [
        'Asset tracking from exploration to closure',
        'Rehabilitation provision calculations',
        'Offline-capable mobile for remote sites',
        'Commodity sales and hedging'
      ],
      compliance: [
        { regulation: 'IFRS 6', description: 'Exploration and evaluation asset accounting' },
        { regulation: 'IAS 37', description: 'Mine rehabilitation and closure provisions' },
        { regulation: 'EITI', description: 'Extractive Industries Transparency Initiative reporting' },
        { regulation: 'Mine Safety', description: 'MSHA/HSE compliance tracking and reporting' }
      ],
      roi: '420% ROI in Year 1'
    },
    {
      icon: <Stethoscope size={36} />,
      industry: 'Healthcare & Medical',
      tagline: 'Care Better. Bill Accurately. Stay Compliant.',
      description: 'For hospitals, clinics, laboratories, and medical practices. Manage patients, staff, equipment, and supplies — with billing and compliance that understands healthcare complexity.',
      color: '#EF4444',
      challenges: [
        'Complex billing and reimbursement',
        'Strict regulatory requirements',
        'Equipment maintenance critical',
        'Staff scheduling complexity'
      ],
      solutions: [
        'Automated insurance claim processing',
        'HIPAA-compliant data handling',
        'Preventive maintenance scheduling',
        'AI-powered staff rostering'
      ],
      compliance: [
        { regulation: 'HIPAA', description: 'Patient data privacy and security built into every feature' },
        { regulation: 'IFRS 15 (Healthcare)', description: 'Revenue recognition for bundled services and contracts' },
        { regulation: 'Medical Device Tracking', description: 'FDA UDI compliance, lot tracking, recalls' },
        { regulation: 'CMS Requirements', description: 'Medicare/Medicaid billing compliance' }
      ],
      roi: '310% ROI in Year 1'
    },
    {
      icon: <Hammer size={36} />,
      industry: 'Construction & Engineering',
      tagline: 'Build On Time. On Budget. On Code.',
      description: 'Manage projects from bid to completion. Track costs by project, phase, or cost code — with percentage-of-completion accounting that auditors love.',
      color: '#8B5CF6',
      challenges: [
        'Project cost overruns',
        'Progress billing complexity',
        'Subcontractor management',
        'Retention and warranty tracking'
      ],
      solutions: [
        'Real-time project cost tracking',
        'Automated AIA billing',
        'Subcontractor compliance management',
        'Warranty and defect tracking'
      ],
      compliance: [
        { regulation: 'IFRS 15 (Contracts)', description: 'Percentage-of-completion revenue recognition automated' },
        { regulation: 'Job Costing', description: 'Cost allocation to projects, phases, cost codes' },
        { regulation: 'Certified Payroll', description: 'Davis-Bacon, prevailing wage compliance' },
        { regulation: 'Bonding & Insurance', description: 'Track limits, expirations, certificate management' }
      ],
      roi: '290% ROI in Year 1'
    },
    {
      icon: <Package size={36} />,
      industry: 'Wholesale & Distribution',
      tagline: 'Move Product. Maximize Margins. Scale Effortlessly.',
      description: 'For distributors, wholesalers, and importers. Manage purchasing, warehousing, and sales with pricing, promotions, and rebates that actually work.',
      color: '#3B82F6',
      challenges: [
        'Thin margins require precision',
        'Complex pricing and promotions',
        'Vendor rebate tracking',
        'Multi-warehouse complexity'
      ],
      solutions: [
        'AI-powered price optimization',
        'Automated promotional pricing',
        'Rebate accrual and tracking',
        'Cross-dock and drop-ship support'
      ],
      compliance: [
        { regulation: 'IAS 2', description: 'Inventory valuation with landed cost calculations' },
        { regulation: 'Revenue (Rebates)', description: 'Customer rebate accruals per IFRS 15' },
        { regulation: 'Import Compliance', description: 'Customs, duties, tariff tracking' },
        { regulation: 'Food Safety', description: 'FSMA, cold chain compliance for food distributors' }
      ],
      roi: '260% ROI in Year 1'
    }
  ];

  return (
    <section className="industries-section" id="industries">
      <div className="container">
        <motion.div
          className="section-header"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="section-badge">Industry Solutions</span>
          <h2>Built for Your Industry. Compliant by Default.</h2>
          <p className="section-subhead">Every industry has unique operational challenges and regulatory requirements. SiyaBusa adapts to your world — not the other way around.</p>
        </motion.div>

        <motion.div
          className="industries-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {industries.map((ind, i) => (
            <motion.div
              key={i}
              className={`industry-card ${activeIndustry === i ? 'expanded' : ''}`}
              variants={fadeInUp}
              style={{ '--industry-color': ind.color } as React.CSSProperties}
              onClick={() => setActiveIndustry(activeIndustry === i ? null : i)}
            >
              <div className="industry-header">
                <div className="industry-icon">{ind.icon}</div>
                <div className="industry-title-group">
                  <h3>{ind.industry}</h3>
                  <p className="industry-tagline">{ind.tagline}</p>
                </div>
                <ChevronDown 
                  size={20} 
                  className={`expand-icon ${activeIndustry === i ? 'rotated' : ''}`} 
                />
              </div>

              <p className="industry-description">{ind.description}</p>

              <AnimatePresence>
                {activeIndustry === i && (
                  <motion.div
                    className="industry-expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="industry-columns">
                      <div className="industry-column">
                        <h4><AlertTriangle size={16} /> Industry Challenges</h4>
                        <ul>
                          {ind.challenges.map((c, j) => (
                            <li key={j}><X size={14} className="challenge-icon" /> {c}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="industry-column">
                        <h4><Check size={16} /> SiyaBusa Solutions</h4>
                        <ul>
                          {ind.solutions.map((s, j) => (
                            <li key={j}><Check size={14} className="solution-icon" /> {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="industry-compliance">
                      <h4><Shield size={16} /> Regulatory Compliance Built-In</h4>
                      <div className="compliance-tags">
                        {ind.compliance.map((c, j) => (
                          <div key={j} className="compliance-tag">
                            <span className="tag-name">{c.regulation}</span>
                            <span className="tag-desc">{c.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="industry-roi">
                      <div className="roi-badge">{ind.roi}</div>
                      <button className="btn-primary">
                        See {ind.industry} Demo
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// Comparison Table Section
const ComparisonTable: React.FC = () => {
  const comparisons: ComparisonRow[] = [
    { feature: 'AI-Native Architecture', aetheros: 'full', traditional: 'partial', accounting: 'none' },
    { feature: 'Real-time Business/Accounting Sync', aetheros: 'full', traditional: 'partial', accounting: 'none' },
    { feature: 'Multi-Industry Adaptability', aetheros: 'full', traditional: 'full', accounting: 'none' },
    { feature: 'Automated Compliance Engine', aetheros: 'full', traditional: 'partial', accounting: 'partial' },
    { feature: 'Unified Platform (All Modules)', aetheros: 'full', traditional: 'partial', accounting: 'none' },
    { feature: 'Natural Language Processing', aetheros: 'full', traditional: 'none', accounting: 'none' },
    { feature: 'Predictive Analytics', aetheros: 'full', traditional: 'partial', accounting: 'none' },
    { feature: 'Mobile-First Design', aetheros: 'full', traditional: 'partial', accounting: 'partial' },
    { feature: 'Built-in Audit Trail', aetheros: 'full', traditional: 'partial', accounting: 'partial' },
    { feature: 'Multi-Currency & Multi-Entity', aetheros: 'full', traditional: 'full', accounting: 'partial' }
  ];

  const StatusIcon: React.FC<{ status: 'full' | 'partial' | 'none' }> = ({ status }) => {
    if (status === 'full') return <Check className="status-full" size={18} />;
    if (status === 'partial') return <div className="status-partial">~</div>;
    return <X className="status-none" size={18} />;
  };

  return (
    <section className="comparison" id="comparison">
      <div className="container">
        <motion.div
          className="section-header"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="section-badge">The Clear Choice</span>
          <h2>Why Leaders Choose SiyaBusa</h2>
          <p>See how we compare to legacy solutions</p>
        </motion.div>

        <motion.div
          className="comparison-table-wrapper"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Capability</th>
                <th className="highlight">
                  <div className="th-content">
                    <Layers size={20} />
                    SiyaBusa
                  </div>
                </th>
                <th>Traditional ERPs</th>
                <th>Accounting Software</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td>{row.feature}</td>
                  <td className="highlight"><StatusIcon status={row.aetheros} /></td>
                  <td><StatusIcon status={row.traditional} /></td>
                  <td><StatusIcon status={row.accounting} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div 
          className="comparison-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p>Ready to see the difference for yourself? <strong>10 out of 10</strong> features fully delivered.</p>
          <button 
            className="btn-primary"
            onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Schedule a Demo
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

// AI Demo Section
const AIDemo: React.FC = () => {
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  interface ConversationMessage {
    role: 'user' | 'ai';
    content: string;
    type?: 'processing' | 'confirmation' | 'success' | 'workflow';
  }

  const conversation: ConversationMessage[] = [
    { 
      role: 'user', 
      content: 'We just sold 500 units of Product A to ABC Corp for $50,000' 
    },
    { 
      role: 'ai', 
      type: 'processing',
      content: '🔄 Processing sale transaction...'
    },
    { 
      role: 'ai', 
      type: 'confirmation',
      content: '⚠️ CONFIRMATION REQUIRED\n\nI\'ve analyzed the transaction. Please confirm:\n\n• Customer: ABC Corp (Credit limit: $75,000 | Available: $42,500)\n• Product: Product A — 500 units @ $100/unit\n• Total: $50,000 (excl. tax)\n• Stock available: ✓ 847 units in Warehouse A\n• Payment terms: Net 30 (per customer agreement)\n\nDo you want me to proceed with this sale?'
    },
    { 
      role: 'user', 
      content: 'Yes, proceed' 
    },
    { 
      role: 'ai', 
      type: 'success',
      content: '✅ TRANSACTION RECORDED\n\n📋 Sales Order: SO-2024-4892 created\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\nACCOUNTING ENTRIES (Auto-generated)\n━━━━━━━━━━━━━━━━━━━━━━━━━\n• Dr. Accounts Receivable: $57,500\n• Cr. Revenue: $50,000 (IFRS 15 ✓)\n• Cr. VAT Output: $7,500 (15%)\n• Dr. Cost of Sales: $35,000\n• Cr. Inventory: $35,000 (FIFO applied)\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\nCOMPLIANCE STATUS\n━━━━━━━━━━━━━━━━━━━━━━━━━\n✓ Revenue recognition: IFRS 15 compliant\n✓ Inventory valuation: IAS 2 compliant\n✓ Tax calculation: Jurisdiction verified\n✓ Audit trail: Complete'
    },
    { 
      role: 'ai', 
      type: 'workflow',
      content: '📨 WORKFLOW INITIATED\n\n🔔 Notifications sent:\n• Finance Dept: Awaiting invoice approval\n• Warehouse: Pick list generated (PL-4892)\n• Logistics: Delivery scheduling required\n\n⏳ Pending actions:\n• Invoice approval (Est. time: 2 hours)\n• Stock picking (Assigned to: Warehouse Team A)\n\n💡 Tip: Say "Check status of SO-2024-4892" anytime to track progress.'
    }
  ];

  useEffect(() => {
    if (step < conversation.length - 1) {
      const currentMessage = conversation[step];
      const nextMessage = conversation[step + 1];
      
      // Determine delay based on message type
      let delay = 1500;
      if (nextMessage?.role === 'user') {
        delay = 2500;
      } else if (currentMessage?.type === 'processing') {
        delay = 1000;
      }

      const timer = setTimeout(() => {
        if (nextMessage?.role === 'ai') {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            setStep(prev => prev + 1);
          }, 800);
        } else {
          setStep(prev => prev + 1);
        }
      }, delay);

      return () => clearTimeout(timer);
    } else {
      // Reset after full conversation
      const resetTimer = setTimeout(() => {
        setStep(0);
      }, 8000);
      return () => clearTimeout(resetTimer);
    }
  }, [step]);

  const visibleMessages = conversation.slice(0, step + 1);

  return (
    <section className="ai-demo">
      <div className="container">
        <motion.div
          className="section-header"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="section-badge">AI-Powered</span>
          <h2 className="ai-demo-title">See AI in Action</h2>
          <p className="ai-demo-subtitle">Natural language to complete business + accounting automation</p>
        </motion.div>

        <motion.div
          className="demo-container"
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="demo-header">
            <div className="demo-avatar">
              <Cpu size={20} />
            </div>
            <div>
              <h4>SiyaBusa AI Assistant</h4>
              <span className="online-status">
                <span className="status-dot"></span>
                Always online
              </span>
            </div>
          </div>

          <div className="demo-messages">
            {visibleMessages.map((msg, i) => (
              <motion.div
                key={i}
                className={`demo-message ${msg.role} ${msg.type || ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.role === 'ai' && (
                  <div className="message-header">
                    <Sparkles size={14} />
                    <span>SiyaBusa AI</span>
                  </div>
                )}
                <pre>{msg.content}</pre>
              </motion.div>
            ))}
            {isTyping && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>

          <div className="demo-input">
            <input
              type="text"
              placeholder="Try: 'Check inventory levels' or 'Process a refund'"
              disabled
            />
            <button disabled>
              <MessageSquare size={18} />
            </button>
          </div>

          <div className="demo-footer">
            <div className="compliance-badges">
              <span className="badge"><Shield size={12} /> Audit Ready</span>
              <span className="badge"><Lock size={12} /> SOC 2 Compliant</span>
              <span className="badge"><FileCheck size={12} /> IFRS/GAAP</span>
            </div>
          </div>
        </motion.div>

        <motion.p 
          className="demo-caption"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          Every transaction creates a complete audit trail. Every entry is compliance-checked in real-time.
          <strong> Win every audit.</strong>
        </motion.p>
      </div>
    </section>
  );
};

// Social Proof Section
const SocialProof: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      quote: "SiyaBusa transformed our operations. What used to take our accounting team 3 days now happens automatically.",
      author: "Sarah M.",
      role: "CFO",
      company: "Leading Logistics Company",
      industry: "Logistics",
      result: "80% reduction in month-end closing time"
    },
    {
      quote: "Finally, a system where my operations team and finance team speak the same language.",
      author: "James K.",
      role: "CEO",
      company: "National Retailer",
      industry: "Retail",
      result: "300% ROI in first year"
    },
    {
      quote: "The AI compliance features saved us from costly audit findings. It catches things humans miss.",
      author: "Priya S.",
      role: "Financial Controller",
      company: "Manufacturing Leader",
      industry: "Manufacturing",
      result: "Zero audit findings for 2 years"
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="social-proof">
      <div className="container">
        <motion.div
          className="section-header"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="section-badge">Trusted by Leaders</span>
          <h2>Built by Accountants, Trusted by Business Leaders</h2>
        </motion.div>

        <div className="testimonials-carousel">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              className="testimonial-card"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="quote-icon">"</div>
              <p className="quote-text">{testimonials[activeIndex].quote}</p>
              <div className="testimonial-meta">
                <div className="author-info">
                  <div className="author-avatar">{testimonials[activeIndex].author[0]}</div>
                  <div>
                    <h4>{testimonials[activeIndex].author}</h4>
                    <p>{testimonials[activeIndex].role}, {testimonials[activeIndex].company}</p>
                  </div>
                </div>
                <div className="result-badge">
                  <Award size={16} />
                  {testimonials[activeIndex].result}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="carousel-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(i)}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="trust-badges"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
            { icon: <Shield />, label: 'SOC 2 Type II' },
            { icon: <Lock />, label: 'ISO 27001' },
            { icon: <Globe />, label: 'GDPR Compliant' },
            { icon: <Check />, label: 'IFRS Ready' }
          ].map((badge, i) => (
            <motion.div key={i} className="trust-badge" variants={scaleIn}>
              {badge.icon}
              <span>{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ROI Calculator Section
const ROICalculator: React.FC = () => {
  const [employees, setEmployees] = useState(50);
  const [transactions, setTransactions] = useState(1000);

  const savings = Math.round(employees * 2500 + transactions * 0.5);
  const hours = Math.round(employees * 5 + transactions * 0.01);
  const roi = Math.round((savings / (employees * 200)) * 100);

  return (
    <section className="roi-calculator" id="roi">
      <div className="container">
        <motion.div
          className="section-header"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="section-badge">Calculate Your ROI</span>
          <h2>Your Investment, Quantified</h2>
          <p>See exactly how much time and money SiyaBusa can save your business</p>
        </motion.div>

        <motion.div
          className="calculator-container"
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="calculator-grid">
            <div className="calculator-inputs">
              <h4>Tell us about your business</h4>
              <div className="input-group">
                <label>
                  <Users size={18} />
                  Team Size
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                />
                <div className="input-value-row">
                  <span className="input-hint">10</span>
                  <span className="input-value">{employees} employees</span>
                  <span className="input-hint">500+</span>
                </div>
              </div>

              <div className="input-group">
                <label>
                  <BarChart3 size={18} />
                  Monthly Transactions
                </label>
                <input
                  type="range"
                  min="100"
                  max="50000"
                  step="100"
                  value={transactions}
                  onChange={(e) => setTransactions(Number(e.target.value))}
                />
                <div className="input-value-row">
                  <span className="input-hint">100</span>
                  <span className="input-value">{transactions.toLocaleString()}</span>
                  <span className="input-hint">50K+</span>
                </div>
              </div>
            </div>

            <div className="calculator-results">
              <h4>Your Estimated Returns</h4>
              <div className="result-card highlight">
                <div className="result-icon">
                  <CircleDollarSign size={28} />
                </div>
                <div className="result-value">${savings.toLocaleString()}</div>
                <div className="result-label">Annual Cost Savings</div>
              </div>
              <div className="result-card">
                <div className="result-icon">
                  <Clock size={28} />
                </div>
                <div className="result-value">{hours.toLocaleString()}</div>
                <div className="result-label">Hours Saved Per Year</div>
              </div>
              <div className="result-card">
                <div className="result-icon">
                  <TrendingUp size={28} />
                </div>
                <div className="result-value">{roi}%</div>
                <div className="result-label">Expected ROI</div>
              </div>
            </div>
          </div>

          <div className="calculator-cta">
            <button className="btn-primary btn-large">
              Get Your Custom ROI Analysis
              <ArrowRight size={18} />
            </button>
            <p className="cta-note">Free consultation • No commitment • Results in 24 hours</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// CTA / Demo Form Section
const DemoForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    employees: '',
    industry: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Would integrate with Formspree or backend
    alert('Demo request submitted! We\'ll be in touch within 24 hours.');
  };

  return (
    <section className="demo-form-section" id="demo-form">
      <div className="container">
        <div className="demo-form-grid">
          <motion.div
            className="demo-form-content"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2>Schedule Your Personalized Demo</h2>
            <p>See how SiyaBusa can transform your business operations and accounting compliance.</p>
            
            <ul className="demo-benefits">
              <li><Check size={18} /> 30-minute personalized walkthrough</li>
              <li><Check size={18} /> See your industry-specific modules</li>
              <li><Check size={18} /> Live AI demonstration</li>
              <li><Check size={18} /> Custom ROI analysis</li>
            </ul>

            <div className="demo-guarantee">
              <Shield size={20} />
              <span>No credit card required. No obligation.</span>
            </div>
          </motion.div>

          <motion.form
            className="demo-form"
            onSubmit={handleSubmit}
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>

            <div className="form-group">
              <label>Work Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Corporation"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Employees</label>
                <select
                  value={formData.employees}
                  onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                  required
                >
                  <option value="">Select...</option>
                  <option value="1-50">1-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>

              <div className="form-group">
                <label>Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  required
                >
                  <option value="">Select...</option>
                  <option value="logistics">Logistics & Transport</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail & Wholesale</option>
                  <option value="services">Professional Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary large full-width">
              <Play size={18} />
              Request AI-Powered Demo
            </button>

            <p className="form-note">
              By submitting, you agree to our Privacy Policy and Terms of Service.
            </p>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">
              <Layers size={28} />
              <span>SiyaBusa</span>
            </div>
            <p>The AI-native business operating system that bridges operations and accounting compliance.</p>
            <p className="footer-company">A product of Masaphokati Technologies (Pty) Ltd</p>
            <div className="social-links">
              <a href="https://twitter.com/siyabusa_erp" target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>
              <a href="https://linkedin.com/company/siyabusa" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">in</a>
              <a href="https://youtube.com/@siyabusa" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#modules">Modules</a>
            <a href="#pricing">Pricing</a>
            <Link to="/documentation">Integrations</Link>
            <Link to="/documentation">API</Link>
          </div>

          <div className="footer-links">
            <h4>Solutions</h4>
            <Link to="/case-studies">Logistics</Link>
            <Link to="/case-studies">Healthcare</Link>
            <Link to="/case-studies">Manufacturing</Link>
            <Link to="/case-studies">Professional Services</Link>
          </div>

          <div className="footer-links">
            <h4>Resources</h4>
            <Link to="/documentation">Documentation</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/case-studies">Case Studies</Link>
            <Link to="/support">Support</Link>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/partners">Partners</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} SiyaBusa by Masaphokati Technologies (Pty) Ltd. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/security">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Page Component
const LandingPage: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [isPremium, setIsPremium] = useState(true);

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-landing-theme', isDark ? 'dark' : 'light');
    return () => document.body.removeAttribute('data-landing-theme');
  }, [isDark]);

  return (
    <div className={`landing-page ${isDark ? 'dark' : 'light'}`}>
      <Navigation isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />
      <HeroSection />
      <ValueProposition />
      <ModuleShowcase />
      <IndustrySolutions />
      <ComparisonTable />
      <AIDemo />
      <SocialProof />
      <ROICalculator />
      <DemoForm />
      <Footer />
    </div>
  );
};

export default LandingPage;
