import { db, auth, isFirebaseReady } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  where 
} from 'firebase/firestore';
import { EmissionRecord, UserProfile, LeaderboardEntry, PlantingRecord, AVAILABLE_BADGES, Badge } from '../types';
import { calculateDailyFootprint, getGreenScore } from './carbonCalculator';

const LOCAL_PROFILE_KEY = 'ecotrack_user_profile';
const LOCAL_EMISSIONS_KEY = 'ecotrack_emissions_logs';
const LOCAL_TREES_KEY = 'ecotrack_planted_trees';
const LOCAL_ACCOUNTS_KEY = 'ecotrack_local_accounts';

let cloudEnabled = true;

export function setCloudEnabled(enabled: boolean) {
  cloudEnabled = enabled;
  localStorage.setItem('ecotrack_cloud_enabled', enabled ? 'true' : 'false');
}

export function isCloudEnabled(): boolean {
  const local = localStorage.getItem('ecotrack_cloud_enabled');
  if (local === 'false') return false;
  if (!auth.currentUser) return false;
  return cloudEnabled;
}

export interface LocalAccount {
  uid: string;
  email: string;
  passwordHash: string;
}

// Dynamic default dummy users on the leaderboard to simulate competitive gamification.
// These are combined, deduplicated, and sorted with real user data!
const INITIAL_COMPETITORS: LeaderboardEntry[] = [
  { uid: 'comp1', displayName: 'Aarav Sharma', avatarUrl: '🌍', greenScore: 94, totalSavings: 680, treesPlanted: 14, streak: 8, city: 'New Delhi' },
  { uid: 'comp2', displayName: 'Sophie Dubois', avatarUrl: '🌱', greenScore: 89, totalSavings: 510, treesPlanted: 9, streak: 5, city: 'Paris' },
  { uid: 'comp3', displayName: 'Kenji Sato', avatarUrl: '🦊', greenScore: 83, totalSavings: 440, treesPlanted: 8, streak: 12, city: 'Tokyo' },
  { uid: 'comp4', displayName: 'Amina Diop', avatarUrl: '☀️', greenScore: 78, totalSavings: 310, treesPlanted: 6, streak: 3, city: 'Dakar' },
  { uid: 'comp5', displayName: 'Diego Alvarez', avatarUrl: '🌳', greenScore: 61, totalSavings: 180, treesPlanted: 4, streak: 2, city: 'Madrid' },
  { uid: 'comp6', displayName: 'Emily Watson', avatarUrl: '🐨', greenScore: 54, totalSavings: 120, treesPlanted: 3, streak: 4, city: 'Sydney' },
];

// Helper to hash password secrets statically for sandbox privacy protection (prevent raw storage)
function hashSecret(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'hash_' + Math.abs(hash).toString(36);
}

// Offline sandbox user registrations
export async function localRegister(email: string, passwordSecret: string): Promise<{ uid: string; email: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (passwordSecret.length < 6) {
    throw new Error('Compliance safety: Passwords must be at least 6 characters.');
  }
  
  const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
  let accounts: LocalAccount[] = [];
  if (raw) {
    try {
      accounts = JSON.parse(raw);
    } catch {}
  }
  
  if (accounts.some(acc => acc.email === normalizedEmail)) {
    throw new Error('This climate profile email is already registered locally.');
  }
  
  const uid = 'local_' + Math.random().toString(36).substring(2, 11);
  const passwordHash = hashSecret(passwordSecret);
  
  accounts.push({
    uid,
    email: normalizedEmail,
    passwordHash
  });
  
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  return { uid, email: normalizedEmail };
}

// Offline sandbox login helper
export async function localLogin(email: string, passwordSecret: string): Promise<{ uid: string; email: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
  let accounts: LocalAccount[] = [];
  if (raw) {
    try {
      accounts = JSON.parse(raw);
    } catch {}
  }
  
  let found = accounts.find(acc => acc.email === normalizedEmail);
  if (!found) {
    if (normalizedEmail === 'pioneer@ecotrack.ai') {
      const uid = 'local_pioneer_default';
      const passwordHash = hashSecret(passwordSecret || 'password');
      found = { uid, email: normalizedEmail, passwordHash };
      accounts.push(found);
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    } else {
      throw new Error('No local profile matches this address. Click register to create one!');
    }
  }
  
  const hashedInput = hashSecret(passwordSecret);
  if (found.passwordHash !== hashedInput) {
    throw new Error('Incorrect secure password entry. Please verify credentials.');
  }
  
  return { uid: found.uid, email: found.email };
}

export async function hasExistingProfile(userId: string): Promise<boolean> {
  if (isFirebaseReady) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return true;
      }
    } catch (e) {
      console.warn('Firebase document check failed or skipped:', e);
    }
  }

  const localProfileKey = `${LOCAL_PROFILE_KEY}_${userId}`;
  const local = localStorage.getItem(localProfileKey);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed.uid === userId) return true;
    } catch {}
  }

  const legacyLocal = localStorage.getItem(LOCAL_PROFILE_KEY);
  if (legacyLocal) {
    try {
      const parsed = JSON.parse(legacyLocal);
      if (parsed.uid === userId) return true;
    } catch {}
  }

  return false;
}

export async function loadUserProfile(userId: string, email: string): Promise<UserProfile> {
  if (isFirebaseReady && isCloudEnabled()) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
    } catch (e) {
      console.error('Firebase profile load failed:', e);
    }
  }

  // Fallback to user-scoped localStorage
  const localProfileKey = `${LOCAL_PROFILE_KEY}_${userId}`;
  const local = localStorage.getItem(localProfileKey);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed.uid === userId) return parsed;
    } catch {}
  }

  // Backward compatibility fallback to universal key
  const legacyLocal = localStorage.getItem(LOCAL_PROFILE_KEY);
  if (legacyLocal) {
    try {
      const parsed = JSON.parse(legacyLocal);
      if (parsed.uid === userId) {
        saveProfileLocalOnly(parsed);
        return parsed;
      }
    } catch {}
  }

  // Generate initial robust default profile
  const defaultProfile: UserProfile = {
    uid: userId,
    email: email,
    displayName: email.split('@')[0],
    avatarUrl: '🌱',
    bio: 'Pioneering my local green carbon tracking journey!',
    city: 'Bengaluru',
    streak: 1,
    lastActiveDate: new Date().toISOString(),
    treesPlanted: 0,
    treesNeeded: 5, // healthy base estimate
    greenScore: 80,
    badges: ['first_calculation']
  };

  saveProfileLocalOnly(defaultProfile);
  return defaultProfile;
}

export function saveProfileLocalOnly(profile: UserProfile) {
  localStorage.setItem(`${LOCAL_PROFILE_KEY}_${profile.uid}`, JSON.stringify(profile));
  // Keep legacy key synced for current active user lookup convenience
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  saveProfileLocalOnly(profile);

  if (isFirebaseReady && isCloudEnabled()) {
    try {
      await setDoc(doc(db, 'users', profile.uid), profile);
    } catch (e) {
      console.error('Firebase profile save failed:', e);
    }
  }
}

export async function getEmissionsLogs(userId: string): Promise<EmissionRecord[]> {
  if (isFirebaseReady && isCloudEnabled()) {
    try {
      const q = query(
        collection(db, 'emissions'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const records: EmissionRecord[] = [];
      querySnapshot.forEach((doc) => {
        records.push(doc.data() as EmissionRecord);
      });
      if (records.length > 0) {
        // Sort client-side to prevent requiring a composite index
        records.sort((a, b) => {
          const valA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : 0;
          const valB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : 0;
          return valB - valA;
        });
        return records.slice(0, 20);
      }
    } catch (e) {
      console.error('Firebase emissions load failed:', e);
    }
  }

  // Fallback to user-scoped local storage
  const localEmissionsKey = `${LOCAL_EMISSIONS_KEY}_${userId}`;
  const local = localStorage.getItem(localEmissionsKey);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }

  // Legacy fallback if matching
  const legacyLocal = localStorage.getItem(LOCAL_EMISSIONS_KEY);
  if (legacyLocal) {
    try {
      const parsed = JSON.parse(legacyLocal) as EmissionRecord[];
      if (parsed.length > 0 && parsed[0].userId === userId) {
        localStorage.setItem(localEmissionsKey, legacyLocal);
        return parsed;
      }
    } catch {}
  }

  return [];
}

export async function logEmissions(userId: string, record: Omit<EmissionRecord, 'id' | 'userId' | 'timestamp'>): Promise<EmissionRecord[]> {
  const newRecord: EmissionRecord = {
    ...record,
    id: 'em_' + Math.random().toString(36).substr(2, 9),
    userId,
    timestamp: new Date().toISOString()
  };

  // 1. Get history and prepend
  const history = await getEmissionsLogs(userId);
  const updatedHistory = [newRecord, ...history].slice(0, 30); // clip at 30 logs

  // 2. Save logs to user-scoped key
  localStorage.setItem(`${LOCAL_EMISSIONS_KEY}_${userId}`, JSON.stringify(updatedHistory));

  // 3. Save to Firebase if configured
  if (isFirebaseReady && isCloudEnabled()) {
    try {
      await setDoc(doc(db, 'emissions', newRecord.id), newRecord);
    } catch (e) {
      console.error('Firebase log save failed:', e);
    }
  }

  // 4. Update core user profile stats: greenScore & streaks
  const profile = await loadUserProfile(userId, auth.currentUser?.email || 'user@example.com');
  profile.greenScore = getGreenScore(newRecord.dailyFootprint);

  // recalculate trees needed:
  // Convert daily limit to annual footprint = daily * 365
  const annualCO2 = newRecord.dailyFootprint * 365;
  profile.treesNeeded = Math.max(1, Math.ceil(annualCO2 / 22)); // 22kg absorbed/tree/year

  // Calculate Streak increment details
  const todayStr = new Date().toISOString().split('T')[0];
  const lastActiveStr = profile.lastActiveDate.split('T')[0];

  if (todayStr !== lastActiveStr) {
    const lastActiveDate = new Date(profile.lastActiveDate);
    const diffTime = Math.abs(new Date().getTime() - lastActiveDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1.5) {
      profile.streak += 1;
    } else {
      profile.streak = 1; // broken list reset
    }
    profile.lastActiveDate = new Date().toISOString();
  }

  // Check badges trigger criteria
  const unlockedBadges = [...profile.badges];
  if (!unlockedBadges.includes('first_calculation')) {
    unlockedBadges.push('first_calculation');
  }
  if (profile.greenScore >= 90 && !unlockedBadges.includes('green_score_90')) {
    unlockedBadges.push('green_score_90');
  }
  if (profile.streak >= 3 && !unlockedBadges.includes('streak_3')) {
    unlockedBadges.push('streak_3');
  }
  profile.badges = unlockedBadges;

  // Save profile modifications
  await saveUserProfile(profile);

  return updatedHistory;
}

export async function getPlantedTrees(userId: string): Promise<PlantingRecord[]> {
  if (isFirebaseReady && isCloudEnabled()) {
    try {
      const q = query(
        collection(db, 'trees'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const records: PlantingRecord[] = [];
      querySnapshot.forEach((docSnapshot) => {
        records.push(docSnapshot.data() as PlantingRecord);
      });
      if (records.length > 0) {
        records.sort((a, b) => new Date(b.datePlanted).getTime() - new Date(a.datePlanted).getTime());
        // Cache to localStorage
        localStorage.setItem(`${LOCAL_TREES_KEY}_${userId}`, JSON.stringify(records));
        return records;
      }
    } catch (e) {
      console.error('Firebase trees load failed:', e);
    }
  }

  const localTreeKey = `${LOCAL_TREES_KEY}_${userId}`;
  const local = localStorage.getItem(localTreeKey);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }

  // Legacy fallback
  const legacyLocal = localStorage.getItem(LOCAL_TREES_KEY);
  if (legacyLocal) {
    try {
      const parsed = JSON.parse(legacyLocal) as PlantingRecord[];
      if (parsed.length > 0 && parsed[0].userId === userId) {
        localStorage.setItem(localTreeKey, legacyLocal);
        return parsed;
      }
    } catch {}
  }

  return [];
}

export async function plantTree(userId: string, species: string): Promise<PlantingRecord[]> {
  const newTree: PlantingRecord = {
    id: 'tree_' + Math.random().toString(36).substr(2, 9),
    userId,
    treeSpecies: species,
    datePlanted: new Date().toISOString(),
    status: 'seedling',
    offsetValue: 22 // general absorption rating
  };

  const trees = await getPlantedTrees(userId);
  const updatedTrees = [newTree, ...trees];
  localStorage.setItem(`${LOCAL_TREES_KEY}_${userId}`, JSON.stringify(updatedTrees));

  if (isFirebaseReady && isCloudEnabled()) {
    try {
      await setDoc(doc(db, 'trees', newTree.id), newTree);
    } catch (e) {
      console.error('Firebase tree save failed:', e);
    }
  }

  // Update profile planted trees counts
  const profile = await loadUserProfile(userId, auth.currentUser?.email || 'user@example.com');
  profile.treesPlanted = updatedTrees.length;

  // Badges check
  const unlockedBadges = [...profile.badges];
  if (profile.treesPlanted >= 1 && !unlockedBadges.includes('first_tree')) {
    unlockedBadges.push('first_tree');
  }
  if (profile.treesPlanted >= 10 && !unlockedBadges.includes('master_planter')) {
    unlockedBadges.push('master_planter');
  }
  // Check offset badges
  // offset ratio = planted * 22 / (footprint * 365)
  const logs = await getEmissionsLogs(userId);
  const currentDaily = logs.length > 0 ? logs[0].dailyFootprint : 14.2;
  const yearlyFootprint = currentDaily * 365;
  const currentOffset = profile.treesPlanted * 22;

  if (yearlyFootprint > 0 && (currentOffset / yearlyFootprint) >= 0.5 && !unlockedBadges.includes('offset_50')) {
    unlockedBadges.push('offset_50');
  }

  profile.badges = unlockedBadges;
  await saveUserProfile(profile);

  return updatedTrees;
}

// Automatic offline-to-online background synchronization engine
export async function syncOfflineDataToFirebase(userId: string, email: string): Promise<void> {
  if (!isFirebaseReady || !isCloudEnabled()) return;

  try {
    console.log(`[Sync Engine] Initiating automated sync to old EcoTrack-AI database for: ${userId}`);

    // 1. Sync User Profile if newer
    const localProfileKey = `${LOCAL_PROFILE_KEY}_${userId}`;
    const localProfileRaw = localStorage.getItem(localProfileKey);
    let localProfile: UserProfile | null = null;
    if (localProfileRaw) {
      try {
        const parsed = JSON.parse(localProfileRaw) as UserProfile;
        if (parsed.uid === userId) {
          localProfile = parsed;
        }
      } catch {}
    }

    let remoteProfile: UserProfile | null = null;
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        remoteProfile = userDoc.data() as UserProfile;
      }
    } catch {}

    if (localProfile && !remoteProfile) {
      await setDoc(doc(db, 'users', userId), localProfile);
    } else if (localProfile && remoteProfile) {
      const mergedProfile: UserProfile = {
        ...remoteProfile,
        displayName: remoteProfile.displayName || localProfile.displayName,
        city: remoteProfile.city || localProfile.city || 'Bengaluru',
        greenScore: Math.max(remoteProfile.greenScore || 0, localProfile.greenScore || 0),
        streak: Math.max(remoteProfile.streak || 1, localProfile.streak || 1),
        treesPlanted: Math.max(remoteProfile.treesPlanted || 0, localProfile.treesPlanted || 0),
        treesNeeded: Math.max(remoteProfile.treesNeeded || 5, localProfile.treesNeeded || 5),
        badges: Array.from(new Set([...(remoteProfile.badges || []), ...(localProfile.badges || [])]))
      };
      await setDoc(doc(db, 'users', userId), mergedProfile);
    }

    // 2. Sync Emissions Logs (push local-only items)
    const localEmissionsKey = `${LOCAL_EMISSIONS_KEY}_${userId}`;
    const localEmissionsRaw = localStorage.getItem(localEmissionsKey);
    if (localEmissionsRaw) {
      try {
        const localLogs = JSON.parse(localEmissionsRaw) as EmissionRecord[];
        if (Array.isArray(localLogs)) {
          const q = query(collection(db, 'emissions'), where('userId', '==', userId));
          const querySnapshot = await getDocs(q);
          const remoteIds = new Set<string>();
          querySnapshot.forEach((docSnapshot) => {
            remoteIds.add(docSnapshot.id);
          });

          for (const record of localLogs) {
            if (record.userId === userId && !remoteIds.has(record.id)) {
              await setDoc(doc(db, 'emissions', record.id), record);
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync emissions logs to Firestore:', err);
      }
    }

    // 3. Sync planted tree records
    const localTreeKey = `${LOCAL_TREES_KEY}_${userId}`;
    const localTreeRaw = localStorage.getItem(localTreeKey);
    if (localTreeRaw) {
      try {
        const localTrees = JSON.parse(localTreeRaw) as PlantingRecord[];
        if (Array.isArray(localTrees)) {
          const q = query(collection(db, 'trees'), where('userId', '==', userId));
          const querySnapshot = await getDocs(q);
          const remoteTreeIds = new Set<string>();
          querySnapshot.forEach((docSnapshot) => {
            remoteTreeIds.add(docSnapshot.id);
          });

          for (const tree of localTrees) {
            if (tree.userId === userId && !remoteTreeIds.has(tree.id)) {
              await setDoc(doc(db, 'trees', tree.id), tree);
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync planted trees to Firestore:', err);
      }
    }

    console.log('[Sync Engine] EcoTrack-AI database synchronization complete.');
  } catch (syncErr) {
    console.error('[Sync Engine] Error during database synchronization:', syncErr);
  }
}

// Dynamic Leaderboard solver combining competitor templates, custom accounts, and cloud users
export async function getLeaderboard(currentUserProfile: UserProfile | null): Promise<LeaderboardEntry[]> {
  let list = [...INITIAL_COMPETITORS];

  // 1. Gather other registered local mock users from this machine
  const rawAccounts = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
  if (rawAccounts) {
    try {
      const accounts: { uid: string; email: string }[] = JSON.parse(rawAccounts);
      for (const acc of accounts) {
        const profileStr = localStorage.getItem(`${LOCAL_PROFILE_KEY}_${acc.uid}`);
        if (profileStr) {
          try {
            const u = JSON.parse(profileStr) as UserProfile;
            list.push({
              uid: u.uid,
              displayName: u.displayName || acc.email.split('@')[0],
              avatarUrl: u.avatarUrl || '🌱',
              greenScore: u.greenScore || 50,
              totalSavings: u.treesPlanted * 22,
              treesPlanted: u.treesPlanted || 0,
              streak: u.streak || 1,
              city: u.city || 'Bengaluru'
            });
          } catch {}
        }
      }
    } catch {}
  }

  // 2. If we have live cloud, load other registered users dynamically
  if (isFirebaseReady && isCloudEnabled()) {
    try {
      const querySnapshot = await getDocs(query(collection(db, 'users'), orderBy('greenScore', 'desc'), limit(15)));
      const firebaseUsers: LeaderboardEntry[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const u = docSnapshot.data() as UserProfile;
        firebaseUsers.push({
          uid: u.uid,
          displayName: u.displayName || 'Eco Advocate',
          avatarUrl: u.avatarUrl || '🌱',
          greenScore: u.greenScore || 50,
          totalSavings: (u.treesPlanted || 0) * 22, // proxy metric
          treesPlanted: u.treesPlanted || 0,
          streak: u.streak || 1,
          city: u.city || 'Standard City'
        });
      });
      
      // Merge elements
      if (firebaseUsers.length > 0) {
        list = [...list, ...firebaseUsers];
      }
    } catch (e) {
      console.error('Leaderboard Fetch fallback:', e);
    }
  }

  // 3. Always merge/update the active logged-in profile so stats are perfectly matched
  if (currentUserProfile) {
    const userEntry: LeaderboardEntry = {
      uid: currentUserProfile.uid,
      displayName: currentUserProfile.displayName,
      avatarUrl: currentUserProfile.avatarUrl,
      greenScore: currentUserProfile.greenScore,
      totalSavings: currentUserProfile.treesPlanted * 22,
      treesPlanted: currentUserProfile.treesPlanted,
      streak: currentUserProfile.streak,
      city: currentUserProfile.city || 'Bengaluru'
    };

    // Eliminate duplicate
    list = list.filter(item => item.uid !== userEntry.uid);
    list.push(userEntry);
  }

  // Deduplicate completely by uid
  const uniqMap = new Map<string, LeaderboardEntry>();
  list.forEach(item => {
    // Keep best score if collision exists
    const existing = uniqMap.get(item.uid);
    if (!existing || item.greenScore > existing.greenScore) {
      uniqMap.set(item.uid, item);
    }
  });

  const finalists = Array.from(uniqMap.values());

  // Sort by Ranking Formula: Green Score descending, then streak descending
  finalists.sort((a, b) => {
    if (b.greenScore !== a.greenScore) {
      return b.greenScore - a.greenScore;
    }
    return b.streak - a.streak;
  });

  return finalists;
}
