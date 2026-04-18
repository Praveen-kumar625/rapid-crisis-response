import React, { useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Shield, Plus } from 'lucide-react';
import { Card } from './ui/Card';

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

export const TacticalMap = ({ 
    incidents, 
    selectedIncident, 
    onSelectIncident, 
    filter, 
    setFilter,
    onCreateIncident,
    onSwitchView
}) => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.REACT_APP_GOOGLE_MAPS_ID || 'DEMO_MAP_ID';

    const markers = useMemo(() => incidents.map((inc) => {
        const lat = parseFloat(inc.location?.coordinates[1] || inc.lat);
        const lng = parseFloat(inc.location?.coordinates[0] || inc.lng);
        if (isNaN(lat) || isNaN(lng)) return null;

        const isSelected = selectedIncident?.id === inc.id;
        const isCritical = inc.severity >= 4;

        return (
            <AdvancedMarker 
                key={inc.id}
                position={{ lat, lng }}
                onClick={() => onSelectIncident(inc)}
            >
                <div className={`relative transition-all duration-500 ${isSelected ? 'scale-150 z-50' : 'hover:scale-110'}`}>
                    {isSelected && (
                        <div className="absolute inset-0 bg-electric/20 rounded-full animate-ping scale-150"></div>
                    )}
                    <Pin 
                        background={isCritical ? '#ff3366' : '#00f0ff'} 
                        glyphColor={'#ffffff'} 
                        borderColor={isSelected ? '#ffffff' : (isCritical ? '#991b1b' : '#0891b2')}
                    />
                </div>
            </AdvancedMarker>
        );
    }), [incidents, selectedIncident, onSelectIncident]);

    return (
        <section className="flex-1 h-full w-full max-w-[100vw] overflow-x-hidden relative bg-navy-950 border-r border-white/10 touch-auto">
            <APIProvider apiKey={apiKey}>
                <Map
                    defaultCenter={RESPONDER_HQ}
                    defaultZoom={14}
                    mapId={mapId}
                    disableDefaultUI={true}
                    styles={MAP_STYLES}
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
                </Map>
            </APIProvider>

            {/* TOP PILL: DATA SOURCE SELECTOR */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                <div className="flex bg-navy-950/80 backdrop-blur-xl border border-white/10 p-1 rounded-full shadow-2xl">
                    {['ALL_FEEDS', 'IOT_SENSORS', 'CITIZEN_REPORTS'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
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
                    <div className="flex-1 flex items-center gap-4 px-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tactical Status</span>
                            <span className="text-[10px] font-mono font-bold text-emerald">SYSTEM_OPERATIONAL</span>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Alerts</span>
                            <span className="text-[10px] font-mono font-bold text-danger">{incidents.filter(i => i.severity >= 4).length} CRITICAL</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={onSwitchView}
                            className="bg-cyan-900/50 border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-navy-950 transition-all"
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
