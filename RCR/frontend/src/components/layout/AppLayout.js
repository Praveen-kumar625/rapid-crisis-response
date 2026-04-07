// RE-THEMED: Solid Tactical
import React from 'react';
import { Navbar } from './Navbar';

export const AppLayout = ({ children, user, logout }) => {
    return (
        <div className="h-[100dvh] w-full flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-cyan-500 selection:text-black font-body antialiased overflow-hidden">
            <Navbar user={user} logout={logout} />

            <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-grid-pattern">
                {children}
            </main>
        </div>
    );
};
