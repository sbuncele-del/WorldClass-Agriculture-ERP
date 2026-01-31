import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Button, Space, Typography, Avatar, Row, Col, Tooltip,
  Badge, Modal, Input, Select, message, Drawer, List, Tag
} from 'antd';
import { 
  VideoCameraOutlined, AudioOutlined, AudioMutedOutlined,
  DesktopOutlined, MessageOutlined, UserAddOutlined,
  SettingOutlined, FullscreenOutlined, PhoneOutlined,
  TeamOutlined, CloseOutlined, ExpandOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../../services/api';
import './VideoCall.css';

const { Title, Text } = Typography;

interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  isHost: boolean;
  isScreenSharing: boolean;
}

const VideoCall: React.FC = () => {
  const navigate = useNavigate();
  const { callId } = useParams();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await apiClient.get(`/api/communications/calls/${callId}/participants`);
        const data = response.data?.data || response.data || [];
        // Add current user if not present
        if (!data.find((p: Participant) => p.id === '1')) {
          data.unshift({ id: '1', name: 'You', isMuted: false, isVideoOff: false, isSpeaking: false, isHost: true, isScreenSharing: false });
        }
        setParticipants(data);
      } catch (err) {
        console.error('Error fetching participants:', err);
        // Default to current user
        setParticipants([{ id: '1', name: 'You', isMuted: false, isVideoOff: false, isSpeaking: false, isHost: true, isScreenSharing: false }]);
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, [callId]);

  // Timer for call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setParticipants(participants.map(p => 
      p.id === '1' ? { ...p, isMuted: !isMuted } : p
    ));
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    setParticipants(participants.map(p => 
      p.id === '1' ? { ...p, isVideoOff: !isVideoOff } : p
    ));
  };

  const toggleScreenShare = () => {
    if (!isScreenSharing) {
      message.success('Screen sharing started');
    } else {
      message.info('Screen sharing stopped');
    }
    setIsScreenSharing(!isScreenSharing);
  };

  const endCall = () => {
    Modal.confirm({
      title: 'Leave Meeting',
      content: 'Are you sure you want to leave this meeting?',
      okText: 'Leave',
      okType: 'danger',
      onOk: () => {
        navigate('/communication');
        message.info('You left the meeting');
      }
    });
  };

  // Layout calculation
  const getGridLayout = () => {
    const count = participants.length;
    if (count === 1) return { cols: 1, rows: 1 };
    if (count === 2) return { cols: 2, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 3, rows: 2 };
    return { cols: 3, rows: 3 };
  };

  const layout = getGridLayout();

  return (
    <div className="video-call">
      {/* Header */}
      <div className="call-header">
        <div className="call-info">
          <Title level={5} style={{ margin: 0, color: 'white' }}>Team Meeting</Title>
          <Space>
            <Badge status="success" />
            <Text style={{ color: '#ccc' }}>{formatDuration(callDuration)}</Text>
            <Text style={{ color: '#ccc' }}>•</Text>
            <Text style={{ color: '#ccc' }}>{participants.length} participants</Text>
          </Space>
        </div>
        <Space>
          <Tooltip title="Invite">
            <Button type="text" icon={<UserAddOutlined />} style={{ color: 'white' }} onClick={() => setInviteModalVisible(true)} />
          </Tooltip>
          <Tooltip title="Settings">
            <Button type="text" icon={<SettingOutlined />} style={{ color: 'white' }} />
          </Tooltip>
          <Tooltip title="Fullscreen">
            <Button type="text" icon={<FullscreenOutlined />} style={{ color: 'white' }} />
          </Tooltip>
        </Space>
      </div>

      {/* Video Grid */}
      <div className="video-grid" style={{ 
        gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rows}, 1fr)`
      }}>
        {participants.map((participant) => (
          <div 
            key={participant.id} 
            className={`video-tile ${participant.isSpeaking ? 'speaking' : ''}`}
          >
            {participant.isVideoOff ? (
              <div className="video-placeholder">
                <Avatar size={80}>{participant.name[0]}</Avatar>
                <Text style={{ color: 'white', marginTop: 8 }}>{participant.name}</Text>
              </div>
            ) : (
              <div className="video-feed">
                {/* In a real app, this would be the actual video stream */}
                <div className="mock-video" style={{ 
                  background: `linear-gradient(135deg, ${participant.id === '1' ? '#667eea' : participant.id === '2' ? '#764ba2' : participant.id === '3' ? '#f093fb' : '#f5576c'} 0%, #4facfe 100%)`
                }}>
                  <Avatar size={60} style={{ opacity: 0.3 }}>{participant.name[0]}</Avatar>
                </div>
              </div>
            )}
            
            <div className="video-overlay">
              <div className="participant-info">
                {participant.isMuted && <AudioMutedOutlined style={{ color: '#ff4d4f' }} />}
                <span>{participant.name} {participant.isHost && <Tag color="blue" style={{ marginLeft: 4 }}>Host</Tag>}</span>
              </div>
              {participant.isScreenSharing && (
                <Tag color="green" style={{ position: 'absolute', top: 8, right: 8 }}>
                  <DesktopOutlined /> Sharing
                </Tag>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="call-controls">
        <div className="control-group">
          <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
            <Button
              type={isMuted ? 'primary' : 'default'}
              danger={isMuted}
              shape="circle"
              size="large"
              icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
              onClick={toggleMute}
            />
          </Tooltip>
          <Tooltip title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
            <Button
              type={isVideoOff ? 'primary' : 'default'}
              danger={isVideoOff}
              shape="circle"
              size="large"
              icon={<VideoCameraOutlined />}
              onClick={toggleVideo}
            />
          </Tooltip>
          <Tooltip title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
            <Button
              type={isScreenSharing ? 'primary' : 'default'}
              shape="circle"
              size="large"
              icon={<DesktopOutlined />}
              onClick={toggleScreenShare}
              style={isScreenSharing ? { background: '#52c41a', borderColor: '#52c41a' } : {}}
            />
          </Tooltip>
        </div>

        <div className="control-group">
          <Tooltip title="Participants">
            <Badge count={participants.length}>
              <Button
                type={showParticipants ? 'primary' : 'default'}
                shape="circle"
                size="large"
                icon={<TeamOutlined />}
                onClick={() => setShowParticipants(!showParticipants)}
              />
            </Badge>
          </Tooltip>
          <Tooltip title="Chat">
            <Button
              type={showChat ? 'primary' : 'default'}
              shape="circle"
              size="large"
              icon={<MessageOutlined />}
              onClick={() => setShowChat(!showChat)}
            />
          </Tooltip>
        </div>

        <div className="control-group">
          <Tooltip title="Leave call">
            <Button
              type="primary"
              danger
              shape="circle"
              size="large"
              icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />}
              onClick={endCall}
            />
          </Tooltip>
        </div>
      </div>

      {/* Participants Drawer */}
      <Drawer
        title={`Participants (${participants.length})`}
        placement="right"
        width={300}
        open={showParticipants}
        onClose={() => setShowParticipants(false)}
        mask={false}
        className="call-drawer"
      >
        <List
          dataSource={participants}
          renderItem={participant => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar>{participant.name[0]}</Avatar>}
                title={
                  <Space>
                    {participant.name}
                    {participant.isHost && <Tag color="blue">Host</Tag>}
                  </Space>
                }
                description={
                  <Space>
                    {participant.isMuted && <AudioMutedOutlined style={{ color: '#ff4d4f' }} />}
                    {participant.isVideoOff && <VideoCameraOutlined style={{ color: '#ff4d4f' }} />}
                    {participant.isScreenSharing && <DesktopOutlined style={{ color: '#52c41a' }} />}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Chat Drawer */}
      <Drawer
        title="Meeting Chat"
        placement="right"
        width={350}
        open={showChat}
        onClose={() => setShowChat(false)}
        mask={false}
        className="call-drawer"
      >
        <div className="chat-placeholder">
          <MessageOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <Text type="secondary">Chat messages will appear here</Text>
        </div>
      </Drawer>

      {/* Invite Modal */}
      <Modal
        title="Invite to Meeting"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text type="secondary">Meeting Link</Text>
            <Input.Search
              value="https://siyabusa.app/meet/abc123"
              readOnly
              enterButton="Copy"
              onSearch={() => {
                navigator.clipboard.writeText('https://siyabusa.app/meet/abc123');
                message.success('Link copied!');
              }}
            />
          </div>
          <div>
            <Text type="secondary">Invite by Email</Text>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Enter email addresses"
            />
          </div>
          <Button type="primary" block>Send Invites</Button>
        </Space>
      </Modal>
    </div>
  );
};

export default VideoCall;
