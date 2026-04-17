import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { AlertCircle, Crosshair, Zap } from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import toast from 'react-hot-toast';
import { cacheExternalData, getCachedExternalData } from '../idb';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const MAP_STYLES = [
    { "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#4B5563" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#020617" }] },
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#1F2937" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#4B5563" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#111827" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1F2937" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#1F2937" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#001B2E" }] }
];

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
            className="p-4 glass-tactical border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all shadow-neon-cyan pointer-events-auto active:scale-95"
            title="Lock onto current coordinates"
        >
            <Crosshair size={22} strokeWidth={2.5} />
        </button>
    );
};

function CrisisMap({ incidents: externalIncidents, onMarkerClick, activeFilter }) {
    const [internalIncidents, setInternalIncidents] = useState([]);
    const [responders, setResponders] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [earthquakes, setEarthquakes] = useState([]);
    const [feedStatus, setFeedStatus] = useState({ usgs: 'loading' });

    const incidents = externalIncidents || internalIncidents;
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.REACT_APP_GOOGLE_MAPS_ID || 'tactical_grid_id';

    const fetchEarthquakes = useCallback(async () => {
        try {
            const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
            if (!response.ok) throw new Error('USGS Feed Error');
            const data = await response.json();
            setEarthquakes(data.features || []);
            await cacheExternalData('usgs_earthquakes', data.features);
            setFeedStatus(prev => ({ ...prev, usgs: 'active' }));
        } catch (err) {
            console.error('[ThreatIntel] USGS Fetch Failed, loading from cache:', err);
            const cached = await getCachedExternalData('usgs_earthquakes');
            if (cached) {
                setEarthquakes(cached);
                setFeedStatus(prev => ({ ...prev, usgs: 'cached' }));
            } else {
                setFeedStatus(prev => ({ ...prev, usgs: 'unavailable' }));
            }
        }
    }, []);

    useEffect(() => {
        fetchEarthquakes();
        const interval = setInterval(fetchEarthquakes, 60000);
        return () => clearInterval(interval);
    }, [fetchEarthquakes]);

    useEffect(() => {
        let isMounted = true;
        let socketInstance = null;

        api.get('/incidents').then((res) => {
            if (isMounted && !externalIncidents) setInternalIncidents(res.data);
        }).catch(err => console.error('[Map] Data fetch failed:', err));

        const handleCreated = (payload) => {
            try {
                if (!payload || !payload.incident) return;
                if (isMounted && !externalIncidents) {
                    setInternalIncidents((prev) => {
                        if (prev.some(inc => inc.id === payload.incident.id)) return prev;
                        toast.success(`NEW ALERT: ${payload.incident.title}`, { icon: '🚨' });
                        return [payload.incident, ...prev];
                    });
                }
            } catch (err) {
                console.error('[Map] incident.created failed', err);
            }
        };

        const handlePresenceUpdate = (payload) => {
            try {
                if (!payload || !payload.responder) return;
                if (isMounted) {
                    setResponders(prev => {
                        const filtered = prev.filter(r => r.id !== payload.responder.id);
                        return [...filtered, payload.responder];
                    });
                }
            } catch (err) {
                console.error('[Map] responder.presence-update failed', err);
            }
        };

        const initSocket = async() => {
            try {
                socketInstance = await getSocket();
                if (!isMounted || !socketInstance) return;
                socketInstance.on('incident.created', handleCreated);
                socketInstance.on('responder.presence-update', handlePresenceUpdate);
            } catch (err) {
                console.error('[Map] Socket failed:', err);
            }
        };

        initSocket();

        return () => {
            isMounted = false;
            if (socketInstance) {
                socketInstance.off('incident.created', handleCreated);
                socketInstance.off('responder.presence-update', handlePresenceUpdate);
            }
        };
    }, [externalIncidents]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, []);

    const filteredIncidents = useMemo(() => {
        if (!activeFilter || activeFilter === 'ALL') return incidents;
        return incidents.filter(i => activeFilter === 'SENSORS' ? i.triageMethod?.includes('IoT') : !i.triageMethod?.includes('IoT'));
    }, [incidents, activeFilter]);

    if (!apiKey) {
        return (
            <div className="w-full h-full min-h-0 flex flex-col items-center justify-center bg-[#020617] p-12 text-center border border-white/5">
                <AlertCircle size={48} className="text-danger mb-6 animate-pulse" />
                <h2 className="text-2xl font-black text-slate-100 uppercase mb-4 tracking-tighter">Tactical Link Severed</h2>
                <p className="text-slate-500 max-w-md font-mono text-xs uppercase tracking-widest leading-loose">
                    Define REACT_APP_GOOGLE_MAPS_API_KEY in your environment to initialize grid telemetry.
                </p>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#020617] touch-auto">
            <APIProvider apiKey={apiKey}>
                <Map 
                    defaultCenter={DEFAULT_CENTER}
                    defaultZoom={15}
                    mapId={mapId}
                    disableDefaultUI={true}
                    gestureHandling="greedy"
                    styles={MAP_STYLES}
                    className="w-full h-full min-h-0"
                >
                    {filteredIncidents.map(inc => {
                        const coords = inc.location?.coordinates || [inc.lng, inc.lat];
                        if (!coords || isNaN(coords[1])) return null;
                        return (
                            <AdvancedMarker 
                                key={inc.id}
                                position={{ lat: coords[1], lng: coords[0] }}
                                onClick={() => onMarkerClick?.(inc)}
                            >
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping scale-[2]"></div>
                                    <div className={`w-8 h-8 flex items-center justify-center border-2 shadow-neon-cyan ${inc.severity >= 4 ? 'bg-danger border-white' : 'bg-cyan-500 border-[#020617]'}`}>
                                        <span className="text-white font-black text-[10px]">{inc.severity}</span>
                                    </div>
                                </div>
                            </AdvancedMarker>
                        );
                    })}

                    {responders.filter(r => r.status !== 'OFF_DUTY').map(r => (
                        <AdvancedMarker 
                            key={r.id}
                            position={{ lat: r.lat || DEFAULT_CENTER.lat, lng: r.lng || DEFAULT_CENTER.lng }}
                        >
                            <div className="w-10 h-10 border-2 flex items-center justify-center bg-slate-900 border-emerald shadow-neon-emerald">
                                <div className="text-[8px] font-black text-white uppercase">{r.name.substring(0,2)}</div>
                            </div>
                        </AdvancedMarker>
                    ))}

                    {earthquakes.map(quake => (
                        <AdvancedMarker 
                            key={quake.id}
                            position={{ 
                                lat: quake.geometry.coordinates[1], 
                                lng: quake.geometry.coordinates[0] 
                            }}
                        >
                            <div className="relative flex items-center justify-center group">
                                <div className="absolute inset-0 bg-orange-500/40 rounded-full animate-ping scale-[3]"></div>
                                <div className="w-6 h-6 flex items-center justify-center border-2 bg-orange-600 border-white shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                                    <span className="text-white font-black text-[8px]">{quake.properties.mag.toFixed(1)}</span>
                                </div>
                            </div>
                        </AdvancedMarker>
                    ))}

                    <div className="absolute bottom-10 right-8 z-30">
                        <MapControl userLocation={userLocation} />
                    </div>
                </Map>
            </APIProvider>

            <div className="absolute top-6 left-6 z-20 pointer-events-none">
                <Card className="glass-tactical p-5 border-white/10 shadow-2xl flex flex-col gap-4 min-w-[220px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30">
                                <Zap size={18} className="text-cyan-400 animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Spatial_Grid</span>
                                <span className="text-xs font-black text-white uppercase tracking-tighter">Operational_v4.2</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-px bg-white/5 w-full" />
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">External_Threats</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black tabular-nums ${earthquakes.length > 0 ? 'text-orange-500' : 'text-slate-600'}`}>{earthquakes.length}</span>
                                <Badge variant="neutral" className={`text-[7px] border-none ${feedStatus.usgs === 'active' ? 'bg-emerald/20 text-emerald' : 'bg-danger/20 text-danger animate-pulse'}`}>
                                    {feedStatus.usgs.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Internal_Nodes</span>
                            <span className="text-xl font-black text-cyan-400 tabular-nums leading-none tracking-tighter">{incidents.length}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default CrisisMap;
