import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import ReactDOM from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Star, Heart, Plus, TrendingUp, Clock, Users, ArrowRight, Utensils, LogOut,
  LayoutDashboard, Search, Navigation2, X, Sparkles, Share2,
  Layers, MapPin, Check, ChevronDown, ChevronLeft, ChevronRight, MessageSquare,
   Send, User, Award, History, Bell, AlertTriangle, Radio, ShoppingBag,
  Trash2, Settings, ShieldAlert, Zap, Ghost, Eye, Menu, Store, Briefcase, Camera,
   Info, Map as MapIcon2, UserPlus, Fingerprint, Sparkle, Flame, Flag, AlertCircle,
  Leaf, Beef, WheatOff, Timer, Calendar, Newspaper, Rss, CreditCard,
   Crown, Gem, Truck, Copy, UserMinus, EyeOff, Contact2, Bot, ChevronLast, ChevronFirst,
    ChefHat, CalendarDays, Filter, ArrowUpDown, Wallet, Map as MapUi,
   Cloud, QrCode, Smartphone, RefreshCw, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import { Business, BusinessStatus, BusinessCategory, SortOption, UserProfile, UserRole, Message, Review, BusinessPost, Product, FeedPost, SubscriptionTier, FriendRequest, DirectMessage, Company, DriverProfile, ScheduledLocation } from './types';
import { MOCK_BUSINESSES, STATUS_COLORS, CATEGORY_ICONS } from './constants';
import { CustomMarker } from './components/CustomMarker';
import { generateAIReviewResponse, getSmartCategorySuggestion, getAISmartFilter } from './services/geminiService';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Added ViewType definition to fix the missing type error
type ViewType = 'explorer' | 'me' | 'owner' | 'feed' | 'social';

// GPS Distance calculation (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

const CHECK_IN_RADIUS = 100; // 100 meters

// --- BACKEND API SIMULATION LAYER ---
const StreetBitesAPI = {
  async fetchBusinesses(): Promise<Business[]> {
    await new Promise(r => setTimeout(r, 600)); 
    const saved = localStorage.getItem('streetbites_businesses');
    return saved ? JSON.parse(saved) : MOCK_BUSINESSES;
  },
  async saveBusinesses(businesses: Business[]) {
    await new Promise(r => setTimeout(r, 400));
    localStorage.setItem('streetbites_businesses', JSON.stringify(businesses));
  },
  async fetchProfile(): Promise<UserProfile | null> {
    await new Promise(r => setTimeout(r, 500));
    const saved = localStorage.getItem('streetbites_user');
    return saved ? JSON.parse(saved) : null;
  },
  async saveProfile(profile: UserProfile) {
    await new Promise(r => setTimeout(r, 300));
    localStorage.setItem('streetbites_user', JSON.stringify(profile));
   },
   async fetchCompanies(): Promise<Company[]> {
      await new Promise(r => setTimeout(r, 300));
      const saved = localStorage.getItem('streetbites_companies');
      return saved ? JSON.parse(saved) : [];
   },
   async saveCompanies(companies: Company[]) {
      await new Promise(r => setTimeout(r, 300));
      localStorage.setItem('streetbites_companies', JSON.stringify(companies));
   }
};

const UserLocationMarker: React.FC<{ profile: UserProfile, location: [number, number] | null }> = ({ profile, location }) => {
  if (!location || profile.isGhostMode) return null;
  const userIcon = L.divIcon({
    className: 'custom-user-icon',
    html: `
      <div class="flex items-center justify-center w-12 h-12 rounded-full ${profile.subscriptionTier === SubscriptionTier.PLUS ? 'bg-indigo-600 border-amber-400' : 'bg-orange-600 border-white'} border-4 shadow-2xl relative">
        <div class="absolute inset-0 rounded-full bg-orange-600 animate-ping opacity-25"></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
  return <Marker position={location} icon={userIcon} />;
};

interface MainAppProps {
   initialProfile: UserProfile;
}

export const MainApp: React.FC<MainAppProps> = ({ initialProfile }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
   const [companies, setCompanies] = useState<Company[]>([]);
   const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [notifications, setNotifications] = useState<Array<{ id: string; businessId: string; businessName: string; message: string; locationId: string }>>([]);
  
  const [activeView, setActiveView] = useState<ViewType>('explorer');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOnlyFollowed, setShowOnlyFollowed] = useState(false);

  useEffect(() => {
      const init = async () => {
         try {
            const biz = await StreetBitesAPI.fetchBusinesses();
            const comps = await StreetBitesAPI.fetchCompanies();
            setBusinesses(biz);
            setCompanies(comps);
            setProfile(initialProfile || null);
         } catch (error) {
            console.error("Initialization error:", error);
            setBusinesses([]);
            setCompanies([]);
         } finally {
            setTimeout(() => setIsInitialLoading(false), 500);
         }
      };
      init();

      // Safety timeout - ensure loading doesn't get stuck
      const timeout = setTimeout(() => {
         setIsInitialLoading(false);
      }, 5000);

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      }, (err) => console.warn("Location error:", err), { enableHighAccuracy: true });
    }

    return () => clearTimeout(timeout);
  }, [initialProfile]);

  useEffect(() => {
    if (!isInitialLoading) {
      const sync = async () => {
        setIsSyncing(true);
            if (profile) await StreetBitesAPI.saveProfile(profile);
            await StreetBitesAPI.saveBusinesses(businesses);
            await StreetBitesAPI.saveCompanies(companies);
        setTimeout(() => setIsSyncing(false), 800);
      };
      sync();
    }
   }, [profile, businesses, companies, isInitialLoading]);

  // Check for nearby scheduled locations from followed businesses
  useEffect(() => {
    if (!profile || !userLocation || !profile.notificationsEnabled) return;
    
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
    
    const newNotifications: typeof notifications = [];
    
    businesses.forEach(biz => {
      if (!profile.following.includes(biz.id)) return;
      
      (biz.scheduledLocations || []).forEach(loc => {
        // Check if it's today and currently open
        if (loc.dayOfWeek !== currentDay) return;
        
        // Parse times
        const [startHour, startMin] = loc.startTime.split(':').map(Number);
        const [endHour, endMin] = loc.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (currentTime < startMinutes || currentTime > endMinutes) return;
        
        // Check if nearby (within 500 meters)
        if (loc.coordinates) {
          const distance = calculateDistance(
            userLocation[0], userLocation[1],
            loc.coordinates[0], loc.coordinates[1]
          );
          
          if (distance <= 500) {
            newNotifications.push({
              id: `${biz.id}-${loc.id}`,
              businessId: biz.id,
              businessName: biz.name,
              locationId: loc.id,
              message: `${biz.name} is open nearby at ${loc.locationName}! (${Math.round(distance)}m away)`
            });
          }
        }
      });
    });
    
    setNotifications(newNotifications);
  }, [userLocation, businesses, profile]);

  const filteredBusinesses = useMemo(() => {
    let list = [...businesses];
    
    // Filter by followed businesses if toggle is on
    if (showOnlyFollowed && profile) {
      list = list.filter(b => profile.following.includes(b.id));
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || (b.tags && b.tags.some(t => t.toLowerCase().includes(q))));
    }
    list.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      return b.currentVisitors - a.currentVisitors;
    });
    return list;
  }, [businesses, searchQuery, sortBy, showOnlyFollowed, profile]);

  const handleOnboarding = (n: string, r: UserRole) => {
    const user: UserProfile = { 
      id: 'sb_' + Math.random().toString(36).substring(2, 9), email: '', name: n, role: r, gender: 'male', 
      subscriptionTier: SubscriptionTier.FREE, tastePreferences: [], stats: { visitedCount: 0, reviewCount: 0, messageCount: 0, uniqueCategories: [], passportStamps: [] }, 
      notificationsEnabled: true, following: [], friends: ['friend_sample_1'], friendRequests: [], isGhostMode: false, directMessages: {}
    };
    setProfile(user);
    setActiveView(r === UserRole.OWNER ? 'owner' : 'explorer');
  };

  if (isInitialLoading) return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white space-y-12 px-10 text-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-white rounded-full blur-3xl"></div>
      </div>
      
      {/* Animated Road with Moving Truck */}
      <div className="relative w-full max-w-md z-10">
        {/* Road */}
        <div className="relative h-24 bg-slate-800/30 rounded-3xl overflow-hidden">
          {/* Road stripes animation */}
          <div className="absolute inset-0 flex items-center justify-around animate-[scroll_1.5s_linear_infinite]">
            <div className="w-16 h-1 bg-white/40 rounded-full"></div>
            <div className="w-16 h-1 bg-white/40 rounded-full"></div>
            <div className="w-16 h-1 bg-white/40 rounded-full"></div>
            <div className="w-16 h-1 bg-white/40 rounded-full"></div>
          </div>
          
          {/* Moving Truck */}
          <div className="absolute top-1/2 -translate-y-1/2 animate-[driveAcross_2.5s_ease-in-out_infinite]">
            <div className="bg-white rounded-2xl p-3 shadow-2xl transform hover:scale-110 transition-transform">
              <Truck size={32} className="text-orange-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Text */}
      <div className="relative z-10">
        <h2 className="text-4xl font-black tracking-tighter drop-shadow-lg">STREETBITES</h2>
        <p className="text-white/80 font-black text-xs uppercase tracking-widest mt-3 animate-pulse">Loading your mobile businesses...</p>
      </div>
      
      <style>{`
        @keyframes driveAcross {
          0% { left: -60px; }
          100% { left: calc(100% + 20px); }
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );

  if (!profile) return <OnboardingFlow onComplete={handleOnboarding} />;

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-slate-900' : 'bg-orange-50/20'} overflow-hidden relative transition-colors duration-300`}>
      {/* GLOBAL STATUS BAR */}
      <div className={`h-1 transition-all duration-500 ${isSyncing ? 'bg-emerald-400 opacity-100' : 'bg-transparent opacity-0'} absolute top-0 left-0 right-0 z-[9999]`} />

      {/* NOTIFICATIONS BANNER */}
      {notifications.length > 0 && (
         <div className="absolute top-20 left-0 right-0 z-[8000] p-4 pointer-events-none">
            <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
               {notifications.map(notif => (
                  <div 
                     key={notif.id} 
                     onClick={() => {
                        const biz = businesses.find(b => b.id === notif.businessId);
                        if (biz) {
                           setSelectedBusiness(biz);
                           setIsDetailOpen(true);
                        }
                     }}
                     className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 cursor-pointer hover:scale-105 transition-all animate-in slide-in-from-top"
                  >
                     <Bell size={20} className="shrink-0 mt-0.5 animate-bounce" />
                     <div className="flex-1 min-w-0">
                        <p className="font-black text-sm">{notif.businessName}</p>
                        <p className="text-xs text-white/90 mt-1">{notif.message}</p>
                     </div>
                     <button 
                        onClick={(e) => {
                           e.stopPropagation();
                           setNotifications(prev => prev.filter(n => n.id !== notif.id));
                        }}
                        className="shrink-0 text-white/70 hover:text-white"
                     >
                        <X size={16} />
                     </button>
                  </div>
               ))}
            </div>
         </div>
      )}

         <header className={`px-6 py-4 flex items-center justify-between z-[2000] border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/95' : 'border-orange-100 bg-white/95'} backdrop-blur-md h-16 shrink-0 shadow-sm transition-colors duration-300`}>
            <div className="flex items-center gap-2">
               <button
                  onClick={() => { setActiveView('explorer'); setSelectedBusiness(null); setIsSidebarOpen(true); }}
                  className="flex items-center gap-2 group"
                  aria-label="Go to home"
               >
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"><Zap size={18} /></div>
                  <h1 className="text-lg font-black tracking-tighter text-orange-900 hidden sm:block">StreetBites</h1>
               </button>
               <div className="flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
                   <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                   <span className="text-[8px] font-black uppercase text-slate-500">{isSyncing ? 'Saving...' : 'Synced'}</span>
               </div>
            </div>
        
        {activeView === 'explorer' && (
           <div className="flex-1 max-w-md mx-4 md:mx-8 flex items-center bg-orange-50 rounded-2xl px-4 py-2 border border-orange-100 transition-all focus-within:ring-2 ring-orange-200">
              <Search size={16} className="text-orange-300 mr-2" />
              <input type="text" placeholder="Find trucks or services..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent text-xs font-bold w-full outline-none" />
           </div>
        )}

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'} hover:scale-110`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sparkles size={18} /> : <Sparkles size={18} />}
          </button>
          <button onClick={() => setActiveView('me')} className="w-10 h-10 rounded-full border-2 border-orange-200 p-0.5 hover:border-orange-500 transition-all bg-white flex items-center justify-center">
             <div className="w-full h-full bg-orange-50 rounded-full flex items-center justify-center text-orange-500 font-black text-xs">{profile.name.charAt(0)}</div>
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-row h-full">
        {/* SIDEBAR */}
        <aside className={`${window.innerWidth < 768 ? (isSidebarOpen && activeView === 'explorer' ? 'mobile-sheet-overlay' : 'hidden') : (isSidebarOpen ? 'w-[380px]' : 'w-0 overflow-hidden')} h-full ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100'} border-r z-30 transition-all duration-300 flex flex-col`}>
          <div className="px-6 pt-6 pb-2 space-y-4 shrink-0">
             <div className="flex items-center justify-between">
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Active Near You</h2>
                <button onClick={() => setIsSidebarOpen(false)} className={`${isDarkMode ? 'text-slate-500 hover:text-orange-400' : 'text-slate-300 hover:text-orange-500'}`}><ChevronFirst size={24}/></button>
             </div>
             <div className="flex gap-2 items-center">
                <button 
                  onClick={() => setShowOnlyFollowed(!showOnlyFollowed)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${showOnlyFollowed ? 'bg-orange-500 text-white shadow-md' : (isDarkMode ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-slate-50 text-slate-400 border border-slate-100')}`}
                >
                  <Heart size={12} className={showOnlyFollowed ? 'fill-current' : ''} /> {showOnlyFollowed ? 'Following' : 'All'}
                </button>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
                  {[
                    { id: 'recommended', label: 'Hot', icon: <Flame size={12}/> },
                    { id: 'rating', label: 'Top', icon: <Star size={12}/> },
                    { id: 'alphabetical', label: 'A-Z', icon: <ArrowUpDown size={12}/> }
                  ].map(opt => (
                    <button key={opt.id} onClick={() => setSortBy(opt.id as any)} className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${sortBy === opt.id ? 'bg-orange-500 text-white shadow-md' : (isDarkMode ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-slate-50 text-slate-400 border border-slate-100')}`}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-3 custom-scroll pt-2">
            {filteredBusinesses.map(biz => (
              <div key={biz.id} onClick={() => { setSelectedBusiness(biz); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className={`flex items-center gap-4 p-5 rounded-[2.5rem] border transition-all cursor-pointer group ${selectedBusiness?.id === biz.id ? 'bg-orange-500 text-white shadow-xl scale-[1.02]' : (isDarkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-white border-orange-50 hover:bg-orange-50')}`}>
                <img src={biz.imageUrl} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start"><h3 className="font-black text-sm truncate">{biz.name}</h3><span className={`text-[8px] font-black ${selectedBusiness?.id === biz.id ? 'text-white' : 'text-orange-400'}`}>{biz.rating} ★</span></div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mt-0.5">{biz.category}</p>
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
        </aside>

        {/* MAP AREA */}
        <section className={`flex-1 relative ${activeView !== 'explorer' ? 'hidden md:block opacity-30 pointer-events-none' : 'block'}`}>
          <MapContainer center={[40.7128, -74.0060]} zoom={13} zoomControl={false} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {businesses.map(biz => (
              <MarkerWithPortal key={biz.id} biz={biz} profile={profile} isSelected={selectedBusiness?.id === biz.id} onClick={() => { setSelectedBusiness(biz); setIsSidebarOpen(true); }} onOpenSheet={() => setIsDetailOpen(true)} />
            ))}
            <UserLocationMarker profile={profile} location={userLocation} />
            <MapController target={selectedBusiness} isSidebarOpen={isSidebarOpen} isMobile={window.innerWidth < 768} />
          </MapContainer>
          {!isSidebarOpen && activeView === 'explorer' && (
             <button onClick={() => setIsSidebarOpen(true)} className="absolute top-6 left-6 z-50 bg-white p-4 rounded-3xl shadow-2xl border border-orange-100 font-black text-[10px] uppercase flex items-center gap-2 hover:scale-105 transition-all">
               <Menu size={18}/> Discover List
             </button>
          )}
        </section>

        {/* OVERLAY VIEWS */}
        {(activeView !== 'explorer') && (
           <div className="absolute inset-0 bg-white z-[100] overflow-y-auto p-6 md:p-12 custom-scroll animate-in fade-in slide-in-from-bottom duration-300">
              <div className="max-w-4xl mx-auto pb-32">
                 <button onClick={() => setActiveView('explorer')} className="mb-8 flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] hover:text-orange-500 transition-colors">
                    <ChevronLeft size={18}/> Back to Map
                 </button>
                 {activeView === 'me' ? (
                    <ProfileView profile={profile} businesses={businesses} onLogout={() => setProfile(null)} onUpgrade={(t: any) => setProfile({...profile, subscriptionTier: t})} />
                 ) : activeView === 'owner' ? (
                              <OwnerDashboard
                                 profile={profile}
                                 businesses={businesses}
                                 companies={companies}
                                 userLocation={userLocation}
                                 onUpdateStatus={(id: string, s: any) => setBusinesses(prev => prev.map(b => b.id === id ? {...b, status: s} : b))}
                                 onBecomeOwner={() => setProfile({...profile, role: UserRole.OWNER})}
                                 onAddBusiness={(data: { name: string; category: BusinessCategory | string; description?: string; imageUrl?: string; companyId?: string }) => {
                        const weeklyHours = {
                          mon: '8:00 AM - 8:00 PM',
                          tue: '8:00 AM - 8:00 PM',
                          wed: '8:00 AM - 8:00 PM',
                          thu: '8:00 AM - 8:00 PM',
                          fri: '8:00 AM - 9:00 PM',
                          sat: '9:00 AM - 9:00 PM',
                          sun: '9:00 AM - 7:00 PM',
                        };

                                    const company = data.companyId ? companies.find(c => c.id === data.companyId) : undefined;
                                    const newBiz: Business = {
                          id: `sb_${Date.now()}`,
                          ownerId: profile.id,
                                       companyId: company?.id,
                                       companyName: company?.name,
                          name: data.name,
                          category: data.category,
                          status: BusinessStatus.MODERATE,
                          rating: 0,
                          reviews: [],
                          messages: [],
                          posts: [],
                          location: userLocation || [40.7128, -74.0060],
                          description: data.description || 'Mobile service on the move.',
                          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80',
                          openingHours: '8:00 AM - 8:00 PM',
                          weeklyHours,
                          isFavorite: false,
                          favoriteCount: 0,
                          currentVisitors: 0,
                          tags: [],
                          products: [],
                          checkedInUsers: [],
                        };

                                    setBusinesses(prev => [newBiz, ...prev]);
                                    if (company) {
                                       setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, vehicleIds: Array.from(new Set([...(c.vehicleIds || []), newBiz.id])) } : c));
                                    }
                      }}
                                 onAddCompany={(name: string) => {
                                    const company: Company = { id: `co_${Date.now()}`, ownerId: profile.id, name, drivers: [], vehicleIds: [], scheduledLocations: [] };
                                    setCompanies(prev => [company, ...prev]);
                                 }}
                                 onAddDriver={(companyId: string, driver: DriverProfile) => {
                                    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, drivers: [...c.drivers, driver] } : c));
                                 }}
                                 onAssignDriver={(businessId: string, driver: DriverProfile | null) => {
                                    setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, driverId: driver?.id, driverName: driver?.name } : b));
                                 }}
                                 onUpdateCompany={(companyId: string, updates: Partial<Company>) => {
                                    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, ...updates } : c));
                                 }}
                                 onUpdateDriver={(companyId: string, driverId: string, updates: Partial<DriverProfile>) => {
                                    setCompanies(prev => prev.map(c => c.id === companyId ? {
                                       ...c,
                                       drivers: c.drivers.map(d => d.id === driverId ? { ...d, ...updates } : d)
                                    } : c));
                                 }}
                                 onToggleAttendance={(locationId: string, userId: string) => {
                                    setCompanies(prev => prev.map(c => ({
                                       ...c,
                                       scheduledLocations: (c.scheduledLocations || []).map(loc => 
                                          loc.id === locationId 
                                             ? { ...loc, attendees: loc.attendees.includes(userId) ? loc.attendees.filter(id => id !== userId) : [...loc.attendees, userId] }
                                             : loc
                                       )
                                    })));
                                    setBusinesses(prev => prev.map(b => ({
                                       ...b,
                                       scheduledLocations: (b.scheduledLocations || []).map(loc => 
                                          loc.id === locationId 
                                             ? { ...loc, attendees: loc.attendees.includes(userId) ? loc.attendees.filter(id => id !== userId) : [...loc.attendees, userId] }
                                             : loc
                                       )
                                    })));
                                 }}
                                 onAddScheduledLocation={(companyId: string, location: ScheduledLocation) => {
                                    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, scheduledLocations: [...(c.scheduledLocations || []), location] } : c));
                                    // Also add to all businesses in this company
                                    setBusinesses(prev => prev.map(b => b.companyId === companyId ? { ...b, scheduledLocations: [...(b.scheduledLocations || []), location] } : b));
                                 }}
                                 onToggleAttendance={(locationId: string, userId: string) => {
                                    setCompanies(prev => prev.map(c => ({
                                       ...c,
                                       scheduledLocations: (c.scheduledLocations || []).map(loc => 
                                          loc.id === locationId 
                                             ? { ...loc, attendees: loc.attendees.includes(userId) ? loc.attendees.filter(id => id !== userId) : [...loc.attendees, userId] }
                                             : loc
                                       )
                                    })));
                                    setBusinesses(prev => prev.map(b => ({
                                       ...b,
                                       scheduledLocations: (b.scheduledLocations || []).map(loc => 
                                          loc.id === locationId 
                                             ? { ...loc, attendees: loc.attendees.includes(userId) ? loc.attendees.filter(id => id !== userId) : [...loc.attendees, userId] }
                                             : loc
                                       )
                                    })));
                                 }}
                    />
                 ) : activeView === 'feed' ? (
                    <FeedView businesses={businesses} />
                 ) : (
                    <SocialView 
                       profile={profile} 
                       businesses={businesses}
                       onToggleAttendance={(locationId: string, userId: string) => {
                          setCompanies(prev => prev.map(c => ({
                             ...c,
                             scheduledLocations: (c.scheduledLocations || []).map(loc => 
                                loc.id === locationId 
                                   ? { ...loc, attendees: loc.attendees.includes(userId) ? loc.attendees.filter(id => id !== userId) : [...loc.attendees, userId] }
                                   : loc
                             )
                          })));
                          setBusinesses(prev => prev.map(b => ({
                             ...b,
                             scheduledLocations: (b.scheduledLocations || []).map(loc => 
                                loc.id === locationId 
                                   ? { ...loc, attendees: loc.attendees.includes(userId) ? loc.attendees.filter(id => id !== userId) : [...loc.attendees, userId] }
                                   : loc
                             )
                          })));
                       }}
                    />
                 )}
              </div>
           </div>
        )}
      </main>

      {/* DETAIL MODAL */}
      {selectedBusiness && isDetailOpen && (
        <DetailsSheet 
           business={selectedBusiness} 
           profile={profile} 
           userLocation={userLocation}
           onCheckIn={(bid: string) => {
              setBusinesses(prev => prev.map(b => b.id === bid ? { ...b, checkedInUsers: [...(b.checkedInUsers || []), profile.id] } : b));
              setProfile(prev => prev ? {...prev, stats: {...prev.stats, visitedCount: prev.stats.visitedCount + 1, passportStamps: Array.from(new Set([...(prev.stats.passportStamps || []), bid]))}} : null);
           }} 
           onToggleAttendance={(locationId: string, userId: string) => {
              setCompanies(prev => prev.map(c => ({
                 ...c,
                 scheduledLocations: (c.scheduledLocations || []).map(loc => 
                    loc.id === locationId 
                       ? { ...loc, attendees: loc.attendees.includes(userId) ? loc.attendees.filter(id => id !== userId) : [...loc.attendees, userId] }
                       : loc
                 )
              })));
              setBusinesses(prev => prev.map(b => ({
                 ...b,
                 scheduledLocations: (b.scheduledLocations || []).map(loc => 
                    loc.id === locationId 
                       ? { ...loc, attendees: loc.attendees.includes(userId) ? loc.attendees.filter(id => id !== userId) : [...loc.attendees, userId] }
                       : loc
                 )
              })));
           }}
           onToggleFollow={(bid: string) => {
              setProfile(prev => {
                 if (!prev) return prev;
                 const isFollowing = prev.following.includes(bid);
                 return {
                    ...prev,
                    following: isFollowing 
                       ? prev.following.filter(id => id !== bid)
                       : [...prev.following, bid]
                 };
              });
           }}
           onClose={() => setIsDetailOpen(false)} 
        />
      )}

      {/* FOOTER NAV */}
      <nav className="h-20 md:h-16 bg-white border-t border-orange-100 px-6 flex items-center justify-between shrink-0 z-[3000] shadow-lg">
         <button onClick={() => setActiveView('explorer')} className={`flex-1 flex flex-col items-center gap-1.5 ${activeView === 'explorer' ? 'text-orange-600' : 'text-slate-300'}`}><MapUi size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Map</span></button>
         <button onClick={() => setActiveView('feed')} className={`flex-1 flex flex-col items-center gap-1.5 ${activeView === 'feed' ? 'text-orange-600' : 'text-slate-300'}`}><Newspaper size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Feed</span></button>
         <div className="flex-1 flex justify-center -mt-8"><button onClick={() => setActiveView('social')} className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl border-[5px] border-white active:scale-90 ${activeView === 'social' ? 'bg-indigo-600 text-white' : 'bg-orange-950 text-white'}`}><MessageSquare size={24} /></button></div>
         <button onClick={() => setActiveView('me')} className={`flex-1 flex flex-col items-center gap-1.5 ${activeView === 'me' ? 'text-orange-600' : 'text-slate-300'}`}><User size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Profile</span></button>
         <button onClick={() => setActiveView('owner')} className={`flex-1 flex flex-col items-center gap-1.5 ${activeView === 'owner' ? 'text-orange-600' : 'text-slate-300'}`}><LayoutDashboard size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Fleet</span></button>
      </nav>
    </div>
  );
};

// --- SUB COMPONENTS ---

const ProfileView: React.FC<any> = ({ profile, businesses, onLogout, onUpgrade }) => {
   const isPlus = profile.subscriptionTier !== SubscriptionTier.FREE;
   const [showSettings, setShowSettings] = useState(false);
   const [gpsEnabled, setGpsEnabled] = useState(true);
   const [gpsInterval, setGpsInterval] = useState(30);

   return (
      <div className="space-y-12 animate-in fade-in max-w-2xl mx-auto">
         <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-32 h-32 bg-orange-100 rounded-[3rem] flex items-center justify-center text-orange-500 shadow-xl relative border-4 border-white">
               <User size={60}/>
               {isPlus && <div className="absolute inset-0 border-[6px] border-amber-400 rounded-[3rem] animate-pulse"/>}
            </div>
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{profile.name}</h1>
               <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-orange-400 font-black uppercase text-[10px] tracking-widest bg-orange-50 px-3 py-1 rounded-full">{profile.subscriptionTier}</span>
                  {profile.isGhostMode && <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest bg-slate-100 px-3 py-1 rounded-full">Ghost</span>}
               </div>
            </div>
         </div>

         <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><MapPin size={18} className="text-orange-400"/> Street Passport</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
               {businesses.map((b: any) => {
                  const isUnlocked = profile.stats.passportStamps?.includes(b.id);
                  return (
                     <div key={b.id} className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${isUnlocked ? 'bg-white shadow-md border-2 border-orange-200 scale-105 rotate-3' : 'bg-slate-200 opacity-20'}`}>
                        {isUnlocked ? <img src={b.imageUrl} className="w-full h-full object-cover rounded-2xl" /> : <Truck size={16} className="text-slate-400" />}
                     </div>
                  );
               })}
            </div>
         </div>

             <div className="pt-8 flex gap-4">
                  <button onClick={() => setShowSettings(true)} className="flex-1 py-6 bg-slate-50 text-slate-600 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"><Settings size={18}/> Settings</button>
            <button onClick={onLogout} className="flex-1 py-6 bg-red-50 text-red-500 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"><LogOut size={18}/> Sign Out</button>
         </div>

             {showSettings && (
                <div className="fixed inset-0 z-[6000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                   <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-8 space-y-6">
                      <div className="flex items-center justify-between">
                         <h2 className="text-2xl font-black text-slate-900">Settings</h2>
                         <button onClick={() => setShowSettings(false)} className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200">✕</button>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div>
                               <p className="font-black text-slate-800 text-sm">GPS Tracking</p>
                               <p className="text-xs text-slate-400">Enable live location tracking</p>
                            </div>
                            <button
                               onClick={() => setGpsEnabled(!gpsEnabled)}
                               className={`w-14 h-8 rounded-full transition-all ${gpsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                               <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${gpsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                         </div>

                         <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                            <p className="font-black text-slate-800 text-sm">GPS Update Interval</p>
                            <p className="text-xs text-slate-400">How often to update location</p>
                            <div className="flex gap-2">
                               {[15, 30, 60].map((sec) => (
                                  <button
                                     key={sec}
                                     onClick={() => setGpsInterval(sec)}
                                     className={`px-4 py-2 rounded-2xl text-xs font-black uppercase border ${gpsInterval === sec ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-100'}`}
                                  >
                                     {sec}s
                                  </button>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                         <button onClick={() => setShowSettings(false)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase text-slate-500">Close</button>
                      </div>
                   </div>
                </div>
             )}
      </div>
   );
};

const OwnerDashboard: React.FC<any> = ({ profile, businesses, companies, onUpdateStatus, onBecomeOwner, onAddBusiness, onAddCompany, onAddDriver, onAssignDriver, onUpdateCompany, onAddScheduledLocation, onToggleAttendance, userLocation, onUpdateDriver }) => {
   const myFleet = businesses.filter((b: any) => b.ownerId === profile.id);
   const myCompanies = companies.filter((c: Company) => c.ownerId === profile.id);
   const [showCreate, setShowCreate] = useState(false);
   const [newName, setNewName] = useState('');
   const [newCategory, setNewCategory] = useState<BusinessCategory | string>(BusinessCategory.FOOD_TRUCK);
   const [newDescription, setNewDescription] = useState('');
   const [newImageUrl, setNewImageUrl] = useState('');
   const [newCompanyId, setNewCompanyId] = useState<string>('');
   const [companyName, setCompanyName] = useState('');
   const [driverName, setDriverName] = useState('');
   const [driverFullName, setDriverFullName] = useState('');
   const [driverEmail, setDriverEmail] = useState('');
   const [driverPhone, setDriverPhone] = useState('');
   const [showAddDriver, setShowAddDriver] = useState(false);
   const [activeCompanyId, setActiveCompanyId] = useState<string>('');
   const [editingCompanyId, setEditingCompanyId] = useState<string>('');
   const [showScheduleModal, setShowScheduleModal] = useState(false);
   const [scheduleCompanyId, setScheduleCompanyId] = useState<string>('');
   const [showDriverMap, setShowDriverMap] = useState(false);
   const [selectedMapCompanyId, setSelectedMapCompanyId] = useState<string>('');
   
   // Company customization state
   const [companyDesc, setCompanyDesc] = useState('');
   const [companyColor, setCompanyColor] = useState('#f97316');
   const [companyLogo, setCompanyLogo] = useState('');
   const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
   const [companySocial, setCompanySocial] = useState({ facebook: '', instagram: '', twitter: '', website: '' });
   
   // Schedule creation state
   const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>('monday');
   const [scheduleLocationName, setScheduleLocationName] = useState('');
   const [scheduleAddress, setScheduleAddress] = useState('');
   const [scheduleStartTime, setScheduleStartTime] = useState('09:00');
   const [scheduleEndTime, setScheduleEndTime] = useState('17:00');
   const [scheduleDescription, setScheduleDescription] = useState('');

   const categoryOptions = Object.values(BusinessCategory);
   if (profile.role !== UserRole.OWNER) return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-8">
         <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300"><Truck size={48}/></div>
         <h2 className="text-3xl font-black text-slate-900 tracking-tight">Expand Your Fleet</h2>
         <p className="text-slate-500 font-medium">Join 500+ vendors tracking real-time demand. List your business, manage multiple trucks, and track sales performance.</p>
         <button onClick={onBecomeOwner} className="bg-slate-900 text-white px-10 py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all">Become a Partner (15€/mo)</button>
      </div>
   );

   return (
      <div className="space-y-10 animate-in fade-in max-w-2xl mx-auto">
         <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Command</h1>
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-2 border border-emerald-100"><Briefcase size={16}/> Business Pro</div>
         </div>
             <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                           <h2 className="text-lg font-black text-slate-900">Company</h2>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                           <input
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="Company name"
                              className="flex-1 px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none"
                           />
                           <button
                              disabled={!companyName.trim()}
                              onClick={() => { 
                                 onAddCompany(companyName.trim()); 
                                 setCompanyName(''); 
                              }}
                              className="px-6 py-4 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase shadow-lg disabled:opacity-50"
                           >
                              Create Company
                           </button>
                      </div>

                      {myCompanies.length > 0 && (
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Companies</label>
                            {myCompanies.map((company: Company) => (
                               <div key={company.id} className="p-5 rounded-2xl border-2 border-slate-100 space-y-4">
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        {company.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: company.color }} />}
                                        <h3 className="font-black text-slate-900">{company.name}</h3>
                                     </div>
                                     <button 
                                        onClick={() => {
                                           setEditingCompanyId(editingCompanyId === company.id ? '' : company.id);
                                           if (editingCompanyId !== company.id) {
                                              setCompanyDesc(company.description || '');
                                              setCompanyColor(company.color || '#f97316');
                                              setCompanyLogo(company.logoUrl || '');
                                              setCompanySocial(company.socialMediaLinks || { facebook: '', instagram: '', twitter: '', website: '' });
                                           }
                                        }}
                                        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200"
                                     >
                                        {editingCompanyId === company.id ? 'Close' : 'Edit'}
                                     </button>
                                  </div>
                                  
                                  {company.description && <p className="text-xs text-slate-600">{company.description}</p>}
                                  
                                  {editingCompanyId === company.id && (
                                     <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-2">
                                           <label className="text-[9px] font-black uppercase text-slate-400">Description</label>
                                           <textarea
                                              value={companyDesc}
                                              onChange={(e) => setCompanyDesc(e.target.value)}
                                              placeholder="About your company..."
                                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-medium text-sm focus:border-orange-400 outline-none resize-none"
                                              rows={2}
                                           />
                                        </div>
                                        
                                        <div className="space-y-2">
                                           <label className="text-[9px] font-black uppercase text-slate-400">Brand Color</label>
                                           <div className="flex gap-2">
                                              {['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899'].map(color => (
                                                 <button
                                                    key={color}
                                                    onClick={() => setCompanyColor(color)}
                                                    className={`w-10 h-10 rounded-xl border-2 ${companyColor === color ? 'border-slate-900 scale-110' : 'border-slate-200'} transition-all`}
                                                    style={{ backgroundColor: color }}
                                                 />
                                              ))}
                                           </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                           <label className="text-[9px] font-black uppercase text-slate-400">Logo Upload (JPG, PNG, GIF)</label>
                                           <input
                                              type="file"
                                              accept=".jpg,.jpeg,.png,.gif,.webp"
                                              onChange={(e) => {
                                                 const file = e.target.files?.[0];
                                                 if (file) {
                                                    setCompanyLogoFile(file);
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                       setCompanyLogo(event.target?.result as string);
                                                    };
                                                    reader.readAsDataURL(file);
                                                 }
                                              }}
                                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-medium text-sm focus:border-orange-400 outline-none"
                                           />
                                           {companyLogo && (
                                              <div className="flex items-center gap-2">
                                                 <img src={companyLogo} alt="Company logo" className="w-12 h-12 rounded-lg object-cover" />
                                                 <span className="text-xs text-slate-600">Logo preview</span>
                                              </div>
                                           )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                           <label className="text-[9px] font-black uppercase text-slate-400">Social Media</label>
                                           <div className="grid grid-cols-2 gap-2">
                                              <input value={companySocial.facebook} onChange={(e) => setCompanySocial({...companySocial, facebook: e.target.value})} placeholder="Facebook" className="px-3 py-2 rounded-lg border border-slate-100 text-xs" />
                                              <input value={companySocial.instagram} onChange={(e) => setCompanySocial({...companySocial, instagram: e.target.value})} placeholder="Instagram" className="px-3 py-2 rounded-lg border border-slate-100 text-xs" />
                                              <input value={companySocial.twitter} onChange={(e) => setCompanySocial({...companySocial, twitter: e.target.value})} placeholder="Twitter" className="px-3 py-2 rounded-lg border border-slate-100 text-xs" />
                                              <input value={companySocial.website} onChange={(e) => setCompanySocial({...companySocial, website: e.target.value})} placeholder="Website" className="px-3 py-2 rounded-lg border border-slate-100 text-xs" />
                                           </div>
                                        </div>
                                        
                                        <button
                                           onClick={() => {
                                              onUpdateCompany(company.id, {
                                                 description: companyDesc,
                                                 color: companyColor,
                                                 logoUrl: companyLogo,
                                                 socialMediaLinks: companySocial
                                              });
                                              setEditingCompanyId('');
                                           }}
                                           className="w-full py-3 rounded-xl bg-orange-500 text-white font-black text-xs uppercase"
                                        >
                                           Save Changes
                                        </button>
                                     </div>
                                  )}
                                  
                                  <button
                                     onClick={() => {
                                        setScheduleCompanyId(company.id);
                                        setShowScheduleModal(true);
                                     }}
                                     className="w-full py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase flex items-center justify-center gap-2"
                                  >
                                     <CalendarDays size={16} />
                                     Weekly Schedule
                                  </button>
                                  
                                  <button
                                     onClick={() => {
                                        setSelectedMapCompanyId(company.id);
                                        setShowDriverMap(true);
                                     }}
                                     className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-xs uppercase flex items-center justify-center gap-2"
                                  >
                                     <MapIcon2 size={16} />
                                     Live Driver Map
                                  </button>
                                  
                                  {(company.scheduledLocations || []).length > 0 && (
                                     <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400">Scheduled Locations</label>
                                        {company.scheduledLocations?.map((loc: ScheduledLocation) => (
                                           <div key={loc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                              <div className="flex justify-between items-start">
                                                 <div>
                                                    <p className="font-black text-slate-900 capitalize">{loc.dayOfWeek}</p>
                                                    <p className="text-slate-600">{loc.locationName}</p>
                                                    <p className="text-[10px] text-slate-400">{loc.startTime} - {loc.endTime}</p>
                                                 </div>
                                                 <div className="text-right">
                                                    <p className="text-slate-900 font-black">{loc.attendees.length}</p>
                                                    <p className="text-[9px] text-slate-400">attending</p>
                                                 </div>
                                              </div>
                                           </div>
                                        ))}
                                     </div>
                                  )}
                               </div>
                            ))}
                         </div>
                      )}
                  </div>

            {myFleet.map((biz: any) => (
               <div key={biz.id} className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-8 shadow-2xl relative group">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-2xl font-black mb-1 group-hover:text-orange-400 transition-colors">{biz.name}</h3>
                                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Company: {biz.companyName || 'Unassigned'}</p>
                                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mt-1">Driver: {biz.driverName || 'Unassigned'}</p>
                     </div>
                     <div className="w-4 h-4 rounded-full" style={{backgroundColor: STATUS_COLORS[biz.status as BusinessStatus]}}/>
                  </div>
                           <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Assign Driver</label>
                              <select
                                 value={biz.driverId || ''}
                                 onChange={(e) => {
                                    const companyDrivers = myCompanies.find((c: Company) => c.id === biz.companyId)?.drivers || [];
                                    const driver = companyDrivers.find((d: DriverProfile) => d.id === e.target.value) || null;
                                    onAssignDriver(biz.id, driver);
                                 }}
                                 className="mt-2 w-full px-4 py-3 rounded-xl bg-slate-900 text-white border border-white/10 text-xs font-bold"
                              >
                                 <option value="">Unassigned</option>
                                 {(myCompanies.find((c: Company) => c.id === biz.companyId)?.drivers || []).map((d: DriverProfile) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                 ))}
                              </select>
                           </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {[BusinessStatus.BUSY, BusinessStatus.MODERATE, BusinessStatus.EMPTY, BusinessStatus.OFFLINE].map(s => (
                        <button key={s} onClick={() => onUpdateStatus(biz.id, s)} className={`p-4 rounded-2xl border-2 transition-all text-[9px] font-black uppercase flex flex-col items-center gap-2 ${biz.status === s ? 'border-orange-500 bg-orange-500 text-white' : 'border-white/5 bg-white/5 text-slate-400'}`}>
                           <div className="w-2 h-2 rounded-full" style={{backgroundColor: biz.status === s ? 'white' : STATUS_COLORS[s]}}/>
                           {s}
                        </button>
                     ))}
                  </div>
               </div>
            ))}
            <button onClick={() => setShowCreate(true)} className="h-40 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-orange-400 hover:border-orange-100 transition-all group">
               <Plus size={32}/>
               <span className="font-black uppercase text-[10px] tracking-widest">Add New Fleet Vehicle</span>
            </button>
         </div>

         {showCreate && (
            <div className="fixed inset-0 z-[6000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-black text-slate-900">Create Fleet Vehicle</h2>
                     <button onClick={() => setShowCreate(false)} className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200">✕</button>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Name</label>
                     <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Mobile Auto Care" className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none" />
                  </div>

                           <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company</label>
                               <select
                                  value={newCompanyId}
                                  onChange={(e) => setNewCompanyId(e.target.value)}
                                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none"
                               >
                                  <option value="">No company</option>
                                  {myCompanies.map((c: Company) => (
                                     <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                               </select>
                           </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Map Icon</label>
                     <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {categoryOptions.map((cat) => (
                           <button key={cat} onClick={() => setNewCategory(cat)} className={`p-3 rounded-2xl border-2 flex items-center justify-center transition-all ${newCategory === cat ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-white'}`}>
                              <div className={`text-orange-500 ${newCategory === cat ? '' : 'opacity-60'}`}>{CATEGORY_ICONS[cat]}</div>
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description (optional)</label>
                     <input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="On-the-go services across the city" className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none" />
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Image URL (optional)</label>
                     <input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="https://..." className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none" />
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button onClick={() => setShowCreate(false)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase text-slate-500">Cancel</button>
                     <button
                        disabled={!newName.trim()}
                        onClick={() => {
                           onAddBusiness({ name: newName.trim(), category: newCategory, description: newDescription.trim(), imageUrl: newImageUrl.trim(), companyId: newCompanyId || undefined });
                           setShowCreate(false);
                           setNewName('');
                           setNewDescription('');
                           setNewImageUrl('');
                           setNewCompanyId('');
                        }}
                        className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase shadow-lg disabled:opacity-50"
                     >
                        Create Vehicle
                     </button>
                  </div>
               </div>
            </div>
         )}
         
         {showScheduleModal && (
            <div className="fixed inset-0 z-[6000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-black text-slate-900">Add Scheduled Location</h2>
                     <button onClick={() => setShowScheduleModal(false)} className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200">✕</button>
                  </div>
                  
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Day of Week</label>
                     <select
                        value={scheduleDayOfWeek}
                        onChange={(e) => setScheduleDayOfWeek(e.target.value as any)}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none"
                     >
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                     </select>
                  </div>
                  
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location Name</label>
                     <input 
                        value={scheduleLocationName} 
                        onChange={(e) => setScheduleLocationName(e.target.value)} 
                        placeholder="e.g. Downtown Plaza" 
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none" 
                     />
                  </div>
                  
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Address</label>
                     <input 
                        value={scheduleAddress} 
                        onChange={(e) => setScheduleAddress(e.target.value)} 
                        placeholder="123 Main St, City" 
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none" 
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Time</label>
                        <input 
                           type="time" 
                           value={scheduleStartTime} 
                           onChange={(e) => setScheduleStartTime(e.target.value)} 
                           className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Time</label>
                        <input 
                           type="time" 
                           value={scheduleEndTime} 
                           onChange={(e) => setScheduleEndTime(e.target.value)} 
                           className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none" 
                        />
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description (optional)</label>
                     <textarea
                        value={scheduleDescription}
                        onChange={(e) => setScheduleDescription(e.target.value)}
                        placeholder="Additional details..."
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-medium text-sm focus:border-orange-400 outline-none resize-none"
                        rows={3}
                     />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                     <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase text-slate-500">Cancel</button>
                     <button
                        disabled={!scheduleLocationName.trim() || !scheduleAddress.trim()}
                        onClick={() => {
                           onAddScheduledLocation(scheduleCompanyId, {
                              id: `sched_${Date.now()}`,
                              companyId: scheduleCompanyId,
                              dayOfWeek: scheduleDayOfWeek,
                              locationName: scheduleLocationName.trim(),
                              address: scheduleAddress.trim(),
                              startTime: scheduleStartTime,
                              endTime: scheduleEndTime,
                              description: scheduleDescription.trim(),
                              attendees: []
                           });
                           setShowScheduleModal(false);
                           setScheduleLocationName('');
                           setScheduleAddress('');
                           setScheduleDescription('');
                           setScheduleStartTime('09:00');
                           setScheduleEndTime('17:00');
                        }}
                        className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase shadow-lg disabled:opacity-50"
                     >
                        Add Schedule
                     </button>
                  </div>
               </div>
            </div>
         )}
         
         {/* LIVE DRIVER MAP MODAL */}
         {showDriverMap && selectedMapCompanyId && (
            <div className="fixed inset-0 z-[6000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                  <div className="flex items-center justify-between p-8 border-b border-slate-100">
                     <h2 className="text-2xl font-black text-slate-900">Live Driver Tracking</h2>
                     <button onClick={() => setShowDriverMap(false)} className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200">✕</button>
                  </div>
                  
                  <div className="flex-1 flex gap-6 p-8 overflow-hidden">
                     {/* Map */}
                     <div className="flex-1 rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50">
                        <MapContainer center={[40.7128, -74.0060]} zoom={13} zoomControl={false} className="h-full w-full">
                           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                           {myCompanies.find(c => c.id === selectedMapCompanyId)?.drivers.map(driver => {
                              if (!driver.location || !driver.status || driver.status === 'offline') return null;
                              const driverIcon = L.divIcon({
                                 className: 'driver-marker',
                                 html: `
                                    <div class="flex items-center justify-center w-10 h-10 rounded-full ${
                                       driver.status === 'on-delivery' ? 'bg-red-500' : 
                                       driver.status === 'on-break' ? 'bg-yellow-500' : 'bg-green-500'
                                    } border-3 border-white shadow-lg">
                                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M19 17h2v.5h.5v-.5h2v-2h-4.5v-1h4.5v-2h-2v-.5h-.5v.5h-2v2h-4.5V8h4.5V6h2v.5h.5v-.5h2v2h-4.5v3h4.5v2h-2v1.5h2v2"/></svg>
                                    </div>
                                 `,
                                 iconSize: [40, 40],
                                 iconAnchor: [20, 20],
                              });
                              return (
                                 <Marker key={driver.id} position={driver.location} icon={driverIcon}>
                                    <Popup>
                                       <div className="text-xs font-bold">
                                          <p className="font-black">{driver.name}</p>
                                          <p className="text-slate-600 capitalize">{driver.status}</p>
                                       </div>
                                    </Popup>
                                 </Marker>
                              );
                           })}
                        </MapContainer>
                     </div>
                     
                     {/* Driver List */}
                     <div className="w-64 border-2 border-slate-100 rounded-3xl p-4 overflow-y-auto custom-scroll space-y-3">
                        <h3 className="font-black text-slate-900 text-sm sticky top-0 bg-white">Drivers Online</h3>
                        {myCompanies.find(c => c.id === selectedMapCompanyId)?.drivers.map(driver => (
                           <div key={driver.id} className={`p-4 rounded-2xl border-2 ${
                              driver.status === 'online' ? 'border-green-200 bg-green-50' :
                              driver.status === 'on-delivery' ? 'border-red-200 bg-red-50' :
                              driver.status === 'on-break' ? 'border-yellow-200 bg-yellow-50' :
                              'border-slate-100 bg-slate-50'
                           }`}>
                              <p className="font-black text-slate-900 text-xs">{driver.name}</p>
                              <p className={`text-[10px] font-black uppercase mt-1 ${
                                 driver.status === 'online' ? 'text-green-600' :
                                 driver.status === 'on-delivery' ? 'text-red-600' :
                                 driver.status === 'on-break' ? 'text-yellow-600' :
                                 'text-slate-400'
                              }`}>{driver.status || 'Offline'}</p>
                              {driver.phone && <p className="text-[9px] text-slate-600 mt-2">{driver.phone}</p>}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}
         
         {/* Manage Drivers Section */}
         <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900">Manage Drivers</h2>
               
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Company</label>
                  <select
                     value={activeCompanyId}
                     onChange={(e) => setActiveCompanyId(e.target.value)}
                     className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm focus:border-orange-400 outline-none"
                  >
                     <option value="">Choose company</option>
                     {myCompanies.map((c: Company) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                  </select>
               </div>
               
               {activeCompanyId && (
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-900">Drivers</h3>
                        <button
                           onClick={() => setShowAddDriver(!showAddDriver)}
                           className="px-4 py-2 rounded-xl bg-orange-500 text-white font-black text-xs uppercase flex items-center gap-2"
                        >
                           <Plus size={14} /> Add Driver
                        </button>
                     </div>
                     
                     {showAddDriver && (
                        <div className="p-6 rounded-2xl bg-orange-50 border-2 border-orange-200 space-y-4">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                 value={driverName}
                                 onChange={(e) => setDriverName(e.target.value)}
                                 placeholder="Display name (e.g., János)"
                                 className="px-4 py-3 rounded-xl border-2 border-orange-100 font-bold text-sm focus:border-orange-400 outline-none"
                              />
                              <input
                                 value={driverFullName}
                                 onChange={(e) => setDriverFullName(e.target.value)}
                                 placeholder="Full name (e.g., Kovács János)"
                                 className="px-4 py-3 rounded-xl border-2 border-orange-100 font-bold text-sm focus:border-orange-400 outline-none"
                              />
                              <input
                                 value={driverEmail}
                                 onChange={(e) => setDriverEmail(e.target.value)}
                                 placeholder="Email"
                                 type="email"
                                 className="px-4 py-3 rounded-xl border-2 border-orange-100 font-bold text-sm focus:border-orange-400 outline-none"
                              />
                              <input
                                 value={driverPhone}
                                 onChange={(e) => setDriverPhone(e.target.value)}
                                 placeholder="Phone number"
                                 type="tel"
                                 className="px-4 py-3 rounded-xl border-2 border-orange-100 font-bold text-sm focus:border-orange-400 outline-none"
                              />
                           </div>
                           <div className="flex gap-2">
                              <button
                                 disabled={!driverName.trim() || !driverFullName.trim()}
                                 onClick={() => {
                                    onAddDriver(activeCompanyId, { 
                                       id: `drv_${Date.now()}`, 
                                       name: driverName.trim(),
                                       fullName: driverFullName.trim(),
                                       email: driverEmail.trim() || undefined,
                                       phone: driverPhone.trim() || undefined,
                                       companyId: activeCompanyId
                                    });
                                    setDriverName('');
                                    setDriverFullName('');
                                    setDriverEmail('');
                                    setDriverPhone('');
                                    setShowAddDriver(false);
                                 }}
                                 className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-black text-xs uppercase shadow-lg disabled:opacity-50"
                              >
                                 Save Driver
                              </button>
                              <button
                                 onClick={() => setShowAddDriver(false)}
                                 className="px-6 py-3 rounded-xl border-2 border-orange-200 font-black text-xs uppercase"
                              >
                                 Cancel
                              </button>
                           </div>
                        </div>
                     )}
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(myCompanies.find((c: Company) => c.id === activeCompanyId)?.drivers || []).map((d: DriverProfile) => {
                           // Get initials from full name or name (last 2 letters of last name)
                           const getInitials = () => {
                              if (d.fullName) {
                                 const names = d.fullName.split(' ');
                                 if (names.length >= 2) {
                                    const lastName = names[names.length - 1];
                                    return lastName.substring(0, 2).toUpperCase();
                                 }
                              }
                              return d.name.substring(0, 2).toUpperCase();
                           };
                           
                           return (
                              <div key={d.id} className="p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-orange-300 transition-all group">
                                 <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                                       {getInitials()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <h4 className="font-black text-sm text-slate-900">{d.name}</h4>
                                       {d.fullName && <p className="text-[10px] text-slate-500 font-medium">{d.fullName}</p>}
                                       <div className="mt-2 space-y-1">
                                          {d.email && <p className="text-[9px] text-slate-600 flex items-center gap-1"><Contact2 size={10} /> {d.email}</p>}
                                          {d.phone && <p className="text-[9px] text-slate-600 flex items-center gap-1"><Smartphone size={10} /> {d.phone}</p>}
                                       </div>
                                       {d.status && (
                                          <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black uppercase ${
                                             d.status === 'online' ? 'bg-green-100 text-green-700' :
                                             d.status === 'on-delivery' ? 'bg-red-100 text-red-700' :
                                             d.status === 'on-break' ? 'bg-yellow-100 text-yellow-700' :
                                             'bg-slate-100 text-slate-500'
                                          }`}>
                                             <div className={`w-1.5 h-1.5 rounded-full ${
                                                d.status === 'online' ? 'bg-green-500' :
                                                d.status === 'on-delivery' ? 'bg-red-500' :
                                                d.status === 'on-break' ? 'bg-yellow-500' :
                                                'bg-slate-400'
                                             }`} />
                                             {d.status}
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               )}
         </div>
      </div>
   );
};

// ... OTHER COMPONENTS REMAINING ROBUST (FEED, SOCIAL, DETAILS) ...
const FeedView: React.FC<any> = ({ businesses }) => (
   <div className="space-y-10 animate-in fade-in max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Social Activity</h1>
      <div className="space-y-6">
         {businesses.flatMap((b: Business) => b.posts).sort((a: any, b: any) => b.timestamp - a.timestamp).map((post: any) => (
            <div key={post.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-start gap-6 hover:shadow-md transition-all group">
               <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors"><Utensils size={24}/></div>
               <div>
                  <p className="font-black text-slate-900 text-sm italic leading-relaxed">"{post.content}"</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-3">{new Date(post.timestamp).toLocaleDateString()}</p>
               </div>
            </div>
         ))}
      </div>
   </div>
);

const SocialView: React.FC<any> = ({ profile, businesses, onToggleAttendance }) => {
   const followedBusinesses = businesses.filter((b: Business) => profile.following.includes(b.id));
   const upcomingEvents: Array<{ business: Business; location: ScheduledLocation }> = [];
   
   followedBusinesses.forEach((biz: Business) => {
      (biz.scheduledLocations || []).forEach((loc: ScheduledLocation) => {
         upcomingEvents.push({ business: biz, location: loc });
      });
   });
   
   // Sort by day of week
   const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
   upcomingEvents.sort((a, b) => dayOrder.indexOf(a.location.dayOfWeek) - dayOrder.indexOf(b.location.dayOfWeek));
   
   return (
      <div className="space-y-10 animate-in fade-in max-w-2xl mx-auto">
         <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Social Circle</h2>
            <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl font-black text-xs">{profile.friends.length} Friends</span>
         </div>
         
         {upcomingEvents.length > 0 && (
            <div className="space-y-6">
               <div className="flex items-center gap-2">
                  <CalendarDays size={20} className="text-orange-500" />
                  <h3 className="text-lg font-black text-slate-900">Upcoming Events</h3>
                  <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-lg font-black text-[10px]">{upcomingEvents.length} Events</span>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {upcomingEvents.map(({ business, location }) => {
                     const isAttending = location.attendees.includes(profile.id);
                     return (
                        <div key={`${business.id}-${location.id}`} className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-[2.5rem] border-2 border-orange-100 space-y-4 hover:shadow-lg transition-all">
                           <div className="flex items-start gap-4">
                              <img src={business.imageUrl} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                              <div className="flex-1 min-w-0">
                                 <p className="font-black text-slate-900 text-sm">{business.name}</p>
                                 <p className="text-xs text-slate-600 mt-1">{business.companyName || 'Independent'}</p>
                                 <p className="text-lg font-black text-orange-500 capitalize mt-2">{location.dayOfWeek}</p>
                              </div>
                              <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                                 <p className="text-lg font-black text-orange-500">{location.attendees.length}</p>
                                 <p className="text-[9px] font-black uppercase text-slate-400">Going</p>
                              </div>
                           </div>
                           
                           <div className="bg-white/80 p-4 rounded-2xl border border-orange-100 space-y-2">
                              <div className="flex items-center gap-2 text-slate-700">
                                 <MapPin size={14} className="text-orange-500" />
                                 <p className="text-sm font-bold">{location.locationName}</p>
                              </div>
                              <p className="text-xs text-slate-500 pl-6">{location.address}</p>
                              <div className="flex items-center gap-2 text-slate-600 pl-6">
                                 <Clock size={12} className="text-orange-400" />
                                 <p className="text-xs font-black">{location.startTime} - {location.endTime}</p>
                              </div>
                              {location.description && (
                                 <p className="text-xs text-slate-600 pl-6 italic mt-2">"{location.description}"</p>
                              )}
                           </div>
                           
                           <button
                              onClick={() => onToggleAttendance && onToggleAttendance(location.id, profile.id)}
                              className={`w-full py-4 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                                 isAttending 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                                    : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                              }`}
                           >
                              {isAttending ? <><Check size={16} /> You're Going!</> : <><Users size={16} /> I'll Be There</>}
                           </button>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}
         
         <div className="grid grid-cols-1 gap-4">
            <h3 className="text-lg font-black text-slate-900">Your Friends</h3>
            {profile.friends.map((fId: string) => (
               <div key={fId} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-white rounded-[1.5rem] flex items-center justify-center text-indigo-600 font-black shadow-sm group-hover:scale-110 transition-transform">F</div>
                     <div><p className="font-black text-slate-800">Friend_{fId.slice(-4)}</p><p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Online Now</p></div>
                  </div>
                  <button className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all hover:bg-indigo-700"><MessageSquare size={20}/></button>
               </div>
            ))}
         </div>
      </div>
   );
};

const DetailsSheet: React.FC<any> = ({ business, profile, onCheckIn, onClose, onToggleAttendance, onToggleFollow, userLocation }) => {
   const alreadyCheckedIn = business.checkedInUsers?.includes(profile.id);
   const isFollowing = profile.following.includes(business.id);
   const [tab, setTab] = useState<'info' | 'menu' | 'schedule'>('info');
   
   // Calculate distance
   const distance = userLocation ? calculateDistance(
      userLocation[0], userLocation[1],
      business.location[0], business.location[1]
   ) : null;
   
   const canCheckIn = distance !== null && distance <= CHECK_IN_RADIUS && !alreadyCheckedIn;
   const tooFar = distance !== null && distance > CHECK_IN_RADIUS;
   
   return (
      <div className="fixed inset-0 z-[5000] flex flex-col justify-end items-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 pointer-events-none">
         <div className="pointer-events-auto bg-white w-full md:w-[550px] md:h-[92%] rounded-t-[3.5rem] md:rounded-[3.5rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 h-[95dvh] overflow-hidden">
            <div className="shrink-0 h-1.5 w-12 bg-orange-100 rounded-full mx-auto my-4" />
            <div className="relative h-56 shrink-0 overflow-hidden">
               <img src={business.imageUrl} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
               <button onClick={onClose} className="absolute top-6 left-6 w-12 h-12 bg-black/30 backdrop-blur-xl text-white rounded-2xl flex items-center justify-center shadow-lg"><ChevronDown size={28} /></button>
               {distance !== null && (
                  <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-xl text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black text-xs">
                     <Navigation2 size={14} />
                     {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}
                  </div>
               )}
               <div className="absolute bottom-6 left-8 right-8">
                  <h3 className="text-4xl font-black tracking-tighter drop-shadow-lg leading-tight text-white">{business.name}</h3>
                  <button
                     onClick={() => onToggleFollow(business.id)}
                     className={`mt-3 px-4 py-2 rounded-2xl font-black text-xs uppercase flex items-center gap-2 transition-all shadow-lg ${
                        isFollowing 
                           ? 'bg-green-500 text-white' 
                           : 'bg-white/90 text-slate-800 hover:bg-white'
                     }`}
                  >
                     {isFollowing ? <><Check size={14} /> Following</> : <><Bell size={14} /> Follow for Updates</>}
                  </button>
               </div>
            </div>
            <div className="flex px-8 py-4 gap-4 border-b border-orange-50 bg-white sticky top-0 z-10">
               {[{id:'info', label:'Wall', icon:<Info size={14}/>}, {id:'menu', label:'Menu', icon:<ChefHat size={14}/>}, {id:'schedule', label:'Schedule', icon:<CalendarDays size={14}/>}].map(t => (
                 <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${tab === t.id ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
                   {t.icon} {t.label}
                 </button>
               ))}
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scroll bg-white">
               {tab === 'info' && (
                 <div className="space-y-8 animate-in fade-in">
                    {!alreadyCheckedIn ? (
                       canCheckIn ? (
                          <button onClick={() => onCheckIn(business.id)} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                             <Check size={20} /> Check-In & Get Stamp
                          </button>
                       ) : tooFar ? (
                          <div className="w-full bg-amber-50 border-2 border-amber-200 text-amber-800 py-6 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                             <MapPin size={20} /> Too Far Away ({Math.round(distance!)}m) - Must be within {CHECK_IN_RADIUS}m
                          </div>
                       ) : (
                          <div className="w-full bg-slate-100 border-2 border-slate-200 text-slate-600 py-6 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                             <Navigation2 size={20} /> Enable GPS to Check In
                          </div>
                       )
                    ) : (
                       <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-center justify-center gap-4">
                          <Check size={24} className="text-green-500" />
                          <span className="font-black text-green-800 text-xs uppercase">Stamp Earned!</span>
                       </div>
                    )}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">About</h4>
                       <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 italic">"{business.description}"</p>
                    </div>
                 </div>
               )}
               {tab === 'menu' && (
                 <div className="grid grid-cols-1 gap-4 pb-20 animate-in fade-in">
                    {business.products.map((p: any) => (
                       <div key={p.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-[2.5rem] border border-slate-100 group shadow-sm">
                          <img src={p.imageUrl} className="w-20 h-20 rounded-2xl object-cover" />
                          <div className="flex-1"><p className="font-black text-slate-800 text-sm">{p.name}</p><p className="text-indigo-600 font-black text-xs mt-1">${p.price.toFixed(2)}</p></div>
                          <button className="bg-white text-slate-300 p-3 rounded-2xl shadow-sm hover:text-orange-500"><Plus size={20}/></button>
                       </div>
                    ))}
                 </div>
               )}
               {tab === 'schedule' && (
                 <div className="space-y-6 pb-20 animate-in fade-in">
                    {(business.scheduledLocations || []).length === 0 && business.route && (
                       <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-orange-100">
                          {business.route?.map((step: any) => (
                             <div key={step.id} className={`relative ${step.isCurrent ? 'scale-105' : 'opacity-60'}`}>
                                <div className={`absolute -left-[23px] top-1 w-[12px] h-[12px] rounded-full border-2 border-white ${step.isCurrent ? 'bg-orange-500 ring-4 ring-orange-100' : 'bg-orange-200'}`} />
                                <div className={`p-6 rounded-[2.5rem] border transition-all ${step.isCurrent ? 'bg-orange-50 border-orange-200 shadow-md' : 'bg-white border-slate-100'}`}>
                                   <p className="text-xs font-black text-slate-800">{step.locationName}</p>
                                   <p className="text-[10px] font-bold text-orange-400 uppercase mt-1 flex items-center gap-1"><Clock size={10}/> {step.time}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                    {(business.scheduledLocations || []).length > 0 && (
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Weekly Schedule</h4>
                          {(business.scheduledLocations || []).map((loc: ScheduledLocation) => {
                             const isAttending = loc.attendees.includes(profile.id);
                             return (
                                <div key={loc.id} className="p-6 rounded-[2.5rem] border border-slate-100 bg-slate-50 space-y-4">
                                   <div className="flex justify-between items-start">
                                      <div>
                                         <p className="text-lg font-black text-slate-900 capitalize">{loc.dayOfWeek}</p>
                                         <p className="text-sm font-bold text-slate-700 mt-1">{loc.locationName}</p>
                                         <p className="text-xs text-slate-500 mt-1">{loc.address}</p>
                                         <p className="text-xs font-black text-orange-500 mt-2 flex items-center gap-1">
                                            <Clock size={12} /> {loc.startTime} - {loc.endTime}
                                         </p>
                                         {loc.description && <p className="text-xs text-slate-600 mt-2 italic">{loc.description}</p>}
                                      </div>
                                      <div className="text-right">
                                         <div className="bg-white px-3 py-2 rounded-xl border border-slate-200">
                                            <p className="text-xl font-black text-orange-500">{loc.attendees.length}</p>
                                            <p className="text-[9px] font-black uppercase text-slate-400">Going</p>
                                         </div>
                                      </div>
                                   </div>
                                   <button
                                      onClick={() => onToggleAttendance && onToggleAttendance(loc.id, profile.id)}
                                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                                         isAttending 
                                            ? 'bg-green-500 text-white shadow-lg' 
                                            : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-orange-400'
                                      }`}
                                   >
                                      {isAttending ? <><Check size={16} /> I'll Be There</> : <><Users size={16} /> I'll Be There</>}
                                   </button>
                                </div>
                             );
                          })}
                       </div>
                    )}
                    {(business.scheduledLocations || []).length === 0 && !business.route && (
                       <div className="text-center py-12 text-slate-400">
                          <CalendarDays size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="text-xs font-bold">No scheduled locations yet</p>
                       </div>
                    )}
                 </div>
               )}
            </div>
         </div>
      </div>
   );
};

const OnboardingFlow: React.FC<any> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  return (
    <div className="fixed inset-0 bg-orange-500 flex items-center justify-center p-6 z-[9999]">
      <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 space-y-8 shadow-2xl overflow-hidden relative">
        {step === 1 ? (
          <div className="space-y-8">
             <div className="text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto text-orange-500 mb-6"><Zap size={40}/></div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Select your role</h2>
                <p className="text-slate-400 text-sm font-medium mt-2">How will you use StreetBites today?</p>
             </div>
             <div className="space-y-3">
                {[
                  { r: UserRole.CUSTOMER, label: 'Hungry Customer', desc: 'Find trucks & order food.', icon: <ShoppingBag size={20}/> },
                  { r: UserRole.OWNER, label: 'Business Owner', desc: 'Manage your fleet & menu.', icon: <Briefcase size={20}/> },
                  { r: UserRole.DRIVER, label: 'Professional Driver', desc: 'Update live GPS locations.', icon: <Truck size={20}/> }
                ].map((item) => (
                  <button key={item.r} onClick={() => setRole(item.r)} className={`w-full flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left ${role === item.r ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-md' : 'border-slate-50 text-slate-400'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === item.r ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-50'}`}>{item.icon}</div>
                    <div><p className="font-black text-sm">{item.label}</p><p className="text-[10px] font-medium opacity-60">{item.desc}</p></div>
                  </button>
                ))}
             </div>
             <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Next Step <ArrowRight size={16} className="inline ml-2"/></button>
          </div>
        ) : (
          <div className="space-y-8">
             <button onClick={() => setStep(1)} className="text-slate-300 flex items-center gap-1 text-[10px] font-black uppercase hover:text-slate-400 transition-colors"><ChevronLeft size={16}/> Back</button>
             <div className="text-center"><h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Identity</h2><p className="text-slate-400 text-sm font-medium mt-2">What should we call you on the map?</p></div>
             <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name..." className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 p-5 rounded-2xl outline-none font-bold shadow-inner" autoFocus />
             <button disabled={!name.trim()} onClick={() => {console.log('Login clicked:', name, role); onComplete(name, role);}} className="w-full bg-orange-500 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-orange-600 shadow-xl active:scale-95 transition-all cursor-pointer">Start Exploring</button>
          </div>
        )}
      </div>
    </div>
  );
};

const MapController: React.FC<{ target: Business | null, isSidebarOpen: boolean, isMobile: boolean }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
         map.flyTo(target.location, 16, { duration: 1.2 });
    }
   }, [target, map]);
  return null;
};

const MarkerWithPortal: React.FC<{ biz: Business, profile: UserProfile, isSelected: boolean, onClick: () => void, onOpenSheet: () => void }> = memo(({ biz, profile, isSelected, onClick, onOpenSheet }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const icon = useMemo(() => L.divIcon({
    className: 'custom-leaflet-icon-wrapper',
    html: `<div class="marker-root-${biz.id}"></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  }), [biz.id]);

  return (
    <Marker 
      position={biz.location} 
      icon={icon}
      eventHandlers={{ click: onClick }}
      ref={(ref) => {
        if (ref) {
          const el = ref.getElement()?.querySelector(`.marker-root-${biz.id}`);
          if (el && !container) setContainer(el as HTMLDivElement);
        }
      }}
    >
      {container && ReactDOM.createPortal(<CustomMarker business={biz} isSelected={isSelected} checkedInFriendsCount={biz.checkedInUsers?.length || 0} />, container)}
      <Popup offset={[0, -35]} closeButton={false}>
        <div className="relative p-4 bg-white rounded-[1.5rem] overflow-hidden min-w-[280px]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-3 pr-6">
            <img src={biz.imageUrl} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
            <div className="min-w-0">
              <h4 className="font-black text-sm text-slate-800 leading-tight truncate">{biz.name}</h4>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[biz.status as BusinessStatus] }}></div>
                <span className="text-[9px] font-black uppercase text-slate-400">{biz.status}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={(e) => { e.stopPropagation(); onOpenSheet(); }} className="bg-slate-900 text-white text-[9px] font-black uppercase py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-95">Details <ArrowRight size={10} /></button>
            <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${biz.location[0]},${biz.location[1]}`, '_blank'); }} className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95">GPS <Navigation2 size={10} /></button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

export default MainApp;