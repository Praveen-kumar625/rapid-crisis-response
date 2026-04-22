import React from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register(`${process.env.PUBLIC_URL}/service-worker.js`)
            .then(_reg => console.log('✅ Service Worker registered'))
            .catch(err => console.error('❌ SW failed:', err));
    });
}

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "171708174617-qkherktevmu6jus7bdk53hk64e16a0v8.apps.googleusercontent.com";

if (process.env.NODE_ENV !== 'production') {
    console.log(`[Auth_Diagnostics] Current Origin: ${window.location.origin}`);
    console.log(`[Auth_Diagnostics] Ensure this origin is added to "Authorized JavaScript origins" in Google Cloud Console.`);
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
    </GoogleOAuthProvider>
);
