// RE-THEMED: Solid Tactical
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Activity, Map as MapIcon, BarChart2, ShieldAlert, LogOut, Wifi, WifiOff, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../../utils/firebase';
import toast from 'react-hot-toast';

const NavLink = ({ to, icon: Icon, children, currentPath, onClick }) => {
// ... existing NavLink implementation ...
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

export const Navbar = ({ user, logout }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const handleLogin = async (isMobile = false) => {
        const timeoutId = setTimeout(() => {
            toast.error('Authentication Timeout. Please retry.', { id: 'auth' });
        }, 5000);

        try {
            toast.loading('Authenticating...', { id: 'auth' });
            await signInWithGoogle();
            clearTimeout(timeoutId);
            if (!isMobile) {
                toast.success('Successfully authenticated', { id: 'auth' });
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.error("Auth error:", err);
            toast.error('Authentication Failed. Check pop-up blockers.', { id: 'auth' });
        }
    };

    return (

        <header className="sticky top-0 z-50 bg-[#151B2B] border-b border-slate-800 shadow-none">
            <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
                
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-4 group text-decoration-none" aria-label="RCR Home">
                        <div className="relative flex items-center justify-center w-8 h-8 bg-slate-900 border border-slate-700 rounded-none transition-all duration-300">
                            <Shield className="text-cyan-400 w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-[10px] sm:text-sm font-black tracking-widest uppercase text-slate-100 truncate">
                                RAPID <span className="text-cyan-400">CRISIS</span> RESPONSE
                            </h1>
                            <span className="text-[7px] sm:text-[8px] text-amber-500 tracking-[0.2em] font-mono opacity-80 uppercase truncate">OP_TERMINAL_V4</span>
                        </div>
                    </Link>

                    <div className="hidden xl:block">
                        <NetworkStatus />
                    </div>
                </div>

                <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
                    <NavLink to="/" icon={Activity} currentPath={location.pathname}>Overview</NavLink>
                    <NavLink to="/map" icon={MapIcon} currentPath={location.pathname}>Live Map</NavLink>
                    <NavLink to="/hud" icon={Shield} currentPath={location.pathname}>Tactical HUD</NavLink>
                    <NavLink to="/dashboard" icon={BarChart2} currentPath={location.pathname}>Analytics</NavLink>
                    <div className="w-px h-6 bg-slate-800 mx-2"></div>
                    <Link to="/report" aria-label="Initiate SOS Report">
                        <button className="bg-red-600 text-white border-2 border-red-400 hover:bg-red-500 px-6 py-2.5 rounded-none text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-105 active:scale-95">
                            <ShieldAlert size={18} className="animate-pulse" />
                            CRITICAL_SOS
                        </button>
                    </Link>
                </nav>


                <div className="hidden lg:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4 bg-slate-900 px-3 py-1 rounded-none border border-slate-800">
                            <span className="text-[10px] font-mono font-bold text-slate-100 max-w-[150px] truncate">{user.email?.toUpperCase() || 'AUTHORIZED_USER'}</span>
                            <button onClick={logout} className="text-slate-500 hover:text-red-500 transition-colors" aria-label="Logout">
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleLogin}
                            className="bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                        >
                            <LogIn size={14} />
                            SECURE_LOGIN
                        </button>
                    )}
                </div>


                <button 
                    className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
                >
                    {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
                </button>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="lg:hidden fixed inset-0 z-[60] bg-[#0B0F19] flex flex-col border-l border-slate-800"
                    >
                        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-[#151B2B]">
                            <div className="flex items-center gap-3">
                                <Shield className="text-cyan-400 w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-100">Tactical_Menu</span>
                            </div>
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        <motion.nav 
                            initial="initial"
                            animate="animate"
                            variants={{
                                animate: {
                                    transition: { staggerChildren: 0.05 }
                                }
                            }}
                            className="flex-1 overflow-y-auto p-6 flex flex-col gap-4"
                            aria-label="Mobile Navigation"
                        >
                            {[
                                { to: "/", icon: Activity, label: "Overview" },
                                { to: "/map", icon: MapIcon, label: "Live Map" },
                                { to: "/hud", icon: Shield, label: "Tactical HUD" },
                                { to: "/dashboard", icon: BarChart2, label: "Analytics" }
                            ].map((link) => (
                                <motion.div 
                                    key={link.to}
                                    variants={{
                                        initial: { opacity: 0, x: 20 },
                                        animate: { opacity: 1, x: 0 }
                                    }}
                                >
                                    <Link 
                                        to={link.to} 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-4 p-4 border transition-all ${
                                            location.pathname === link.to 
                                            ? 'bg-slate-800 border-cyan-500 text-cyan-400 shadow-neon-cyan' 
                                            : 'bg-slate-900 border-slate-800 text-slate-300'
                                        }`}
                                    >
                                        <link.icon size={20} />
                                        <span className="text-xs font-black uppercase tracking-widest">{link.label}</span>
                                    </Link>
                                </motion.div>
                            ))}
                            
                            <motion.div
                                variants={{
                                    initial: { opacity: 0, x: 20 },
                                    animate: { opacity: 1, x: 0 }
                                }}
                                className="mt-4"
                            >
                                <Link to="/report" onClick={() => setIsMobileMenuOpen(false)}>
                                    <button className="w-full bg-red-600 text-white border-2 border-red-400 p-5 rounded-none text-sm font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2 active:bg-red-500 transition-colors shadow-[0_0_30px_rgba(220,38,38,0.6)]">
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert size={28} className="animate-pulse" />
                                            INITIATE_SOS_REPORT
                                        </div>
                                        <span className="text-[8px] opacity-70 tracking-[0.2em]">DIRECT TO EMERGENCY COMMAND</span>
                                    </button>
                                </Link>
                            </motion.div>
                        </motion.nav>
                        
                        <div className="p-6 bg-[#151B2B] border-t border-slate-800">
                            <NetworkStatus />
                            
                            {user ? (
                                <div className="mt-6 flex items-center justify-between bg-slate-900 p-4 border border-slate-800">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                            <Shield size={20} className="text-cyan-400" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-black text-slate-100 uppercase tracking-tight truncate">{user.email}</p>
                                            <p className="text-[8px] text-cyan-500 font-mono uppercase tracking-widest">Authorized_Intel</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors" aria-label="Sign Out">
                                        <LogOut size={24} />
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-6">
                                    <button 
                                        onClick={() => handleLogin(true)}
                                        className="w-full bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700 p-5 rounded-none text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-colors"
                                    >
                                        <LogIn size={24} />
                                        SECURE_LOGIN_PORTAL
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};
