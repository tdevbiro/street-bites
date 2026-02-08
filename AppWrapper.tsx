import React, { useState, useEffect } from 'react';
import { supabase, auth, getCurrentProfile, isSupabaseConfigured } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { UserProfile } from './types';
import { Loader2 } from 'lucide-react';

// Import your existing App component (we'll wrap it)
import { MainApp } from './MainApp';

/**
 * Root App Component with Authentication
 */
export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 px-6">
        <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-orange-100 text-center space-y-6">
          <h1 className="text-3xl font-black text-orange-900">Setup Required</h1>
          <p className="text-slate-500 font-medium">
            Supabase keys are missing. Add your keys in a .env.local file to start the app.
          </p>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-left">
            <p className="text-xs font-black text-orange-600 uppercase tracking-widest">Required</p>
            <ul className="mt-2 text-sm text-slate-600 space-y-1">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_ANON_KEY</li>
              <li>VITE_GEMINI_API_KEY</li>
            </ul>
          </div>
          <p className="text-xs text-slate-400">
            See QUICKSTART.md for setup steps.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadProfile();
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const session = await auth.getSession();
      if (session) {
        await loadProfile();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const userProfile = await getCurrentProfile();
      if (userProfile) {
        setProfile(userProfile);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Profile load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    await loadProfile();
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-orange-500 text-white space-y-6 px-10 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-[2.5rem] flex items-center justify-center">
          <Loader2 size={48} className="animate-spin" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tighter">STREETBITES</h2>
          <p className="text-white/60 font-black text-[10px] uppercase tracking-widest mt-2">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  return <MainApp initialProfile={profile} />;
};

export default App;
