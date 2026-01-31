import React, { useState, useRef } from 'react';
import {
  Card,
  Button,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Progress,
  Tooltip,
  Modal,
  message,
  Upload,
  Tabs,
  ColorPicker,
  Slider,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
  CopyOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  TeamOutlined,
  BankOutlined,
  GlobalOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  AimOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  PercentageOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PictureOutlined,
  LayoutOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  SaveOutlined,
  FullscreenOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Slide Types for Investment Pitches
type SlideType = 
  | 'title'
  | 'problem'
  | 'solution'
  | 'market'
  | 'business-model'
  | 'traction'
  | 'financials'
  | 'investment'
  | 'team'
  | 'timeline'
  | 'risks'
  | 'call-to-action'
  | 'custom';

interface SlideData {
  id: string;
  type: SlideType;
  title: string;
  subtitle?: string;
  content: any;
  design: {
    backgroundColor: string;
    accentColor: string;
    textColor: string;
    layout: 'centered' | 'left' | 'split' | 'grid';
  };
}

interface PitchDeck {
  id: string;
  name: string;
  company: string;
  logo?: string;
  targetAudience: string;
  investmentAsk: number;
  currency: string;
  slides: SlideData[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

const InvestmentPitchBuilder: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const [deck, setDeck] = useState<PitchDeck>({
    id: `pitch-${Date.now()}`,
    name: 'Investment Proposal',
    company: 'Your Company',
    targetAudience: 'Investors',
    investmentAsk: 0,
    currency: 'ZAR',
    slides: [
      {
        id: 'slide-1',
        type: 'title',
        title: 'Your Investment Opportunity',
        subtitle: 'Strategic Initiative for Growth',
        content: {
          presentedBy: 'Your Company',
          presentedTo: 'Target Investor',
          investmentAsk: 14315710,
          year: 2025,
          returnRate: 15,
          tagline: 'A Strategic Investment for Impact',
        },
        design: {
          backgroundColor: '#1a365d',
          accentColor: '#38a169',
          textColor: '#ffffff',
          layout: 'centered',
        },
      },
    ],
    theme: {
      primaryColor: '#1a365d',
      secondaryColor: '#2d3748',
      accentColor: '#38a169',
      fontFamily: 'Inter, sans-serif',
    },
  });

  // Slide Templates
  const slideTemplates: Record<SlideType, { name: string; icon: React.ReactNode; defaultContent: any }> = {
    title: {
      name: 'Title Slide',
      icon: <LayoutOutlined />,
      defaultContent: {
        presentedBy: '',
        presentedTo: '',
        investmentAsk: 0,
        year: new Date().getFullYear(),
        returnRate: 0,
        tagline: '',
      },
    },
    problem: {
      name: 'Problem / Challenge',
      icon: <WarningOutlined />,
      defaultContent: {
        headline: 'The Challenge',
        stats: [
          { label: 'Current State', value: '24%', description: 'Local Production', color: '#38a169' },
          { label: 'Gap', value: '76%', description: 'Imported', color: '#e53e3e' },
        ],
        keyMetrics: [
          { value: '88M', label: 'Annual Consumption (Liters)' },
          { value: 'R9/L', label: 'Production Cost' },
        ],
        description: '',
      },
    },
    solution: {
      name: 'Our Solution',
      icon: <BulbOutlined />,
      defaultContent: {
        headline: 'Our Strategic Solution',
        description: '',
        pillars: [
          { icon: 'sourcing', title: 'SOURCING', subtitle: '', description: '' },
          { icon: 'processing', title: 'PROCESSING', subtitle: '', description: '' },
          { icon: 'distribution', title: 'DISTRIBUTION', subtitle: '', description: '' },
        ],
      },
    },
    market: {
      name: 'Market Opportunity',
      icon: <GlobalOutlined />,
      defaultContent: {
        headline: 'Market Opportunity',
        tam: { value: 0, label: 'Total Addressable Market' },
        sam: { value: 0, label: 'Serviceable Market' },
        som: { value: 0, label: 'Target Market' },
        growth: { rate: 0, period: '5 years' },
        trends: [],
      },
    },
    'business-model': {
      name: 'Business Model',
      icon: <BankOutlined />,
      defaultContent: {
        headline: 'Business Model',
        products: [
          { name: 'Product 1', production: '', packaging: '', shelfLife: '', targetMarket: '', pricing: '' },
        ],
        revenueStreams: [],
        margins: { gross: 0, net: 0 },
      },
    },
    traction: {
      name: 'Traction & Milestones',
      icon: <TrophyOutlined />,
      defaultContent: {
        headline: 'Our Progress',
        milestones: [],
        metrics: [],
        partnerships: [],
      },
    },
    financials: {
      name: 'Financial Projections',
      icon: <BarChartOutlined />,
      defaultContent: {
        headline: 'Financial Projections',
        years: [2025, 2026, 2027, 2028, 2029],
        revenue: [],
        costs: [],
        profit: [],
        breakeven: '',
      },
    },
    investment: {
      name: 'Investment Ask',
      icon: <DollarOutlined />,
      defaultContent: {
        headline: 'Investment Opportunity',
        amount: 0,
        equity: 0,
        valuation: 0,
        useOfFunds: [],
        returns: { irr: 0, payback: '', multiple: 0 },
      },
    },
    team: {
      name: 'Team',
      icon: <TeamOutlined />,
      defaultContent: {
        headline: 'Leadership Team',
        members: [],
        advisors: [],
      },
    },
    timeline: {
      name: 'Implementation Timeline',
      icon: <CalendarOutlined />,
      defaultContent: {
        headline: 'Implementation Roadmap',
        phases: [],
      },
    },
    risks: {
      name: 'Risk Mitigation',
      icon: <SafetyCertificateOutlined />,
      defaultContent: {
        headline: 'Risk Analysis & Mitigation',
        risks: [],
      },
    },
    'call-to-action': {
      name: 'Call to Action',
      icon: <ThunderboltOutlined />,
      defaultContent: {
        headline: 'Next Steps',
        action: '',
        contact: { name: '', email: '', phone: '' },
        deadline: '',
      },
    },
    custom: {
      name: 'Custom Slide',
      icon: <FileTextOutlined />,
      defaultContent: {
        headline: '',
        body: '',
      },
    },
  };

  const addSlide = (type: SlideType) => {
    const template = slideTemplates[type];
    const newSlide: SlideData = {
      id: `slide-${Date.now()}`,
      type,
      title: template.name,
      content: { ...template.defaultContent },
      design: {
        backgroundColor: deck.theme.primaryColor,
        accentColor: deck.theme.accentColor,
        textColor: '#ffffff',
        layout: 'centered',
      },
    };
    setDeck(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setCurrentSlide(deck.slides.length);
    message.success(`Added ${template.name}`);
  };

  const updateSlide = (slideId: string, updates: Partial<SlideData>) => {
    setDeck(prev => ({
      ...prev,
      slides: prev.slides.map(s => s.id === slideId ? { ...s, ...updates } : s),
    }));
  };

  const deleteSlide = (slideId: string) => {
    if (deck.slides.length <= 1) {
      message.warning('Cannot delete the last slide');
      return;
    }
    setDeck(prev => ({
      ...prev,
      slides: prev.slides.filter(s => s.id !== slideId),
    }));
    if (currentSlide >= deck.slides.length - 1) {
      setCurrentSlide(Math.max(0, currentSlide - 1));
    }
  };

  const duplicateSlide = (slideId: string) => {
    const slide = deck.slides.find(s => s.id === slideId);
    if (slide) {
      const newSlide = {
        ...slide,
        id: `slide-${Date.now()}`,
        title: `${slide.title} (Copy)`,
      };
      const index = deck.slides.findIndex(s => s.id === slideId);
      const newSlides = [...deck.slides];
      newSlides.splice(index + 1, 0, newSlide);
      setDeck(prev => ({ ...prev, slides: newSlides }));
      message.success('Slide duplicated');
    }
  };

  // Render individual slide preview
  const renderSlidePreview = (slide: SlideData, isActive: boolean = false) => {
    const scale = isActive ? 1 : 0.15;
    
    return (
      <div
        style={{
          width: isActive ? '100%' : 160,
          height: isActive ? '100%' : 90,
          backgroundColor: slide.design.backgroundColor,
          borderRadius: 8,
          overflow: 'hidden',
          position: 'relative',
          cursor: isActive ? 'default' : 'pointer',
          border: isActive ? 'none' : '2px solid transparent',
          transition: 'all 0.2s',
        }}
      >
        {renderSlideContent(slide, isActive)}
      </div>
    );
  };

  // Render slide content based on type
  const renderSlideContent = (slide: SlideData, isFullSize: boolean = false) => {
    const { type, content, design } = slide;
    const fontSize = isFullSize ? 1 : 0.3;

    switch (type) {
      case 'title':
        return (
          <div style={{ 
            padding: isFullSize ? 60 : 10, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            color: design.textColor,
          }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: isFullSize ? 40 : 8,
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: isFullSize ? 16 : 4,
              }}>
                <div style={{ 
                  width: isFullSize ? 50 : 12, 
                  height: isFullSize ? 50 : 12, 
                  backgroundColor: design.accentColor,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isFullSize ? 20 : 6,
                  fontWeight: 'bold',
                }}>
                  {deck.company.substring(0, 3).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: isFullSize ? 16 : 5, fontWeight: 600 }}>
                    {slide.title}
                  </div>
                  {slide.subtitle && (
                    <div style={{ fontSize: isFullSize ? 12 : 4, opacity: 0.8 }}>
                      {slide.subtitle}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ 
                fontSize: isFullSize ? 14 : 4,
                opacity: 0.7,
              }}>
                1/{deck.slides.length}
              </div>
            </div>

            {/* Green line */}
            <div style={{ 
              height: isFullSize ? 4 : 1, 
              backgroundColor: design.accentColor,
              marginBottom: isFullSize ? 60 : 12,
            }} />

            {/* Main Title */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h1 style={{ 
                fontSize: isFullSize ? 48 : 10, 
                fontWeight: 700, 
                color: design.accentColor,
                margin: 0,
                marginBottom: isFullSize ? 20 : 4,
              }}>
                {content.tagline || 'Your Investment Opportunity'}
              </h1>
              <p style={{ 
                fontSize: isFullSize ? 20 : 5, 
                opacity: 0.9,
                margin: 0,
                marginBottom: isFullSize ? 40 : 8,
              }}>
                {slide.subtitle || 'A Strategic Investment for Growth and Impact'}
              </p>

              {/* Info boxes */}
              <div style={{ 
                display: 'flex', 
                gap: isFullSize ? 20 : 4,
                marginBottom: isFullSize ? 40 : 8,
              }}>
                <div style={{ 
                  padding: isFullSize ? '16px 24px' : '4px 6px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: isFullSize ? 12 : 3, opacity: 0.7 }}>Presented by</div>
                  <div style={{ fontSize: isFullSize ? 16 : 4, fontWeight: 600 }}>
                    {content.presentedBy || deck.company}
                  </div>
                </div>
                <div style={{ 
                  padding: isFullSize ? '16px 24px' : '4px 6px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: isFullSize ? 12 : 3, opacity: 0.7 }}>Presented to</div>
                  <div style={{ fontSize: isFullSize ? 16 : 4, fontWeight: 600 }}>
                    {content.presentedTo || 'Target Investor'}
                  </div>
                </div>
              </div>

              {/* Investment info */}
              <div style={{ 
                display: 'flex', 
                gap: isFullSize ? 20 : 4,
              }}>
                <div style={{ 
                  padding: isFullSize ? '16px 24px' : '4px 6px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: isFullSize ? 12 : 3, opacity: 0.7 }}>Investment Request</div>
                  <div style={{ fontSize: isFullSize ? 24 : 6, fontWeight: 700, color: design.accentColor }}>
                    R{(content.investmentAsk || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ 
                  padding: isFullSize ? '16px 24px' : '4px 6px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: isFullSize ? 12 : 3, opacity: 0.7 }}>Year</div>
                  <div style={{ fontSize: isFullSize ? 24 : 6, fontWeight: 700 }}>
                    {content.year || new Date().getFullYear()}
                  </div>
                </div>
              </div>

              {/* Return highlight */}
              {content.returnRate > 0 && (
                <div style={{ 
                  marginTop: isFullSize ? 40 : 8,
                  padding: isFullSize ? '20px 30px' : '4px 8px',
                  backgroundColor: 'rgba(255, 237, 179, 0.2)',
                  borderLeft: `4px solid ${design.accentColor}`,
                  borderRadius: 4,
                }}>
                  <div style={{ fontSize: isFullSize ? 14 : 4, fontWeight: 600 }}>Key Investment Return:</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: isFullSize ? 10 : 2 }}>
                    <span style={{ fontSize: isFullSize ? 36 : 8, fontWeight: 700, color: design.accentColor }}>
                      {content.returnRate}%
                    </span>
                    <span style={{ fontSize: isFullSize ? 14 : 4 }}>
                      Interest payment return within first five years of operation
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'problem':
        return (
          <div style={{ 
            padding: isFullSize ? 60 : 10, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            color: design.textColor,
          }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isFullSize ? 16 : 4,
              marginBottom: isFullSize ? 20 : 4,
            }}>
              <div style={{ 
                width: isFullSize ? 50 : 12, 
                height: isFullSize ? 50 : 12, 
                backgroundColor: '#f6ad55',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <WarningOutlined style={{ fontSize: isFullSize ? 24 : 6, color: '#fff' }} />
              </div>
              <span style={{ fontSize: isFullSize ? 16 : 5 }}>The National Challenge</span>
            </div>

            {/* Green line */}
            <div style={{ 
              height: isFullSize ? 4 : 1, 
              backgroundColor: design.accentColor,
              marginBottom: isFullSize ? 40 : 8,
            }} />

            {/* Headline */}
            <h2 style={{ 
              fontSize: isFullSize ? 36 : 8, 
              fontWeight: 700, 
              margin: 0,
              marginBottom: isFullSize ? 40 : 8,
            }}>
              {content.headline || 'The Challenge'}
            </h2>

            {/* Stats comparison */}
            {content.stats && content.stats.length >= 2 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: isFullSize ? 30 : 6,
                marginBottom: isFullSize ? 40 : 8,
              }}>
                <div style={{ 
                  padding: isFullSize ? '30px 50px' : '6px 12px',
                  backgroundColor: content.stats[0]?.color || '#38a169',
                  borderRadius: 12,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: isFullSize ? 48 : 10, fontWeight: 700 }}>
                    {content.stats[0]?.value || '24%'}
                  </div>
                  <div style={{ fontSize: isFullSize ? 14 : 4 }}>
                    {content.stats[0]?.label || 'Local Production'}
                  </div>
                  <div style={{ fontSize: isFullSize ? 12 : 3, opacity: 0.8 }}>
                    {content.stats[0]?.description || '~22M liters'}
                  </div>
                </div>
                <ArrowRightOutlined style={{ fontSize: isFullSize ? 24 : 6 }} />
                <div style={{ 
                  padding: isFullSize ? '30px 50px' : '6px 12px',
                  backgroundColor: content.stats[1]?.color || '#e53e3e',
                  borderRadius: 12,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: isFullSize ? 48 : 10, fontWeight: 700 }}>
                    {content.stats[1]?.value || '76%'}
                  </div>
                  <div style={{ fontSize: isFullSize ? 14 : 4 }}>
                    {content.stats[1]?.label || 'Imported'}
                  </div>
                  <div style={{ fontSize: isFullSize ? 12 : 3, opacity: 0.8 }}>
                    {content.stats[1]?.description || '~66M liters'}
                  </div>
                </div>
              </div>
            )}

            {/* Key metrics */}
            {content.keyMetrics && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isFullSize ? 16 : 4 }}>
                {content.keyMetrics.map((metric: any, idx: number) => (
                  <div key={idx} style={{ 
                    padding: isFullSize ? '20px 30px' : '4px 8px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}>
                    <div style={{ fontSize: isFullSize ? 36 : 8, fontWeight: 700, color: design.accentColor }}>
                      {metric.value}
                    </div>
                    <div style={{ fontSize: isFullSize ? 14 : 4 }}>
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'solution':
        return (
          <div style={{ 
            padding: isFullSize ? 60 : 10, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            color: design.textColor,
          }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isFullSize ? 16 : 4,
              marginBottom: isFullSize ? 20 : 4,
            }}>
              <div style={{ 
                width: isFullSize ? 50 : 12, 
                height: isFullSize ? 50 : 12, 
                backgroundColor: design.accentColor,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <BulbOutlined style={{ fontSize: isFullSize ? 24 : 6, color: '#fff' }} />
              </div>
              <span style={{ fontSize: isFullSize ? 16 : 5 }}>Our Strategic Solution</span>
            </div>

            {/* Green line */}
            <div style={{ 
              height: isFullSize ? 4 : 1, 
              backgroundColor: design.accentColor,
              marginBottom: isFullSize ? 40 : 8,
            }} />

            {/* Headline */}
            <h2 style={{ 
              fontSize: isFullSize ? 36 : 8, 
              fontWeight: 700, 
              margin: 0,
              marginBottom: isFullSize ? 20 : 4,
            }}>
              {content.headline || 'Vertical Integration: From Farm to Consumer'}
            </h2>

            <p style={{ 
              fontSize: isFullSize ? 16 : 4, 
              opacity: 0.9,
              marginBottom: isFullSize ? 40 : 8,
            }}>
              {content.description || 'Establishing a fully integrated value chain that captures value at every stage.'}
            </p>

            {/* Pillars */}
            {content.pillars && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-around',
                flex: 1,
                alignItems: 'center',
              }}>
                {content.pillars.map((pillar: any, idx: number) => (
                  <div key={idx} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: isFullSize ? 80 : 20, 
                      height: isFullSize ? 80 : 20, 
                      backgroundColor: design.accentColor,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      marginBottom: isFullSize ? 16 : 4,
                    }}>
                      {pillar.icon === 'sourcing' && <TeamOutlined style={{ fontSize: isFullSize ? 32 : 8 }} />}
                      {pillar.icon === 'processing' && <BarChartOutlined style={{ fontSize: isFullSize ? 32 : 8 }} />}
                      {pillar.icon === 'distribution' && <GlobalOutlined style={{ fontSize: isFullSize ? 32 : 8 }} />}
                    </div>
                    <div style={{ fontSize: isFullSize ? 18 : 5, fontWeight: 700 }}>
                      {pillar.title}
                    </div>
                    <div style={{ fontSize: isFullSize ? 14 : 4, fontWeight: 600 }}>
                      {pillar.subtitle}
                    </div>
                    <div style={{ fontSize: isFullSize ? 12 : 3, opacity: 0.8 }}>
                      {pillar.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'business-model':
        return (
          <div style={{ 
            padding: isFullSize ? 60 : 10, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            color: design.textColor,
          }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isFullSize ? 16 : 4,
              marginBottom: isFullSize ? 20 : 4,
            }}>
              <div style={{ 
                width: isFullSize ? 50 : 12, 
                height: isFullSize ? 50 : 12, 
                backgroundColor: '#667eea',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <BankOutlined style={{ fontSize: isFullSize ? 24 : 6, color: '#fff' }} />
              </div>
              <span style={{ fontSize: isFullSize ? 16 : 5 }}>Business Model</span>
            </div>

            {/* Green line */}
            <div style={{ 
              height: isFullSize ? 4 : 1, 
              backgroundColor: design.accentColor,
              marginBottom: isFullSize ? 40 : 8,
            }} />

            {/* Headline */}
            <h2 style={{ 
              fontSize: isFullSize ? 36 : 8, 
              fontWeight: 700, 
              margin: 0,
              marginBottom: isFullSize ? 30 : 6,
            }}>
              {content.headline || 'Forward Integration Strategy'}
            </h2>

            {/* Products */}
            {content.products && content.products.map((product: any, idx: number) => (
              <div key={idx} style={{ 
                padding: isFullSize ? 30 : 8,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                borderLeft: `4px solid ${design.accentColor}`,
                marginBottom: isFullSize ? 20 : 4,
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isFullSize ? 12 : 3,
                  marginBottom: isFullSize ? 16 : 4,
                }}>
                  <div style={{ fontSize: isFullSize ? 24 : 6 }}>🥛</div>
                  <span style={{ fontSize: isFullSize ? 20 : 5, fontWeight: 700, color: design.accentColor }}>
                    {product.name}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isFullSize ? 12 : 3 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: isFullSize ? 14 : 4 }}>Daily Production:</span>
                    <span style={{ fontSize: isFullSize ? 14 : 4 }}> {product.production}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: isFullSize ? 14 : 4 }}>Packaging:</span>
                    <span style={{ fontSize: isFullSize ? 14 : 4 }}> {product.packaging}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: isFullSize ? 14 : 4 }}>Shelf Life:</span>
                    <span style={{ fontSize: isFullSize ? 14 : 4 }}> {product.shelfLife}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: isFullSize ? 14 : 4 }}>Target Market:</span>
                    <span style={{ fontSize: isFullSize ? 14 : 4 }}> {product.targetMarket}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: isFullSize ? 14 : 4 }}>Pricing:</span>
                    <span style={{ fontSize: isFullSize ? 14 : 4 }}> {product.pricing}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div style={{ 
            padding: isFullSize ? 60 : 10, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: design.textColor,
          }}>
            <h2 style={{ fontSize: isFullSize ? 36 : 8, textAlign: 'center' }}>
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p style={{ fontSize: isFullSize ? 18 : 5, opacity: 0.8, textAlign: 'center' }}>
                {slide.subtitle}
              </p>
            )}
          </div>
        );
    }
  };

  // Slide editor based on type
  const renderSlideEditor = (slide: SlideData) => {
    const updateContent = (key: string, value: any) => {
      updateSlide(slide.id, {
        content: { ...slide.content, [key]: value },
      });
    };

    switch (slide.type) {
      case 'title':
        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Investment Opportunity Title</Text>
              <Input
                value={slide.content.tagline}
                onChange={e => updateContent('tagline', e.target.value)}
                placeholder="e.g., Transforming Eswatini's Dairy Sector"
                style={{ marginTop: 8 }}
              />
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Presented By</Text>
                <Input
                  value={slide.content.presentedBy}
                  onChange={e => updateContent('presentedBy', e.target.value)}
                  placeholder="Your Company Name"
                  style={{ marginTop: 8 }}
                />
              </Col>
              <Col span={12}>
                <Text strong>Presented To</Text>
                <Input
                  value={slide.content.presentedTo}
                  onChange={e => updateContent('presentedTo', e.target.value)}
                  placeholder="Target Investor/Audience"
                  style={{ marginTop: 8 }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Text strong>Investment Ask (R)</Text>
                <InputNumber
                  value={slide.content.investmentAsk}
                  onChange={value => updateContent('investmentAsk', value)}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </Col>
              <Col span={8}>
                <Text strong>Year</Text>
                <InputNumber
                  value={slide.content.year}
                  onChange={value => updateContent('year', value)}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </Col>
              <Col span={8}>
                <Text strong>Return Rate (%)</Text>
                <InputNumber
                  value={slide.content.returnRate}
                  onChange={value => updateContent('returnRate', value)}
                  suffix="%"
                  style={{ width: '100%', marginTop: 8 }}
                />
              </Col>
            </Row>
          </div>
        );

      case 'problem':
        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Headline</Text>
              <Input
                value={slide.content.headline}
                onChange={e => updateContent('headline', e.target.value)}
                placeholder="e.g., Eswatini's Dairy Dependency Crisis"
                style={{ marginTop: 8 }}
              />
            </div>
            <Text strong>Comparison Stats</Text>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#38a169', color: '#fff' }}>
                  <Input
                    value={slide.content.stats?.[0]?.value || ''}
                    onChange={e => {
                      const stats = [...(slide.content.stats || [])];
                      stats[0] = { ...stats[0], value: e.target.value };
                      updateContent('stats', stats);
                    }}
                    placeholder="24%"
                    style={{ marginBottom: 8 }}
                  />
                  <Input
                    value={slide.content.stats?.[0]?.label || ''}
                    onChange={e => {
                      const stats = [...(slide.content.stats || [])];
                      stats[0] = { ...stats[0], label: e.target.value };
                      updateContent('stats', stats);
                    }}
                    placeholder="Local Production"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#e53e3e', color: '#fff' }}>
                  <Input
                    value={slide.content.stats?.[1]?.value || ''}
                    onChange={e => {
                      const stats = [...(slide.content.stats || [])];
                      stats[1] = { ...stats[1], value: e.target.value };
                      updateContent('stats', stats);
                    }}
                    placeholder="76%"
                    style={{ marginBottom: 8 }}
                  />
                  <Input
                    value={slide.content.stats?.[1]?.label || ''}
                    onChange={e => {
                      const stats = [...(slide.content.stats || [])];
                      stats[1] = { ...stats[1], label: e.target.value };
                      updateContent('stats', stats);
                    }}
                    placeholder="Imported"
                  />
                </Card>
              </Col>
            </Row>
          </div>
        );

      default:
        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Slide Title</Text>
              <Input
                value={slide.title}
                onChange={e => updateSlide(slide.id, { title: e.target.value })}
                style={{ marginTop: 8 }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Subtitle</Text>
              <Input
                value={slide.subtitle}
                onChange={e => updateSlide(slide.id, { subtitle: e.target.value })}
                style={{ marginTop: 8 }}
              />
            </div>
          </div>
        );
    }
  };

  const currentSlideData = deck.slides[currentSlide];

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#0f172a',
    }}>
      {/* Top Bar */}
      <div style={{ 
        padding: '12px 24px', 
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#fff' }}>
            Back
          </Button>
          <Input
            value={deck.name}
            onChange={e => setDeck(prev => ({ ...prev, name: e.target.value }))}
            style={{ 
              width: 300, 
              backgroundColor: 'transparent', 
              border: 'none',
              color: '#fff',
              fontSize: 18,
              fontWeight: 600,
            }}
            placeholder="Pitch Deck Name"
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button icon={<SaveOutlined />}>Save</Button>
          <Button 
            icon={<PlayCircleOutlined />}
            onClick={() => setIsPreviewMode(true)}
          >
            Present
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Slide Navigator */}
        <div style={{ 
          width: 200, 
          backgroundColor: '#1e293b',
          borderRight: '1px solid #334155',
          padding: 16,
          overflowY: 'auto',
        }}>
          <div style={{ marginBottom: 16 }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Add Slide"
              onChange={(type: SlideType) => addSlide(type)}
              value={undefined}
            >
              {Object.entries(slideTemplates).map(([type, template]) => (
                <Option key={type} value={type}>
                  <Space>
                    {template.icon}
                    {template.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {deck.slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  position: 'relative',
                  border: currentSlide === idx ? '2px solid #3b82f6' : '2px solid transparent',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 4, 
                  left: 4, 
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 10,
                  zIndex: 1,
                }}>
                  {idx + 1}
                </div>
                {renderSlidePreview(slide, false)}
                {currentSlide === idx && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 4, 
                    right: 4, 
                    display: 'flex',
                    gap: 4,
                  }}>
                    <Button 
                      size="small" 
                      icon={<CopyOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSlide(slide.id);
                      }}
                    />
                    <Button 
                      size="small" 
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(slide.id);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center - Slide Preview */}
        <div style={{ 
          flex: 1, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          backgroundColor: '#0f172a',
        }}>
          <div style={{ 
            width: '100%',
            maxWidth: 900,
            aspectRatio: '16/9',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            {currentSlideData && renderSlidePreview(currentSlideData, true)}
          </div>
        </div>

        {/* Right Panel - Editor */}
        <div style={{ 
          width: 350, 
          backgroundColor: '#1e293b',
          borderLeft: '1px solid #334155',
          padding: 24,
          overflowY: 'auto',
        }}>
          <Tabs
            defaultActiveKey="content"
            items={[
              {
                key: 'content',
                label: 'Content',
                children: currentSlideData && (
                  <div style={{ color: '#e2e8f0' }}>
                    {renderSlideEditor(currentSlideData)}
                  </div>
                ),
              },
              {
                key: 'design',
                label: 'Design',
                children: currentSlideData && (
                  <div style={{ color: '#e2e8f0' }}>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ color: '#e2e8f0' }}>Background Color</Text>
                      <div style={{ marginTop: 8 }}>
                        <ColorPicker
                          value={currentSlideData.design.backgroundColor}
                          onChange={(color) => updateSlide(currentSlideData.id, {
                            design: { ...currentSlideData.design, backgroundColor: color.toHexString() }
                          })}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ color: '#e2e8f0' }}>Accent Color</Text>
                      <div style={{ marginTop: 8 }}>
                        <ColorPicker
                          value={currentSlideData.design.accentColor}
                          onChange={(color) => updateSlide(currentSlideData.id, {
                            design: { ...currentSlideData.design, accentColor: color.toHexString() }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{ 
        padding: '12px 24px', 
        backgroundColor: '#1e293b',
        borderTop: '1px solid #334155',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          disabled={currentSlide === 0}
          onClick={() => setCurrentSlide(prev => prev - 1)}
        />
        <Text style={{ color: '#94a3b8' }}>
          Slide {currentSlide + 1} of {deck.slides.length}
        </Text>
        <Button
          icon={<ArrowRightOutlined />}
          disabled={currentSlide === deck.slides.length - 1}
          onClick={() => setCurrentSlide(prev => prev + 1)}
        />
      </div>

      {/* Fullscreen Preview Modal */}
      <Modal
        open={isPreviewMode}
        onCancel={() => setIsPreviewMode(false)}
        footer={null}
        width="100%"
        style={{ top: 0, padding: 0, maxWidth: '100vw' }}
        styles={{ body: { padding: 0, height: '100vh', backgroundColor: '#000' } }}
        closable={false}
      >
        <div 
          style={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#000',
          }}
          onClick={() => {
            if (currentSlide < deck.slides.length - 1) {
              setCurrentSlide(prev => prev + 1);
            } else {
              setIsPreviewMode(false);
            }
          }}
        >
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 40,
          }}>
            <div style={{ 
              width: '100%',
              maxWidth: 1200,
              aspectRatio: '16/9',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              {currentSlideData && renderSlidePreview(currentSlideData, true)}
            </div>
          </div>
          <div style={{ 
            padding: 20, 
            display: 'flex', 
            justifyContent: 'center',
            gap: 8,
          }}>
            {deck.slides.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: idx === currentSlide ? '#38a169' : '#4a5568',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(idx);
                }}
              />
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InvestmentPitchBuilder;
