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
import { Business, BusinessStatus, BusinessCategory, SortOption, UserProfile, UserRole, Message, Review, BusinessPost, Product, FeedPost, SubscriptionTier, FriendRequest, DirectMessage } from './types';
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
   const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [activeView, setActiveView] = useState<ViewType>('explorer');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  useEffect(() => {
      const init = async () => {
         const biz = await StreetBitesAPI.fetchBusinesses();
         setBusinesses(biz);
         setProfile(initialProfile);
         setIsInitialLoading(false);
      };
    init();

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      }, (err) => console.warn("Location error:", err), { enableHighAccuracy: true });
    }
  }, []);

  useEffect(() => {
    if (!isInitialLoading) {
      const sync = async () => {
        setIsSyncing(true);
        if (profile) await StreetBitesAPI.saveProfile(profile);
        await StreetBitesAPI.saveBusinesses(businesses);
        setTimeout(() => setIsSyncing(false), 800);
      };
      sync();
    }
  }, [profile, businesses, isInitialLoading]);

  const filteredBusinesses = useMemo(() => {
    let list = [...businesses];
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
  }, [businesses, searchQuery, sortBy]);

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
    <div className="h-full flex flex-col items-center justify-center bg-orange-500 text-white space-y-6 px-10 text-center">
      <div className="w-20 h-20 bg-white/20 rounded-[2.5rem] flex items-center justify-center animate-pulse"><Cloud size={48} /></div>
       <div>
          <h2 className="text-3xl font-black tracking-tighter">STREETBITES</h2>
          <p className="text-white/60 font-black text-[10px] uppercase tracking-widest mt-2">Connecting to Cloud Services...</p>
       </div>
    </div>
  );

  if (!profile) return <OnboardingFlow onComplete={handleOnboarding} />;

  return (
    <div className="h-full flex flex-col bg-orange-50/20 overflow-hidden relative">
      {/* GLOBAL STATUS BAR */}
      <div className={`h-1 transition-all duration-500 ${isSyncing ? 'bg-emerald-400 opacity-100' : 'bg-transparent opacity-0'} absolute top-0 left-0 right-0 z-[9999]`} />

      <header className="px-6 py-4 flex items-center justify-between z-[2000] border-b border-orange-100 bg-white/95 backdrop-blur-md h-16 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-md"><Utensils size={18} /></div>
          <h1 className="text-lg font-black tracking-tighter text-orange-900 hidden sm:block">StreetBites</h1>
          <div className="flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
             <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
             <span className="text-[8px] font-black uppercase text-slate-500">{isSyncing ? 'Saving...' : 'Synced'}</span>
          </div>
        </div>
        
        {activeView === 'explorer' && (
           <div className="flex-1 max-w-md mx-4 md:mx-8 flex items-center bg-orange-50 rounded-2xl px-4 py-2 border border-orange-100 transition-all focus-within:ring-2 ring-orange-200">
              <Search size={16} className="text-orange-300 mr-2" />
              <input type="text" placeholder="Find tacos or coffee..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent text-xs font-bold w-full outline-none" />
           </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={() => setActiveView('me')} className="w-10 h-10 rounded-full border-2 border-orange-200 p-0.5 hover:border-orange-500 transition-all bg-white flex items-center justify-center">
             <div className="w-full h-full bg-orange-50 rounded-full flex items-center justify-center text-orange-500 font-black text-xs">{profile.name.charAt(0)}</div>
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-row h-full">
        {/* SIDEBAR */}
        <aside className={`${window.innerWidth < 768 ? (isSidebarOpen && activeView === 'explorer' ? 'mobile-sheet-overlay' : 'hidden') : (isSidebarOpen ? 'w-[380px]' : 'w-0 overflow-hidden')} h-full bg-white border-r border-orange-100 z-30 transition-all duration-300 flex flex-col`}>
          <div className="px-6 pt-6 pb-2 space-y-4 shrink-0">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-orange-950">Active Near You</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-300 hover:text-orange-500"><ChevronFirst size={24}/></button>
             </div>
             <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: 'recommended', label: 'Hot', icon: <Flame size={12}/> },
                  { id: 'rating', label: 'Top', icon: <Star size={12}/> },
                  { id: 'alphabetical', label: 'A-Z', icon: <ArrowUpDown size={12}/> }
                ].map(opt => (
                  <button key={opt.id} onClick={() => setSortBy(opt.id as any)} className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${sortBy === opt.id ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-3 custom-scroll pt-2">
            {filteredBusinesses.map(biz => (
              <div key={biz.id} onClick={() => { setSelectedBusiness(biz); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className={`flex items-center gap-4 p-5 rounded-[2.5rem] border transition-all cursor-pointer group ${selectedBusiness?.id === biz.id ? 'bg-orange-500 text-white shadow-xl scale-[1.02]' : 'bg-white border-orange-50 hover:bg-orange-50'}`}>
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
                    <OwnerDashboard profile={profile} businesses={businesses} onUpdateStatus={(id: string, s: any) => setBusinesses(prev => prev.map(b => b.id === id ? {...b, status: s} : b))} onBecomeOwner={() => setProfile({...profile, role: UserRole.OWNER})} />
                 ) : activeView === 'feed' ? (
                    <FeedView businesses={businesses} />
                 ) : (
                    <SocialView profile={profile} />
                 )}
              </div>
           </div>
        )}
      </main>

      {/* DETAIL MODAL */}
      {selectedBusiness && isDetailOpen && (
        <DetailsSheet business={selectedBusiness} profile={profile} onCheckIn={(bid: string) => {
             setBusinesses(prev => prev.map(b => b.id === bid ? { ...b, checkedInUsers: [...(b.checkedInUsers || []), profile.id] } : b));
             setProfile(prev => prev ? {...prev, stats: {...prev.stats, visitedCount: prev.stats.visitedCount + 1, passportStamps: Array.from(new Set([...(prev.stats.passportStamps || []), bid]))}} : null);
          }} onClose={() => setIsDetailOpen(false)} />
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
   const [showPairing, setShowPairing] = useState(false);

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

         {/* PAIRING TOOLS (GITHub/PC TO MOBILE) */}
         <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-black text-emerald-950 uppercase tracking-widest flex items-center gap-2"><Smartphone size={18}/> Mobile Pair</h3>
               <button onClick={() => setShowPairing(!showPairing)} className="text-[9px] font-black text-emerald-600 bg-white px-3 py-1 rounded-full shadow-sm">
                  {showPairing ? 'Hide' : 'Show Instructions'}
               </button>
            </div>
            {showPairing && (
               <div className="space-y-6 animate-in zoom-in-95">
                  <p className="text-xs font-medium text-emerald-800/70 leading-relaxed italic">"Once you deploy this code to **GitHub Pages** or **Vercel**, copy the link below and open it on your phone to see your fleet live!"</p>
                  <div className="bg-white p-5 rounded-3xl space-y-4 border border-emerald-100 shadow-inner">
                     <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase">App Sync ID</span>
                        <code className="text-xs font-black text-emerald-600">{profile.id}</code>
                     </div>
                     <button 
                        onClick={() => { navigator.clipboard.writeText(window.location.href); alert("App Link Copied!"); }}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                     >
                        <LinkIcon size={14}/> Copy App Link
                     </button>
                  </div>
                  <div className="flex flex-col items-center gap-4 py-4">
                     <div className="w-32 h-32 bg-white rounded-3xl border-4 border-emerald-100 flex items-center justify-center">
                        <QrCode size={80} className="text-emerald-300 opacity-50"/>
                     </div>
                     <span className="text-[8px] font-black text-emerald-600 uppercase">Scan to Open on Phone</span>
                  </div>
               </div>
            )}
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
            <button className="flex-1 py-6 bg-slate-50 text-slate-600 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"><Settings size={18}/> Settings</button>
            <button onClick={onLogout} className="flex-1 py-6 bg-red-50 text-red-500 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"><LogOut size={18}/> Sign Out</button>
         </div>
      </div>
   );
};

const OwnerDashboard: React.FC<any> = ({ profile, businesses, onUpdateStatus, onBecomeOwner }) => {
   const myFleet = businesses.filter((b: any) => b.ownerId === profile.id);
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
            {myFleet.map((biz: any) => (
               <div key={biz.id} className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-8 shadow-2xl relative group">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-2xl font-black mb-1 group-hover:text-orange-400 transition-colors">{biz.name}</h3>
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Driver: {biz.driverName || 'Unassigned'}</p>
                     </div>
                     <div className="w-4 h-4 rounded-full" style={{backgroundColor: STATUS_COLORS[biz.status as BusinessStatus]}}/>
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
            <button className="h-40 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-orange-400 hover:border-orange-100 transition-all group">
               <Plus size={32}/>
               <span className="font-black uppercase text-[10px] tracking-widest">Add New Fleet Vehicle</span>
            </button>
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

const SocialView: React.FC<any> = ({ profile }) => (
   <div className="space-y-10 animate-in fade-in max-w-2xl mx-auto">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-900 tracking-tight">Social Circle</h2><span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl font-black text-xs">{profile.friends.length} Friends</span></div>
      <div className="grid grid-cols-1 gap-4">
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

const DetailsSheet: React.FC<any> = ({ business, profile, onCheckIn, onClose }) => {
   const alreadyCheckedIn = business.checkedInUsers?.includes(profile.id);
   const [tab, setTab] = useState<'info' | 'menu' | 'schedule'>('info');
   return (
      <div className="fixed inset-0 z-[5000] flex flex-col justify-end items-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 pointer-events-none">
         <div className="pointer-events-auto bg-white w-full md:w-[550px] md:h-[92%] rounded-t-[3.5rem] md:rounded-[3.5rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 h-[95dvh] overflow-hidden">
            <div className="shrink-0 h-1.5 w-12 bg-orange-100 rounded-full mx-auto my-4" />
            <div className="relative h-56 shrink-0 overflow-hidden">
               <img src={business.imageUrl} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
               <button onClick={onClose} className="absolute top-6 left-6 w-12 h-12 bg-black/30 backdrop-blur-xl text-white rounded-2xl flex items-center justify-center shadow-lg"><ChevronDown size={28} /></button>
               <div className="absolute bottom-6 left-8 right-8 text-white">
                  <h3 className="text-4xl font-black tracking-tighter drop-shadow-lg leading-tight">{business.name}</h3>
               </div>
            </div>
            <div className="flex px-8 py-4 gap-4 border-b border-orange-50 bg-white sticky top-0 z-10">
               {[{id:'info', label:'Wall', icon:<Info size={14}/>}, {id:'menu', label:'Menu', icon:<ChefHat size={14}/>}, {id:'schedule', label:'Route', icon:<CalendarDays size={14}/>}].map(t => (
                 <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${tab === t.id ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
                   {t.icon} {t.label}
                 </button>
               ))}
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scroll bg-white">
               {tab === 'info' && (
                 <div className="space-y-8 animate-in fade-in">
                    {!alreadyCheckedIn ? <button onClick={() => onCheckIn(business.id)} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">Check-In & Get Stamp</button> : <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-center justify-center gap-4"><Check size={24} className="text-green-500" /><span className="font-black text-green-800 text-xs uppercase">Stamp Earned!</span></div>}
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
                 <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-orange-100 pb-20 animate-in fade-in">
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
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto text-orange-500 mb-6"><Store size={40}/></div>
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
             <button onClick={() => setStep(1)} className="text-slate-300 flex items-center gap-1 text-[10px] font-black uppercase"><ChevronLeft size={16}/> Back</button>
             <div className="text-center"><h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Identity</h2><p className="text-slate-400 text-sm font-medium mt-2">What should we call you on the map?</p></div>
             <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name..." className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 p-5 rounded-2xl outline-none font-bold shadow-inner" />
             <button disabled={!name.trim()} onClick={() => onComplete(name, role)} className="w-full bg-orange-500 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest disabled:opacity-50 shadow-xl active:scale-95 transition-all">Start Exploring</button>
          </div>
        )}
      </div>
    </div>
  );
};

const MapController: React.FC<{ target: Business | null, isSidebarOpen: boolean, isMobile: boolean }> = ({ target, isSidebarOpen, isMobile }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      const padding: L.PointTuple = isMobile ? [0, 200] : (isSidebarOpen ? [360, 0] : [0, 0]);
      map.flyTo(target.location, 16, { duration: 1.2, paddingTopLeft: padding });
    }
  }, [target, map, isSidebarOpen, isMobile]);
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