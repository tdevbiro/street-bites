
import React, { memo } from 'react';
import { Business, BusinessStatus, BusinessCategory } from '../types';
import { CATEGORY_ICONS, STATUS_COLORS } from '../constants';
import { Users, Utensils, Heart } from 'lucide-react';

interface CustomMarkerProps {
  business: Business;
  isSelected?: boolean;
  checkedInFriendsCount?: number;
}

export const CustomMarker: React.FC<CustomMarkerProps> = memo(({ business, isSelected, checkedInFriendsCount = 0 }) => {
  const isBusy = business.status === BusinessStatus.BUSY;
  const isOffline = business.status === BusinessStatus.OFFLINE;

  return (
    <div className={`relative transition-all duration-300 ${isSelected ? 'scale-125' : 'scale-100'}`}>
      {/* Friend Presence Glow */}
      {checkedInFriendsCount > 0 && (
        <div className="absolute inset-0 -m-4 rounded-full blur-xl bg-indigo-400/60 animate-pulse"></div>
      )}
      
      {/* Selection Glow */}
      {isSelected && (
        <div className="absolute inset-0 -m-4 rounded-full blur-2xl bg-orange-400/70 animate-pulse"></div>
      )}

      {/* Visitor & Friend Badges */}
      <div className="absolute -top-2 -right-2 z-30 flex flex-col gap-1">
        {business.currentVisitors + checkedInFriendsCount > 0 && (
          <div className="flex items-center gap-0.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white px-2 py-0.5 rounded-full text-[8px] font-black shadow-lg border-2 border-white">
            <Users size={8} />
            {business.currentVisitors + checkedInFriendsCount}
          </div>
        )}
        {checkedInFriendsCount > 0 && (
          <div className="flex items-center gap-0.5 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white px-2 py-0.5 rounded-full text-[8px] font-black shadow-lg animate-bounce border-2 border-white">
            <Heart size={8} fill="white" />
            {checkedInFriendsCount}
          </div>
        )}
      </div>

      {/* Main 3D Marker Icon */}
      <div 
        className={`w-12 h-12 flex items-center justify-center relative z-20 transform transition-all shadow-2xl ${
          isSelected ? 'shadow-orange-400/50' : 'shadow-slate-900/30'
        }`}
        style={{ 
          background: isOffline 
            ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)'
            : isBusy 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
          borderRadius: '1.4rem',
          border: isSelected ? '3px solid #fb923c' : '3px solid white',
          boxShadow: isSelected 
            ? '0 8px 24px rgba(251, 146, 60, 0.4), inset 0 -2px 8px rgba(0,0,0,0.2), inset 0 2px 8px rgba(255,255,255,0.3)'
            : '0 6px 16px rgba(0,0,0,0.3), inset 0 -2px 8px rgba(0,0,0,0.2), inset 0 2px 8px rgba(255,255,255,0.3)'
        }}
      >
        <div className="text-white drop-shadow-md">
          {CATEGORY_ICONS[business.category] || <Utensils size={20} />}
        </div>
      </div>
      
      {/* 3D Pointer tail with shadow */}
      <div 
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rotate-45 z-10" 
        style={{ 
          background: isOffline 
            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            : isBusy 
            ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
            : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          border: isSelected ? '3px solid #fb923c' : '3px solid white',
          borderTop: 'none',
          borderLeft: 'none',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}
      ></div>
    </div>
  );
});
