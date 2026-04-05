import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';
import { joinHotelRoom } from './socket';
import api from './api';
import { AppLayout } from './components/layout/AppLayout';

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

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const { data } = await api.get('/incidents/me');
                    if (data.hotelId) {
                        joinHotelRoom(data.hotelId);
                    }
                } catch (err) {
                    console.error('Failed to sync user context', err);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const login = async() => {
        try { 
            await signInWithPopup(auth, googleProvider); 
            toast.success('Successfully authenticated', {
                style: { background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)' }
            });
        } catch (err) { 
            console.error('Login Failed', err); 
            toast.error('Authentication failed');
        }
    };

    return (
        <Router>
            <Toaster 
                position="top-center" 
                toastOptions={{ 
                    className: 'glass-card border border-white/10 text-white text-xs font-bold uppercase tracking-widest py-4 px-6 shadow-2xl',
                    style: { background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)' }
                }} 
            />
            
            <AppLayout user={user} login={login}>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/map" element={<MapPage />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/report" element={<ReportPage />} />
                        <Route path="/incidents/:id" element={<IncidentDetail />} />
                    </Routes>
                </Suspense>
            </AppLayout>
        </Router>
    );
}

export default App;
