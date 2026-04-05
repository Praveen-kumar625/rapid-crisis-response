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
                ? 'bg-secondary/10 text-secondary-light border border-secondary/20 shadow-[0_0_15px_rgba(13,148,136,0.1)]' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
            }`}
        >
            <Icon size={18} className={isActive ? 'text-secondary-light' : ''} />
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
            ? 'bg-secondary/5 border-secondary/20 text-secondary-light' 
            : 'bg-danger/5 border-danger/20 text-danger animate-pulse'
        }`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                {isOnline ? 'Cloud Sync Active' : 'Edge Mode Active'}
            </span>
            {!isOnline && <DatabaseZap size={12} className="text-accent" />}
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
                    <Link to="/" className="flex items-center gap-4 group text-decoration-none" aria-label="RCR Home">
                        <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl border border-white/10 shadow-lg group-hover:shadow-secondary/20 transition-all duration-500">
                            <Shield className="text-white w-5 h-5" />
                        </div>
                        <div className="hidden md:flex flex-col">
                            <h1 className="text-lg font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Rapid <span className="text-secondary-light font-black">Crisis</span> Response
                            </h1>
                            <span className="text-[10px] text-accent tracking-[0.2em] font-mono opacity-80 uppercase">Operations Terminal</span>
                        </div>
                    </Link>

                    <div className="hidden xl:block">
                        <NetworkStatus />
                    </div>
                </div>

                <nav className="hidden lg:flex items-center gap-2" aria-label="Main Navigation">
                    <NavLink to="/" icon={Activity} currentPath={location.pathname}>Overview</NavLink>
                    <NavLink to="/map" icon={MapIcon} currentPath={location.pathname}>Live Map</NavLink>
                    <NavLink to="/dashboard" icon={BarChart2} currentPath={location.pathname}>Analytics</NavLink>
                    <div className="w-px h-8 bg-white/5 mx-2"></div>
                    <Link to="/report" aria-label="Initiate SOS Report">
                        <button className="bg-accent/10 text-accent border border-accent/30 hover:bg-accent hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-2">
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
                            <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-danger ml-2 transition-colors" aria-label="Logout">
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <Button variant="secondary" onClick={login} className="px-6 py-2.5 text-sm" aria-label="Login">
                            <LogIn size={18} /> Login
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
                            ].map((link, i) => (
                                <motion.div 
                                    key={i}
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
