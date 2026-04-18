import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, handleRedirectResult } from './utils/firebase';
import { Toaster } from 'react-hot-toast';
import { UIProvider } from './context/UIContext';
import { TacticalProvider } from './context/TacticalContext';
import { AppLayout } from './components/layout/AppLayout';
import { AnimatePresence } from 'framer-motion';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/login'));

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        handleRedirectResult().catch(console.error);
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });
        return () => unsubscribe();
    }, []);

    return (
        <TacticalProvider>
            <UIProvider>
                <Router>
                    <Toaster position="top-center" />
                    <AppLayout user={user} logout={() => auth.signOut()}>
                        <Suspense fallback={<div className="bg-[#020617] min-h-screen" />}>
                            <AnimatedRoutes />
                        </Suspense>
                    </AppLayout>
                </Router>
            </UIProvider>
        </TacticalProvider>
    );
}

export default App;