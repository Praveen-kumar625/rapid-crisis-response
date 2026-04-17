import React, { useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
    Shield, Wifi, WifiOff, User, 
    AlertTriangle, Zap, Activity, 
    ChevronUp, ChevronDown, Navigation2,
    Check, X, Crosshair
} from 'lucide-react';
import { TacticalProvider, useTactical } from '../context/TacticalContext';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

// --- SUB-COMPONENTS ---

const HUDBar = () => {
    const { state } = useTactical();
    const { commsStatus, userLocation } = state;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
            <div className="glass-pill px-4 py-3 flex items-center justify-between">
                {/* Left: Status */}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${commsStatus ? 'bg-emerald animate-pulse shadow-neon-emerald' : 'bg-danger shadow-neon-red'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${commsStatus ? 'text-emerald' : 'text-danger'}`}>
                        {commsStatus ? 'System Active' : 'Link Severed'}
                    </span>
                </div>

                {/* Center: Coordinates */}
                <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Z-Axis_Telemetry</span>
                    <span className="text-[10px] font-mono font-bold text-white tracking-tighter">
                        {userLocation.lat.toFixed(4)}°N / {userLocation.lng.toFixed(4)}°E / LVL_{userLocation.floor}
                    </span>
                </div>

                {/* Right: Profile */}
                <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                        <User size={16} className="text-slate-400" />
                    </div>
                    {state.incidents.some(i => i.severity >= 4) && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-danger border-2 border-slate-950 rounded-full animate-bounce" />
                    )}
                </div>
            </div>
        </div>
    );
};

const TacticalMapLayer = () => {
    const { state } = useTactical();
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.REACT_APP_GOOGLE_MAPS_ID || 'tactical_grid_id';

    const mapStyles = [
        { "elementType": "geometry", "stylers": [{ "color": "#0B0C10" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#45A29E" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#020617" }] }
    ];

    if (!apiKey) return <div className="absolute inset-0 bg-[#0B0C10] flex items-center justify-center text-danger font-mono text-xs uppercase">Telemetry Offline: API Key Missing</div>;

    return (
        <div className="absolute inset-0 z-0">
            <APIProvider apiKey={apiKey}>
                <Map
                    defaultCenter={state.userLocation}
                    defaultZoom={16}
                    mapId={mapId}
                    disableDefaultUI={true}
                    styles={mapStyles}
                    className="w-full h-full"
                >
                    {state.incidents.map(inc => (
                        <AdvancedMarker 
                            key={inc.id}
                            position={{ lat: inc.lat || 28.6139, lng: inc.lng || 77.2090 }}
                        >
                            <div className="relative flex items-center justify-center">
                                <div className={`absolute inset-0 rounded-full animate-ping scale-[2] ${inc.severity >= 4 ? 'bg-danger/20' : 'bg-cyan-500/20'}`}></div>
                                <div className={`w-6 h-6 flex items-center justify-center border border-white/20 shadow-2xl ${inc.severity >= 4 ? 'bg-danger' : 'bg-cyan-500'}`}>
                                    <Shield size={12} className="text-white" />
                                </div>
                            </div>
                        </AdvancedMarker>
                    ))}
                </Map>
            </APIProvider>
            {/* Map Overlay Gradients */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60" />
        </div>
    );
};

const BottomSheet = () => {
    const { state, dispatch } = useTactical();
    const constraintsRef = useRef(null);
    
    const snapPoints = {
        COLLAPSED: '85%',
        HALF: '50%',
        FULL: '10%'
    };

    const currentY = snapPoints[state.bottomSheetState];

    const handleDragEnd = (event, info) => {
        const { offset, velocity } = info;
        if (offset.y < -100 || velocity.y < -500) {
            dispatch({ type: 'SET_BOTTOM_SHEET', payload: state.bottomSheetState === 'COLLAPSED' ? 'HALF' : 'FULL' });
        } else if (offset.y > 100 || velocity.y > 500) {
            dispatch({ type: 'SET_BOTTOM_SHEET', payload: state.bottomSheetState === 'FULL' ? 'HALF' : 'COLLAPSED' });
        }
    };

    return (
        <motion.div
            initial={false}
            animate={{ top: currentY }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-40 glass-tactical rounded-t-[32px] border-t border-white/20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
            {/* Drag Handle */}
            <div className="w-full py-3 flex justify-center cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="h-full overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                    {state.bottomSheetState === 'COLLAPSED' && (
                        <motion.div 
                            key="collapsed"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="px-6 flex items-center justify-between h-16"
                        >
                            {/* Ticker Tape */}
                            <div className="flex-1 overflow-hidden mr-4">
                                <div className="marquee-content">
                                    {state.intelFeed.length > 0 ? state.intelFeed.map((text, i) => (
                                        <span key={i} className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mr-12 flex items-center gap-2">
                                            <Zap size={10} className="text-cyan-400" /> {text}
                                        </span>
                                    )) : (
                                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Scanning_Frequencies... Terminal_Idle... No_Active_Breaches...</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* SOS Button */}
                            <button className="shrink-0 w-12 h-12 rounded-full bg-danger shadow-neon-red flex items-center justify-center active:scale-90 transition-transform">
                                <AlertTriangle size={24} className="text-white" />
                            </button>
                        </motion.div>
                    )}

                    {state.bottomSheetState === 'HALF' && (
                        <motion.div 
                            key="half"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="px-6 py-4 flex-1"
                        >
                            <h3 className="text-xs font-black text-slate-500 tracking-[0.3em] mb-6">Tactical_Dashboard</h3>
                            
                            {/* Micro-Analytics */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="glass-panel p-4 rounded-2xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[8px] font-black text-slate-500 uppercase">Res_Efficiency</span>
                                        <Activity size={12} className="text-emerald" />
                                    </div>
                                    <div className="h-8 w-full flex items-end gap-1">
                                        {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                            <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-emerald/20 border-t border-emerald/50" />
                                        ))}
                                    </div>
                                    <div className="mt-2 text-lg font-black text-white tabular-nums">94.2%</div>
                                </div>
                                <div className="glass-panel p-4 rounded-2xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[8px] font-black text-slate-500 uppercase">Net_Stability</span>
                                        <Zap size={12} className="text-cyan-400" />
                                    </div>
                                    <div className="h-8 w-full flex items-end gap-1">
                                        {[80, 85, 82, 88, 90, 86, 92].map((h, i) => (
                                            <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-cyan-500/20 border-t border-cyan-500/50" />
                                        ))}
                                    </div>
                                    <div className="mt-2 text-lg font-black text-white tabular-nums">14ms</div>
                                </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex gap-3">
                                <div className="flex-1 glass-panel p-3 border-l-4 border-l-danger flex flex-col">
                                    <span className="text-[8px] font-black text-slate-500 uppercase">Critical</span>
                                    <span className="text-xl font-black text-white">{state.incidents.filter(i => i.severity >= 4).length}</span>
                                </div>
                                <div className="flex-1 glass-panel p-3 border-l-4 border-l-warning flex flex-col">
                                    <span className="text-[8px] font-black text-slate-500 uppercase">Warning</span>
                                    <span className="text-xl font-black text-white">{state.incidents.filter(i => i.severity === 3).length}</span>
                                </div>
                                <div className="flex-1 glass-panel p-3 border-l-4 border-l-emerald flex flex-col">
                                    <span className="text-[8px] font-black text-slate-500 uppercase">Secure</span>
                                    <span className="text-xl font-black text-white">{state.incidents.filter(i => i.severity < 3).length}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {state.bottomSheetState === 'FULL' && (
                        <motion.div 
                            key="full"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col px-6 py-4 overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-slate-500 tracking-[0.3em]">Deep_Intelligence</h3>
                                <button onClick={() => dispatch({ type: 'SET_BOTTOM_SHEET', payload: 'HALF' })} className="p-2 text-slate-500 hover:text-white">
                                    <ChevronDown size={20} />
                                </button>
                            </div>

                            {/* Incident List */}
                            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-24">
                                {state.incidents.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center opacity-30">
                                        <Shield size={48} className="text-slate-600 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sector_Secure</p>
                                    </div>
                                ) : state.incidents.map(inc => (
                                    <SwipeableIncidentCard key={inc.id} incident={inc} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const SwipeableIncidentCard = ({ incident }) => {
    const { dispatch } = useTactical();
    const cardX = useMemo(() => Math.random() * 100, []); // Dummy distance

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: -100, right: 100 }}
            dragSnapToOrigin={true}
            onDragEnd={(e, info) => {
                if (info.offset.x > 80) console.log('Dispatching for', incident.id);
                if (info.offset.x < -80) console.log('Dismissing', incident.id);
            }}
            className="relative"
        >
            {/* Background Actions */}
            <div className="absolute inset-0 flex items-center justify-between px-6 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 text-emerald font-black text-[10px] uppercase">
                    <Check size={16} /> Dispatch
                </div>
                <div className="flex items-center gap-2 text-danger font-black text-[10px] uppercase">
                    Dismiss <X size={16} />
                </div>
            </div>

            {/* Foreground Card */}
            <motion.div className="relative glass-panel p-4 rounded-2xl flex flex-col gap-3 group">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">UNIT_{incident.id.substring(0,8)}</span>
                        <h4 className="text-sm font-black text-white uppercase">{incident.title}</h4>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black ${incident.severity >= 4 ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-warning/20 text-warning border border-warning/30'}`}>
                        SEV_0{incident.severity}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-600 uppercase mb-1">Prox_Distance</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-cyan-400 tabular-nums">{cardX.toFixed(1)}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Meters</span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                        <span className="text-[7px] font-black text-slate-600 uppercase mb-1">AI_Escalation_Prob</span>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${incident.severity * 20}%` }}
                                className={`h-full ${incident.severity >= 4 ? 'bg-danger' : 'bg-warning'}`}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const TacticalMobileHUDContent = () => {
    return (
        <div className="fixed inset-0 w-full h-full bg-[#0B0C10] overflow-hidden select-none touch-none">
            <div className="scanline-overlay opacity-30" />
            
            <HUDBar />
            
            <TacticalMapLayer />
            
            <BottomSheet />

            {/* Global Telemetry Watermark */}
            <div className="fixed bottom-24 right-6 pointer-events-none opacity-20">
                <p className="text-[8px] font-mono text-slate-500 text-right leading-relaxed">
                    RCR_NODE_MOBILE_V4.2<br/>
                    SIG_STRENGTH: 98%<br/>
                    ENCRYPTION: AES-256-GCM
                </p>
            </div>
        </div>
    );
};

const TacticalMobileHUD = () => (
    <TacticalProvider>
        <TacticalMobileHUDContent />
    </TacticalProvider>
);

export default TacticalMobileHUD;
