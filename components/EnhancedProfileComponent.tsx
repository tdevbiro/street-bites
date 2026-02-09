import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { UserProfile } from '../types';

interface EnhancedProfileComponentProps {
  profile: UserProfile;
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => void;
  onClose: () => void;
}

export const EnhancedProfileComponent: React.FC<EnhancedProfileComponentProps> = ({
  profile,
  onUpdateProfile,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name,
    gender: profile.gender || '',
    circlePreference: profile.circlePreference || 'public',
    tastePreferences: profile.tastePreferences || []
  });

  const handleSaveProfile = () => {
    onUpdateProfile({
      name: formData.name,
      gender: formData.gender ? (formData.gender as 'male' | 'female') : undefined,
      circlePreference: formData.circlePreference as 'friends' | 'public' | 'hidden',
      tastePreferences: formData.tastePreferences
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File) => {
    // Mock upload - in real app would upload to storage
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdateProfile({
        profileImageUrl: e.target?.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const tasteOptions = ['Fűszeres', 'Vegetáriánus', 'Olcsó', 'Prémium', 'Gyors', 'Hibrid', 'Szushi', 'Pizza'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profilom</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Profile Image */}
        <div className="mb-6 text-center">
          <div className="relative inline-block">
            <img
              src={profile.profileImageUrl || 'https://via.placeholder.com/120?text=Profile'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
            />
            <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
              <Upload size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-xl font-bold text-blue-600">{profile.stats.visitedCount}</p>
            <p className="text-xs text-gray-600">Látogatás</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <p className="text-xl font-bold text-green-600">{profile.stats.reviewCount}</p>
            <p className="text-xs text-gray-600">Értékelés</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <p className="text-xl font-bold text-purple-600">{profile.passportStamps?.length || 0}</p>
            <p className="text-xs text-gray-600">Stamps</p>
          </div>
        </div>

        {/* Edit/View Mode */}
        {isEditing ? (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Név</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Gender - Optional */}
            <div>
              <label className="block text-sm font-semibold mb-2">Nemed (opcionális)</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="">Nem adja meg</option>
                <option value="male">Férfi</option>
                <option value="female">Nő</option>
              </select>
            </div>

            {/* Circle Preference */}
            <div>
              <label className="block text-sm font-semibold mb-2">Profil Láthatósága</label>
              <div className="space-y-2">
                {['public', 'friends', 'hidden'].map(pref => (
                  <label key={pref} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={pref}
                      checked={formData.circlePreference === pref}
                      onChange={(e) => setFormData({ ...formData, circlePreference: e.target.value as 'public' | 'friends' | 'hidden' })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">
                      {pref === 'public' ? '🌍 Nyilvános' : pref === 'friends' ? '👥 Barátok' : '🔒 Rejtett'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Taste Preferences */}
            <div>
              <label className="block text-sm font-semibold mb-2">Ízlés Preferenciák</label>
              <div className="grid grid-cols-2 gap-2">
                {tasteOptions.map(taste => (
                  <label
                    key={taste}
                    className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.tastePreferences.includes(taste)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.tastePreferences.includes(taste)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            tastePreferences: [...formData.tastePreferences, taste]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            tastePreferences: formData.tastePreferences.filter(t => t !== taste)
                          });
                        }
                      }}
                      className="mr-1"
                    />
                    {taste}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg"
              >
                Mentés
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
              >
                Mégse
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Név</p>
              <p className="text-lg font-semibold">{profile.name}</p>
            </div>

            {profile.gender && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Nem</p>
                <p className="text-lg font-semibold">{profile.gender === 'male' ? 'Férfi' : 'Nő'}</p>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Email</p>
              <p className="text-lg font-semibold break-all">{profile.email}</p>
            </div>

            {profile.tastePreferences.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Ízlés Preferenciák</p>
                <div className="flex gap-2 flex-wrap">
                  {profile.tastePreferences.map(taste => (
                    <span
                      key={taste}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      {taste}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg"
            >
              Profil Módosítása
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
