import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';
import { Activity, Map as MapIcon, BarChart2, ShieldAlert, LogOut, LogIn, Menu, X, Shield } from 'lucide-react';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Dashboard from './pages/Dashboard';
import ReportPage from './pages/ReportPage';
import { joinHotelRoom } from './socket';
import api from './api';

function NavLink({ to, icon: Icon, children, currentPath, onClick }) {
    const isActive = currentPath === to;
    return (
        <Link 
            to={to} 
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive 
                ? 'bg-electric/10 text-electric border border-electric/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
            }`}
        >
            <Icon size={18} className={isActive ? 'text-electric' : ''} />
            <span className="tracking-wide">{children}</span>
        </Link>
    );
}

function AppContent() {
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

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
        try { await signInWithPopup(auth, googleProvider); } catch (err) { console.error('Login Failed', err); }
    };

    const sendPulse = async (status) => {
        try {
            await api.post('/incidents/pulse', { status });
            toast.success(`Safety status updated: ${status}`, {
                style: { background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)' }
            });
        } catch (err) {
            toast.error('Failed to send safety pulse', {
                style: { background: '#0f172a', color: '#ff3366', border: '1px solid rgba(255,51,102,0.2)' }
            });
        }
    };

    return (
        <div className="min-h-screen bg-navy-900 text-slate-200 selection:bg-electric/30 selection:text-white flex flex-col font-sans">
            <Toaster position="top-center" toastOptions={{ className: 'backdrop-blur-xl bg-surface border border-surfaceBorder text-white' }} />
            
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 glass-card rounded-none border-t-0 border-x-0 border-b border-surfaceBorder">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-20 flex justify-between items-center">
                    
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-4 group">
                        <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-danger to-red-900 rounded-xl border border-danger/30 shadow-[0_0_20px_rgba(255,51,102,0.3)] group-hover:shadow-[0_0_30px_rgba(255,51,102,0.5)] transition-all duration-500">
                            <Shield className="text-white w-5 h-5" />
                        </div>
                        <div className="hidden lg:flex flex-col">
                            <h1 className="text-lg font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                                Rapid <span className="text-danger font-black">Crisis</span> Response
                            </h1>
                            <span className="text-[10px] text-electric tracking-[0.2em] font-mono opacity-80">Command Center</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-2">
                        <NavLink to="/" icon={Activity} currentPath={location.pathname}>Overview</NavLink>
                        <NavLink to="/map" icon={MapIcon} currentPath={location.pathname}>Live Map</NavLink>
                        <NavLink to="/dashboard" icon={BarChart2} currentPath={location.pathname}>Analytics</NavLink>
                        
                        <div className="w-px h-8 bg-surfaceBorder mx-2"></div>
                        
                        <Link to="/report" className="flex items-center gap-2 bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(255,51,102,0.2)] hover:shadow-[0_0_25px_rgba(255,51,102,0.5)]">
                            <ShieldAlert size={18} />
                            Report SOS
                        </Link>
                    </nav>

                    {/* Actions & Profile */}
                    <div className="hidden lg:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex gap-2">
                                    <button onClick={() => sendPulse('SAFE')} className="glass-button text-emerald hover:text-white hover:bg-emerald hover:border-emerald px-4 py-2 text-xs font-bold uppercase tracking-wider">I AM SAFE</button>
                                    <button onClick={() => sendPulse('UNSAFE')} className="glass-button text-danger hover:text-white hover:bg-danger hover:border-danger px-4 py-2 text-xs font-bold uppercase tracking-wider">I NEED HELP</button>
                                </div>
                                <div className="w-px h-8 bg-surfaceBorder"></div>
                                <div className="flex items-center gap-3 bg-white/5 pr-4 pl-1 py-1 rounded-full border border-white/10">
                                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=0D8ABC&color=fff`} alt="Profile" className="w-8 h-8 rounded-full border border-surfaceBorder" />
                                    <span className="text-xs font-medium text-slate-300 max-w-[100px] truncate">{user.email}</span>
                                    <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-danger ml-2 transition-colors">
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={login} className="flex items-center gap-2 glass-button text-slate-300 hover:text-white px-6 py-2.5 text-sm font-bold uppercase tracking-wider">
                                <LogIn size={18} />
                                Login
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="lg:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-navy-900/95 backdrop-blur-xl pt-24 px-6 flex flex-col gap-6">
                    <nav className="flex flex-col gap-2">
                        <NavLink to="/" icon={Activity} currentPath={location.pathname} onClick={() => setIsMobileMenuOpen(false)}>Overview</NavLink>
                        <NavLink to="/map" icon={MapIcon} currentPath={location.pathname} onClick={() => setIsMobileMenuOpen(false)}>Live Map</NavLink>
                        <NavLink to="/dashboard" icon={BarChart2} currentPath={location.pathname} onClick={() => setIsMobileMenuOpen(false)}>Analytics</NavLink>
                        <Link to="/report" onClick={() => setIsMobileMenuOpen(false)} className="mt-4 flex items-center justify-center gap-2 bg-danger/20 text-danger border border-danger/50 px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-wider">
                            <ShieldAlert size={18} />
                            Report SOS
                        </Link>
                    </nav>

                    <div className="h-px w-full bg-surfaceBorder mt-4"></div>

                    {user ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3">
                                <button onClick={() => { sendPulse('SAFE'); setIsMobileMenuOpen(false); }} className="w-full border border-emerald/30 text-emerald hover:bg-emerald/10 px-4 py-4 rounded-xl text-sm font-bold uppercase tracking-wider">I AM SAFE</button>
                                <button onClick={() => { sendPulse('UNSAFE'); setIsMobileMenuOpen(false); }} className="w-full bg-danger/20 border border-danger/50 text-danger hover:bg-danger/30 px-4 py-4 rounded-xl text-sm font-bold uppercase tracking-wider">I NEED HELP</button>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-3">
                                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=0D8ABC&color=fff`} alt="Profile" className="w-10 h-10 rounded-full border border-surfaceBorder" />
                                    <span className="text-sm font-medium text-slate-300 truncate">{user.email}</span>
                                </div>
                                <button onClick={() => { signOut(auth); setIsMobileMenuOpen(false); }} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-danger">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => { login(); setIsMobileMenuOpen(false); }} className="flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-wider">
                            <LogIn size={20} />
                            Sign In to Command Center
                        </button>
                    )}
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-0">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/report" element={<ReportPage />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
