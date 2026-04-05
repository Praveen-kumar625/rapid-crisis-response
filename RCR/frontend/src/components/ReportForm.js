import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { queueReport, getPendingReports, markReportSynced } from '../idb';
import { localAnalyze } from '../utils/edgeAi';
import { Mic, MicOff, Camera, Video, AlertTriangle, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

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
            toast('Processing Evidence...', { icon: '🧠', duration: 2000 });
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
            const localResult = localAnalyze(form.title, form.description);
            finalForm.category = localResult.category;
            finalForm.severity = localResult.severity;
            triageMethod = localResult.triageMethod;
            
            setAiResult({
                category: localResult.category,
                severity: localResult.severity,
                method: localResult.triageMethod
            });
            setShowAiModal(true);
            toast.success('Offline Edge AI Active');
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
                toast.success('Incident Reported');
                setForm({ title: '', description: '', severity: 3, category: '', floorLevel: 1, roomNumber: '', wingId: '' });
                setMediaPreview('');
                setMediaFile(null);
            } catch (err) {
                toast.error('Failed to report incident');
            }
        } else {
            await queueReport({...payload, mediaFile, synced: false });
            toast.success('Queued offline (Secure Storage)');
        }
    };

    const InputLabel = ({ children }) => (
        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-2 flex items-center gap-2">
            <span className="w-1 h-1 bg-electric rounded-full"></span>
            {children}
        </label>
    );

    const PremiumInput = (props) => (
        <input 
            {...props}
            className={`w-full bg-navy-900/50 border border-surfaceBorder rounded-xl focus:border-electric focus:ring-1 focus:ring-electric/50 transition-all py-3 px-4 outline-none text-sm text-slate-200 placeholder-slate-600 ${props.className || ''}`}
        />
    );

    return (
        <div className="w-full glass-card overflow-hidden">
            <div className="bg-navy-800/80 p-6 md:p-8 border-b border-surfaceBorder flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger via-amber to-electric"></div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 uppercase">System Input</h2>
                    <p className="text-electric text-[10px] font-mono tracking-widest mt-1">Intelligence Collection Form</p>
                </div>
                {!navigator.onLine && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber/10 border border-amber/30 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber">Edge Mode</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 bg-surface backdrop-blur-md">
                
                {/* Voice / SOS Controls */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-navy-900/40 border border-surfaceBorder rounded-2xl">
                    <button 
                        type="button"
                        onClick={handleAudioSOS}
                        className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-all duration-500 font-bold text-[10px] uppercase tracking-[0.15em] ${
                            isAudioRecording 
                            ? 'bg-danger text-white shadow-[0_0_20px_rgba(255,51,102,0.5)] animate-pulse border border-danger/50' 
                            : 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 hover:border-danger/50'
                        }`}
                    >
                        {isAudioRecording ? <MicOff size={18} /> : <AlertTriangle size={18} />}
                        {isAudioRecording ? 'Recording SOS...' : 'Trigger SOS Audio'}
                    </button>
                    
                    {isSpeechSupported && (
                        <button 
                            type="button"
                            onClick={handleVoiceToggle}
                            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.15em] border ${
                                isRecording 
                                ? 'bg-electric/20 border-electric/50 text-electric shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-pulse' 
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            {isRecording ? <Mic size={18} /> : <Mic size={18} />}
                            {isRecording ? 'Listening...' : 'Voice Dictation'}
                        </button>
                    )}
                </div>

                {sosMessage && (
                    <div className="bg-danger/10 border-l-2 border-danger px-4 py-2 text-xs font-mono text-danger animate-pulse">
                        &gt; {sosMessage}
                    </div>
                )}

                {/* Core Narrative */}
                <div className="space-y-6">
                    <div>
                        <InputLabel>Subject Identifier</InputLabel>
                        <PremiumInput 
                            placeholder="e.g., Uncontained Fire in Kitchen Area"
                            value={form.title}
                            onChange={(e) => setForm(prev => ({...prev, title: e.target.value }))}
                            required 
                        />
                    </div>

                    <div>
                        <InputLabel>Detailed Narrative</InputLabel>
                        <textarea 
                            className="w-full bg-navy-900/50 border border-surfaceBorder rounded-xl focus:border-electric focus:ring-1 focus:ring-electric/50 transition-all py-4 px-4 outline-none text-sm text-slate-200 placeholder-slate-600 min-h-[120px] resize-y"
                            placeholder="Provide operational details..."
                            value={form.description}
                            onChange={(e) => setForm(prev => ({...prev, description: e.target.value }))}
                            required 
                        />
                    </div>
                </div>

                {/* Location Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-navy-900/30 p-6 rounded-2xl border border-surfaceBorder">
                    <div>
                        <InputLabel>Sector / Wing</InputLabel>
                        <PremiumInput placeholder="e.g., WEST" value={form.wingId} onChange={(e) => setForm(prev => ({...prev, wingId: e.target.value.toUpperCase() }))} required />
                    </div>
                    <div>
                        <InputLabel>Level</InputLabel>
                        <PremiumInput type="number" value={form.floorLevel} onChange={(e) => setForm(prev => ({...prev, floorLevel: Number(e.target.value) }))} required />
                    </div>
                    <div>
                        <InputLabel>Room</InputLabel>
                        <PremiumInput placeholder="e.g., 402" value={form.roomNumber} onChange={(e) => setForm(prev => ({...prev, roomNumber: e.target.value }))} required />
                    </div>
                </div>

                {/* Classification & Severity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <InputLabel>Classification Protocol</InputLabel>
                        <select 
                            className="w-full bg-navy-900/80 border border-surfaceBorder text-slate-200 p-3.5 rounded-xl outline-none appearance-none cursor-pointer focus:border-electric transition-all text-sm font-medium uppercase tracking-wide"
                            value={form.category}
                            onChange={(e) => setForm(prev => ({...prev, category: e.target.value }))}
                            required
                        >
                            <option value="" disabled>Select Category</option>
                            <option value="MEDICAL">Medical Emergency</option>
                            <option value="FIRE">Fire Incident</option>
                            <option value="INTRUDER">Security Breach</option>
                            <option value="MAINTENANCE">Maintenance</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <InputLabel>Severity</InputLabel>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                                form.severity >= 4 ? 'bg-danger/20 text-danger border-danger/30' : 'bg-electric/20 text-electric border-electric/30'
                            }`}>Level {form.severity}</span>
                        </div>
                        <input 
                            type="range" min="1" max="5" 
                            className="w-full h-2 bg-navy-900 rounded-lg appearance-none cursor-pointer border border-surfaceBorder"
                            style={{ accentColor: form.severity >= 4 ? '#ff3366' : '#00f0ff' }}
                            value={form.severity}
                            onChange={(e) => setForm(prev => ({...prev, severity: Number(e.target.value) }))}
                        />
                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-slate-500 mt-2 font-bold">
                            <span>Minimal</span>
                            <span>Critical</span>
                        </div>
                    </div>
                </div>

                {/* Media Upload */}
                <div className="border border-dashed border-surfaceBorder bg-navy-900/30 hover:bg-navy-900/50 transition-colors p-8 rounded-2xl text-center group">
                    <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                        <div className="w-12 h-12 bg-white/5 group-hover:bg-white/10 rounded-full flex items-center justify-center mb-4 transition-colors">
                            <Camera size={24} className="text-slate-400 group-hover:text-electric transition-colors" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Upload Visual Evidence</span>
                        <span className="text-[10px] text-slate-500 mt-2">Images or Video for AI Analysis</span>
                        <input type="file" accept="image/*,video/*" capture="environment" onChange={handleMediaChange} className="hidden" />
                    </label>
                    
                    {mediaPreview && (
                        <div className="mt-6 rounded-xl overflow-hidden border border-surfaceBorder bg-black shadow-lg relative">
                            {mediaType.startsWith('image/') 
                                ? <img src={mediaPreview} alt="Evidence" className="w-full max-h-[300px] object-contain opacity-90" />
                                : <video controls src={mediaPreview} className="w-full max-h-[300px] bg-black" />
                            }
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-mono text-electric uppercase border border-white/10">Attached</div>
                        </div>
                    )}
                </div>

                <button 
                    type="submit"
                    className="w-full py-4.5 bg-electric hover:bg-cyan text-navy-900 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    Dispatch Protocol
                </button>
            </form>

            {/* AI Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-md">
                    <div className="w-full max-w-md p-8 glass-card border border-surfaceBorder shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-electric/20 rounded-full blur-[50px]"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center border border-electric/20">
                                    <Cpu size={16} className="text-electric" />
                                </div>
                                <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-300">Analysis Result</h3>
                            </div>
                            
                            <div className="space-y-6 bg-navy-900/50 p-6 rounded-xl border border-surfaceBorder">
                                <div>
                                    <p className="text-slate-500 text-[9px] uppercase font-bold tracking-[0.15em] mb-1">Predicted Category</p>
                                    <p className="text-2xl font-bold tracking-tight text-white">{aiResult.category}</p>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-slate-500 text-[9px] uppercase font-bold tracking-[0.15em]">Assessed Risk Level</p>
                                        <span className="text-xl font-bold text-white">{aiResult.severity}<span className="text-slate-500 text-sm">/5</span></span>
                                    </div>
                                    <div className="flex gap-1.5 h-1.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <div 
                                                key={s} 
                                                className={`flex-1 rounded-full ${s <= aiResult.severity ? (aiResult.severity >= 4 ? 'bg-danger' : 'bg-electric') : 'bg-surfaceBorder'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-surfaceBorder">
                                    <p className="text-[9px] font-mono text-slate-400 uppercase">Engine: {aiResult.method}</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl border border-white/10 transition-all duration-300"
                            >
                                Confirm & Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportForm;
