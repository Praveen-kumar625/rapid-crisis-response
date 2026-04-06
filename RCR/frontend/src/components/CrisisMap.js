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

function CrisisMap() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    
    // Config from Environment
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.REACT_APP_GOOGLE_MAPS_ID || 'DEMO_MAP_ID';

    useEffect(() => {
        let isMounted = true;
        let socketInstance = null;

        // Initial Data Fetch
        api.get('/incidents').then((res) => {
            if (isMounted) setIncidents(res.data);
        }).catch(err => console.error('[Map] Data fetch failed:', err));

        // Real-time Updates
        // FIXED: Deduplication logic - don't add if already exists
        const handleCreated = (payload) => {
            if (isMounted) {
                setIncidents((prev) => {
                    const exists = prev.some(inc => inc.id === payload.incident.id);
                    if (exists) return prev;
                    return [payload.incident, ...prev];
                });
            }
        };
        const handleStatusUpdated = (payload) => {
            if (isMounted) {
                setIncidents((prev) => prev.map((i) => (i.id === payload.incident.id ? payload.incident : i)));
            }
        };

        // FIXED: Async cleanup pattern
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
    }, []);

    // Memoize markers for performance and to prevent re-renders
    const markers = useMemo(() => incidents.map((inc) => {
        // FIXED: STRICT TYPE CONVERSION - Ensure absolute Numbers for Maps API
        const lat = parseFloat(inc.location?.coordinates[1] || inc.lat);
        const lng = parseFloat(inc.location?.coordinates[0] || inc.lng);

        if (isNaN(lat) || isNaN(lng)) return null;

        const isCritical = inc.severity >= 4;

        return (
            <AdvancedMarker 
                key={inc.id}
                position={{ lat, lng }}
                onClick={() => setSelectedIncident(inc)}
            >
                <div className="group transition-transform hover:scale-110">
                    <Pin 
                        background={isCritical ? '#ff3366' : '#00f0ff'} 
                        glyphColor={'#ffffff'} 
                        borderColor={isCritical ? '#991b1b' : '#0891b2'}
                    />
                </div>
            </AdvancedMarker>
        );
    }), [incidents]);

    if (!apiKey) {
        return (
            <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-navy-950 p-12 text-center border border-white/5 rounded-3xl">
                <AlertCircle size={48} className="text-danger mb-6" />
                <h2 className="text-2xl font-black text-white uppercase mb-4">Map Key Missing</h2>
                <p className="text-slate-400 max-w-md font-mono text-xs uppercase tracking-widest">
                    Define REACT_APP_GOOGLE_MAPS_API_KEY in your .env.local file to initialize the tactical overlay.
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full min-h-[600px] flex-1 overflow-hidden rounded-3xl">
            <APIProvider apiKey={apiKey}>
                {/* 🚨 CRITICAL: Explicit dimensions on the container and mapId for AdvancedMarkers */}
                <Map
                    defaultCenter={RESPONDER_HQ}
                    defaultZoom={14}
                    mapId={mapId}
                    disableDefaultUI={true}
                    gestureHandling="greedy"
                    className="w-full h-full min-h-[600px] rounded-3xl"
                >
                    {/* HQ Marker */}
                    <AdvancedMarker position={RESPONDER_HQ}>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-12 h-12 bg-secondary/20 rounded-full animate-ping"></div>
                            <div className="w-8 h-8 bg-navy-950 rounded-full border-2 border-secondary flex items-center justify-center shadow-lg z-10">
                                <Shield size={14} className="text-secondary" />
                            </div>
                        </div>
                    </AdvancedMarker>

                    {markers}

                    {selectedIncident && (
                        <InfoWindow
                            position={{ 
                                lat: parseFloat(selectedIncident.location?.coordinates[1] || selectedIncident.lat), 
                                lng: parseFloat(selectedIncident.location?.coordinates[0] || selectedIncident.lng) 
                            }}
                            onCloseClick={() => setSelectedIncident(null)}
                        >
                            <div className="p-3 max-w-[200px] text-navy-950">
                                <Badge variant={selectedIncident.severity >= 4 ? 'danger' : 'accent'} className="mb-2 text-[8px]">
                                    LVL {selectedIncident.severity}
                                </Badge>
                                <h4 className="font-black text-xs uppercase mb-1 leading-tight">{selectedIncident.title}</h4>
                                <p className="text-[10px] mb-3 line-clamp-2 text-slate-600">{selectedIncident.description}</p>
                                <Button 
                                    className="w-full py-2 text-[9px] font-black uppercase"
                                    onClick={() => navigate(`/incidents/${selectedIncident.id}`)}
                                >
                                    Review Intel
                                </Button>
                            </div>
                        </InfoWindow>
                    )}
                </Map>
            </APIProvider>

            {/* Tactical Overlays */}
            <div className="absolute top-6 left-6 z-10">
                <Card variant="panel" className="flex items-center px-5 py-3 gap-4 border border-white/10 shadow-2xl backdrop-blur-2xl">
                    <Shield size={18} className="text-danger" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Live Stream</span>
                        <span className="text-xs font-mono font-bold text-secondary">{incidents.length} SIGNAL_NODES</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default CrisisMap;
