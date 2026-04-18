import React from 'react';

/**
 * SAFE FALLBACK: DesktopSidebar
 * No external icons, no complex motion, no context dependencies.
 */
export const DesktopSidebar = ({ user, logout }) => {
    return (
        <aside className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col p-4">
            <div className="mb-8 font-black text-xl text-cyan-500">RCR_CORE</div>
            
            <nav className="flex-1 space-y-2">
                <div className="p-3 bg-slate-800 text-white rounded text-xs font-bold uppercase">Dashboard</div>
                <div className="p-3 text-slate-400 hover:bg-slate-800 rounded text-xs font-bold uppercase cursor-pointer">Map</div>
                <div className="p-3 text-slate-400 hover:bg-slate-800 rounded text-xs font-bold uppercase cursor-pointer">Incidents</div>
            </nav>

            <div className="pt-4 border-t border-slate-800">
                <div className="text-[10px] text-slate-500 mb-2 uppercase font-mono">{user?.email || 'OFFLINE_NODE'}</div>
                <button 
                    onClick={logout}
                    className="w-full py-2 bg-red-900/20 text-red-500 border border-red-900/50 text-[10px] font-black uppercase"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default DesktopSidebar;
