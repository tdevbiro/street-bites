import React from 'react';
import { X, MapPin, Star } from 'lucide-react';
import { StreetPassportStamp } from '../types';

interface StreetPassportComponentProps {
  stamps: StreetPassportStamp[];
  onClose: () => void;
  userName: string;
}

export const StreetPassportComponent: React.FC<StreetPassportComponentProps> = ({
  stamps,
  onClose,
  userName
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Street Passport</h2>
            <p className="text-gray-600 text-sm">{userName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl text-center">
            <p className="text-2xl font-bold text-blue-600">{stamps.length}</p>
            <p className="text-xs text-gray-600">Meglátogatott hely</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.round(stamps.reduce((acc, s) => acc + s.visitCount, 0) / stamps.length || 0)}
            </p>
            <p className="text-xs text-gray-600">Átlag látogat.</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-2xl text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {(stamps.reduce((acc, s) => acc + s.rating, 0) / stamps.length).toFixed(1)}
            </p>
            <p className="text-xs text-gray-600">Átlag értékelés</p>
          </div>
        </div>

        {/* Stamps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {stamps.map((stamp) => (
            <div
              key={stamp.id}
              className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              {/* Logo Background */}
              <img
                src={stamp.businessLogo}
                alt={stamp.businessName}
                className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col items-end justify-end p-3">
                <div className="bg-white bg-opacity-95 rounded-xl p-2 w-full">
                  <h3 className="font-semibold text-sm truncate">{stamp.businessName}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={
                            i < Math.round(stamp.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 ml-1">
                      {stamp.visitCount}x
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(stamp.lastVisited).toLocaleDateString('hu-HU')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stamps.length === 0 && (
          <div className="text-center py-12">
            <MapPin size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Még nincs meglátogatott hely</p>
            <p className="text-sm text-gray-400">
              Check-in a helyeken az App-ban a stamps gyűjtéséhez!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
