/* eslint-disable @typescript-eslint/no-unused-vars */
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getPerformance, type FirebasePerformance } from "firebase/performance";
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase config is valid
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

// Prevent re-initialization if already initialized (HMR safe)
export const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "";
export const storage = getStorage(
  app,
  storageBucket
    ? storageBucket.startsWith("gs://")
      ? storageBucket
      : `gs://${storageBucket}`
    : undefined
);

// Initialize performance and analytics only in browser environment with valid config
let perf: FirebasePerformance | null = null;
let analytics: Analytics | null = null;

if (typeof window !== "undefined" && isFirebaseConfigured) {
  try {
    perf = getPerformance(app);
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase performance/analytics initialization failed:", error);
  }
}

export { perf, analytics };
