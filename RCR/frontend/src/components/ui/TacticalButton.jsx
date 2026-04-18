import React from 'react';

/**
 * TACTICAL_BUTTON_SYSTEM
 * High-performance UI buttons derived from youneslaaroussi/ui-buttons
 * Optimized for mission-critical situational awareness.
 */

export const TacticalButton = ({ 
    children, 
    onClick, 
    variant = 'primary', 
    className = '',
    type = 'button',
    disabled = false
}) => {
    // Primary is the "Border Snake" / Neon style
    if (variant === 'primary') {
        return (
            <button 
                type={type}
                onClick={onClick}
                disabled={disabled}
                className={`snake-btn ${className}`}
            >
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                {children}
            </button>
        );
    }

    // Danger is the "Glitch" / High-Alert style
    if (variant === 'danger') {
        return (
            <button 
                type={type}
                onClick={onClick}
                disabled={disabled}
                className={`glitch-btn ${className}`}
                data-text={typeof children === 'string' ? children : 'ACTION'}
            >
                {children}
            </button>
        );
    }

    // Tertiary is the "Cyber Glow" style
    if (variant === 'tertiary') {
        return (
            <button 
                type={type}
                onClick={onClick}
                disabled={disabled}
                className={`glow-btn ${className}`}
            >
                {children}
            </button>
        );
    }

    // Default fallback
    return (
        <button 
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-6 py-2 bg-slate-800 text-slate-100 font-bold uppercase tracking-widest border border-white/10 hover:bg-slate-700 transition-all ${className}`}
        >
            {children}
        </button>
    );
};

export default TacticalButton;
