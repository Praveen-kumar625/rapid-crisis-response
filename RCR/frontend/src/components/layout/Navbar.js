// RE-THEMED: Solid Tactical
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Activity, Map as MapIcon, BarChart2, ShieldAlert, LogIn, LogOut, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

const NavLink = ({ to, icon: Icon, children, currentPath, onClick }) => {
    const isActive = currentPath === to;
    return (
        <Link 
            to={to} 
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                isActive 
                ? 'bg-slate-700 text-cyan-400 border border-slate-600' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
        >
            <Icon size={16} className={isActive ? 'text-cyan-400' : ''} />
            <span>{children}</span>
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
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-none border font-mono ${
            isOnline 
            ? 'bg-slate-900 border-slate-700 text-emerald-500' 
            : 'bg-red-900 border-red-700 text-red-200 animate-pulse'
        }`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                {isOnline ? 'CLOUD_SYNC_ACTIVE' : 'EDGE_MODE_ACTIVE'}
            </span>
        </div>
    );
};

export const Navbar = ({ user, login, logout }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const handleLoginSuccess = (credentialResponse) => {
        const token = credentialResponse.credential;
        localStorage.setItem('google_token', token);
        window.location.reload(); 
    };

    return (
        <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700 shadow-none">
            <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
                
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-4 group text-decoration-none" aria-label="RCR Home">
                        <div className="relative flex items-center justify-center w-8 h-8 bg-slate-800 border border-slate-600 rounded-none transition-all duration-300">
                            <Shield className="text-cyan-400 w-4 h-4" />
                        </div>
                        <div className="hidden md:flex flex-col">
                            <h1 className="text-sm font-black tracking-widest uppercase text-white">
                                RAPID <span className="text-cyan-400">CRISIS</span> RESPONSE
                            </h1>
                            <span className="text-[8px] text-amber-500 tracking-[0.2em] font-mono opacity-80 uppercase">OP_TERMINAL_V4</span>
                        </div>
                    </Link>

                    <div className="hidden xl:block">
                        <NetworkStatus />
                    </div>
                </div>

                <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
                    <NavLink to="/" icon={Activity} currentPath={location.pathname}>Overview</NavLink>
                    <NavLink to="/map" icon={MapIcon} currentPath={location.pathname}>Live Map</NavLink>
                    <NavLink to="/dashboard" icon={BarChart2} currentPath={location.pathname}>Analytics</NavLink>
                    <div className="w-px h-6 bg-slate-700 mx-2"></div>
                    <Link to="/report" aria-label="Initiate SOS Report">
                        <button className="bg-amber-500 text-black border border-amber-300 hover:bg-amber-400 px-4 py-2 rounded-none text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-2">
                            <ShieldAlert size={16} />
                            SOS_REPORT
                        </button>
                    </Link>
                </nav>

                <div className="hidden lg:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4 bg-slate-800 px-3 py-1 rounded-none border border-slate-700">
                            <span className="text-[10px] font-mono font-bold text-slate-300 max-w-[150px] truncate">{user.email?.toUpperCase() || 'AUTHORIZED_USER'}</span>
                            <button onClick={logout} className="text-slate-500 hover:text-red-500 transition-colors" aria-label="Logout">
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <GoogleLogin
                            onSuccess={handleLoginSuccess}
                            onError={() => toast.error('Login Failed')}
                            theme="dark"
                            shape="square"
                            size="medium"
                        />
                    )}
                </div>

                <button 
                    className="lg:hidden p-2 text-slate-400 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
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
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="lg:hidden fixed inset-0 top-16 z-40 bg-slate-900/95 backdrop-blur-xl p-6 flex flex-col gap-8 border-t border-slate-700"
                    >
                        <motion.nav 
                            initial="initial"
                            animate="animate"
                            variants={{
                                animate: {
                                    transition: { staggerChildren: 0.05 }
                                }
                            }}
                            className="flex flex-col gap-2"
                            aria-label="Mobile Navigation"
                        >
                            {[
                                { to: "/", icon: Activity, label: "Overview" },
                                { to: "/map", icon: MapIcon, label: "Live Map" },
                                { to: "/dashboard", icon: BarChart2, label: "Analytics" }
                            ].map((link) => (
                                <motion.div 
                                    key={link.to}
                                    variants={{
                                        initial: { opacity: 0, x: -10 },
                                        animate: { opacity: 1, x: 0 }
                                    }}
                                >
                                    <NavLink to={link.to} icon={link.icon} currentPath={location.pathname} onClick={() => setIsMobileMenuOpen(false)}>
                                        {link.label}
                                    </NavLink>
                                </motion.div>
                            ))}
                            
                            <motion.div
                                variants={{
                                    initial: { opacity: 0, x: -10 },
                                    animate: { opacity: 1, x: 0 }
                                }}
                                className="mt-4"
                            >
                                <Link to="/report" onClick={() => setIsMobileMenuOpen(false)}>
                                    <button className="w-full bg-amber-500 text-black border border-amber-300 px-4 py-4 rounded-none text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 active:bg-amber-400 transition-colors">
                                        <ShieldAlert size={20} />
                                        SOS_REPORT_SIGNAL
                                    </button>
                                </Link>
                            </motion.div>
                        </motion.nav>
                        
                        <div className="mt-auto pb-8 border-t border-slate-800 pt-8">
                            <NetworkStatus />
                            
                            {user ? (
                                <div className="mt-6 flex items-center justify-between bg-slate-800 p-4 border border-slate-700">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
                                            <Shield size={20} className="text-cyan-400" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{user.email}</p>
                                            <p className="text-[8px] text-cyan-500 font-mono uppercase tracking-widest">Authorized_Intel</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors" aria-label="Sign Out">
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-6">
                                    <GoogleLogin
                                        onSuccess={handleLoginSuccess}
                                        onError={() => toast.error('Login Failed')}
                                        theme="dark"
                                        shape="square"
                                        width="100%"
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};
