/* eslint-disable @typescript-eslint/no-unused-vars */
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getPerformance, type FirebasePerformance } from "firebase/performance";
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

// Check if Firebase config is valid
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

// Safe initialization - only initialize if config exists
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let perf: FirebasePerformance | null = null;
let analytics: Analytics | null = null;

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "";
    storage = getStorage(
      app,
      storageBucket.startsWith("gs://") ? storageBucket : `gs://${storageBucket}`
    );

    // Initialize performance and analytics only in browser environment
    if (typeof window !== "undefined") {
      try {
        perf = getPerformance(app);
        analytics = getAnalytics(app);
      } catch (error) {
        console.warn("Firebase performance/analytics initialization failed:", error);
      }
    }
  } else {
    console.warn("[v0] Firebase not configured - missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID");
  }
} catch (error) {
  console.error("[v0] Firebase initialization failed:", error);
}

export { app, auth, db, storage, perf, analytics };
