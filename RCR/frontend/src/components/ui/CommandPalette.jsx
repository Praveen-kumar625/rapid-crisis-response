import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../../context/UIContext';

// Safe Inline Icons
const Icons = {
    Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
    Terminal: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>,
    Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
    Nav: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
};

export const CommandPalette = () => {
    const { isCommandPaletteOpen, closeCommandPalette } = useUI();
    const [query, setQuery] = useState('');

    if (!isCommandPaletteOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={closeCommandPalette}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
                />
                
                <motion.div 
                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="relative w-full max-w-2xl bg-[#0B0F19] border border-white/10 shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center px-6 py-4 border-b border-white/10">
                        <div className="text-cyan-500 mr-4"><Icons.Terminal /></div>
                        <input 
                            autoFocus
                            className="bg-transparent border-none outline-none text-white w-full font-mono text-sm placeholder:text-slate-600"
                            placeholder="Execute Command (e.g. /sos, /jump sector_4, /status)..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="p-2 max-h-96 overflow-y-auto">
                        <div className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">Global_Operations</div>
                        <CommandItem icon={Icons.Alert} label="INITIATE_FULL_SOS" shortcut="S" color="text-red-500" />
                        <CommandItem icon={Icons.Nav} label="DEPLOY_RESPONDER_GROUP_A" shortcut="D" />
                        <CommandItem icon={Icons.Search} label="SEARCH_INCIDENT_LOGS" shortcut="F" />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const CommandItem = ({ icon: Icon, label, shortcut, color = "text-slate-400" }) => (
    <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 group transition-colors">
        <div className="flex items-center gap-4">
            <div className={color}><Icon /></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wide group-hover:text-white transition-colors">{label}</span>
        </div>
        <kbd className="px-2 py-1 bg-slate-900 border border-white/10 text-[9px] font-mono text-slate-500 rounded">{shortcut}</kbd>
    </button>
);

export default CommandPalette;
