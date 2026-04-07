// RE-THEMED: Solid Tactical
import React from 'react';
import { Navbar } from './Navbar';

export const AppLayout = ({ children, user, logout }) => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 selection:bg-cyan-500 selection:text-black font-body antialiased">
            {/* ATMOSPHERIC ELEMENTS REMOVED: Mission-Critical Focus */}
            <div className="fixed inset-0 z-0 bg-slate-950 pointer-events-none"></div>

            <Navbar user={user} logout={logout} />
            
            <main className="flex-1 flex flex-col relative z-10">
                {children}
            </main>
        </div>
    );
};
