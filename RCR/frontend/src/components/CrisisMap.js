// frontend/src/components/CrisisMap.js
import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import api from '../api';
import { getSocket } from '../socket';

const RESPONDER_HQ = { lat: 28.6139, lng: 77.2090 };

function CrisisMap() {
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);

    useEffect(() => {
        let cancelled = false;
        let socketRef = null;

        api.get('/incidents').then((res) => {
            if (!cancelled) setIncidents(res.data);
        }).catch(console.error);

        const handleCreated = (payload) => {
            if (!cancelled) setIncidents((prev) => [payload.incident, ...prev]);
        };

        const handleStatusUpdated = (payload) => {
            if (!cancelled) {
                setIncidents((prev) => prev.map((i) => (i.id === payload.incident.id ? payload.incident : i)));
            }
        };

        (async() => {
            socketRef = await getSocket();
            socketRef.on('incident.created', handleCreated);
            socketRef.on('incident.status-updated', handleStatusUpdated);
        })();

        return () => { 
            cancelled = true; 
            if (socketRef) {
                socketRef.off('incident.created', handleCreated);
                socketRef.off('incident.status-updated', handleStatusUpdated);
            }
        };
    }, []);

    return (
        <div className="relative w-full h-[calc(100vh-70px)] bg-[#0f172a]">
            <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                <Map
                    defaultCenter={RESPONDER_HQ}
                    defaultZoom={13}
                    mapId="f260000000000000" // Use a dark mode map ID if available
                    disableDefaultUI={true}
                    styles={[
                        { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
                        { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                        { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
                        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
                        { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
                        { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
                        { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
                        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
                    ]}
                >
                    <AdvancedMarker position={RESPONDER_HQ}>
                        <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-2xl animate-pulse flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    </AdvancedMarker>

                    {incidents.map((inc) => (
                        <AdvancedMarker 
                            key={inc.id}
                            position={{ lat: inc.location.coordinates[1], lng: inc.location.coordinates[0] }}
                            onClick={() => setSelectedIncident(inc)}
                        >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl transform transition-transform hover:scale-125 cursor-pointer border-2 ${
                                inc.severity >= 4 ? 'bg-red-600 border-red-400 animate-bounce' : 'bg-amber-500 border-amber-300'
                            }`}>
                                <span className="text-white text-[10px] font-black">{inc.category[0]}</span>
                            </div>
                        </AdvancedMarker>
                    ))}
                </Map>
            </APIProvider>

            {/* Premium Overlay Info */}
            {selectedIncident && (
                <div className="absolute top-8 right-8 w-96 animate-in slide-in-from-right duration-500">
                    <div className="backdrop-blur-2xl bg-slate-900/90 border border-slate-700 p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="px-3 py-1 bg-red-600 text-[10px] font-black rounded-full uppercase tracking-widest">Priority {selectedIncident.severity}</span>
                                <h3 className="text-2xl font-bold mt-2 tracking-tight uppercase">{selectedIncident.title}</h3>
                            </div>
                            <button onClick={() => setSelectedIncident(null)} className="text-slate-500 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <p className="text-slate-400 font-light leading-relaxed mb-8">{selectedIncident.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Indoor Location</p>
                                <p className="text-xs font-bold uppercase">Wing {selectedIncident.wingId} • Fl {selectedIncident.floorLevel}</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Room</p>
                                <p className="text-xs font-bold uppercase">{selectedIncident.roomNumber}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">AI Intelligence Action Plan</p>
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                                <p className="text-xs text-amber-200 leading-relaxed italic">{selectedIncident.actionPlan || "Analyzing optimal route..."}</p>
                            </div>
                        </div>

                        <button className="w-full mt-8 py-4 bg-white text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-xl">
                            Acknowledge & Deploy
                        </button>
                    </div>
                </div>
            )}

            {/* Map Legend Bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-2 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-2 border-r border-slate-700">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fire</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 border-r border-slate-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security</span>
                </div>
            </div>
        </div>
    );
}

export default CrisisMap;
