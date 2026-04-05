import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { X, Navigation, AlertCircle, Info, LocateFixed } from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';

const RESPONDER_HQ = { lat: 28.6139, lng: 77.2090 };

function CrisisMap() {
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);

    useEffect(() => {
        let isMounted = true;
        let socketInstance = null;

        api.get('/incidents').then((res) => {
            if (isMounted) setIncidents(res.data);
        }).catch(console.error);

        const handleCreated = (payload) => {
            if (isMounted) setIncidents((prev) => [payload.incident, ...prev]);
        };

        const handleStatusUpdated = (payload) => {
            if (isMounted) {
                setIncidents((prev) => prev.map((i) => (i.id === payload.incident.id ? payload.incident : i)));
            }
        };

        (async() => {
            socketInstance = await getSocket();
            if (!isMounted) return;
            socketInstance.on('incident.created', handleCreated);
            socketInstance.on('incident.status-updated', handleStatusUpdated);
        })();

        return () => { 
            isMounted = false; 
            if (socketInstance) {
                socketInstance.off('incident.created', handleCreated);
                socketInstance.off('incident.status-updated', handleStatusUpdated);
            }
        };
    }, []);

    const getMarkerColor = (severity, category) => {
        if (severity === 5) return 'bg-danger border-danger shadow-[0_0_20px_rgba(255,51,102,0.6)] animate-pulse';
        if (severity >= 4) return 'bg-amber border-amber shadow-[0_0_15px_rgba(245,158,11,0.5)]';
        if (category === 'MEDICAL') return 'bg-electric border-electric shadow-[0_0_15px_rgba(0,240,255,0.4)]';
        return 'bg-emerald border-emerald shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    };

    return (
        <div className="relative w-full h-full bg-navy-900 overflow-hidden flex-1 flex">
            <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'dummy_for_layout_if_missing'}>
                <Map
                    defaultCenter={RESPONDER_HQ}
                    defaultZoom={15}
                    mapId="f260000000000000" // Premium dark mode map ID
                    disableDefaultUI={true}
                    gestureHandling="greedy"
                    className="w-full h-full outline-none"
                    // Inline dark styles as fallback
                    styles={[
                        { "elementType": "geometry", "stylers": [{ "color": "#0a0f1c" }] },
                        { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                        { "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
                        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0a0f1c" }] },
                        { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
                        { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
                        { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#1e293b" }] },
                        { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#0f172a" }] },
                        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
                    ]}
                >
                    <AdvancedMarker position={RESPONDER_HQ}>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-12 h-12 bg-electric/20 rounded-full animate-ping"></div>
                            <div className="w-6 h-6 bg-navy-900 rounded-full border-2 border-electric flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.5)] z-10">
                                <div className="w-2 h-2 bg-electric rounded-full"></div>
                            </div>
                        </div>
                    </AdvancedMarker>

                    {incidents.map((inc) => (
                        <AdvancedMarker 
                            key={inc.id}
                            position={{ lat: inc.location?.coordinates[1] || RESPONDER_HQ.lat, lng: inc.location?.coordinates[0] || RESPONDER_HQ.lng }}
                            onClick={() => setSelectedIncident(inc)}
                            className="z-10"
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transform transition-all duration-300 hover:scale-125 cursor-pointer border-2 ${getMarkerColor(inc.severity, inc.category)}`}>
                                <span className="text-white text-[10px] font-black">{inc.category?.[0] || '!'}</span>
                            </div>
                        </AdvancedMarker>
                    ))}
                </Map>
            </APIProvider>

            {/* Floating Top Controls */}
            <div className="absolute top-6 left-6 flex gap-3 z-10">
                <div className="glass-card flex items-center px-4 py-2 gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                    <LocateFixed size={16} className="text-electric" />
                    Tracking {incidents.length} Active Zones
                </div>
            </div>

            {/* Premium Overlay Info */}
            {selectedIncident && (
                <div className="absolute top-6 right-6 w-[380px] z-20 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="glass-card p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <span className={`px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest border ${
                                        selectedIncident.severity >= 4 ? 'bg-danger/20 text-danger border-danger/30' : 'bg-amber/20 text-amber border-amber/30'
                                    }`}>Level {selectedIncident.severity}</span>
                                    <span className="px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest bg-white/5 border border-white/10 text-slate-300">
                                        {selectedIncident.category}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold tracking-wide text-slate-100 uppercase mt-1 leading-tight">{selectedIncident.title}</h3>
                            </div>
                            <button onClick={() => setSelectedIncident(null)} className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <p className="text-slate-400 text-sm font-light leading-relaxed mb-6">{selectedIncident.description}</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-navy-900/50 p-3 rounded-xl border border-surfaceBorder">
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1 flex items-center gap-1"><Navigation size={10} /> Zone</p>
                                <p className="text-xs font-bold uppercase text-slate-200">Wing {selectedIncident.wingId}</p>
                            </div>
                            <div className="bg-navy-900/50 p-3 rounded-xl border border-surfaceBorder">
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1 flex items-center gap-1"><Info size={10} /> Location</p>
                                <p className="text-xs font-bold uppercase text-slate-200">Fl {selectedIncident.floorLevel} - Rm {selectedIncident.roomNumber}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-electric flex items-center gap-2">
                                <AlertCircle size={12} />
                                Edge AI Plan
                            </p>
                            <div className="bg-electric/5 border border-electric/20 p-3.5 rounded-xl shadow-inner">
                                <p className="text-xs text-electric/90 leading-relaxed font-mono">{selectedIncident.actionPlan || "Analyzing optimal route..."}</p>
                            </div>
                        </div>

                        <button className="w-full py-3.5 bg-white text-navy-900 text-xs font-bold uppercase tracking-[0.15em] rounded-xl hover:bg-electric hover:text-navy-900 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]">
                            Deploy Units
                        </button>
                    </div>
                </div>
            )}

            {/* Map Legend Bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-card flex p-1.5 rounded-2xl z-10">
                <div className="flex items-center gap-2 px-4 py-2 border-r border-surfaceBorder">
                    <div className="w-2.5 h-2.5 bg-danger rounded shadow-[0_0_10px_rgba(255,51,102,0.5)]"></div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.15em]">Fire / Critical</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 border-r border-surfaceBorder">
                    <div className="w-2.5 h-2.5 bg-electric rounded shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.15em]">Medical</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-2.5 h-2.5 bg-amber rounded shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.15em]">Security</span>
                </div>
            </div>
        </div>
    );
}

export default CrisisMap;
