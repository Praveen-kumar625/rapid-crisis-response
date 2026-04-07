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
        <div className="min-h-[calc(100vh-64px)] w-full bg-[#0B0F19] text-slate-100 flex flex-col lg:flex-row overflow-hidden lg:overflow-hidden font-sans selection:bg-cyan-500/30">
            {/* LEFT PANEL: INTEL FEED */}
            <aside className="w-full lg:w-1/4 h-[40vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#151B2B] flex flex-col shrink-0">
                <div className="p-4 lg:p-6 border-b border-slate-800 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-neon-red"></div>
                        </div>
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.3em]">Live Intel Feed</h2>
                    </div>
                    <span className="font-mono text-[9px] lg:text-[10px] text-slate-500 tabular-nums uppercase">Nodes: {incidents.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-4 space-y-3 lg:space-y-4">
                    <AnimatePresence initial={false}>
                        {incidents.map((inc) => (
                            <motion.div
                                key={inc.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                onClick={() => setSelectedIncident(inc)}
                                className={`p-3 lg:p-4 rounded-none border transition-all cursor-pointer group ${
                                    selectedIncident?.id === inc.id 
                                    ? 'bg-[#1E293B] border-cyan-500 shadow-neon-cyan' 
                                    : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-1.5 py-0.5 rounded-none text-[8px] lg:text-[9px] font-black uppercase tracking-wider border ${
                                        inc.severity >= 4 ? 'bg-red-600 text-white border-red-400 shadow-neon-red' : 'bg-amber-500 text-black border-amber-300'
                                    }`}>
                                        LVL {inc.severity}
                                    </span>
                                    <span className="font-mono text-[8px] lg:text-[9px] text-slate-500 tabular-nums">
                                        {new Date(inc.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h3 className="text-xs lg:text-sm font-bold truncate uppercase tracking-tight text-white">{inc.title}</h3>
                                <p className="text-[10px] lg:text-[11px] text-slate-400 line-clamp-2 mt-1 font-light leading-relaxed">
                                    {inc.description}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </aside>

            {/* CENTER CANVAS: TACTICAL MAP */}
            <main className="w-full lg:w-1/2 h-[50vh] lg:h-full relative border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0B0F19] shrink-0">
                {/* Floating Toggles */}
                <div className="absolute top-4 lg:top-6 left-1/2 -translate-x-1/2 z-20 w-[90%] lg:w-auto">
                    <div className="bg-[#151B2B] border border-slate-700 p-1 rounded-none flex justify-center gap-1 shadow-tactical">
                        {['ALL', 'SENSORS', 'REPORTS'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setMapMode(mode)}
                                className={`px-3 lg:px-4 py-1 lg:py-1.5 rounded-none text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                                    mapMode === mode ? 'bg-cyan-600 text-black border border-cyan-400 shadow-neon-cyan' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-full opacity-90">
                    <CrisisMap 
                        incidents={incidents} 
                        onMarkerClick={setSelectedIncident}
                        activeFilter={mapMode}
                    />
                </div>

                {/* Dispatch FAB */}
                <div className="absolute bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 z-20 w-[80%] lg:w-auto">
                    <button className="w-full lg:w-auto bg-cyan-600 hover:bg-cyan-500 text-black px-6 lg:px-8 py-3 lg:py-4 rounded-none font-black uppercase tracking-[0.2em] text-[10px] lg:text-xs shadow-neon-cyan transition-all active:scale-95 border border-cyan-400">
                        Initial Dispatch Signal
                    </button>
                </div>
            </main>

            {/* RIGHT PANEL: AI TRIAGE & COMMAND */}
            <aside className="w-full lg:w-1/4 h-auto lg:h-full bg-[#151B2B] flex flex-col p-4 lg:p-6 space-y-6 lg:space-y-8 shrink-0 lg:overflow-y-auto custom-scrollbar">
                <section>
                    <div className="flex items-center gap-2 mb-4 lg:mb-6">
                        <Cpu className="text-cyan-400" size={16} />
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-white">AI Triage Summary</h2>
                    </div>
                    <div className="space-y-3 lg:space-y-4">
                        {['MEDICAL', 'FIRE', 'SECURITY'].map(cat => (
                            <div key={cat} className="space-y-1">
                                <div className="flex justify-between text-[8px] lg:text-[9px] font-mono uppercase text-slate-400">
                                    <span>{cat} Allocation</span>
                                    <span className="tabular-nums">{Math.floor(Math.random() * 100)}%</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-none overflow-hidden border border-slate-700">
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

                <section className="border-y border-slate-800 py-6 lg:py-8">
                    <div className="flex items-center gap-2 mb-4 text-amber-500">
                        <Zap size={16} />
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.3em]">Target Intel</h2>
                    </div>
                    {selectedIncident ? (
                        <div className="space-y-4">
                            <div className="bg-[#0B0F19] border border-slate-800 p-3 lg:p-4 rounded-none">
                                <p className="text-[8px] lg:text-[9px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Action Plan Generated by Gemini 1.5</p>
                                <div className="text-[11px] lg:text-xs font-light leading-relaxed whitespace-pre-line text-slate-300">
                                    {selectedIncident.actionPlan || "Analyzing payload..."}
                                </div>
                            </div>
                            <button className="w-full bg-red-600/10 border border-red-500/50 text-red-500 py-2.5 lg:py-3 text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-none">
                                Execute Deployment
                            </button>
                        </div>
                    ) : (
                        <div className="h-24 lg:h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-none opacity-40">
                            <AlertCircle size={20} className="text-slate-600" />
                            <p className="text-[8px] lg:text-[9px] mt-2 uppercase font-black tracking-widest text-slate-600 text-center px-4">Waiting for node selection</p>
                        </div>
                    )}
                </section>

                <section className="pb-4">
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                        <div className="bg-[#0B0F19] p-2.5 lg:p-3 border border-slate-800 rounded-none">
                            <span className="text-[7px] lg:text-[8px] uppercase text-slate-500 font-black block mb-1 tracking-widest">Net Latency</span>
                            <span className="font-mono text-cyan-400 text-xs lg:text-sm tabular-nums tracking-tighter">{sysStats.latency}</span>
                        </div>
                        <div className="bg-[#0B0F19] p-2.5 lg:p-3 border border-slate-800 rounded-none">
                            <span className="text-[7px] lg:text-[8px] uppercase text-slate-500 font-black block mb-1 tracking-widest">Queue Status</span>
                            <span className="font-mono text-amber-500 text-xs lg:text-sm tracking-tighter uppercase">{sysStats.queue}</span>
                        </div>
                    </div>
                </section>
            </aside>
        </div>
    );
};

export default Dashboard;