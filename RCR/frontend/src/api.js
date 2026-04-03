// frontend/src/api.js
import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
});

// Existing Request Interceptor
api.interceptors.request.use(async(config) => {
    if (process.env.REACT_APP_DEMO_MODE === 'true') {
        config.headers.Authorization = 'Bearer demo-token';
        return config;
    }

    if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 🚨 ADDED: Response Interceptor for Token Expiration (401 Error)
api.interceptors.response.use(
    (response) => response,
    async(error) => {
        const originalRequest = error.config;

        // Agar 401 Unauthorized aaye, aur user logged in ho, aur retry pehle na hua ho
        if (error.response && error.response.status === 401 && auth.currentUser && !originalRequest._retry) {
            originalRequest._retry = true; // Infinite loop block karne ke liye
            try {
                console.log('[API] Token expired, refreshing...');
                const token = await auth.currentUser.getIdToken(true); // Force refresh token
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api.request(originalRequest); // Puraani request ko naye token ke sath dobara bhejein
            } catch (refreshError) {
                console.error('[API] Token refresh failed:', refreshError);
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;