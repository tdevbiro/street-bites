import React from 'react';
import { MainApp } from './MainApp';
import { UserProfile, UserRole } from './types';

/**
 * Root App Component - Simplified to use MainApp directly
 */
export const App: React.FC = () => {
  // Create a default profile for testing
  const defaultProfile: UserProfile = {
    id: 'local-user',
    name: 'User',
    email: '',
    role: UserRole.CUSTOMER,
    subscriptionTier: 1,
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
