import React from "react";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';
import { useUI } from '../context/UIContext';

import TacticalButton from './ui/TacticalButton';

const Icons = {
    Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
    Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
};

export const TopBar = ({ children }) => {
    const { toggleSidebar } = useUI();

    return (
        <div className="relative flex items-center justify-between h-16 w-full px-6 bg-[#0B0F19]/40 backdrop-blur-2xl border-b border-white/5 overflow-hidden">
            {/* Background High-Tech Accents */}
            <div className="absolute top-0 left-0 w-32 h-full bg-cyan-500/[0.02] skew-x-[30deg] -translate-x-16 pointer-events-none" />
            
            {/* LEFT: TACTICAL TOGGLE */}
            <div className="flex items-center gap-6 relative z-10">
                <button 
                    onClick={toggleSidebar}
                    className="group relative p-2 text-slate-500 hover:text-cyan-400 transition-all"
                    aria-label="Toggle Navigation"
                >
                    <div className="absolute inset-0 bg-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Icons.Menu />
                </button>
                
                <div className="hidden lg:flex flex-col">
                    <h1 className="text-[10px] font-black tracking-[0.4em] text-white uppercase italic leading-none">
                        STRATEGIC_COMMAND
                    </h1>
                    <span className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">Sector_01 // Alpha_Node</span>
                </div>
            </div>

            {/* CENTER: DYNAMIC STREAM (TickerTape) */}
            <div className="flex-1 flex justify-center h-full items-center px-10">
                <div className="w-full max-w-2xl h-8 bg-black/40 border border-white/5 rounded-none relative overflow-hidden group">
                    <div className="absolute inset-y-0 left-0 w-1 bg-cyan-600 z-20" />
                    {children}
                </div>
            </div>

            {/* RIGHT: EMERGENCY PRIORITY ACTION */}
            <div className="flex items-center gap-6 relative z-10">
                <Link to="/report">
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(220,38,38,0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        className="relative flex items-center gap-3 px-6 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] border border-red-400 shadow-xl overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <Icons.Alert />
                        INITIATE_SOS
                    </motion.button>
                </Link>
            </div>
        </div>
    );
};

export default TopBar;
