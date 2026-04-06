import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Activity, ShieldAlert, Terminal, Server } from 'lucide-react';
import { Card } from './ui/Card';

const StatBar = ({ label, value, color = 'bg-electric' }) => (
    <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
            <span className="text-[10px] font-mono font-bold text-white">{value}%</span>
        </div>
        <div className="h-1 bg-white/5 relative overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                className={`absolute inset-y-0 left-0 ${color} shadow-[0_0_10px_rgba(0,240,255,0.5)]`}
            />
        </div>
    </div>
);

export const AICommand = ({ selectedIncident, stats }) => {
    return (
        <aside className="w-1/4 h-full flex flex-col bg-navy-950/40 backdrop-blur-xl border-l border-white/10 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
                {/* AI TRIAGE SUMMARY */}
                <section className="mb-8">
                    <header className="flex items-center gap-3 mb-6">
                        <Cpu size={16} className="text-electric" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">AI Triage Summary</h3>
                    </header>
                    
                    <Card variant="panel" className="p-4 bg-white/[0.02] border-white/5">
                        <StatBar label="Resource Load" value={68} />
                        <StatBar label="Response Priority" value={92} color="bg-danger" />
                        <StatBar label="Node Integrity" value={84} color="bg-emerald" />
                        <StatBar label="Sync Latency" value={12} color="bg-warning" />
                    </Card>
                </section>

                {/* TARGET INTEL */}
                <section className="mb-8">
                    <header className="flex items-center gap-3 mb-6">
                        <ShieldAlert size={16} className="text-warning" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Target Intel</h3>
                    </header>

                    {selectedIncident ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={selectedIncident.id}
                        >
                            <Card className="p-5 bg-electric/5 border-electric/20 mb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-mono text-electric font-bold uppercase tracking-tighter">OBJ_REF: {selectedIncident.id.substring(0,12)}</span>
                                    <Zap size={14} className="text-electric fill-electric" />
                                </div>
                                <h4 className="text-sm font-black text-white uppercase mb-2 leading-tight">{selectedIncident.title}</h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-tight">{selectedIncident.description}</p>
                            </Card>

                            <div className="space-y-2">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-3">AI Action Plan</span>
                                {[
                                    'Establish peripheral containment zone',
                                    'Deploy Tier-1 medical responders',
                                    'Initialize structural integrity scan',
                                    'Evacuate sector delta-9'
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-3 items-start p-2.5 bg-white/[0.03] border border-white/5 text-[9px] font-mono text-slate-300 uppercase">
                                        <span className="text-electric font-bold">0{i+1}</span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
                            <Terminal size={32} className="text-slate-500 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-loose">Waiting for <br />Target Selection</p>
                        </div>
                    )}
                </section>
            </div>

            {/* SYSTEM VITALS */}
            <footer className="p-6 bg-black/40 border-t border-white/10 shrink-0">
                <header className="flex items-center gap-3 mb-4">
                    <Activity size={14} className="text-emerald" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">System Vitals</h3>
                </header>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Uptime</span>
                        <span className="text-xs font-mono font-bold text-emerald">99.998%</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Queue</span>
                        <span className="text-xs font-mono font-bold text-electric">0ms LAT</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Responders</span>
                        <span className="text-xs font-mono font-bold text-warning">24 ACTIVE</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Kernel</span>
                        <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                            <Server size={10} /> v4.2.0
                        </span>
                    </div>
                </div>
            </footer>
        </aside>
    );
};
