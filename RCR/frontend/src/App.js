import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './utils/firebase';
import { jwtDecode } from 'jwt-decode';
import toast, { Toaster } from 'react-hot-toast';
import { joinHotelRoom, updateSocketToken } from './socket';
import api from './api';
import { AppLayout } from './components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';


// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const TacticalDashboard = lazy(() => import('./pages/TacticalDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const IncidentDetail = lazy(() => import('./pages/IncidentDetail'));
const TacticalHUD = lazy(() => import('./pages/TacticalHUD'));

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
                <Route path="/map" element={<PageTransition><TacticalDashboard /></PageTransition>} />
                <Route path="/dashboard" element={<PageTransition><Analytics /></PageTransition>} />
                <Route path="/report" element={<PageTransition><ReportPage /></PageTransition>} />
                <Route path="/incidents/:id" element={<PageTransition><IncidentDetail /></PageTransition>} />
                <Route path="/hud" element={<PageTransition><TacticalHUD /></PageTransition>} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    const [user, setUser] = useState(null);

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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const token = await firebaseUser.getIdToken();
                localStorage.setItem('google_token', token);
                setUser(firebaseUser);
                updateSocketToken(token);
                syncUserContext();
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
            toast.success('Logged out successfully');
        } catch (err) {
            toast.error('Logout failed');
        }
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
