import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocFromServer, 
  setDoc, 
  getDocs, 
  collection, 
  deleteDoc, 
  query, 
  orderBy
} from 'firebase/firestore';

import rawAppletConfig from '../../firebase-applet-config.json';

// Secure Environment Variable Configuration with platform configuration fallback
const env = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) ? (import.meta as any).env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || (rawAppletConfig as any)?.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (rawAppletConfig as any)?.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || (rawAppletConfig as any)?.projectId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (rawAppletConfig as any)?.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (rawAppletConfig as any)?.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || (rawAppletConfig as any)?.appId || '',
  firestoreDatabaseId: env.VITE_FIRESTORE_DATABASE_ID || (rawAppletConfig as any)?.firestoreDatabaseId || (rawAppletConfig as any)?.projectId || ''
};

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Firestore Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connectivity.");
    }
    return false;
  }
}
testFirestoreConnection();

// Authentication helpers
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Sync user profile to Firestore
    if (user) {
      await syncUserProfile(user);
    }
    return user;
  } catch (err) {
    console.error("Firebase Google sign-in failed:", err);
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error("Firebase sign-out failed:", err);
    throw err;
  }
}

export async function syncUserProfile(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const now = new Date().toISOString();
    
    // Check if user profile already exists to preserve creation timestamp
    let originalCreatedAt = now;
    try {
      const existingSnap = await getDoc(userDocRef);
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        if (data && data.createdAt) {
          originalCreatedAt = data.createdAt;
        }
      }
    } catch {
      // If offline or read error, fallback to now
    }

    await setDoc(userDocRef, {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Formulation Chemist',
      photoURL: user.photoURL || '',
      updatedAt: now,
      lastLoginAt: now,
      createdAt: originalCreatedAt
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

// User-scoped Formulations Persistence
export async function saveUserFormula(userId: string, formula: any): Promise<void> {
  const formulaId = String(formula.id || `f-${Date.now()}`);
  const path = `users/${userId}/formulas/${formulaId}`;
  try {
    const docRef = doc(db, 'users', userId, 'formulas', formulaId);
    const now = new Date().toISOString();
    await setDoc(docRef, {
      id: formulaId,
      userId,
      name: formula.name || 'Untitled Formulation',
      productType: formula.productType || 'Standard Detergent',
      grade: formula.grade || 'Commercial',
      batchSizeKg: Number(formula.batchSizeKg || formula.batchSize || 100),
      targetCost: (formula.targetCost !== undefined && formula.targetCost !== null && !isNaN(Number(formula.targetCost)))
        ? Number(formula.targetCost)
        : null,
      targetPH: (formula.targetPH !== undefined && formula.targetPH !== null && !isNaN(Number(formula.targetPH)))
        ? Number(formula.targetPH)
        : null,
      ingredients: formula.ingredients || [],
      notes: formula.notes || '',
      status: formula.status || 'Active',
      category: formula.category || '',
      updatedAt: now,
      createdAt: formula.createdAt || now
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserFormulas(userId: string): Promise<any[]> {
  const path = `users/${userId}/formulas`;
  try {
    const colRef = collection(db, 'users', userId, 'formulas');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function deleteUserFormula(userId: string, formulaId: string): Promise<void> {
  const path = `users/${userId}/formulas/${formulaId}`;
  try {
    const docRef = doc(db, 'users', userId, 'formulas', formulaId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// User-scoped Lab Trials Persistence
export async function saveUserTrial(userId: string, trial: any): Promise<void> {
  const trialId = String(trial.id || `trial-${Date.now()}`);
  const path = `users/${userId}/trials/${trialId}`;
  try {
    const docRef = doc(db, 'users', userId, 'trials', trialId);
    const now = new Date().toISOString();
    await setDoc(docRef, {
      id: trialId,
      userId,
      title: trial.title || trial.batchName || 'Laboratory Trial',
      formulaId: trial.formulaId || '',
      observations: trial.observations || trial.notes || '',
      measuredPH: (trial.measuredPH !== undefined && trial.measuredPH !== null && !isNaN(Number(trial.measuredPH)))
        ? Number(trial.measuredPH)
        : null,
      measuredViscosityCp: (trial.measuredViscosityCp !== undefined && trial.measuredViscosityCp !== null && !isNaN(Number(trial.measuredViscosityCp)))
        ? Number(trial.measuredViscosityCp)
        : null,
      stabilityVerdict: (trial.stabilityVerdict && typeof trial.stabilityVerdict === 'string' && trial.stabilityVerdict.trim())
        ? trial.stabilityVerdict.trim()
        : 'UNKNOWN',
      updatedAt: now,
      createdAt: trial.createdAt || now
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserTrials(userId: string): Promise<any[]> {
  const path = `users/${userId}/trials`;
  try {
    const colRef = collection(db, 'users', userId, 'trials');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}        
