/**
 * Project Management Module
 * Complete project tracking with tasks, milestones, Gantt charts, and team collaboration
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PageLoader from '../../components/PageLoader';

// Lazy load sub-pages for better performance
const ProjectsDashboard = lazy(() => import('./pages/ProjectsDashboard'));
const ProjectsList = lazy(() => import('./pages/ProjectsList'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const TasksBoard = lazy(() => import('./pages/TasksBoard'));
const GanttView = lazy(() => import('./pages/GanttView'));
const Milestones = lazy(() => import('./pages/Milestones'));
const TimeTracking = lazy(() => import('./pages/TimeTracking'));
const ProjectTemplates = lazy(() => import('./pages/ProjectTemplates'));

const ProjectsModule: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<ProjectsDashboard />} />
        <Route path="/list" element={<ProjectsList />} />
        <Route path="/board" element={<TasksBoard />} />
        <Route path="/gantt" element={<GanttView />} />
        <Route path="/milestones" element={<Milestones />} />
        <Route path="/time-tracking" element={<TimeTracking />} />
        <Route path="/templates" element={<ProjectTemplates />} />
        <Route path="/:projectId/*" element={<ProjectDetails />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </Suspense>
  );
};

export default ProjectsModule;
