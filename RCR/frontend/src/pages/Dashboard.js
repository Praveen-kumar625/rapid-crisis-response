import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, AlertCircle, Activity, ChevronRight, ShieldAlert } from 'lucide-react';
import CrisisMap from '../components/CrisisMap';
import api from '../api';
import { getSocket } from '../socket';

const Dashboard = () => {
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [mapMode, setMapMode] = useState('ALL');

    useEffect(() => {
        let socket;

        const init = async () => {
            const { data } = await api.get('/incidents');
            setIncidents(data);

            socket = await getSocket();
<<<<<<< HEAD
            if (!socket) return;
            socket.on('incident.created', (payload) => {
                try {
                    if (!payload || !payload.incident) return;
                    if (isMounted) {
                        setIncidents(prev => [payload.incident, ...prev]);
                    }
                } catch (err) {
                    console.error('[Socket] Dispatch failed for incident.created', err);
                }
            });
            socket.on('incident.status-updated', (payload) => {
                try {
                    if (!payload || !payload.incident) return;
                    if (isMounted) {
                        setIncidents(prev => prev.map(inc => inc.id === payload.incident.id ? payload.incident : inc));
                    }
                } catch (err) {
                    console.error('[Socket] Dispatch failed for incident.status-updated', err);
                }
=======

            socket.on('incident.created', (p) => {
                setIncidents(prev => [p.incident, ...prev]);
            });

            socket.on('incident.status-updated', (p) => {
                setIncidents(prev =>
                    prev.map(i => i.id === p.incident.id ? p.incident : i)
                );
>>>>>>> 5c219bc (Update)
            });
        };

        init();

        return () => {
            socket?.off('incident.created');
            socket?.off('incident.status-updated');
        };
    }, []);

    return (
<<<<<<< HEAD
        <div className="h-full w-full max-w-[100vw] overflow-hidden bg-[#020617] bg-grid-pattern text-slate-100 flex flex-col lg:flex-row lg:overflow-hidden font-sans selection:bg-cyan-500/30 relative">
            <div className="scanline-overlay"></div>
            
            {/* LEFT PANEL: INTEL FEED */}
            <aside className="w-full lg:w-1/4 h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950/40 backdrop-blur-xl flex flex-col shrink-0 min-h-0 z-10 overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 bg-danger rounded-full animate-pulse shadow-neon-red"></div>
                        </div>
                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-glow-red text-danger">Live Intel Feed</h2>
                    </div>
                    <span className="font-mono text-[9px] lg:text-[10px] text-slate-500 tabular-nums uppercase font-bold tracking-widest">Nodes: {incidents.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-4 space-y-4">
                    <AnimatePresence initial={false}>
                        {incidents.length === 0 ? (
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
=======
        <div className="min-h-screen bg-[#020617] text-white flex">

            {/* LEFT PANEL */}
            <aside className="w-1/4 border-r border-white/10 p-4 space-y-3 overflow-y-auto">
                <h2 className="text-xs uppercase text-red-400 font-bold tracking-widest">
                    Live Feed
                </h2>

                <AnimatePresence>
                    {incidents.map((inc) => (
                        <motion.div
                            key={inc.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => setSelectedIncident(inc)}
                            className="p-3 border border-white/10 cursor-pointer hover:border-cyan-500"
                        >
                            <p className="text-xs font-bold">{inc.title}</p>
                            <p className="text-[10px] text-gray-400">{inc.description}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
>>>>>>> 5c219bc (Update)
            </aside>

            {/* MAP */}
            <main className="w-2/4 relative">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {['ALL', 'SENSORS', 'REPORTS'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setMapMode(mode)}
                            className={`px-4 py-1 text-xs border ${
                                mapMode === mode ? 'bg-cyan-500 text-black' : ''
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                <CrisisMap incidents={incidents} activeFilter={mapMode} />

                <button className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-cyan-500 px-6 py-2 text-black font-bold flex gap-2">
                    <ShieldAlert size={16} />
                    Dispatch
                </button>
            </main>

<<<<<<< HEAD
            {/* RIGHT PANEL: AI TRIAGE & COMMAND */}
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
=======
            {/* RIGHT PANEL */}
            <aside className="w-1/4 border-l border-white/10 p-4 space-y-6">
>>>>>>> 5c219bc (Update)

                <div>
                    <h2 className="text-xs text-cyan-400 font-bold mb-3">AI Triage</h2>

                    {['MEDICAL', 'FIRE', 'SECURITY'].map((c) => (
                        <div key={c} className="mb-2">
                            <p className="text-[10px]">{c}</p>
                            <div className="h-1 bg-white/10">
                                <div className="h-1 bg-cyan-500 w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <h2 className="text-xs text-yellow-400 font-bold mb-2">
                        Selected Incident
                    </h2>

                    {selectedIncident ? (
                        <div className="text-xs">
                            {selectedIncident.description}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-xs">
                            No selection
                        </div>
                    )}
                </div>

            </aside>
        </div>
    );
};

export default Dashboard;