// RE-THEMED: Solid Tactical
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { MapPin, Cpu, ArrowRight, Navigation } from 'lucide-react';
import { Card } from './ui/Card';

function IncidentCard({ incident }) {
    const navigate = useNavigate();
    const { id, title, severity, category, status, location, triageMethod, wingId, floorLevel } = incident;
    const [lng, lat] = location.coordinates;
    
    const isCritical = severity >= 4;
    
    return (
        <Card 
            className={`group relative flex flex-col justify-between p-6 bg-slate-900 border border-slate-700 hover:border-slate-500 cursor-pointer rounded-none shadow-none overflow-hidden ${
                isCritical ? 'bg-danger-diagonal' : ''
            }`}
            onClick={() => navigate(`/incidents/${id}`)}
        >
            {/* Left Accent Stripe */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${
                isCritical ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-cyan-600 shadow-[0_0_15px_rgba(8,145,178,0.5)]'
            }`}></div>
            
            <div className="relative z-10 pl-2">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <StatusBadge status={status} />
                            {isCritical && (
                                <span className="animate-pulse flex items-center gap-1 text-[8px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 border border-red-500/20">
                                    IMMEDIATE_ACTION_REQUIRED
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight line-clamp-2 font-mono group-hover:text-electric transition-colors">
                            {title}
                        </h3>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="bg-slate-800 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-700 font-mono">
                        {category}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-2 font-mono ${
                        isCritical ? 'text-white bg-red-600 border-red-400' : 'text-black bg-cyan-500 border-cyan-300'
                    }`}>
                        LVL_{severity}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-2 mb-4 bg-black/40 p-3 border border-slate-800 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <Navigation size={12} className="text-slate-600" />
                        <span className="font-bold text-slate-500">SECTOR:</span>
                        <span className="text-slate-200">WING_{wingId || '??'} {'//'} L_{floorLevel || '??'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <MapPin size={12} className="text-slate-600" />
                        <span className="font-bold text-slate-500">COORD:</span>
                        <span className="text-slate-200 font-mono">{lat.toFixed(4)}N, {lng.toFixed(4)}E</span>
                    </div>
                </div>
            </div>

            <div className="mt-2 pt-4 border-t border-slate-800 flex justify-between items-center relative z-10 pl-2 font-mono">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <Cpu size={14} className={triageMethod?.includes('Edge') ? 'text-emerald-500 animate-pulse' : 'text-slate-700'} />
                    {triageMethod?.includes('Edge') ? (
                        <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20">EDGE_AI_VERIFIED</span>
                    ) : (
                        <span className="text-slate-600">PROC: {triageMethod || 'CLOUD_CORE'}</span>
                    )}
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    isCritical ? 'text-red-500 group-hover:text-red-400' : 'text-cyan-500 group-hover:text-cyan-400'
                }`}>
                    OPEN_INTEL <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Card>
    );
}


export default IncidentCard;
