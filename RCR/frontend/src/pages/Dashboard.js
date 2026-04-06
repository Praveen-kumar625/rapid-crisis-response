import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Cpu, Zap, Map as MapIcon, Layers, Radio, AlertCircle } from 'lucide-react';
import CrisisMap from '../components/CrisisMap';
import api from '../api';
import { getSocket } from '../socket';

const Dashboard = () => {
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [mapMode, setMapMode] = useState('ALL');
    const [sysStats, setSysStats] = useState({ latency: '24ms', queue: 'IDLE', active: 12 });

    useEffect(() => {
        // 🚨 ARCHITECTURAL FIX: Real-time Signal Synchronization
        let isMounted = true;
        const fetchInitial = async () => {
            try {
                const { data } = await api.get('/incidents');
                if (isMounted) setIncidents(data);
            } catch (err) {
                console.error('[Dashboard] Failed to fetch incidents', err);
            }
        };
        fetchInitial();

        let socket;
        const initRealtime = async () => {
            socket = await getSocket();
            if (!socket) return;
            socket.on('incident.created', (payload) => {
                if (isMounted) {
                    setIncidents(prev => [payload.incident, ...prev]);
                }
            });
            socket.on('incident.status-updated', (payload) => {
                if (isMounted) {
                    setIncidents(prev => prev.map(inc => inc.id === payload.incident.id ? payload.incident : inc));
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
        <div className="h-[calc(100vh-80px)] w-full bg-slate-950 text-slate-200 flex overflow-hidden font-sans selection:bg-cyan-500/30">
            {/* LEFT PANEL: INTEL FEED (25%) */}
            <aside className="w-1/4 h-full border-r border-white/5 bg-slate-900/40 backdrop-blur-xl flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            <div className="absolute top-0 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <h2 className="text-xs font-black uppercase tracking-[0.3em]">Live Intel Feed</h2>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">Nodes: {incidents.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    <AnimatePresence initial={false}>
                        {incidents.map((inc) => (
                            <motion.div
                                key={inc.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                onClick={() => setSelectedIncident(inc)}
                                className={`p-4 rounded-lg border transition-all cursor-pointer group ${
                                    selectedIncident?.id === inc.id 
                                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                                        inc.severity >= 4 ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                                    }`}>
                                        LVL {inc.severity}
                                    </span>
                                    <span className="font-mono text-[9px] text-slate-500">
                                        {new Date(inc.created_at).toLocaleTimeString([], { hour12: false })}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold truncate uppercase tracking-tight">{inc.title}</h3>
                                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-light leading-relaxed">
                                    {inc.description}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </aside>

            {/* CENTER CANVAS: TACTICAL MAP (50%) */}
            <main className="w-1/2 h-full relative border-r border-white/5 bg-slate-950">
                {/* Floating Toggles */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-1 rounded-full flex gap-1 shadow-2xl">
                        {['ALL', 'SENSORS', 'REPORTS'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setMapMode(mode)}
                                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                    mapMode === mode ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'hover:bg-white/5'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity">
                    <CrisisMap 
                        incidents={incidents} 
                        onMarkerClick={setSelectedIncident}
                        activeFilter={mapMode}
                    />
                </div>

                {/* Dispatch FAB */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
                    <button className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-4 rounded-none font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all active:scale-95 border-b-4 border-cyan-700">
                        Initial Dispatch Signal
                    </button>
                </div>
            </main>

            {/* RIGHT PANEL: AI TRIAGE & COMMAND (25%) */}
            <aside className="w-1/4 h-full bg-slate-900/40 backdrop-blur-xl flex flex-col p-6 space-y-8">
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Cpu className="text-cyan-500" size={18} />
                        <h2 className="text-xs font-black uppercase tracking-[0.3em]">AI Triage Summary</h2>
                    </div>
                    <div className="space-y-4">
                        {['MEDICAL', 'FIRE', 'SECURITY'].map(cat => (
                            <div key={cat} className="space-y-1">
                                <div className="flex justify-between text-[9px] font-mono uppercase">
                                    <span>{cat} Allocation</span>
                                    <span>{Math.floor(Math.random() * 100)}%</span>
                                </div>
                                <div className="h-1 bg-white/5 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.floor(Math.random() * 100)}%` }}
                                        className="h-full bg-cyan-500" 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="flex-1 border-y border-white/5 py-8 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 mb-4 text-amber-500">
                        <Zap size={18} />
                        <h2 className="text-xs font-black uppercase tracking-[0.3em]">Target Intel</h2>
                    </div>
                    {selectedIncident ? (
                        <div className="space-y-4">
                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded">
                                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Action Plan Generated by Gemini 1.5</p>
                                <div className="text-xs font-light leading-relaxed whitespace-pre-line text-slate-300">
                                    {selectedIncident.ai_action_plan || "Analyzing payload..."}
                                </div>
                            </div>
                            <button className="w-full bg-red-500/10 border border-red-500/50 text-red-500 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                Execute Deployment
                            </button>
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl opacity-20">
                            <AlertCircle size={24} />
                            <p className="text-[10px] mt-2 uppercase font-black">Waiting for node selection</p>
                        </div>
                    )}
                </section>

                <section className="pb-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-3 border border-white/5 rounded">
                            <span className="text-[8px] uppercase text-slate-500 font-black block mb-1">Net Latency</span>
                            <span className="font-mono text-cyan-500 text-sm">{sysStats.latency}</span>
                        </div>
                        <div className="bg-slate-950 p-3 border border-white/5 rounded">
                            <span className="text-[8px] uppercase text-slate-500 font-black block mb-1">Queue Status</span>
                            <span className="font-mono text-amber-500 text-sm">{sysStats.queue}</span>
                        </div>
                    </div>
                </section>
            </aside>
        </div>
    );
};

export default Dashboard;
