// RE-THEMED: Solid Tactical
import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

import { motion } from 'framer-motion';
import { MapPin, Cpu, ArrowRight, Navigation, Zap } from 'lucide-react';
import { Card } from './ui/Card';

function IncidentCard({ incident, onAcknowledge }) {
    const navigate = useNavigate();
    const { id, title, severity, category, status, location, triageMethod, wingId, floorLevel } = incident;
    const [lng, lat] = location.coordinates;
    
    const isCritical = severity >= 4;
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 500 }}
            drag="x"
            dragConstraints={{ left: 0, right: 100 }}
            onDragEnd={(_, info) => {
                if (info.offset.x > 80 && status === 'REPORTED') {
                    onAcknowledge?.(id);
                }
            }}
            className="w-full relative touch-none"
        >
            {/* Swipe Action Background Indicator */}
            <div className="absolute inset-0 bg-emerald-500/20 flex items-center pl-6 opacity-0 group-drag:opacity-100">
                <Zap size={24} className="text-emerald-500 animate-pulse" />
            </div>

            <Card 
                className={`group relative flex flex-col justify-between min-h-[140px] p-5 lg:p-6 glass-panel border-white/5 hover:border-cyan-500/30 cursor-pointer rounded-none shadow-none overflow-hidden transition-all duration-500 ${
                    isCritical ? 'bg-danger/10 border-danger/20' : 'bg-slate-900/60'
                }`}
                onClick={() => navigate(`/incidents/${id}`)}
            >
                {/* Left Accent Stripe */}
                <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-500 ${
                    isCritical 
                    ? 'bg-danger shadow-[0_0_15px_rgba(239,68,68,0.8)]' 
                    : 'bg-cyan-500'
                }`}></div>
                
                <div className="relative z-10 pl-2">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <StatusBadge status={status} />
                                {isCritical && (
                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-white bg-red-600 px-2.5 py-1 uppercase tracking-[0.2em] shadow-neon-red">
                                        PRIORITY_ALPHA
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter leading-none font-mono group-hover:text-cyan-400 transition-colors">
                                {title}
                            </h3>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        <span className="bg-slate-950 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400 border border-white/10 font-mono">
                            {category}
                        </span>
                        <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1.5 border-2 font-mono ${
                            isCritical ? 'text-white border-red-500 bg-red-600/20' : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5'
                        }`}>
                            SEV_0{severity}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-4 bg-black/40 p-4 border border-white/5 backdrop-blur-sm relative overflow-hidden">
                        <div className="flex items-center gap-4 text-xs font-mono">
                            <Navigation size={18} className="text-cyan-500" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 tracking-[0.3em]">LOC_SECTOR</span>
                                <span className="text-white font-black uppercase text-sm">WING_{wingId || '??'} // LVL_{floorLevel || '??'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono">
                            <MapPin size={18} className="text-amber-500" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 tracking-[0.3em]">GPS_COORD</span>
                                <span className="text-slate-300 font-bold">{lat.toFixed(4)}N / {lng.toFixed(4)}E</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-2 pt-4 border-t border-white/10 flex justify-between items-center relative z-10 pl-2">
                    <div className="flex items-center gap-3">
                        <Cpu size={18} className={triageMethod?.includes('Edge') ? 'text-emerald-400' : 'text-slate-600'} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${triageMethod?.includes('Edge') ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {triageMethod?.includes('Edge') ? 'EDGE_STABLE' : 'CLOUD_LINK'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400 group-hover:translate-x-2 transition-all">
                        Intel_Link <ArrowRight size={18} />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}


export default IncidentCard;
