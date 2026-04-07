// RE-THEMED: Solid Tactical
import React from 'react';

export const Button = ({ 
    children, 
    variant = 'primary', 
    className = '', 
    ...props 
}) => {
    // Mechanical, solid press styles
    const variants = {
        primary: 'bg-cyan-600 text-black border border-cyan-400 hover:bg-cyan-500 hover:shadow-neon-cyan active:bg-cyan-700 active:shadow-inner',
        danger: 'bg-red-600 text-white border border-red-400 hover:bg-red-500 hover:shadow-neon-red active:bg-red-700 active:shadow-inner',
        secondary: 'bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700 hover:border-slate-500 active:bg-slate-900 active:shadow-inner',
        outline: 'bg-transparent text-cyan-400 border border-cyan-600/50 hover:bg-cyan-500/5 active:bg-cyan-500/10'
    };

    return (
        <button 
            className={`px-6 py-3 rounded-none text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-tactical tabular-nums ${variants[variant] || variants.primary} ${className}`}
            {...props}
        >
            <span className="relative z-10 flex items-center justify-center gap-3">{children}</span>
        </button>
    );
};
