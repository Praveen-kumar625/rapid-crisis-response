import React from "react";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';
import { useUI } from '../context/UIContext';

// Safe Inline Icons
const Icons = {
    Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
    Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
};

export const TopBar = ({ children }) => {
    const { toggleSidebar } = useUI();

    return (
        <div className="flex items-center justify-between h-full w-full px-4 bg-[#0B0F19]">
            {/* LEFT: HAMBURGER TOGGLE */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-all rounded"
                    aria-label="Toggle Navigation"
                >
                    <Icons.Menu />
                </button>
                
                <h1 className="hidden lg:block text-[10px] font-black tracking-[0.3em] text-white uppercase italic">
                    RCR_Command_Center
                </h1>
            </div>

            {/* CENTER: CUSTOM CONTENT (TickerTape etc.) */}
            <div className="flex-1 flex justify-center overflow-hidden">
                {children}
            </div>

            {/* RIGHT: EMERGENCY SOS BUTTON */}
            <div className="flex items-center gap-4 ml-4">
                <Link to="/report">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all"
                    >
                        <Icons.Alert />
                        REPORT_SOS
                    </motion.button>
                </Link>
            </div>
        </div>
    );
};

export default TopBar;
