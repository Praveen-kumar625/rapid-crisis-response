import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Activity, ShieldAlert, Terminal, Server, Mic, MicOff, Loader2, CornerDownLeft } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const StatBar = ({ label, value, color = 'bg-cyan-500' }) => (
    <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
            <span className="text-[10px] font-mono font-black text-white tabular-nums">{value}%</span>
        </div>
        <div className="h-1 bg-white/5 relative overflow-hidden border border-white/5">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                className={`absolute inset-y-0 left-0 ${color} shadow-neon-cyan`}
            />
        </div>
    </div>
);

export const AICommand = ({ selectedIncident }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [commandText, setFormText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [terminalLogs, setTerminalLogs] = useState([
        { msg: 'RCR_OS v4.2.0 INITIALIZED', type: 'info' },
        { msg: 'NEURAL_LINK READY', type: 'success' }
    ]);
    const [tasks, setTasks] = useState([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    
    const recognitionRef = useRef(null);
    const terminalEndRef = useRef(null);

    const addLog = useCallback((msg, type = 'info') => {
        setTerminalLogs(prev => [...prev.slice(-8), { 
            msg: `> ${msg.toUpperCase()}`, 
            type, 
            time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
        }]);
    }, []);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalLogs]);

    // Web Speech API Initialization
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                setFormText(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech Recognition Error:', event.error);
                setIsRecording(false);
                addLog(`COMMS_ERROR: ${event.error}`, 'error');
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, [addLog]);

    useEffect(() => {
        if (selectedIncident) {
            setIsLoadingTasks(true);
            addLog(`UPLINK ESTABLISHED: ${selectedIncident.id.substring(0,8)}`, 'success');
            api.get(`/tasks/incident/${selectedIncident.id}`)
                .then(({ data }) => setTasks(data))
                .catch(console.error)
                .finally(() => setIsLoadingTasks(false));
        } else {
            setTasks([]);
        }
    }, [selectedIncident, addLog]);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            toast.error('Voice protocols not supported');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            addLog('Neural Link Terminated', 'info');
        } else {
            setFormText('');
            recognitionRef.current.start();
            setIsRecording(true);
            addLog('Neural Link Active - Listening...', 'process');
        }
    };

    const handleCommandSubmit = async (e) => {
        e.preventDefault();
        if (!commandText.trim()) return;

        const cmd = commandText.trim();
        setFormText('');
        setIsProcessing(true);
        addLog(`EXECUTING: ${cmd}`, 'process');

        // FAIL-SAFE TIMEOUT
        const timeoutId = setTimeout(() => {
            setIsProcessing(false);
            addLog('Network Timeout - Command Aborted', 'error');
            toast.error('Network Timeout: Response delayed');
        }, 5000);

        try {
            // Simulated AI processing delay
            await new Promise(r => setTimeout(r, 1000));
            
            const { data } = await api.post('/sos/voice', {
                transcript: cmd,
                incidentId: selectedIncident?.id,
                lat: 0, lng: 0
            });

            clearTimeout(timeoutId);
            if (data.success) {
                addLog('Command Processed Successfully', 'success');
                toast.success('Directive Dispatched');
            } else {
                addLog('Command Ambiguous - Retrying...', 'warning');
            }
        } catch (err) {
            clearTimeout(timeoutId);
            addLog('System Fault Detected', 'error');
            toast.error('Command Execution Failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <aside className="w-full h-full flex flex-col bg-slate-950/40 backdrop-blur-xl border-l border-white/10 overflow-hidden font-mono">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-10">
                
                {/* TERMINAL INTERFACE */}
                <section className="glass-tactical bg-black/60 border-white/10 overflow-hidden shadow-2xl">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal size={12} className="text-cyan-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural_Console_v4.2</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald shadow-neon-emerald" />
                        </div>
                    </div>
                    
                    <div className="p-4 h-48 overflow-y-auto font-mono text-[10px] space-y-1.5 bg-black/20 custom-scrollbar">
                        {terminalLogs.map((log, i) => (
                            <div key={i} className="flex gap-3 leading-relaxed">
                                <span className="text-slate-600 shrink-0">[{log.time || '00:00:00'}]</span>
                                <span className={`uppercase font-bold ${
                                    log.type === 'success' ? 'text-emerald' : 
                                    log.type === 'error' ? 'text-danger' : 
                                    log.type === 'warning' ? 'text-warning' : 'text-cyan-500/80'
                                }`}>
                                    {log.msg}
                                </span>
                            </div>
                        ))}
                        {isProcessing && (
                            <div className="flex items-center gap-2 text-cyan-500">
                                <span className="animate-pulse">_</span>
                                <Loader2 size={10} className="animate-spin" />
                            </div>
                        )}
                        <div ref={terminalEndRef} />
                    </div>

                    <form onSubmit={handleCommandSubmit} className="p-4 border-t border-white/10 bg-white/5 relative group">
                        <div className="flex items-center gap-3">
                            <div className="text-cyan-500 font-black shrink-0">#</div>
                            <input 
                                type="text"
                                value={commandText}
                                onChange={(e) => setFormText(e.target.value)}
                                placeholder="ENTER_DIRECTIVE..."
                                className="bg-transparent border-none text-white text-xs font-black placeholder-slate-700 w-full focus:ring-0 outline-none uppercase tracking-widest"
                            />
                            <button 
                                type="button"
                                onClick={toggleRecording}
                                className={`shrink-0 p-2 transition-all ${isRecording ? 'text-danger animate-pulse' : 'text-slate-500 hover:text-cyan-400'}`}
                            >
                                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <button 
                                type="submit"
                                className="shrink-0 p-2 text-slate-500 hover:text-cyan-400 transition-colors"
                            >
                                <CornerDownLeft size={18} />
                            </button>
                        </div>
                        {isRecording && (
                            <motion.div 
                                layoutId="voice-indicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-danger shadow-neon-red"
                            />
                        )}
                    </form>
                </section>

                {/* AI TRIAGE SUMMARY */}
                <section>
                    <header className="flex items-center gap-3 mb-6 px-1">
                        <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20">
                            <Cpu size={14} className="text-cyan-400 text-glow-cyan" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Neural_Triage_Metrics</h3>
                    </header>
                    
                    <div className="space-y-2">
                        <StatBar label="Confidence_Ratio" value={selectedIncident?.isAiVerified ? 94 : 0} color={selectedIncident?.isAiVerified ? 'bg-emerald' : 'bg-slate-800'} />
                        <StatBar label="System_Entropy" value={selectedIncident ? 68 : 12} color="bg-warning" />
                        <StatBar label="Response_Priority" value={selectedIncident ? (selectedIncident.severity * 20) : 0} color="bg-danger" />
                    </div>
                </section>

                {/* TARGET INTEL */}
                <section>
                    <header className="flex items-center gap-3 mb-6 px-1">
                        <div className={`p-1.5 border transition-colors ${selectedIncident?.severity >= 4 ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                            <ShieldAlert size={14} className={selectedIncident?.severity >= 4 ? 'text-glow-red animate-pulse' : ''} />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Objective_Intelligence</h3>
                    </header>

                    {selectedIncident ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                key={selectedIncident.id}
                                className="space-y-6"
                            >
                                <div className={`p-5 border-l-4 relative overflow-hidden transition-all duration-500 ${
                                    selectedIncident.severity >= 4 ? 'bg-danger/5 border-l-danger' : 'bg-cyan-500/5 border-l-cyan-500'
                                }`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">REF_{selectedIncident.id.substring(0,12)}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 border uppercase tracking-tighter ${
                                                    selectedIncident.isAiVerified ? 'border-emerald/30 text-emerald bg-emerald/5' : 'border-warning/30 text-warning bg-warning/5'
                                                }`}>
                                                    {selectedIncident.isAiVerified ? 'CORE_VERIFIED' : 'SYNC_PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                        <Zap size={16} className={`${selectedIncident.severity >= 4 ? 'text-danger fill-danger shadow-neon-red' : 'text-cyan-500 fill-cyan-500'}`} />
                                    </div>
                                    <h4 className="text-sm font-black text-white uppercase mb-3 leading-tight tracking-tight italic">{selectedIncident.title}</h4>
                                    
                                    {selectedIncident.aiReasoning && (
                                        <div className="mt-6 pt-6 border-t border-white/5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping" />
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural_Justification</span>
                                            </div>
                                            <div className="p-4 bg-slate-950/60 border border-white/5 text-[10px] text-slate-400 font-bold italic leading-relaxed uppercase tracking-wider">
                                                &quot;{selectedIncident.aiReasoning}&quot;
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment_Queue</span>
                                        <div className="h-px bg-white/5 flex-1 mx-4" />
                                    </div>
                                    
                                    {isLoadingTasks ? (
                                        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-cyan-500" size={24} /></div>
                                    ) : tasks.length > 0 ? (
                                        tasks.map((task, i) => (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                key={task.id} 
                                                className="flex flex-col gap-2 p-4 glass-panel border-white/5 group hover:border-cyan-500/20"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-cyan-500 text-[10px] font-black tracking-tighter">0{i+1}</span>
                                                        <div className={`w-1 h-1 rounded-full ${task.status === 'SECURED' ? 'bg-emerald' : 'bg-slate-700'}`} />
                                                    </div>
                                                    <span className={`px-2 py-0.5 text-[8px] font-black tracking-widest border ${
                                                        task.status === 'SECURED' ? 'bg-emerald/10 text-emerald border-emerald/20' : 
                                                        task.status === 'ACKNOWLEDGED' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                                        'bg-slate-900 text-slate-500 border-white/5'
                                                    }`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-slate-200 font-bold uppercase leading-relaxed tracking-wide">{task.instruction}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Activity size={10} className="text-slate-600" />
                                                    <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase">UNIT::{task.assigned_role}</span>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center glass-panel border-dashed border-white/5 opacity-30">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic leading-loose">Queue_Empty<br/>Standing_By_For_Directives</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="py-24 flex flex-col items-center justify-center text-center opacity-20 glass-panel border-dashed border-white/10 mx-1">
                            <Terminal size={40} className="text-slate-500 mb-6" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] leading-loose">Waiting_For<br />Target_Uplink</p>
                        </div>
                    )}
                </section>
            </div>

            {/* SYSTEM VITALS */}
            <footer className="p-6 bg-slate-950/60 backdrop-blur-2xl border-t border-white/10 shrink-0 z-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <header className="flex items-center gap-3 mb-5 px-1">
                    <Activity size={14} className="text-emerald text-glow-cyan animate-pulse" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Node_Status_Telemetry</h3>
                </header>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 px-1">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] text-slate-600 uppercase font-black tracking-[0.2em]">Net_Uptime</span>
                        <span className="text-xs font-black text-emerald tabular-nums tracking-tighter">99.998%</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] text-slate-600 uppercase font-black tracking-[0.2em]">Sync_Latency</span>
                        <span className="text-xs font-black text-cyan-400 tabular-nums tracking-tighter">14ms_RTT</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] text-slate-600 uppercase font-black tracking-[0.2em]">Units_Active</span>
                        <span className="text-xs font-black text-warning tabular-nums tracking-tighter">24_OPERATIONAL</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] text-slate-600 uppercase font-black tracking-[0.2em]">Core_Kernel</span>
                        <span className="text-xs font-black text-slate-400 flex items-center gap-2 tracking-tighter">
                            <Server size={12} strokeWidth={2.5} /> v4.2.0_ULTRA
                        </span>
                    </div>
                </div>
            </footer>
        </aside>
    );
};

export default AICommand;
