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
            className="group relative overflow-hidden flex flex-col justify-between p-8 hover:bg-white/[0.03] cursor-pointer"
            onClick={() => navigate(`/incidents/${id}`)}
        >
            {/* Left Accent Line */}
            <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-500 ${
                isCritical ? 'bg-danger shadow-[0_0_20px_rgba(255,51,102,0.6)]' : 'bg-secondary shadow-[0_0_20px_rgba(13,148,136,0.4)]'
            } group-hover:w-2`}></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-2">
                        <StatusBadge status={status} />
                        <h3 className="text-xl font-black text-white group-hover:text-secondary transition-colors uppercase tracking-tight leading-tight line-clamp-2">
                            {title}
                        </h3>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="bg-navy-950 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border border-white/5">
                        {category}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${
                        isCritical ? 'text-danger bg-danger/10 border-danger/20' : 'text-accent bg-accent/10 border-accent/20'
                    }`}>
                        LVL {severity}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <Navigation size={12} />
                        <span>WING_{wingId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <MapPin size={12} />
                        <span>{lat.toFixed(3)}, {lng.toFixed(3)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <Cpu size={14} className="text-slate-600" />
                    {triageMethod || 'Cloud AI'}
                </div>
                <Link to={`/incidents/${id}`} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    isCritical ? 'text-danger hover:text-red-400' : 'text-secondary hover:text-teal-400'
                }`}>
                    INTEL <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </Card>
    );
}

export default IncidentCard;
