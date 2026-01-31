/**
 * Phase 4: Review & Collaboration
 * 
 * Features:
 * - Real-time collaboration with team members
 * - Comments and suggestions
 * - Version history
 * - Approval workflow
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Space, Button, Input, Avatar, Tag,
  Timeline, List, Badge, Tooltip, Modal, Select, message, Divider,
  Dropdown, Progress, Alert, Switch, Popover, Steps
} from 'antd';
import {
  TeamOutlined, CommentOutlined, HistoryOutlined, CheckOutlined,
  CloseOutlined, UserAddOutlined, SendOutlined, BellOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined,
  MessageOutlined, LikeOutlined, DislikeOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, StarOutlined,
  CrownOutlined, SafetyCertificateOutlined, AuditOutlined, RollbackOutlined
} from '@ant-design/icons';
import type { ProposalData, TeamMember, Comment as CommentType, Version } from '../../WorldClassProposalBuilder';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface PhaseCollaborationProps {
  proposal: ProposalData;
  currentUser: TeamMember;
  onCommentAdd: (comment: CommentType) => void;
  onVersionSave: () => void;
  onStatusChange: (status: ProposalData['status']) => void;
  onPhaseComplete: (progress: number) => void;
}

// Approval workflow steps
const approvalSteps = [
  { title: 'Draft', description: 'Initial creation' },
  { title: 'Internal Review', description: 'Team review' },
  { title: 'Manager Approval', description: 'Management sign-off' },
  { title: 'Final Review', description: 'Quality check' },
  { title: 'Ready to Send', description: 'Approved' }
];

const PhaseCollaboration: React.FC<PhaseCollaborationProps> = ({
  proposal,
  currentUser,
  onCommentAdd,
  onVersionSave,
  onStatusChange,
  onPhaseComplete
}) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [approvalStep, setApprovalStep] = useState(2);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer' | 'approver'>('viewer');
  
  // Fetch collaboration data from API
  useEffect(() => {
    const fetchCollaborationData = async () => {
      try {
        const [teamRes, commentsRes, versionsRes] = await Promise.all([
          fetch(`/api/proposals/${proposal.id}/team`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch(`/api/proposals/${proposal.id}/comments`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch(`/api/proposals/${proposal.id}/versions`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        if (teamRes.ok) {
          const data = await teamRes.json();
          setTeam(data.team || data || []);
        }
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setComments(data.comments || data || []);
        }
        if (versionsRes.ok) {
          const data = await versionsRes.json();
          setVersions(data.versions || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch collaboration data:', error);
      }
    };
    if (proposal.id) fetchCollaborationData();
  }, [proposal.id]);
  
  // Calculate completion progress
  useEffect(() => {
    let progress = 0;
    if (team.length > 1) progress += 25;
    if (comments.some(c => c.resolved)) progress += 25;
    if (approvalStep >= 2) progress += 25;
    if (approvalStep >= 4) progress += 25;
    onPhaseComplete(Math.min(progress, 100));
  }, [team, comments, approvalStep]);
  
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: CommentType = {
      id: `comment-${Date.now()}`,
      sectionId: selectedSection,
      author: currentUser,
      content: newComment,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    setComments([comment, ...comments]);
    onCommentAdd(comment);
    setNewComment('');
    message.success('Comment added');
  };
  
  const handleResolveComment = (commentId: string) => {
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, resolved: true } : c
    ));
    message.success('Comment resolved');
  };
  
  const handleInviteTeamMember = () => {
    if (!inviteEmail) return;
    
    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      online: false
    };
    
    setTeam([...team, newMember]);
    setInviteEmail('');
    setShowInviteModal(false);
    message.success(`Invitation sent to ${inviteEmail}`);
  };
  
  const handleApprovalAction = (action: 'approve' | 'reject' | 'request-changes') => {
    switch (action) {
      case 'approve':
        setApprovalStep(Math.min(approvalStep + 1, 4));
        message.success('Proposal approved! Moving to next stage.');
        if (approvalStep >= 3) {
          onStatusChange('approved');
        }
        break;
      case 'reject':
        setApprovalStep(0);
        message.error('Proposal rejected. Returning to draft.');
        onStatusChange('draft');
        break;
      case 'request-changes':
        message.warning('Changes requested. Please review comments.');
        break;
    }
  };
  
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      review: 'processing',
      approved: 'success',
      sent: 'purple',
      viewed: 'blue',
      signed: 'green',
      expired: 'error'
    };
    return colors[status] || 'default';
  };
  
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'gold',
      editor: 'blue',
      viewer: 'default',
      approver: 'purple'
    };
    return colors[role] || 'default';
  };
  
  const filteredComments = selectedSection === 'all' 
    ? comments 
    : comments.filter(c => c.sectionId === selectedSection);
  
  const unresolvedCount = comments.filter(c => !c.resolved).length;

  return (
    <Row gutter={24}>
      {/* Main Content */}
      <Col span={16}>
        {/* Approval Workflow */}
        <Card 
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
              <span>Approval Workflow</span>
              <Tag color={approvalStep >= 4 ? 'success' : 'processing'}>
                {approvalStep >= 4 ? 'Approved' : 'In Progress'}
              </Tag>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Steps
            current={approvalStep}
            items={approvalSteps.map((step, index) => ({
              title: step.title,
              description: step.description,
              status: index < approvalStep ? 'finish' : 
                      index === approvalStep ? 'process' : 'wait'
            }))}
          />
          
          <Divider />
          
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary">
                Current Stage: <Text strong>{approvalSteps[approvalStep]?.title}</Text>
              </Text>
            </Col>
            <Col>
              <Space>
                <Button 
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleApprovalAction('reject')}
                >
                  Reject
                </Button>
                <Button 
                  icon={<ExclamationCircleOutlined />}
                  onClick={() => handleApprovalAction('request-changes')}
                >
                  Request Changes
                </Button>
                <Button 
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprovalAction('approve')}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Approve & Continue
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
        
        {/* Comments Section */}
        <Card 
          title={
            <Space>
              <CommentOutlined />
              <span>Comments & Feedback</span>
              <Badge count={unresolvedCount} style={{ marginLeft: 8 }} />
            </Space>
          }
          extra={
            <Select
              value={selectedSection}
              onChange={setSelectedSection}
              style={{ width: 200 }}
              size="small"
            >
              <Select.Option value="all">All Sections</Select.Option>
              {proposal.sections.map(s => (
                <Select.Option key={s.id} value={s.id}>{s.title}</Select.Option>
              ))}
            </Select>
          }
        >
          {/* Add Comment */}
          <div style={{ marginBottom: 24 }}>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment or suggestion..."
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ flex: 1 }}
              />
            </Space.Compact>
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Add Comment
              </Button>
            </div>
          </div>
          
          <Divider />
          
          {/* Comments List */}
          <List
            dataSource={filteredComments}
            renderItem={comment => (
              <List.Item
                style={{
                  background: comment.resolved ? '#f6ffed' : 'white',
                  padding: 16,
                  marginBottom: 8,
                  borderRadius: 8,
                  border: `1px solid ${comment.resolved ? '#b7eb8f' : '#e8e8e8'}`
                }}
                actions={[
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<MessageOutlined />}
                    key="reply"
                  >
                    Reply
                  </Button>,
                  !comment.resolved && (
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleResolveComment(comment.id)}
                      key="resolve"
                      style={{ color: '#52c41a' }}
                    >
                      Resolve
                    </Button>
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={comment.author.online} color="green" offset={[-4, 32]}>
                      <Avatar style={{ background: getRoleColor(comment.author.role) === 'gold' ? '#faad14' : '#1890ff' }}>
                        {comment.author.name.charAt(0)}
                      </Avatar>
                    </Badge>
                  }
                  title={
                    <Space>
                      <Text strong>{comment.author.name}</Text>
                      <Tag size="small" color={getRoleColor(comment.author.role)}>
                        {comment.author.role}
                      </Tag>
                      {comment.resolved && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          Resolved
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Paragraph style={{ margin: 0 }}>{comment.content}</Paragraph>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {new Date(comment.timestamp).toLocaleString()}
                        {comment.sectionId !== 'all' && (
                          <> • <Tag size="small">
                            {proposal.sections.find(s => s.id === comment.sectionId)?.title || 'General'}
                          </Tag></>
                        )}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: 'No comments yet' }}
          />
        </Card>
      </Col>
      
      {/* Sidebar */}
      <Col span={8}>
        {/* Team Members */}
        <Card 
          title={
            <Space>
              <TeamOutlined />
              <span>Team</span>
            </Space>
          }
          extra={
            <Button 
              type="primary" 
              size="small"
              icon={<UserAddOutlined />}
              onClick={() => setShowInviteModal(true)}
            >
              Invite
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          <List
            dataSource={team}
            renderItem={member => (
              <List.Item
                actions={[
                  <Dropdown
                    key="more"
                    menu={{
                      items: [
                        { key: 'message', label: 'Send Message', icon: <MessageOutlined /> },
                        { key: 'role', label: 'Change Role', icon: <EditOutlined /> },
                        { key: 'remove', label: 'Remove', icon: <DeleteOutlined />, danger: true }
                      ]
                    }}
                  >
                    <Button type="text" size="small" icon={<MoreOutlined />} />
                  </Dropdown>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge 
                      dot={member.online} 
                      color={member.online ? 'green' : 'default'}
                      offset={[-4, 32]}
                    >
                      <Avatar style={{ 
                        background: member.role === 'owner' ? '#faad14' : 
                                    member.role === 'approver' ? '#722ed1' : '#1890ff'
                      }}>
                        {member.name.charAt(0)}
                      </Avatar>
                    </Badge>
                  }
                  title={
                    <Space size={4}>
                      <Text>{member.name}</Text>
                      {member.role === 'owner' && (
                        <CrownOutlined style={{ color: '#faad14' }} />
                      )}
                    </Space>
                  }
                  description={
                    <Space size={4}>
                      <Tag size="small" color={getRoleColor(member.role)}>
                        {member.role}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {member.online ? 'Online' : 'Offline'}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
        
        {/* Version History */}
        <Card 
          title={
            <Space>
              <HistoryOutlined />
              <span>Version History</span>
            </Space>
          }
          extra={
            <Button 
              size="small"
              onClick={() => {
                onVersionSave();
                setVersions([{
                  id: `v-${Date.now()}`,
                  number: `${versions.length + 1}.0`,
                  createdBy: currentUser,
                  createdAt: new Date().toISOString(),
                  changes: 'Manual save'
                }, ...versions]);
              }}
            >
              Save Version
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          <Timeline
            items={versions.map(version => ({
              color: version === versions[0] ? 'green' : 'gray',
              children: (
                <div>
                  <Space>
                    <Text strong>v{version.number}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(version.createdAt).toLocaleDateString()}
                    </Text>
                  </Space>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {version.changes}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      by {version.createdBy.name}
                    </Text>
                  </div>
                  <Space style={{ marginTop: 4 }}>
                    <Button type="link" size="small" style={{ padding: 0, fontSize: 11 }}>
                      Preview
                    </Button>
                    <Button type="link" size="small" style={{ padding: 0, fontSize: 11 }}>
                      Restore
                    </Button>
                  </Space>
                </div>
              )
            }))}
          />
        </Card>
        
        {/* Activity Feed */}
        <Card 
          title={
            <Space>
              <BellOutlined />
              <span>Recent Activity</span>
            </Space>
          }
          size="small"
        >
          <Timeline
            items={[
              {
                color: 'green',
                children: (
                  <Text style={{ fontSize: 12 }}>
                    <Text strong>Lisa</Text> approved pricing section
                    <br />
                    <Text type="secondary" style={{ fontSize: 10 }}>2 hours ago</Text>
                  </Text>
                )
              },
              {
                color: 'blue',
                children: (
                  <Text style={{ fontSize: 12 }}>
                    <Text strong>Michael</Text> added a comment
                    <br />
                    <Text type="secondary" style={{ fontSize: 10 }}>3 hours ago</Text>
                  </Text>
                )
              },
              {
                color: 'gray',
                children: (
                  <Text style={{ fontSize: 12 }}>
                    <Text strong>Sarah</Text> updated executive summary
                    <br />
                    <Text type="secondary" style={{ fontSize: 10 }}>5 hours ago</Text>
                  </Text>
                )
              },
              {
                color: 'gray',
                children: (
                  <Text style={{ fontSize: 12 }}>
                    <Text strong>Sarah</Text> created proposal
                    <br />
                    <Text type="secondary" style={{ fontSize: 10 }}>Yesterday</Text>
                  </Text>
                )
              }
            ]}
          />
        </Card>
      </Col>
      
      {/* Invite Modal */}
      <Modal
        title="Invite Team Member"
        open={showInviteModal}
        onCancel={() => setShowInviteModal(false)}
        onOk={handleInviteTeamMember}
        okText="Send Invitation"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>Email Address</Text>
            <Input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text strong>Role</Text>
            <Select
              value={inviteRole}
              onChange={setInviteRole}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Select.Option value="viewer">
                <Space>
                  <EyeOutlined />
                  <span>Viewer - Can view only</span>
                </Space>
              </Select.Option>
              <Select.Option value="editor">
                <Space>
                  <EditOutlined />
                  <span>Editor - Can edit content</span>
                </Space>
              </Select.Option>
              <Select.Option value="approver">
                <Space>
                  <CheckCircleOutlined />
                  <span>Approver - Can approve</span>
                </Space>
              </Select.Option>
            </Select>
          </div>
          <Alert
            message="The invited user will receive an email with a link to access this proposal."
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    </Row>
  );
};

export default PhaseCollaboration;
