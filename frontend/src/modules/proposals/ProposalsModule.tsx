import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';

// Lazy load pages
const ProposalsDashboard = lazy(() => import('./pages/ProposalsDashboard'));
const ProposalsList = lazy(() => import('./pages/ProposalsList'));
const ProposalEditor = lazy(() => import('./pages/ProposalEditor'));
const ProposalPreview = lazy(() => import('./pages/ProposalPreview'));
const Templates = lazy(() => import('./pages/Templates'));
const PricingLibrary = lazy(() => import('./pages/PricingLibrary'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));
const PortalAccess = lazy(() => import('./pages/PortalAccess'));
const SendProposal = lazy(() => import('./pages/SendProposal'));
const PitchBuilder = lazy(() => import('./pages/PitchBuilder'));
const PitchPreview = lazy(() => import('./pages/PitchPreview'));
const PitchTemplates = lazy(() => import('./pages/PitchTemplates'));

// World-Class Proposal Builder - 5-Phase System
const WorldClassProposalBuilder = lazy(() => import('./WorldClassProposalBuilder'));

// Investment-Grade Pitch Deck Builder
const InvestmentPitchBuilder = lazy(() => import('./InvestmentPitchBuilder'));

// Coffee Value Chain Pitch Deck
const CoffeePitchDeck = lazy(() => import('./CoffeePitchDeck'));
// SiyaBusa ERP Pitch Deck
const SiyaBusaPitchDeck = lazy(() => import('./SiyaBusaPitchDeck'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <Spin size="large" />
  </div>
);

const ProposalsModule: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<ProposalsDashboard />} />
        <Route path="/list" element={<ProposalsList />} />
        <Route path="/new" element={<ProposalEditor />} />
        <Route path="/builder" element={<WorldClassProposalBuilder />} />
        <Route path="/builder/:id" element={<WorldClassProposalBuilder />} />
        <Route path="/edit/:id" element={<ProposalEditor />} />
        <Route path="/preview/:id" element={<ProposalPreview />} />
        <Route path="/send/:id" element={<SendProposal />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/pricing" element={<PricingLibrary />} />
        <Route path="/portal/:id" element={<ClientPortal />} />
        <Route path="/pitch/builder" element={<PitchBuilder />} />
        <Route path="/pitch/deck" element={<InvestmentPitchBuilder />} />
        <Route path="/pitch/deck/:id" element={<InvestmentPitchBuilder />} />
        <Route path="/pitch/coffee" element={<CoffeePitchDeck />} />
        <Route path="/pitch/siyabusa" element={<SiyaBusaPitchDeck />} />
        <Route path="/pitch/preview" element={<PitchPreview />} />
        <Route path="/pitch/preview/:id" element={<PitchPreview />} />
        <Route path="/pitch/templates" element={<PitchTemplates />} />
      </Routes>
    </Suspense>
  );
};

export default ProposalsModule;
