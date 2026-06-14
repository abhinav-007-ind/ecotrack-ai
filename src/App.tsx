import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { 
  Leaf, 
  LayoutDashboard, 
  Calculator, 
  Sparkles, 
  Trophy, 
  Trees, 
  User, 
  LogOut, 
  Sparkle,
  Lock,
  Globe,
  Loader2,
  Menu,
  X,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

import { auth, googleProvider, isFirebaseReady, signOut } from './firebase';
import originalConfig from './firebase-applet-config.json';
import { UserProfile, EmissionRecord, LeaderboardEntry, PlantingRecord } from './types';
import { 
  loadUserProfile, 
  getEmissionsLogs, 
  logEmissions, 
  getPlantedTrees, 
  plantTree, 
  getLeaderboard,
  saveUserProfile,
  localLogin,
  localRegister,
  syncOfflineDataToFirebase,
  isCloudEnabled,
  setCloudEnabled,
  hasExistingProfile
} from './utils/ecoStore';

// View components
import EarthBackground from './components/EarthBackground';
import Dashboard from './components/Dashboard';
import EcoCalculator from './components/EcoCalculator';
import EcoCoach from './components/EcoCoach';
import Leaderboard from './components/Leaderboard';
import PlantTracker from './components/PlantTracker';
import Profile from './components/Profile';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [cloudToggle, setCloudToggle] = useState<boolean>(() => {
    if (!isFirebaseReady) return false;
    const item = localStorage.getItem('ecotrack_cloud_enabled');
    return item !== 'false';
  });
  
  // App core synchronization state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [emissions, setEmissions] = useState<EmissionRecord[]>([]);
  const [plantedTrees, setPlantedTrees] = useState<PlantingRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Email form login details (local / custom email auth support)
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Mobile menu control
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Listen to Firebase and Local Authentication State
  useEffect(() => {
    let unsubscribe = () => {};
    
    const initAuth = async () => {
      if (isFirebaseReady) {
        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            setIsGuest(false);
            await handleSyncUserData(currentUser.uid, currentUser.email || 'user@example.com');
          } else {
            // Check local session as final fallback if Firebase does not have active user
            const localSessionRaw = localStorage.getItem('ecotrack_active_session');
            if (localSessionRaw) {
              try {
                const session = JSON.parse(localSessionRaw);
                setIsGuest(session.isGuest || false);
                setUser(session.user || null);
                if (session.user) {
                  await handleSyncUserData(session.user.uid, session.user.email);
                }
              } catch {
                setUser(null);
                setProfile(null);
              }
            } else {
              setUser(null);
              setProfile(null);
            }
          }
          setAuthLoading(false);
        });
      } else {
        // Fallback local session checking for sandboxed mode
        const localSessionRaw = localStorage.getItem('ecotrack_active_session');
        if (localSessionRaw) {
          try {
            const session = JSON.parse(localSessionRaw);
            setIsGuest(session.isGuest || false);
            setUser(session.user || null);
            if (session.user) {
              await handleSyncUserData(session.user.uid, session.user.email);
            }
          } catch {
            setUser(null);
            setProfile(null);
          }
        }
        setAuthLoading(false);
      }
    };

    initAuth();
    return () => unsubscribe();
  }, []);

  // 2. Synchronize store metrics over active state variables
  const handleSyncUserData = async (uid: string, userEmail: string) => {
    setLoadingData(true);
    try {
      // Determine if this is a brand new profile before loading or creating it
      const isNewUser = !(await hasExistingProfile(uid));

      // Load local/current data instantly
      const userProfile = await loadUserProfile(uid, userEmail);
      const userLogs = await getEmissionsLogs(uid);
      const userTrees = await getPlantedTrees(uid);
      
      setProfile(userProfile);
      setEmissions(userLogs);
      setPlantedTrees(userTrees);
      
      const board = await getLeaderboard(userProfile);
      setLeaderboard(board);

      // Only set initial active tab if profile is not already present
      if (!profile) {
        if (isNewUser) {
          setActiveTab('calculator');
        } else {
          setActiveTab('dashboard');
        }
      }

      // Trigger asynchronous offline-to-online background sync to the EcoTrack-AI database
      if (isFirebaseReady && cloudToggle) {
        syncOfflineDataToFirebase(uid, userEmail).then(async () => {
          // Re-pull and update values if remote changes occurred during sync
          const refreshedProfile = await loadUserProfile(uid, userEmail);
          const refreshedLogs = await getEmissionsLogs(uid);
          const refreshedTrees = await getPlantedTrees(uid);
          
          setProfile(refreshedProfile);
          setEmissions(refreshedLogs);
          setPlantedTrees(refreshedTrees);
          
          const refreshedBoard = await getLeaderboard(refreshedProfile);
          setLeaderboard(refreshedBoard);
        }).catch((err) => {
          console.warn('[Sync Engine] Background sync complete with warnings:', err);
        });
      }
    } catch (err) {
      console.error('Core synchronizer fail:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Google Single Sign On Auth Trigger
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    if (!isFirebaseReady) {
      setAuthError('Firebase connection not deployed. Please use Sandbox Guest login or sign up locally below.');
      return;
    }
    // Activate and persist cloud sync for Google credentials
    setCloudToggle(true);
    setCloudEnabled(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      let friendlyError = error.message || String(error);
      if (error.code || error.message) {
        const errMsg = (error.code || error.message).toLowerCase();
        if (errMsg.includes('unauthorized-domain') || errMsg.includes('auth/unauthorized-domain')) {
          const currentHost = window.location.hostname;
          const projectId = originalConfig.projectId || 'ecotrack-ai-e7ab7';
          friendlyError = `🔐 Unauthorized Domain Error: Firebase Auth was blocked because the domain "${currentHost}" is not added as an Authorized Domain in your Firebase project (${projectId}).\n\nTo fix this instantly:\n1. Go directly to your Firebase Console Auth Settings page:\n   👉 https://console.firebase.google.com/project/${projectId}/authentication/settings\n2. Select the "Authorized domains" card (or scroll down to it)\n3. Click "Add domain" and add exactly: "${currentHost}"\n4. If you also use the AI Studio preview, make sure to add:\n   • ais-dev-spaeuda2ugqv3khodo7el4-984337726196.asia-southeast1.run.app\n   • ais-pre-spaeuda2ugqv3khodo7el4-984337726196.asia-southeast1.run.app\n5. Click "Add", then try Logging in again. It will work perfectly!`;
        } else if (errMsg.includes('auth/operation-not-allowed') || errMsg.includes('operation-not-allowed')) {
          friendlyError = "Google Sign-In is disabled in this Firebase project Console! Please open Firebase Console > Authentication > Sign-in Method, edit Google provider, and configure/enable it.";
        } else if (errMsg.includes('popup-blocked') || errMsg.includes('auth/popup-closed-by-user')) {
          friendlyError = "Sign-In popup was closed or blocked by your browser. Please allow popups for this site and try again.";
        }
      }
      setAuthError(friendlyError);
    }
  };

  // Standard custom Email/Password Authentication triggers with built-in sandbox mock DB fallback
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAuthError('Compliance Validation: Please provide a valid email format.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Security Constraint: Passionate citizens use secure passwords (minimum 6 characters).');
      return;
    }

    setAuthLoading(true);
    try {
      if (isFirebaseReady && cloudToggle) {
        if (authTab === 'login') {
          await signInWithEmailAndPassword(auth, trimmedEmail, password);
        } else {
          await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        }
      } else {
        // Safe offline simulated storage operations
        if (authTab === 'login') {
          const credentials = await localLogin(trimmedEmail, password);
          setIsGuest(false);
          const mockUser = { uid: credentials.uid, email: credentials.email };
          setUser(mockUser);
          localStorage.setItem('ecotrack_active_session', JSON.stringify({ isGuest: false, user: mockUser }));
          await handleSyncUserData(credentials.uid, credentials.email);
        } else {
          const credentials = await localRegister(trimmedEmail, password);
          setIsGuest(false);
          const mockUser = { uid: credentials.uid, email: credentials.email };
          setUser(mockUser);
          localStorage.setItem('ecotrack_active_session', JSON.stringify({ isGuest: false, user: mockUser }));
          await handleSyncUserData(credentials.uid, credentials.email);
        }
      }
    } catch (err: any) {
      let friendlyError = err.message || 'Authentication error. Please check credentials.';
      if (err.code || err.message) {
        const errMsg = (err.code || err.message).toLowerCase();
        if (errMsg.includes('auth/operation-not-allowed') || errMsg.includes('operation-not-allowed')) {
          friendlyError = 'Firebase Email/Password provider is disabled in this project Console! Go to Console > Authentication > Sign-in Method to enable Email/Password, or use "Sandbox Guest" to test instantly.';
        } else if (errMsg.includes('auth/invalid-credential') || errMsg.includes('invalid-credential') || errMsg.includes('wrong-password') || errMsg.includes('user-not-found')) {
          friendlyError = 'Incorrect email or password. If you do not have an account yet, select the REGISTER license tab above to sign up first!';
        } else if (errMsg.includes('auth/email-already-in-use') || errMsg.includes('email-already-in-use')) {
          friendlyError = 'This email address is already registered. Please use the COMPLIANCE LOGIN tab instead.';
        } else if (errMsg.includes('weak-password') || errMsg.includes('auth/weak-password')) {
          friendlyError = 'Security restriction: Passwords must be at least 6 characters.';
        }
      }
      setAuthError(friendlyError);
    } finally {
      setAuthLoading(false);
    }
  };

  // Trigger password reset email flow using Firebase Authentication
  const handleForgotPassword = async () => {
    setAuthError(null);
    setAuthSuccess(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setAuthError('Please input your registered email address in the field above to dispatch a safe reset token.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAuthError('Compliance Check: Please check that your email is formatted correctly.');
      return;
    }

    setAuthLoading(true);
    try {
      if (isFirebaseReady) {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setAuthSuccess('Climate License recovery initiated! A secure password reset link has been dispatched to your email address.');
      } else {
        // Safe sandbox simulation
        setAuthSuccess(`[Sandbox Simulation] Safe dispatch signal sent for "${trimmedEmail}". Local sandbox records reset simulation completed!`);
      }
    } catch (err: any) {
      let friendlyError = err.message || 'Verification dispatch failed. Please verify the email status.';
      if (err.code || err.message) {
        const errMsg = (err.code || err.message).toLowerCase();
        if (errMsg.includes('auth/user-not-found') || errMsg.includes('user-not-found')) {
          friendlyError = 'No registered profile matches this email address. Please register a new climate license above!';
        } else if (errMsg.includes('auth/invalid-email') || errMsg.includes('invalid-email')) {
          friendlyError = 'The provided email is invalid. Please double check and try again.';
        }
      }
      setAuthError(friendlyError);
    } finally {
      setAuthLoading(false);
    }
  };

  // Guest Bypass setup trigger for preview sandbox operations
  const handleGuestBypass = async () => {
    setAuthLoading(true);
    setIsGuest(true);
    const mockUid = 'guest_pioneer_123';
    const guestUser = { uid: mockUid, email: 'guest@ecotrack.ai' };
    setUser(guestUser);
    localStorage.setItem('ecotrack_active_session', JSON.stringify({ isGuest: true, user: guestUser }));
    await handleSyncUserData(mockUid, 'guest@ecotrack.ai');
    setAuthLoading(false);
  };

  // Log a new calculated Footprint record
  const handleLogEmissions = async (record: Omit<EmissionRecord, 'id' | 'userId' | 'timestamp'>) => {
    if (!profile) return;
    const uid = profile.uid;
    const updatedHistory = await logEmissions(uid, record);
    setEmissions(updatedHistory);
    
    // Refresh updated statistics
    const latestProfile = await loadUserProfile(uid, profile.email);
    setProfile(latestProfile);
    
    const board = await getLeaderboard(latestProfile);
    setLeaderboard(board);
  };

  // Plant a tree action
  const handlePlantTree = async (species: string) => {
    if (!profile) return;
    const uid = profile.uid;
    const updatedTrees = await plantTree(uid, species);
    setPlantedTrees(updatedTrees);

    // Refresh profile statistics
    const latestProfile = await loadUserProfile(uid, profile.email);
    setProfile(latestProfile);

    const board = await getLeaderboard(latestProfile);
    setLeaderboard(board);
  };

  // Edit/Save customized Settings Profile
  const handleUpdateProfile = async (updatedFields: Partial<UserProfile>) => {
    if (!profile) return;
    const updatedProfile = { ...profile, ...updatedFields };
    setProfile(updatedProfile);
    await saveUserProfile(updatedProfile);

    const board = await getLeaderboard(updatedProfile);
    setLeaderboard(board);
  };

  // Sign out triggers
  const handleSignOut = async () => {
    localStorage.removeItem('ecotrack_active_session');
    setEmissions([]);
    setPlantedTrees([]);
    if (isGuest) {
      setIsGuest(false);
      setUser(null);
      setProfile(null);
      return;
    }
    if (user && user.uid && user.uid.startsWith('local_')) {
      setUser(null);
      setProfile(null);
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Interactive dynamic Password strength analyzer
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Blank', color: 'bg-white/10', colorText: 'text-gray-500' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 20, text: 'Weak password', color: 'bg-rose-500', colorText: 'text-rose-400' };
      case 2:
        return { score: 40, text: 'Simple', color: 'bg-orange-500', colorText: 'text-orange-400' };
      case 3:
        return { score: 60, text: 'Medium Strength', color: 'bg-yellow-500', colorText: 'text-yellow-400' };
      case 4:
        return { score: 80, text: 'Strong Secure Shield', color: 'bg-green-500', colorText: 'text-green-400' };
      case 5:
        return { score: 100, text: 'Atmospheric Grade Security', color: 'bg-emerald-400', colorText: 'text-emerald-400' };
      default:
        return { score: 0, text: 'Analyzing safety...', color: 'bg-rose-500/20', colorText: 'text-rose-400/80' };
    }
  };

  const strength = getPasswordStrength(password);

  // Render initialization splash spinner
  if (authLoading || (profile === null && (user !== null || isGuest))) {
    return (
      <div className="min-h-screen bg-[#07111a] flex flex-col items-center justify-center text-center font-mono">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-3" />
        <p className="text-xs text-green-400 font-bold tracking-wider animate-pulse uppercase font-mono">Syncing Atmospheric Metrics...</p>
        <p className="text-[10px] text-gray-600 mt-2 font-mono">Connecting local carbon grid nodes</p>
      </div>
    );
  }

  // Render Login Gate If Not Authenticated
  if (!user && !isGuest) {
    return (
      <div className="fixed inset-0 w-screen h-screen min-h-screen bg-[#07111a] z-50 flex items-center justify-center p-4 overflow-y-auto">
        <EarthBackground greenScore={85} /> {/* healthy preview glob */}
        
        {/* Entrance motion container */}
        <motion.div 
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-md w-full bg-[#0c1a25]/90 backdrop-blur-[28px] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.61)] my-auto"
        >
          {/* Futuristic subtle HUD light flare */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-24 bg-green-500/10 rounded-full blur-[35px] pointer-events-none" />

          <div className="text-center mb-5">
            <span className="p-2.5 rounded-xl bg-green-500/10 text-green-400 inline-block border border-green-500/10">
              <Leaf className="w-6 h-6 animate-pulse" />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight mt-3">EcoTrack AI</h1>
            <p className="text-[10px] text-gray-400 mt-1 max-w-[320px] mx-auto uppercase tracking-wider font-mono">
              {isFirebaseReady ? 'IMMERSE IN ZERO-CARBON GLOBAL CITIZENSHIP' : 'LOCAL ENVIRONMENT GATEWAY ACTIVE'}
            </p>
          </div>

          {!isFirebaseReady && (
            <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 p-3.5 rounded-2xl text-[10px] leading-relaxed font-mono mb-5 text-left relative z-10">
              💡 <strong>Sandbox Workspace Active:</strong> Firebase is not connected yet. You can sign up using a local email & password in the <strong>REGISTER LICENSE</strong> tab above, or enter <strong>pioneer@ecotrack.ai</strong> with any password to log in instantly! You can also click the <strong>Sandbox Guest</strong> button below.
            </div>
          )}

          {/* Premium Tab Selectors with Framer Motion slide-animations */}
          <div className="grid grid-cols-2 bg-slate-950/60 p-1.5 rounded-2xl border border-white/5 mb-5 select-none relative z-10">
            <button
              onClick={() => { setAuthTab('login'); setAuthError(null); setAuthSuccess(null); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all font-mono relative ${authTab === 'login' ? 'text-slate-950' : 'text-gray-400 hover:text-slate-200'}`}
            >
              {authTab === 'login' && (
                <motion.div
                  layoutId="active-login-tab"
                  className="absolute inset-0 bg-green-400 rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              COMPLIANCE LOGIN
            </button>
            <button
              onClick={() => { setAuthTab('signup'); setAuthError(null); setAuthSuccess(null); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all font-mono relative ${authTab === 'signup' ? 'text-slate-950' : 'text-gray-400 hover:text-slate-200'}`}
            >
              {authTab === 'signup' && (
                <motion.div
                  layoutId="active-login-tab"
                  className="absolute inset-0 bg-green-400 rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              REGISTER LICENSE
            </button>
          </div>

          {isFirebaseReady && (
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs font-mono relative z-10 mb-4 select-none">
              <div className="flex flex-col text-left">
                <span className="text-slate-200 font-bold flex items-center gap-1.5 animate-pulse">
                  <Globe className={`w-3.5 h-3.5 ${cloudToggle ? 'text-[#22C55E]' : 'text-gray-500'}`} />
                  Cloud Database Syncing
                </span>
                <span className="text-[9px] text-gray-500 font-medium leading-tight mt-0.5">
                  {cloudToggle ? 'Securing carbon profiles in your active Cloud project' : 'Running sandbox completely offline (local browser only)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = !cloudToggle;
                  setCloudToggle(val);
                  setCloudEnabled(val);
                  setAuthError(null);
                }}
                className={`relative w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${cloudToggle ? 'bg-[#22C55E]' : 'bg-slate-800'}`}
                title="Toggle Cloud Database Sync"
              >
                <div className={`w-4 h-4 rounded-full shadow-md transform duration-200 ${cloudToggle ? 'translate-x-4 bg-slate-950 border border-green-300' : 'translate-x-0 bg-slate-400'}`} />
              </button>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono mb-1.5">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#07111a]/80 border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-gray-500 focus:outline-none focus:border-green-400 font-mono"
                placeholder="pioneer@ecotrack.ai"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono mb-1.5 flex justify-between items-center">
                <span>Secure Password</span>
                {authTab === 'login' ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[9px] text-teal-400 hover:underline hover:text-teal-300 normal-case tracking-normal cursor-pointer focus:outline-none font-bold"
                  >
                    Forgot Password?
                  </button>
                ) : (
                  <span className="text-[9px] text-gray-500 capitalize font-sans normal-case tracking-normal">At least 6 chars</span>
                )}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#07111a]/80 border border-white/10 rounded-xl p-3 pr-10 text-xs text-slate-100 placeholder-gray-500 focus:outline-none focus:border-green-400 font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-slate-300 transition-colors p-1"
                  title={showPassword ? 'Obfuscate input' : 'Reveal typed secret'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength visual meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-gray-500 flex items-center gap-1">
                      <ShieldCheck className={`w-3.5 h-3.5 ${strength.score >= 60 ? 'text-green-400' : 'text-gray-500'}`} />
                      Strength Analysis
                    </span>
                    <span className={`font-bold uppercase ${strength.colorText}`}>{strength.text}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden w-full flex gap-1">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
                  </div>
                </div>
              )}
            </div>

            {authError && (
              <p className="p-3 bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400 rounded-xl leading-relaxed font-mono">
                ⚠ {authError}
              </p>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 rounded-xl leading-relaxed font-mono">
                ✓ {authSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-green-400 hover:bg-green-300 text-slate-950 font-extrabold text-xs rounded-xl tracking-wider hover:scale-[1.01] hover:shadow-lg transition-all focus:outline-none cursor-pointer font-mono disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  AUTHENTICATING DIGITAL TOKEN...
                </>
              ) : (
                <>
                  {authTab === 'login' ? 'ACTIVATE COMPLIANCE LOGIN' : 'REGISTER CLIMATE LICENSE'}
                </>
              )}
            </button>
          </form>

          {/* Inline switcher text */}
          <div className="text-center mt-3">
            <p className="text-[10px] text-gray-500 font-mono">
              {authTab === 'login' ? "New around here?" : "Already verified?"}{' '}
              <button
                onClick={() => {
                  setAuthTab(prev => prev === 'login' ? 'signup' : 'login');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="text-teal-400 hover:underline hover:text-teal-300 font-bold focus:outline-none ml-1 cursor-pointer"
              >
                {authTab === 'login' ? "Create an account" : "Log in to your profile"}
              </button>
            </p>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-3 text-[9px] text-gray-500 font-mono uppercase tracking-wider">Alternate Credentials Gate</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Social and sandbox guest buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="social-auth-options">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>🌍</span> Google Login
            </button>
            <button
              onClick={handleGuestBypass}
              type="button"
              className="py-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/20 hover:bg-emerald-900/40 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
            >
              <span>🌱</span> Sandbox Guest
            </button>
          </div>

        </motion.div>
      </div>
    );
  }

  // Define tab headers for routing
  const tabSchema = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'calculator', label: 'Footprint Calculator', icon: <Calculator className="w-4 h-4" /> },
    { id: 'coach', label: 'AI Eco Coach', icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { id: 'plants', label: 'Offset Forest', icon: <Trees className="w-4 h-4" /> },
    { id: 'profile', label: 'Climate Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between overflow-x-hidden select-none bg-[#07111A]">
      
      {/* Space Background Glow Layers matching design template */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-green-900/10 blur-[150px] rounded-full"></div>
      </div>

      {/* 🚀 TASK 1 - Global interactive Earth Background overlay */}
      <EarthBackground greenScore={profile?.greenScore || 80} />

      {/* 🚀 TASK 3 - LIQUID GLASS MAIN INTERFACE WRAPPER */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 flex-grow flex flex-col justify-between">
        
        {/* Global Glassmorphic Top Header Navigation Bar */}
        <header className="relative z-50 py-3.5 flex items-center justify-between px-6 mb-4 mt-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl sticky top-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <span className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-slate-950 shadow-md shadow-green-500/10">
              <Leaf className="w-4.5 h-4.5" />
            </span>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-none">EcoTrack<span className="text-[#22C55E]">AI</span></h1>
              <span className="text-[8px] font-mono tracking-widest text-[#22C55E] uppercase font-black">Climate Compliant</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-2 text-sm font-medium">
            {tabSchema.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${activeTab === tab.id ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 font-extrabold shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Header Action menu - User identity profile and signout button */}
          <div className="flex items-center gap-3">
            {/* Real-time sync status indicator pill */}
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold font-mono tracking-wider ${isFirebaseReady && cloudToggle && !isGuest && (!user || !user.uid.startsWith('local_')) ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isFirebaseReady && cloudToggle && !isGuest && (!user || !user.uid.startsWith('local_')) ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
              {isFirebaseReady && cloudToggle && !isGuest && (!user || !user.uid.startsWith('local_')) ? 'CLOUD SYNC ACTIVE' : 'OFFLINE LOCAL GRID'}
            </div>

            <div className="hidden sm:flex items-center gap-2 p-1 px-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-sm select-none">{profile?.avatarUrl}</span>
              <div className="flex flex-col items-start pr-1">
                <span className="text-[10px] font-bold text-slate-200 truncate max-w-[100px] leading-tight">
                  {profile?.displayName}
                </span>
                <span className="text-[8px] text-[#22C55E] leading-none">Green Citizen</span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all"
              title="Compliant compliance disconnect"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu triggers */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer lg:hidden transition-all"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown catalog wrapper */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border border-white/10 bg-[#07111a]/95 backdrop-blur-xl absolute left-4 right-4 top-[70px] z-40 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-1"
            >
              {tabSchema.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${activeTab === tab.id ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic routed main panel */}
        <main className="flex-grow pt-6 md:pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  profile={profile!} 
                  emissions={emissions} 
                  leaderboard={leaderboard}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'calculator' && (
                <EcoCalculator 
                  userId={profile!.uid} 
                  onLogEmissions={handleLogEmissions}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'coach' && (
                <EcoCoach emissions={emissions} />
              )}
              {activeTab === 'leaderboard' && (
                <Leaderboard 
                  leaderboard={leaderboard} 
                  currentProfile={profile} 
                />
              )}
              {activeTab === 'plants' && (
                <PlantTracker 
                  userId={profile!.uid} 
                  profile={profile!} 
                  plantedTrees={plantedTrees} 
                  onPlantTree={handlePlantTree}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'profile' && (
                <Profile 
                  profile={profile!} 
                  onUpdateProfile={handleUpdateProfile} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer section in margin */}
        <footer className="py-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-500 text-[10px] font-mono">
          <span>&copy; 2026 ECOTRACK AI INC. EVERY ACTION BALANCES THE BIOSPHERE.</span>
          <div className="flex items-center gap-3">
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setActiveTab('profile')}>SETTINGS</span>
            <span>&bull;</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setActiveTab('calculator')}>AUDIT CARBON</span>
            <span>&bull;</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setActiveTab('coach')}>AI ASSISTANCE</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
