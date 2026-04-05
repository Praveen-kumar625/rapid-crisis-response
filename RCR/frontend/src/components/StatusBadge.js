import React from 'react';

const COLORS = {
    OPEN: 'bg-danger/10 text-danger border-danger/30 shadow-[0_0_10px_rgba(255,51,102,0.2)]',
    IN_PROGRESS: 'bg-amber/10 text-amber border-amber/30',
    RESOLVED: 'bg-emerald/10 text-emerald border-emerald/30',
    CLOSED: 'bg-slate-800 text-slate-400 border-surfaceBorder',
};

function StatusBadge({ status }) {
    const className = COLORS[status] || COLORS.CLOSED;
    return (
        <span className={`${className} border px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
            {status === 'OPEN' && <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>}
            {status}
        </span>
    );
}

export default StatusBadge;
