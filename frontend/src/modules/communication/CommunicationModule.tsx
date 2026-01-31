import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

// Lazy load communication pages
const CommunicationHub = lazy(() => import('./pages/CommunicationHub'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));
const VideoCall = lazy(() => import('./pages/VideoCall'));
const Channels = lazy(() => import('./pages/Channels'));
const DirectMessages = lazy(() => import('./pages/DirectMessages'));
const Announcements = lazy(() => import('./pages/Announcements'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <Spin size="large" tip="Loading..." />
  </div>
);

const CommunicationModule: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<CommunicationHub />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
        <Route path="/video/:callId" element={<VideoCall />} />
        <Route path="/channels" element={<Channels />} />
        <Route path="/channels/:channelId" element={<ChatRoom />} />
        <Route path="/messages" element={<DirectMessages />} />
        <Route path="/messages/:userId" element={<ChatRoom />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="*" element={<Navigate to="/communication" replace />} />
      </Routes>
    </Suspense>
  );
};

export default CommunicationModule;
