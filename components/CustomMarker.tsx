
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
  const bgColor = STATUS_COLORS[business.status as BusinessStatus];
  const isBusy = business.status === BusinessStatus.BUSY;
  const isOffline = business.status === BusinessStatus.OFFLINE;

  return (
    <div className={`relative transition-all duration-300 ${isSelected ? 'scale-110' : 'scale-100'}`}>
      {/* Friend Presence Glow */}
      {checkedInFriendsCount > 0 && (
        <div className="absolute inset-0 -m-4 rounded-full blur-xl bg-indigo-500/50 animate-pulse"></div>
      )}
      
      {/* Selection Glow */}
      {isSelected && (
        <div className="absolute inset-0 -m-3 rounded-full blur-xl bg-orange-500/40"></div>
      )}

      {/* Visitor & Friend Badges */}
      <div className="absolute -top-3 -right-3 z-30 flex flex-col gap-1">
        <div className="flex items-center gap-0.5 bg-slate-900 text-white px-1.5 py-0.5 rounded-full text-[8px] font-black shadow-lg border border-white/20">
          <Users size={7} />
          {business.currentVisitors + checkedInFriendsCount}
        </div>
        {checkedInFriendsCount > 0 && (
          <div className="flex items-center gap-0.5 bg-indigo-600 text-white px-1.5 py-0.5 rounded-full text-[8px] font-black shadow-lg animate-bounce">
            <Heart size={7} fill="white" />
            {checkedInFriendsCount}
          </div>
        )}
      </div>

      {/* Main Marker Icon */}
      <div 
        className={`w-11 h-11 flex items-center justify-center shadow-2xl border-2 relative z-20 transform transition-all`}
        style={{ 
          backgroundColor: bgColor,
          borderColor: isSelected ? '#f97316' : (isOffline ? '#475569' : 'white'),
          color: isOffline ? 'white' : (bgColor === '#FFFFFF' ? 'black' : 'white'),
          borderRadius: '1.2rem'
        }}
      >
        {CATEGORY_ICONS[business.category] || <Utensils size={18} />}
      </div>
      
      {/* Pointer tail */}
      <div 
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r-2 border-b-2 z-10" 
        style={{ 
          backgroundColor: bgColor,
          borderColor: isSelected ? '#f97316' : 'white'
        }}
      ></div>
    </div>
  );
});
