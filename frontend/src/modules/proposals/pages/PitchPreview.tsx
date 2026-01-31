import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownloadOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import './PitchPreview.css';

// Demo data - in real app, this comes from PitchBuilder
const demoPitch = {
  companyName: 'WorldClass ERP',
  projectName: 'Enterprise Digital Transformation',
  clientName: 'Nexus Industries',
  industry: 'Manufacturing',
  tagline: 'Transforming Operations, Maximizing Value',
  
  problemStatement: 'Legacy systems are costing you $2.4M annually in operational inefficiencies, delayed reporting, and missed opportunities.',
  painPoints: [
    'Manual processes consuming 40% of staff time',
    'Data silos preventing real-time decision making',
    '3-week month-end close causing competitive disadvantage',
  ],
  
  solution: 'A unified ERP platform that automates workflows, integrates all business units, and delivers real-time insights for strategic decision-making.',
  valueProps: [
    { title: 'Speed', desc: 'Go live in 12 weeks, not 12 months' },
    { title: 'ROI', desc: '300% return in the first year' },
    { title: 'Support', desc: '24/7 dedicated success team' },
  ],
  
  team: [
    { name: 'Sarah Mitchell', role: 'Project Director', exp: '15+ years enterprise implementations' },
    { name: 'James Chen', role: 'Technical Lead', exp: 'Former Microsoft Azure architect' },
    { name: 'Emily Rodriguez', role: 'Change Management', exp: 'Certified Six Sigma Black Belt' },
  ],
  
  timeline: [
    { phase: 'Discovery', weeks: 2, desc: 'Deep-dive analysis & requirements gathering' },
    { phase: 'Foundation', weeks: 4, desc: 'Core system setup & data migration' },
    { phase: 'Build', weeks: 4, desc: 'Custom configurations & integrations' },
    { phase: 'Launch', weeks: 2, desc: 'Go-live support & optimization' },
  ],
  
  investment: 485000,
  roi: '324%',
  payback: '6 months',
  savings: '$1.8M annually',
  
  caseStudies: [
    {
      company: 'Sterling Manufacturing',
      result: 'Reduced month-end close from 21 days to 3 days',
      metrics: ['92% faster reporting', '$2.1M annual savings', '99.9% system uptime'],
    },
    {
      company: 'Atlas Logistics',
      result: 'Achieved full supply chain visibility across 14 countries',
      metrics: ['40% inventory reduction', '28% efficiency gain', 'ROI in 4 months'],
    },
  ],
  
  callToAction: 'Let\'s schedule your transformation kickoff call',
  urgency: 'Implementation slots for Q1 are filling fast—secure your spot now.',
  guarantee: '60-day satisfaction guarantee with no questions asked.',
};

const PitchPreview: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();

  const totalSlides = 9;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'Escape') {
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0: // Title Slide
        return (
          <div className="pitch-slide title-slide">
            <div className="slide-bg-pattern"></div>
            <div className="title-content">
              <div className="company-badge">{demoPitch.companyName}</div>
              <h1 className="main-title">{demoPitch.projectName}</h1>
              <p className="subtitle">Prepared exclusively for {demoPitch.clientName}</p>
              <div className="title-divider"></div>
              <p className="tagline">{demoPitch.tagline}</p>
            </div>
            <div className="slide-footer">
              <span>CONFIDENTIAL</span>
              <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        );

      case 1: // Problem Slide
        return (
          <div className="pitch-slide problem-slide">
            <div className="slide-header">
              <span className="slide-number">01</span>
              <h2>The Challenge</h2>
            </div>
            <div className="problem-content">
              <div className="problem-statement">
                <span className="quote-mark">"</span>
                <p>{demoPitch.problemStatement}</p>
              </div>
              <div className="pain-points-grid">
                {demoPitch.painPoints.map((point, i) => (
                  <div key={i} className="pain-card">
                    <div className="pain-number">{i + 1}</div>
                    <p>{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Solution Slide
        return (
          <div className="pitch-slide solution-slide">
            <div className="slide-header">
              <span className="slide-number">02</span>
              <h2>Our Solution</h2>
            </div>
            <div className="solution-content">
              <p className="solution-text">{demoPitch.solution}</p>
              <div className="value-cards">
                {demoPitch.valueProps.map((prop, i) => (
                  <div key={i} className="value-card">
                    <div className="value-icon-ring"></div>
                    <h3>{prop.title}</h3>
                    <p>{prop.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Team Slide
        return (
          <div className="pitch-slide team-slide">
            <div className="slide-header">
              <span className="slide-number">03</span>
              <h2>Your Dedicated Team</h2>
            </div>
            <div className="team-content">
              {demoPitch.team.map((member, i) => (
                <div key={i} className="team-member-card">
                  <div className="member-avatar">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3>{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                  <p className="member-exp">{member.exp}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 4: // Timeline Slide
        return (
          <div className="pitch-slide timeline-slide">
            <div className="slide-header">
              <span className="slide-number">04</span>
              <h2>Implementation Roadmap</h2>
            </div>
            <div className="timeline-content">
              <div className="timeline-track">
                {demoPitch.timeline.map((phase, i) => (
                  <div key={i} className="timeline-phase">
                    <div className="phase-marker">
                      <span className="phase-number">{i + 1}</span>
                    </div>
                    <div className="phase-content">
                      <h3>{phase.phase}</h3>
                      <Tag className="duration-tag">{phase.weeks} weeks</Tag>
                      <p>{phase.desc}</p>
                    </div>
                    {i < demoPitch.timeline.length - 1 && (
                      <div className="phase-connector"></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="total-duration">
                <span>Total Duration:</span>
                <strong>{demoPitch.timeline.reduce((acc, p) => acc + p.weeks, 0)} Weeks</strong>
              </div>
            </div>
          </div>
        );

      case 5: // Investment Slide
        return (
          <div className="pitch-slide investment-slide">
            <div className="slide-header">
              <span className="slide-number">05</span>
              <h2>Your Investment</h2>
            </div>
            <div className="investment-content">
              <div className="investment-main">
                <p className="investment-label">Total Investment</p>
                <h1 className="investment-amount">
                  ${demoPitch.investment.toLocaleString()}
                </h1>
              </div>
              <div className="roi-grid">
                <div className="roi-card">
                  <span className="roi-value">{demoPitch.roi}</span>
                  <span className="roi-label">Expected ROI</span>
                </div>
                <div className="roi-card">
                  <span className="roi-value">{demoPitch.payback}</span>
                  <span className="roi-label">Payback Period</span>
                </div>
                <div className="roi-card">
                  <span className="roi-value">{demoPitch.savings}</span>
                  <span className="roi-label">Annual Savings</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 6: // Case Study 1
        return (
          <div className="pitch-slide case-study-slide">
            <div className="slide-header">
              <span className="slide-number">06</span>
              <h2>Success Story</h2>
            </div>
            <div className="case-content">
              <div className="case-company">
                <span className="case-badge">Case Study</span>
                <h3>{demoPitch.caseStudies[0].company}</h3>
              </div>
              <p className="case-result">{demoPitch.caseStudies[0].result}</p>
              <div className="metrics-row">
                {demoPitch.caseStudies[0].metrics.map((metric, i) => (
                  <div key={i} className="metric-badge">
                    {metric}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 7: // Case Study 2
        return (
          <div className="pitch-slide case-study-slide alt">
            <div className="slide-header">
              <span className="slide-number">07</span>
              <h2>Success Story</h2>
            </div>
            <div className="case-content">
              <div className="case-company">
                <span className="case-badge">Case Study</span>
                <h3>{demoPitch.caseStudies[1].company}</h3>
              </div>
              <p className="case-result">{demoPitch.caseStudies[1].result}</p>
              <div className="metrics-row">
                {demoPitch.caseStudies[1].metrics.map((metric, i) => (
                  <div key={i} className="metric-badge">
                    {metric}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 8: // Closing Slide
        return (
          <div className="pitch-slide closing-slide">
            <div className="closing-content">
              <h1>Let's Begin</h1>
              <p className="cta-text">{demoPitch.callToAction}</p>
              <div className="urgency-banner">
                <span className="urgency-icon">⚡</span>
                <span>{demoPitch.urgency}</span>
              </div>
              <div className="guarantee-section">
                <div className="guarantee-badge">✓</div>
                <p>{demoPitch.guarantee}</p>
              </div>
              <div className="contact-cta">
                <a href="mailto:pitch@worldclass-erp.com" className="contact-btn">
                  Schedule Your Kickoff Call
                </a>
              </div>
            </div>
            <div className="closing-footer">
              <span>{demoPitch.companyName}</span>
              <span>•</span>
              <span>Prepared for {demoPitch.clientName}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`pitch-preview-page ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Controls */}
      <div className="preview-controls">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back to Editor
        </Button>
        <div className="slide-indicator">
          {currentSlide + 1} / {totalSlides}
        </div>
        <div className="control-actions">
          <Button icon={<ShareAltOutlined />}>Share</Button>
          <Button icon={<DownloadOutlined />}>Export PDF</Button>
          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? 'Exit' : 'Present'}
          </Button>
        </div>
      </div>

      {/* Slide Container */}
      <div className="slide-container">
        {renderSlide()}
      </div>

      {/* Navigation */}
      <div className="slide-navigation">
        <Button
          shape="circle"
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={prevSlide}
          disabled={currentSlide === 0}
        />
        <div className="slide-dots">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={`dot ${i === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(i)}
            />
          ))}
        </div>
        <Button
          shape="circle"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
        />
      </div>

      {/* Thumbnail Strip */}
      <div className="thumbnail-strip">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div
            key={i}
            className={`thumbnail ${i === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(i)}
          >
            <span>{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PitchPreview;
