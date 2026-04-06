import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// FIXED: Robust initialization to prevent React crashing on missing env variables
let app;
let auth;
let googleProvider;
let analytics;

try {
    if (!firebaseConfig.apiKey) {
        throw new Error("REACT_APP_FIREBASE_API_KEY is undefined. Please verify your environment variables or rebuild the application.");
    }
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    analytics = getAnalytics(app);
} catch (error) {
    console.error("⚠️ Firebase Initialization Error:", error.message);
    // Mock objects to prevent complete application crash before UI can show error states
    auth = { currentUser: null, onAuthStateChanged: () => () => {} };
}

export { app, auth, googleProvider, analytics };