import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUI } from '../../context/UIContext';

// Safe Inline Icons
const Icons = {
    Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
    Map: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.617a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.5v15"/><path d="M9 3.5v15"/></svg>,
    Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
    Logs: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
    User: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    Chevron: ({ rotate = 0 }) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rotate}deg)` }}><path d="m15 18-6-6 6-6"/></svg>
};

const NavItem = ({ to, icon: Icon, label, collapsed }) => (
    <NavLink 
        to={to} 
        className={({ isActive }) => `
            flex items-center gap-4 px-4 py-3 rounded-none border-l-2 transition-all
            ${isActive 
                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[inset_10px_0_20px_-10px_rgba(6,182,212,0.2)]' 
                : 'border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}
        `}
    >
        <div className="shrink-0"><Icon /></div>
        {!collapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>}
    </NavLink>
);

export const DesktopSidebar = ({ user, logout }) => {
    const { isSidebarExpanded, toggleSidebar } = useUI();

    return (
        <motion.aside 
            animate={{ width: isSidebarExpanded ? 240 : 80 }}
            className="hidden md:flex flex-col h-screen bg-[#0B0F19] border-r border-white/5 sticky top-0 z-50 shrink-0"
        >
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <div className="w-8 h-8 bg-cyan-600 flex items-center justify-center shrink-0">
                    <Icons.Alert />
                </div>
                {isSidebarExpanded && <span className="ml-3 font-black italic tracking-tighter text-white">RCR_CORE</span>}
            </div>

            <nav className="flex-1 py-6">
                <NavItem to="/" icon={Icons.Dashboard} label="Dashboard" collapsed={!isSidebarExpanded} />
                <NavItem to="/map" icon={Icons.Map} label="Tactical_Grid" collapsed={!isSidebarExpanded} />
                <NavItem to="/hud" icon={Icons.Alert} label="Active_Breach" collapsed={!isSidebarExpanded} />
                <NavItem to="/dashboard" icon={Icons.Logs} label="Intelligence" collapsed={!isSidebarExpanded} />
            </nav>

            <div className="mt-auto p-4 space-y-4">
                <div className={`flex items-center gap-3 px-2 ${!isSidebarExpanded && 'justify-center'}`}>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {isSidebarExpanded && <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System_Online</span>}
                </div>
                
                <div className="flex items-center gap-3 p-2 bg-slate-900/50 border border-white/5">
                    <div className="w-8 h-8 bg-slate-800 flex items-center justify-center shrink-0">
                        <Icons.User />
                    </div>
                    {isSidebarExpanded && (
                        <div className="overflow-hidden">
                            <p className="text-[9px] font-black text-white truncate uppercase">{user?.email?.split('@')[0] || 'REPSONDER_01'}</p>
                            <button onClick={logout} className="text-[8px] text-slate-500 hover:text-red-400 uppercase font-bold tracking-widest">Disconnect</button>
                        </div>
                    )}
                </div>

                <button 
                    onClick={toggleSidebar}
                    className="w-full h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <Icons.Chevron rotate={isSidebarExpanded ? 0 : 180} />
                </button>
            </div>
        </motion.aside>
    );
};

export default DesktopSidebar;
