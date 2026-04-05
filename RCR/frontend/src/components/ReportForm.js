import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { queueReport, getPendingReports, markReportSynced } from '../idb';
import { localAnalyze } from '../utils/edgeAi';
import { Mic, MicOff, Camera, AlertTriangle, Cpu, Info, ShieldCheck } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

function ReportForm() {
    const [form, setForm] = useState({
        title: '',
        description: '',
        severity: 3,
        category: '',
        floorLevel: 1,
        roomNumber: '',
        wingId: '',
    });
    const [position, setPosition] = useState({ lng: 0, lat: 0 });
    const [mediaType, setMediaType] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const [isAudioRecording, setIsAudioRecording] = useState(false);
    const [sosMessage, setSosMessage] = useState('');
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiResult, setAiResult] = useState({ category: '', severity: 0, method: 'Cloud AI (Gemini)' });
    
    const mediaRecorderRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setIsSpeechSupported(!!SpeechRecognition);
    }, []);

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => {
                    console.warn('[ReportForm] Geolocation FAILED:', err.message);
                    toast.error(`📍 Location Error: ${err.message}`);
                }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
            );
        }
    }, []);

    useEffect(() => {
        let isSyncing = false;
        async function syncPending() {
            if (isSyncing) return;
            isSyncing = true;
            try {
                const pending = await getPendingReports();
                if (!pending.length) return;
                for (const rpt of pending) {
                    try {
                        let mediaBase64 = '';
                        if (rpt.mediaFile) {
                            mediaBase64 = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(rpt.mediaFile);
                            });
                        }
                        const { localId, mediaFile, ...cleanRpt } = rpt;
                        await api.post('/incidents', { ...cleanRpt, mediaBase64 });
                        await markReportSynced(localId);
                        toast.success(`✅ Offline report synced: ${rpt.title}`);
                    } catch (err) {
                        console.error('⛔ Sync failed', err);
                    }
                }
            } finally {
                isSyncing = false;
            }
        }
        if (navigator.onLine) syncPending();
        window.addEventListener('online', syncPending);
        return () => window.removeEventListener('online', syncPending);
    }, []);

    const handleVoiceToggle = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        if (!isRecording) {
            setIsRecording(true);
            recognition.start();
        } else {
            recognition.stop();
        }
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map(r => r[0].transcript).join(' ');
            setForm(prev => ({...prev, description: prev.description ? `${prev.description} ${transcript}` : transcript }));
        };
        recognition.onend = () => setIsRecording(false);
    };

    const handleAudioSOS = async() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error('Audio recording not supported');
            return;
        }
        if (!isAudioRecording) {
            setSosMessage('SOS: Recording Protocol Active...');
            setIsAudioRecording(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            const chunks = [];
            recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
            recorder.onstop = async() => {
                const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
                const currentMimeType = recorder.mimeType || 'audio/webm';
                setIsAudioRecording(false);
                setSosMessage('SOS: Encrypting & Dispatching...');
                const reader = new FileReader();
                reader.onloadend = async() => {
                    const base64 = reader.result.split(',')[1];
                    try {
                        await api.post('/incidents/voice', {
                            audioBase64: base64,
                            audioMimeType: currentMimeType,
                            lat: position.lat,
                            lng: position.lng,
                            floorLevel: form.floorLevel,
                            roomNumber: form.roomNumber,
                            wingId: form.wingId,
                        });
                        setSosMessage('');
                        toast.success('Emergency Audio Dispatched');
                    } catch (err) {
                        toast.error('SOS triage failed');
                        setSosMessage('');
                    }
                };
                reader.readAsDataURL(blob);
            };
            recorder.start();
        } else {
            mediaRecorderRef.current?.stop();
        }
    };

    const handleMediaChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setMediaType(file.type);
        setMediaFile(file);
        
        const previewUrl = URL.createObjectURL(file);
        setMediaPreview(previewUrl);

        if (navigator.onLine) {
            toast('AI Analysis Initialized', { icon: '🧠' });
            const reader = new FileReader();
            reader.onload = async(e) => {
                const base64data = e.target.result;
                try {
                    const { data } = await api.post('/incidents/analyze', {
                        ...form,
                        mediaType: file.type,
                        mediaBase64: base64data,
                    });
                    if (data.predictedCategory || data.auto_severity) {
                        setAiResult({
                            category: data.predictedCategory || 'UNCATEGORIZED',
                            severity: data.auto_severity || 3,
                            method: 'Cloud AI (Gemini)'
                        });
                        setForm(prev => ({
                            ...prev,
                            category: data.predictedCategory || prev.category,
                            severity: data.auto_severity || prev.severity
                        }));
                        setShowAiModal(true);
                    }
                } catch (err) {
                    console.warn('AI analysis failed', err);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        
        let finalForm = { ...form };
        let triageMethod = 'Cloud AI (Gemini)';

        if (!navigator.onLine) {
            const toastId = toast.loading('Initializing Edge AI for offline triage...', {
                icon: '🧠'
            });

            // Progress callback to show loading state if model is being cached/downloaded for the first time
            const progressCb = (info) => {
                if (info.status === 'progress') {
                    toast.loading(`Loading NLP model: ${Math.round(info.progress)}%`, { id: toastId });
                } else if (info.status === 'ready') {
                    toast.loading('Analyzing incident...', { id: toastId });
                }
            };

            const localResult = await localAnalyze(form.title, form.description, progressCb);
            
            toast.dismiss(toastId);
            
            finalForm.category = localResult.category;
            finalForm.severity = localResult.severity;
            triageMethod = localResult.triageMethod;
            
            setAiResult({
                category: localResult.category,
                severity: localResult.severity,
                method: localResult.triageMethod
            });
            setShowAiModal(true);
            toast.success(`${localResult.triageMethod} Active`);
        }

        const payload = {
            ...finalForm,
            lng: position.lng,
            lat: position.lat,
            mediaType,
            triageMethod
        };

        if (navigator.onLine) {
            try {
                let mediaBase64 = '';
                if (mediaFile) {
                    mediaBase64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(mediaFile);
                    });
                }
                await api.post('/incidents', { ...payload, mediaBase64 });
                toast.success('Incident Signal Dispatched');
                setForm({ title: '', description: '', severity: 3, category: '', floorLevel: 1, roomNumber: '', wingId: '' });
                setMediaPreview('');
                setMediaFile(null);
            } catch (err) {
                toast.error('Dispatch Failure');
            }
        } else {
            await queueReport({...payload, mediaFile, synced: false });
            toast.success('Queued for secure sync');
        }
    };

    const Label = ({ children }) => (
        <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 mb-3 flex items-center gap-2">
            <span className="w-1 h-1 bg-electric rounded-full"></span> {children}
        </label>
    );

    const Input = (props) => (
        <input 
            {...props}
            className={`w-full bg-navy-900/50 border border-white/5 rounded-2xl focus:border-electric focus:ring-1 focus:ring-electric/50 transition-all py-4 px-5 outline-none text-slate-200 placeholder-slate-600 ${props.className || ''}`}
        />
    );

    return (
        <Card className="w-full overflow-hidden shadow-2xl">
            <div className="bg-white/[0.02] p-6 sm:p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h3 className="text-xl font-bold uppercase tracking-widest text-white">Incident Manifest</h3>
                    <p className="text-electric text-[9px] font-mono tracking-[0.2em] mt-1 uppercase">Node: {position.lat.toFixed(2)}, {position.lng.toFixed(2)}</p>
                </div>
                {!navigator.onLine && (
                    <Badge variant="amber" className="animate-pulse">Edge Resilience Active</Badge>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
                
                {/* EMERGENCY CONTROLS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button 
                        type="button"
                        variant="danger"
                        onClick={handleAudioSOS}
                        className={`py-5 text-[10px] ${isAudioRecording ? 'animate-pulse shadow-danger' : ''}`}
                    >
                        {isAudioRecording ? <MicOff size={18} /> : <AlertTriangle size={18} />}
                        {isAudioRecording ? 'Recording SOS...' : 'Trigger SOS Audio'}
                    </Button>
                    
                    {isSpeechSupported && (
                        <Button 
                            type="button"
                            variant="secondary"
                            onClick={handleVoiceToggle}
                            className={`py-5 text-[10px] ${isRecording ? 'border-electric text-electric animate-pulse' : ''}`}
                        >
                            <Mic size={18} />
                            {isRecording ? 'System Listening...' : 'Voice Dictation'}
                        </Button>
                    )}
                </div>

                {sosMessage && (
                    <div className="bg-danger/10 border-l-2 border-danger px-4 py-3 text-[10px] font-mono text-danger animate-pulse uppercase tracking-widest">
                        &gt;&gt; {sosMessage}
                    </div>
                )}

                {/* TEXT INPUTS */}
                <div className="space-y-8">
                    <div>
                        <Label>Incident Identifier</Label>
                        <Input 
                            placeholder="Brief subject of the emergency..."
                            value={form.title}
                            onChange={(e) => setForm(prev => ({...prev, title: e.target.value }))}
                            required 
                        />
                    </div>

                    <div>
                        <Label>Operational Narrative</Label>
                        <textarea 
                            className="w-full bg-navy-900/50 border border-white/5 rounded-2xl focus:border-electric focus:ring-1 focus:ring-electric/50 transition-all py-4 px-5 outline-none text-slate-200 placeholder-slate-600 min-h-[140px] resize-none"
                            placeholder="Provide full context for responders..."
                            value={form.description}
                            onChange={(e) => setForm(prev => ({...prev, description: e.target.value }))}
                            required 
                        />
                    </div>
                </div>

                {/* LOCATION COORDINATES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-navy-900/30 p-6 rounded-3xl border border-white/5">
                    <div>
                        <Label>Wing / Sector</Label>
                        <Input placeholder="e.g., NORTH" value={form.wingId} onChange={(e) => setForm(prev => ({...prev, wingId: e.target.value.toUpperCase() }))} required />
                    </div>
                    <div>
                        <Label>Floor Level</Label>
                        <Input type="number" value={form.floorLevel} onChange={(e) => setForm(prev => ({...prev, floorLevel: Number(e.target.value) }))} required />
                    </div>
                    <div>
                        <Label>Room / Area</Label>
                        <Input placeholder="e.g., SUITE 402" value={form.roomNumber} onChange={(e) => setForm(prev => ({...prev, roomNumber: e.target.value.toUpperCase() }))} required />
                    </div>
                </div>

                {/* CATEGORY & SEVERITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <Label>Classification Protocol</Label>
                        <div className="relative">
                            <select 
                                className="w-full bg-navy-900/80 border border-white/5 text-slate-200 p-4 rounded-2xl outline-none appearance-none cursor-pointer focus:border-electric transition-all text-sm uppercase font-bold tracking-widest"
                                value={form.category}
                                onChange={(e) => setForm(prev => ({...prev, category: e.target.value }))}
                                required
                            >
                                <option value="" disabled>Select Category</option>
                                <option value="MEDICAL">Medical Emergency</option>
                                <option value="FIRE">Fire Incident</option>
                                <option value="INTRUDER">Security Breach</option>
                                <option value="MAINTENANCE">Utility / Maintenance</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                <Info size={16} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <Label>Severity Matrix</Label>
                            <Badge variant={form.severity >= 4 ? 'danger' : 'electric'} className="py-1">LEVEL {form.severity}</Badge>
                        </div>
                        <input 
                            type="range" min="1" max="5" 
                            className="w-full h-1.5 bg-navy-900 rounded-lg appearance-none cursor-pointer accent-electric border border-white/5"
                            value={form.severity}
                            onChange={(e) => setForm(prev => ({...prev, severity: Number(e.target.value) }))}
                        />
                        <div className="flex justify-between text-[8px] uppercase tracking-[0.3em] text-slate-600 mt-3 font-black">
                            <span>Minimal</span>
                            <span>Critical</span>
                        </div>
                    </div>
                </div>

                {/* VISUAL EVIDENCE */}
                <div className="border-2 border-dashed border-white/5 bg-navy-900/20 hover:bg-white/[0.03] transition-all p-10 rounded-3xl text-center group cursor-pointer relative overflow-hidden">
                    <input type="file" accept="image/*,video/*" capture="environment" onChange={handleMediaChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-white/5 group-hover:bg-electric/10 rounded-full flex items-center justify-center mb-6 transition-all duration-500 border border-white/5 group-hover:border-electric/30 shadow-2xl">
                            <Camera size={28} className="text-slate-500 group-hover:text-electric transition-colors" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Attach Visual Evidence</span>
                        <span className="text-[10px] text-slate-500 mt-2 font-mono">JPG, PNG, MP4 // Max 20MB</span>
                    </div>
                    
                    {mediaPreview && (
                        <div className="mt-8 rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl relative animate-in fade-in zoom-in duration-500">
                            {mediaType.startsWith('image/') 
                                ? <img src={mediaPreview} alt="Evidence" className="w-full max-h-[400px] object-contain" />
                                : <video controls src={mediaPreview} className="w-full max-h-[400px]" />
                            }
                            <div className="absolute top-4 right-4 bg-navy-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black text-electric uppercase border border-white/10">Signal Attached</div>
                        </div>
                    )}
                </div>

                <Button 
                    type="submit"
                    className="w-full py-6 text-base font-black shadow-[0_0_40px_rgba(0,240,255,0.2)]"
                >
                    <ShieldCheck size={20} />
                    Submit Terminal Dispatch
                </Button>
            </form>

            {/* AI ANALYSIS MODAL */}
            {showAiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy-950/90 backdrop-blur-xl">
                    <Card className="w-full max-w-md p-10 shadow-[0_0_100px_rgba(0,240,255,0.15)] animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-electric/10 rounded-full blur-[80px]"></div>
                        
                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-electric/10 flex items-center justify-center border border-electric/20 mx-auto mb-8 shadow-electric">
                                <Cpu size={32} className="text-electric animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight uppercase mb-2">Triage Analysis</h3>
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-10">Engine: {aiResult.method}</p>
                            
                            <div className="space-y-10 bg-navy-950/50 p-8 rounded-3xl border border-white/5 text-left shadow-inner">
                                <div>
                                    <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-3">Predicted Category</p>
                                    <p className="text-4xl font-black tracking-tighter text-white">{aiResult.category}</p>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em]">Risk Assessment</p>
                                        <span className="text-2xl font-black text-white">{aiResult.severity}<span className="text-slate-500 text-sm">/5</span></span>
                                    </div>
                                    <div className="flex gap-2 h-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <div 
                                                key={s} 
                                                className={`flex-1 rounded-full transition-all duration-700 ${s <= aiResult.severity ? (aiResult.severity >= 4 ? 'bg-danger shadow-danger' : 'bg-electric shadow-electric') : 'bg-white/5'}`}
                                                style={{ transitionDelay: `${s * 100}ms` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={() => setShowAiModal(false)}
                                className="mt-12 w-full py-5"
                            >
                                Confirm AI Data
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </Card>
    );
}

export default ReportForm;
