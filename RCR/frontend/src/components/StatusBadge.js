import React from 'react';

export const StatusBadge = ({ status }) => {
    const variants = {
        OPEN: 'bg-red-950 text-red-400 border-red-800',
        IN_PROGRESS: 'bg-amber-950 text-amber-400 border-amber-800',
        RESOLVED: 'bg-emerald-950 text-emerald-400 border-emerald-800',
        CLOSED: 'bg-slate-800 text-slate-400 border-slate-700',
        ENCRYPTED_UPLINK: 'bg-cyan-950 text-cyan-400 border-cyan-800'
    };

    const className = variants[status] || variants.CLOSED;

    return (
        <span className={`${className} border px-2.5 py-1 rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-none w-fit font-mono`}>
            {(status === 'OPEN' || status === 'ENCRYPTED_UPLINK') && (
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'OPEN' ? 'bg-red-500' : 'bg-cyan-500'}`}></span>
            )}
            {status}
        </span>
    );
};

export default StatusBadge;
