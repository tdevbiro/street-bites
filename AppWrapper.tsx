import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { MainApp } from './MainApp';
import { UserProfile, UserRole, SubscriptionTier } from './types';

export const App: React.FC = () => {
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    // Simulate app loading delay, then show MainApp
    const timer = setTimeout(() => {
      setShowApp(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!showApp) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '32px',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Animated Background Circles */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse',
        }} />

        {/* Logo Container */}
        <div style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          animation: 'slideDown 0.8s ease-out',
        }}>
          {/* Zap Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            animation: 'pulse 2s ease-in-out infinite',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}>
            <Zap size={48} color="white" strokeWidth={2.5} />
          </div>

          {/* Text */}
          <div style={{
            textAlign: 'center',
            color: 'white',
            animation: 'slideUp 0.8s ease-out 0.1s both',
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '900',
              margin: '0 0 12px 0',
              letterSpacing: '-1px',
            }}>STREETBITES</h1>
            <p style={{
              fontSize: '16px',
              opacity: 0.9,
              margin: 0,
              fontWeight: '500',
              letterSpacing: '0.5px',
            }}>Mobile Food Commerce</p>
          </div>
        </div>

        {/* Loading Spinner */}
        <div style={{
          position: 'relative',
          width: '48px',
          height: '48px',
          zIndex: 10,
          animation: 'slideUp 0.8s ease-out 0.2s both',
        }}>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>

        {/* Progress Text */}
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '14px',
          fontWeight: '500',
          margin: 0,
          letterSpacing: '0.5px',
          animation: 'slideUp 0.8s ease-out 0.3s both',
        }}>Initializing...</p>

        {/* Styles */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1);
              background: rgba(255,255,255,0.2);
            }
            50% { 
              transform: scale(1.05);
              background: rgba(255,255,255,0.3);
            }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(20px); }
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Create default profile
  const defaultProfile: UserProfile = {
    id: 'local-user',
    name: 'User',
    email: '',
    role: UserRole.CUSTOMER,
    subscriptionTier: SubscriptionTier.FREE,
    isGhostMode: false,
    following: [],
    friends: [],
    blockedUsers: [],
    notifications: [],
    preferences: {}
  };

  return <MainApp initialProfile={defaultProfile} />;
};

export default App;
