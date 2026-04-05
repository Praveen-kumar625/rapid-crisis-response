import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { MapPin, Cpu, ArrowRight } from 'lucide-react';

function IncidentCard({ incident }) {
    const { id, title, severity, category, status, location, triageMethod } = incident;
    const [lng, lat] = location.coordinates;
    
    const isCritical = severity >= 4;
    
    return (
        <div className="glass-card p-6 group relative overflow-hidden flex flex-col justify-between">
            {/* Left Accent Line */}
            <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 ${
                isCritical ? 'bg-danger shadow-[0_0_10px_rgba(255,51,102,0.8)]' : 'bg-electric'
            } group-hover:w-1.5`}></div>
            
            <div>
                <div className="flex justify-between items-start mb-4 pl-2">
                    <Link to={`/incidents/${id}`} className="text-base font-bold text-slate-100 group-hover:text-white transition-colors tracking-wide leading-snug line-clamp-2 pr-2">
                        {title}
                    </Link>
                    <StatusBadge status={status} />
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-5 pl-2">
                    <span className="bg-navy-900 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest text-slate-300 border border-surfaceBorder">{category}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
                        isCritical ? 'text-danger bg-danger/10 border-danger/20' : 'text-amber bg-amber/10 border-amber/20'
                    }`}>
                        Level {severity}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pl-2">
                    <MapPin size={12} className="text-slate-500" />
                    <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-surfaceBorder flex justify-between items-center pl-2">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                    <Cpu size={12} />
                    {triageMethod || 'Cloud AI'}
                </div>
                <Link to={`/incidents/${id}`} className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest hover:underline transition-colors ${
                    isCritical ? 'text-danger' : 'text-electric'
                }`}>
                    Intel <ArrowRight size={12} />
                </Link>
            </div>
        </div>
    );
}

export default IncidentCard;
