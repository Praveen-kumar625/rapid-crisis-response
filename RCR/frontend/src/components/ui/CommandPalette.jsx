import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    ShieldAlert, 
    Terminal, 
    Command,
    Navigation,
    Activity,
    Map as MapIcon,
    BarChart3,
    Settings,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useNavigate } from 'react-router-dom';
import { useTactical } from '../../context/TacticalContext';

const CommandItem = ({ icon: Icon, label, shortcut, active, onClick, color = "text-slate-400" }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
            active ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-slate-800/40 border border-transparent'
        }`}
    >
        <div className="flex items-center gap-3">
            <Icon size={18} className={active ? 'text-cyan-400' : color} />
            <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
        {shortcut && (
            <div className="flex items-center gap-1 opacity-40">
                {shortcut.map((s, i) => (
                    <kbd key={i} className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] font-mono text-slate-500">
                        {s}
                    </kbd>
                ))}
            </div>
        )}
    </button>
);

export const CommandPalette = () => {
    const { isCommandPaletteOpen, closeCommandPalette } = useUI();
    const { state } = useTactical();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);

    const staticActions = [
        { id: 'sos', label: 'Trigger_SOS_Broadcast', icon: ShieldAlert, color: 'text-red-500', action: () => { navigate('/report'); closeCommandPalette(); } },
        { id: 'map', label: 'Go_to_Tactical_Grid', icon: MapIcon, action: () => { navigate('/map'); closeCommandPalette(); } },
        { id: 'hud', label: 'Go_to_Active_Breach', icon: Activity, action: () => { navigate('/hud'); closeCommandPalette(); } },
        { id: 'analytics', label: 'Go_to_Intel_Analytics', icon: BarChart3, action: () => { navigate('/dashboard'); closeCommandPalette(); } },
        { id: 'settings', label: 'Open_System_Config', icon: Settings, action: () => { navigate('/settings'); closeCommandPalette(); } },
    ];

    const filteredIncidents = state.incidents
        .filter(inc => inc.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(inc => ({
            id: `incident-${inc.id}`,
            label: `Unit_${inc.id.substring(0,8)}: ${inc.title}`,
            icon: AlertCircle,
            color: inc.severity >= 4 ? 'text-red-500' : 'text-cyan-400',
            action: () => { navigate(`/incidents/${inc.id}`); closeCommandPalette(); }
        }));

    const results = [...staticActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase())), ...filteredIncidents];

    useEffect(() => {
        if (isCommandPaletteOpen) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isCommandPaletteOpen]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            results[activeIndex]?.action();
        }
    };

    return (
        <AnimatePresence>
            {isCommandPaletteOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
                    {/* BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCommandPalette}
                        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
                    />

                    {/* PALETTE PANEL */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="relative w-full max-w-xl bg-[#0B0F19] border border-slate-800 shadow-2xl overflow-hidden rounded-xl"
                    >
                        {/* SEARCH INPUT */}
                        <div className="flex items-center px-6 py-4 border-b border-slate-800/60 bg-slate-900/20">
                            <Terminal size={18} className="text-cyan-500 shrink-0 mr-4" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a command or search incidents..."
                                className="w-full bg-transparent border-none outline-none text-sm font-medium text-white placeholder-slate-600 font-mono tracking-tight"
                            />
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4 shrink-0">
                                <Command size={10} /> K
                            </div>
                        </div>

                        {/* RESULTS SECTION */}
                        <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {results.length > 0 ? (
                                <div className="space-y-1">
                                    <div className="px-4 pt-3 pb-2">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Suggested_Operations</span>
                                    </div>
                                    {results.map((item, idx) => (
                                        <CommandItem
                                            key={item.id}
                                            icon={item.icon}
                                            label={item.label}
                                            active={idx === activeIndex}
                                            color={item.color}
                                            onClick={item.action}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-600">
                                    <Search size={40} strokeWidth={1} className="mb-4 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No_Matching_Signals</p>
                                </div>
                            )}
                        </div>

                        {/* FOOTER HELPER */}
                        <div className="px-6 py-3 border-t border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-slate-500">Enter</kbd>
                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest text-[8px]">Select</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-0.5">
                                        <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-slate-500 leading-none">↑</kbd>
                                        <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-slate-500 leading-none">↓</kbd>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest text-[8px]">Navigate</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-slate-500">Esc</kbd>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest text-[8px]">Close</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
