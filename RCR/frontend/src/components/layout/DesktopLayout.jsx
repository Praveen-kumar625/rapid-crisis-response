import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { CommandPalette } from '../ui/CommandPalette';
import { useUI } from '../../context/UIContext';

export const DesktopLayout = ({ children, user, logout }) => {
    const { isSidebarExpanded } = useUI();

    return (
        <div className="hidden md:flex min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30 overflow-hidden relative">
            {/* BACKGROUND TACTICAL EFFECTS */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] bg-[length:40px_40px]" />
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/[0.02] via-transparent to-red-500/[0.01]" />
            </div>

            {/* PERSISTENT SIDEBAR */}
            <DesktopSidebar user={user} logout={logout} />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
                {/* GLOBAL COMMAND PALETTE */}
                <CommandPalette />

                {/* SCROLLABLE VIEWPORT */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#020617]/50">
                    <div className="min-h-full">
                        {children}
                    </div>
                </main>

                {/* SYSTEM Ticker / Status Bar */}
                <footer className="h-8 border-t border-slate-800/60 bg-[#0B0F19] px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">System_Status: Optimal</span>
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest tabular-nums">LATENCY: 24MS</span>
                        <div className="h-3 w-px bg-slate-800" />
                        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest tabular-nums">UPLINK: ACTIVE_ENCRYPTED</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};
