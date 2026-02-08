import React from 'react';

export const App: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Arial, sans-serif', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: 0 }}>StreetBites</h1>
      <p style={{ fontSize: '16px', opacity: 0.9 }}>Loading app...</p>
      <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default App;
