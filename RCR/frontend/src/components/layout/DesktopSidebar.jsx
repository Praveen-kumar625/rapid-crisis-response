import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    LayoutDashboard, 
    ShieldAlert, 
    Map as MapIcon, 
    BarChart3, 
    ChevronLeft, 
    ChevronRight,
    User,
    Wifi,
    WifiOff,
    LogOut,
    Settings,
    Bell
} from 'lucide-react';
import { useUI } from '../../context/UIContext';

const NavItem = ({ to, icon: Icon, label, isExpanded, isActive }) => (
    <Link
        to={to}
        className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
            isActive 
            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
        }`}
    >
        <Icon size={20} className={`shrink-0 ${isActive ? 'text-cyan-400' : 'group-hover:scale-110 transition-transform'}`} />
        <span className={`font-bold tracking-wide text-xs uppercase overflow-hidden whitespace-nowrap transition-all duration-300 ${
            isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
        }`}>
            {label}
        </span>
        
        {!isExpanded && (
            <div className="absolute left-16 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-[10px] font-black text-cyan-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100] whitespace-nowrap shadow-xl">
                {label}
            </div>
        )}
    </Link>
);

export const DesktopSidebar = ({ user, logout }) => {
    const { isSidebarExpanded, toggleSidebar } = useUI();
    const location = useLocation();
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
        <motion.aside
            initial={false}
            animate={{ width: isSidebarExpanded ? 256 : 80 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden md:flex flex-col h-screen sticky top-0 left-0 bg-[#0B0F19] border-r border-slate-800/60 z-[100] shrink-0 overflow-hidden"
        >
            {/* LOGO SECTION */}
            <div className="h-20 flex items-center px-6 border-b border-slate-800/40 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                        <ShieldAlert className="text-red-500 w-6 h-6 animate-pulse" />
                    </div>
                    {isSidebarExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col"
                        >
                            <span className="text-sm font-black text-white leading-none tracking-tighter">RAPID_CRISIS</span>
                            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em]">Response_V4</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 custom-scrollbar">
                <NavItem to="/" icon={LayoutDashboard} label="Command_Center" isExpanded={isSidebarExpanded} isActive={location.pathname === '/'} />
                <NavItem to="/map" icon={MapIcon} label="Tactical_Grid" isExpanded={isSidebarExpanded} isActive={location.pathname === '/map'} />
                <NavItem to="/hud" icon={ShieldAlert} label="Active_Breach" isExpanded={isSidebarExpanded} isActive={location.pathname === '/hud'} />
                <NavItem to="/dashboard" icon={BarChart3} label="Intel_Analytics" isExpanded={isSidebarExpanded} isActive={location.pathname === '/dashboard'} />
                
                <div className="h-px bg-slate-800/40 my-6 mx-2" />
                
                <NavItem to="/report" icon={Bell} label="Signal_Relay" isExpanded={isSidebarExpanded} isActive={location.pathname === '/report'} />
                <NavItem to="/settings" icon={Settings} label="System_Config" isExpanded={isSidebarExpanded} isActive={location.pathname === '/settings'} />
            </nav>

            {/* FOOTER SECTION */}
            <div className="p-4 bg-slate-900/20 border-t border-slate-800/60 shrink-0">
                {/* SYSTEM STATUS */}
                <div className={`mb-4 flex items-center gap-4 px-4 py-2 rounded-lg border ${
                    isOnline ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
                }`}>
                    {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {isSidebarExpanded && (
                        <span className="text-[9px] font-black uppercase tracking-widest truncate">
                            {isOnline ? 'LINK_ESTABLISHED' : 'LINK_SEVERED'}
                        </span>
                    )}
                </div>

                {/* USER PROFILE */}
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        <User size={20} className="text-slate-400" />
                    </div>
                    {isSidebarExpanded && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate uppercase">{user?.email?.split('@')[0] || 'GUEST_NODE'}</p>
                            <button 
                                onClick={logout}
                                className="text-[9px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                            >
                                <LogOut size={10} /> Disconnect
                            </button>
                        </div>
                    )}
                </div>

                {/* COLLAPSE TOGGLE */}
                <button 
                    onClick={toggleSidebar}
                    className="mt-6 w-full py-2 flex items-center justify-center text-slate-500 hover:text-cyan-400 border border-slate-800/60 hover:bg-slate-800/40 transition-all rounded-lg"
                >
                    {isSidebarExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>
        </motion.aside>
    );
};
