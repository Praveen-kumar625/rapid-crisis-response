import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { X, Navigation, Info, LocateFixed, Zap, Shield } from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

const RESPONDER_HQ = { lat: 28.6139, lng: 77.2090 };

/**
 * 🚨 DIAGNOSTIC REPORT: MAP FAILURE
 * Root Causes Identified:
 * 1. mapId Mismatch: Using a placeholder mapId ("f2600000...") often prevents AdvancedMarker from rendering if not registered in Google Cloud Console.
 * 2. Dimensional Collapse: Ensured parent container uses 'h-full' and 'min-h-[500px]' to prevent 0px height.
 * 3. Marker Data: Standardized coordinate extraction to prevent 'undefined' position errors.
 * 4. React Strict Mode: Added cleanup for socket listeners to prevent duplicate initialization.
 */

function CrisisMap() {
    const navigate = useNavigate();
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
        if (severity === 5) return { bg: 'bg-danger', border: 'border-danger', glow: 'shadow-[0_0_20px_rgba(255,51,102,0.6)] animate-pulse' };
        if (severity >= 4) return { bg: 'bg-accent', border: 'border-accent', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' };
        if (category === 'MEDICAL') return { bg: 'bg-secondary', border: 'border-secondary', glow: 'shadow-[0_0_15px_rgba(13,148,136,0.4)]' };
        return { bg: 'bg-emerald', border: 'border-emerald', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' };
    };

    const memoizedMarkers = useMemo(() => incidents.map((inc) => {
        const colors = getMarkerColor(inc.severity, inc.category);
        const lat = inc.location?.coordinates[1] || inc.lat;
        const lng = inc.location?.coordinates[0] || inc.lng;

        if (typeof lat !== 'number' || typeof lng !== 'number') return null;

        return (
            <AdvancedMarker 
                key={inc.id}
                position={{ lat, lng }}
                onClick={() => setSelectedIncident(inc)}
            >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transform transition-all duration-300 hover:scale-125 hover:-translate-y-1 cursor-pointer border-2 ${colors.bg} ${colors.border} ${colors.glow}`}>
                    <span className="text-white text-[10px] font-black uppercase">{inc.category?.[0] || '!'}</span>
                </div>
            </AdvancedMarker>
        );
    }), [incidents]);

    return (
        <div className="relative w-full h-full min-h-[500px] bg-navy-950 overflow-hidden flex-1 flex">
            <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} onLoad={() => console.log('Map Script Loaded')}>
                <Map
                    defaultCenter={RESPONDER_HQ}
                    defaultZoom={15}
                    // 🚨 FIXED: Removed mapId to allow markers to show even if ID is not configured in Cloud Console
                    disableDefaultUI={true}
                    gestureHandling="greedy"
                    className="w-full h-full outline-none"
                    styles={[
                        { "elementType": "geometry", "stylers": [{ "color": "#050810" }] },
                        { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                        { "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
                        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#050810" }] },
                        { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#1e293b" }] },
                        { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#050810" }] },
                        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
                    ]}
                >
                    {/* HQ Marker */}
                    <AdvancedMarker position={RESPONDER_HQ}>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-12 h-12 bg-secondary/20 rounded-full animate-ping"></div>
                            <div className="w-6 h-6 bg-navy-950 rounded-full border-2 border-secondary flex items-center justify-center shadow-lg z-10">
                                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                            </div>
                        </div>
                    </AdvancedMarker>

                    {memoizedMarkers}
                </Map>
            </APIProvider>

            {/* Floating Operations Header */}
            <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
                <Card variant="panel" className="flex items-center px-5 py-3 gap-4 border border-white/10 shadow-2xl backdrop-blur-2xl">
                    <div className="flex items-center gap-2">
                        <Shield size={18} className="text-danger" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Signal Feed</span>
                    </div>
                    <div className="w-px h-4 bg-white/10"></div>
                    <div className="flex items-center gap-2">
                        <LocateFixed size={16} className="text-secondary" />
                        <span className="text-xs font-mono font-bold text-secondary">{incidents.length} NODES</span>
                    </div>
                </Card>
            </div>

            {/* Incident Overlay Info */}
            {selectedIncident && (
                <div className="absolute top-6 right-6 w-full max-w-[400px] z-20 px-6 sm:px-0 animate-in slide-in-from-right-8 fade-in duration-500">
                    <Card className="p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-t-2 border-t-white/10 relative overflow-hidden" glowing={selectedIncident.severity >= 4}>
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Shield size={160} strokeWidth={1} />
                        </div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <Badge variant={selectedIncident.severity >= 4 ? 'danger' : 'accent'}>LVL {selectedIncident.severity} IMPACT</Badge>
                                    <Badge variant="neutral" className="uppercase text-[10px] tracking-widest">{selectedIncident.category}</Badge>
                                </div>
                                <h3 className="text-2xl font-black tracking-tight text-white uppercase leading-tight">{selectedIncident.title}</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedIncident(null)} 
                                className="p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all outline-none focus:ring-2 focus:ring-electric"
                                aria-label="Close Detail"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <p className="text-slate-400 text-sm font-light leading-relaxed mb-8 relative z-10 line-clamp-3">{selectedIncident.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                            <div className="bg-navy-950/50 p-4 rounded-2xl border border-white/5 shadow-inner">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Navigation size={10} /> ZONE_ID</p>
                                <p className="text-xs font-bold uppercase text-slate-200 font-mono">WING_{selectedIncident.wingId}</p>
                            </div>
                            <div className="bg-navy-950/50 p-4 rounded-2xl border border-white/5 shadow-inner">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Info size={10} /> COORDS</p>
                                <p className="text-xs font-bold uppercase text-slate-200 font-mono">FL_{selectedIncident.floorLevel} {'//'} RM_{selectedIncident.roomNumber}</p>
                            </div>
                        </div>

                        <Button 
                            className="btn-accent w-full py-5 text-xs font-black uppercase tracking-widest"
                            onClick={() => navigate(`/incidents/${selectedIncident.id}`)}
                        >
                            Review Full Intel Data
                        </Button>
                    </Card>
                </div>
            )}

            {/* Map Legend Bar */}
            <div className="absolute bottom-6 left-4 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 flex flex-col sm:flex-row p-1 rounded-2xl z-10 glass-card bg-navy-950/80 backdrop-blur-md border border-white/5">
                {[
                    { color: 'bg-danger', label: 'Fire / Critical', shadow: 'shadow-danger' },
                    { color: 'bg-secondary', label: 'Medical', shadow: 'shadow-secondary/50' },
                    { color: 'bg-accent', label: 'Security', shadow: 'shadow-accent/50' },
                ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 sm:px-5 py-2 sm:py-2.5 ${i !== 2 ? 'border-b sm:border-b-0 sm:border-r border-white/5' : ''}`}>
                        <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${item.color} rounded-full ${item.shadow}`}></div>
                        <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CrisisMap;
