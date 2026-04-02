import React, { useState, useEffect, useRef } from 'react';
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
    const [audioBlob, setAudioBlob] = useState(null);
    const [sosMessage, setSosMessage] = useState('');
    const mediaRecorderRef = useRef(null);

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
    // Voice input support (speech-to-text) and SOS audio recording
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

    const handleAudioSOS = async() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error('Audio recording is not supported in this browser.');
            return;
        }

        if (!isAudioRecording) {
            setSosMessage('Recording SOS audio...');
            setIsAudioRecording(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = async() => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setIsAudioRecording(false);
                setSosMessage('Audio recorded. Sending for AI triage...');

                const reader = new FileReader();
                reader.onloadend = async() => {
                    const base64 = reader.result.split(',')[1];
                    try {
                        const response = await api.post('/incidents/voice', {
                            audioBase64: base64,
                            lat: position.lat,
                            lng: position.lng,
                            floorLevel: form.floorLevel,
                            roomNumber: form.roomNumber,
                            wingId: form.wingId,
                        });
                        setSosMessage('SOS Audio sent successfully');
                        toast.success('✅ SOS audio triage sent.');
                    } catch (err) {
                        console.error('SOS audio send failed', err);
                        toast.error('❌ SOS audio triage failed.');
                    }
                };
                reader.readAsDataURL(blob);
            };

            recorder.start();
        } else {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                setSosMessage('Finishing recording...');
            }
        }
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
            floorLevel: Number(form.floorLevel),
            roomNumber: form.roomNumber,
            wingId: form.wingId,
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
        className = "space-y-4" >
        <
        input className = "w-full p-2 border"
        placeholder = "Title"
        value = { form.title }
        onChange = {
            (e) => setForm((prev) => ({...prev, title: e.target.value })) }
        required /
        >

        <
        textarea className = "w-full p-2 border"
        placeholder = "Description"
        rows = { 3 }
        value = { form.description }
        onChange = {
            (e) => setForm((prev) => ({...prev, description: e.target.value })) }
        required /
        >

        <
        div className = "flex gap-2" > {
            isSpeechSupported && ( <
                button type = "button"
                onClick = { handleVoiceToggle }
                className = { `px-3 py-1 rounded ${isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}` } > { isRecording ? 'Stop voice input' : 'Speak instead of typing' } <
                /button>
            )
        }

        <
        button type = "button"
        onClick = { handleAudioSOS }
        className = { `px-3 py-1 rounded ${isAudioRecording ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}` } > { isAudioRecording ? 'Stop SOS Recording' : 'Red SOS Mic (Audio)' } <
        /button> <
        /div>

        {
            sosMessage && < p className = "text-sm text-gray-600" > { sosMessage } < /p>}

            <
            div className = "grid grid-cols-3 gap-2" >
                <
                input
            className = "p-2 border"
            placeholder = "Wing ID"
            value = { form.wingId }
            onChange = {
                (e) => setForm((prev) => ({...prev, wingId: e.target.value })) }
            required
                /
                >

                <
                input
            className = "p-2 border"
            placeholder = "Floor Level"
            type = "number"
            min = { 1 }
            value = { form.floorLevel }
            onChange = {
                (e) => setForm((prev) => ({...prev, floorLevel: Number(e.target.value) })) }
            required
                /
                >

                <
                input
            className = "p-2 border"
            placeholder = "Room Number"
            value = { form.roomNumber }
            onChange = {
                (e) => setForm((prev) => ({...prev, roomNumber: e.target.value })) }
            required
                /
                >
                <
                /div>

            <
            select
            className = "w-full p-2 border"
            value = { form.category }
            onChange = {
                (e) => setForm((prev) => ({...prev, category: e.target.value })) }
            required
                >
                <
                option value = "" > Category < /option> <
                option value = "MEDICAL" > MEDICAL < /option> <
                option value = "FIRE" > FIRE < /option> <
                option value = "INTRUDER" > INTRUDER < /option> <
                /select>

            <
            label className = "block" >
                Severity: { form.severity } <
                input
            type = "range"
            min = { 1 }
            max = { 5 }
            value = { form.severity }
            onChange = {
                (e) => setForm((prev) => ({...prev, severity: Number(e.target.value) })) }
            className = "w-full" /
                >
                <
                /label>

            <
            label className = "block mt-2" >
                Attach photo / video <
                input
            type = "file"
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
                            alt = "Media preview"
                            className = "rounded border"
                            style = {
                                { maxWidth: '100%' } }
                            />
                        ) : ( <
                            video controls src = { mediaPreview }
                            className = "rounded border"
                            style = {
                                { maxWidth: '100%' } }
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
                /button> <
                /form>
        );
    }

    export default ReportForm;