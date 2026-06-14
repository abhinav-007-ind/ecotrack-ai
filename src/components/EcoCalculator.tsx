import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Car, 
  Lightbulb, 
  Apple, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Trees, 
  ShieldAlert,
  HelpCircle,
  Clock,
  Calendar,
  Sparkles
} from 'lucide-react';
import { TRANSPORT_FACTORS, DIET_FACTORS, SHOPPING_FACTORS, calculateDailyFootprint, getGreenScore, calculateTreesNeeded } from '../utils/carbonCalculator';

interface EcoCalculatorProps {
  userId: string;
  onLogEmissions: (record: {
    transportKm: number;
    transportType: string;
    electricityKwh: number;
    dietType: string;
    shoppingLevel: string;
    dailyFootprint: number;
  }) => Promise<void>;
  onNavigate: (tab: string) => void;
}

export default function EcoCalculator({ userId, onLogEmissions, onNavigate }: EcoCalculatorProps) {
  const [step, setStep] = useState(1);
  const [transportType, setTransportType] = useState('petrol_car');
  const [transportKm, setTransportKm] = useState('');
  const [electricityKwh, setElectricityKwh] = useState('');
  const [dietType, setDietType] = useState('vegetarian');
  const [shoppingLevel, setShoppingLevel] = useState('average');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    treesNeeded: number;
    greenScore: number;
  } | null>(null);

  // Validation
  const [errors, setErrors] = useState<{ km?: string; electricity?: string }>({});

  const validateStep = (currentStep: number) => {
    let valid = true;
    const newErrors: typeof errors = {};

    if (currentStep === 1) {
      if (transportKm.trim() === '') {
        newErrors.km = 'Enter the detail: Please specify your daily travel distance.';
        valid = false;
      } else {
        const numKm = Number(transportKm);
        if (isNaN(numKm) || numKm < 0 || numKm > 500) {
          newErrors.km = 'Please enter a valid daily distance between 0 and 500 km.';
          valid = false;
        }
      }
    } else if (currentStep === 2) {
      if (electricityKwh.trim() === '') {
        newErrors.electricity = 'Enter the detail: Please specify your weekly electricity consumption.';
        valid = false;
      } else {
        const numElec = Number(electricityKwh);
        if (isNaN(numElec) || numElec < 0 || numElec > 1000) {
          newErrors.electricity = 'Please enter a valid weekly consumption between 0 and 1,000 kWh.';
          valid = false;
        }
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    try {
      const calculatedDaily = calculateDailyFootprint({
        transportKm: Number(transportKm),
        transportType,
        electricityKwh: Number(electricityKwh),
        dietType,
        shoppingLevel,
      });

      const weekly = Number((calculatedDaily * 7).toFixed(1));
      const monthly = Number((calculatedDaily * 30).toFixed(1));
      const yearly = Number((calculatedDaily * 365).toFixed(1));
      const treesNeeded = calculateTreesNeeded(yearly);
      const score = getGreenScore(calculatedDaily);

      await onLogEmissions({
        transportKm: Number(transportKm),
        transportType,
        electricityKwh: Number(electricityKwh),
        dietType,
        shoppingLevel,
        dailyFootprint: calculatedDaily,
      });

      setResults({
        daily: calculatedDaily,
        weekly,
        monthly,
        yearly,
        treesNeeded,
        greenScore: score
      });
      setStep(5); // results step
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCalculator = () => {
    setStep(1);
    setResults(null);
  };

  return (
    <div className="max-w-3xl mx-auto pb-10" id="calculator-section">
      <div className="p-5 md:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400">
              <Calculator className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-100">Carbon Intelligence Calculator</h2>
              <p className="text-xs text-gray-400">Complete details to evaluate your physical carbon debt</p>
            </div>
          </div>
          {step <= 4 && (
            <span className="text-xs font-mono text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/10">
              Step {step} of 4
            </span>
          )}
        </div>

        {/* STEP 1: TRANSPORT */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-green-400 shrink-0" />
              <h3 className="text-base md:text-lg font-semibold text-slate-200">Task 1: Transport & Mobility Habits</h3>
            </div>
            <p className="text-xs text-gray-400">Vehicles contribute over 40% of standard household greenhouse gas releases. Enter your commuter statistics.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2 font-mono">Primary Transport Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'petrol_car', label: 'Petrol/Gasoline Vehicle', desc: 'Typical standard automobile output' },
                    { id: 'diesel_car', label: 'Diesel Engine Vehicle', desc: 'Heavy compression ignition emissions' },
                    { id: 'electric_car', label: 'Pure Electric EV', desc: 'Zero offset emissions on clean grids' },
                    { id: 'hybrid', label: 'Hybrid Electric/Gas', desc: 'Optimized hybrid engine feedback' },
                    { id: 'motorcycle', label: 'Motorcycle/Scooter', desc: 'Two wheeler efficiency ratings' },
                    { id: 'bus_train', label: 'Public Bus or Train', desc: 'Mass transit shared offsets' },
                    { id: 'bicycle_walk', label: 'Bicycle or Walking', desc: '100% zero footprint self-power' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTransportType(opt.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${transportType === opt.id ? 'bg-green-500/10 border-green-400 text-green-300' : 'bg-[#07111a]/40 border-white/5 text-gray-300 hover:bg-[#07111a]/80'}`}
                    >
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="transportKm" className="block text-xs font-medium text-gray-300 mb-2 font-mono">Daily Communal Travel Distance (km)</label>
                <input
                  id="transportKm"
                  type="number"
                  value={transportKm}
                  onChange={(e) => setTransportKm(e.target.value)}
                  className="w-full bg-[#07111a] border border-white/10 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-green-400 font-mono"
                  placeholder="Enter the detail"
                />
                {errors.km && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-mono"><ShieldAlert className="w-3.5 h-3.5" /> {errors.km}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-green-500 text-slate-950 hover:bg-green-400 font-semibold text-xs tracking-wide flex items-center gap-2 transition-all cursor-pointer"
              >
                Next Task <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: ELECTRICITY */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-green-400 shrink-0" />
              <h3 className="text-base md:text-lg font-semibold text-slate-200">Task 2: Utility & Electricity Audit</h3>
            </div>
            <p className="text-xs text-gray-400">Power plants burning fossil fuels supply standard grid electricity. Tell us about your average energy intake.</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="electricityKwh" className="block text-xs font-medium text-gray-300 mb-2 font-mono">Weekly Household Electricity Draw (kWh)</label>
                <input
                  id="electricityKwh"
                  type="number"
                  value={electricityKwh}
                  onChange={(e) => setElectricityKwh(e.target.value)}
                  className="w-full bg-[#07111a] border border-white/10 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-green-400 font-mono"
                  placeholder="Enter the detail"
                />
                {errors.electricity && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-mono"><ShieldAlert className="w-3.5 h-3.5" /> {errors.electricity}</p>}
                <div className="mt-3 p-3 rounded-xl bg-slate-950/20 border border-white/5 text-[10px] text-gray-400 leading-relaxed font-mono">
                  💡 Tip: A typical medium apartment uses roughly 40-70 kWh per week. Electric stoves, water heaters, and AC compressors draw the most current.
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-5">
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white font-semibold text-xs tracking-wide flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-green-500 text-slate-950 hover:bg-green-400 font-semibold text-xs tracking-wide flex items-center gap-2 transition-all cursor-pointer"
              >
                Next Task <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: DIET */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <Apple className="w-5 h-5 text-green-400 shrink-0" />
              <h3 className="text-base md:text-lg font-semibold text-slate-200">Task 3: Diet & Agricultural Footprint</h3>
            </div>
            <p className="text-xs text-gray-400">Meat harvesting releases hefty volumes of atmospheric greenhouse gasses. Select your closest nutritional habit.</p>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2 font-mono">Dietary Classification</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'vegan', label: '100% Plant-Based Vegan', desc: 'No animal products whatsoever. The lightest agricultural carbon alternative.' },
                  { id: 'vegetarian', label: 'Vegetarian Diet', desc: 'Consumes dairy/eggs but no flesh. Excellent planet balance.' },
                  { id: 'pescatarian', label: 'Pescatarian', desc: 'Eats fish and sea-sources, but no poultry/mammals.' },
                  { id: 'flexitarian', label: 'Flexitarian (Sem-Vegetarian)', desc: 'Primarily plant-focused with infrequent light poultry/meat plates.' },
                  { id: 'meat_heavy', label: 'Meat-Heavy (Standard)', desc: 'Frequent daily serves of beef, lamb, pork, or poultry.' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDietType(opt.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${dietType === opt.id ? 'bg-green-500/10 border-green-400 text-green-300 shadow-md shadow-green-500/5' : 'bg-[#07111a]/40 border-white/5 text-gray-300 hover:bg-[#07111a]/80'}`}
                  >
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-5">
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white font-semibold text-xs tracking-wide flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-green-500 text-slate-950 hover:bg-green-400 font-semibold text-xs tracking-wide flex items-center gap-2 transition-all cursor-pointer"
              >
                Next Task <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: SHOPPING & GOODS */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-green-400 shrink-0" />
              <h3 className="text-base md:text-lg font-semibold text-slate-200">Task 4: Consumer & Retail Habits</h3>
            </div>
            <p className="text-xs text-gray-400">The manufacturing process of garments, tech appliances, and heavy freight drives mass raw raw emissions. Score your purchase scale.</p>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2 font-mono">Retail Consumption Profile</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'minimal', label: 'Minimalist (Eco Essentialist)', desc: 'Only buy required necessities, support second-hand circular marketplaces.' },
                  { id: 'average', label: 'Standard Average Consumer', desc: 'Moderate clothing, household, tech updates. Standard landfill waste recycling.' },
                  { id: 'frequent', label: 'Frequent Buyer', desc: 'Regular wardrobe updates, latest gadgets, high express home delivery courier deliveries.' },
                  { id: 'extreme', label: 'Heavy/Extreme Consumer', desc: 'Passionate retail therapy lifestyle, massive fast-fashion turnover levels.' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setShoppingLevel(opt.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${shoppingLevel === opt.id ? 'bg-green-500/10 border-green-400 text-green-300' : 'bg-[#07111a]/40 border-white/5 text-gray-300 hover:bg-[#07111a]/80'}`}
                  >
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-5">
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white font-semibold text-xs tracking-wide flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-slate-950 font-bold text-xs tracking-wide flex items-center gap-2 hover:scale-[1.01] hover:shadow-lg hover:shadow-green-500/10 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Processing Audit...' : 'Calculate Results!'}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: DETAILED RESULTS MATRIX */}
        {step === 5 && results && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-400 animate-bounce" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-100">Audit Processed Successfully</h3>
              <p className="text-xs text-gray-400 mt-1">Your detailed carbon metrics have been indexed and saved.</p>
            </div>

            {/* Results Bento Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="results-bento">
              
              <div className="p-4 rounded-xl bg-[#07111a]/50 border border-white/5 text-center font-mono">
                <div className="flex justify-center mb-1 text-green-400"><Clock className="w-4 h-4" /></div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Daily Output</p>
                <p className="text-2xl font-extrabold text-white mt-1">{results.daily} <span className="text-[10px] font-normal">kg</span></p>
              </div>

              <div className="p-4 rounded-xl bg-[#07111a]/50 border border-white/5 text-center font-mono">
                <div className="flex justify-center mb-1 text-green-400"><Calendar className="w-4 h-4" /></div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Weekly Total</p>
                <p className="text-2xl font-extrabold text-white mt-1">{results.weekly} <span className="text-[10px] font-normal">kg</span></p>
              </div>

              <div className="p-4 rounded-xl bg-[#07111a]/50 border border-white/5 text-center font-mono">
                <div className="flex justify-center mb-1 text-green-400"><Calendar className="w-4 h-4" /></div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Monthly Rate</p>
                <p className="text-2xl font-extrabold text-white mt-1">{results.monthly} <span className="text-[10px] font-normal">kg</span></p>
              </div>

              <div className="p-4 rounded-xl bg-[#07111a]/50 border border-white/5 text-center font-mono">
                <div className="flex justify-center mb-1 text-green-400"><Calendar className="w-4 h-4" /></div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Yearly Debt</p>
                <p className="text-2xl font-extrabold text-white mt-1">{(results.yearly/1000).toFixed(1)} <span className="text-[10px] font-normal">t</span></p>
              </div>

            </div>

            {/* Impact Metric & Deficit Forest Indicator */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 flex flex-col sm:flex-row gap-5 items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400 my-auto shrink-0">
                  <Trees className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-sm md:text-base">Your Carbon Sink Deficit</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                    An average tree sinks ~22kg of carbon yearly. You require planting <strong className="text-teal-400">{results.treesNeeded} mature trees</strong> annually to reach absolute Net Zero impact.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('plants')}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                Go offset Now
              </button>
            </div>

            {/* Score Showcase */}
            <div className="p-5 rounded-xl bg-[#07111a]/50 border border-white/5 text-center">
              <h4 className="text-xs uppercase tracking-wider font-bold text-gray-400 font-mono">Calculated Green Score</h4>
              <h3 className={`text-4xl font-black mt-2 ${results.greenScore >= 80 ? 'text-green-400' : results.greenScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {results.greenScore} / 100
              </h3>
              <p className="text-[10.5px] text-gray-400 mt-2 max-w-xl mx-auto leading-relaxed">
                {results.greenScore >= 80 
                  ? 'Fantastic work! You belong to the global top 10% of sustainable citizens. Check the AI coach for micro-adjustments.' 
                  : results.greenScore >= 50 
                    ? 'Moderate Carbon Index. Standard transportation and beef dairy products are putting upward pressure on your scores. See our alternate swaps.'
                    : 'Critical footprint detected. Your annual emissions exceed planetary thresholds. Review our personalized action coach recommendation.'}
              </p>
            </div>

            {/* Navigation options */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5 font-medium">
              <button
                onClick={resetCalculator}
                className="flex-1 py-3 text-center border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs hover:bg-[#07111a] transition-all cursor-pointer"
              >
                Re-take Calculation
              </button>
              <button
                onClick={() => onNavigate('coach')}
                className="flex-1 py-3 text-center bg-green-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-green-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                Explore Personalized AI Action Plan <Sparkles className="w-4 h-4" />
              </button>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}
