import React, { useState, useEffect } from 'react';
import {
  Button,
  Progress,
  Switch,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DownloadOutlined,
  FullscreenExitOutlined,
  PlayCircleOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Theme configurations - High contrast professional theme
const darkTheme = {
  primary: '#1e3a5f',
  secondary: '#234e3e',
  accent: '#d4a855',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  light: '#f8fafc',
  dark: '#0f172a',
  text: '#1e293b',
  muted: '#64748b',
};

const lightTheme = {
  primary: '#1e40af',
  secondary: '#065f46',
  accent: '#d97706',
  success: '#059669',
  danger: '#dc2626',
  warning: '#f59e0b',
  light: '#ffffff',
  dark: '#1f2937',
  text: '#1f2937',
  muted: '#6b7280',
};

interface SlideProps {
  slideNumber: number;
  totalSlides: number;
  theme: typeof darkTheme;
}

// Consistent slide padding - reduced for 16:9 viewport
const SLIDE_PADDING = '24px 40px';

// ============ SLIDE 1: TITLE ============
const TitleSlide: React.FC<SlideProps> = ({ slideNumber, totalSlides, theme }) => (
  <div style={{
    height: '100%',
    background: `linear-gradient(135deg, #1e3a5f 0%, #2d5a4a 100%)`,
    padding: SLIDE_PADDING,
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, background: theme.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>ATG</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>COFFEE VALUE CHAIN INVESTMENT</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Strategic Initiative for Economic Diversification</div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 10, fontSize: 12 }}>{slideNumber}/{totalSlides}</div>
    </div>

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, color: theme.accent, margin: 0, marginBottom: 12, lineHeight: 1.1 }}>
        Transforming Eswatini's Coffee Sector
      </h1>
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', margin: 0, marginBottom: 24, maxWidth: 600 }}>
        A Strategic Investment for Economic Diversification, Youth Empowerment & Export Revenue Growth
      </p>

      <div style={{ display: 'flex', gap: 16 }}>
        {[
          { label: 'Presented by', value: 'ATG Finance' },
          { label: 'Presented to', value: 'Cabinet of Kingdom of Eswatini' },
          { label: 'Date', value: 'December 2025' },
        ].map((item, idx) => (
          <div key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ background: `rgba(212,168,85,0.15)`, borderLeft: `3px solid ${theme.accent}`, padding: '12px 16px', borderRadius: '0 10px 10px 0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: theme.accent }}>Strategic Alignment</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>Aligned with PM's vision to diversify economy beyond sugar and timber.</div>
    </div>
  </div>
);

// ============ SLIDE 2: THE OPPORTUNITY ============
const OpportunitySlide: React.FC<SlideProps> = ({ slideNumber, totalSlides, theme }) => (
  <div style={{ height: '100%', background: theme.light, padding: SLIDE_PADDING, display: 'flex', flexDirection: 'column', color: theme.text, overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: theme.accent, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>☕</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.muted }}>The Global Opportunity</span>
      </div>
      <div style={{ fontSize: 12, color: theme.muted }}>{slideNumber}/{totalSlides}</div>
    </div>

    <h2 style={{ fontSize: 28, fontWeight: 700, color: theme.primary, margin: 0, marginBottom: 14 }}>A $269 Billion Market Opportunity</h2>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
      {[
        { value: '$269B', label: 'Current Market (2024)', color: theme.primary },
        { value: '$369B', label: 'Projected by 2030', color: theme.success },
        { value: '5.3%', label: 'CAGR Growth Rate', color: theme.accent },
        { value: '2.25B', label: 'Cups Daily', color: theme.secondary },
      ].map((stat, idx) => (
        <div key={idx} style={{ background: '#fff', padding: '14px 12px', borderRadius: 10, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{stat.label}</div>
        </div>
      ))}
    </div>

    <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e5e7eb', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: theme.primary, margin: '0 0 12px 0' }}>Supply-Demand Gap (2024/2025)</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
            <span style={{ fontWeight: 600 }}>Production</span><span style={{ fontWeight: 700, color: theme.danger }}>174.4M bags</span>
          </div>
          <div style={{ height: 24, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '86%', height: '100%', background: theme.danger, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 10, color: '#fff', fontSize: 11, fontWeight: 600 }}>Supply Shortage</div>
          </div>
        </div>
        <div style={{ fontSize: 18, color: theme.muted, fontWeight: 300 }}>vs</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
            <span style={{ fontWeight: 600 }}>Consumption</span><span style={{ fontWeight: 700, color: theme.success }}>180.2M bags</span>
          </div>
          <div style={{ height: 24, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: theme.success, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 10, color: '#fff', fontSize: 11, fontWeight: 600 }}>Growing Demand</div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, padding: '10px 12px', background: '#fef3c7', borderRadius: 6, borderLeft: `3px solid ${theme.warning}`, fontSize: 12 }}>
        <strong>Key Insight:</strong> Demand outstrips supply by ~6M bags annually - opportunity for new producers.
      </div>
    </div>
  </div>
);

// ============ SLIDE 3: CLIMATE THREAT ============
const ClimateSlide: React.FC<SlideProps> = ({ slideNumber, totalSlides, theme }) => (
  <div style={{ height: '100%', background: theme.light, padding: SLIDE_PADDING, display: 'flex', flexDirection: 'column', color: theme.text, overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: theme.warning, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚠️</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: theme.muted }}>The Climate Challenge</span>
      </div>
      <div style={{ fontSize: 13, color: theme.muted }}>{slideNumber}/{totalSlides}</div>
    </div>

    <h2 style={{ fontSize: 28, fontWeight: 700, color: theme.primary, margin: '0 0 6px 0' }}>Climate Change Creates Opportunity</h2>
    <p style={{ fontSize: 14, color: theme.muted, margin: '0 0 16px 0' }}>As traditional regions become unsuitable, Eswatini can emerge as a key supplier.</p>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: 16, color: theme.danger, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px 0' }}>🔥 The Global Threat</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: theme.danger, lineHeight: 1 }}>50%</div>
          <div style={{ fontSize: 14, color: theme.text }}>of coffee land unsuitable <strong>by 2050</strong></div>
        </div>
        <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, borderLeft: `3px solid ${theme.danger}`, marginTop: 'auto' }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: theme.danger }}>Arabica Vulnerability</div>
          <div style={{ fontSize: 12, color: theme.text }}>Arabica (60-70% of market) is highly sensitive to temperature.</div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 16, color: theme.success, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px 0' }}>🌱 Eswatini's Advantage</h3>
        {[
          { title: 'High-Altitude Terrain', desc: 'Highveld ideal for premium Arabica' },
          { title: 'Climate Resilient', desc: 'Agroforestry mitigates risks' },
          { title: 'First-Mover Advantage', desc: 'Establish early as reliable supplier' },
        ].map((item, idx) => (
          <div key={idx} style={{ padding: 10, background: '#f0fdf4', borderRadius: 6, borderLeft: `3px solid ${theme.success}`, marginBottom: idx < 2 ? 8 : 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: theme.success }}>{item.title}</div>
            <div style={{ fontSize: 12, color: theme.text }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============ SLIDE 4: ESWATINI CURRENT STATE ============
const CurrentStateSlide: React.FC<SlideProps> = ({ slideNumber, totalSlides, theme }) => (
  <div style={{ height: '100%', background: theme.light, padding: SLIDE_PADDING, display: 'flex', flexDirection: 'column', color: theme.text, overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: theme.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🇸🇿</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: theme.muted }}>Current State Analysis</span>
      </div>
      <div style={{ fontSize: 13, color: theme.muted }}>{slideNumber}/{totalSlides}</div>
    </div>

    <h2 style={{ fontSize: 28, fontWeight: 700, color: theme.primary, margin: '0 0 20px 0' }}>Eswatini's Coffee Trade Imbalance</h2>

    <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 20 }}>
      <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center', border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 14, color: theme.muted, marginBottom: 12, fontWeight: 600 }}>Coffee Exports</div>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '20px 40px', background: theme.success, borderRadius: 12, color: '#fff' }}>
          <div style={{ fontSize: 36, fontWeight: 800 }}>$267K</div>
          <div style={{ fontSize: 13 }}>Raw green beans</div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: theme.muted }}>Markets: Senegal, UAE, UK, Austria</div>
      </div>

      <div style={{ fontSize: 32, color: theme.danger, fontWeight: 300 }}>→</div>

      <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center', border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 14, color: theme.muted, marginBottom: 12, fontWeight: 600 }}>Coffee Imports</div>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '20px 40px', background: theme.danger, borderRadius: 12, color: '#fff' }}>
          <div style={{ fontSize: 36, fontWeight: 800 }}>$2.32M</div>
          <div style={{ fontSize: 13 }}>Processed/instant coffee</div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: theme.muted }}>Sources: South Africa, Ethiopia, Tanzania</div>
      </div>
    </div>

    <div style={{ background: `linear-gradient(135deg, #1e3a5f 0%, #2d5a4a 100%)`, padding: 16, borderRadius: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ fontSize: 48, fontWeight: 800, color: theme.accent }}>8.7x</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Trade Deficit Ratio</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>Eswatini imports <strong>8.7x more coffee</strong> than it exports — massive <strong>import substitution</strong> opportunity.</div>
      </div>
    </div>
  </div>
);

// ============ SLIDE 5: THE SOLUTION ============
const SolutionSlide: React.FC<SlideProps> = ({ slideNumber, totalSlides, theme }) => (
  <div style={{ height: '100%', background: `linear-gradient(135deg, #1e3a5f 0%, #2d5a4a 100%)`, padding: SLIDE_PADDING, display: 'flex', flexDirection: 'column', color: '#fff', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: theme.accent, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💡</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Our Strategic Solution</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{slideNumber}/{totalSlides}</div>
    </div>

    <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 4, color: '#fff' }}>Vertical Integration Strategy</h2>
    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: '0 0 16px 0' }}>Capturing value at every stage — from farm to cup.</p>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', flex: 1, gap: 6 }}>
      {[
        { icon: '🌱', title: 'CULTIVATION', sub: 'Smallholder Farms', details: ['200+ farmers', 'Youth focus'] },
        { icon: '🏭', title: 'PROCESSING', sub: 'Local Facility', details: ['Washed process', 'Quality control'] },
        { icon: '🔥', title: 'ROASTING', sub: 'In-Country', details: ['Specialty grades', 'Higher margins'] },
        { icon: '📦', title: 'PACKAGING', sub: 'Export Ready', details: ['Retail packs', 'Certifications'] },
        { icon: '🌍', title: 'DISTRIBUTION', sub: 'Global Markets', details: ['SADC region', 'EU markets'] },
      ].map((s, idx) => (
        <React.Fragment key={idx}>
          <div style={{ textAlign: 'center', flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 8, border: `2px solid ${theme.accent}` }}>{s.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginBottom: 2, color: theme.accent }}>{s.title}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{s.sub}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{s.details.map((d, i) => <div key={i}>• {d}</div>)}</div>
          </div>
          {idx < 4 && <div style={{ fontSize: 18, color: theme.accent, display: 'flex', alignItems: 'center', fontWeight: 700 }}>→</div>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

// ============ SLIDE 6: MARKET TRENDS ============
const TrendsSlide: React.FC<SlideProps> = ({ slideNumber, totalSlides, theme }) => (
  <div style={{ height: '100%', background: theme.light, padding: SLIDE_PADDING, display: 'flex', flexDirection: 'column', color: theme.text, overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: theme.success, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📈</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.muted }}>Market Trends</span>
      </div>
      <div style={{ fontSize: 12, color: theme.muted }}>{slideNumber}/{totalSlides}</div>
    </div>

    <h2 style={{ fontSize: 26, fontWeight: 700, color: theme.primary, margin: 0, marginBottom: 14 }}>Premium Coffee is the Future</h2>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, flex: 1 }}>
      {[
        { icon: '☕', title: 'Specialty Coffee', desc: 'Single-origin beans with high cupping scores command premium prices.', fit: 'Unique Eswatini terroir' },
        { icon: '🌿', title: 'Sustainability', desc: 'Fairtrade & Rainforest Alliance certifications drive buyer decisions.', fit: 'Agroforestry model' },
        { icon: '🌍', title: 'African Origin', desc: "Ethiopia shows African coffee commands premium pricing.", fit: 'Coffee = 33.8% of Ethiopian exports' },
      ].map((item, idx) => (
        <div key={idx} style={{ background: '#fff', padding: '16px 14px', borderRadius: 12, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.primary, margin: '0 0 6px 0' }}>{item.title}</h3>
          <p style={{ fontSize: 12, color: theme.text, margin: '0 0 10px 0', flex: 1, lineHeight: 1.4 }}>{item.desc}</p>
          <div style={{ padding: '8px 10px', background: '#f0fdf4', borderRadius: 6, fontSize: 11, borderLeft: `3px solid ${theme.success}` }}><strong style={{ color: theme.success }}>Fit:</strong> {item.fit}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', gap: 14, marginTop: 14, padding: '14px 16px', background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
      {[
        { value: '66%', label: 'US adults drink coffee daily' },
        { value: '12kg', label: 'Per capita (Finland #1)' },
        { value: '60-70%', label: 'Market share is Arabica' },
        { value: 'Rising', label: 'RTD cold brew demand', isGreen: true },
      ].map((stat, idx) => (
        <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: stat.isGreen ? theme.success : theme.primary }}>{stat.value}</div>
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{stat.label}</div>
        </div>
      ))}
    </div>
  </div>
);

// ============ SLIDE 7: GOVERNMENT SUPPORT ============
const GovernmentSlide: React.FC<SlideProps> = ({ slideNumber, totalSlides, theme }) => (
  <div style={{ height: '100%', background: theme.light, padding: SLIDE_PADDING, display: 'flex', flexDirection: 'column', color: theme.text, overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: theme.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏛️</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: theme.muted }}>Government & Institutional Support</span>
      </div>
      <div style={{ fontSize: 13, color: theme.muted }}>{slideNumber}/{totalSlides}</div>
    </div>

    <h2 style={{ fontSize: 28, fontWeight: 700, color: theme.primary, margin: '0 0 16px 0' }}>Strategic National Priority</h2>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
      <div style={{ background: `linear-gradient(135deg, #1e3a5f 0%, #2d5a4a 100%)`, padding: 20, borderRadius: 12, color: '#fff' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>👔</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, margin: '0 0 10px 0' }}>Prime Minister Russell Dlamini</h3>
        <blockquote style={{ fontSize: 13, fontStyle: 'italic', borderLeft: `2px solid ${theme.accent}`, paddingLeft: 12, margin: '0 0 12px 0', color: 'rgba(255,255,255,0.95)' }}>
          "Coffee identified as key driver for economic growth, replicating Ethiopian success."
        </blockquote>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 6 }}>
          <strong style={{ color: theme.accent }}>Focus:</strong> Youth employment, women empowerment, non-traditional exports
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { name: 'Eswatini Coffee Association', role: 'Industry governance & training' },
          { name: 'FAO', role: 'Nursery & capacity building' },
          { name: 'European Union (EU)', role: 'Development funding' },
          { name: 'Intl Trade Centre (ITC)', role: 'Market access & export' },
        ].map((p, idx) => (
          <div key={idx} style={{ background: '#fff', padding: 12, borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'flex-start', gap: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.success, marginTop: 4, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: theme.primary }}>{p.name}</div>
              <div style={{ fontSize: 11, color: theme.muted }}>{p.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============ SLIDE 8: NEXT STEPS ============
const NextStepsSlide: React.FC<SlideProps> = ({ slideNumber, totalSlides, theme }) => (
  <div style={{ height: '100%', background: theme.light, padding: SLIDE_PADDING, display: 'flex', flexDirection: 'column', color: theme.text, overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: theme.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎯</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: theme.muted }}>Implementation Roadmap</span>
      </div>
      <div style={{ fontSize: 13, color: theme.muted }}>{slideNumber}/{totalSlides}</div>
    </div>

    <h2 style={{ fontSize: 28, fontWeight: 700, color: theme.primary, margin: '0 0 16px 0' }}>Recommended Next Steps</h2>

    <div style={{ display: 'flex', gap: 16, flex: 1 }}>
      {[
        { step: '01', title: 'Site Selection & Water Audit', details: ['Water resource assessment', 'Borehole capacity', 'River rights & dam'], color: theme.success },
        { step: '02', title: 'Processing Feasibility', details: ['Capital cost analysis', 'Operating model', 'Huller, roaster, storage'], color: theme.primary },
        { step: '03', title: 'By-Product Pilot', details: ['Partner with ECA', 'Zero-waste model', 'Cascara (cherry tea)'], color: theme.accent },
      ].map((item, idx) => (
        <div key={idx} style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: item.color, padding: 14, color: '#fff' }}>
            <div style={{ fontSize: 28, fontWeight: 800, opacity: 0.3 }}>{item.step}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: -12 }}>{item.title}</div>
          </div>
          <div style={{ padding: 14, flex: 1 }}>
            {item.details.map((d, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < 2 ? '1px solid #e2e8f0' : 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: item.color, fontWeight: 700 }}>✓</span> {d}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============ SLIDE 9: CALL TO ACTION ============
const CTASlide: React.FC<SlideProps> = ({ slideNumber, totalSlides, theme }) => (
  <div style={{ height: '100%', background: `linear-gradient(135deg, #1e3a5f 0%, #2d5a4a 100%)`, padding: SLIDE_PADDING, display: 'flex', flexDirection: 'column', color: '#fff', textAlign: 'center', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>☕</div>
    
    <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, marginBottom: 10, lineHeight: 1.2 }}>
      Let's Build Eswatini's <span style={{ color: theme.accent }}>Coffee Future Together</span>
    </h2>
    
    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', maxWidth: 600, marginBottom: 24, margin: '0 0 24px 0' }}>
      More than an investment—a chance to transform the Kingdom's economy, empower youth, and create sustainable exports.
    </p>

    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      {[
        { label: 'REPLICATE SUCCESS OF', value: "Ethiopia's Coffee Model", sub: '33.8% of export earnings' },
        { label: 'TARGET MARKET', value: '$269 Billion Global', sub: 'Growing 5.3% annually' },
        { label: 'IMPORT SUBSTITUTION', value: '$2.32M Opportunity', sub: 'Currently spent on imports' },
      ].map((item, idx) => (
        <div key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '14px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4, letterSpacing: 0.5 }}>{item.label}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{item.value}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{item.sub}</div>
        </div>
      ))}
    </div>

    <div style={{ padding: '12px 28px', background: theme.accent, borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#1e3a5f' }}>
      Presented by ATG Finance • December 2025
    </div>

    <div style={{ position: 'absolute', bottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{slideNumber}/{totalSlides}</div>
  </div>
);

// ============ MAIN COMPONENT ============
const CoffeePitchDeck: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);

  const theme = isLightTheme ? lightTheme : darkTheme;

  const slides = [TitleSlide, OpportunitySlide, ClimateSlide, CurrentStateSlide, SolutionSlide, TrendsSlide, GovernmentSlide, NextStepsSlide, CTASlide];
  const totalSlides = slides.length;
  const CurrentSlideComponent = slides[currentSlide];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
      else if (e.key === 'ArrowLeft') setCurrentSlide(prev => Math.max(prev - 1, 0));
      else if (e.key === 'Escape') setIsPresenting(false);
      else if (e.key === 'f' || e.key === 'F') setIsPresenting(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides]);

  if (isPresenting) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 9999 }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '1600px', aspectRatio: '16/9', overflow: 'hidden' }}>
            <CurrentSlideComponent slideNumber={currentSlide + 1} totalSlides={totalSlides} theme={theme} />
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
          {slides.map((_, idx) => (
            <div key={idx} onClick={() => setCurrentSlide(idx)} style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: idx === currentSlide ? theme.accent : 'rgba(255,255,255,0.3)', cursor: 'pointer' }} />
          ))}
        </div>
        <Button icon={<FullscreenExitOutlined />} onClick={() => setIsPresenting(false)} style={{ position: 'absolute', top: 20, right: 20 }}>Exit (ESC)</Button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a' }}>
      <div style={{ padding: '10px 20px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="text" icon={<HomeOutlined />} style={{ color: '#fff' }} onClick={() => navigate('/app/proposals')}>Back</Button>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Coffee Value Chain Investment Pitch</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>Theme:</span>
          <Switch checkedChildren="Light" unCheckedChildren="Dark" checked={isLightTheme} onChange={setIsLightTheme} />
          <Button icon={<PlayCircleOutlined />} onClick={() => setIsPresenting(true)}>Present (F)</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => window.print()}>Print / PDF</Button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 170, backgroundColor: '#1e293b', borderRight: '1px solid #334155', padding: 10, overflowY: 'auto' }}>
          {slides.map((SlideComp, idx) => (
            <div key={idx} onClick={() => setCurrentSlide(idx)} style={{ marginBottom: 8, border: currentSlide === idx ? `2px solid ${theme.accent}` : '2px solid transparent', borderRadius: 6, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 2, left: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '1px 5px', borderRadius: 3, fontSize: 9, zIndex: 1 }}>{idx + 1}</div>
              <div style={{ transform: 'scale(0.12)', transformOrigin: 'top left', width: 1200, height: 675 }}>
                <SlideComp slideNumber={idx + 1} totalSlides={totalSlides} theme={theme} />
              </div>
              <div style={{ height: 81, marginTop: -594 }} />
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0f172a' }}>
          <div style={{ width: '100%', maxWidth: 950, aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <CurrentSlideComponent slideNumber={currentSlide + 1} totalSlides={totalSlides} theme={theme} />
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 20px', backgroundColor: '#1e293b', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <Button icon={<ArrowLeftOutlined />} disabled={currentSlide === 0} onClick={() => setCurrentSlide(prev => prev - 1)}>Previous</Button>
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Progress percent={((currentSlide + 1) / totalSlides) * 100} showInfo={false} style={{ width: 160 }} strokeColor={theme.accent} />
          <span style={{ fontSize: 13 }}>Slide {currentSlide + 1} of {totalSlides}</span>
        </div>
        <Button icon={<ArrowRightOutlined />} disabled={currentSlide === totalSlides - 1} onClick={() => setCurrentSlide(prev => prev + 1)}>Next</Button>
      </div>
    </div>
  );
};

export default CoffeePitchDeck;
