import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const SiyaBusaPitchDeck: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ fontSize: 48 }}>SiyaBusa ERP Pitch Deck</h1>
      <p style={{ fontSize: 24, opacity: 0.7 }}>Routing test - if you see this, it works!</p>
      <Button type="primary" onClick={() => navigate('/app/proposals')} style={{ marginTop: 20 }}>Back to Proposals</Button>
    </div>
  );
};

export default SiyaBusaPitchDeck;
