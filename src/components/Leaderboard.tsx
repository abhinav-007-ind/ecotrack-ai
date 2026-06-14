import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  MapPin, 
  Flame, 
  Search, 
  Trees, 
  Sparkles, 
  ArrowUpRight,
  TrendingDown,
  UserCheck
} from 'lucide-react';
import { LeaderboardEntry, UserProfile } from '../types';

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentProfile: UserProfile | null;
}

export default function Leaderboard({ leaderboard, currentProfile }: LeaderboardProps) {
  const [searchCity, setSearchRange] = useState('');

  // Handle city search filter
  const filteredLeaderboard = leaderboard.filter(user => 
    !searchCity || user.city.toLowerCase().includes(searchCity.toLowerCase())
  );

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return <span className="text-2xl" title="Carbon King Champion">🥇</span>;
      case 2: return <span className="text-2xl" title="Sub-Carbon Shield">🥈</span>;
      case 3: return <span className="text-2xl" title="Forest protector">🥉</span>;
      default: return <span className="font-mono text-gray-500 font-bold w-6 text-center">#{rank}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10" id="leaderboard-section">
      
      {/* Dynamic leader board summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="leaderboard-podiums">
        {leaderboard.slice(0, 3).map((item, index) => (
          <motion.div
            key={item.uid}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-5 rounded-2xl bg-white/5 border text-center relative overflow-hidden backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] ${index === 0 ? 'border-amber-500/30' : 'border-white/10'}`}
          >
            {index === 0 && (
              <div className="absolute top-0 right-0 p-2 text-amber-500 hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5 animate-pulse" />
              </div>
            )}
            <div className="text-3xl mb-2">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 text-xl border border-white/10">
              {item.avatarUrl || '🌱'}
            </div>
            <h4 className="font-bold text-slate-100 text-sm md:text-base truncate max-w-full">
              {item.displayName}
            </h4>
            <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-red-400" /> {item.city}
            </p>
            <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-center font-mono">
              <div>
                <p className="text-[8px] text-gray-500 uppercase font-black">Score</p>
                <p className="text-sm font-bold text-green-400">{item.greenScore}</p>
              </div>
              <div>
                <p className="text-[8px] text-gray-500 uppercase font-black">Planted</p>
                <p className="text-sm font-bold text-teal-400">{item.treesPlanted} 🌳</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search Filter and table list */}
      <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        
        {/* Table filter bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-100">Regional Environmental Rankings</h3>
            <p className="text-xs text-gray-400">Carbon footprints indexed by Green Scores and log consistency</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchRange(e.target.value)}
              className="w-full bg-[#07111a] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-gray-500 focus:outline-none focus:border-green-400"
              placeholder="Filter by city name (e.g., Paris)"
            />
          </div>
        </div>

        {/* List table */}
        <div className="overflow-hidden rounded-xl border border-white/5" id="leaderboard-table-view">
          <div className="grid grid-cols-12 bg-slate-950/40 p-3 text-[10px] uppercase font-bold text-gray-400 border-b border-white/5 font-mono text-center">
            <div className="col-span-2 sm:col-span-1 text-left pl-2">Rank</div>
            <div className="col-span-6 sm:col-span-5 text-left">User Profile</div>
            <div className="col-span-2 text-center">Streak</div>
            <div className="col-span-2 text-center">Total Offset</div>
            <div className="col-span-2 text-center">Green Index</div>
          </div>
          
          <div className="divide-y divide-white/5" id="leaderboard-scroll-items">
            {filteredLeaderboard.map((item, index) => {
              const isCurrentUser = currentProfile && item.uid === currentProfile.uid;
              return (
                <div 
                  key={item.uid}
                  className={`grid grid-cols-12 p-3.5 items-center text-center transition-all ${isCurrentUser ? 'bg-green-500/5 hover:bg-green-500/10' : 'bg-[#07111a]/20 hover:bg-[#07111a]/30'}`}
                >
                  <div className="col-span-2 sm:col-span-1 text-left pl-2 flex items-center">
                    {getRankBadge(index + 1)}
                  </div>
                  
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 text-left">
                    <div className="p-2 bg-white/5 rounded-xl border border-white/5 text-lg font-bold shrink-0">
                      {item.avatarUrl || '🌱'}
                    </div>
                    <div className="truncate">
                      <p className={`text-xs md:text-sm truncate flex items-center gap-1.5 ${isCurrentUser ? 'text-green-400 font-extrabold' : 'text-slate-100 font-medium'}`}>
                        {item.displayName}
                        {isCurrentUser && (
                          <span className="text-[8px] font-mono font-black uppercase text-slate-950 bg-green-400 px-1.5 py-0.5 rounded-full select-none">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {item.city}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-center gap-1.5 text-xs font-bold font-mono">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>{item.streak} days</span>
                  </div>

                  <div className="col-span-2 text-xs font-bold font-mono text-teal-400 flex items-center justify-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    <span>{item.totalSavings} kg/yr</span>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <span className={`text-xs font-extrabold font-mono px-3 py-1 rounded-lg border ${
                      item.greenScore >= 80 
                        ? 'bg-green-500/10 text-green-400 border-green-500/15' 
                        : item.greenScore >= 50 
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/15' 
                          : 'bg-red-500/10 text-red-400 border-red-500/15'
                    }`}>
                      {item.greenScore} pts
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredLeaderboard.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-500 font-mono">
                No active carbon profiles found registered in "{searchCity}".
              </div>
            )}
          </div>
        </div>

        {/* Gamified Motivation note */}
        <div className="mt-5 p-4 rounded-xl bg-green-500/5 border border-green-500/10 text-[11px] text-gray-400 leading-relaxed font-mono flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-spin [animation-duration:10s]" />
          <span>Combat carbon debt! Up your score under the <strong>Calculator</strong> and logging streak daily to climb past your regional climate competitors on the leaderboard.</span>
        </div>

      </div>

    </div>
  );
}
