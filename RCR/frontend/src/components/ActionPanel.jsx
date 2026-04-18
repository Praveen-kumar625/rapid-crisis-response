import React from "react";

export default function ActionPanel({ children }) {
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19] overflow-hidden">
            {/* OPERATOR CONTROL HEADER */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-slate-900/40 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-neon-red" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">Operator_Input_Terminal</h3>
                </div>
            </div>

            {/* CONTROL AREA */}
            <div className="flex-1 relative overflow-hidden">
                {children}
            </div>
        </div>
    );
}
