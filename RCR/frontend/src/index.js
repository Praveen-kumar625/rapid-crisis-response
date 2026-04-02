// frontend/src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register(`${process.env.PUBLIC_URL}/service-worker.js`)
            .then(reg => console.log('✅ Service Worker registered'))
            .catch(err => console.error('❌ SW failed:', err));
    });
}

const container = document.getElementById('root');
const root = createRoot(container);
// Auth0Provider deleted. Firebase manages state internally.
root.render( < App / > );