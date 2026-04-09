import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Activity, ShieldAlert, Terminal, Server, Mic, MicOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/Card';
import api from '../api';
import toast from 'react-hot-toast';
import { getSocket } from '../socket';

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

export const AICommand = ({ selectedIncident }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        if (selectedIncident) {
            setIsLoadingTasks(true);
            api.get(`/tasks/incident/${selectedIncident.id}`)
                .then(({ data }) => setTasks(data))
                .catch(console.error)
                .finally(() => setIsLoadingTasks(false));
        } else {
            setTasks([]);
        }
    }, [selectedIncident]);

    useEffect(() => {
        let isMounted = true;
        let socketInstance = null;

        (async () => {
            socketInstance = await getSocket();
            if (!isMounted) return;

            socketInstance.on('task.task-updated', (payload) => {
                if (isMounted) {
                    setTasks(prev => prev.map(t => t.id === payload.task.id ? payload.task : t));
                }
            });

            socketInstance.on('task.tasks-created', (payload) => {
                if (isMounted && selectedIncident && payload.incidentId === selectedIncident.id) {
                    setTasks(payload.tasks);
                }
            });
        })();

        return () => {
            isMounted = false;
            if (socketInstance) {
                socketInstance.off('task.task-updated');
                socketInstance.off('task.tasks-created');
            }
        };
    }, [selectedIncident]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                await processAudio(audioBlob, recorder.mimeType || 'audio/webm');
                stream.getTracks().forEach(t => t.stop());
            };

            recorder.start();
            setIsRecording(true);
            toast.success('AI Voice Link Active');
        } catch (err) {
            toast.error('Microphone Access Denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const processAudio = async (blob, mimeType) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result.split(',')[1];
            try {
                const { data } = await api.post('/sos/voice', {
                    audioBase64: base64,
                    audioMimeType: mimeType,
                    lat: 0, lng: 0 
                });
                if (data.success) {
                    toast.success('Voice Intel Processed');
                }
            } catch (err) {
                toast.error('Voice Triage Failed');
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsDataURL(blob);
    };

    return (
        <aside className="w-full h-full flex flex-col bg-navy-950/40 backdrop-blur-xl border-l border-white/10 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {/* VOICE COMMAND INTERFACE */}
                <section className="mb-8">
                    <header className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Mic size={16} className="text-electric" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Voice Command</h3>
                        </div>
                        {isRecording && <div className="w-2 h-2 bg-danger rounded-full animate-ping" />}
                    </header>

                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={`w-full py-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-all active:scale-95 ${
                            isRecording 
                            ? 'bg-danger/10 border-danger text-danger animate-pulse' 
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-electric/50 hover:text-electric'
                        }`}
                    >
                        {isProcessing ? (
                            <Loader2 className="animate-spin text-electric" size={24} />
                        ) : isRecording ? (
                            <MicOff size={24} />
                        ) : (
                            <Mic size={24} />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isProcessing ? 'Analyzing...' : isRecording ? 'Stop Recording' : 'Initiate Voice Link'}
                        </span>
                    </button>
                </section>

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
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-3">Tactical Task Execution</span>
                                {isLoadingTasks ? (
                                    <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-electric" size={16} /></div>
                                ) : tasks.length > 0 ? (
                                    tasks.map((task, i) => (
                                        <div key={task.id} className="flex flex-col gap-1 p-2.5 bg-white/[0.03] border border-white/5 font-mono text-[9px]">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-electric font-bold">{i+1 < 10 ? `0${i+1}` : i+1}</span>
                                                    {task.status === 'SECURED' && <CheckCircle2 size={10} className="text-emerald" />}
                                                </div>
                                                <span className={`px-1.5 py-0.5 rounded-none text-[7px] font-black ${
                                                    task.status === 'SECURED' ? 'bg-emerald/20 text-emerald' : 
                                                    task.status === 'ACKNOWLEDGED' ? 'bg-electric/20 text-electric' :
                                                    task.status === 'DISPATCHED' ? 'bg-amber/20 text-amber' :
                                                    'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                            <span className="text-slate-300 uppercase leading-tight">{task.instruction}</span>
                                            <span className="text-[7px] text-slate-500 mt-1">ASSIGNED: {task.assigned_role}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[9px] text-slate-600 italic">No tasks dispatched for this unit.</p>
                                )}
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
