# 🚀 StreetBites - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Interactive Setup
```bash
node setup.js
```

This will ask you for:
- Supabase URL & Key
- Gemini API Key
- Map center location

### Step 3: Set Up Database

1. Go to your [Supabase Project](https://supabase.com)
2. Click "SQL Editor" in sidebar
3. Copy **ALL** content from `supabase-schema.sql`
4. Paste into SQL Editor
5. Click "Run"

✅ You should see "Success. No rows returned"

### Step 4: Start Development

```bash
npm run dev
```

Open http://localhost:5173 🎉

---

## 📝 Manual Setup (Alternative)

If you prefer manual setup:

1. **Copy environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your keys:**
   - Get Supabase keys from: https://supabase.com (Settings > API)
   - Get Gemini key from: https://aistudio.google.com/apikey

3. **Install & run:**
   ```bash
   npm install
   npm run dev
   ```

---

## 🧪 Testing

### Test as Customer:
1. Sign up with email/password
2. Choose "Customer"
3. Browse map and businesses

### Test as Business Owner:
1. Sign up with different email
2. Choose "Business Owner"
3. Create a business
4. **Allow location permissions**
5. See GPS tracking in action

---

## 🚨 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### GPS not working
- Use HTTPS (or localhost)
- Check browser permissions
- Look for console errors

### Authentication errors
- Verify Supabase keys in `.env.local`
- Check email auth is enabled in Supabase dashboard

### Database errors
- Make sure you ran `supabase-schema.sql` completely
- Check Supabase logs for errors

---

## 📱 Deploy to Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

**Quick deploy to Vercel:**
```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard → Redeploy

---

## 🎯 What to Test

- ✅ Sign up / Sign in
- ✅ Create business (as owner)
- ✅ GPS tracking (allow location)
- ✅ Add products
- ✅ Post announcements
- ✅ Check in to businesses (as customer)
- ✅ Leave reviews
- ✅ AI review responses
- ✅ Real-time updates

---

## 🆘 Need Help?

- Check console for errors (F12)
- Review Supabase logs
- Check [README.md](./README.md) for detailed docs
- Open an issue on GitHub

---

**Happy Building! 🎉**
