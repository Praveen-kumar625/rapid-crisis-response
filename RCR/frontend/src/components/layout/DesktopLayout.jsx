import { useEffect } from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { TopBar } from '../TopBar';
import { TickerTape } from '../TickerTape';
import { StatusBadge } from '../StatusBadge';
import { CommandPalette } from '../ui/CommandPalette';
import { useUI } from '../../context/UIContext';

export const DesktopLayout = ({ children, user, logout }) => {
    const { toggleCommandPalette } = useUI();

    // Global Hotkey Listener: Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleCommandPalette();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleCommandPalette]);

    return (
        <div className="hidden md:flex h-screen w-full bg-[#020617] text-white overflow-hidden font-sans">
            {/* Global Command Overlay */}
            <CommandPalette />

            {/* Fixed Left Navigation */}
            <DesktopSidebar user={user} logout={logout} />

            {/* Content Core */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                
                {/* Tactical Header with TickerTape */}
                <header className="z-30 border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-md">
                    <TopBar>
                        <div className="flex-1 flex items-center justify-between px-4 h-full">
                            <div className="w-2/3 overflow-hidden">
                                <TickerTape />
                            </div>
                            <div className="flex items-center gap-4">
                                <StatusBadge status="ENCRYPTED_UPLINK" variant="success" />
                                <div className="h-4 w-px bg-white/10" />
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest tabular-nums">
                                    {new Date().toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    </TopBar>
                </header>

                {/* Main Viewport */}
                <main className="flex-1 overflow-y-auto relative bg-[#020617] custom-scrollbar">
                    {/* Tactical Gradient Underlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
                    
                    <div className="relative z-10 h-full">
                        {children}
                    </div>
                </main>

                {/* Bottom Frame Accent */}
                <footer className="h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent w-full shrink-0" />
            </div>
        </div>
    );
};

export default DesktopLayout;
