import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

import { joinHotelRoom, updateSocketToken } from './socket';
import api from './api';
import { AppLayout } from './components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { getPendingReports, markReportSynced, clearPendingReports } from './idb';
import { UIProvider } from './context/UIContext';
import { TacticalProvider } from './context/TacticalContext';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
const Home = lazy(() => import('./pages/Home'));
const TacticalDashboard = lazy(() => import('./pages/TacticalDashboard'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const IncidentDetail = lazy(() => import('./pages/IncidentDetail'));
const TacticalHUD = lazy(() => import('./pages/TacticalHUD'));
const TacticalMobileHUD = lazy(() => import('./pages/TacticalMobileHUD'));
const MapPage = lazy(() => import('./pages/MapPage'));
const Login = lazy(() => import('./pages/login'));
const Signup = lazy(() => import('./pages/signup'));

const PageLoader = () => (
    <div className="flex-1 flex items-center justify-center bg-[#020617]">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
);

const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
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
                <Route path="/dashboard" element={<PageTransition><TacticalDashboard /></PageTransition>} />
                <Route path="/report" element={<PageTransition><ReportPage /></PageTransition>} />
                <Route path="/incidents/:id" element={<PageTransition><IncidentDetail /></PageTransition>} />
                <Route path="/hud" element={<PageTransition><TacticalHUD /></PageTransition>} />
                <Route path="/mobile-hud" element={<PageTransition><TacticalMobileHUD /></PageTransition>} />
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    const [user, setUser] = useState(null);

    const syncUserContext = async () => {
        try {
            const { data } = await api.get('/api/incidents/me');
            if (data.hotelId) joinHotelRoom(data.hotelId);
        } catch (err) {
            console.error(err);
        }
    };

    const flushOfflineQueue = async () => {
        const pending = await getPendingReports();
        if (!pending.length) return;

        toast.loading(`Syncing ${pending.length} reports...`, { id: 'sync' });

        let success = 0;
        for (const report of pending) {
            try {
                // eslint-disable-next-line no-unused-vars
                const { localId, synced, mediaFile, ...cleanReport } = report;
                if (!cleanReport.mediaUrl) delete cleanReport.mediaUrl;
                await api.post('/api/incidents', cleanReport);
                await markReportSynced(localId);
                success++;
            } catch (err) {
                console.error(err);
            }
        }

        if (success) {
            toast.success(`Synced ${success}`, { id: 'sync' });
            window.dispatchEvent(new Event('offline-sync-complete'));
        } else {
            await clearPendingReports();
            toast.dismiss('sync');
        }
    };

    useEffect(() => {
        window.addEventListener('online', flushOfflineQueue);
        if (navigator.onLine) flushOfflineQueue();

        // 🚨 Robust Background Sync: Periodically check for pending reports even if online events were missed
        const syncInterval = setInterval(() => {
            if (navigator.onLine) flushOfflineQueue();
        }, 30000);

        return () => {
            window.removeEventListener('online', flushOfflineQueue);
            clearInterval(syncInterval);
        };
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('google_token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    // Check expiration
                    if (decoded.exp * 1000 < Date.now()) {
                        localStorage.removeItem('google_token');
                        setUser(null);
                        return;
                    }
                    setUser(decoded);
                    updateSocketToken(token);
                    syncUserContext();
                } catch (err) {
                    console.error('Invalid token', err);
                    localStorage.removeItem('google_token');
                }
            }
        };

        initAuth();

        const handleLoginSuccess = () => initAuth();
        window.addEventListener('google-login-success', handleLoginSuccess);
        
        return () => {
            window.removeEventListener('google-login-success', handleLoginSuccess);
        };
    }, []);

    const logout = async () => {
        localStorage.removeItem('google_token');
        setUser(null);
        toast.success('Logged out');
    };

    return (
        <ErrorBoundary>
            <TacticalProvider>
                <UIProvider>
                    <Router>
                        <Toaster position="top-center" />

                        <AppLayout user={user} logout={logout}>
                            <Suspense fallback={<PageLoader />}>
                                <AnimatedRoutes />
                            </Suspense>
                        </AppLayout>
                    </Router>
                </UIProvider>
            </TacticalProvider>
        </ErrorBoundary>
    );
}

export default App;
