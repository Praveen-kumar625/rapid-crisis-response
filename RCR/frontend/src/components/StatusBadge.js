import React from 'react';

function StatusBadge({ status }) {
    const variants = {
        OPEN: 'bg-danger text-white border-danger/30',
        IN_PROGRESS: 'bg-accent text-primary border-accent/30',
        RESOLVED: 'bg-secondary text-primary border-secondary/30',
        CLOSED: 'bg-slate-800 text-slate-300 border-white/10',
    };

    const className = variants[status] || variants.CLOSED;

    return (
        <span className={`${className} border px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg`}>
            {status === 'OPEN' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
            {status}
        </span>
    );
}

export default StatusBadge;
