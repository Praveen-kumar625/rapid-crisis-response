import React from 'react';

// ISOLATION MODE: Rendering children directly to find the crash source.
export const AppLayout = ({ children, user, logout }) => {
    return (
        <div className="h-screen w-full bg-slate-950 text-white overflow-hidden flex flex-col">
            {/* 
               TEMPORARY BYPASS:
               We are NOT rendering DesktopLayout or MobileNavbar here.
               If the screen is still blank, the error is inside the children (Pages).
            */}
            <div className="flex-1 overflow-auto p-4">
                {children}
            </div>
            
            <div className="h-8 bg-blue-900 flex items-center px-4 text-[10px] font-mono">
                DEBUG_MODE: ISOLATION_ACTIVE | USER: {user?.email || 'GUEST'}
            </div>
        </div>
    );
};
