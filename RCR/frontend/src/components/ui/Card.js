// RE-THEMED: Solid Tactical
import React from 'react';

export const Card = ({ 
    children, 
    className = '', 
    variant = 'glass',
    glowing = false,
    ...props 
}) => {
    // Solid tactical panel style
    const baseStyle = 'bg-[#151B2B] border border-slate-800 rounded-none shadow-tactical transition-colors duration-200';
    
    // Maintain variation logic but with solid colors
    const variants = {
        glass: baseStyle,
        panel: 'bg-[#1E293B] border border-slate-700 rounded-none shadow-none',
    };

    const glowClass = glowing ? 'border-red-500/50 shadow-neon-red' : '';

    return (
        <div 
            className={`${variants[variant] || baseStyle} ${glowClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
