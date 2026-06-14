import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  MapPin, 
  Flame, 
  Sprout, 
  ShieldCheck, 
  TrendingDown, 
  User, 
  Check, 
  Save,
  MessageSquareOff,
  Sparkles,
  Leaf
} from 'lucide-react';
import { UserProfile, AVAILABLE_BADGES, Badge } from '../types';

interface ProfileProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
}

const AVATAR_OPTIONS = ['🌱', '🌍', '🐼', '🦊', '🐨', '🐝', '🦁', '🌿', '🍂', '🍄'];

export default function Profile({ profile, onUpdateProfile }: ProfileProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [city, setCity] = useState(profile.city);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await onUpdateProfile({
        displayName,
        bio,
        city,
        avatarUrl: selectedAvatar
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10" id="profile-container">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Card: Gamification details */}
        <div className="md:col-span-5 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-center flex flex-col justify-between">
          <div>
            <div className="relative w-20 h-24 mx-auto mb-3">
              <div className="w-20 h-20 bg-slate-950/40 rounded-full flex items-center justify-center font-bold text-4xl border border-white/10 shrink-0">
                {selectedAvatar}
              </div>
              <div className="absolute right-0 bottom-3 p-1.5 rounded-full bg-emerald-500 border border-slate-900 shadow text-slate-900">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-100">{displayName || 'Eco Pioneer'}</h3>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{profile.email}</p>
            <p className="text-xs text-gray-400 mt-3 italic leading-relaxed px-2 bg-[#07111a]/40 py-2.5 rounded-xl border border-white/5">
              "{bio || 'Exploring micro carbon adjustments to build a happier, cooler planet.'}"
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5 font-mono text-xs">
              <div className="p-3 bg-[#07111a]/40 rounded-xl border border-white/5">
                <div className="flex justify-center text-amber-500 mb-1"><Flame className="w-4 h-4 fill-amber-500" /></div>
                <p className="text-[8px] text-gray-500 uppercase font-black">Day Streak</p>
                <p className="text-sm font-bold text-white mt-0.5">{profile.streak} days</p>
              </div>
              <div className="p-3 bg-[#07111a]/40 rounded-xl border border-white/5">
                <div className="flex justify-center text-teal-400 mb-1"><Sprout className="w-4 h-4" /></div>
                <p className="text-[8px] text-gray-500 uppercase font-black">Forest Saplings</p>
                <p className="text-sm font-bold text-teal-400 mt-0.5">{profile.treesPlanted} planted</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 font-mono text-[10px] text-gray-400">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Currently protecting: <strong>{city}</strong></span>
          </div>
        </div>

        {/* Right Form: Settings */}
        <form onSubmit={handleSave} className="md:col-span-7 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-1.5 pb-3 border-b border-white/5">
              <User className="w-4 h-4 text-green-400 shrink-0" /> Edit Climate Profile
            </h3>

            {/* Selected Avatar choice */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase font-mono tracking-wider mb-2">Configure Eco Avatar</label>
              <div className="flex flex-wrap gap-2.5 bg-[#07111a]/40 p-3 rounded-xl border border-white/5">
                {AVATAR_OPTIONS.map(avi => (
                  <button
                    key={avi}
                    type="button"
                    onClick={() => setSelectedAvatar(avi)}
                    className={`w-9 h-9 flex items-center justify-center text-xl rounded-lg cursor-pointer transition-all ${selectedAvatar === avi ? 'bg-green-500/10 border-2 border-green-500' : 'bg-transparent border border-white/5 hover:bg-white/5'}`}
                  >
                    {avi}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="displayName" className="block text-xs font-semibold text-gray-300 uppercase font-mono tracking-wider mb-1">Friendly Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#07111a] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-green-400"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-xs font-semibold text-gray-300 uppercase font-mono tracking-wider mb-1">Target Base City</label>
                <input
                  id="city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#07111a] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-green-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-xs font-semibold text-gray-300 uppercase font-mono tracking-wider mb-1">Personal Environmental Bio</label>
              <textarea
                id="bio"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#07111a] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-green-400"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              {savedSuccess && <span className="flex items-center gap-1 text-green-400"><Check className="w-3.5 h-3.5" /> Profile successfully saved!</span>}
            </span>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all cursor-pointer font-mono"
            >
              <Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </form>

      </div>

      {/* 🏅 TASK 9 - FULL BADGE SHOWCASE SECTION */}
      <div className="p-5 md:p-6 rounded-2xl bg-[#0c1a25]/50 backdrop-blur-[24px] border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Climate Award Cabinet
            </h3>
            <p className="text-xs text-gray-400">Unlock these gamified badges of sustainability across EcoTrack AI tasks</p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-500/10 font-bold">
            {profile.badges.length} Unlocked
          </span>
        </div>

        {/* Full Interactive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="badges-cabinet-grid">
          {AVAILABLE_BADGES.map((badge) => {
            const isUnlocked = profile.badges.includes(badge.id);
            return (
              <motion.div 
                key={badge.id}
                whileHover={isUnlocked ? { scale: 1.02 } : {}}
                className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                  isUnlocked 
                    ? 'bg-amber-500/5 border-amber-500/20 text-slate-200' 
                    : 'bg-[#07111a]/20 border-white/5 text-gray-500 scale-95 opacity-65'
                }`}
              >
                <div className={`p-3 rounded-xl text-2xl flex items-center justify-center shrink-0 shadow-lg ${isUnlocked ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' : 'bg-slate-900/40 text-gray-600 border border-white/5'}`}>
                  {isUnlocked ? (
                    badge.id === 'first_calculation' ? '🌍' :
                    badge.id === 'green_score_90' ? '🥷' :
                    badge.id === 'streak_3' ? '🔥' :
                    badge.id === 'first_tree' ? '🌱' :
                    badge.id === 'offset_50' ? '🛡️' : '🌳'
                  ) : '🔒'}
                </div>

                <div className="truncate">
                  <h4 className={`text-xs font-bold leading-none flex items-center gap-2 ${isUnlocked ? 'text-amber-400' : 'text-gray-500'}`}>
                    {badge.title}
                    {isUnlocked && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  </h4>
                  <p className="text-[10px] leading-relaxed mt-1 whitespace-normal">{badge.description}</p>
                  <p className="text-[9px] font-mono font-bold text-gray-500 mt-1 uppercase">Goal: {badge.criteria}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
