import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import toast, { Toaster } from 'react-hot-toast';
import { joinHotelRoom } from './socket';
import api from './api';
import { AppLayout } from './components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const MapPage = lazy(() => import('./pages/MapPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const IncidentDetail = lazy(() => import('./pages/IncidentDetail'));

const PageLoader = () => (
    <div className="flex-1 flex items-center justify-center bg-navy-950">
        <div className="w-12 h-12 border-4 border-electric/20 border-t-electric rounded-full animate-spin"></div>
    </div>
);

const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col"
    >
        {children}
    </motion.div>
);

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                <Route path="/map" element={<PageTransition><MapPage /></PageTransition>} />
                <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
                <Route path="/report" element={<PageTransition><ReportPage /></PageTransition>} />
                <Route path="/incidents/:id" element={<PageTransition><IncidentDetail /></PageTransition>} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('google_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
                syncUserContext();
            } catch (err) {
                console.error('Invalid token', err);
                localStorage.removeItem('google_token');
            }
        }
    }, []);

    const syncUserContext = async () => {
        try {
            const { data } = await api.get('/incidents/me');
            if (data.hotelId) {
                joinHotelRoom(data.hotelId);
            }
        } catch (err) {
            console.error('Failed to sync user context', err);
        }
    };

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // useGoogleLogin gives access_token by default. 
            // For id_token verification on backend, we might need to fetch user info or use the GoogleLogin component.
            // But we can fetch id_token by setting flow: 'implicit' and using GoogleLogin or custom fetch.
            // Let's use the simplest approach for "quickly": 
            // If the user provided ID token verification on backend, we need the ID token.
            // The `useGoogleLogin` with `flow: 'auth-code'` gives a code to exchange.
            // For "quick" we'll use the one that gives an ID token.
            // Actually, `@react-oauth/google` `useGoogleLogin` is for access tokens mostly.
            // To get an ID token easily, let's use the GoogleLogin component or fetch profile.
            
            console.log('Login Success:', tokenResponse);
            // Since we need ID token for backend `verifyIdToken`, we'll use GoogleLogin component in Navbar or similar.
            // Or fetch from Google userinfo API.
        },
        onError: (error) => console.log('Login Failed:', error)
    });

    // Wait, let's use a simpler way to get the ID token.
    // I will replace the custom button logic if needed, but for now let's use the GoogleLogin component.
    // I'll update Navbar.js to use the GoogleLogin component directly.

    const logout = () => {
        googleLogout();
        localStorage.removeItem('google_token');
        setUser(null);
        toast.success('Logged out successfully');
    };

    return (
        <ErrorBoundary>
            <Router>
                <Toaster 
                    position="top-center" 
                    toastOptions={{ 
                        className: 'glass-card border border-white/10 text-white text-xs font-bold uppercase tracking-widest py-4 px-6 shadow-2xl',
                        style: { background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)' }
                    }} 
                />
                
                <AppLayout user={user} login={login} logout={logout}>
                    <Suspense fallback={<PageLoader />}>
                        <AnimatedRoutes />
                    </Suspense>
                </AppLayout>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
