// RE-THEMED: Solid Tactical
import React from 'react';
import { MobileNavbar } from './MobileNavbar';
import DesktopLayout from './DesktopLayout';
import { StepInstructionGuide } from '../ui/StepInstructionGuide';

export const AppLayout = ({ children, user, logout }) => {
    return (
        <div className="h-screen w-full max-w-[100vw] overflow-hidden bg-[#0B0F19] text-slate-100 font-body antialiased relative">
            
            {/* DESKTOP BRANCH: Activates on screens >= 768px */}
            <div className="hidden md:block h-full w-full">
                <DesktopLayout user={user} logout={logout}>
                    {children}
                </DesktopLayout>
            </div>

            {/* MOBILE BRANCH: Visible on small screens */}
            <div className="md:hidden h-full w-full flex flex-col relative overflow-hidden">
                {/* Global Tactical Overlays */}
                <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] bg-grid-pattern bg-[length:40px_40px]"></div>
                <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
                    <div className="w-full h-[2px] bg-cyan-500/20 animate-pulse opacity-20"></div>
                </div>
                
                <MobileNavbar user={user} logout={logout} />

                <main className="flex-1 flex flex-col relative z-10 overflow-y-auto pb-20">
                    {children}
                </main>

                <StepInstructionGuide />

                {/* Tactical Corner Accents */}
                <div className="fixed top-0 left-0 w-12 h-12 border-t border-l border-white/10 pointer-events-none z-0"></div>
                <div className="fixed bottom-0 right-0 w-12 h-12 border-b border-r border-white/10 pointer-events-none z-0"></div>
            </div>
        </div>
    );
};
