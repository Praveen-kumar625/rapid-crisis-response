import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    // Detect mobile to use redirect instead of popup
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
      return null; // Will redirect
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      localStorage.setItem('google_token', token);
      window.dispatchEvent(new Event('google-login-success'));
      return result.user;
    }
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    throw error;
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const token = await result.user.getIdToken();
      localStorage.setItem('google_token', token);
      window.dispatchEvent(new Event('google-login-success'));
      return result.user;
    }
  } catch (error) {
    console.error("Redirect Auth Error:", error);
    throw error;
  }
};

export const logout = async () => {
  await auth.signOut();
  localStorage.removeItem('google_token');
};
