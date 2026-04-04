// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Dashboard from './pages/Dashboard';
import ReportPage from './pages/ReportPage';
import { joinHotelRoom } from './socket';
import api from './api';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch user profile to get hotelId
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
        try { await signInWithPopup(auth, googleProvider); } catch (err) { console.error('Login Failed', err); }
    };

    const sendPulse = async (status) => {
        try {
            await api.post('/incidents/pulse', { status });
            toast.success(`Safety status updated: ${status}`);
        } catch (err) {
            toast.error('Failed to send safety pulse');
        }
    };

    return (
        <Router>
            <Toaster position="top-right" />
            <header className="bg-[#0f172a] text-white p-4 shadow-xl flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-opacity-90 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        <span className="font-black text-xl">R</span>
                    </div>
                    <h1 className="text-xl font-light tracking-tighter uppercase hidden lg:block">
                        Rapid <span className="font-bold text-red-500">Crisis</span> Response
                    </h1>
                </div>

                {user && (
                    <div className="flex gap-2">
                        <button onClick={() => sendPulse('SAFE')} className="bg-green-600/20 border border-green-500/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all">I AM SAFE</button>
                        <button onClick={() => sendPulse('UNSAFE')} className="bg-red-600/20 border border-red-500/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">I NEED HELP</button>
                    </div>
                )}

                <nav className="flex items-center gap-6">
                    <Link to="/" className="text-sm uppercase tracking-widest font-bold hover:text-red-500 transition-colors">Home</Link>
                    <Link to="/map" className="text-sm uppercase tracking-widest font-bold hover:text-red-500 transition-colors">Map</Link>
                    <Link to="/dashboard" className="text-sm uppercase tracking-widest font-bold hover:text-red-500 transition-colors text-amber-500">Analytics</Link>
                    <Link to="/report" className="bg-red-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg">Report SOS</Link>
                    {user ? (
                        <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    ) : (
                        <button onClick={login} className="text-sm uppercase tracking-widest font-bold border border-slate-700 px-4 py-2 rounded-full hover:bg-slate-800 transition-all">Login</button>
                    )}
                </nav>
            </header>
            <main className="min-h-screen bg-[#f8fafc]">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/report" element={<ReportPage />} />
                </Routes>
            </main>
        </Router>
    );
}

export default App;