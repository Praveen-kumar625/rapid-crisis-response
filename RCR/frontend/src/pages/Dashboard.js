import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, AlertCircle } from 'lucide-react';
import CrisisMap from '../components/CrisisMap';
import api from '../api';
import { getSocket } from '../socket';

const Dashboard = () => {
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [mapMode, setMapMode] = useState('ALL');
    const [sysStats] = useState({ latency: '24ms', queue: 'IDLE', active: 12 });

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
        <div className="min-h-[calc(100vh-64px)] w-full bg-slate-950 text-slate-200 flex flex-col lg:flex-row overflow-hidden lg:overflow-hidden font-sans selection:bg-cyan-500/30">
            {/* LEFT PANEL: INTEL FEED - Scrollable on desktop, stacks on mobile */}
            <aside className="w-full lg:w-1/4 h-[40vh] lg:h-full border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-900/40 backdrop-blur-xl flex flex-col shrink-0">
                <div className="p-4 lg:p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            <div className="absolute top-0 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] lg:tracking-[0.3em]">Live Intel Feed</h2>
                    </div>
                    <span className="font-mono text-[9px] lg:text-[10px] text-slate-500">Nodes: {incidents.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-4 space-y-3 lg:space-y-4">
                    <AnimatePresence initial={false}>
                        {incidents.map((inc) => (
                            <motion.div
                                key={inc.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                onClick={() => setSelectedIncident(inc)}
                                className={`p-3 lg:p-4 rounded-lg border transition-all cursor-pointer group ${
                                    selectedIncident?.id === inc.id 
                                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] lg:text-[9px] font-black uppercase tracking-tighter ${
                                        inc.severity >= 4 ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                                    }`}>
                                        LVL {inc.severity}
                                    </span>
                                    <span className="font-mono text-[8px] lg:text-[9px] text-slate-500">
                                        {new Date(inc.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h3 className="text-xs lg:text-sm font-bold truncate uppercase tracking-tight">{inc.title}</h3>
                                <p className="text-[10px] lg:text-[11px] text-slate-400 line-clamp-2 mt-1 font-light leading-relaxed">
                                    {inc.description}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </aside>

            {/* CENTER CANVAS: TACTICAL MAP */}
            <main className="w-full lg:w-1/2 h-[50vh] lg:h-full relative border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-950 shrink-0">
                {/* Floating Toggles */}
                <div className="absolute top-4 lg:top-6 left-1/2 -translate-x-1/2 z-20 w-[90%] lg:w-auto">
                    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-1 rounded-full flex justify-center gap-1 shadow-2xl overflow-x-auto no-scrollbar">
                        {['ALL', 'SENSORS', 'REPORTS'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setMapMode(mode)}
                                className={`px-3 lg:px-4 py-1 lg:py-1.5 rounded-full text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
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
                <div className="absolute bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 z-20 w-[80%] lg:w-auto">
                    <button className="w-full lg:w-auto bg-cyan-500 hover:bg-cyan-400 text-black px-6 lg:px-8 py-3 lg:py-4 rounded-none font-black uppercase tracking-[0.15em] lg:tracking-[0.2em] text-[10px] lg:text-xs shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all active:scale-95 border-b-4 border-cyan-700">
                        Initial Dispatch Signal
                    </button>
                </div>
            </main>

            {/* RIGHT PANEL: AI TRIAGE & COMMAND */}
            <aside className="w-full lg:w-1/4 h-auto lg:h-full bg-slate-900/40 backdrop-blur-xl flex flex-col p-4 lg:p-6 space-y-6 lg:space-y-8 shrink-0 lg:overflow-y-auto custom-scrollbar">
                <section>
                    <div className="flex items-center gap-2 mb-4 lg:mb-6">
                        <Cpu className="text-cyan-500" size={16} />
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] lg:tracking-[0.3em]">AI Triage Summary</h2>
                    </div>
                    <div className="space-y-3 lg:space-y-4">
                        {['MEDICAL', 'FIRE', 'SECURITY'].map(cat => (
                            <div key={cat} className="space-y-1">
                                <div className="flex justify-between text-[8px] lg:text-[9px] font-mono uppercase">
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

                <section className="border-y border-white/5 py-6 lg:py-8">
                    <div className="flex items-center gap-2 mb-4 text-amber-500">
                        <Zap size={16} />
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] lg:tracking-[0.3em]">Target Intel</h2>
                    </div>
                    {selectedIncident ? (
                        <div className="space-y-4">
                            <div className="bg-white/[0.02] border border-white/5 p-3 lg:p-4 rounded">
                                <p className="text-[8px] lg:text-[10px] font-mono text-slate-500 uppercase mb-1">Action Plan Generated by Gemini 1.5</p>
                                <div className="text-[11px] lg:text-xs font-light leading-relaxed whitespace-pre-line text-slate-300">
                                    {selectedIncident.ai_action_plan || "Analyzing payload..."}
                                </div>
                            </div>
                            <button className="w-full bg-red-500/10 border border-red-500/50 text-red-500 py-2.5 lg:py-3 text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                Execute Deployment
                            </button>
                        </div>
                    ) : (
                        <div className="h-24 lg:h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl opacity-20">
                            <AlertCircle size={20} />
                            <p className="text-[8px] lg:text-[10px] mt-2 uppercase font-black">Waiting for node selection</p>
                        </div>
                    )}
                </section>

                <section className="pb-4">
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                        <div className="bg-slate-950 p-2.5 lg:p-3 border border-white/5 rounded">
                            <span className="text-[7px] lg:text-[8px] uppercase text-slate-500 font-black block mb-1">Net Latency</span>
                            <span className="font-mono text-cyan-500 text-xs lg:text-sm">{sysStats.latency}</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 lg:p-3 border border-white/5 rounded">
                            <span className="text-[7px] lg:text-[8px] uppercase text-slate-500 font-black block mb-1">Queue Status</span>
                            <span className="font-mono text-amber-500 text-xs lg:text-sm">{sysStats.queue}</span>
                        </div>
                    </div>
                </section>
            </aside>
        </div>
    );
};

export default Dashboard;
