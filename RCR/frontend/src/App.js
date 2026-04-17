import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './utils/firebase';
import toast, { Toaster } from 'react-hot-toast';

import { joinHotelRoom, updateSocketToken } from './socket';
import api from './api';
import { AppLayout } from './components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import { handleRedirectResult } from './utils/firebase';

import { getPendingReports, markReportSynced } from './idb';

// Lazy pages
const Home = lazy(() => import('./pages/Home'));
const TacticalDashboard = lazy(() => import('./pages/TacticalDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const IncidentDetail = lazy(() => import('./pages/IncidentDetail'));
const TacticalHUD = lazy(() => import('./pages/TacticalHUD'));
const TacticalMobileHUD = lazy(() => import('./pages/TacticalMobileHUD'));

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
                <Route path="/map" element={<PageTransition><TacticalDashboard /></PageTransition>} />
                <Route path="/dashboard" element={<PageTransition><Analytics /></PageTransition>} />
                <Route path="/report" element={<PageTransition><ReportPage /></PageTransition>} />
                <Route path="/incidents/:id" element={<PageTransition><IncidentDetail /></PageTransition>} />
                <Route path="/hud" element={<PageTransition><TacticalHUD /></PageTransition>} />
                <Route path="/mobile-hud" element={<PageTransition><TacticalMobileHUD /></PageTransition>} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    const [user, setUser] = useState(null);

<<<<<<< HEAD
    const flushOfflineQueue = async () => {
        const pending = await getPendingReports();
        if (pending.length === 0) return;

        const timeoutId = setTimeout(() => {
            toast.error('Sync process timed out. Retrying in background.', { id: 'sync-progress' });
        }, 10000); // Higher timeout for batch sync

        toast.loading(`Syncing ${pending.length} offline reports...`, { id: 'sync-progress' });
        
        let successCount = 0;
        for (const report of pending) {
            try {
                await api.post('/incidents', report);
                await markReportSynced(report.localId);
                successCount++;
            } catch (err) {
                console.error('Failed to sync report:', report.localId);
            }
        }

        clearTimeout(timeoutId);
        if (successCount > 0) {
            toast.success(`Successfully synced ${successCount} reports`, { id: 'sync-progress' });
            // Trigger a refresh if on a page that shows incidents
            window.dispatchEvent(new Event('offline-sync-complete'));
        } else {
            toast.error('Offline sync failed. Retrying later.', { id: 'sync-progress' });
        }
    };

    useEffect(() => {
        window.addEventListener('online', flushOfflineQueue);
        if (navigator.onLine) flushOfflineQueue();
        return () => window.removeEventListener('online', flushOfflineQueue);
    }, []);

=======
    // ✅ FIXED: Now joinHotelRoom is USED
>>>>>>> 5c219bc (Update)
    const syncUserContext = async () => {
        try {
            const { data } = await api.get('/incidents/me');
            if (data.hotelId) {
                joinHotelRoom(data.hotelId);
            }
        } catch (err) {
            console.error('Context sync failed', err);
        }
    };

    const flushOfflineQueue = async () => {
        const pending = await getPendingReports();
        if (!pending.length) return;

        toast.loading(`Syncing ${pending.length} reports...`, { id: 'sync' });

        let success = 0;
        for (const report of pending) {
            try {
                await api.post('/incidents', report);
                await markReportSynced(report.localId);
                success++;
            } catch (err) {
                console.error(err);
            }
        }

        if (success) {
            toast.success(`Synced ${success}`, { id: 'sync' });
            window.dispatchEvent(new Event('offline-sync-complete'));
        } else {
            toast.error('Sync failed', { id: 'sync' });
        }
    };

    useEffect(() => {
        window.addEventListener('online', flushOfflineQueue);
        if (navigator.onLine) flushOfflineQueue();

        return () => window.removeEventListener('online', flushOfflineQueue);
    }, []);

    useEffect(() => {
        handleRedirectResult().catch(console.error);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const token = await firebaseUser.getIdToken();

                localStorage.setItem('google_token', token);
                setUser(firebaseUser);

                updateSocketToken(token);
                syncUserContext(); // ✅ USED HERE

            } else {
                localStorage.removeItem('google_token');
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await auth.signOut();
            localStorage.removeItem('google_token');
            setUser(null);
            toast.success('Logged out');
        } catch {
            toast.error('Logout failed');
        }
    };

    return (
        <ErrorBoundary>
            <Router>
                <Toaster position="top-center" />

                <AppLayout user={user} logout={logout}>
                    <Suspense fallback={<PageLoader />}>
                        <AnimatedRoutes />
                    </Suspense>
                </AppLayout>
            </Router>
        </ErrorBoundary>
    );
}

export default App;