/**
 * World-Class Proposal Builder
 * 
 * A comprehensive 5-phase proposal creation system:
 * Phase 1: Intake & Setup - Type selection, templates, client info, CRM/ERP import
 * Phase 2: AI-Enhanced Content Creation - Analysis, draft generation, AI suggestions
 * Phase 3: Visual Design & Branding - Colors, layouts, data visualization
 * Phase 4: Review & Collaboration - Team collaboration, comments, approvals
 * Phase 5: Delivery & Tracking - Export, sharing, tracking, e-signatures
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Layout, Steps, Button, Card, Row, Col, Typography, Space, Progress,
  Modal, message, Tooltip, Badge, Avatar, Drawer, notification
} from 'antd';
import {
  RocketOutlined, FileTextOutlined, TeamOutlined, SendOutlined,
  CheckCircleOutlined, ArrowLeftOutlined, ArrowRightOutlined,
  SaveOutlined, EyeOutlined, SettingOutlined, BellOutlined,
  CloudSyncOutlined, LockOutlined, StarOutlined, HomeOutlined,
  ThunderboltOutlined, BulbOutlined, PieChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Import phase components
import PhaseIntake from './components/phases/PhaseIntake';
import PhaseAIContent from './components/phases/PhaseAIContent';
import PhaseVisualDesign from './components/phases/PhaseVisualDesign';
import PhaseCollaboration from './components/phases/PhaseCollaboration';
import PhaseDelivery from './components/phases/PhaseDelivery';
import ProposalLivePreview from './components/ProposalLivePreview';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

// ============ TYPES & INTERFACES ============

export interface ProposalType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'investment' | 'project' | 'sales' | 'partnership' | 'grant';
  suggestedSections: string[];
  industry?: string[];
}

export interface ClientInfo {
  id?: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  industry: string;
  size?: 'startup' | 'small' | 'medium' | 'enterprise';
  logo?: string;
  brandColors?: string[];
  address?: string;
  website?: string;
  linkedIn?: string;
  existingClient: boolean;
  crmData?: any;
  notes?: string;
}

export interface ProposalSection {
  id: string;
  type: 'cover' | 'executive-summary' | 'problem' | 'solution' | 'methodology' | 
        'timeline' | 'team' | 'pricing' | 'case-studies' | 'testimonials' | 
        'about-us' | 'terms' | 'appendix' | 'custom';
  title: string;
  content: string;
  aiGenerated: boolean;
  aiSuggestions?: string[];
  order: number;
  visible: boolean;
  locked?: boolean;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface DesignSettings {
  template: 'executive' | 'modern' | 'minimal' | 'creative' | 'corporate' | 'eco';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontPrimary: string;
  fontSecondary: string;
  logoPosition: 'left' | 'center' | 'right';
  headerStyle: 'full-width' | 'contained' | 'minimal';
  useClientBranding: boolean;
  showPageNumbers: boolean;
  showTableOfContents: boolean;
  coverImageUrl?: string;
  watermark?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer' | 'approver';
  online?: boolean;
  lastActive?: string;
}

export interface Comment {
  id: string;
  sectionId: string;
  author: TeamMember;
  content: string;
  timestamp: string;
  resolved: boolean;
  replies?: Comment[];
}

export interface Version {
  id: string;
  number: string;
  createdBy: TeamMember;
  createdAt: string;
  changes: string;
  snapshot?: string;
}

export interface DeliverySettings {
  format: ('pdf' | 'pptx' | 'docx' | 'web')[];
  passwordProtected: boolean;
  password?: string;
  expiryDate?: string;
  allowDownload: boolean;
  trackViews: boolean;
  requireSignature: boolean;
  signers?: { name: string; email: string; order: number }[];
  customLink?: string;
  emailTemplate?: string;
}

export interface ProposalData {
  id: string;
  title: string;
  type: ProposalType | null;
  client: ClientInfo | null;
  sections: ProposalSection[];
  design: DesignSettings;
  team: TeamMember[];
  comments: Comment[];
  versions: Version[];
  delivery: DeliverySettings;
  status: 'draft' | 'review' | 'approved' | 'sent' | 'viewed' | 'signed' | 'expired';
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  value?: number;
  probability?: number;
}

// ============ INITIAL DATA ============

const defaultDesign: DesignSettings = {
  template: 'executive',
  primaryColor: '#1e3a5f',
  secondaryColor: '#f0f5ff',
  accentColor: '#1890ff',
  fontPrimary: 'Inter',
  fontSecondary: 'Georgia',
  logoPosition: 'left',
  headerStyle: 'full-width',
  useClientBranding: false,
  showPageNumbers: true,
  showTableOfContents: true
};

const defaultDelivery: DeliverySettings = {
  format: ['pdf'],
  passwordProtected: false,
  allowDownload: true,
  trackViews: true,
  requireSignature: false
};

const proposalTypes: ProposalType[] = [
  {
    id: 'investment-pitch',
    name: 'Investment Pitch',
    description: 'Seeking funding from investors or VCs',
    icon: '💰',
    category: 'investment',
    suggestedSections: ['cover', 'executive-summary', 'problem', 'solution', 'team', 'pricing', 'timeline'],
    industry: ['Technology', 'Finance', 'Healthcare']
  },
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    description: 'Detailed project scope and deliverables',
    icon: '📋',
    category: 'project',
    suggestedSections: ['cover', 'executive-summary', 'methodology', 'timeline', 'pricing', 'terms'],
    industry: ['Consulting', 'IT', 'Construction']
  },
  {
    id: 'sales-proposal',
    name: 'Sales Proposal',
    description: 'Product or service offering to prospects',
    icon: '🎯',
    category: 'sales',
    suggestedSections: ['cover', 'executive-summary', 'solution', 'case-studies', 'pricing', 'testimonials'],
    industry: ['SaaS', 'Services', 'Manufacturing']
  },
  {
    id: 'partnership',
    name: 'Partnership Proposal',
    description: 'Strategic partnership or JV opportunity',
    icon: '🤝',
    category: 'partnership',
    suggestedSections: ['cover', 'executive-summary', 'about-us', 'solution', 'terms'],
    industry: ['Any']
  },
  {
    id: 'grant-application',
    name: 'Grant Application',
    description: 'Funding applications and grant proposals',
    icon: '🏛️',
    category: 'grant',
    suggestedSections: ['cover', 'executive-summary', 'problem', 'methodology', 'timeline', 'pricing'],
    industry: ['Non-profit', 'Research', 'Education']
  },
  {
    id: 'rfp-response',
    name: 'RFP Response',
    description: 'Response to request for proposals',
    icon: '📄',
    category: 'project',
    suggestedSections: ['cover', 'executive-summary', 'solution', 'methodology', 'team', 'pricing', 'terms'],
    industry: ['Government', 'Enterprise', 'Consulting']
  }
];

// ============ MAIN COMPONENT ============

const WorldClassProposalBuilder: React.FC = () => {
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Phase tracking
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState<number[]>([0, 0, 0, 0, 0]);
  
  // Proposal data
  const [proposal, setProposal] = useState<ProposalData>({
    id: `PROP-${Date.now()}`,
    title: '',
    type: null,
    client: null,
    sections: [],
    design: defaultDesign,
    team: [],
    comments: [],
    versions: [],
    delivery: defaultDelivery,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  // UI State
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Get current user info
  const getCurrentUser = useCallback((): TeamMember => {
    try {
      const auth = localStorage.getItem('siyabusa_auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        return {
          id: parsed.user?.id || 'user-1',
          name: parsed.user?.name || 'Current User',
          email: parsed.user?.email || 'user@company.com',
          avatar: parsed.user?.avatar,
          role: 'owner'
        };
      }
    } catch (e) {}
    return { id: 'user-1', name: 'Current User', email: 'user@company.com', role: 'owner' };
  }, []);
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const saveTimer = setTimeout(() => {
      if (proposal.title || proposal.sections.length > 0) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearTimeout(saveTimer);
  }, [proposal, autoSaveEnabled]);
  
  const handleAutoSave = async () => {
    setIsSaving(true);
    // Simulate API save
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.setItem(`proposal_draft_${proposal.id}`, JSON.stringify(proposal));
    setIsSaving(false);
    message.success({ content: 'Draft saved', key: 'autosave', duration: 1 });
  };
  
  // Phase navigation
  const canProceedToPhase = (phase: number): boolean => {
    switch (phase) {
      case 0: return true;
      case 1: return !!proposal.type && !!proposal.client?.name;
      case 2: return proposal.sections.length > 0;
      case 3: return proposal.sections.some(s => s.content.length > 0);
      case 4: return phaseProgress[2] >= 50;
      default: return false;
    }
  };
  
  const goToPhase = (phase: number) => {
    if (phase >= 0 && phase <= 4) {
      if (phase > currentPhase && !canProceedToPhase(phase)) {
        message.warning('Please complete the current phase before proceeding');
        return;
      }
      setCurrentPhase(phase);
    }
  };
  
  const handlePhaseComplete = (phase: number, progress: number) => {
    const newProgress = [...phaseProgress];
    newProgress[phase] = progress;
    setPhaseProgress(newProgress);
    
    if (progress >= 100 && phase < 4) {
      notification.success({
        message: `Phase ${phase + 1} Complete!`,
        description: 'Ready to proceed to the next phase',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
      });
    }
  };
  
  // Update proposal data handlers
  const updateProposalType = (type: ProposalType) => {
    setProposal(prev => ({
      ...prev,
      type,
      updatedAt: new Date().toISOString()
    }));
  };
  
  const updateClient = (client: ClientInfo) => {
    setProposal(prev => ({
      ...prev,
      client,
      updatedAt: new Date().toISOString()
    }));
  };
  
  const updateSections = (sections: ProposalSection[]) => {
    setProposal(prev => ({
      ...prev,
      sections,
      updatedAt: new Date().toISOString()
    }));
  };
  
  const updateDesign = (design: DesignSettings) => {
    setProposal(prev => ({
      ...prev,
      design,
      updatedAt: new Date().toISOString()
    }));
  };
  
  const updateDelivery = (delivery: DeliverySettings) => {
    setProposal(prev => ({
      ...prev,
      delivery,
      updatedAt: new Date().toISOString()
    }));
  };
  
  const addComment = (comment: Comment) => {
    setProposal(prev => ({
      ...prev,
      comments: [...prev.comments, comment],
      updatedAt: new Date().toISOString()
    }));
  };
  
  const addVersion = () => {
    const newVersion: Version = {
      id: `v-${Date.now()}`,
      number: `${proposal.versions.length + 1}.0`,
      createdBy: getCurrentUser(),
      createdAt: new Date().toISOString(),
      changes: 'Manual version save',
      snapshot: JSON.stringify(proposal)
    };
    setProposal(prev => ({
      ...prev,
      versions: [...prev.versions, newVersion],
      updatedAt: new Date().toISOString()
    }));
    message.success('Version saved');
  };
  
  // Phase configuration
  const phases = [
    { 
      title: 'Intake & Setup', 
      icon: <FileTextOutlined />,
      description: 'Select type, template & client'
    },
    { 
      title: 'AI Content', 
      icon: <BulbOutlined />,
      description: 'Generate & refine content'
    },
    { 
      title: 'Visual Design', 
      icon: <PieChartOutlined />,
      description: 'Branding & layout'
    },
    { 
      title: 'Collaboration', 
      icon: <TeamOutlined />,
      description: 'Review & approve'
    },
    { 
      title: 'Delivery', 
      icon: <SendOutlined />,
      description: 'Export & track'
    }
  ];
  
  // Calculate overall progress
  const overallProgress = Math.round(
    phaseProgress.reduce((sum, p) => sum + p, 0) / 5
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <Button 
                type="text" 
                icon={<HomeOutlined />} 
                onClick={() => navigate('/proposals')}
                style={{ color: 'white' }}
              >
                Proposals
              </Button>
              <div>
                <Title level={4} style={{ color: 'white', margin: 0 }}>
                  <RocketOutlined style={{ marginRight: 8 }} />
                  {proposal.title || 'New Proposal'}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                  {proposal.type?.name || 'Select proposal type to begin'}
                </Text>
              </div>
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Tooltip title="Overall Progress">
                <Progress 
                  type="circle" 
                  percent={overallProgress} 
                  size={40}
                  strokeColor="#52c41a"
                  trailColor="rgba(255,255,255,0.2)"
                  format={p => <span style={{ color: 'white', fontSize: 10 }}>{p}%</span>}
                />
              </Tooltip>
              
              <Badge dot={isSaving} offset={[-5, 5]}>
                <Button 
                  type="text" 
                  icon={<CloudSyncOutlined spin={isSaving} />}
                  style={{ color: 'white' }}
                  onClick={handleAutoSave}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </Badge>
              
              <Button 
                type="text" 
                icon={<SaveOutlined />}
                style={{ color: 'white' }}
                onClick={addVersion}
              >
                Save Version
              </Button>
              
              <Button 
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => setShowPreview(true)}
                ghost
              >
                Preview
              </Button>
              
              <Button 
                type="text"
                icon={<SettingOutlined />}
                style={{ color: 'white' }}
                onClick={() => setShowSettings(true)}
              />
            </Space>
          </Col>
        </Row>
      </div>
      
      {/* Phase Steps */}
      <div style={{ 
        background: 'white', 
        padding: '20px 40px',
        borderBottom: '1px solid #e8e8e8',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <Steps 
          current={currentPhase} 
          onChange={goToPhase}
          items={phases.map((phase, index) => ({
            title: phase.title,
            description: (
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: 11 }}>{phase.description}</Text>
                <Progress 
                  percent={phaseProgress[index]} 
                  size="small" 
                  showInfo={false}
                  strokeColor={phaseProgress[index] >= 100 ? '#52c41a' : '#1890ff'}
                  style={{ width: 100, marginTop: 4 }}
                />
              </Space>
            ),
            icon: (
              <Badge 
                count={phaseProgress[index] >= 100 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 0}
                offset={[0, 0]}
              >
                <Avatar 
                  size={40}
                  style={{ 
                    background: currentPhase === index 
                      ? 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)' 
                      : phaseProgress[index] >= 100 
                        ? '#52c41a'
                        : '#f0f0f0',
                    color: currentPhase === index || phaseProgress[index] >= 100 ? 'white' : '#666'
                  }}
                  icon={phase.icon}
                />
              </Badge>
            ),
            status: phaseProgress[index] >= 100 ? 'finish' : currentPhase === index ? 'process' : 'wait'
          }))}
        />
      </div>
      
      {/* Main Content */}
      <Content style={{ padding: '24px', overflow: 'auto' }}>
        {currentPhase === 0 && (
          <PhaseIntake
            proposal={proposal}
            proposalTypes={proposalTypes}
            onTypeSelect={updateProposalType}
            onClientUpdate={updateClient}
            onSectionsInit={updateSections}
            onPhaseComplete={(progress) => handlePhaseComplete(0, progress)}
          />
        )}
        
        {currentPhase === 1 && (
          <PhaseAIContent
            proposal={proposal}
            onSectionsUpdate={updateSections}
            onTitleUpdate={(title) => setProposal(prev => ({ ...prev, title }))}
            onPhaseComplete={(progress) => handlePhaseComplete(1, progress)}
          />
        )}
        
        {currentPhase === 2 && (
          <PhaseVisualDesign
            proposal={proposal}
            onDesignUpdate={updateDesign}
            onPhaseComplete={(progress) => handlePhaseComplete(2, progress)}
          />
        )}
        
        {currentPhase === 3 && (
          <PhaseCollaboration
            proposal={proposal}
            currentUser={getCurrentUser()}
            onCommentAdd={addComment}
            onVersionSave={addVersion}
            onStatusChange={(status) => setProposal(prev => ({ ...prev, status }))}
            onPhaseComplete={(progress) => handlePhaseComplete(3, progress)}
          />
        )}
        
        {currentPhase === 4 && (
          <PhaseDelivery
            proposal={proposal}
            onDeliveryUpdate={updateDelivery}
            onStatusChange={(status) => setProposal(prev => ({ ...prev, status }))}
            onPhaseComplete={(progress) => handlePhaseComplete(4, progress)}
          />
        )}
      </Content>
      
      {/* Bottom Navigation */}
      <div style={{ 
        background: 'white', 
        padding: '16px 24px',
        borderTop: '1px solid #e8e8e8',
        position: 'sticky',
        bottom: 0
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={() => goToPhase(currentPhase - 1)}
              disabled={currentPhase === 0}
            >
              Previous Phase
            </Button>
          </Col>
          
          <Col>
            <Space>
              <Text type="secondary">
                Phase {currentPhase + 1} of 5: {phases[currentPhase].title}
              </Text>
            </Space>
          </Col>
          
          <Col>
            {currentPhase < 4 ? (
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => goToPhase(currentPhase + 1)}
                disabled={!canProceedToPhase(currentPhase + 1)}
              >
                Next Phase
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Send Proposal
              </Button>
            )}
          </Col>
        </Row>
      </div>
      
      {/* Live Preview Drawer */}
      <Drawer
        title={
          <Space>
            <EyeOutlined />
            <span>Live Preview</span>
          </Space>
        }
        placement="right"
        width="60%"
        onClose={() => setShowPreview(false)}
        open={showPreview}
        extra={
          <Button type="primary" icon={<SendOutlined />}>
            Send Now
          </Button>
        }
      >
        <ProposalLivePreview proposal={proposal} />
      </Drawer>
      
      {/* Settings Modal */}
      <Modal
        title="Proposal Settings"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        footer={null}
        width={600}
      >
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Auto-save</Text>
              <Button 
                type={autoSaveEnabled ? 'primary' : 'default'}
                size="small"
                style={{ marginLeft: 16 }}
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              >
                {autoSaveEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div>
              <Text strong>Proposal ID:</Text> <Text code>{proposal.id}</Text>
            </div>
            <div>
              <Text strong>Created:</Text> <Text>{new Date(proposal.createdAt).toLocaleString()}</Text>
            </div>
            <div>
              <Text strong>Last Updated:</Text> <Text>{new Date(proposal.updatedAt).toLocaleString()}</Text>
            </div>
            <div>
              <Text strong>Versions:</Text> <Text>{proposal.versions.length}</Text>
            </div>
          </Space>
        </Card>
      </Modal>
    </Layout>
  );
};

export default WorldClassProposalBuilder;
