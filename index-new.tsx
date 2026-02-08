import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './AppWrapper';
import './index.css';

// Check for required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GEMINI_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(
  varName => !import.meta.env[varName]
);

if (missingEnvVars.length > 0 && import.meta.env.PROD) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env.local file or deployment configuration');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
