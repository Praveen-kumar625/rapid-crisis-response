import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
    queueReport,
    getPendingReports,
    markReportSynced,
} from '../idb';

function ReportForm() {
    const [form, setForm] = useState({
        title: '',
        description: '',
        severity: 3,
        category: '',
    });
    const [position, setPosition] = useState({ lng: 0, lat: 0 });
    const [mediaType, setMediaType] = useState('');
    const [mediaBase64, setMediaBase64] = useState('');
    const [mediaPreview, setMediaPreview] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setIsSpeechSupported(!!SpeechRecognition);
    }, []);

    // ---------------------------------------------------------
    // Request notification permission for background sync failures
    // ---------------------------------------------------------
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    // ---------------------------------------------------------
    // Sync any pending reports when we regain a network connection
    // ---------------------------------------------------------
    useEffect(() => {
        async function syncPending() {
            const pending = await getPendingReports();
            if (!pending.length) return;

            for (const rpt of pending) {
                try {
                    await api.post('/incidents', {
                        title: rpt.title,
                        description: rpt.description,
                        severity: rpt.severity,
                        category: rpt.category,
                        lng: rpt.lng,
                        lat: rpt.lat,
                        mediaType: rpt.mediaType,
                        mediaBase64: rpt.mediaBase64,
                    });
                    await markReportSynced(rpt.localId);
                    toast.success(`✅ Offline report "${rpt.title}" synced`);
                } catch (err) {
                    console.error('⛔ Failed to sync pending report', err);
                    if (Notification.permission === 'granted') {
                        navigator.serviceWorker.ready.then((registration) => {
                            registration.showNotification('Crisis sync failed', {
                                body: 'Some offline reports could not be sent; they will retry later.',
                            });
                        });
                    }
                }
            }
        }

        if (navigator.onLine) {
            syncPending();
        }

        window.addEventListener('online', syncPending);
        return () => window.removeEventListener('online', syncPending);
    }, []);

    // ---------------------------------------------------------
    // Register background sync trigger
    // ---------------------------------------------------------
    async function triggerBackgroundSync() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const reg = await navigator.serviceWorker.ready;
            try {
                await reg.sync.register('sync-reports');
                console.log('[ReportForm] Background sync registered');
            } catch (err) {
                console.warn('[ReportForm] Background sync registration failed:', err);
            }
        }
    }

    // ---------------------------------------------------------
    // Voice input support (speech-to-text)
    // ---------------------------------------------------------
    const handleVoiceToggle = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Voice input not supported on this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = true;
        recognition.continuous = false;

        if (!isRecording) {
            setIsRecording(true);
            recognition.start();
        } else {
            recognition.stop();
        }

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0].transcript)
                .join(' ');
            setForm((prev) => ({...prev, description: prev.description ? `${prev.description} ${transcript}` : transcript }));
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (err) => {
            console.error('Speech recognition error', err);
            setIsRecording(false);
            toast.error('Voice recognition failed.');
        };
    };

    // ---------------------------------------------------------
    // Media file processing
    // ---------------------------------------------------------
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

                if (data.predictedCategory) {
                    setForm((prev) => ({...prev, category: data.predictedCategory }));
                }
                if (typeof data.auto_severity === 'number') {
                    setForm((prev) => ({...prev, severity: data.auto_severity }));
                }

                toast.success('🎯 AI prefill complete: category/severity updated');
            } catch (err) {
                console.warn('[ReportForm] AI analyze failed', err);
            }
        };
        reader.readAsDataURL(file);
    };

    // ---------------------------------------------------------
    // Submit handler – online vs. offline
    // ---------------------------------------------------------
    const handleSubmit = async(e) => {
        e.preventDefault();

        const payload = {
            ...form,
            lng: position.lng,
            lat: position.lat,
            mediaType,
            mediaBase64,
        };

        if (navigator.onLine) {
            try {
                await api.post('/incidents', payload);
                toast.success('✅ Incident reported');
            } catch (err) {
                console.error(err);
                toast.error('❌ Failed to report incident');
            }
        } else {
            await queueReport({...payload, synced: false });
            toast.success('🌓 Offline: report queued – it will sync when you go online');
            await triggerBackgroundSync();
        }
    };

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------
    return ( <
        form onSubmit = { handleSubmit }
        className = "space-y-3" >
        <
        input className = "w-full p-2 border"
        placeholder = "Title"
        value = { form.title }
        onChange = {
            (e) => setForm({...form, title: e.target.value })
        }
        required /
        >
        <
        <
        div className = "space-y-2" >
        <
        textarea className = "w-full p-2 border"
        placeholder = "Description"
        rows = { 3 }
        value = { form.description }
        onChange = {
            (e) => setForm({...form, description: e.target.value }) }
        /> {
            isSpeechSupported && ( <
                button type = "button"
                onClick = { handleVoiceToggle }
                className = { `px-3 py-1 rounded ${isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}` } >
                { isRecording ? 'Stop voice input' : 'Speak instead of typing' } <
                /button>
            )
        } <
        /div> <
        select className = "w-full p-2 border"
        value = { form.category }
        onChange = {
            (e) => setForm({...form, category: e.target.value })
        }
        required >
        <
        option value = "" > Category < /option> <
        option > FLOOD < /option> <
        option > EARTHQUAKE < /option> <
        option > FIRE < /option> <
        option > PANDEMIC < /option> < /
        select >

        <
        label className = "block" >
        Severity: { form.severity } <
        input type = "range"
        min = { 1 }
        max = { 5 }
        value = { form.severity }
        onChange = {
            (e) => setForm({...form, severity: Number(e.target.value) })
        }
        className = "w-full" /
        >
        <
        /label>

        <
        label className = "block mt-2" >
        Attach photo / video <
        input type = "file"
        accept = "image/*,video/*"
        capture = "environment"
        onChange = { handleMediaChange }
        className = "mt-1" /
        >
        <
        /label>

        {
            mediaPreview && ( <
                div className = "my-2" > {
                    mediaType.startsWith('image/') ? ( <
                        img src = { mediaPreview }
                        alt = "Media Preview"
                        className = "rounded border"
                        style = {
                            { maxWidth: '100%' }
                        }
                        />
                    ) : ( <
                        video controls src = { mediaPreview }
                        className = "rounded border"
                        style = {
                            { maxWidth: '100%' }
                        }
                        />
                    )
                } <
                /div>
            )
        }

        <
        button type = "submit"
        className = "bg-green-600 text-white px-4 py-2 rounded" >
        Submit Incident <
        /button> < /
        form >
    );
}

export default ReportForm;