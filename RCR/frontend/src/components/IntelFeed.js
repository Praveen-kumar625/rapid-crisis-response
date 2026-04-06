import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Radio, MapPin, Clock } from 'lucide-react';
import { Badge } from './ui/Badge';

const SeverityIndicator = ({ level }) => {
    const colors = {
        1: 'bg-electric',
        2: 'bg-emerald',
        3: 'bg-warning',
        4: 'bg-orange-500',
        5: 'bg-danger'
    };
    
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
                <div 
                    key={i} 
                    className={`w-1.5 h-3 ${i <= level ? colors[level] : 'bg-white/10'} transition-all duration-500 ${i <= level ? 'shadow-[0_0_8px_rgba(var(--tw-color-' + (level >= 4 ? 'danger' : 'electric') + '),0.5)]' : ''}`}
                />
            ))}
        </div>
    );
};

const SignalNode = ({ incident, onClick }) => {
    const time = new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            whileHover={{ scale: 1.02, x: 4 }}
            onClick={() => onClick(incident)}
            className="group cursor-pointer border-l-2 border-white/5 hover:border-electric transition-all bg-navy-900/40 p-4 mb-3 tactical-border relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
                <Radio size={40} className="text-electric" />
            </div>

            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-electric flex items-center gap-1.5 uppercase tracking-tighter">
                        <Clock size={10} /> {time}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                        ID: {incident.id.substring(0, 8)}
                    </span>
                </div>
                <SeverityIndicator level={incident.severity} />
            </div>

            <h4 className="text-xs font-black text-white uppercase tracking-tight mb-2 group-hover:text-electric transition-colors truncate">
                {incident.title}
            </h4>

            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Sector</span>
                        <Badge variant="neutral" className="text-[8px] py-0.5 px-1.5 border-white/5">
                            WING_{incident.wingId} {'//'} LVL_{incident.floorLevel}
                        </Badge>
                    </div>
                </div>
                
                <div className="flex flex-col items-end text-right">
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Status</span>
                    <span className={`text-[9px] font-mono font-black uppercase ${
                        incident.status === 'OPEN' ? 'text-danger animate-pulse' : 
                        incident.status === 'IN_PROGRESS' ? 'text-warning' : 'text-emerald'
                    }`}>
                        {incident.status}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export const IntelFeed = ({ incidents, onSelectIncident }) => {
    return (
        <aside className="w-1/4 h-full flex flex-col border-r border-white/10 bg-navy-950/20 backdrop-blur-md overflow-hidden">
            <header className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 bg-danger rounded-full animate-ping absolute inset-0"></div>
                        <div className="w-2.5 h-2.5 bg-danger rounded-full relative z-10"></div>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Intel Feed</h3>
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-2">
                    <Activity size={12} className="text-electric animate-pulse" />
                    Live Signals
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                <AnimatePresence mode="popLayout">
                    {incidents.map((inc) => (
                        <SignalNode 
                            key={inc.id} 
                            incident={inc} 
                            onClick={onSelectIncident} 
                        />
                    ))}
                </AnimatePresence>
                
                {incidents.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
                        <Radio size={48} className="mb-4 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Scanning for <br />Incoming Signals...</p>
                    </div>
                )}
            </div>

            <footer className="p-4 border-t border-white/5 bg-black/20 shrink-0">
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                    <span>Active Nodes: {incidents.length}</span>
                    <span className="text-electric">Crypto-Sync: ACTIVE</span>
                </div>
            </footer>
        </aside>
    );
};
