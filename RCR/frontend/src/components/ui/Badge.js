// RE-THEMED: Solid Tactical
import React from 'react';

export const Badge = ({ 
    children, 
    variant = 'neutral',
    className = '',
    ...props 
}) => {
    // Solid high-contrast block styles
    const variants = {
        neutral: 'bg-slate-800 text-slate-100 border-slate-700',
        electric: 'bg-cyan-500 text-black border-cyan-300 font-black',
        danger: 'bg-red-600 text-white border-red-400 font-black',
        emerald: 'bg-emerald-600 text-white border-emerald-400 font-black',
        amber: 'bg-amber-500 text-black border-amber-300 font-black',
    };

    return (
        <span 
            className={`px-2 py-0.5 rounded-none text-[10px] sm:text-[11px] uppercase tracking-wider border font-mono transition-all duration-200 flex items-center gap-1.5 w-fit tabular-nums ${variants[variant] || variants.neutral} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};
