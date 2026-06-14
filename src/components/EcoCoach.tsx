import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle, 
  Zap, 
  ShieldAlert, 
  Car, 
  Lightbulb, 
  Apple, 
  ShoppingBag,
  ArrowRight,
  TrendingDown,
  Coins
} from 'lucide-react';
import { AIRecommendation, EmissionRecord } from '../types';
import { auth, isFirebaseReady } from '../firebase';

interface EcoCoachProps {
  emissions: EmissionRecord[];
}

export default function EcoCoach({ emissions }: EcoCoachProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRealAI, setIsRealAI] = useState(false);
  const [infoTip, setInfoTip] = useState<string | null>(null);

  // Read latest specs to personalize prompts
  const latestLog = emissions.length > 0 ? emissions[0] : {
    transportKm: 25,
    transportType: 'petrol_car',
    electricityKwh: 60,
    dietType: 'vegetarian',
    shoppingLevel: 'average'
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setInfoTip(null);
    try {
      let token = 'guest';
      if (isFirebaseReady && auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (tokenErr) {
          console.error('Error fetching auth token:', tokenErr);
        }
      }

      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transportKm: latestLog.transportKm,
          transportType: latestLog.transportType,
          electricityKwh: latestLog.electricityKwh,
          dietType: latestLog.dietType,
          shoppingLevel: latestLog.shoppingLevel,
        }),
      });

      const data = await res.json();
      if (res.status === 401) {
        setInfoTip(data.error || 'Unauthorized access. Please login again.');
        setRecommendations([]);
        return;
      }

      if (data.recommendations) {
        setRecommendations(data.recommendations);
        setIsRealAI(!!data.isRealAI);
        if (data.tip) {
          setInfoTip(data.tip);
        }
      }
    } catch (err) {
      console.error('Failed to pull AI recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [emissions]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport': return <Car className="w-5 h-5 text-sky-400" />;
      case 'electricity': return <Lightbulb className="w-5 h-5 text-yellow-400" />;
      case 'diet': return <Apple className="w-5 h-5 text-green-400" />;
      case 'shopping': return <ShoppingBag className="w-5 h-5 text-indigo-400" />;
      default: return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport': return 'hover:border-sky-500/20 shadow-sky-500/5 hover:shadow-sky-500/10';
      case 'electricity': return 'hover:border-yellow-500/20 shadow-yellow-500/5 hover:shadow-yellow-500/10';
      case 'diet': return 'hover:border-green-500/20 shadow-green-500/5 hover:shadow-green-500/10';
      case 'shopping': return 'hover:border-indigo-500/20 shadow-indigo-500/5 hover:shadow-indigo-500/10';
      default: return 'hover:border-emerald-500/20 shadow-emerald-500/5 hover:shadow-emerald-500/10';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10" id="coach-section">
      
      {/* Header section with fetch parameters */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-2">
              Gemini Powered AI Eco Coach <Sparkles className="w-4 h-4 text-emerald-400 animate-spin [animation-duration:15s]" />
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isRealAI ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-500'}`}>
              {isRealAI ? 'ACTIVE CHAT' : 'SMART SIMULATOR'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Real-time quantitative analysis computed over your latest footprint logging markers.</p>
        </div>
        
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-green-400 disabled:opacity-50 transition-all cursor-pointer self-stretch md:self-auto justify-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Advisor
        </button>
      </div>

      {infoTip && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] leading-relaxed font-mono flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{infoTip}</span>
        </div>
      )}

      {/* Main Grid View */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl text-center"
          >
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-t-2 border-green-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-b-2 border-emerald-300 animate-spin [animation-duration:1.5s]" />
              <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-green-400 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-slate-200 animate-pulse font-mono">Consulting Gemini Carbon Matrix...</p>
            <p className="text-[10px] text-gray-500 mt-1.5 font-mono">Differentiating transport thermal models & consumer life cycle loads</p>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {recommendations.map((rec, i) => (
              <motion.div
                key={rec.category + i}
                whileHover={{ y: -3, scale: 1.01 }}
                className={`p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all ${getCategoryTheme(rec.category)} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex xl:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        {getCategoryIcon(rec.category)}
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">
                        {rec.category} recommendation
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm md:text-base font-bold text-slate-100 mb-2 leading-snug">
                    {rec.headline}
                  </h3>

                  <div className="space-y-2.5 my-3 pb-4 border-b border-white/5">
                    <div className="text-[11px] text-gray-400">
                      <span className="text-gray-500 font-mono text-[9px] uppercase font-bold block mb-0.5">Static State:</span>
                      {rec.currentUsage}
                    </div>
                    <div className="text-[11px] text-green-300 flex items-start gap-1">
                      <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-green-400 shrink-0" />
                      <div>
                        <span className="text-green-500/80 font-mono text-[9px] uppercase font-bold block mb-0.5">Proposed Swap:</span>
                        {rec.actionableAlternative}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3 bg-[#07111a]/40 p-2.5 rounded-xl border border-white/5">
                    <div className="text-center">
                      <div className="flex justify-center gap-1 text-[10px] text-emerald-400 mb-0.5 font-bold font-mono">
                        <TrendingDown className="w-3.5 h-3.5" /> CO₂ SAVED
                      </div>
                      <span className="text-sm font-extrabold text-white font-mono">{rec.co2Savings} kg/yr</span>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center gap-1 text-[10px] text-amber-400 mb-0.5 font-bold font-mono">
                        <Coins className="w-3.5 h-3.5" /> MONEY SAVED
                      </div>
                      <span className="text-sm font-extrabold text-white font-mono">
                        {typeof rec.moneySavings === 'number' ? `₹${rec.moneySavings.toLocaleString()}` : rec.moneySavings}/yr
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 leading-normal italic">
                    {rec.impactText}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
