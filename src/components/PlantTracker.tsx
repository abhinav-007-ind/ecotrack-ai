import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trees, 
  Sprout, 
  Plus, 
  TrendingDown, 
  Heart, 
  Info,
  Award,
  Compass,
  ArrowRight
} from 'lucide-react';
import { PlantingRecord, UserProfile } from '../types';

interface PlantTrackerProps {
  userId: string;
  profile: UserProfile;
  plantedTrees: PlantingRecord[];
  onPlantTree: (species: string) => Promise<void>;
  onNavigate: (tab: string) => void;
}

const TREE_SPECIES = [
  { name: 'Sacred Neem', offsetRate: 22, description: 'Neem is a rapid pollution cleaner, filtering ambient air toxic particulates.', icon: '🌿' },
  { name: 'Great Banyan', offsetRate: 26, description: 'A massive carbon sink with massive foliage coverage offering extreme local cooling.', icon: '🌳' },
  { name: 'Bustling Bamboo', offsetRate: 18, description: 'Speeds up absorption 30% faster than standard woods; rapid biomass multiplier.', icon: '🎋' },
  { name: 'Hardy Teak', offsetRate: 24, description: 'High wood-density tree ensuring robust permanent carbon sequestration.', icon: '🌲' },
  { name: 'Suhana Mango', offsetRate: 20, description: 'Provides double benefits of food nourishment and dense carbon capture.', icon: '🥭' }
];

export default function PlantTracker({ userId, profile, plantedTrees, onPlantTree, onNavigate }: PlantTrackerProps) {
  const [selectedSpecies, setSelectedSpecies] = useState('Sacred Neem');
  const [planting, setPlanting] = useState(false);

  // Math
  const latestDailyFootprint = profile.treesNeeded > 0 ? (profile.treesNeeded * 22) / 365 : 14.8;
  const annualCarbonDebt = Math.round(latestDailyFootprint * 365);
  const annualOffset = plantedTrees.length * 22; // 22kg per tree estimation
  const offsetPercentage = Math.round(Math.min(100, annualCarbonDebt > 0 ? (annualOffset / annualCarbonDebt) * 100 : 0));

  const handlePlant = async () => {
    setPlanting(true);
    // Add cool slow visual delay so user feels the visual reward
    setTimeout(async () => {
      try {
        await onPlantTree(selectedSpecies);
      } catch (err) {
        console.error(err);
      } finally {
        setPlanting(false);
      }
    }, 1200);
  };

  const getStageBadgeColor = (status: string) => {
    switch (status) {
      case 'mature': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10';
      case 'growing': return 'bg-teal-500/10 text-teal-400 border-teal-500/10';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/10';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10" id="plant-tracker-section">
      
      {/* 🚀 TASK 8 - Offset progress header and visual progress bars */}
      <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
              <Trees className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-100">Annual Offset Forest</h2>
              <p className="text-xs text-gray-400">Target carbon footprint neutralization progress stats</p>
            </div>
          </div>
          <span className="text-xl font-black font-mono text-teal-400 bg-teal-500/10 px-4 py-2 rounded-xl border border-teal-500/10 shadow-lg shadow-teal-500/5">
            {offsetPercentage}% Net-Zero
          </span>
        </div>

        {/* Deluxe progress offset bar */}
        <div className="w-full bg-[#07111a] rounded-full h-4 border border-white/5 p-0.5 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${offsetPercentage}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-teal-500 via-[#22C55E] to-[#4ADE80] rounded-full shadow-[0_0_12px_rgba(34,197,94,0.3)]"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/5 text-center font-mono text-xs">
          <div>
            <p className="text-gray-500 uppercase font-black text-[9px]">Forest Planted</p>
            <p className="text-lg font-bold text-white mt-0.5">{profile.treesPlanted} / {profile.treesNeeded} trees</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase font-black text-[9px]">Active Absorption</p>
            <p className="text-lg font-bold text-teal-300 mt-0.5">{annualOffset.toLocaleString()} kg CO₂/yr</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-gray-500 uppercase font-black text-[9px]">Annual Footprint</p>
            <p className="text-lg font-bold text-rose-400 mt-0.5">{annualCarbonDebt.toLocaleString()} kg CO₂/yr</p>
          </div>
        </div>
      </div>

      {/* Main double column interface */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left column: Tree Planter form */}
        <div className="md:col-span-5 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5 mb-2">
              <Sprout className="w-4 h-4 text-green-400 shrink-0" /> Plant a New Tree
            </h3>
            <p className="text-xs text-gray-400 leading-normal mb-5">
              Select an indigenous tree breed. Planting trees draws down carbon from the skies, converting gas into solid leaves and dense root complexes over decades.
            </p>

            <div className="space-y-4">
              <label className="block text-xs font-semibold text-gray-300 uppercase font-mono tracking-wider">Choose Indigenous Breed</label>
              
              <div className="space-y-2.5">
                {TREE_SPECIES.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedSpecies(item.name)}
                    className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${selectedSpecies === item.name ? 'bg-teal-500/10 border-teal-400 text-teal-300' : 'bg-[#07111a]/40 border-white/5 text-gray-300 hover:bg-[#07111a]/85'}`}
                  >
                    <span className="text-2xl mt-0.5">{item.icon}</span>
                    <div className="truncate">
                      <div className="flex justify-between items-center pr-1">
                        <span className="text-xs font-bold">{item.name}</span>
                        <span className="text-[10px] font-mono font-bold text-teal-400">-{item.offsetRate} kg/yr</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate leading-relaxed mt-0.5">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handlePlant}
            disabled={planting}
            className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-green-500 text-slate-900 font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-lg hover:shadow-teal-500/10 cursor-pointer disabled:opacity-50 transition-all font-mono"
          >
            {planting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                DIGGING GREEN SOIL...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                PLANT VIRTUAL FOREST PLOT <Plus className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>

        {/* Right column: Planting history logs */}
        <div className="md:col-span-7 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal-400 shrink-0" /> Forest Logs ({plantedTrees.length})
              </h3>
              <span className="text-[10px] font-mono text-gray-400">Sequestration Statuses</span>
            </div>

            <div className="max-h-[340px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin" id="forest-logs-scroller">
              {plantedTrees.map((tree) => (
                <div 
                  key={tree.id}
                  className="p-3.5 rounded-xl border border-white/5 bg-[#07111a]/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl select-none">
                      {tree.treeSpecies.includes('Neem') ? '🌿' : 
                       tree.treeSpecies.includes('Banyan') ? '🌳' : 
                       tree.treeSpecies.includes('Bamboo') ? '🎋' : 
                       tree.treeSpecies.includes('Teak') ? '🌲' : '🥭'}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{tree.treeSpecies}</h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        Planted: {new Date(tree.datePlanted).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] uppercase font-black px-2.5 py-1 rounded-full border ${getStageBadgeColor(tree.status)}`}>
                      🌱 {tree.status}
                    </span>
                    <p className="text-[10px] text-teal-400 font-mono font-bold mt-1.5">-{tree.offsetValue} kg/yr</p>
                  </div>
                </div>
              ))}

              {plantedTrees.length === 0 && (
                <div className="p-12 text-center text-xs text-gray-500 font-mono flex flex-col items-center justify-center gap-3">
                  <Sprout className="w-12 h-12 text-teal-500/20 shrink-0" />
                  <div>
                    <p>No carbon-sequestration trees logged in your record yet.</p>
                    <p className="text-[10px] text-gray-600 mt-1">Configure your species choice on the left parameters box to plant your first seed!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-teal-500/5 border border-teal-500/10 text-[10px] text-gray-400 leading-normal font-mono flex items-start gap-2.5">
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>Trees absorb carbon from root networks into trunk cellulose, preserving atmospheric balance indefinitely. We partner with local agro-forestry teams to sponsor physical saplings.</span>
          </div>
        </div>

      </div>

    </div>
  );
}

// Simple fast refresh spinner helper
function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
