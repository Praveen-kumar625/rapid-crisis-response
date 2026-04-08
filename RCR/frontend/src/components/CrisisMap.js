import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Shield, AlertCircle, MapPin, Navigation, Crosshair, Zap } from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import toast from 'react-hot-toast';

// Default center (New Delhi)
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

// High-Contrast Tactical Dark Theme
const MAP_STYLES = [
    { "elementType": "geometry", "stylers": [{ "color": "#0B1120" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#4B5563" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0B1120" }] },
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#1F2937" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#4B5563" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#111827" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1F2937" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#1F2937" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#020617" }] }
];

// Helper component to handle map centering
const MapControl = ({ userLocation }) => {
    const map = useMap();
    const centerOnUser = useCallback(() => {
        if (map && userLocation) {
            map.panTo(userLocation);
            map.setZoom(16);
        }
    }, [map, userLocation]);

    return (
        <button 
            onClick={centerOnUser}
            className="p-3 bg-[#0B0F19] border border-slate-700 text-cyan-400 hover:bg-slate-800 transition-all shadow-neon-cyan pointer-events-auto"
            title="Center on my location"
        >
            <Crosshair size={20} />
        </button>
    );
};

function CrisisMap({ incidents: externalIncidents, onMarkerClick, activeFilter }) {
    const navigate = useNavigate();
    const [internalIncidents, setInternalIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [liveIotAlerts, setLiveIotAlerts] = useState([]);

    const incidents = externalIncidents || internalIncidents;
    
    // Config from Environment
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.REACT_APP_GOOGLE_MAPS_ID || 'DEMO_MAP_ID';

    // -----------------------------------------------------------------
    // ULTRA LEVEL: Geolocation Tracking
    // -----------------------------------------------------------------
    useEffect(() => {
        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by your browser');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                console.error('Error getting location:', error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // -----------------------------------------------------------------
    // ULTRA LEVEL: Real-time Data Synchronization
    // -----------------------------------------------------------------
    useEffect(() => {
        if (externalIncidents) return;

        let isMounted = true;
        let socketInstance = null;

        // Initial Data Fetch
        api.get('/incidents').then((res) => {
            if (isMounted) setInternalIncidents(res.data);
        }).catch(err => console.error('[Map] Data fetch failed:', err));

        // Real-time Update Handlers
        const handleCreated = (payload) => {
            if (isMounted) {
                setInternalIncidents((prev) => {
                    if (prev.some(inc => inc.id === payload.incident.id)) return prev;
                    toast.success(`NEW ALERT: ${payload.incident.title}`, { icon: '🚨' });
                    return [payload.incident, ...prev];
                });
            }
        };

        const handleStatusUpdated = (payload) => {
            if (isMounted) {
                setInternalIncidents((prev) => prev.map((i) => (i.id === payload.incident.id ? payload.incident : i)));
            }
        };

        const handleIotAlert = (iotEvent) => {
            if (isMounted) {
                console.log('📡 [Map] IoT Alert Received:', iotEvent);
                setLiveIotAlerts(prev => {
                    const filtered = prev.filter(e => e.id !== iotEvent.id);
                    return [iotEvent, ...filtered].slice(0, 10);
                });
                toast(`SENSOR TRIGGER: ${iotEvent.title}`, { icon: '🔥', duration: 4000 });
            }
        };

        const initSocket = async() => {
            try {
                socketInstance = await getSocket();
                if (!isMounted || !socketInstance) return;
                socketInstance.on('incident.created', handleCreated);
                socketInstance.on('incident.status-updated', handleStatusUpdated);
                socketInstance.on('NEW_IOT_ALERT', handleIotAlert);
            } catch (err) {
                console.error('[Map] Socket failed:', err);
            }
        };

        initSocket();

        return () => {
            isMounted = false;
            if (socketInstance) {
                socketInstance.off('incident.created', handleCreated);
                socketInstance.off('incident.status-updated', handleStatusUpdated);
                socketInstance.off('NEW_IOT_ALERT', handleIotAlert);
            }
        };
    }, [externalIncidents]);

    // Merge static and live data
    const activeData = useMemo(() => {
        const merged = [...incidents];
        liveIotAlerts.forEach(iot => {
            if (!merged.some(m => m.id === iot.id)) {
                merged.push({
                    ...iot,
                    lat: iot.location.coordinates[1],
                    lng: iot.location.coordinates[0],
                    isIot: true
                });
            }
        });
        return merged;
    }, [incidents, liveIotAlerts]);

    const filteredIncidents = useMemo(() => {
        if (!activeFilter || activeFilter === 'ALL') return activeData;
        if (activeFilter === 'SENSORS') return activeData.filter(i => i.isIot || i.triageMethod?.includes('IoT'));
        if (activeFilter === 'REPORTS') return activeData.filter(i => !i.isIot && !i.triageMethod?.includes('IoT'));
        return activeData;
    }, [activeData, activeFilter]);

    // Render Markers
    const markers = useMemo(() => filteredIncidents.map((inc) => {
        const lat = parseFloat(inc.lat || inc.location?.coordinates[1]);
        const lng = parseFloat(inc.lng || inc.location?.coordinates[0]);

        if (isNaN(lat) || isNaN(lng)) return null;

        const isCritical = inc.severity >= 4;
        const isSelected = selectedIncident?.id === inc.id;
        const isIot = inc.isIot;

        return (
            <AdvancedMarker 
                key={inc.id}
                position={{ lat, lng }}
                onClick={() => {
                    setSelectedIncident(inc);
                    if (onMarkerClick) onMarkerClick(inc);
                }}
            >
                <div className={`relative transition-all duration-300 ${isSelected ? 'scale-150 z-50' : 'hover:scale-110'}`}>
                    {isIot && (
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-[2]"></div>
                    )}
                    <Pin 
                        background={isIot ? '#ff0000' : (isCritical ? '#ff3366' : '#00f0ff')}
                        glyphColor={'#ffffff'}
                        borderColor={isSelected ? '#ffffff' : (isCritical ? '#991b1b' : '#0891b2')}
                    />
                </div>
            </AdvancedMarker>
        );
    }), [filteredIncidents, selectedIncident, onMarkerClick]);

    if (!apiKey) {
        return (
            <div className="w-full h-full min-h-0 flex flex-col items-center justify-center bg-[#0B0F19] p-12 text-center border border-slate-800 rounded-none">
                <AlertCircle size={48} className="text-red-600 mb-6" />
                <h2 className="text-2xl font-black text-slate-100 uppercase mb-4">Map Key Missing</h2>
                <p className="text-slate-400 max-w-md font-mono text-xs uppercase tracking-widest">
                    Define REACT_APP_GOOGLE_MAPS_API_KEY in your .env.local file to initialize the tactical overlay.
                </p>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#0B0F19] touch-auto">
            <APIProvider apiKey={apiKey}>
                <Map 
                    defaultCenter={DEFAULT_CENTER}
                    defaultZoom={14}
                    mapId={mapId}
                    disableDefaultUI={true}
                    gestureHandling="greedy"
                    styles={MAP_STYLES}
                    className="w-full h-full min-h-0"
                >
                    {/* ULTRA LEVEL: User Position Marker */}
                    {userLocation && (
                        <AdvancedMarker position={userLocation}>
                            <div className="relative flex items-center justify-center">
                                <div className="absolute w-8 h-8 bg-blue-500/20 rounded-full animate-ping"></div>
                                <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] z-10"></div>
                                <div className="absolute -bottom-6 bg-blue-600/90 text-white text-[8px] px-2 py-0.5 font-bold rounded-none uppercase tracking-tighter whitespace-nowrap">
                                    You are here
                                </div>
                            </div>
                        </AdvancedMarker>
                    )}

                    {/* HQ Marker */}
                    <AdvancedMarker position={DEFAULT_CENTER}>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-none animate-pulse"></div>
                            <div className="w-8 h-8 bg-[#0B0F19] border-2 border-cyan-500 flex items-center justify-center shadow-neon-cyan z-10">
                                <Shield size={14} className="text-cyan-400" />
                            </div>
                        </div>
                    </AdvancedMarker>

                    {markers}

                    {selectedIncident && (
                        <InfoWindow 
                            position={{
                                lat: parseFloat(selectedIncident.lat || selectedIncident.location?.coordinates[1]),
                                lng: parseFloat(selectedIncident.lng || selectedIncident.location?.coordinates[0])
                            }}
                            onCloseClick={() => setSelectedIncident(null)}
                        >
                            <div className="p-3 max-w-[200px] bg-[#151B2B] border border-slate-700 text-slate-100 font-mono">
                                <Badge 
                                    variant={selectedIncident.severity >= 4 ? 'danger' : 'amber'}
                                    className="mb-2 text-[8px]"
                                >
                                    {selectedIncident.isIot ? 'LIVE SENSOR' : `LVL ${selectedIncident.severity}`}
                                </Badge>
                                <h4 className="font-black text-xs uppercase mb-1 leading-tight text-white italic">{selectedIncident.title}</h4>
                                <p className="text-[9px] mb-3 line-clamp-2 text-slate-400 uppercase tracking-tight">{selectedIncident.description}</p>
                                <button 
                                    className="w-full py-2 text-[9px] font-black uppercase bg-cyan-600 text-black border border-cyan-400"
                                    onClick={() => navigate(`/incidents/${selectedIncident.id}`)}
                                >
                                    Review_Intel
                                </button>
                            </div>
                        </InfoWindow>
                    )}

                    {/* Centering Control Component */}
                    <div className="absolute bottom-6 right-6 z-30">
                        <MapControl userLocation={userLocation} />
                    </div>
                </Map>
            </APIProvider>

            {/* Tactical Overlays */}
            <div className="absolute top-2 left-2 md:top-6 md:left-6 z-20 pointer-events-none">
                <Card className="bg-[#0B0F19]/90 border border-slate-700 p-3 md:p-5 shadow-tactical flex flex-col gap-4 min-w-[180px]">
                    <div className="flex items-center gap-3">
                        <Zap size={18} className="text-cyan-400 animate-pulse" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Grid_Telemetry</span>
                            <span className="text-xs font-bold text-white tabular-nums uppercase">Operational</span>
                        </div>
                    </div>
                    <div className="h-px bg-slate-800 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-[7px] font-bold text-slate-500 uppercase">Nodes</span>
                            <span className="text-lg font-black text-cyan-400 tabular-nums">{filteredIncidents.length}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[7px] font-bold text-slate-500 uppercase">Hazards</span>
                            <span className="text-lg font-black text-red-500 tabular-nums">
                                {filteredIncidents.filter(i => i.severity >= 4 || i.category === 'FIRE').length}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* User Location Info Overlay */}
            {userLocation && (
                <div className="absolute bottom-6 left-6 z-20 hidden md:block">
                    <div className="bg-[#0B0F19]/80 backdrop-blur-sm border border-blue-500/30 px-4 py-2 flex items-center gap-3">
                        <Navigation size={14} className="text-blue-400 animate-bounce" />
                        <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                            POS_LOCK: {userLocation.lat.toFixed(4)}N, {userLocation.lng.toFixed(4)}E
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CrisisMap;
