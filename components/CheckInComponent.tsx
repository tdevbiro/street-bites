import React, { useEffect, useState } from 'react';
import { MapPin, Check, AlertCircle } from 'lucide-react';
import { CheckIn } from '../types';

interface CheckInComponentProps {
  userLocation: [number, number] | null;
  nearbyBusinesses: Array<{
    id: string;
    name: string;
    location: [number, number];
    category: string;
  }>;
  onCheckIn: (businessId: string) => void;
  onNotificationRequest: (businessId: string) => void;
  checkIns: CheckIn[];
  checkInRadius: number; // in meters
}

export const CheckInComponent: React.FC<CheckInComponentProps> = ({
  userLocation,
  nearbyBusinesses,
  onCheckIn,
  onNotificationRequest,
  checkIns,
  checkInRadius
}) => {
  const [checkedInId, setCheckedInId] = useState<string | null>(null);

  // Check if user is already checked in
  useEffect(() => {
    const activeCheckIn = checkIns.find(c => !c.checkOutTime);
    setCheckedInId(activeCheckIn?.businessId || null);
  }, [checkIns]);

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

    return R * c;
  };

  if (!userLocation) {
    return null;
  }

  const businessesWithDistance = nearbyBusinesses.map(business => ({
    ...business,
    distance: calculateDistance(
      userLocation[0],
      userLocation[1],
      business.location[0],
      business.location[1]
    )
  })).filter(b => b.distance <= checkInRadius).sort((a, b) => a.distance - b.distance);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 max-h-96 overflow-y-auto z-40">
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={24} className="text-blue-600" />
        <h3 className="text-xl font-bold">Közeli helyek</h3>
      </div>

      {businessesWithDistance.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle size={40} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nincs közeli hely a {(checkInRadius / 1000).toFixed(1)}km mezőn belül</p>
        </div>
      ) : (
        <div className="space-y-3">
          {businessesWithDistance.map(business => (
            <div
              key={business.id}
              className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border-2 border-transparent hover:border-blue-300"
            >
              <div className="flex-1">
                <h4 className="font-semibold">{business.name}</h4>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {business.category}
                  </span>
                  <span className="text-xs text-gray-600 px-2 py-1">
                    {(business.distance / 1000).toFixed(2)} km
                  </span>
                </div>
              </div>

              {checkedInId === business.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => onNotificationRequest(business.id)}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-semibold flex items-center gap-2 hover:bg-green-200 transition-all"
                  >
                    <Check size={16} />
                    Checked In
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onCheckIn(business.id);
                    setCheckedInId(business.id);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Check-in
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 text-center mt-4">
        💡 Check-in után automatikus értékelési értesítést fogsz kapni
      </p>
    </div>
  );
};
