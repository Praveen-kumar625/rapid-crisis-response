import React from 'react';
import { 
    Activity, 
    ShieldAlert, 
    Users, 
    Zap, 
    Clock, 
    ChevronRight,
    Search,
    Filter
} from 'lucide-react';
import { useTactical } from '../context/TacticalContext';
import { TacticalMap } from './TacticalMap';
import { IntelFeed } from './IntelFeed';

const StatCard = ({ title, value, subValue, icon: Icon, color }) => (
    <div className="glass-panel p-5 border-slate-800/40 hover:border-slate-700 transition-all group overflow-hidden relative">
        <div className={`absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all ${color}`}>
            <Icon size={80} />
        </div>
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${color}`}>
                <Icon size={18} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</h3>
        </div>
        <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white tracking-tighter tabular-nums">{value}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subValue}</span>
        </div>
    </div>
);

export const DashboardGrid = () => {
    const { state } = useTactical();
    const { incidents, responders, commsStatus } = state;

    const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
    const criticalIncidentsCount = activeIncidents.filter(i => i.severity >= 4).length;
    const availableResponders = responders.filter(r => r.status === 'AVAILABLE').length;

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
            {/* TOP METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard 
                    title="Active_Breaches" 
                    value={activeIncidents.length} 
                    subValue={`${criticalIncidentsCount} CRITICAL`} 
                    icon={ShieldAlert} 
                    color="text-red-500" 
                />
                <StatCard 
                    title="Responder_Units" 
                    value={responders.length} 
                    subValue={`${availableResponders} READY`} 
                    icon={Users} 
                    color="text-cyan-400" 
                />
                <StatCard 
                    title="Grid_Stability" 
                    value="99.9%" 
                    subValue={commsStatus ? "STABLE" : "DEGRADED"} 
                    icon={Zap} 
                    color="text-amber-500" 
                />
                <StatCard 
                    title="Response_Time" 
                    value="1.4m" 
                    subValue="AVG_UPLINK" 
                    icon={Clock} 
                    color="text-emerald-400" 
                />
            </div>

            {/* MAIN DASHBOARD CONTENT */}
            <div className="grid grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-320px)] min-h-[500px]">
                {/* TACTICAL MAP - MAIN VIEW */}
                <div className="col-span-12 lg:col-span-8 glass-panel border-slate-800/40 relative overflow-hidden flex flex-col">
                    <div className="h-14 border-b border-slate-800/40 bg-slate-900/20 px-6 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-cyan-400" />
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Live_Tactical_Grid</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded border border-slate-700">
                                <Search size={12} className="text-slate-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sector_01_A</span>
                            </div>
                            <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-all">
                                <Filter size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative bg-slate-950">
                        <TacticalMap incidents={incidents} />
                        
                        {/* Overlay Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                            {['SAT', 'GRID', 'Z-AXIS'].map(layer => (
                                <button key={layer} className="bg-[#0B0F19]/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
                                    {layer}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* INTEL FEED - SIDE PANEL */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:gap-6 min-h-0">
                    <div className="flex-1 glass-panel border-slate-800/40 flex flex-col overflow-hidden">
                        <IntelFeed incidents={incidents} />
                    </div>
                    
                    {/* QUICK ACTION CARD */}
                    <div className="h-32 glass-panel border-red-500/20 bg-red-950/5 flex items-center justify-between p-6 shrink-0 group hover:bg-red-950/10 transition-all cursor-pointer border-t-2 border-t-red-600/50">
                        <div className="space-y-1">
                            <h3 className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em]">Direct_SOS_Relay</h3>
                            <p className="text-xs text-slate-500 font-medium">Broadcast emergency signal to all units</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:scale-110 transition-transform">
                            <ShieldAlert size={24} className="text-white animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* RECENT ACTIVITY / LOGS TABLE */}
            <div className="glass-panel border-slate-800/40 overflow-hidden">
                <div className="h-14 border-b border-slate-800/40 bg-slate-900/20 px-6 flex items-center shrink-0">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">System_Audit_Log</h2>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-900/40 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Node_ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Event_Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                            {incidents.slice(0, 5).map((inc, _) => (
                                <tr key={inc.id} className="hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-4 text-[11px] font-mono text-slate-400">{new Date(inc.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-[11px] font-bold text-white uppercase tracking-tight">UNIT_{inc.id.substring(0, 8)}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest px-2 py-1 bg-cyan-500/5 border border-cyan-500/20">
                                            {inc.category || 'GENERAL'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${inc.severity >= 4 ? 'bg-red-500' : 'bg-cyan-500'}`} />
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">LEVEL_0{inc.severity}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-500 hover:text-cyan-400 transition-colors">
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
