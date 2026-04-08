import React, { useState, useEffect, useRef } from 'react';
import { Phone, X, Mic, MicOff, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const PhoneModal = ({ isOpen, onClose, onSubmit, hotelId, position, floorLevel, roomNumber, wingId }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    
    // PHASE 2: State for Microphone Integration
    const [isAudioRecording, setIsAudioRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sosMessage, setSosMessage] = useState('');
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Reset state when modal is toggled
    useEffect(() => {
        if (!isOpen) {
            setPhoneNumber('');
            setError('');
            setIsAudioRecording(false);
            setIsProcessing(false);
            setSosMessage('');
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Strip non-numeric immediately
        if (value.length <= 10) {
            setPhoneNumber(value);
            if (error) setError('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Indian Mobile Number Validation: 10 digits starting with 6-9
        const indianPhoneRegex = /^[6-9]\d{9}$/;

        if (!phoneNumber) {
            setError('Phone number is required');
            return;
        }

        if (!indianPhoneRegex.test(phoneNumber)) {
            setError('Please enter a valid 10-digit Indian mobile number');
            return;
        }

        // Submit validated string with country prefix
        onSubmit(`+91${phoneNumber}`);
        onClose();
    };

    // -----------------------------------------------------------------
    // PHASE 2: Microphone Integration Handlers
    // -----------------------------------------------------------------
    
    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error('Browser does not support audio recording');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                await processAndSendAudio(audioBlob, recorder.mimeType || 'audio/webm');
                
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsAudioRecording(true);
            setSosMessage('SOS Recording Active... Speak Now');
            toast.success('Microphone Active');
        } catch (err) {
            console.error('[Microphone] Access Denied:', err);
            toast.error('Microphone access denied. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsAudioRecording(false);
            setSosMessage('Processing Signal...');
        }
    };

    const processAndSendAudio = async (blob, mimeType) => {
        setIsProcessing(true);
        const reader = new FileReader();
        
        reader.onloadend = async () => {
            try {
                // Convert to Base64 (strip data:audio/webm;base64, prefix)
                const base64Payload = reader.result.split(',')[1];
                
                // POST to backend SOS route
                const response = await api.post('/incidents/sos/voice', {
                    audioBase64: base64Payload,
                    mimeType: mimeType,
                    lat: position?.lat || 0,
                    lng: position?.lng || 0,
                    floorLevel: floorLevel || 1,
                    roomNumber: roomNumber || 'unknown',
                    wingId: wingId || 'unknown',
                    hotelId: hotelId
                });

                if (response.data.success) {
                    toast.success('SOS Voice Intel Dispatched');
                } else {
                    toast.error('Automated Triage Failed - Manual Alert Created');
                }
                
                onClose();
            } catch (err) {
                console.error('[SOS] Dispatch Error:', err);
                toast.error('Failed to dispatch emergency audio signal');
            } finally {
                setIsProcessing(false);
                setSosMessage('');
            }
        };

        reader.readAsDataURL(blob);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={!isProcessing ? onClose : undefined}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md mx-auto transition-all transform duration-300 bg-white rounded-2xl shadow-2xl">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    disabled={isProcessing}
                    className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    {/* Header Icon */}
                    <div className={`flex items-center justify-center w-14 h-14 mb-6 rounded-full mx-auto border shadow-inner transition-all ${isAudioRecording ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                        {isAudioRecording ? <Mic size={28} /> : <Phone size={28} />}
                    </div>

                    <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
                        {isAudioRecording ? 'Emergency Voice Link' : 'Emergency SMS Alerts'}
                    </h3>
                    <p className="text-sm text-center text-gray-500 mb-8 leading-relaxed">
                        {isAudioRecording 
                            ? 'The system is recording your voice. State your emergency, location, and language.' 
                            : 'Get instant critical updates during emergencies. We\'ll send real-time alerts and safety protocols directly to your phone.'}
                    </p>

                    {/* SOS Voice Action (PHASE 2) */}
                    <div className="mb-8">
                        <button
                            type="button"
                            onClick={isAudioRecording ? stopRecording : startRecording}
                            disabled={isProcessing}
                            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all active:scale-95 ${
                                isAudioRecording 
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                                    : 'bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100'
                            } disabled:opacity-50`}
                        >
                            {isProcessing ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : isAudioRecording ? (
                                <MicOff size={20} />
                            ) : (
                                <AlertTriangle size={20} />
                            )}
                            {isProcessing ? 'PROCESSING...' : isAudioRecording ? 'STOP & DISPATCH SOS' : 'RECORD VOICE SOS'}
                        </button>
                        {sosMessage && (
                            <p className="text-center text-[10px] font-bold text-red-500 mt-3 animate-pulse tracking-widest uppercase">
                                {sosMessage}
                            </p>
                        )}
                    </div>

                    {!isAudioRecording && !isProcessing && (
                        <>
                            <div className="relative flex items-center py-4">
                                <div className="flex-grow border-t border-gray-100"></div>
                                <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-bold uppercase tracking-widest">OR USE SMS</span>
                                <div className="flex-grow border-t border-gray-100"></div>
                            </div>

                            {/* Input Form */}
                            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                                <div className="relative">
                                    <label htmlFor="phone" className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">
                                        Enter Mobile Number
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-semibold border-r border-gray-200 pr-3 mr-4">
                                            +91
                                        </div>
                                        <input 
                                            type="text" 
                                            id="phone"
                                            value={phoneNumber}
                                            onChange={handlePhoneChange}
                                            placeholder="7801978844"
                                            className={`block w-full pl-16 pr-4 py-4 bg-gray-50 border-2 ${
                                                error 
                                                ? 'border-red-500 ring-4 ring-red-500/10' 
                                                : 'border-gray-100 group-hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                                            } rounded-xl text-gray-900 placeholder-gray-300 outline-none transition-all duration-200 text-xl tracking-[0.2em] font-medium`}
                                            autoFocus
                                            autoComplete="off"
                                        />
                                    </div>
                                    {error && (
                                        <div className="mt-3 text-sm text-red-500 flex items-center font-medium animate-in fade-in slide-in-from-top-1">
                                            <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                            {error}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3.5 text-sm font-bold text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-gray-700 border border-gray-100 transition-all active:scale-[0.98]"
                                    >
                                        Maybe Later
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] hover:-translate-y-0.5"
                                    >
                                        Enable Alerts
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhoneModal;
