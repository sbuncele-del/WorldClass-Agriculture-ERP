import React, { useEffect } from 'react';

/**
 * SiyaBusa ERP Concept Document
 * Comprehensive stakeholder presentation
 * Route: /concept-document
 */
const ConceptDocument: React.FC = () => {
  useEffect(() => {
    // Update page title
    document.title = 'SiyaBusa ERP - Concept Document | Stakeholder Presentation';
  }, []);

  return (
    <div style={{ 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F8FAFC 100%)',
      minHeight: '100vh',
      WebkitFontSmoothing: 'antialiased'
    }}>
      {/* Redirect to static HTML for full document */}
      <iframe 
        src="/concept-document.html"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          display: 'block'
        }}
        title="SiyaBusa ERP Concept Document"
      />
    </div>
  );
};

export default ConceptDocument;
