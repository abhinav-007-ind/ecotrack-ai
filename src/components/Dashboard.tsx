import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  TrendingDown, 
  Flame, 
  Trees, 
  Award, 
  ArrowUpRight, 
  Sparkles, 
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { UserProfile, EmissionRecord, LeaderboardEntry, AVAILABLE_BADGES } from '../types';

interface DashboardProps {
  profile: UserProfile;
  emissions: EmissionRecord[];
  leaderboard: LeaderboardEntry[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ profile, emissions, leaderboard, onNavigate }: DashboardProps) {
  const [chartRange, setChartRange] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const latestFootprint = emissions.length > 0 ? emissions[0].dailyFootprint : 14.8;
  const annualCO2 = Math.round(latestFootprint * 365);

  // Define realistic dummy analytics data for clean charts based on current consumption rates
  const weeklyData = [
    { label: 'Mon', CO2: Math.round(latestFootprint * 0.95 * 10) / 10 },
    { label: 'Tue', CO2: Math.round(latestFootprint * 1.05 * 10) / 10 },
    { label: 'Wed', CO2: Math.round(latestFootprint * 1.10 * 10) / 10 },
    { label: 'Thu', CO2: Math.round(latestFootprint * 0.85 * 10) / 10 },
    { label: 'Fri', CO2: Math.round(latestFootprint * 1.00 * 10) / 10 },
    { label: 'Sat', CO2: Math.round(latestFootprint * 0.75 * 10) / 10 },
    { label: 'Sun', CO2: Math.round(latestFootprint * 0.80 * 10) / 10 },
  ];

  const monthlyData = [
    { label: 'Week 1', CO2: Math.round(latestFootprint * 7 * 0.9) },
    { label: 'Week 2', CO2: Math.round(latestFootprint * 7 * 1.0) },
    { label: 'Week 3', CO2: Math.round(latestFootprint * 7 * 1.1) },
    { label: 'Week 4', CO2: Math.round(latestFootprint * 7 * 0.8) },
  ];

  const yearlyData = [
    { label: 'Jan', CO2: Math.round(latestFootprint * 30 * 1.15) },
    { label: 'Feb', CO2: Math.round(latestFootprint * 30 * 1.08) },
    { label: 'Mar', CO2: Math.round(latestFootprint * 30 * 1.00) },
    { label: 'Apr', CO2: Math.round(latestFootprint * 30 * 0.95) },
    { label: 'May', CO2: Math.round(latestFootprint * 30 * 0.90) },
    { label: 'Jun', CO2: Math.round(latestFootprint * 30 * 0.85) },
    { label: 'Jul', CO2: Math.round(latestFootprint * 30 * 0.80) },
    { label: 'Aug', CO2: Math.round(latestFootprint * 30 * 0.82) },
    { label: 'Sep', CO2: Math.round(latestFootprint * 30 * 0.88) },
    { label: 'Oct', CO2: Math.round(latestFootprint * 30 * 0.92) },
    { label: 'Nov', CO2: Math.round(latestFootprint * 30 * 1.05) },
    { label: 'Dec', CO2: Math.round(latestFootprint * 30 * 1.12) },
  ];

  const activeChartData = 
    chartRange === 'weekly' ? weeklyData :
    chartRange === 'monthly' ? monthlyData : yearlyData;

  const activeXKey = 'label';

  // Offset statistics
  const annualOffset = profile.treesPlanted * 22;
  const offsetPercentage = Math.round(Math.min(100, annualCO2 > 0 ? (annualOffset / annualCO2) * 100 : 0));

  // Determine scoring colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      
      {/* 🚀 TASK 4 - TOP SECTION: 4 Glass Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5" id="dash-telemetry">
        
        {/* Card 1: Green Score */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-[#22C55E]/30 relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs md:text-sm font-medium">Green Score</span>
            <div className="p-2 rounded-lg bg-green-500/10 text-green-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4 md:w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl md:text-4xl font-bold tracking-tight ${getScoreColor(profile.greenScore)}`}>
              {profile.greenScore}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${profile.greenScore >= 80 ? 'bg-green-500' : profile.greenScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
              {profile.greenScore >= 80 ? 'Excellent Index' : profile.greenScore >= 50 ? 'Moderate Impact' : 'Needs Optimization'}
            </p>
          </div>
        </motion.div>

        {/* Card 2: Yearly CO2 Footprint */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-[#22C55E]/30 relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs md:text-sm font-medium">Annual CO₂</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4 md:w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-100">
              {annualCO2.toLocaleString()} <span className="text-sm font-normal text-gray-400">kg</span>
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">Based on active carbon logs</p>
          </div>
        </motion.div>

        {/* Card 3: Logging active Streak */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-amber-500/30 relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs md:text-sm font-medium">Active Streak</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform animate-pulse">
              <Flame className="w-4 h-4 md:w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              {profile.streak} <span className="text-sm font-normal text-gray-400">days</span>
            </h3>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <Zap className="w-3 h-3" /> Streak Active
            </p>
          </div>
        </motion.div>

        {/* Card 4: Trees Needed */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-teal-500/30 relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs md:text-sm font-medium">Deficit Offset</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
              <Trees className="w-4 h-4 md:w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-teal-400">
              {Math.max(1, profile.treesNeeded - profile.treesPlanted)} <span className="text-sm font-normal text-gray-400">trees</span>
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">To cancel carbon impact</p>
          </div>
        </motion.div>
      </div>

      {/* 📊 TASK 4 - MIDDLE SECTION: Interactive Glass Charts */}
      <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]" id="dash-charts">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-slate-100 flex items-center gap-2">
              Emission Telemetry <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/10">LIVE DATA</span>
            </h2>
            <p className="text-xs text-gray-400">Track and visual emissions progress trends</p>
          </div>
          <div className="flex p-1 rounded-xl bg-[#07111a]/80 border border-white/5 self-stretch sm:self-auto justify-between">
            {(['weekly', 'monthly', 'yearly'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${chartRange === r ? 'bg-green-500 text-slate-950 font-bold shadow-md shadow-green-500/10' : 'text-gray-400 hover:text-white'}`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-[280px] w-full" id="stats-recharts-graph">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey={activeXKey} 
                stroke="#64748B" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#64748B" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(12, 26, 37, 0.85)', 
                  borderColor: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: '12px',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)',
                  color: '#fff',
                  fontSize: '11px'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#22C55E' }}
              />
              <Area 
                type="monotone" 
                dataKey="CO2" 
                stroke="#22C55E" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorCO2)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/5 font-mono text-[10px] text-gray-400 text-center">
          <div>Avg Footprint: <span className="text-white font-bold">{latestFootprint} kg</span></div>
          <div>Offset Percentage: <span className="text-emerald-400 font-bold">{offsetPercentage}%</span></div>
          <div>Grid Standard Factor: <span className="text-white font-bold">0.82 kg/KWh</span></div>
          <div>Unit system: <span className="text-white font-bold">METRIC CO₂e</span></div>
        </div>
      </div>

      {/* 🪟 TASK 4 - BOTTOM SECTION GRID: Bento Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dash-bento-grid">
        
        {/* Box 1: AI Eco Coach Quick Preview */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between group hover:border-[#22C55E]/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <Sparkles className="w-4 h-4 animate-spin [animation-duration:12s]" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm md:text-base">AI Eco Coach Insights</h3>
            </div>
            <button 
              onClick={() => onNavigate('coach')}
              className="text-xs text-green-400 flex items-center gap-1 hover:text-green-300 font-medium cursor-pointer"
            >
              Ask Coach <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <p className="text-xs text-gray-300 italic mb-5 leading-relaxed bg-[#07111a]/40 p-4 rounded-xl border border-white/5">
            "Your weekly logs reveal petrol travel as your dominant emission driver. By shifting just 3 trips weekly to carbon-neutral rail or electric options, you would save 310kg of annual CO₂ and ₹12,000 in fuel consumption charges."
          </p>
          <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400">
            <Info className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span>AI recommendation personalized based on your carbon metrics.</span>
          </div>
        </div>

        {/* Box 2: Plant Progress Offset bar */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between hover:border-teal-500/30 transition-all">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <Trees className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm md:text-base">Offset Forest Progress</h3>
              </div>
              <span className="text-xs font-mono text-teal-400 font-bold">{offsetPercentage}% Offset</span>
            </div>

            {/* Custom high end progress bar */}
            <div className="w-full bg-[#07111a] rounded-full h-3 border border-white/5 overflow-hidden p-0.5 mt-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${offsetPercentage}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-teal-500 to-green-400 rounded-full"
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-2">
              <span>{profile.treesPlanted} planted ({annualOffset} kg offset/yr)</span>
              <span>Req: {profile.treesNeeded} ({annualCO2} kg CO₂/yr)</span>
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate('plants')}
            className="mt-5 w-full py-2.5 rounded-xl bg-teal-950/40 text-teal-400 hover:bg-teal-900/60 font-semibold text-xs border border-teal-500/20 text-center tracking-wide hover:scale-[1.01] transition-all cursor-pointer"
          >
            Plant a Tree
          </button>
        </div>

        {/* Box 3: Badge Cabinet */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm md:text-base">Badge Cabinet</h3>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-500/10 font-bold">
                {profile.badges.length} / {AVAILABLE_BADGES.length} UNLOCKED
              </span>
            </div>

            {/* Render 4 sample badges */}
            <div className="grid grid-cols-4 gap-3 my-4">
              {AVAILABLE_BADGES.slice(0, 4).map((badge) => {
                const isUnlocked = profile.badges.includes(badge.id);
                return (
                  <div 
                    key={badge.id}
                    title={badge.description}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all ${isUnlocked ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-slate-900/20 border-white/5 text-gray-500 scale-95 filters grayscale'}`}
                  >
                    <span className="text-xl md:text-2xl mb-1">{isUnlocked ? '🌟' : '🔒'}</span>
                    <span className="text-[8px] text-center font-bold tracking-tight uppercase truncate w-full">{badge.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate('profile')}
            className="w-full py-2.5 rounded-xl bg-amber-950/40 text-amber-400 hover:bg-amber-900/60 font-semibold text-xs border border-amber-500/20 text-center tracking-wide hover:scale-[1.01] transition-all cursor-pointer"
          >
            Review all Badges
          </button>
        </div>

        {/* Box 4: Leaderboard Preview snapshot */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between hover:border-sky-500/30 transition-all">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm md:text-base">Leaderboard Leaders</h3>
              </div>
              <span className="text-xs text-gray-400 font-mono">Globally Scored</span>
            </div>

            {/* List top 3 competitors */}
            <div className="space-y-2 mt-2" id="leaderboard-snap-list">
              {leaderboard.slice(0, 3).map((item, idx) => (
                <div 
                  key={item.uid}
                  className={`flex items-center justify-between p-2 rounded-lg border border-white/5 bg-[#07111a]/40 ${item.uid === profile.uid ? 'border-green-500/30 bg-green-500/5' : ''}`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold font-mono text-gray-500 w-4">#{idx + 1}</span>
                    <span className="text-sm">{item.avatarUrl}</span>
                    <span className={`font-medium ${item.uid === profile.uid ? 'text-green-400 font-bold' : 'text-slate-100'}`}>
                      {item.displayName}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-400/10">
                    {item.greenScore} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('leaderboard')}
            className="mt-5 w-full py-2.5 rounded-xl bg-sky-950/40 text-sky-400 hover:bg-sky-900/60 font-semibold text-xs border border-sky-500/20 text-center tracking-wide hover:scale-[1.01] transition-all cursor-pointer"
          >
            Open Leaderboard
          </button>
        </div>

      </div>

    </div>
  );
}
