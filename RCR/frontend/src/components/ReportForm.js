import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { queueReport } from '../idb';
import { localAnalyze } from '../utils/edgeAi';
import { Mic, MicOff, Camera, AlertTriangle, Cpu, Info, ShieldCheck } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

const Label = ({ children, htmlFor }) => (
    <label 
        htmlFor={htmlFor}
        className="block text-[11px] sm:text-[12px] uppercase tracking-[0.2em] font-black text-slate-500 mb-3 flex items-center gap-2 cursor-pointer"
    >
        <span className="w-1 h-1 bg-cyan-500 rounded-none"></span> {children}
    </label>
);

const Input = React.forwardRef(({ className = '', ...props }, ref) => (
    <input 
        {...props}
        ref={ref}
        className={`w-full bg-[#0B0F19] border border-slate-800 rounded-none focus:border-cyan-500 focus:ring-0 transition-all min-h-[48px] py-3 px-5 outline-none text-slate-100 placeholder-slate-700 font-mono text-sm ${className}`}
    />
));
Input.displayName = 'Input';

const Textarea = React.forwardRef(({ className = '', ...props }, ref) => (
    <textarea 
        {...props}
        ref={ref}
        className={`w-full bg-[#0B0F19] border border-slate-800 rounded-none focus:border-cyan-500 focus:ring-0 transition-all py-4 px-5 outline-none text-slate-100 placeholder-slate-700 min-h-[160px] resize-none font-mono text-sm ${className}`}
    />
));
Textarea.displayName = 'Textarea';

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
    const [locationError, setLocationError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const mediaRecorderRef = useRef(null);
    const titleRef = useRef(null);
    const descriptionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setIsSpeechSupported(!!SpeechRecognition);
    }, []);

    const requestLocation = () => {
        if ('geolocation' in navigator) {
            toast.loading('Acquiring signal lock...', { id: 'geo' });
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationError(false);
                    toast.success('Signal lock acquired', { id: 'geo' });
                },
                (err) => {
                    console.warn('[ReportForm] Geolocation FAILED:', err.message);
                    setLocationError(true);
                    toast.error(`📍 Location Denied. Please enable or enter manually.`, { id: 'geo' });
                }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    };

    useEffect(() => {
        requestLocation();
    }, []);

    const handleVoiceToggle = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Voice dictation not supported in this browser.');
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map(r => r[0].transcript).join(' ');
            setForm(prev => ({...prev, description: prev.description ? `${prev.description} ${transcript}` : transcript }));
        };
        recognition.start();
    };

    const handleAudioSOS = async() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error('Audio recording not supported');
            return;
        }
        if (!isAudioRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setSosMessage('SOS: Recording Protocol Active...');
                setIsAudioRecording(true);
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                const chunks = [];
                recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
                recorder.onstop = async() => {
                    const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
                    const currentMimeType = recorder.mimeType || 'audio/webm';
                    
                    const reader = new FileReader();
                    reader.onloadend = async() => {
                        const base64 = reader.result.split(',')[1];
                        setSosMessage('SOS: Encrypting & Dispatching...');
                        
                        // FAIL-SAFE TIMEOUT
                        const timeoutId = setTimeout(() => {
                            setSosMessage('');
                            toast.error('Network Timeout: Dispatch aborted');
                        }, 5000);

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
                            clearTimeout(timeoutId);
                            toast.success('Emergency Audio Dispatched');
                        } catch (err) {
                            clearTimeout(timeoutId);
                            toast.error('SOS triage failed');
                        } finally {
                            setSosMessage('');
                            setIsAudioRecording(false);
                        }
                    };
                    reader.readAsDataURL(blob);
                };
                recorder.start();
            } catch (err) {
                console.error('Audio capture failed:', err);
                toast.error('Microphone access denied');
                setIsAudioRecording(false);
            }
        } else {
            mediaRecorderRef.current?.stop();
        }
    };

    const handleMediaChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setMediaType(file.type);
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));

        if (navigator.onLine) {
            toast('AI Analysis Initialized', { icon: '🧠' });
            const reader = new FileReader();
            reader.onload = async(e) => {
                try {
                    const { data } = await api.post('/incidents/analyze', {
                        ...form,
                        mediaType: file.type,
                        mediaBase64: e.target.result,
                    });
                    if (data.predictedCategory || data.autoSeverity) {
                        setAiResult({
                            category: data.predictedCategory || 'UNCATEGORIZED',
                            severity: data.autoSeverity || 3,
                            method: 'Cloud AI (Gemini)'
                        });
                        setForm(prev => ({
                            ...prev,
                            category: data.predictedCategory || prev.category,
                            severity: data.autoSeverity || prev.severity
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
        if (!form.title.trim()) { toast.error('Subject identifier required'); titleRef.current?.focus(); return; }
        if (!form.description.trim()) { toast.error('Narrative required'); descriptionRef.current?.focus(); return; }
        
        setIsSubmitting(true);
        let finalForm = { ...form };
        let triageMethod = 'Cloud AI (Gemini)';

        if (!navigator.onLine) {
            const localResult = await localAnalyze(form.title, form.description);
            finalForm.category = localResult.category;
            finalForm.severity = localResult.severity;
            triageMethod = localResult.triageMethod;
            setAiResult({ category: localResult.category, severity: localResult.severity, method: localResult.triageMethod });
            setShowAiModal(true);
        }

        const payload = { ...finalForm, lng: position.lng, lat: position.lat, mediaType, triageMethod };

        if (navigator.onLine) {
            const toastId = toast.loading('Dispatching signal...');
            
            // FAIL-SAFE TIMEOUT
            const timeoutId = setTimeout(() => {
                setIsSubmitting(false);
                toast.error('Network Timeout: Dispatch unconfirmed', { id: toastId });
            }, 5000);

            try {
                let mediaUrl = null;
                if (mediaFile) {
                    const fileName = mediaFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
                    const { data: urlData } = await api.get(`/incidents/upload-url?fileName=${fileName}&mimeType=${mediaType}`);
                    if (urlData && urlData.uploadUrl) {
                        await fetch(urlData.uploadUrl, { method: 'PUT', body: mediaFile, headers: { 'Content-Type': mediaType } });
                        mediaUrl = urlData.fileUrl;
                    }
                }
                await api.post('/incidents', { ...payload, mediaUrl });
                clearTimeout(timeoutId);
                toast.success('Incident Dispatched', { id: toastId });
                setForm({ title: '', description: '', severity: 3, category: '', floorLevel: 1, roomNumber: '', wingId: '' });
                setMediaPreview(''); setMediaFile(null);
            } catch (err) {
                clearTimeout(timeoutId);
                toast.error('Dispatch Failure - Queued for sync', { id: toastId });
                await queueReport({...payload, mediaFile, synced: false });
            } finally {
                setIsSubmitting(false);
            }
        } else {
            await queueReport({...payload, mediaFile, synced: false });
            toast.success('Offline: Queued for sync');
            setIsSubmitting(false);
        }
    };


    return (
        <Card className="w-full overflow-hidden shadow-2xl border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-none">
            <div className="bg-slate-950/60 p-6 sm:p-10 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-white font-mono italic text-glow-cyan">Incident_Manifest</h3>
                    <p className="text-cyan-400 text-[10px] font-black tracking-[0.3em] mt-2 uppercase">
                        {locationError ? <span className="text-danger animate-pulse flex items-center gap-2"><AlertTriangle size={12}/> SIGNAL_LOST - MANUAL_OVERRIDE</span> : `COORDINATES: ${position.lat.toFixed(4)}N // ${position.lng.toFixed(4)}E`}
                    </p>
                </div>
                {!navigator.onLine && (
                    <div className="bg-danger text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse font-mono shadow-neon-red">
                        Link_Severed // Buffer_Active
                    </div>
                )}
            </div>

            {/* SYSTEM GUIDANCE */}
            <div className="bg-slate-900/30 p-6 sm:p-10 border-b border-white/5 flex items-start gap-6">
                <div className="w-12 h-12 rounded-none bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
                    <Info size={24} className="text-cyan-400 text-glow-cyan" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Operational_Directives</h4>
                    <p className="text-xs text-slate-500 leading-loose uppercase font-bold tracking-wider">
                        PRIORITIZE SAFETY. UTILIZE <span className="text-danger">AUDIO_SOS</span> FOR RAPID HANDS-FREE REPORTING. <span className="text-cyan-400 text-glow-cyan">EDGE_AI</span> WILL AUTOMATICALLY TRIAGE INCOMING TELEMETRY.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-12">
                {locationError && (
                    <div className="glass-panel border-danger/30 p-6 flex flex-col gap-4">
                        <p className="text-danger text-[10px] font-black uppercase tracking-[0.3em] font-mono">Manual_Telemetry_Override</p>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <Input type="number" step="any" placeholder="LATITUDE" value={position.lat} className="glass-panel" onChange={(e) => setPosition(p => ({ ...p, lat: parseFloat(e.target.value) || 0 }))} />
                            <Input type="number" step="any" placeholder="LONGITUDE" value={position.lng} className="glass-panel" onChange={(e) => setPosition(p => ({ ...p, lng: parseFloat(e.target.value) || 0 }))} />
                        </div>
                        <Button type="button" variant="secondary" onClick={requestLocation} className="text-[10px] font-black w-full mt-2 rounded-none border-slate-700 hover:bg-white/5 uppercase tracking-widest py-4">Re-Establish_Satellite_Link</Button>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button 
                        type="button" 
                        onClick={handleAudioSOS} 
                        className={`py-8 text-xs font-black uppercase tracking-[0.3em] border flex flex-col items-center justify-center gap-3 transition-all active:scale-95 ${isAudioRecording ? 'bg-danger border-white text-white animate-pulse shadow-neon-red' : 'bg-danger/5 border-danger/20 text-danger hover:bg-danger/10 hover:border-danger/40 shadow-none'}`}
                    >
                        <div className="flex items-center gap-4">
                            {isAudioRecording ? <MicOff size={28} /> : <AlertTriangle size={28} />}
                            {isAudioRecording ? 'RECORDING...' : 'AUDIO_SOS'}
                        </div>
                        <span className="text-[9px] opacity-60 tracking-[0.2em]">DIRECT_VOICE_UPLINK</span>
                    </button>
                    {isSpeechSupported && (
                        <button 
                            type="button" 
                            onClick={handleVoiceToggle} 
                            className={`py-8 text-xs font-black uppercase tracking-[0.3em] border flex flex-col items-center justify-center gap-3 transition-all active:scale-95 ${isRecording ? 'bg-cyan-500 border-white text-[#020617] animate-pulse shadow-neon-cyan' : 'glass-panel border-white/5 text-slate-100 hover:border-cyan-500/30'}`}
                        >
                            <div className="flex items-center gap-4">
                                <Mic size={28} /> {isRecording ? 'LISTENING...' : 'DICTATE'}
                            </div>
                            <span className="text-[9px] opacity-60 tracking-[0.2em]">VOICE_TO_TEXT_PROC</span>
                        </button>
                    )}
                </div>

                {sosMessage && (
                    <div className="bg-danger/10 border-l-4 border-danger px-6 py-4 text-[11px] font-black text-danger animate-pulse uppercase tracking-[0.3em]">
                        &gt;&gt; {sosMessage}
                    </div>
                )}

                <div className="space-y-10">
                    <div>
                        <Label htmlFor="incident-title">Subject_Identifier</Label>
                        <Input ref={titleRef} id="incident-title" name="title" placeholder="ENTER_PRIMARY_ID..." className="glass-panel h-14" value={form.title} onChange={(e) => setForm(prev => ({...prev, title: e.target.value }))} required />
                    </div>
                    <div>
                        <Label htmlFor="incident-description">Situation_Briefing</Label>
                        <Textarea ref={descriptionRef} id="incident-description" name="description" placeholder="PROVIDE_TACTICAL_CONTEXT..." className="glass-panel min-h-[200px]" value={form.description} onChange={(e) => setForm(prev => ({...prev, description: e.target.value }))} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-950/60 p-8 rounded-none border border-white/5">
                    <div>
                        <Label htmlFor="wing-id">Sector</Label>
                        <Input id="wing-id" name="wingId" placeholder="WING_A" value={form.wingId} className="bg-[#020617] border-white/10" onChange={(e) => setForm(prev => ({...prev, wingId: e.target.value.toUpperCase() }))} required />
                    </div>
                    <div>
                        <Label htmlFor="floor-level">Level</Label>
                        <Input id="floor-level" name="floorLevel" type="number" value={form.floorLevel} className="bg-[#020617] border-white/10" onChange={(e) => setForm(prev => ({...prev, floorLevel: Number(e.target.value) }))} required />
                    </div>
                    <div>
                        <Label htmlFor="room-number">Unit</Label>
                        <Input id="room-number" name="roomNumber" placeholder="402" value={form.roomNumber} className="bg-[#020617] border-white/10" onChange={(e) => setForm(prev => ({...prev, roomNumber: e.target.value.toUpperCase() }))} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <Label htmlFor="incident-category">Classification</Label>
                        <div className="relative">
                            <select id="incident-category" name="category" className="w-full glass-panel text-white p-5 rounded-none outline-none appearance-none cursor-pointer focus:border-cyan-500 transition-all text-xs uppercase font-black tracking-[0.2em] font-mono" value={form.category} onChange={(e) => setForm(prev => ({...prev, category: e.target.value }))} required>
                                <option value="" disabled>SELECT_PROTOCOL</option>
                                <option value="MEDICAL">MEDICAL_EVC</option>
                                <option value="FIRE">FIRE_SUPPRESSION</option>
                                <option value="SECURITY">TACTICAL_BREACH</option>
                                <option value="INFRASTRUCTURE">SYSTEM_FAILURE</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-cyan-400"><Info size={18} /></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-5">
                            <Label htmlFor="severity-slider">Priority_Level</Label>
                            <div className={`px-3 py-1 text-[11px] font-black font-mono border ${form.severity >= 4 ? 'bg-danger text-white border-white shadow-neon-red' : 'bg-cyan-500 text-[#020617] border-[#020617]'}`}>RANK_{form.severity}</div>
                        </div>
                        <input id="severity-slider" name="severity" type="range" min="1" max="5" className="w-full h-1 bg-slate-800 rounded-none appearance-none cursor-pointer accent-cyan-500" value={form.severity} onChange={(e) => setForm(prev => ({...prev, severity: Number(e.target.value) }))} />
                    </div>
                </div>

                <div className="space-y-6">
                    <Label htmlFor="media-upload">Visual_Intelligence</Label>
                    <div className="border-2 border-dashed border-white/5 bg-[#020617] hover:bg-white/[0.02] transition-all p-12 rounded-none text-center group cursor-pointer relative overflow-hidden">
                        <input id="media-upload" name="mediaFile" type="file" accept="image/*,video/*" capture="environment" onChange={handleMediaChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 glass-panel rounded-none flex items-center justify-center mb-6 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/5 transition-all">
                                <Camera size={32} className="text-slate-600 group-hover:text-cyan-400" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Capture_Signal_Evidence</span>
                            <p className="text-[9px] text-slate-600 mt-3 uppercase tracking-widest font-bold italic">PHOTOS/VIDEO ASSIST NEURAL TRIAGE ACCURACY</p>
                        </div>
                        {mediaPreview && (
                            <div className="mt-10 rounded-none overflow-hidden border border-white/10 bg-black shadow-2xl relative">
                                {mediaType.startsWith('image/') ? <img src={mediaPreview} alt="Evidence" className="w-full max-h-[400px] object-contain opacity-80" /> : <video controls src={mediaPreview} className="w-full max-h-[400px] mx-auto opacity-80" />}
                                <div className="absolute top-6 right-6 glass-tactical px-4 py-2 text-[9px] font-black text-cyan-400 uppercase border border-cyan-500/50 tracking-[0.2em] shadow-neon-cyan backdrop-blur-xl">SIGNAL_LOCKED</div>
                            </div>
                        )}
                    </div>
                </div>

                <Button 
                    type="submit" 
                    isLoading={isSubmitting}
                    className="w-full py-8 text-sm sm:text-base tracking-[0.5em] bg-cyan-500 hover:bg-cyan-400 text-[#020617] font-black border-none shadow-neon-cyan active:scale-[0.98] transition-all rounded-none flex items-center justify-center gap-4"
                >
                    <ShieldCheck size={28} strokeWidth={2.5} />
                    EXECUTE_TRANSMISSION
                </Button>
            </form>


            {showAiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/98 backdrop-blur-xl">
                    <div className="w-full max-w-lg p-10 glass-tactical border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden font-mono">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <Cpu size={300} className="text-cyan-500" />
                        </div>
                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 mx-auto mb-8 shadow-neon-cyan"><Cpu size={32} className="text-cyan-400 animate-pulse" /></div>
                            <h3 className="text-2xl font-black tracking-tighter uppercase mb-2 text-white italic text-glow-cyan">Neural_Sync_Complete</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mb-10">Triage_Engine: {aiResult.method}</p>
                            <div className="space-y-10 bg-[#020617]/60 p-8 border border-white/5 text-left">
                                <div><p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.3em] mb-3">Predicted_Classification</p><p className="text-4xl font-black tracking-tighter text-white uppercase italic">{aiResult.category}</p></div>
                                <div><div className="flex justify-between items-end mb-4"><p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.3em]">Threat_Assessment</p><span className="text-2xl font-black text-white tabular-nums">LEVEL_{aiResult.severity}<span className="text-slate-600 text-sm italic ml-1">/5</span></span></div><div className="flex gap-2 h-2">{[1, 2, 3, 4, 5].map((s) => (<div key={s} className={`flex-1 transition-all duration-700 ${s <= aiResult.severity ? (aiResult.severity >= 4 ? 'bg-danger shadow-neon-red' : 'bg-cyan-500 shadow-neon-cyan') : 'bg-white/5'}`} style={{ transitionDelay: `${s * 100}ms` }} />))}</div></div>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="mt-12 w-full py-5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.4em] border border-white/10 transition-all active:scale-[0.98]">Acknowledge_Briefing</button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

export default ReportForm;