import React, { useState, useEffect, useRef } from 'react'; // 🚨 FIXED: Removed unused useMemo
import api from '../api';
import toast from 'react-hot-toast';
import { queueReport, getPendingReports, markReportSynced } from '../idb';
import { localAnalyze } from '../utils/edgeAi';
// 🚨 FIXED: Removed unused debounce
import { Mic, MicOff, Camera, AlertTriangle, Cpu, Info, ShieldCheck } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

// 🚨 PERFORMANCE FIX: Components defined outside render to prevent re-mounting on every keystroke
const Label = ({ children, htmlFor }) => (
    <label 
        htmlFor={htmlFor}
        className="block text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 mb-3 flex items-center gap-2 cursor-pointer"
    >
        <span className="w-1 h-1 bg-accent rounded-full"></span> {children}
    </label>
);

const Input = React.forwardRef(({ className = '', ...props }, ref) => (
    <input 
        {...props}
        ref={ref}
        className={`w-full bg-slate-900 border border-slate-700 rounded-none focus:border-cyan-500 focus:ring-0 transition-all py-4 px-5 outline-none text-slate-200 placeholder-slate-600 font-mono text-sm ${className}`}
    />
));
Input.displayName = 'Input';

const Textarea = React.forwardRef(({ className = '', ...props }, ref) => (
    <textarea 
        {...props}
        ref={ref}
        className={`w-full bg-slate-900 border border-slate-700 rounded-none focus:border-cyan-500 focus:ring-0 transition-all py-4 px-5 outline-none text-slate-200 placeholder-slate-600 min-h-[140px] resize-none font-mono text-sm ${className}`}
    />
));
Textarea.displayName = 'Textarea';

function ReportForm() {
    // 🚨 STABILITY FIX: Use a ref for the form state to avoid re-renders during typing if needed,
    // but React should handle state updates fine if components are defined outside.
    // However, let's simplify the state to reduce re-render overhead.
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
    const [locationError, setLocationError] = useState(false); // 🚨 LOCATION FALLBACK FIX
    
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
        let isMounted = true;
        if (isMounted) requestLocation();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        let isMounted = true;
        let isSyncing = false;
        async function syncPending() {
            if (isSyncing || !isMounted) return;
            isSyncing = true;
            try {
                const pending = await getPendingReports();
                if (!pending.length) return;
                for (const rpt of pending) {
                    if (!isMounted) break;
                    try {
                        let mediaBase64 = '';
                        if (rpt.mediaFile) {
                            mediaBase64 = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(rpt.mediaFile);
                            });
                        }
                        const { localId, ...cleanRpt } = rpt;
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
        const handleOnline = () => syncPending();
        window.addEventListener('online', handleOnline);
        return () => {
            isMounted = false;
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const handleVoiceToggle = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Voice dictation not supported in this browser.');
            return;
        }
        
        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-IN';
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    toast.error('Microphone access denied. Please enable permissions.');
                } else {
                    toast.error(`Voice dictation error: ${event.error}`);
                }
                setIsRecording(false);
            };

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
        } catch (err) {
            console.error('Voice dictation initialization failed:', err);
            toast.error('Failed to start voice dictation. Ensure you clicked the button directly.');
            setIsRecording(false);
        }
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
            } catch (err) {
                console.error('Audio capture failed:', err);
                toast.error('Microphone access denied. Please check permissions.');
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

        // Basic front-end validation check
        if (!form.title.trim()) {
            toast.error('Subject identifier is required');
            titleRef.current?.focus();
            return;
        }
        if (!form.description.trim()) {
            toast.error('Operational narrative is required');
            descriptionRef.current?.focus();
            return;
        }
        
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
                const toastId = toast.loading('Encrypting and dispatching signal...');
                
                let mediaUrl = null;
                
                // Direct-to-Cloud Upload via Presigned URL
                if (mediaFile) {
                    toast.loading('Uploading visual evidence...', { id: toastId });
                    
                    const fileName = mediaFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
                    const { data: urlData } = await api.get(`/incidents/upload-url?fileName=${fileName}&mimeType=${mediaType}`);
                    
                    if (urlData && urlData.uploadUrl) {
                        await fetch(urlData.uploadUrl, {
                            method: 'PUT',
                            body: mediaFile,
                            headers: {
                                'Content-Type': mediaType
                            }
                        });
                        mediaUrl = urlData.fileUrl;
                    }
                }
                
                toast.loading('Transmitting intel...', { id: toastId });
                
                // We send mediaUrl instead of mediaBase64. If analysis needs it, it can fetch from S3
                // Or we can send mediaBase64 just for the initial analysis if it's small enough, but let's 
                // just rely on mediaUrl for the db insertion to save bandwidth.
                let base64ForAi = undefined;
                if (mediaFile && mediaFile.size < 5 * 1024 * 1024) {
                    base64ForAi = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(mediaFile);
                    });
                }

                await api.post('/incidents', { ...payload, mediaUrl, mediaBase64: base64ForAi });
                
                toast.success('Incident Signal Dispatched', { id: toastId });
                setForm({ title: '', description: '', severity: 3, category: '', floorLevel: 1, roomNumber: '', wingId: '' });
                setMediaPreview('');
                setMediaFile(null);
            } catch (err) {
                toast.dismiss();
                toast.error('Dispatch Failure: ' + (err.response?.data?.error || err.message));
                console.error('Dispatch error:', err);
                
                // 🚨 RELIABILITY FIX: Fallback to offline queue on S3/API failure
                await queueReport({...payload, mediaFile, synced: false });
                toast('Queued for secure retry sync', { icon: '🔄' });
            }
        } else {
            await queueReport({...payload, mediaFile, synced: false });
            toast.success('Queued for secure sync');
        }
    };

    return (
        <Card className="w-full overflow-hidden shadow-none border-slate-700 bg-slate-900 rounded-none">
            <div className="bg-slate-800 p-6 sm:p-8 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-widest text-white font-mono italic">Incident_Manifest</h3>
                    <p className="text-cyan-500 text-[10px] font-mono tracking-[0.2em] mt-1 uppercase">
                        {locationError ? <span className="text-red-500 animate-pulse flex items-center gap-2 mt-2"><AlertTriangle size={12}/> SIGNAL_LOST - MANUAL_OVERRIDE_REQUIRED</span> : `GEO_NODE: ${position.lat.toFixed(4)}N, ${position.lng.toFixed(4)}E`}
                    </p>
                </div>
                {!navigator.onLine && (
                    <div className="bg-amber-950 text-amber-400 border border-amber-800 px-3 py-1 text-[9px] font-black uppercase tracking-widest animate-pulse font-mono">
                        Edge_Resilience_Active
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
                
                {locationError && (
                    <div className="bg-red-950/20 border border-red-900 rounded-none p-4 flex flex-col gap-3">
                        <p className="text-red-500 text-[10px] font-black uppercase tracking-widest font-mono">Manual_Coordinate_Input</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input 
                                type="number" 
                                step="any" 
                                placeholder="LATITUDE" 
                                value={position.lat} 
                                onChange={(e) => setPosition(p => ({ ...p, lat: parseFloat(e.target.value) || 0 }))} 
                            />
                            <Input 
                                type="number" 
                                step="any" 
                                placeholder="LONGITUDE" 
                                value={position.lng} 
                                onChange={(e) => setPosition(p => ({ ...p, lng: parseFloat(e.target.value) || 0 }))} 
                            />
                        </div>
                        <Button type="button" variant="secondary" onClick={requestLocation} className="text-[10px] w-full mt-2 rounded-none">Retry_Signal_Lock</Button>
                    </div>
                )}

                {/* EMERGENCY CONTROLS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        type="button"
                        onClick={handleAudioSOS}
                        className={`py-5 text-[10px] font-black uppercase tracking-widest border-2 flex items-center justify-center gap-3 transition-all ${
                            isAudioRecording 
                            ? 'bg-red-600 border-red-400 text-white animate-pulse' 
                            : 'bg-red-950/30 border-red-900 text-red-500 hover:bg-red-900/50'
                        }`}
                    >
                        {isAudioRecording ? <MicOff size={18} /> : <AlertTriangle size={18} />}
                        {isAudioRecording ? 'RECORDING_SOS_STREAM...' : 'INITIATE_SOS_AUDIO'}
                    </button>
                    
                    {isSpeechSupported && (
                        <button 
                            type="button"
                            onClick={handleVoiceToggle}
                            className={`py-5 text-[10px] font-black uppercase tracking-widest border-2 flex items-center justify-center gap-3 transition-all ${
                                isRecording 
                                ? 'bg-cyan-600 border-cyan-400 text-white animate-pulse' 
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            <Mic size={18} />
                            {isRecording ? 'SYSTEM_LISTENING...' : 'VOICE_DICTATION'}
                        </button>
                    )}
                </div>

                {sosMessage && (
                    <div className="bg-red-950/20 border-l-2 border-red-600 px-4 py-3 text-[10px] font-mono text-red-500 animate-pulse uppercase tracking-widest">
                        &gt;&gt; {sosMessage}
                    </div>
                )}

                {/* TEXT INPUTS */}
                <div className="space-y-8">
                    <div>
                        <Label htmlFor="incident-title">Incident_Identifier</Label>
                        <Input 
                            ref={titleRef}
                            id="incident-title"
                            name="title"
                            placeholder="PRIORITY_SUBJECT_LINE..."
                            value={form.title}
                            onChange={(e) => setForm(prev => ({...prev, title: e.target.value }))}
                            required 
                        />
                    </div>

                    <div>
                        <Label htmlFor="incident-description">Operational_Narrative</Label>
                        <Textarea 
                            ref={descriptionRef}
                            id="incident-description"
                            name="description"
                            placeholder="PROVIDE_FULL_CONTEXT_FOR_RESPONDERS..."
                            value={form.description}
                            onChange={(e) => setForm(prev => ({...prev, description: e.target.value }))}
                            required 
                        />
                    </div>
                </div>

                {/* LOCATION COORDINATES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-black/20 p-6 rounded-none border border-slate-800">
                    <div>
                        <Label htmlFor="wing-id">Sector_Wing</Label>
                        <Input id="wing-id" name="wingId" placeholder="e.g. NORTH" value={form.wingId} onChange={(e) => setForm(prev => ({...prev, wingId: e.target.value.toUpperCase() }))} required />
                    </div>
                    <div>
                        <Label htmlFor="floor-level">Level_Floor</Label>
                        <Input id="floor-level" name="floorLevel" type="number" value={form.floorLevel} onChange={(e) => setForm(prev => ({...prev, floorLevel: Number(e.target.value) }))} required />
                    </div>
                    <div>
                        <Label htmlFor="room-number">Area_Room</Label>
                        <Input id="room-number" name="roomNumber" placeholder="e.g. 402" value={form.roomNumber} onChange={(e) => setForm(prev => ({...prev, roomNumber: e.target.value.toUpperCase() }))} required />
                    </div>
                </div>

                {/* CATEGORY & SEVERITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <Label htmlFor="incident-category">Classification_Protocol</Label>
                        <div className="relative">
                            <select 
                                id="incident-category"
                                name="category"
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 p-4 rounded-none outline-none appearance-none cursor-pointer focus:border-cyan-500 transition-all text-xs uppercase font-black tracking-widest font-mono"
                                value={form.category}
                                onChange={(e) => setForm(prev => ({...prev, category: e.target.value }))}
                                required
                            >
                                <option value="" disabled>SELECT_CATEGORY</option>
                                <option value="MEDICAL">MEDICAL_EMERGENCY</option>
                                <option value="FIRE">FIRE_INCIDENT</option>
                                <option value="SECURITY">SECURITY_BREACH</option>
                                <option value="INFRASTRUCTURE">UTILITY_FAILURE</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 text-cyan-500">
                                <Info size={16} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <Label htmlFor="severity-slider">Severity_Matrix</Label>
                            <div className={`px-2 py-1 text-[10px] font-black font-mono border-2 ${form.severity >= 4 ? 'bg-red-950 text-red-500 border-red-800' : 'bg-cyan-950 text-cyan-500 border-cyan-800'}`}>
                                LVL_{form.severity}
                            </div>
                        </div>
                        <input 
                            id="severity-slider"
                            name="severity"
                            type="range" min="1" max="5" 
                            className="w-full h-1 bg-slate-800 rounded-none appearance-none cursor-pointer accent-cyan-500 border-none"
                            value={form.severity}
                            onChange={(e) => setForm(prev => ({...prev, severity: Number(e.target.value) }))}
                        />
                        <div className="flex justify-between text-[8px] uppercase tracking-[0.3em] text-slate-600 mt-3 font-black font-mono">
                            <span>MINIMAL</span>
                            <span>CRITICAL</span>
                        </div>
                    </div>
                </div>

                {/* VISUAL EVIDENCE */}
                <div className="border-2 border-dashed border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-all p-8 sm:p-10 rounded-none text-center group cursor-pointer relative overflow-hidden">
                    <input id="media-upload" name="mediaFile" type="file" accept="image/*,video/*" capture="environment" onChange={handleMediaChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-slate-800 group-hover:bg-cyan-500/10 rounded-none flex items-center justify-center mb-4 transition-all duration-300 border border-slate-700 group-hover:border-cyan-500/50">
                            <Camera size={24} className="text-slate-500 group-hover:text-cyan-500 transition-colors" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Attach_Visual_Evidence</span>
                        <span className="text-[8px] text-slate-600 mt-2 font-mono uppercase tracking-widest">JPG_PNG_MP4 {'//'} MAX_20MB</span>
                    </div>
                    
                    {mediaPreview && (
                        <div className="mt-8 rounded-none overflow-hidden border border-slate-700 bg-black shadow-2xl relative">
                            {mediaType.startsWith('image/') 
                                ? <img src={mediaPreview} alt="Evidence" className="w-full max-h-[300px] object-contain" />
                                : <video controls src={mediaPreview} className="w-full max-h-[300px] mx-auto" />
                            }
                            <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md px-3 py-1 text-[8px] font-black text-cyan-500 uppercase border border-cyan-500/50 font-mono tracking-widest">SIGNAL_CAPTURED</div>
                        </div>
                    )}
                </div>

                <button 
                    type="submit"
                    className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase tracking-[0.3em] text-sm transition-all active:scale-[0.98] border-b-4 border-cyan-800 flex items-center justify-center gap-3"
                >
                    <ShieldCheck size={20} />
                    Submit_Terminal_Dispatch
                </button>
            </form>

            {/* AI ANALYSIS MODAL */}
            {showAiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-xl">
                    <div className="w-full max-w-md p-8 sm:p-10 bg-slate-900 border border-slate-700 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden font-mono">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px]"></div>
                        
                        <div className="relative z-10 text-center">
                            <div className="w-14 h-14 bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 mx-auto mb-6">
                                <Cpu size={28} className="text-cyan-500 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black tracking-tighter uppercase mb-1 text-white italic">Triage_Analysis</h3>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-8">Engine: {aiResult.method}</p>
                            
                            <div className="space-y-8 bg-black/40 p-6 sm:p-8 border border-slate-800 text-left">
                                <div>
                                    <p className="text-slate-500 text-[8px] uppercase font-black tracking-[0.2em] mb-2">Predicted_Category</p>
                                    <p className="text-3xl font-black tracking-tighter text-white uppercase">{aiResult.category}</p>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <p className="text-slate-500 text-[8px] uppercase font-black tracking-[0.2em]">Risk_Assessment</p>
                                        <span className="text-xl font-black text-white">{aiResult.severity}<span className="text-slate-500 text-xs">/5</span></span>
                                    </div>
                                    <div className="flex gap-1.5 h-1.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <div 
                                                key={s} 
                                                className={`flex-1 transition-all duration-500 ${s <= aiResult.severity ? (aiResult.severity >= 4 ? 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]') : 'bg-slate-800'}`}
                                                style={{ transitionDelay: `${s * 75}ms` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className="mt-10 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-[0.3em] border border-slate-600 transition-all"
                            >
                                Confirm_Intel_Data
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

export default ReportForm;
