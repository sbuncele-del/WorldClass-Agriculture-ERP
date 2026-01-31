/**
 * Phase 3: Visual Design & Branding
 * 
 * Features:
 * - Color scheme selection (or auto-branding from client)
 * - Professional layouts with proper spacing
 * - Data visualization for numbers
 * - Icons and imagery selection
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Space, Button, Select, Tabs,
  Radio, Slider, Switch, ColorPicker, Tag, Avatar, Tooltip,
  Divider, Upload, message, Modal, List, Image, Badge, Progress
} from 'antd';
import {
  BgColorsOutlined, LayoutOutlined, FontSizeOutlined, PictureOutlined,
  BorderOutlined, CheckCircleOutlined, EyeOutlined, SettingOutlined,
  CloudUploadOutlined, FormatPainterOutlined, ColumnWidthOutlined,
  AlignLeftOutlined, AlignCenterOutlined, StarOutlined, CrownOutlined,
  ThunderboltOutlined, DownloadOutlined, AppstoreOutlined
} from '@ant-design/icons';
import type { DesignSettings, ProposalData } from '../../WorldClassProposalBuilder';

const { Title, Text, Paragraph } = Typography;

interface PhaseVisualDesignProps {
  proposal: ProposalData;
  onDesignUpdate: (design: DesignSettings) => void;
  onPhaseComplete: (progress: number) => void;
}

// Design Templates
const designTemplates = [
  {
    id: 'executive',
    name: 'The Executive',
    description: 'Traditional, authoritative - Navy & Gold',
    preview: '/templates/executive-preview.png',
    colors: { primary: '#1e3a5f', secondary: '#f8f9fa', accent: '#c9a227' },
    fonts: { primary: 'Playfair Display', secondary: 'Source Sans Pro' },
    style: 'Formal, corporate, conservative'
  },
  {
    id: 'modern',
    name: 'Modern Tech',
    description: 'Clean, vibrant gradients, contemporary',
    preview: '/templates/modern-preview.png',
    colors: { primary: '#722ed1', secondary: '#f0f5ff', accent: '#1890ff' },
    fonts: { primary: 'Inter', secondary: 'Inter' },
    style: 'Innovative, fresh, dynamic'
  },
  {
    id: 'minimal',
    name: 'Swiss Minimal',
    description: 'Stark, high contrast, grid-based',
    preview: '/templates/minimal-preview.png',
    colors: { primary: '#000000', secondary: '#ffffff', accent: '#ff0000' },
    fonts: { primary: 'Helvetica Neue', secondary: 'Helvetica Neue' },
    style: 'Clean, precise, professional'
  },
  {
    id: 'creative',
    name: 'Creative Bold',
    description: 'Dynamic, colorful, expressive',
    preview: '/templates/creative-preview.png',
    colors: { primary: '#eb2f96', secondary: '#fff0f6', accent: '#722ed1' },
    fonts: { primary: 'Poppins', secondary: 'Open Sans' },
    style: 'Bold, energetic, creative'
  },
  {
    id: 'corporate',
    name: 'Corporate Classic',
    description: 'Professional, trusted, established',
    preview: '/templates/corporate-preview.png',
    colors: { primary: '#003366', secondary: '#f5f5f5', accent: '#0066cc' },
    fonts: { primary: 'Merriweather', secondary: 'Lato' },
    style: 'Reliable, established, corporate'
  },
  {
    id: 'eco',
    name: 'Eco / Organic',
    description: 'Natural tones, sustainable feel',
    preview: '/templates/eco-preview.png',
    colors: { primary: '#2d5016', secondary: '#f6ffed', accent: '#52c41a' },
    fonts: { primary: 'Nunito', secondary: 'Nunito' },
    style: 'Natural, sustainable, fresh'
  }
];

// Color Palettes
const colorPalettes = [
  { name: 'Corporate Blue', colors: ['#003366', '#0066cc', '#99ccff', '#e6f2ff'] },
  { name: 'Forest Green', colors: ['#1d4620', '#2d5016', '#52c41a', '#f6ffed'] },
  { name: 'Royal Purple', colors: ['#531dab', '#722ed1', '#b37feb', '#f9f0ff'] },
  { name: 'Sunset Orange', colors: ['#ad2102', '#fa541c', '#ffbb96', '#fff2e8'] },
  { name: 'Ocean Teal', colors: ['#006d75', '#13c2c2', '#87e8de', '#e6fffb'] },
  { name: 'Charcoal Gold', colors: ['#1f1f1f', '#434343', '#c9a227', '#fffbe6'] }
];

// Font Combinations
const fontCombinations = [
  { heading: 'Playfair Display', body: 'Source Sans Pro', style: 'Classic Elegance' },
  { heading: 'Inter', body: 'Inter', style: 'Modern Clean' },
  { heading: 'Poppins', body: 'Open Sans', style: 'Friendly Professional' },
  { heading: 'Merriweather', body: 'Lato', style: 'Traditional' },
  { heading: 'Montserrat', body: 'Roboto', style: 'Contemporary' },
  { heading: 'Nunito', body: 'Nunito', style: 'Soft & Approachable' }
];

// Icon Sets
const iconSets = [
  { id: 'line', name: 'Line Icons', preview: '📊📈📉📋' },
  { id: 'solid', name: 'Solid Icons', preview: '⬛⬜🔷🔶' },
  { id: 'gradient', name: 'Gradient Icons', preview: '🌈✨💫🎨' },
  { id: 'minimal', name: 'Minimal', preview: '○●□■' }
];

// Stock Images Categories
const imageCategories = [
  { id: 'business', name: 'Business', count: 50 },
  { id: 'technology', name: 'Technology', count: 45 },
  { id: 'teamwork', name: 'Teamwork', count: 38 },
  { id: 'success', name: 'Success', count: 32 },
  { id: 'nature', name: 'Nature', count: 40 },
  { id: 'abstract', name: 'Abstract', count: 55 }
];

const PhaseVisualDesign: React.FC<PhaseVisualDesignProps> = ({
  proposal,
  onDesignUpdate,
  onPhaseComplete
}) => {
  const [design, setDesign] = useState<DesignSettings>(proposal.design);
  const [activeTab, setActiveTab] = useState('templates');
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Calculate completion progress
  useEffect(() => {
    let progress = 0;
    if (design.template) progress += 30;
    if (design.primaryColor) progress += 20;
    if (design.fontPrimary) progress += 20;
    if (design.headerStyle) progress += 15;
    if (design.showTableOfContents !== undefined) progress += 15;
    onPhaseComplete(Math.min(progress, 100));
  }, [design]);
  
  // Update parent when design changes
  useEffect(() => {
    onDesignUpdate(design);
  }, [design]);
  
  const applyTemplate = (templateId: string) => {
    const template = designTemplates.find(t => t.id === templateId);
    if (template) {
      setDesign(prev => ({
        ...prev,
        template: templateId as DesignSettings['template'],
        primaryColor: template.colors.primary,
        secondaryColor: template.colors.secondary,
        accentColor: template.colors.accent,
        fontPrimary: template.fonts.primary,
        fontSecondary: template.fonts.secondary
      }));
      message.success(`Applied "${template.name}" template`);
    }
  };
  
  const applyClientBranding = () => {
    if (proposal.client?.brandColors && proposal.client.brandColors.length >= 2) {
      setDesign(prev => ({
        ...prev,
        primaryColor: proposal.client!.brandColors![0],
        secondaryColor: '#ffffff',
        accentColor: proposal.client!.brandColors![1],
        useClientBranding: true
      }));
      message.success('Applied client brand colors');
    } else {
      message.warning('No client brand colors available');
    }
  };

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: 'templates',
            label: (
              <Space>
                <LayoutOutlined />
                <span>Templates</span>
              </Space>
            ),
            children: (
              <div>
                {/* Template Selection */}
                <Title level={5}>
                  <CrownOutlined style={{ color: '#faad14' }} /> Choose a Design Template
                </Title>
                <Paragraph type="secondary">
                  Select a professional template that matches your proposal style
                </Paragraph>
                
                <Row gutter={[16, 16]}>
                  {designTemplates.map(template => (
                    <Col xs={24} sm={12} md={8} key={template.id}>
                      <Card
                        hoverable
                        onClick={() => applyTemplate(template.id)}
                        style={{
                          border: design.template === template.id 
                            ? '2px solid #1890ff' 
                            : '1px solid #e8e8e8',
                          overflow: 'hidden'
                        }}
                        cover={
                          <div style={{
                            height: 140,
                            background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.accent} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}>
                            <div style={{
                              background: template.colors.secondary,
                              padding: '20px 40px',
                              borderRadius: 8,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                              <Text strong style={{ 
                                fontFamily: template.fonts.primary,
                                color: template.colors.primary,
                                fontSize: 16
                              }}>
                                {template.name}
                              </Text>
                            </div>
                            {design.template === template.id && (
                              <CheckCircleOutlined 
                                style={{
                                  position: 'absolute',
                                  top: 12,
                                  right: 12,
                                  fontSize: 24,
                                  color: '#52c41a',
                                  background: 'white',
                                  borderRadius: '50%'
                                }}
                              />
                            )}
                          </div>
                        }
                      >
                        <Card.Meta
                          title={template.name}
                          description={
                            <Space direction="vertical" size={4}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {template.description}
                              </Text>
                              <div>
                                {Object.values(template.colors).map((color, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      display: 'inline-block',
                                      width: 20,
                                      height: 20,
                                      borderRadius: 4,
                                      background: color,
                                      marginRight: 4,
                                      border: '1px solid #e8e8e8'
                                    }}
                                  />
                                ))}
                              </div>
                            </Space>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
                
                {/* Client Branding Option */}
                {proposal.client?.brandColors && (
                  <Card style={{ marginTop: 24, background: '#f9f0ff' }}>
                    <Row align="middle" justify="space-between">
                      <Col>
                        <Space>
                          <FormatPainterOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                          <div>
                            <Text strong>Use Client's Brand Colors</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {proposal.client.company}'s brand colors detected
                            </Text>
                          </div>
                          <Space style={{ marginLeft: 16 }}>
                            {proposal.client.brandColors.map((color, i) => (
                              <span
                                key={i}
                                style={{
                                  display: 'inline-block',
                                  width: 32,
                                  height: 32,
                                  borderRadius: 4,
                                  background: color,
                                  border: '1px solid #e8e8e8'
                                }}
                              />
                            ))}
                          </Space>
                        </Space>
                      </Col>
                      <Col>
                        <Button 
                          type="primary"
                          onClick={applyClientBranding}
                          style={{ background: '#722ed1', borderColor: '#722ed1' }}
                        >
                          Apply Client Branding
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                )}
              </div>
            )
          },
          {
            key: 'colors',
            label: (
              <Space>
                <BgColorsOutlined />
                <span>Colors</span>
              </Space>
            ),
            children: (
              <Row gutter={24}>
                <Col span={16}>
                  <Card title="Color Scheme">
                    <Row gutter={[24, 24]}>
                      <Col span={8}>
                        <Space direction="vertical">
                          <Text strong>Primary Color</Text>
                          <ColorPicker
                            value={design.primaryColor}
                            onChange={(color) => setDesign(prev => ({ 
                              ...prev, 
                              primaryColor: color.toHexString() 
                            }))}
                            showText
                            presets={[
                              { 
                                label: 'Recommended',
                                colors: ['#1e3a5f', '#003366', '#722ed1', '#2d5016', '#000000']
                              }
                            ]}
                          />
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Headers, titles, buttons
                          </Text>
                        </Space>
                      </Col>
                      <Col span={8}>
                        <Space direction="vertical">
                          <Text strong>Secondary Color</Text>
                          <ColorPicker
                            value={design.secondaryColor}
                            onChange={(color) => setDesign(prev => ({ 
                              ...prev, 
                              secondaryColor: color.toHexString() 
                            }))}
                            showText
                            presets={[
                              { 
                                label: 'Recommended',
                                colors: ['#f0f5ff', '#f6ffed', '#f9f0ff', '#ffffff', '#f5f5f5']
                              }
                            ]}
                          />
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Backgrounds, cards
                          </Text>
                        </Space>
                      </Col>
                      <Col span={8}>
                        <Space direction="vertical">
                          <Text strong>Accent Color</Text>
                          <ColorPicker
                            value={design.accentColor}
                            onChange={(color) => setDesign(prev => ({ 
                              ...prev, 
                              accentColor: color.toHexString() 
                            }))}
                            showText
                            presets={[
                              { 
                                label: 'Recommended',
                                colors: ['#1890ff', '#52c41a', '#faad14', '#eb2f96', '#c9a227']
                              }
                            ]}
                          />
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Links, highlights, CTAs
                          </Text>
                        </Space>
                      </Col>
                    </Row>
                    
                    {/* Color Preview */}
                    <div style={{ marginTop: 24 }}>
                      <Text strong>Preview</Text>
                      <div style={{
                        marginTop: 8,
                        padding: 24,
                        background: design.secondaryColor,
                        borderRadius: 8,
                        border: '1px solid #e8e8e8'
                      }}>
                        <div style={{
                          padding: 16,
                          background: design.primaryColor,
                          color: 'white',
                          borderRadius: 4,
                          marginBottom: 16
                        }}>
                          <Text style={{ color: 'white', fontWeight: 600 }}>
                            Header with Primary Color
                          </Text>
                        </div>
                        <Paragraph>
                          Body text on secondary background with{' '}
                          <a style={{ color: design.accentColor }}>accent color links</a>.
                        </Paragraph>
                        <Button 
                          style={{ 
                            background: design.accentColor, 
                            borderColor: design.accentColor,
                            color: 'white'
                          }}
                        >
                          Call to Action
                        </Button>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Quick Palettes */}
                  <Card title="Quick Color Palettes" style={{ marginTop: 16 }}>
                    <Row gutter={[12, 12]}>
                      {colorPalettes.map(palette => (
                        <Col span={8} key={palette.name}>
                          <Card
                            size="small"
                            hoverable
                            onClick={() => {
                              setDesign(prev => ({
                                ...prev,
                                primaryColor: palette.colors[0],
                                secondaryColor: palette.colors[3],
                                accentColor: palette.colors[2]
                              }));
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <Space direction="vertical" size={4}>
                              <Text style={{ fontSize: 12 }}>{palette.name}</Text>
                              <div>
                                {palette.colors.map((color, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      display: 'inline-block',
                                      width: 24,
                                      height: 24,
                                      background: color,
                                      marginRight: 2
                                    }}
                                  />
                                ))}
                              </div>
                            </Space>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
                
                <Col span={8}>
                  {/* Data Visualization Colors */}
                  <Card title="Chart & Data Colors" size="small">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Colors for graphs and data visualizations
                    </Text>
                    <div style={{ marginTop: 12 }}>
                      <Progress 
                        percent={70} 
                        strokeColor={design.primaryColor}
                        trailColor="#e8e8e8"
                      />
                      <Progress 
                        percent={50} 
                        strokeColor={design.accentColor}
                        trailColor="#e8e8e8"
                      />
                      <div style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 12
                      }}>
                        <div style={{ 
                          flex: 3, 
                          height: 60, 
                          background: design.primaryColor,
                          borderRadius: 4 
                        }} />
                        <div style={{ 
                          flex: 2, 
                          height: 60, 
                          background: design.accentColor,
                          borderRadius: 4 
                        }} />
                        <div style={{ 
                          flex: 1, 
                          height: 60, 
                          background: design.secondaryColor,
                          border: '1px solid #e8e8e8',
                          borderRadius: 4 
                        }} />
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'typography',
            label: (
              <Space>
                <FontSizeOutlined />
                <span>Typography</span>
              </Space>
            ),
            children: (
              <Row gutter={24}>
                <Col span={14}>
                  <Card title="Font Selection">
                    <Row gutter={[16, 16]}>
                      {fontCombinations.map((combo, i) => (
                        <Col span={12} key={i}>
                          <Card
                            size="small"
                            hoverable
                            onClick={() => setDesign(prev => ({
                              ...prev,
                              fontPrimary: combo.heading,
                              fontSecondary: combo.body
                            }))}
                            style={{
                              border: design.fontPrimary === combo.heading 
                                ? '2px solid #1890ff' 
                                : '1px solid #e8e8e8'
                            }}
                          >
                            <div style={{ fontFamily: combo.heading, fontSize: 18, fontWeight: 600 }}>
                              Heading Text
                            </div>
                            <div style={{ fontFamily: combo.body, fontSize: 14, color: '#666' }}>
                              Body text sample for this combination
                            </div>
                            <Tag color="blue" style={{ marginTop: 8 }}>{combo.style}</Tag>
                            <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                              {combo.heading} + {combo.body}
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
                
                <Col span={10}>
                  <Card title="Typography Preview">
                    <div style={{ fontFamily: design.fontPrimary }}>
                      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
                        Proposal Headline
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#333' }}>
                        Section Title
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, color: '#666' }}>
                        Subsection Heading
                      </div>
                    </div>
                    <div style={{ fontFamily: design.fontSecondary, lineHeight: 1.8 }}>
                      <Paragraph>
                        This is body text that will appear throughout your proposal. 
                        Good typography ensures readability and professionalism.
                      </Paragraph>
                      <ul style={{ paddingLeft: 20 }}>
                        <li>Bullet point one</li>
                        <li>Bullet point two</li>
                        <li>Bullet point three</li>
                      </ul>
                    </div>
                  </Card>
                  
                  <Card title="Text Settings" size="small" style={{ marginTop: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Line Height</Text>
                        <Slider defaultValue={1.6} min={1} max={2.5} step={0.1} />
                      </div>
                      <div>
                        <Text strong>Base Font Size</Text>
                        <Slider defaultValue={14} min={12} max={18} />
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'layout',
            label: (
              <Space>
                <ColumnWidthOutlined />
                <span>Layout</span>
              </Space>
            ),
            children: (
              <Row gutter={24}>
                <Col span={16}>
                  <Card title="Layout Options">
                    <Row gutter={[16, 24]}>
                      <Col span={12}>
                        <Text strong>Header Style</Text>
                        <Radio.Group
                          value={design.headerStyle}
                          onChange={e => setDesign(prev => ({ 
                            ...prev, 
                            headerStyle: e.target.value 
                          }))}
                          style={{ display: 'block', marginTop: 8 }}
                        >
                          <Space direction="vertical">
                            <Radio value="full-width">
                              <Space>
                                <BorderOutlined />
                                Full Width Header
                              </Space>
                            </Radio>
                            <Radio value="contained">
                              <Space>
                                <AppstoreOutlined />
                                Contained Header
                              </Space>
                            </Radio>
                            <Radio value="minimal">
                              <Space>
                                <AlignLeftOutlined />
                                Minimal Header
                              </Space>
                            </Radio>
                          </Space>
                        </Radio.Group>
                      </Col>
                      
                      <Col span={12}>
                        <Text strong>Logo Position</Text>
                        <Radio.Group
                          value={design.logoPosition}
                          onChange={e => setDesign(prev => ({ 
                            ...prev, 
                            logoPosition: e.target.value 
                          }))}
                          style={{ display: 'block', marginTop: 8 }}
                        >
                          <Space direction="vertical">
                            <Radio value="left">
                              <Space>
                                <AlignLeftOutlined />
                                Left Aligned
                              </Space>
                            </Radio>
                            <Radio value="center">
                              <Space>
                                <AlignCenterOutlined />
                                Center Aligned
                              </Space>
                            </Radio>
                            <Radio value="right">
                              <Space>
                                <AlignLeftOutlined style={{ transform: 'scaleX(-1)' }} />
                                Right Aligned
                              </Space>
                            </Radio>
                          </Space>
                        </Radio.Group>
                      </Col>
                      
                      <Col span={24}>
                        <Divider />
                      </Col>
                      
                      <Col span={12}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Switch
                              checked={design.showPageNumbers}
                              onChange={checked => setDesign(prev => ({ 
                                ...prev, 
                                showPageNumbers: checked 
                              }))}
                            />
                            <Text style={{ marginLeft: 8 }}>Show Page Numbers</Text>
                          </div>
                          <div>
                            <Switch
                              checked={design.showTableOfContents}
                              onChange={checked => setDesign(prev => ({ 
                                ...prev, 
                                showTableOfContents: checked 
                              }))}
                            />
                            <Text style={{ marginLeft: 8 }}>Include Table of Contents</Text>
                          </div>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                  
                  {/* Cover Image */}
                  <Card title="Cover Page Image" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Upload.Dragger style={{ padding: 16 }}>
                          <p className="ant-upload-drag-icon">
                            <CloudUploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                          </p>
                          <p className="ant-upload-text">Upload Cover Image</p>
                          <p className="ant-upload-hint">
                            Recommended: 1920x1080px, JPG or PNG
                          </p>
                        </Upload.Dragger>
                      </Col>
                      <Col span={12}>
                        <Button 
                          block 
                          icon={<PictureOutlined />}
                          onClick={() => setShowImageLibrary(true)}
                          style={{ height: 120 }}
                        >
                          Browse Stock Images
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                
                <Col span={8}>
                  {/* Layout Preview */}
                  <Card title="Layout Preview" size="small">
                    <div style={{
                      border: '1px solid #e8e8e8',
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: '#f5f5f5'
                    }}>
                      {/* Mini Header */}
                      <div style={{
                        background: design.primaryColor,
                        padding: design.headerStyle === 'minimal' ? '8px 12px' : '16px 20px',
                        display: 'flex',
                        justifyContent: design.logoPosition === 'center' ? 'center' : 
                                        design.logoPosition === 'right' ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={{
                          width: 40,
                          height: 20,
                          background: 'rgba(255,255,255,0.3)',
                          borderRadius: 2
                        }} />
                      </div>
                      
                      {/* Mini Content */}
                      <div style={{ padding: 12, background: 'white' }}>
                        <div style={{ 
                          height: 8, 
                          width: '60%', 
                          background: design.primaryColor,
                          marginBottom: 8,
                          borderRadius: 2
                        }} />
                        <div style={{ 
                          height: 4, 
                          width: '100%', 
                          background: '#e8e8e8',
                          marginBottom: 4,
                          borderRadius: 2
                        }} />
                        <div style={{ 
                          height: 4, 
                          width: '90%', 
                          background: '#e8e8e8',
                          marginBottom: 4,
                          borderRadius: 2
                        }} />
                        <div style={{ 
                          height: 4, 
                          width: '75%', 
                          background: '#e8e8e8',
                          borderRadius: 2
                        }} />
                      </div>
                      
                      {/* Mini Footer */}
                      {design.showPageNumbers && (
                        <div style={{ 
                          padding: 4, 
                          textAlign: 'center',
                          borderTop: '1px solid #e8e8e8',
                          fontSize: 8,
                          color: '#999'
                        }}>
                          Page 1
                        </div>
                      )}
                    </div>
                  </Card>
                  
                  {/* Icon Style */}
                  <Card title="Icon Style" size="small" style={{ marginTop: 16 }}>
                    <Radio.Group defaultValue="line" style={{ width: '100%' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {iconSets.map(set => (
                          <Radio key={set.id} value={set.id} style={{ width: '100%' }}>
                            <Space>
                              <span style={{ fontSize: 16 }}>{set.preview}</span>
                              <Text>{set.name}</Text>
                            </Space>
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  </Card>
                </Col>
              </Row>
            )
          }
        ]}
      />
      
      {/* Image Library Modal */}
      <Modal
        title="Stock Image Library"
        open={showImageLibrary}
        onCancel={() => setShowImageLibrary(false)}
        width={900}
        footer={null}
      >
        <Tabs
          items={imageCategories.map(cat => ({
            key: cat.id,
            label: `${cat.name} (${cat.count})`,
            children: (
              <Row gutter={[12, 12]}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Col span={6} key={i}>
                    <Card
                      hoverable
                      size="small"
                      cover={
                        <div style={{
                          height: 100,
                          background: `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)} 0%, #${Math.floor(Math.random()*16777215).toString(16)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <PictureOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.5)' }} />
                        </div>
                      }
                      onClick={() => {
                        message.success('Image selected');
                        setShowImageLibrary(false);
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {cat.name} Image {i}
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            )
          }))}
        />
      </Modal>
    </div>
  );
};

export default PhaseVisualDesign;
