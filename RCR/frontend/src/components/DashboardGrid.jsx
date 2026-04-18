import React from 'react';
import { motion } from 'framer-motion';
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

const containerVariants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
    animate: { 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)',
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
};

const StatCard = ({ title, value, subValue, icon: Icon, color, glow }) => (
    <motion.div 
        variants={itemVariants}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={`relative group glass-panel bg-slate-900/40 backdrop-blur-xl border border-white/5 p-5 overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-2xl ${glow}`}
    >
        {/* Animated Scanning Line */}
        <div className="absolute inset-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-y-full group-hover:animate-scanline" />
        
        <div className={`absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 ${color}`}>
            <Icon size={80} strokeWidth={1} />
        </div>
        
        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className={`p-2 bg-black/40 border border-white/10 rounded shadow-inner ${color}`}>
                <Icon size={18} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 italic">{title}</h3>
        </div>
        
        <div className="flex items-baseline gap-3 relative z-10">
            <span className="text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-sm">{value}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 border border-white/5">{subValue}</span>
        </div>
    </motion.div>
);

export const DashboardGrid = () => {
    const { state } = useTactical();
    const { incidents, responders, commsStatus } = state;

    const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
    const criticalIncidentsCount = activeIncidents.filter(i => i.severity >= 4).length;
    const availableResponders = responders.filter(r => r.status === 'AVAILABLE').length;

    return (
        <motion.div 
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto scanline-overlay"
        >
            {/* TOP METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bento-container">
                <StatCard 
                    title="Active_Breaches" 
                    value={activeIncidents.length} 
                    subValue={`${criticalIncidentsCount} CRITICAL`} 
                    icon={ShieldAlert} 
                    color="text-red-500" 
                    glow="hover:shadow-red-500/10"
                />
                <StatCard 
                    title="Responder_Units" 
                    value={responders.length} 
                    subValue={`${availableResponders} READY`} 
                    icon={Users} 
                    color="text-cyan-400" 
                    glow="hover:shadow-cyan-500/10"
                />
                <StatCard 
                    title="Grid_Stability" 
                    value="99.9%" 
                    subValue={commsStatus ? "STABLE" : "DEGRADED"} 
                    icon={Zap} 
                    color="text-amber-500" 
                    glow="hover:shadow-amber-500/10"
                />
                <StatCard 
                    title="Response_Time" 
                    value="1.4m" 
                    subValue="AVG_UPLINK" 
                    icon={Clock} 
                    color="text-emerald-400" 
                    glow="hover:shadow-emerald-500/10"
                />
            </div>

            {/* MAIN DASHBOARD CONTENT */}
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-320px)] min-h-[550px]">
                {/* TACTICAL MAP - MAIN VIEW */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-12 lg:col-span-8 bg-slate-900/60 backdrop-blur-xl border border-white/5 relative overflow-hidden flex flex-col shadow-2xl shadow-black/50"
                >
                    <div className="h-14 border-b border-white/5 bg-white/[0.02] px-6 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic">Live_Tactical_Grid</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded text-cyan-400/70">
                                <Search size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest font-mono">SEC_01_ALPHA</span>
                            </div>
                            <button className="p-2 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                                <Filter size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative bg-slate-950/40">
                        <TacticalMap incidents={incidents} />
                        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                            {['SAT', 'GRID', 'Z-AXIS'].map(layer => (
                                <button key={layer} className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-cyan-400 hover:border-cyan-500/50 transition-all shadow-xl">
                                    {layer}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* INTEL FEED - SIDE PANEL */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-12 lg:col-span-4 flex flex-col gap-6 min-h-0"
                >
                    <div className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-white/5 flex flex-col overflow-hidden shadow-2xl shadow-black/50">
                        <IntelFeed incidents={incidents} />
                    </div>
                    
                    {/* QUICK ACTION CARD */}
                    <div className="h-32 bg-red-950/10 backdrop-blur-xl border border-red-500/20 flex items-center justify-between p-6 shrink-0 group hover:bg-red-950/20 transition-all cursor-pointer relative overflow-hidden">
                        {/* High-Tech Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 group-hover:w-1.5 transition-all" />
                        
                        <div className="space-y-1 relative z-10">
                            <h3 className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <ShieldAlert size={14} className="animate-pulse" /> Direct_SOS_Relay
                            </h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Broadcast emergency signal to all units</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.15)] group-hover:scale-110 group-hover:bg-red-600/20 transition-all duration-500">
                            <ShieldAlert size={28} className="text-red-500 group-hover:animate-pulse" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* RECENT ACTIVITY / LOGS TABLE */}
            <motion.div 
                variants={itemVariants}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/5 overflow-hidden shadow-2xl shadow-black/50"
            >
                <div className="h-14 border-b border-white/5 bg-white/[0.02] px-6 flex items-center shrink-0">
                    <div className="w-1 h-4 bg-cyan-600 mr-4" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic">System_Audit_Log</h2>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-black/20 sticky top-0 z-10">
                            <tr>
                                {['Timestamp', 'Node_ID', 'Event_Type', 'Status', 'Actions'].map((h, i) => (
                                    <th key={h} className={`px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 ${i === 4 ? 'text-right' : ''}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {incidents.slice(0, 5).map((inc) => (
                                <tr key={inc.id} className="hover:bg-cyan-500/[0.03] transition-colors group">
                                    <td className="px-6 py-4 text-[11px] font-mono text-slate-500 tabular-nums">[{new Date(inc.createdAt).toLocaleTimeString()}]</td>
                                    <td className="px-6 py-4 text-[11px] font-black text-slate-300 uppercase tracking-tighter">UNIT_{inc.id.substring(0, 8)}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest px-2 py-1 bg-cyan-500/5 border border-cyan-500/10">
                                            {inc.category || 'GENERAL'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${inc.severity >= 4 ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-cyan-500'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${inc.severity >= 4 ? 'text-red-500' : 'text-slate-400'}`}>LEVEL_0{inc.severity}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-600 hover:text-cyan-400 transition-colors bg-white/[0.02] border border-white/5 hover:border-cyan-500/30">
                                            <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DashboardGrid;
