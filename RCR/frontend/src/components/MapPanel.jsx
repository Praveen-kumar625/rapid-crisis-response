import React from "react";

export const MapPanel = ({ title, children }) => {
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19] border border-white/5 overflow-hidden shadow-2xl">
            {/* TACTICAL PANEL HEADER */}
            <div className="h-10 border-b border-white/5 bg-slate-900/40 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-neon-cyan" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">
                        {title || 'SYSTEM_GRID_VIEW'}
                    </h3>
                </div>
                <div className="flex items-center gap-1.5 opacity-30">
                    <div className="w-1 h-1 bg-white rounded-full" />
                    <div className="w-1 h-1 bg-white rounded-full" />
                    <div className="w-1 h-1 bg-white rounded-full" />
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 relative bg-black/20">
                {children}
            </div>
        </div>
    );
};

export default MapPanel;
