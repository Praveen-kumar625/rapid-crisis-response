import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, AlertCircle, Activity, Info, ChevronRight, ShieldAlert } from 'lucide-react';
import CrisisMap from '../components/CrisisMap';
import api from '../api';
import { getSocket } from '../socket';

const Dashboard = () => {
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [mapMode, setMapMode] = useState('ALL');
    const [sysStats] = useState({ latency: '24ms', queue: 'IDLE', active: 12 });

    useEffect(() => {
        let isMounted = true;
        const fetchInitial = async () => {
            try {
                const { data } = await api.get('/api/incidents');
                if (isMounted) {
                    // RULE 1: Strict array validation before setting state
                    setIncidents(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('[Dashboard] Failed to fetch incidents', err);
                if (isMounted) setIncidents([]);
            }
        };
        fetchInitial();

        let socket;
        const initRealtime = async () => {
            socket = await getSocket();
            if (!socket) return;

            // RULE 1: Validate socket event payload
            socket.on('incident.created', (payload) => {
                try {
                    if (!payload || !payload.incident || !payload.incident.id) return;
                    if (isMounted) {
                        setIncidents(prev => {
                            const current = Array.isArray(prev) ? prev : [];
                            if (current.some(i => i.id === payload.incident.id)) return current;
                            return [payload.incident, ...current];
                        });
                    }
                } catch (err) {
                    console.error('[Socket] Dispatch failed for incident.created', err);
                }
            });

            socket.on('incident.status-updated', (payload) => {
                try {
                    if (!payload || !payload.incident || !payload.incident.id) return;
                    if (isMounted) {
                        setIncidents(prev => {
                            const current = Array.isArray(prev) ? prev : [];
                            return current.map(inc => inc.id === payload.incident.id ? payload.incident : inc);
                        });
                    }
                } catch (err) {
                    console.error('[Socket] Dispatch failed for incident.status-updated', err);
                }
            });
        };
        initRealtime();
        return () => {
            isMounted = false;
            socket?.off('incident.created');
            socket?.off('incident.status-updated');
        };
    }, []);

    return (
        <div className="h-full w-full max-w-[100vw] overflow-hidden bg-[#020617] bg-grid-pattern text-slate-100 flex flex-col lg:flex-row lg:overflow-hidden font-sans selection:bg-cyan-500/30 relative">
            <div className="scanline-overlay"></div>
            
            <aside className="w-full lg:w-1/4 h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950/40 backdrop-blur-xl flex flex-col shrink-0 min-h-0 z-10 overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 bg-danger rounded-full animate-pulse shadow-neon-red"></div>
                        </div>
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-glow-red text-danger">Live Intel Feed</h2>
                    </div>
                    <span className="font-mono text-[9px] lg:text-[10px] text-slate-500 tabular-nums uppercase font-bold tracking-widest">Nodes: {Array.isArray(incidents) ? incidents.length : 0}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-4 space-y-4">
                    <AnimatePresence initial={false}>
                        {!Array.isArray(incidents) || incidents.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                                <Activity size={48} className="mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Scanning Network...</p>
                            </div>
                        ) : (
                            incidents.map((inc) => (
                                <motion.div
                                    key={inc.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    onClick={() => setSelectedIncident(inc)}
                                    className={`p-4 rounded-none border transition-all cursor-pointer group relative overflow-hidden ${
                                        selectedIncident?.id === inc.id 
                                        ? 'glass-tactical border-cyan-500/50' 
                                        : 'glass-panel border-white/5'
                                    }`}
                                >
                                    {selectedIncident?.id === inc.id && (
                                        <motion.div 
                                            layoutId="active-indicator"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-neon-cyan"
                                        />
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-[0.15em] border ${
                                            inc.severity >= 4 
                                            ? 'bg-danger/20 text-danger border-danger/40 shadow-neon-red' 
                                            : 'bg-warning/20 text-warning border-warning/40'
                                        }`}>
                                            SEV_0{inc.severity}
                                        </span>
                                        <span className="font-mono text-[10px] text-slate-500 font-bold">
                                            {new Date(inc.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h3 className="text-xs lg:text-sm font-black uppercase tracking-tight text-white mb-2 leading-tight group-hover:text-cyan-400 transition-colors">{inc.title}</h3>
                                    <p className="text-[11px] text-slate-400 line-clamp-2 font-medium leading-relaxed uppercase tracking-wider">
                                        {inc.description}
                                    </p>
                                    <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight size={14} className="text-cyan-500" />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            <main className="w-full lg:w-1/2 h-[60vh] lg:h-full relative border-b lg:border-b-0 lg:border-r border-white/10 bg-[#020617] shrink-0">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[90%] lg:w-auto">
                    <div className="glass-tactical border-white/10 p-1.5 flex justify-center gap-1.5 shadow-2xl">
                        {['ALL', 'SENSORS', 'REPORTS'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setMapMode(mode)}
                                className={`px-5 py-2 rounded-none text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 ${
                                    mapMode === mode 
                                    ? 'bg-cyan-500 text-[#020617] shadow-neon-cyan' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-full opacity-80 mix-blend-lighten grayscale-[0.2] contrast-[1.1]">
                    <CrisisMap 
                        incidents={Array.isArray(incidents) ? incidents : []} 
                        onMarkerClick={setSelectedIncident}
                        activeFilter={mapMode}
                    />
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-[80%] lg:w-auto">
                    <button className="w-full lg:w-auto min-h-[52px] bg-cyan-500 hover:bg-cyan-400 text-[#020617] px-10 rounded-none font-black uppercase tracking-[0.3em] text-[11px] shadow-neon-cyan transition-all active:scale-[0.98] border-none group flex items-center justify-center gap-3">
                        <ShieldAlert size={18} className="group-hover:scale-110 transition-transform" />
                        Execute Dispatch Protocol
                    </button>
                </div>
            </main>

            <aside className="w-full lg:w-1/4 h-auto lg:h-full bg-slate-950/40 backdrop-blur-xl flex flex-col p-4 lg:p-6 space-y-8 shrink-0 overflow-y-auto custom-scrollbar z-10 border-l border-white/5">
                <section className="glass-panel p-5 border-white/10 shadow-xl shrink-0">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-cyan-500/10 border border-cyan-500/30">
                            <Cpu className="text-cyan-400 text-glow-cyan" size={18} />
                        </div>
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-white">AI Neural Triage</h2>
                    </div>
                    <div className="space-y-5">
                        {['MEDICAL', 'FIRE', 'SECURITY'].map(cat => (
                            <div key={cat} className="space-y-2">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    <span>{cat} Allocation</span>
                                    <span className="tabular-nums text-white">{(Math.random() * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-1 bg-white/5 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.floor(Math.random() * 100)}%` }}
                                        className="h-full bg-cyan-500 shadow-neon-cyan" 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="border-y border-white/10 py-8">
                    <div className="flex items-center gap-3 mb-5 text-amber-500">
                        <Zap size={18} className="animate-pulse" />
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em]">Objective Intel</h2>
                    </div>
                    {selectedIncident ? (
                        <div className="space-y-5">
                            <div className="glass-tactical p-5 border-white/10 bg-slate-900/60">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping" />
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Synthesis {'//'} Gemini 1.5</p>
                                </div>
                                <div className="text-[11px] font-bold leading-relaxed uppercase tracking-wider text-slate-200">
                                    {selectedIncident.actionPlan || "Processing incoming telemetry..."}
                                </div>
                            </div>
                            <button className="w-full bg-danger/10 border border-danger/40 text-danger py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-danger hover:text-white transition-all active:scale-[0.98]">
                                Confirm Neutralization
                            </button>
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center glass-panel border-dashed border-white/10 opacity-40">
                            <AlertCircle size={24} className="text-slate-600 mb-3" />
                            <p className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-500 text-center px-6 leading-loose">Waiting for Node Uplink</p>
                        </div>
                    )}
                </section>

                <section className="space-y-4 pb-6">
                    <div className="flex items-center gap-3 text-emerald-500 mb-2">
                        <Activity size={18} />
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em]">Resilience Metrics</h2>
                    </div>
                    {[
                        { goal: 3, label: 'Health Index', value: '90% Latency Reduction', color: 'text-emerald-400' },
                        { goal: 9, label: 'Infrastructure', value: 'Edge-AI Synced', color: 'text-cyan-400' },
                        { goal: 11, label: 'Safe Sector', value: 'Z-Axis Active', color: 'text-amber-400' }
                    ].map((metric, i) => (
                        <div key={i} className="glass-panel p-4 border-white/5 flex justify-between items-center gap-4 hover:border-white/20 transition-colors">
                            <div className="min-w-0">
                                <span className="text-[8px] uppercase text-slate-500 font-black block tracking-widest mb-1">SDG_{metric.goal} {'//'} {metric.label}</span>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${metric.color}`}>{metric.value}</span>
                            </div>
                            <div className={`w-9 h-9 border border-white/10 flex items-center justify-center ${metric.color} font-black text-xs shrink-0`}>{metric.goal}</div>
                        </div>
                    ))}
                </section>
            </aside>
        </div>
    );
};

export default Dashboard;
