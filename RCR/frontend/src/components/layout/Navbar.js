// RE-THEMED: Solid Tactical
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Activity, Map as MapIcon, BarChart2, ShieldAlert, LogIn, LogOut, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

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

export const Navbar = ({ user, login }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

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
                            <span className="text-[10px] font-mono font-bold text-slate-300 max-w-[150px] truncate">{user.email.toUpperCase()}</span>
                            <button onClick={() => signOut(auth)} className="text-slate-500 hover:text-red-500 transition-colors" aria-label="Logout">
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <Button variant="primary" onClick={login} className="px-4 py-2 text-[10px]" aria-label="Login">
                            <LogIn size={16} /> LOGIN
                        </Button>
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
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="lg:hidden fixed inset-0 top-20 z-40 bg-primary/95 backdrop-blur-2xl p-6 flex flex-col gap-8"
                    >
                        <motion.nav 
                            initial="initial"
                            animate="animate"
                            variants={{
                                animate: {
                                    transition: { staggerChildren: 0.1 }
                                }
                            }}
                            className="flex flex-col gap-4"
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
                                        initial: { opacity: 0, x: 20 },
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
                                    initial: { opacity: 0, x: 20 },
                                    animate: { opacity: 1, x: 0 }
                                }}
                            >
                                <Link to="/report" onClick={() => setIsMobileMenuOpen(false)} className="mt-4 flex items-center justify-center gap-3 bg-accent/20 text-accent border border-accent/50 px-5 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-accent/20">
                                    <ShieldAlert size={20} /> Report SOS Signal
                                </Link>
                            </motion.div>
                        </motion.nav>
                        
                        <div className="mt-auto pb-10">
                            <NetworkStatus />
                            <div className="h-px bg-white/5 my-8"></div>
                            
                            {user ? (
                                <div className="flex items-center justify-between bg-white/5 p-5 rounded-3xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=0D8ABC&color=fff`} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white/10" />
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[150px]">{user.email}</p>
                                            <p className="text-[10px] text-slate-500 font-mono text-gradient-accent uppercase">Authorized Intel</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { signOut(auth); setIsMobileMenuOpen(false); }} className="p-3 bg-danger/10 text-danger rounded-2xl hover:bg-danger/20 transition-all" aria-label="Sign Out">
                                        <LogOut size={24} />
                                    </button>
                                </div>
                            ) : (
                                <Button variant="secondary" onClick={() => { login(); setIsMobileMenuOpen(false); }} className="w-full py-5">
                                    <LogIn size={20} /> Sign In to Terminal
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};
