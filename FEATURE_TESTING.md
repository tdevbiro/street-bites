# StreetBites 2.0 - Feature Testing Guide

## 🚀 Hogyan teszteld az új funkciókat

### 1. **Street Passport (🏆)**
- Nyiss meg a Profile nézetet
- Kattints a "Street Passport" gombra
- Látod a meglátogatott helyeket stamps-okkal
- Minden helyhez van: visit count, rating, utolsó látogatás dátuma

### 2. **Enhanced Profile (✏️)**
- Nyiss meg a Profile nézetet
- Kattints az "Edit Profile" gombra
- Módosítsd: név, nemed (optional), körpreferenciák
- Tölts fel profilképet

### 3. **Check-in (📍)**
- Nyiss meg a Profile nézetet
- Kattints a "Check-in" gombra
- Mutat a közeli helyek listáját (100m körzetben)
- Check-in után a "Checked In" gomb jelenik meg

### 4. **Review System (⭐)**
- A business detail panelen új review gomb van
- 5 csillag rating + opcionális komment
- Automatikus rating mentés a passport stamp-hoz

### 5. **Fleet Manager (🚗)** (csak Owner role-nak)
- Nyiss meg az Owner Dashboard-t
- Kattints a "Fleet Manager" gombra
- Софőrt meghívhatsz az emailen
- Látod a pending meghívásokat
- Aktív sofőrök listája

### 6. **Driver Dashboard** (csak Driver role-nak)
- Nyiss meg a Driver view-t
- AI mód választása: Online (cloud) vagy Offline (local)
- Látod az napi útvonalat

---

## 🔌 Backend Integrációs Pontok

### Supabase Tables:
- `street_passports` - User passport stamps
- `check_ins` - Check-in location data
- `driver_invitations` - Fleet invitation workflow
- `fleet_vehicles` - Vehicle management
- `notifications` - System notifications

### API Endpoints (terv):
```
POST /check-in         - Create check-in
POST /check-out        - End check-in  
GET  /passports        - Get user stamps
POST /passport/rate    - Rate business
GET  /notifications    - Get user notifications
POST /fleet/invite     - Invite driver
GET  /fleet/drivers    - Get company drivers
```

---

## 📱 Frontend State Management

### MainApp.tsx Key States:
```typescript
const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
const [passportStamps, setPassportStamps] = useState<StreetPassportStamp[]>([]);
const [appNotifications, setAppNotifications] = useState<Notification[]>([]);
const [showCheckIn, setShowCheckIn] = useState(false);
const [showStreetPassport, setShowStreetPassport] = useState(false);
const [showProfile, setShowProfile] = useState(false);
const [showFleetManager, setShowFleetManager] = useState(false);
```

---

## 🎨 UI Components Locations

- **ReviewComponent** - [components/ReviewComponent.tsx](components/ReviewComponent.tsx)
- **StreetPassportComponent** - [components/StreetPassportComponent.tsx](components/StreetPassportComponent.tsx)
- **CheckInComponent** - [components/CheckInComponent.tsx](components/CheckInComponent.tsx)
- **EnhancedProfileComponent** - [components/EnhancedProfileComponent.tsx](components/EnhancedProfileComponent.tsx)
- **FleetManagerComponent** - [components/FleetManagerComponent.tsx](components/FleetManagerComponent.tsx)
- **DriverDashboardComponent** - [components/DriverDashboardComponent.tsx](components/DriverDashboardComponent.tsx)

---

## 🐛 Troubleshooting

### Errors:
1. **"Check-in radius too small"** - Módosítsd a `CHECK_IN_RADIUS` konstanst (MainApp.tsx:45)
2. **"Notification not showing"** - Jelöld meg a browser notification permission-t
3. **"Passport stamps empty"** - Végezz check-ins-t, hogy generáld a stamps-okat

### Debug Mode:
```typescript
// MainApp.tsx-ben add hozzá:
if (process.env.NODE_ENV === 'development') {
  console.log('Check-ins:', checkIns);
  console.log('Passports:', passportStamps);
  console.log('Notifications:', appNotifications);
}
```

---

## ✨ Next Steps

1. **Supabase Integration** - Real database connection
2. **Firebase Auth** - Google/Apple login
3. **Real-time GPS** - Background location tracking  
4. **Gemini AI** - Route prediction & recommendations
5. **Payment Integration** - Stripe/Paypals for subscriptions
6. **Push Notifications** - FCM for real-time alerts

---

## 📞 Support

- Check `console.log` for debugging
- Enable browser DevTools (F12)
- Test with mock data first
- Use localStorage inspector for state debugging
