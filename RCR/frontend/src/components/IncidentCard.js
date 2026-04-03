import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

function IncidentCard({ incident }) {
    const { id, title, severity, category, status, location, triageMethod } = incident;
    const [lng, lat] = location.coordinates;
    
    return (
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500 group-hover:w-2 transition-all"></div>
            
            <div className="flex justify-between items-start mb-4">
                <Link to={`/incidents/${id}`} className="text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors uppercase tracking-tight">
                    {title}
                </Link>
                <StatusBadge status={status} />
            </div>

            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{category}</span>
                <span className={`${severity >= 4 ? 'text-red-600' : 'text-slate-400'}`}>Severity {severity}</span>
            </div>

            <p className="text-[10px] font-mono text-slate-400">
                📍 {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">{triageMethod || 'CLOUD AI'}</span>
                <Link to={`/incidents/${id}`} className="text-red-600 text-[10px] font-black uppercase tracking-widest hover:underline">View Intel &rarr;</Link>
            </div>
        </div>
    );
}

export default IncidentCard;
