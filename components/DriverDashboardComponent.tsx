import React, { useState } from 'react';
import { X, Bot, Navigation2, MapPin } from 'lucide-react';
import { DriverProfile, ScheduledLocation } from '../types';

interface DriverDashboardComponentProps {
  driver: DriverProfile;
  assigAIMode: (mode: 'online' | 'offline') => void;
  onClose: () => void;
  scheduledLocations?: ScheduledLocation[];
}

export const DriverDashboardComponent: React.FC<DriverDashboardComponentProps> = ({
  driver,
  assigAIMode,
  onClose,
  scheduledLocations = []
}) => {
  const [aiMode, setAiMode] = useState<'online' | 'offline'>(driver.aiMode || 'offline');

  const handleAiModeChange = (mode: 'online' | 'offline') => {
    setAiMode(mode);
    assigAIMode(mode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">{driver.name}</h2>
            <p className="text-sm text-gray-600">Sofőr Dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
          <div className="text-center">
            <div
              className={`w-6 h-6 rounded-full mx-auto mb-3 ${
                driver.status === 'online'
                  ? 'bg-green-500'
                  : driver.status === 'offline'
                  ? 'bg-gray-500'
                  : driver.status === 'on-delivery'
                  ? 'bg-blue-500'
                  : 'bg-orange-500'
              }`}
            />
            <p className="font-semibold text-lg mb-1">
              {driver.status === 'online'
                ? '🟢 Online'
                : driver.status === 'offline'
                ? '⚫ Offline'
                : driver.status === 'on-delivery'
                ? '📦 Szállítás módban'
                : '⏸️ Szünet'}
            </p>
            {driver.location && (
              <p className="text-xs text-gray-600">
                Hely: {driver.location[0].toFixed(4)}, {driver.location[1].toFixed(4)}
              </p>
            )}
          </div>
        </div>

        {/* AI Mode Toggle */}
        <div className="mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bot size={20} />
            AI Mód Beállítás
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAiModeChange('online')}
              className={`p-4 rounded-2xl font-semibold transition-all border-2 ${
                aiMode === 'online'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
              }`}
            >
              <div className="text-2xl mb-2">🤖</div>
              <p className="text-sm">Online AI</p>
              <p className="text-xs mt-1 opacity-75">Cloud alapú</p>
            </button>

            <button
              onClick={() => handleAiModeChange('offline')}
              className={`p-4 rounded-2xl font-semibold transition-all border-2 ${
                aiMode === 'offline'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="text-2xl mb-2">📱</div>
              <p className="text-sm">Offline Mód</p>
              <p className="text-xs mt-1 opacity-75">Helyi feldolgozás</p>
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            {aiMode === 'online'
              ? '✓ Online AI: Intenet szükséges, magasabb pontosság'
              : '✓ Offline Mód: Működik internet nélkül, helyi feldolgozás'}
          </p>
        </div>

        {/* Route Information */}
        {scheduledLocations && scheduledLocations.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Navigation2 size={20} />
              Napi Útvonal
            </h3>
            <div className="space-y-3">
              {scheduledLocations.map((location, idx) => (
                <div
                  key={location.id}
                  className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-l-4 border-green-500"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        <span className="text-2xl">{idx + 1}</span>
                        {location.locationName}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                        <MapPin size={14} />
                        {location.address}
                      </p>
                    </div>
                    <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {location.startTime} - {location.endTime}
                    </span>
                  </div>
                  {location.attendees && location.attendees.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      👥 {location.attendees.length} ember fog jelen lenni
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Driver Info */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Profil Adatok</h3>
          <div className="space-y-3">
            {driver.fullName && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Teljes Név</p>
                <p className="font-semibold">{driver.fullName}</p>
              </div>
            )}
            {driver.email && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Email</p>
                <p className="font-semibold break-all">{driver.email}</p>
              </div>
            )}
            {driver.phone && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Telefonszám</p>
                <p className="font-semibold">{driver.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Exit */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-semibold hover:shadow-lg"
        >
          Bezárás
        </button>
      </div>
    </div>
  );
};
