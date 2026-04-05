import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Activity, Map as MapIcon, BarChart2, ShieldAlert, LogIn, LogOut, Wifi, WifiOff, DatabaseZap } from 'lucide-react';
import { Button } from '../ui/Button';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

const NavLink = ({ to, icon: Icon, children, currentPath, onClick }) => {
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
};

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-500 ${
            isOnline 
            ? 'bg-emerald/5 border-emerald/20 text-emerald' 
            : 'bg-danger/5 border-danger/20 text-danger animate-pulse'
        }`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                {isOnline ? 'Cloud Sync Active' : 'Edge Mode Active'}
            </span>
            {!isOnline && <DatabaseZap size={12} className="text-amber" />}
        </div>
    );
};

export const Navbar = ({ user, login }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    return (
        <header className="sticky top-0 z-50 glass-nav">
            <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-20 flex justify-between items-center">
                
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-4 group text-decoration-none">
                        <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-danger to-red-900 rounded-xl border border-danger/30 shadow-danger group-hover:shadow-[0_0_30px_rgba(255,51,102,0.5)] transition-all duration-500">
                            <Shield className="text-white w-5 h-5" />
                        </div>
                        <div className="hidden md:flex flex-col">
                            <h1 className="text-lg font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Rapid <span className="text-danger font-black">Crisis</span> Response
                            </h1>
                            <span className="text-[10px] text-electric tracking-[0.2em] font-mono opacity-80 uppercase">Command Center</span>
                        </div>
                    </Link>

                    <div className="hidden xl:block">
                        <NetworkStatus />
                    </div>
                </div>

                <nav className="hidden lg:flex items-center gap-2">
                    <NavLink to="/" icon={Activity} currentPath={location.pathname}>Overview</NavLink>
                    <NavLink to="/map" icon={MapIcon} currentPath={location.pathname}>Live Map</NavLink>
                    <NavLink to="/dashboard" icon={BarChart2} currentPath={location.pathname}>Analytics</NavLink>
                    <div className="w-px h-8 bg-white/5 mx-2"></div>
                    <Link to="/report">
                        <button className="bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(255,51,102,0.2)] flex items-center gap-2">
                            <ShieldAlert size={18} />
                            SOS Report
                        </button>
                    </Link>
                </nav>

                <div className="hidden lg:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4 bg-white/5 pr-4 pl-1 py-1 rounded-full border border-white/10">
                            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=0D8ABC&color=fff`} alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
                            <span className="text-xs font-medium text-slate-300 max-w-[100px] truncate">{user.email}</span>
                            <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-danger ml-2 transition-colors">
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <Button variant="secondary" onClick={login} className="px-6 py-2.5 text-sm">
                            <LogIn size={18} /> Login
                        </Button>
                    )}
                </div>

                <button 
                    className="lg:hidden p-2 text-slate-400 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden absolute top-20 left-0 w-full bg-navy-900/95 backdrop-blur-xl border-b border-white/5 p-6 flex flex-col gap-6"
                    >
                        <nav className="flex flex-col gap-2">
                            <NavLink to="/" icon={Activity} currentPath={location.pathname} onClick={() => setIsMobileMenuOpen(false)}>Overview</NavLink>
                            <NavLink to="/map" icon={MapIcon} currentPath={location.pathname} onClick={() => setIsMobileMenuOpen(false)}>Live Map</NavLink>
                            <NavLink to="/dashboard" icon={BarChart2} currentPath={location.pathname} onClick={() => setIsMobileMenuOpen(false)}>Analytics</NavLink>
                            <Link to="/report" onClick={() => setIsMobileMenuOpen(false)} className="mt-4 flex items-center justify-center gap-2 bg-danger/20 text-danger border border-danger/50 px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-wider">
                                <ShieldAlert size={18} /> Report SOS
                            </Link>
                        </nav>
                        
                        {user ? (
                            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=0D8ABC&color=fff`} alt="Profile" className="w-10 h-10 rounded-full" />
                                    <span className="text-sm font-medium text-slate-300 truncate">{user.email}</span>
                                </div>
                                <button onClick={() => { signOut(auth); setIsMobileMenuOpen(false); }} className="p-2 text-slate-400 hover:text-danger">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <Button variant="secondary" onClick={() => { login(); setIsMobileMenuOpen(false); }} className="w-full">
                                <LogIn size={20} /> Sign In
                            </Button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};
