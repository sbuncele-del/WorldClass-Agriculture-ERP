import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

// Lazy load calendar pages
const CalendarView = lazy(() => import('./pages/CalendarView'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Scheduling = lazy(() => import('./pages/Scheduling'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <Spin size="large" tip="Loading..." />
  </div>
);

const CalendarModule: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<CalendarView />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/scheduling" element={<Scheduling />} />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </Suspense>
  );
};

export default CalendarModule;
