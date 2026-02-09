import React, { useState } from 'react';
import { X, Send, Plus, Trash2, Users, Clock } from 'lucide-react';
import { Company, DriverInvitation } from '../types';

interface FleetManagerComponentProps {
  company: Company;
  onInviteDriver: (email: string) => void;
  onRemoveDriver: (driverId: string) => void;
  onAcceptInvite: (inviteId: string) => void;
  pendingInvites: DriverInvitation[];
  onClose: () => void;
}

export const FleetManagerComponent: React.FC<FleetManagerComponentProps> = ({
  company,
  onInviteDriver,
  onRemoveDriver,
  // Fleet manager functionality - no onAcceptInvite needed in this version
  pendingInvites,
  onClose
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleInviteDriver = async () => {
    if (!inviteEmail.trim()) {
      alert('Kérjük, adjon meg egy email címet!');
      return;
    }
    setIsInviting(true);
    try {
      onInviteDriver(inviteEmail);
      setInviteEmail('');
      alert('Meghívás elküldte!');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Flotta Kezelés</h2>
            <p className="text-sm text-gray-600">{company.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Invite Section */}
        <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Plus size={20} />
            Sofőr Meghívása
          </h3>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="sofőr@email.com"
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
            />
            <button
              onClick={handleInviteDriver}
              disabled={isInviting || !inviteEmail.trim()}
              className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                isInviting || !inviteEmail.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock size={20} />
              Függőben Lévő Meghívások ({pendingInvites.length})
            </h3>
            <div className="space-y-3">
              {pendingInvites.map(invite => (
                <div
                  key={invite.id}
                  className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{invite.email}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Meghívva: {new Date(invite.createdAt).toLocaleDateString('hu-HU')}
                      </p>
                    </div>
                    <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Függőben
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Drivers */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={20} />
            Aktív Sofőrök ({company.drivers?.length || 0})
          </h3>
          {company.drivers && company.drivers.length > 0 ? (
            <div className="space-y-3">
              {company.drivers.map(driver => (
                <div
                  key={driver.id}
                  className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{driver.name}</h4>
                      {driver.fullName && (
                        <p className="text-sm text-gray-600">{driver.fullName}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            driver.status === 'online'
                              ? 'bg-green-200 text-green-800'
                              : driver.status === 'offline'
                              ? 'bg-gray-200 text-gray-800'
                              : driver.status === 'on-delivery'
                              ? 'bg-blue-200 text-blue-800'
                              : 'bg-orange-200 text-orange-800'
                          }`}
                        >
                          {driver.status === 'online'
                            ? '🟢 Online'
                            : driver.status === 'offline'
                            ? '⚫ Offline'
                            : driver.status === 'on-delivery'
                            ? '📦 Szállítás'
                            : '⏸️ Szünet'}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            driver.aiMode === 'online'
                              ? 'bg-purple-200 text-purple-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {driver.aiMode === 'online' ? '🤖 Online AI' : '📱 Offline'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveDriver(driver.id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {driver.email && (
                    <p className="text-xs text-gray-600">{driver.email}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Users size={40} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nincsenek aktív sofőrök</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
