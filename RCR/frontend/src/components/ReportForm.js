import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
    queueReport,
    getPendingReports,
    markReportSynced,
} from '../idb';
import { localAnalyze } from '../utils/edgeAi';

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
    const [mediaBase64, setMediaBase64] = useState('');
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
                    setPosition({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                },
                (err) => {
                    console.warn('[ReportForm] Geolocation FAILED:', err.message);
                    toast.error(`📍 Unable to get location: ${err.message}.`);
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
                        await api.post('/incidents', { ...rpt });
                        await markReportSynced(rpt.localId);
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
            toast.error('Audio recording is not supported.');
            return;
        }
        if (!isAudioRecording) {
            setSosMessage('SOS: Recording...');
            setIsAudioRecording(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            const chunks = [];
            recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
            recorder.onstop = async() => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setIsAudioRecording(false);
                setSosMessage('SOS: Processing...');
                const reader = new FileReader();
                reader.onloadend = async() => {
                    const base64 = reader.result.split(',')[1];
                    try {
                        await api.post('/incidents/voice', {
                            audioBase64: base64,
                            lat: position.lat,
                            lng: position.lng,
                            floorLevel: form.floorLevel,
                            roomNumber: form.roomNumber,
                            wingId: form.wingId,
                        });
                        setSosMessage('SOS Sent Successfully');
                        toast.success('Emergency alert dispatched.');
                    } catch (err) {
                        toast.error('SOS triage failed.');
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
        const reader = new FileReader();
        reader.onload = async(e) => {
            const base64data = e.target.result;
            setMediaBase64(base64data);
            setMediaPreview(base64data);
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
            toast.success('🛡️ Edge AI: Offline Triage Complete');
        }

        const payload = {
            ...finalForm,
            lng: position.lng,
            lat: position.lat,
            mediaType,
            mediaBase64,
            triageMethod
        };

        if (navigator.onLine) {
            try {
                await api.post('/incidents', payload);
                toast.success('Incident reported successfully');
                setForm({ title: '', description: '', severity: 3, category: '', floorLevel: 1, roomNumber: '', wingId: '' });
                setMediaPreview('');
            } catch (err) {
                toast.error('Failed to report incident');
            }
        } else {
            await queueReport({...payload, synced: false });
            toast.success('Report queued offline');
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-[2rem] border border-gray-100 overflow-hidden font-sans">
            <div className="bg-[#1a1a1a] p-8 text-white">
                <h2 className="text-3xl font-light tracking-tight mb-2 uppercase">Incident Report</h2>
                <p className="text-gray-400 text-sm font-medium tracking-widest italic">Hospitality Excellence & Security</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">Subject of Incident</label>
                        <input 
                            className="w-full bg-gray-50 border-b-2 border-gray-200 focus:border-black transition-colors py-3 outline-none text-lg font-light"
                            placeholder="e.g., Suite 402 Maintenance Requirement"
                            value={form.title}
                            onChange={(e) => setForm(prev => ({...prev, title: e.target.value }))}
                            required 
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">Detailed Narrative</label>
                        <textarea 
                            className="w-full bg-gray-50 border-b-2 border-gray-200 focus:border-black transition-colors py-3 outline-none text-lg font-light min-h-[120px]"
                            placeholder="Please provide a comprehensive description of the occurrence..."
                            value={form.description}
                            onChange={(e) => setForm(prev => ({...prev, description: e.target.value }))}
                            required 
                        />
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        {isSpeechSupported && (
                            <button 
                                type="button"
                                onClick={handleVoiceToggle}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 ${isRecording ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-gray-200 text-gray-600 hover:border-black'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                <span className="text-xs uppercase font-bold tracking-widest">{isRecording ? 'Stop Recording' : 'Voice Dictation'}</span>
                            </button>
                        )}

                        <button 
                            type="button"
                            onClick={handleAudioSOS}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full transition-all duration-500 shadow-lg ${isAudioRecording ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]' : 'bg-[#c5a059] text-white hover:bg-[#b08d4a]'}`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                            <span className="text-xs uppercase font-bold tracking-[0.2em]">{isAudioRecording ? 'Emergency Recording...' : 'SOS Audio Alert'}</span>
                        </button>
                        {sosMessage && <span className="text-[10px] italic text-red-500 font-medium">{sosMessage}</span>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">Wing / Sector</label>
                        <input className="w-full bg-gray-50 border-b-2 border-gray-200 py-2 outline-none font-light uppercase" placeholder="e.g., North" value={form.wingId} onChange={(e) => setForm(prev => ({...prev, wingId: e.target.value.toUpperCase() }))} required />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">Level</label>
                        <input type="number" className="w-full bg-gray-50 border-b-2 border-gray-200 py-2 outline-none font-light" value={form.floorLevel} onChange={(e) => setForm(prev => ({...prev, floorLevel: Number(e.target.value) }))} required />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">Room / Area</label>
                        <input className="w-full bg-gray-50 border-b-2 border-gray-200 py-2 outline-none font-light" placeholder="e.g., 402" value={form.roomNumber} onChange={(e) => setForm(prev => ({...prev, roomNumber: e.target.value }))} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-4">Classification</label>
                        <select 
                            className="w-full bg-white border-2 border-gray-100 p-4 rounded-xl outline-none appearance-none cursor-pointer hover:border-black transition-all font-light"
                            value={form.category}
                            onChange={(e) => setForm(prev => ({...prev, category: e.target.value }))}
                            required
                        >
                            <option value="">Select Category</option>
                            <option value="MEDICAL">MEDICAL EMERGENCY</option>
                            <option value="FIRE">FIRE INCIDENT</option>
                            <option value="INTRUDER">SECURITY BREACH</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Severity Assessment</label>
                            <span className="text-xs font-bold px-3 py-1 bg-black text-white rounded-full">LEVEL {form.severity}</span>
                        </div>
                        <input 
                            type="range" min="1" max="5" 
                            className="w-full accent-black cursor-pointer"
                            value={form.severity}
                            onChange={(e) => setForm(prev => ({...prev, severity: Number(e.target.value) }))}
                        />
                        <div className="flex justify-between text-[8px] uppercase tracking-tighter text-gray-400 mt-2 font-bold">
                            <span>Minimal</span>
                            <span>Critical</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Digital Evidence Capture</span>
                        <input type="file" accept="image/*,video/*" capture="environment" onChange={handleMediaChange} className="hidden" />
                    </label>
                    {mediaPreview && (
                        <div className="mt-6 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                            {mediaType.startsWith('image/') 
                                ? <img src={mediaPreview} alt="Evidence" className="w-full h-auto" />
                                : <video controls src={mediaPreview} className="w-full" />
                            }
                        </div>
                    )}
                </div>

                <button 
                    type="submit"
                    className="w-full py-6 bg-black text-white text-xs font-bold uppercase tracking-[0.4em] rounded-full hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0"
                >
                    Submit Formal Report
                </button>
            </form>

            {/* AI Glassmorphism Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md transition-all duration-500">
                    <div className="relative w-full max-w-md p-10 backdrop-blur-2xl bg-white/10 rounded-[2.5rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#c5a059]/20 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                    <svg className="w-5 h-5 text-[#c5a059]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                </div>
                                <h3 className="text-xl font-light tracking-wide uppercase">{aiResult.method} Result</h3>
                            </div>
                            
                            <div className="space-y-10">
                                <div>
                                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em] mb-3">Predicted Category</p>
                                    <p className="text-4xl font-extralight tracking-tight text-white">{aiResult.category}</p>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Risk Severity</p>
                                        <span className="text-2xl font-light">{aiResult.severity}<span className="text-white/30 text-sm">/5</span></span>
                                    </div>
                                    <div className="flex gap-2 h-1.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <div 
                                                key={s} 
                                                className={`flex-1 rounded-full transition-all duration-1000 ${s <= aiResult.severity ? 'bg-white' : 'bg-white/10'}`}
                                                style={{ transitionDelay: `${s * 100}ms` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className="mt-12 w-full py-5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] rounded-2xl hover:bg-[#c5a059] hover:text-white transition-all duration-300 shadow-lg"
                            >
                                Confirm & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportForm;