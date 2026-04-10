import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { queueReport, getPendingReports, markReportSynced } from '../idb';
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
            try {
                const toastId = toast.loading('Dispatching signal...');
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
                toast.success('Incident Dispatched', { id: toastId });
                setForm({ title: '', description: '', severity: 3, category: '', floorLevel: 1, roomNumber: '', wingId: '' });
                setMediaPreview(''); setMediaFile(null);
            } catch (err) {
                toast.error('Dispatch Failure');
                await queueReport({...payload, mediaFile, synced: false });
            } finally {
                setIsSubmitting(false);
            }
        } else {
            await queueReport({...payload, mediaFile, synced: false });
            toast.success('Queued for sync');
            setIsSubmitting(false);
        }
    };


    return (
        <Card className="w-full overflow-hidden shadow-tactical border-slate-800 bg-[#151B2B] rounded-none">
            <div className="bg-[#0B0F19] p-6 sm:p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-widest text-white font-mono italic">Incident_Manifest</h3>
                    <p className="text-cyan-400 text-[10px] font-mono tracking-[0.2em] mt-1 uppercase">
                        {locationError ? <span className="text-red-500 animate-pulse flex items-center gap-2 mt-2"><AlertTriangle size={12}/> SIGNAL_LOST - MANUAL_OVERRIDE</span> : `GEO_NODE: ${position.lat.toFixed(4)}N, ${position.lng.toFixed(4)}E`}
                    </p>
                </div>
                {!navigator.onLine && (
                    <div className="bg-amber-500 text-black border border-amber-300 px-3 py-1 text-[9px] font-black uppercase tracking-widest animate-pulse font-mono">
                        Edge_Resilience_Active
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
                {locationError && (
                    <div className="bg-red-600/10 border border-red-500 rounded-none p-4 flex flex-col gap-3">
                        <p className="text-red-500 text-[10px] font-black uppercase tracking-widest font-mono">Manual_Coordinate_Input</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input type="number" step="any" placeholder="LATITUDE" value={position.lat} className="bg-[#0B0F19] border-slate-800" onChange={(e) => setPosition(p => ({ ...p, lat: parseFloat(e.target.value) || 0 }))} />
                            <Input type="number" step="any" placeholder="LONGITUDE" value={position.lng} className="bg-[#0B0F19] border-slate-800" onChange={(e) => setPosition(p => ({ ...p, lng: parseFloat(e.target.value) || 0 }))} />
                        </div>
                        <Button type="button" variant="secondary" onClick={requestLocation} className="text-[10px] w-full mt-2 rounded-none border-slate-700">Retry_Signal_Lock</Button>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button type="button" onClick={handleAudioSOS} className={`py-5 text-[10px] font-black uppercase tracking-widest border flex items-center justify-center gap-3 transition-all ${isAudioRecording ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-neon-red' : 'bg-red-600/10 border-red-500/50 text-red-500 hover:bg-red-600 hover:text-white'}`}>
                        {isAudioRecording ? <MicOff size={18} /> : <AlertTriangle size={18} />}
                        {isAudioRecording ? 'RECORDING_SOS...' : 'INITIATE_SOS_AUDIO'}
                    </button>
                    {isSpeechSupported && (
                        <button type="button" onClick={handleVoiceToggle} className={`py-5 text-[10px] font-black uppercase tracking-widest border flex items-center justify-center gap-3 transition-all ${isRecording ? 'bg-cyan-600 border-cyan-400 text-black animate-pulse shadow-neon-cyan' : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'}`}>
                            <Mic size={18} /> {isRecording ? 'LISTENING...' : 'VOICE_DICTATION'}
                        </button>
                    )}
                </div>

                {sosMessage && (
                    <div className="bg-red-600/10 border-l-4 border-red-600 px-4 py-3 text-[10px] font-mono text-red-500 animate-pulse uppercase tracking-widest">
                        &gt;&gt; {sosMessage}
                    </div>
                )}

                <div className="space-y-8">
                    <div>
                        <Label htmlFor="incident-title">Incident_Identifier</Label>
                        <Input ref={titleRef} id="incident-title" name="title" placeholder="PRIORITY_SUBJECT_LINE..." className="bg-[#0B0F19] border-slate-800" value={form.title} onChange={(e) => setForm(prev => ({...prev, title: e.target.value }))} required />
                    </div>
                    <div>
                        <Label htmlFor="incident-description">Operational_Narrative</Label>
                        <Textarea ref={descriptionRef} id="incident-description" name="description" placeholder="PROVIDE_FULL_CONTEXT..." className="bg-[#0B0F19] border-slate-800" value={form.description} onChange={(e) => setForm(prev => ({...prev, description: e.target.value }))} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0B0F19] p-6 rounded-none border border-slate-800">
                    <div>
                        <Label htmlFor="wing-id">Sector_Wing</Label>
                        <Input id="wing-id" name="wingId" placeholder="NORTH" value={form.wingId} className="bg-[#151B2B] border-slate-800" onChange={(e) => setForm(prev => ({...prev, wingId: e.target.value.toUpperCase() }))} required />
                    </div>
                    <div>
                        <Label htmlFor="floor-level">Level_Floor</Label>
                        <Input id="floor-level" name="floorLevel" type="number" value={form.floorLevel} className="bg-[#151B2B] border-slate-800" onChange={(e) => setForm(prev => ({...prev, floorLevel: Number(e.target.value) }))} required />
                    </div>
                    <div>
                        <Label htmlFor="room-number">Area_Room</Label>
                        <Input id="room-number" name="roomNumber" placeholder="402" value={form.roomNumber} className="bg-[#151B2B] border-slate-800" onChange={(e) => setForm(prev => ({...prev, roomNumber: e.target.value.toUpperCase() }))} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <Label htmlFor="incident-category">Classification_Protocol</Label>
                        <div className="relative">
                            <select id="incident-category" name="category" className="w-full bg-[#0B0F19] border border-slate-800 text-slate-100 p-4 rounded-none outline-none appearance-none cursor-pointer focus:border-cyan-500 transition-all text-xs uppercase font-black tracking-widest font-mono" value={form.category} onChange={(e) => setForm(prev => ({...prev, category: e.target.value }))} required>
                                <option value="" disabled>SELECT_CATEGORY</option>
                                <option value="MEDICAL">MEDICAL_EMERGENCY</option>
                                <option value="FIRE">FIRE_INCIDENT</option>
                                <option value="SECURITY">SECURITY_BREACH</option>
                                <option value="INFRASTRUCTURE">UTILITY_FAILURE</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 text-cyan-400"><Info size={16} /></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <Label htmlFor="severity-slider">Severity_Matrix</Label>
                            <div className={`px-2 py-1 text-[10px] font-black font-mono border ${form.severity >= 4 ? 'bg-red-600 text-white border-red-400 shadow-neon-red' : 'bg-cyan-600 text-black border-cyan-400 shadow-neon-cyan'}`}>LVL_{form.severity}</div>
                        </div>
                        <input id="severity-slider" name="severity" type="range" min="1" max="5" className="w-full h-1 bg-slate-800 rounded-none appearance-none cursor-pointer accent-cyan-500" value={form.severity} onChange={(e) => setForm(prev => ({...prev, severity: Number(e.target.value) }))} />
                    </div>
                </div>

                <div className="border border-slate-800 bg-[#0B0F19] hover:bg-[#1E293B] transition-all p-8 rounded-none text-center group cursor-pointer relative overflow-hidden">
                    <input id="media-upload" name="mediaFile" type="file" accept="image/*,video/*" capture="environment" onChange={handleMediaChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-[#151B2B] rounded-none flex items-center justify-center mb-4 border border-slate-800 group-hover:border-cyan-500/50">
                            <Camera size={24} className="text-slate-500 group-hover:text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Attach_Visual_Evidence</span>
                    </div>
                    {mediaPreview && (
                        <div className="mt-8 rounded-none overflow-hidden border border-slate-800 bg-black shadow-tactical relative">
                            {mediaType.startsWith('image/') ? <img src={mediaPreview} alt="Evidence" className="w-full max-h-[300px] object-contain opacity-90" /> : <video controls src={mediaPreview} className="w-full max-h-[300px] mx-auto opacity-90" />}
                            <div className="absolute top-4 right-4 bg-[#0B0F19] px-3 py-1 text-[8px] font-black text-cyan-400 uppercase border border-cyan-500/50 font-mono tracking-widest shadow-neon-cyan">SIGNAL_CAPTURED</div>
                        </div>
                    )}
                </div>

                <Button 
                    type="submit" 
                    isLoading={isSubmitting}
                    className="w-full py-6 text-sm tracking-[0.3em]"
                >
                    <ShieldCheck size={20} />
                    Submit_Report_Signal
                </Button>
            </form>


            {showAiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B0F19]/95 backdrop-blur-sm">
                    <div className="w-full max-w-md p-8 bg-[#151B2B] border border-slate-800 shadow-tactical relative overflow-hidden font-mono">
                        <div className="relative z-10 text-center">
                            <div className="w-14 h-14 bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 mx-auto mb-6"><Cpu size={28} className="text-cyan-400 animate-pulse" /></div>
                            <h3 className="text-xl font-black tracking-tighter uppercase mb-1 text-white italic">Triage_Analysis</h3>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-8">Engine: {aiResult.method}</p>
                            <div className="space-y-8 bg-black/40 p-6 border border-slate-800 text-left">
                                <div><p className="text-slate-500 text-[8px] uppercase font-black tracking-[0.2em] mb-2">Predicted_Category</p><p className="text-3xl font-black tracking-tighter text-white uppercase">{aiResult.category}</p></div>
                                <div><div className="flex justify-between items-end mb-3"><p className="text-slate-500 text-[8px] uppercase font-black tracking-[0.2em]">Risk_Assessment</p><span className="text-xl font-black text-white tabular-nums">{aiResult.severity}<span className="text-slate-500 text-xs">/5</span></span></div><div className="flex gap-1.5 h-1.5">{[1, 2, 3, 4, 5].map((s) => (<div key={s} className={`flex-1 transition-all duration-500 ${s <= aiResult.severity ? (aiResult.severity >= 4 ? 'bg-red-600 shadow-neon-red' : 'bg-cyan-500 shadow-neon-cyan') : 'bg-slate-800'}`} style={{ transitionDelay: `${s * 75}ms` }} />))}</div></div>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="mt-10 w-full py-4 bg-[#0B0F19] hover:bg-[#1E293B] text-white text-[10px] font-black uppercase tracking-[0.3em] border border-slate-700 transition-all">Confirm_Intel_Data</button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

export default ReportForm;