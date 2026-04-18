import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

const firebaseConfig = {
<<<<<<< HEAD
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
=======
    apiKey: "YOUR_FIREBASE_API_KEY", 
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-app-id",
>>>>>>> 3669723195790157e40c02a0561dd047de357206
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
        if (isMobile) {
            await signInWithRedirect(auth, googleProvider);
        } else {
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();
            localStorage.setItem('google_token', token);
            return result.user;
        }
    } catch (error) {
        console.error("Auth Error:", error);
        throw error;
    }
};

export const handleRedirectResult = async () => {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            const token = await result.user.getIdToken();
            localStorage.setItem('google_token', token);
            return result.user;
        }
    } catch (error) {
        console.error("Redirect Error:", error);
    }
};