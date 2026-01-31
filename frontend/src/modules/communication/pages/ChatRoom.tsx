import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, Input, Button, Avatar, Space, Typography, List, Badge,
  Dropdown, Tooltip, Upload, Drawer, Form, Tag, Divider
} from 'antd';
import { 
  SendOutlined, SmileOutlined, PaperClipOutlined, PhoneOutlined,
  VideoCameraOutlined, MoreOutlined, PushpinOutlined, SearchOutlined,
  UserOutlined, InfoCircleOutlined, ArrowLeftOutlined, TagOutlined,
  FileImageOutlined, FileOutlined, PictureOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../../services/api';
import './ChatRoom.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Message {
  id: string;
  sender: { id: string; name: string; avatar?: string };
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  reactions?: { emoji: string; count: number }[];
  replyTo?: { sender: string; content: string };
  attachments?: { name: string; type: string; size: string }[];
}

interface RoomMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'away' | 'offline';
}

const statusColors = {
  online: '#52c41a',
  away: '#faad14',
  offline: '#d9d9d9'
};

const ChatRoom: React.FC = () => {
  const navigate = useNavigate();
  const { roomId, channelId, userId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine room type and name
  const roomType = channelId ? 'channel' : userId ? 'dm' : 'room';
  const roomName = channelId ? 'website-redesign' : userId ? 'Sarah Johnson' : 'General';

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const chatId = roomId || channelId || userId;
        const [messagesRes, membersRes] = await Promise.all([
          apiClient.get(`/api/communications/chat/${chatId}/messages`),
          apiClient.get(`/api/communications/chat/${chatId}/members`)
        ]);
        setMessages(messagesRes.data?.data || messagesRes.data || []);
        setMembers(membersRes.data?.data || membersRes.data || []);
      } catch (err) {
        console.error('Error fetching chat data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChatData();
  }, [roomId, channelId, userId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: String(Date.now()),
      sender: { id: '1', name: 'You' },
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-room">
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/communication')} />
          <div className="room-info">
            {roomType === 'channel' ? (
              <Avatar style={{ background: '#722ed1' }}>#</Avatar>
            ) : (
              <Badge dot color={statusColors.online} offset={[-4, 28]}>
                <Avatar size="large">{roomName[0]}</Avatar>
              </Badge>
            )}
            <div>
              <Title level={5} style={{ margin: 0 }}>{roomName}</Title>
              {roomType === 'channel' && (
                <Text type="secondary">{members.length} members</Text>
              )}
              {roomType === 'dm' && (
                <Text type="secondary" style={{ color: '#52c41a' }}>Online</Text>
              )}
            </div>
          </div>
        </div>
        <Space>
          <Tooltip title="Search">
            <Button type="text" icon={<SearchOutlined />} />
          </Tooltip>
          <Tooltip title="Voice Call">
            <Button type="text" icon={<PhoneOutlined />} />
          </Tooltip>
          <Tooltip title="Video Call">
            <Button type="text" icon={<VideoCameraOutlined />} onClick={() => navigate('/communication/video/new')} />
          </Tooltip>
          {roomType === 'channel' && (
            <Tooltip title="Pin Channel">
              <Button type="text" icon={<PushpinOutlined />} />
            </Tooltip>
          )}
          <Tooltip title="Details">
            <Button type="text" icon={<InfoCircleOutlined />} onClick={() => setShowInfo(true)} />
          </Tooltip>
        </Space>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message, index) => {
          const isOwn = message.sender.id === '1';
          const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id;
          
          if (message.type === 'system') {
            return (
              <div key={message.id} className="system-message">
                <Text type="secondary">{message.content}</Text>
              </div>
            );
          }

          return (
            <div key={message.id} className={`message ${isOwn ? 'own' : ''}`}>
              {showAvatar && !isOwn && (
                <Avatar className="message-avatar">{message.sender.name[0]}</Avatar>
              )}
              {!showAvatar && !isOwn && <div className="avatar-placeholder" />}
              
              <div className="message-content">
                {showAvatar && (
                  <div className="message-header">
                    <Text strong>{message.sender.name}</Text>
                    <Text type="secondary" className="message-time">{message.timestamp}</Text>
                  </div>
                )}
                
                {message.replyTo && (
                  <div className="reply-preview">
                    <Text type="secondary" className="reply-sender">{message.replyTo.sender}</Text>
                    <Text className="reply-text">{message.replyTo.content}</Text>
                  </div>
                )}
                
                <div className="message-bubble">
                  <Text>{message.content}</Text>
                  
                  {message.attachments && (
                    <div className="message-attachments">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx} className="attachment">
                          <FileOutlined />
                          <span>{attachment.name}</span>
                          <span className="attachment-size">{attachment.size}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {message.reactions && (
                  <div className="message-reactions">
                    {message.reactions.map((reaction, idx) => (
                      <Tag key={idx} className="reaction-tag">
                        {reaction.emoji} {reaction.count}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <div className="input-actions">
          <Tooltip title="Attach File">
            <Upload showUploadList={false}>
              <Button type="text" icon={<PaperClipOutlined />} />
            </Upload>
          </Tooltip>
          <Tooltip title="Add Image">
            <Button type="text" icon={<FileImageOutlined />} />
          </Tooltip>
          <Tooltip title="GIF">
            <Button type="text" icon={<PictureOutlined />} />
          </Tooltip>
          <Tooltip title="Mention">
            <Button type="text" icon={<TagOutlined />} />
          </Tooltip>
        </div>
        <TextArea
          placeholder={`Message ${roomType === 'channel' ? '#' + roomName : roomName}...`}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          autoSize={{ minRows: 1, maxRows: 4 }}
          className="message-input"
        />
        <div className="send-actions">
          <Tooltip title="Emoji">
            <Button type="text" icon={<SmileOutlined />} />
          </Tooltip>
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          />
        </div>
      </div>

      {/* Info Drawer */}
      <Drawer
        title={roomType === 'channel' ? 'Channel Details' : 'Conversation Details'}
        placement="right"
        width={350}
        open={showInfo}
        onClose={() => setShowInfo(false)}
      >
        {roomType === 'channel' ? (
          <>
            <div className="info-section">
              <Text type="secondary">About</Text>
              <Text>Project channel for the website redesign initiative.</Text>
            </div>
            <Divider />
            <div className="info-section">
              <div className="section-header">
                <Text type="secondary">Members ({members.length})</Text>
                <Button type="link" size="small">Add</Button>
              </div>
              <List
                dataSource={members}
                renderItem={member => (
                  <List.Item className="member-item">
                    <List.Item.Meta
                      avatar={
                        <Badge dot color={statusColors[member.status]}>
                          <Avatar>{member.name[0]}</Avatar>
                        </Badge>
                      }
                      title={member.name}
                      description={member.role}
                    />
                  </List.Item>
                )}
              />
            </div>
          </>
        ) : (
          <div className="dm-info">
            <Avatar size={80}>{roomName[0]}</Avatar>
            <Title level={4}>{roomName}</Title>
            <Tag color="green">Online</Tag>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<PhoneOutlined />}>Voice Call</Button>
              <Button block icon={<VideoCameraOutlined />}>Video Call</Button>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ChatRoom;
