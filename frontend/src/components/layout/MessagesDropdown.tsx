import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import './MessagesDropdown.css';

interface Message {
  id: string;
  type: 'approval' | 'task' | 'message';
  icon: string;
  title: string;
  description: string;
  time: string;
  actionable: boolean;
  link?: string;
}

interface MessagesDropdownProps {
  onClose: () => void;
}

const MessagesDropdown: React.FC<MessagesDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await apiClient.get('/api/messages');
      const data = response.data?.data || response.data || [];
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`Approved item ${messageId}`);
  };

  const handleReject = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`Rejected item ${messageId}`);
  };

  const handleMessageClick = (message: Message) => {
    if (message.link) {
      navigate(message.link);
      onClose();
    }
  };

  return (
    <div className="messages-dropdown">
      <div className="dropdown-header">
        <div>
          <h3>Inbox</h3>
          <span className="pending-badge">{messages.filter(m => m.actionable).length} pending</span>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="messages-list">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '2rem' }}>📭</span>
            <p>No messages</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-item ${message.actionable ? 'actionable' : ''}`}
              onClick={() => handleMessageClick(message)}
            >
              <div className="message-icon">{message.icon}</div>
              <div className="message-content">
                <div className="message-title">{message.title}</div>
                <div className="message-description">{message.description}</div>
                <div className="message-time">{message.time}</div>
                
                {message.actionable && message.type === 'approval' && (
                  <div className="message-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="action-btn approve"
                      onClick={(e) => handleApprove(message.id, e)}
                    >
                      Approve
                    </button>
                    <button 
                      className="action-btn reject"
                      onClick={(e) => handleReject(message.id, e)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="dropdown-footer">
        <button className="footer-btn primary" onClick={() => { navigate('/inbox'); onClose(); }}>
          View All Tasks
        </button>
      </div>
    </div>
  );
};

export default MessagesDropdown;
