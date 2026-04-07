import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Shield, AlertCircle } from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

// Default center (New Delhi) - Ensure these are strict Numbers
const RESPONDER_HQ = { lat: 28.6139, lng: 77.2090 };

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

function CrisisMap({ incidents: externalIncidents, onMarkerClick, activeFilter }) {
    const navigate = useNavigate();
    const [internalIncidents, setInternalIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);

    const incidents = externalIncidents || internalIncidents;
    const activeIncident = externalIncidents ? (incidents.find(i => i.id === selectedIncident?.id) || selectedIncident) : selectedIncident;

    // Config from Environment
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.REACT_APP_GOOGLE_MAPS_ID || 'DEMO_MAP_ID';

    useEffect(() => {
        if (externalIncidents) return; // Use props if provided

        let isMounted = true;
        let socketInstance = null;

        // Initial Data Fetch
        api.get('/incidents').then((res) => {
            if (isMounted) setInternalIncidents(res.data);
        }).catch(err => console.error('[Map] Data fetch failed:', err));

        // Real-time Updates
        const handleCreated = (payload) => {
            if (isMounted) {
                setInternalIncidents((prev) => {
                    const exists = prev.some(inc => inc.id === payload.incident.id);
                    if (exists) return prev;
                    return [payload.incident, ...prev];
                });
            }
        };
        const handleStatusUpdated = (payload) => {
            if (isMounted) {
                setInternalIncidents((prev) => prev.map((i) => (i.id === payload.incident.id ? payload.incident : i)));
            }
        };

        const initSocket = async() => {
            try {
                socketInstance = await getSocket();
                if (!isMounted || !socketInstance) return;
                socketInstance.on('incident.created', handleCreated);
                socketInstance.on('incident.status-updated', handleStatusUpdated);
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
            }
        };
    }, [externalIncidents]);

    // Filter incidents based on activeFilter if provided
    const filteredIncidents = useMemo(() => {
        if (!activeFilter || activeFilter === 'ALL') return incidents;
        if (activeFilter === 'SENSORS') return incidents.filter(i => i.triageMethod?.includes('IoT') || i.category === 'INFRASTRUCTURE');
        if (activeFilter === 'REPORTS') return incidents.filter(i => !i.triageMethod?.includes('IoT'));
        return incidents;
    }, [incidents, activeFilter]);

    // Memoize markers for performance
    const markers = useMemo(() => filteredIncidents.map((inc) => {
        const lat = parseFloat(inc.location?.coordinates[1] || inc.lat);
        const lng = parseFloat(inc.location?.coordinates[0] || inc.lng);

        if (isNaN(lat) || isNaN(lng)) return null;

        const isCritical = inc.severity >= 4;
        const isSelected = selectedIncident?.id === inc.id;

        return (
            <AdvancedMarker 
                key={inc.id}
                position={{ lat, lng }}
                onClick={() => {
                    setSelectedIncident(inc);
                    if (onMarkerClick) onMarkerClick(inc);
                }}
            >
                <div className={`group transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}`}>
                    <Pin 
                        background={isCritical ? '#ff3366' : '#00f0ff'}
                        glyphColor={'#ffffff'}
                        borderColor={isSelected ? '#ffffff' : (isCritical ? '#991b1b' : '#0891b2')}
                    />
                </div>
            </AdvancedMarker>
        );
    }), [filteredIncidents, selectedIncident, onMarkerClick]);

    if (!apiKey) {
        return (
            <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-[#0B0F19] p-12 text-center border border-slate-800 rounded-none">
                <AlertCircle size={48} className="text-red-600 mb-6" />
                <h2 className="text-2xl font-black text-slate-100 uppercase mb-4">Map Key Missing</h2>
                <p className="text-slate-400 max-w-md font-mono text-xs uppercase tracking-widest">
                    Define REACT_APP_GOOGLE_MAPS_API_KEY in your .env.local file to initialize the tactical overlay.
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full min-h-[600px] flex-1 overflow-hidden rounded-none border border-slate-800 bg-[#0B0F19]">
            <APIProvider apiKey={apiKey}>
                {/* 🚨 CRITICAL: Explicit dimensions on the container and mapId for AdvancedMarkers */}
                <Map 
                    defaultCenter={RESPONDER_HQ}
                    defaultZoom={14}
                    mapId={mapId}
                    disableDefaultUI={true}
                    gestureHandling="greedy"
                    styles={MAP_STYLES}
                    className="w-full h-full min-h-[600px] rounded-none"
                >
                    {/* HQ Marker */}
                    <AdvancedMarker position={RESPONDER_HQ}>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-none animate-pulse"></div>
                            <div className="w-8 h-8 bg-[#0B0F19] border-2 border-cyan-500 flex items-center justify-center shadow-neon-cyan z-10">
                                <Shield size={14} className="text-cyan-400" />
                            </div>
                        </div>
                    </AdvancedMarker>

                    {markers}

                    {activeIncident && (
                        <InfoWindow 
                            position={{
                                lat: parseFloat(activeIncident.location?.coordinates[1] || activeIncident.lat),
                                lng: parseFloat(activeIncident.location?.coordinates[0] || activeIncident.lng)
                            }}
                            onCloseClick={() => setSelectedIncident(null)}
                        >
                            <div className="p-3 max-w-[200px] bg-[#151B2B] border border-slate-700 text-slate-100 font-mono">
                                <Badge 
                                    variant={activeIncident.severity >= 4 ? 'danger' : 'amber'}
                                    className="mb-2 text-[8px]"
                                >
                                    LVL {activeIncident.severity}
                                </Badge>
                                <h4 className="font-black text-xs uppercase mb-1 leading-tight text-white italic">{activeIncident.title}</h4>
                                <p className="text-[9px] mb-3 line-clamp-2 text-slate-400 uppercase tracking-tight">{activeIncident.description}</p>
                                <Button 
                                    className="w-full py-2 text-[9px] font-black uppercase bg-cyan-600 text-black border-cyan-400"
                                    onClick={() => navigate(`/incidents/${activeIncident.id}`)}
                                >
                                    Review_Intel
                                </Button>
                            </div>
                        </InfoWindow>
                    )}
                </Map>
            </APIProvider>

            {/* Tactical Overlays */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <Card 
                    className="flex items-center px-5 py-3 gap-4 border border-slate-700 bg-[#0B0F19]/90 shadow-tactical rounded-none"
                >
                    <Shield size={18} className="text-red-600" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Live_Grid</span>
                        <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
                            {incidents.length} SIGNAL_NODES
                        </span>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default CrisisMap;
