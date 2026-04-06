// frontend/src/api.js
import axios from 'axios';
import { auth } from './firebase';
import { updateSocketToken } from './socket'; // FIXED: Import socket helper

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
});

// Existing Request Interceptor
api.interceptors.request.use(async(config) => {
    if (process.env.REACT_APP_DEMO_MODE === 'true') {
        config.headers.Authorization = 'Bearer demo-token';
        return config;
    }

    // 🚨 RESILIENCE FIX: Ensure we wait for Firebase to initialize if it's in progress
    const getCurrentUser = () => {
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    };

    let user = auth.currentUser;
    if (!user) {
        user = await getCurrentUser();
    }

    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 🚨 FIXED: Response Interceptor for Token Expiration (401 Error) with Race Condition Handling
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    // FIXED: Update socket singleton with new token
    updateSocketToken(token);
    
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

api.interceptors.response.use(
    (response) => response,
    async(error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && auth.currentUser && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api.request(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log('[API] Token expired, refreshing...');
                const token = await auth.currentUser.getIdToken(true);
                isRefreshing = false;
                onRefreshed(token);
                
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api.request(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                console.error('[API] Token refresh failed:', refreshError);
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;