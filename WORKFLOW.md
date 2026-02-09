# 🚀 StreetBites Development Workflow

## Quick Start

### 1. Indítsd az app-et
```powershell
npm run dev
```
Az app majd megnyílik az `http://localhost:5175` címen.

---

## 2. Módosítások mentése & GitHub-ra push

### Módszer A: PowerShell Script (Ajánlott)
```powershell
.\commit-and-push.ps1 "Leírás: Mit csináltál"
```

**Beispiele commitok:**
```powershell
.\commit-and-push.ps1 "Add: Review component styling improvements"
.\commit-and-push.ps1 "Fix: Street Passport GPS calculation error"
.\commit-and-push.ps1 "Refactor: Fleet Manager UI layout"
.\commit-and-push.ps1 "Feature: Check-in notification system"
```

### Módszer B: Manual Git (Ha szükséges)
```powershell
git add .
git commit -m "Your commit message here"
git pull origin main --rebase
git push origin main
```

---

## Commit Message Format

Jó formátum:
- `Add: [rövid leírás]` - Új funkció
- `Fix: [rövid leírás]` - Hiba megoldás
- `Refactor: [rövid leírás]` - Kód átalakítás
- `Style: [rövid leírás]` - CSS/Design módosítás
- `Update: [rövid leírás]` - Frissítés

**Jelölések:**
- ✨ = Új feature
- 🐛 = Bug fix
- 🎨 = Design/Style
- ♻️ = Refactor
- 📝 = Documentation
- 🔧 = Config
- 🚀 = Deploy

---

## GitHub Monitor

Megnézni az utolsó commitokat:
```powershell
git log --oneline -10
```

Megnézni a változásokat:
```powershell
git status
```

Megnézni egy commit részleteit:
```powershell
git show [commit-hash]
```

---

## Development Tipek

1. **Szerver újraindítás:** Ctrl+C majd `npm run dev` ismét
2. **Hard Refresh böngészőben:** Ctrl+Shift+R
3. **Console hibák:** F12 > Console tab
4. **Network hibák:** F12 > Network tab

---

## StreetBites Features Checklist

✅ = Implementált
🔧 = Fejlesztés alatt
❌ = TODO

Features:
- ✅ Loading screen
- ✅ Review írás & értékelés (5-star)
- ✅ Street Passport (logók, visit count, rating)
- ✅ Check-in GPS + notification
- ✅ Enhanced Profile (kép, nemed, kör)
- ✅ Fleet Management (driver invite)
- ✅ Driver Dashboard (online/offline AI)
- ✅ Map view
- ✅ Dark mode

---

## Fontos Mappák

```
street-bites/
├── components/          # React components
│   ├── ReviewComponent.tsx
│   ├── StreetPassportComponent.tsx
│   ├── CheckInComponent.tsx
│   ├── EnhancedProfileComponent.tsx
│   ├── FleetManagerComponent.tsx
│   ├── DriverDashboardComponent.tsx
│   └── CustomMarker.tsx
├── services/           # Business logic
│   ├── checkInService.ts
│   ├── passportService.ts
│   ├── notificationService.ts
│   ├── fleetService.ts
│   ├── geminiService.ts
│   ├── businessService.ts
│   └── aiPredictionService.ts
├── MainApp.tsx        # Main app component
├── types.ts           # TypeScript interfaces
├── constants.tsx      # Constants & mock data
├── AppWrapper.tsx     # App wrapper + loading
└── index.tsx          # Entry point
```

---

## Helpful Commands

```powershell
# Clean install
npm install

# Build for production
npm run build

# Preview production build
npm run preview

# Check for unused dependencies
npm audit

# Update dependencies
npm update
```

---

**Happy coding! 🎉**
