# 🚀 StreetBites - Live GPS Tracking for Moving Businesses

**A complete production-ready platform for discovering and tracking mobile businesses in real-time.**

Perfect for food trucks, coffee vans, ice cream trucks, mobile salons, pet grooming vans, and any business on wheels!

## ✨ Features

### For Customers 👥
- 🗺️ **Live GPS Tracking** - See real-time locations of businesses
- 🤖 **AI-Powered Predictions** - Know where businesses will be before they arrive
- 💬 **Social Features** - Chat, reviews, check-ins, friend activity
- 🎯 **Smart Search** - Find businesses by name, category, or tags
- 📍 **Nearby Discovery** - See what's close to you right now
- 🎫 **Passport System** - Collect stamps from visited businesses

### For Business Owners 🚚
- 📡 **Automatic GPS Tracking** - Background location tracking
- 📊 **Fleet Management** - Control multiple vehicles
- 📢 **Customer Engagement** - Posts, announcements, direct chat
- ⚡ **Status Control** - Update busy/moderate/empty status
- 🔮 **AI Route Predictions** - Get optimal location suggestions
- 💰 **Business Analytics** - Track visitors, reviews, engagement

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time + Storage)
- **Maps**: Leaflet + OpenStreetMap
- **AI**: Google Gemini 3 Flash for predictions & smart features
- **Geospatial**: PostGIS for location queries

## 🚀 Quick Setup (5 minutes)

### 1. Clone and Install

```bash
git clone <your-repo>
cd street-bites
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → Create project (free)
2. Copy your project URL and anon key
3. Go to SQL Editor → Paste entire content of `supabase-schema.sql` → Run

### 3. Get Gemini API Key

1. Visit [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create API key (free tier: 1500 requests/day)

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

### 5. Run Locally

```bash
npm run dev
```

Open `http://localhost:5173` 🎉

## 📁 Project Structure

```
street-bites/
├── lib/
│   ├── supabase.ts          # Supabase client & auth helpers
│   └── database.types.ts    # TypeScript database types
├── services/
│   ├── gpsTrackingService.ts   # Real-time GPS tracking
│   ├── aiPredictionService.ts  # AI route predictions
│   ├── businessService.ts      # Business data management
│   └── geminiService.ts        # Legacy AI helpers
├── components/
│   ├── AuthForm.tsx         # Login/signup
│   └── CustomMarker.tsx     # Map markers
├── App.tsx                  # Main app (your existing UI)
├── AppWrapper.tsx           # Auth wrapper
├── index.tsx                # Entry point
├── types.ts                 # TypeScript interfaces
├── constants.tsx            # Mock data & constants
└── supabase-schema.sql      # Complete database schema
```

## 🎮 Usage

### As a Customer

1. Sign up with email/password
2. Choose "Customer" role
3. Browse map to see nearby businesses
4. Click markers to see details
5. Check in, leave reviews, send messages
6. Get AI predictions for favorite businesses

### As a Business Owner

1. Sign up with email/password
2. Choose "Business Owner" role
3. Create your business(es)
4. **Allow location permissions** when prompted
5. GPS tracking starts automatically
6. Update status, post announcements
7. View AI route predictions after 10+ locations

## 🤖 AI Features Explained

### 1. Route Predictions
- Analyzes 500 most recent GPS points
- Groups by day/time patterns
- Uses Gemini AI to predict future locations
- Updates every 24 hours
- Shows confidence score (0-1)

### 2. Smart Search
- Natural language understanding
- "spicy tacos" → finds food trucks with spicy tags
- "coffee near me" → filters by category + distance

### 3. AI Review Responses
- Business owners can generate professional responses
- Context-aware based on review sentiment
- Editable before posting

## 📱 Mobile Deployment

### Progressive Web App (PWA)
The app works as a PWA:
1. Deploy to Vercel/Netlify (see below)
2. Open on mobile browser
3. Tap "Add to Home Screen"
4. Works offline (cached data)

### GPS Background Tracking
For business owners:
- Runs in background (PWA installed)
- Updates every 30 seconds (configurable)
- Battery efficient (uses native GPS)

## 🌐 Deploy to Production

### Option A: Vercel (Easiest)

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard → Redeploy

### Option B: Netlify

```bash
npm run build
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option C: Your Own Server

```bash
npm run build
# Upload dist/ folder to your server
# Configure nginx/apache to serve static files
```

## 🔒 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Users can only edit their own data
- ✅ Business owners control their businesses
- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens for authentication
- ✅ HTTPS required for GPS

## 📊 Database Schema Highlights

- **profiles** - User accounts (extends Supabase Auth)
- **businesses** - Business information
- **locations** - GPS tracking history (PostGIS)
- **routes** - Planned stops and schedules
- **predictions** - AI-generated forecasts
- **reviews**, **messages**, **posts** - Social features

Real-time subscriptions enabled for instant updates!

## 🎨 Customization

### Change Map Center
Edit `.env.local`:
```env
VITE_MAP_DEFAULT_CENTER_LAT=40.7128
VITE_MAP_DEFAULT_CENTER_LNG=-74.0060
```

### GPS Update Frequency
```env
VITE_GPS_UPDATE_INTERVAL=30000  # 30 seconds
```

### Add New Business Categories
Edit `types.ts` → `BusinessCategory` enum

## 🐛 Troubleshooting

**GPS not working?**
- Must use HTTPS (localhost is OK for testing)
- Check browser permissions
- Enable "High Accuracy" in browser settings

**Authentication errors?**
- Verify Supabase keys in `.env.local`
- Check Supabase dashboard → Auth settings
- Email auth must be enabled

**AI predictions not showing?**
- Need 10+ location history points
- Check Gemini API key and quota
- View console for errors

**"Module not found" errors?**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🚧 Roadmap

- [ ] Push notifications (web push API)
- [ ] Pre-orders and reservations
- [ ] Payment integration (Stripe)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] iOS/Android native apps (React Native)

## 📄 License

MIT License - Feel free to use for commercial projects!

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 💡 Support

- 📧 Email: support@streetbites.app
- 💬 Discord: [Join Server](https://discord.gg/streetbites)
- 📖 Docs: [Read Full Docs](https://docs.streetbites.app)

## 🙏 Credits

Built with:
- React & TypeScript
- Supabase
- Google Gemini AI
- Leaflet Maps
- Tailwind CSS
- Lucide Icons

---

**Made with ❤️ for the mobile business community**

🌮 🚚 ☕ 🍦 💈 🌸
