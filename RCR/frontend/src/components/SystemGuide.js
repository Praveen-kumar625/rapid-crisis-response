import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Shield, Cpu, Wifi, Map as MapIcon, Zap } from 'lucide-react';

const GuideSection = ({ icon: Icon, title, description }) => (
    <div className="flex gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-none mb-4">
        <div className="w-10 h-10 bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <Icon size={20} className="text-cyan-400" />
        </div>
        <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-1 font-mono">{title}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-light">{description}</p>
        </div>
    </div>
);

export const SystemGuide = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[45] w-12 h-12 bg-[#151B2B] border border-slate-700 text-cyan-400 flex items-center justify-center shadow-neon-cyan hover:bg-slate-800 transition-all rounded-none lg:bottom-10 lg:right-10"
                aria-label="Open System Guide"
            >
                <Info size={24} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B0F19]/90 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-2xl bg-[#151B2B] border border-slate-800 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 lg:p-12">
                                <div className="flex items-center gap-4 mb-8">
                                    <Shield size={32} className="text-red-600" />
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tighter uppercase italic">RCR_Operational_Manual</h2>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-mono">System Version 4.0.2 {'//'} Secure Intel</p>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                                    <GuideSection 
                                        icon={Cpu} 
                                        title="Multimodal_AI_Triage" 
                                        description="RCR uses Google Gemini 1.5 Pro to analyze voice, text, and visual evidence. It automatically calculates risk (1-5) and categorizes incidents to ensure the right responders are deployed instantly."
                                    />
                                    <GuideSection 
                                        icon={Wifi} 
                                        title="Edge_Resilience_Protocol" 
                                        description="Network failure is common in crises. RCR's Edge AI architecture allows local devices to process reports and perform basic triage without internet, syncing the moment a signal is restored."
                                    />
                                    <GuideSection 
                                        icon={MapIcon} 
                                        title="Z-Axis_Precision_Routing" 
                                        description="Indoors, GPS is insufficient. We map floor levels and sector wings to provide vertical (z-axis) positioning, generating safe evacuation paths that avoid active hazard zones."
                                    />
                                    <GuideSection 
                                        icon={Zap} 
                                        title="P2P_Signal_Broadcasting" 
                                        description="Emergency signals are broadcasted to all nearby authorized units using WebSockets, achieving sub-100ms latency for critical situational awareness."
                                    />
                                </div>

                                <div className="mt-10 pt-8 border-t border-slate-800">
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-4 bg-cyan-600 text-black text-xs font-black uppercase tracking-[0.3em] hover:bg-cyan-500 transition-all shadow-neon-cyan"
                                    >
                                        Acknowledge_Operational_Protocol
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
