import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, Shield, Activity, Map as MapIcon, BarChart2,
    ShieldAlert, LogOut, Wifi, WifiOff, LogIn
} from 'lucide-react';

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
    const [isSocketConnected, setIsSocketConnected] = React.useState(false);

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        let socket;

        (async () => {
            const { getSocket } = await import('../../socket');
            socket = await getSocket();
            setIsSocketConnected(socket.connected);

            socket.on('connect', () => setIsSocketConnected(true));
            socket.on('disconnect', () => setIsSocketConnected(false));
        })();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            socket?.off('connect');
            socket?.off('disconnect');
        };
    }, []);

    const status = !isOnline
        ? 'OFFLINE'
        : (isSocketConnected ? 'LIVE_SYNC' : 'RECONNECTING');

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 border font-mono ${
            status === 'LIVE_SYNC'
                ? 'bg-slate-900 border-slate-700 text-emerald-500'
                : status === 'RECONNECTING'
                    ? 'bg-amber-900/30 border-amber-700 text-amber-500 animate-pulse'
                    : 'bg-red-900 border-red-700 text-red-200 animate-pulse'
        }`}>
            {status === 'LIVE_SYNC' ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="text-[9px] font-black uppercase hidden sm:inline">
                {status}
            </span>
        </div>
    );
};

export const Navbar = ({ user, logout }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <>
            {/* DESKTOP */}
            <header className="sticky top-0 z-50 bg-[#151B2B] border-b border-slate-800 hidden md:block">
                <div className="max-w-screen-2xl mx-auto px-4 h-16 flex justify-between items-center">

                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 border border-slate-700 flex items-center justify-center">
                                <Shield className="text-cyan-400 w-4 h-4" />
                            </div>
                            <div>
                                <h1 className="text-xs font-black text-white uppercase">
                                    RAPID <span className="text-cyan-400">CRISIS</span> RESPONSE
                                </h1>
                            </div>
                        </Link>

                        <NetworkStatus />
                    </div>

                    <nav className="hidden lg:flex items-center gap-1">
                        <NavLink to="/" icon={Activity} currentPath={location.pathname}>Overview</NavLink>
                        <NavLink to="/map" icon={MapIcon} currentPath={location.pathname}>Live Map</NavLink>
                        <NavLink to="/hud" icon={Shield} currentPath={location.pathname}>Tactical HUD</NavLink>
                        <NavLink to="/dashboard" icon={BarChart2} currentPath={location.pathname}>Analytics</NavLink>

                        <div className="w-px h-6 bg-slate-800 mx-2"></div>

                        <Link to="/report">
                            <button className="bg-red-600 text-white px-5 py-2 text-xs font-black uppercase flex items-center gap-2">
                                <ShieldAlert size={16} />
                                SOS
                            </button>
                        </Link>
                    </nav>

                    {/* AUTH */}
                    <div className="hidden lg:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3 bg-slate-900 px-3 py-1 border border-slate-800">
                                <span className="text-[10px] text-white truncate max-w-[150px]">
                                    {user.email}
                                </span>
                                <button onClick={logout}>
                                    <LogOut size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate("/login")}
                                className="bg-slate-800 text-cyan-400 border border-slate-700 px-4 py-2 text-[10px] font-black uppercase flex items-center gap-2"
                            >
                                <LogIn size={14} />
                                SECURE_LOGIN
                            </button>
                        )}
                    </div>

                    <button
                        className="lg:hidden text-slate-400"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </header>

            {/* MOBILE */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-[60] bg-[#0B0F19] lg:hidden flex flex-col"
                    >
                        <div className="h-16 flex justify-between items-center px-4 border-b border-slate-800">
                            <span className="text-xs font-black text-cyan-400">MENU</span>
                            <button onClick={() => setIsMobileMenuOpen(false)}>
                                <X size={26} />
                            </button>
                        </div>

                        <div className="flex flex-col p-6 gap-4">
                            <Link onClick={() => setIsMobileMenuOpen(false)} to="/">Overview</Link>
                            <Link onClick={() => setIsMobileMenuOpen(false)} to="/map">Live Map</Link>
                            <Link onClick={() => setIsMobileMenuOpen(false)} to="/hud">Tactical HUD</Link>
                            <Link onClick={() => setIsMobileMenuOpen(false)} to="/dashboard">Analytics</Link>

                            <button
                                onClick={() => {
                                    navigate("/login");
                                    setIsMobileMenuOpen(false);
                                }}
                                className="mt-6 bg-slate-800 text-cyan-400 border border-slate-700 p-4 text-xs font-black uppercase flex justify-center gap-3"
                            >
                                <LogIn size={18} />
                                SECURE_LOGIN_PORTAL
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
