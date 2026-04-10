// RE-THEMED: Solid Tactical
import React from 'react';

export const Button = ({ 
    children, 
    variant = 'primary', 
    className = '', 
    isLoading = false,
    disabled = false,
    ...props 
}) => {
    // Mechanical, solid press styles
    const variants = {
        primary: 'bg-cyan-600 text-black border border-cyan-400 hover:bg-cyan-500 hover:shadow-neon-cyan active:bg-cyan-700 active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed',
        danger: 'bg-red-600 text-white border border-red-400 hover:bg-red-500 hover:shadow-neon-red active:bg-red-700 active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed',
        secondary: 'bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700 hover:border-slate-500 active:bg-slate-900 active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed',
        outline: 'bg-transparent text-cyan-400 border border-cyan-600/50 hover:bg-cyan-500/5 active:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed'
    };

    return (
        <button 
            className={`min-h-[44px] px-6 py-3 rounded-none text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-tactical tabular-nums relative overflow-hidden ${variants[variant] || variants.primary} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-inherit z-20">
                    <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin"></div>
                </div>
            )}
            <span className={`relative z-10 flex items-center justify-center gap-3 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {children}
            </span>
        </button>
    );
};

