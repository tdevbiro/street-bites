# StreetBites - Production Deployment Guide

## 🚀 Quick Start

### 1. Set Up Supabase Backend

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run the entire `supabase-schema.sql` file
4. Go to Settings > API and copy:
   - Project URL
   - Anon/Public key

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local`:
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_GEMINI_API_KEY=your_gemini_key_here
   ```

3. Get Gemini API Key:
   - Go to [aistudio.google.com](https://aistudio.google.com/apikey)
   - Create API key
   - Paste into `.env.local`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173`

## 📱 Deploy to Production

### Option A: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Add all VITE_* variables
   - Redeploy

### Option B: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build and deploy:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Option C: GitHub Pages

1. Update `vite.config.ts` base path:
   ```typescript
   base: '/street-bites/'
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Deploy `dist/` folder to GitHub Pages

## 🔧 Configuration

### GPS Tracking Settings

In `.env.local`:
- `VITE_GPS_UPDATE_INTERVAL=30000` - Update every 30 seconds
- `VITE_GPS_HIGH_ACCURACY=true` - Use high accuracy GPS

### Feature Flags

- `VITE_ENABLE_PUSH_NOTIFICATIONS=true`
- `VITE_ENABLE_AI_PREDICTIONS=true`
- `VITE_ENABLE_SOCIAL_FEATURES=true`

## 📲 Mobile App Setup

### Progressive Web App (PWA)

The app is PWA-ready. Users can:
1. Open app in mobile browser
2. Tap "Add to Home Screen"
3. Use like a native app

### For Business Owners - Enable GPS Tracking

1. Sign up as "Business Owner"
2. Create your business
3. Grant location permissions
4. GPS tracking runs automatically in background

## 🤖 AI Features Setup

### Enable Route Predictions

Predictions run automatically after:
- 10+ location history points
- Updates every 24 hours
- Viewable in business profile

### AI Review Responses

Enabled by default. Business owners can:
1. Go to Reviews tab
2. Click "Generate AI Response"
3. Edit and post

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Users can only edit their own data
- Business owners control their businesses only
- Authentication via Supabase Auth

## 📊 Analytics & Monitoring

### Supabase Dashboard

Monitor:
- Active users
- Business locations
- Database size
- API requests

### Enable Real-time

Real-time is enabled for:
- Business location updates
- Status changes
- New messages/reviews

## 🐛 Troubleshooting

### GPS Not Working

1. Check HTTPS (required for GPS)
2. Grant location permissions
3. Check console for errors

### Authentication Issues

1. Verify Supabase keys in `.env.local`
2. Check Supabase dashboard for auth settings
3. Enable email auth in Supabase

### AI Predictions Not Showing

1. Verify Gemini API key
2. Check API quota
3. Ensure 10+ location history points

## 🚀 Production Checklist

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Gemini API key added
- [ ] App deployed to hosting
- [ ] HTTPS enabled
- [ ] Location permissions working
- [ ] Real-time subscriptions active
- [ ] Test authentication flow
- [ ] Test GPS tracking
- [ ] Test AI predictions

## 📱 Share Your App

After deployment:
1. Copy your production URL
2. Share with business owners
3. Have them register and add businesses
4. Users can discover businesses nearby

## 🎉 You're Live!

Your app is now running with:
- ✅ Live GPS tracking
- ✅ AI route predictions
- ✅ Real-time updates
- ✅ Full authentication
- ✅ Database backend
- ✅ Ready for production use
