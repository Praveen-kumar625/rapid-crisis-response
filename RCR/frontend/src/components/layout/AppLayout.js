// RE-THEMED: Solid Tactical
import React from 'react';
import { Navbar } from './Navbar';

export const AppLayout = ({ children, user, logout }) => {
    return (
        <div className="min-h-screen w-full flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-cyan-500 selection:text-black font-body antialiased relative overflow-hidden">
            {/* Global Tactical Overlays */}
            <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] bg-grid-pattern bg-[length:40px_40px]"></div>
            <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
                <div className="w-full h-[2px] bg-electric/20 animate-scanline opacity-20"></div>
            </div>
            
            <Navbar user={user} logout={logout} />

            <main className="flex-1 flex flex-col relative z-10">
                {children}
            </main>

            {/* Tactical Corner Accents */}
            <div className="fixed top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-white/5 pointer-events-none z-0"></div>
            <div className="fixed top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-white/5 pointer-events-none z-0"></div>
            <div className="fixed bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-white/5 pointer-events-none z-0"></div>
            <div className="fixed bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-white/5 pointer-events-none z-0"></div>
        </div>
    );
};

