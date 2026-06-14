import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import originalConfig from './firebase-applet-config.json';

// Construct config, prioritizing environment variables
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || originalConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || originalConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || originalConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || originalConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || originalConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || originalConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || (originalConfig as any).measurementId || '',
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || originalConfig.firestoreDatabaseId || '(default)'
};

// Safe initialization
const app = initializeApp(firebaseConfig);

let db: any = null;
try {
  const dbId = firebaseConfig.firestoreDatabaseId;
  // If database ID is a placeholder or '(default)', standard getFirestore(app) is safer
  if (!dbId || dbId === '(default)' || dbId.includes('placeholder')) {
    db = getFirestore(app);
  } else {
    db = getFirestore(app, dbId);
  }
} catch (e) {
  console.error('Firestore custom database initialization failed. Falling back to default instance.', e);
  try {
    db = getFirestore(app);
  } catch (err) {
    console.error('Firestore fallback initialization failed completely.', err);
    db = null;
  }
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Detect if we have real configured Firebase credentials or placeholder
const isFirebaseReady = 
  !!firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes('placeholder-api-key') &&
  !firebaseConfig.apiKey.includes('mock_api_key') &&
  firebaseConfig.apiKey !== '' &&
  !!db;

export { db, isFirebaseReady, signOut };
