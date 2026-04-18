import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Shield, Plus, AlertCircle, Crosshair } from 'lucide-react';
import { Card } from './ui/Card';
import { cacheExternalData, getCachedExternalData } from '../idb';

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
            className="p-3 bg-navy-950/80 backdrop-blur-xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-navy-950 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            title="Recenter Grid"
        >
            <Crosshair size={18} strokeWidth={2.5} />
        </button>
    );
};

export const TacticalMap = ({ 
    incidents = [], 
    selectedIncident, 
    onSelectIncident, 
    filter, 
    setFilter,
    onCreateIncident,
    onSwitchView,
    responders = []
}) => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.REACT_APP_GOOGLE_MAPS_ID || 'DEMO_MAP_ID';
    
    const [earthquakes, setEarthquakes] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);

    // 🚨 Desktop Fix: Ensure map adjusts when container dimensions change (e.g. sidebar collapse)
    useEffect(() => {
        if (!mapInstance) return;
        const observer = new ResizeObserver(() => {
            window.google?.maps?.event.trigger(mapInstance, 'resize');
        });
        const container = document.getElementById('tactical-map-container');
        if (container) observer.observe(container);
        return () => observer.disconnect();
    }, [mapInstance]);

    const fetchEarthquakes = useCallback(async () => {
        try {
            const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
            if (!response.ok) throw new Error('USGS Feed Error');
            const data = await response.json();
            setEarthquakes(data.features || []);
            await cacheExternalData('usgs_earthquakes', data.features);
        } catch (err) {
            const cached = await getCachedExternalData('usgs_earthquakes');
            if (cached) setEarthquakes(cached);
        }
    }, []);

    useEffect(() => {
        fetchEarthquakes();
        const interval = setInterval(fetchEarthquakes, 60000);
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
        
        return () => clearInterval(interval);
    }, [fetchEarthquakes]);

    const markers = useMemo(() => incidents.map((inc) => {
        const lat = parseFloat(inc.location?.coordinates[1] || inc.lat);
        const lng = parseFloat(inc.location?.coordinates[0] || inc.lng);
        if (isNaN(lat) || isNaN(lng)) return null;

        const isSelected = selectedIncident?.id === inc.id;
        const isCritical = inc.severity >= 4;
        const isAiVerified = inc.isAiVerified;

        return (
            <AdvancedMarker 
                key={inc.id}
                position={{ lat, lng }}
                onClick={() => onSelectIncident?.(inc)}
            >
                <div className={`relative transition-all duration-500 ${isSelected ? 'scale-150 z-50' : 'hover:scale-110'}`}>
                    {isSelected && (
                        <div className="absolute inset-0 bg-electric/20 rounded-full animate-ping scale-150"></div>
                    )}
                    {isAiVerified && !isSelected && (
                        <div className="absolute inset-[-4px] border border-emerald/50 rounded-full animate-pulse"></div>
                    )}
                    <Pin 
                        background={isCritical ? '#ff3366' : (isAiVerified ? '#10b981' : '#00f0ff')} 
                        glyphColor={'#ffffff'} 
                        borderColor={isSelected ? '#ffffff' : (isCritical ? '#991b1b' : (isAiVerified ? '#065f46' : '#0891b2'))}
                    />
                </div>
            </AdvancedMarker>
        );
    }), [incidents, selectedIncident, onSelectIncident]);

    if (!apiKey) {
        return (
            <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-navy-950 p-12 text-center border border-white/5">
                <AlertCircle size={48} className="text-danger mb-6 animate-pulse" />
                <h2 className="text-2xl font-black text-slate-100 uppercase mb-4 tracking-tighter font-mono">Tactical Link Severed</h2>
                <p className="text-slate-500 max-w-md font-mono text-xs uppercase tracking-widest leading-loose">
                    Define REACT_APP_GOOGLE_MAPS_API_KEY to initialize grid telemetry.
                </p>
            </div>
        );
    }

    return (
        <section id="tactical-map-container" className="flex-1 h-full w-full overflow-hidden relative bg-navy-950 border-r border-white/10 touch-auto">
            <APIProvider apiKey={apiKey}>
                <Map
                    onLoad={(map) => setMapInstance(map)}
                    defaultCenter={RESPONDER_HQ}
                    defaultZoom={14}
                    mapId={mapId}
                    disableDefaultUI={true}
                    styles={MAP_STYLES}
                    gestureHandling="greedy"
                    className="w-full h-full"
                >
                    <AdvancedMarker position={RESPONDER_HQ}>
                        <div className="relative">
                            <div className="absolute inset-[-12px] bg-secondary/10 rounded-full animate-pulse border border-secondary/20"></div>
                            <div className="w-6 h-6 bg-navy-950 rounded-full border-2 border-secondary flex items-center justify-center shadow-[0_0_15px_rgba(13,148,136,0.4)]">
                                <Shield size={12} className="text-secondary" />
                            </div>
                        </div>
                    </AdvancedMarker>
                    
                    {markers}

                    {responders.filter(r => r.status !== 'OFF_DUTY').map(r => (
                        <AdvancedMarker 
                            key={r.id}
                            position={{ lat: r.lat || RESPONDER_HQ.lat, lng: r.lng || RESPONDER_HQ.lng }}
                        >
                            <div className="w-8 h-8 border-2 flex items-center justify-center bg-navy-950 border-emerald shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                                <div className="text-[7px] font-black text-white uppercase">{r.name?.substring(0,2)}</div>
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
                                <div className="absolute inset-0 bg-orange-500/40 rounded-full animate-ping scale-[2]"></div>
                                <div className="w-5 h-5 flex items-center justify-center border-2 bg-orange-600 border-white shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                                    <span className="text-white font-black text-[7px]">{quake.properties.mag.toFixed(1)}</span>
                                </div>
                            </div>
                        </AdvancedMarker>
                    ))}

                    <div className="absolute bottom-24 right-6 z-30">
                        <MapControl userLocation={userLocation} />
                    </div>
                </Map>
            </APIProvider>

            {/* TOP PILL: DATA SOURCE SELECTOR */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-auto px-4">
                <div className="flex bg-navy-950/80 backdrop-blur-xl border border-white/10 p-1 rounded-full shadow-2xl">
                    {['ALL_FEEDS', 'IOT_SENSORS', 'CITIZEN_REPORTS'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter?.(f)}
                            className={`px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${
                                filter === f ? 'bg-electric text-navy-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {f.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* BOTTOM BAR: DISPATCH ACTION */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-6">
                <Card className="bg-navy-950/90 backdrop-blur-2xl border border-white/10 p-2 flex items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex-1 flex items-center gap-4 px-4 overflow-hidden">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">Tactical Status</span>
                            <span className="text-[10px] font-mono font-bold text-emerald truncate">SYSTEM_OPERATIONAL</span>
                        </div>
                        <div className="h-8 w-px bg-white/10 shrink-0"></div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">Active Alerts</span>
                            <span className="text-[10px] font-mono font-bold text-danger truncate">{incidents.filter(i => i.severity >= 4).length} CRITICAL</span>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={onSwitchView}
                            className="bg-cyan-900/50 border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-navy-950 transition-all hidden sm:block"
                        >
                            Indoor_Grid
                        </button>
                        <button 
                            onClick={onCreateIncident}
                            className="btn-tactical whitespace-nowrap"
                        >
                            <Plus size={14} strokeWidth={3} />
                            SOS
                        </button>
                    </div>
                </Card>
            </div>

            {/* MAP OVERLAY GRADIENTS FOR DEPTH */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-navy-950 to-transparent opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-950 to-transparent opacity-60 pointer-events-none"></div>
        </section>
    );
};

export default TacticalMap;
