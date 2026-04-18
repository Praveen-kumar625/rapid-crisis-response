import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldAlert, Cpu, 
    Zap, Thermometer, Wind, Eye, Target, Shield
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { getSocket } from '../socket';

/**
 * ULTRA LEVEL IndoorHeatmap Component
 * 3D Isometric Tactical Grid with Real-time IoT Spatial Intelligence
 */
const IndoorHeatmap = ({ incidents = [] }) => {
    const [activeFloor, setActiveFloor] = useState(1);
    const [liveIotData, setLiveIotData] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [hoveredRoom, setHoveredRoom] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    
    const floors = [5, 4, 3, 2, 1];

    // -----------------------------------------------------------------
    // REAL-TIME DATA SYNC
    // -----------------------------------------------------------------
    useEffect(() => {
        let socket;
        const setupSocket = async () => {
            socket = await getSocket();
            socket.on('NEW_IOT_ALERT', (event) => {
                try {
                    if (!event || !event.room_number) return;
                    setLiveIotData(prev => {
                        const filtered = prev.filter(e => e.room_number !== event.room_number);
                        return [event, ...filtered].slice(0, 15);
                    });
                } catch (err) {
                    console.error('[Socket] Dispatch failed for NEW_IOT_ALERT', err);
                }
            });
        };
        setupSocket();
        return () => { if (socket) socket.off('NEW_IOT_ALERT'); };
    }, []);

    // Merge static and live data
    const allAlerts = useMemo(() => {
        const iotAsIncidents = (Array.isArray(liveIotData) ? liveIotData : []).map(iot => ({
            id: iot.id,
            roomNumber: iot.room_number,
            floorLevel: iot.floor_level,
            category: iot.category,
            severity: iot.severity,
            sensorMetadata: iot.sensor_metadata,
            description: iot.description,
            isLive: true
        }));
        return [...(incidents || []), ...iotAsIncidents];
    }, [incidents, liveIotData]);

    const floorIncidents = useMemo(() => {
        return (allAlerts || []).filter(inc => inc.floorLevel === activeFloor);
    }, [allAlerts, activeFloor]);

    // Enhanced Room Layout with Metadata
    const rooms = useMemo(() => [
        { id: '01', x: 10, y: 15, w: 25, h: 20, label: 'PRIME_SUITE' },
        { id: '02', x: 40, y: 15, w: 20, h: 20, label: 'SERVER_RM' },
        { id: '03', x: 65, y: 15, w: 25, h: 20, label: 'UTILITY_A' },
        { id: '04', x: 10, y: 45, w: 20, h: 40, label: 'GUEST_ZONE_B' },
        { id: '05', x: 70, y: 45, w: 20, h: 40, label: 'GUEST_ZONE_C' },
        { id: '06', x: 35, y: 75, w: 30, h: 15, label: 'MAIN_LOBBY' },
    ], []);

    const exits = [
        { id: 'EXIT_A', x: 50, y: 5, label: 'EVAC_STAIRS_A' },
        { id: 'EXIT_B', x: 50, y: 95, label: 'EVAC_STAIRS_B' }
    ];

    // DYNAMIC PATHFINDING
    const calculateSafePath = useMemo(() => {
        const hazards = floorIncidents.filter(i => i.severity >= 4);
        const startPoint = { x: 35, y: 65 }; // Reference point
        
        // Determine safest exit based on weighted hazard distance
        const selectedExit = exits.reduce((best, exit) => {
            const hazardWeight = hazards.reduce((sum, h) => {
                const room = rooms.find(r => `${activeFloor}${r.id}` === h.roomNumber);
                if (!room) return sum;
                const d = Math.sqrt(Math.pow(exit.x - room.x, 2) + Math.pow(exit.y - room.y, 2));
                return sum + (100 / (d + 1)) * h.severity;
            }, 0);
            return hazardWeight < best.weight ? { exit, weight: hazardWeight } : best;
        }, { exit: exits[0], weight: Infinity }).exit;

        const hallwayX = 50;
        return `M ${startPoint.x} ${startPoint.y} L ${hallwayX} ${startPoint.y} L ${hallwayX} ${selectedExit.y} L ${selectedExit.x} ${selectedExit.y}`;
    }, [floorIncidents, activeFloor, rooms]);

    const getRoomStyle = (roomNumber) => {
        const incident = floorIncidents.find(i => i.roomNumber === roomNumber);
        if (!incident) return { fill: 'rgba(15, 23, 42, 0.2)', stroke: 'rgba(51, 65, 85, 0.5)' };
        
        if (incident.category === 'FIRE') return { fill: 'rgba(255, 51, 102, 0.4)', stroke: '#FF3366' };
        if (incident.category === 'SMOKE') return { fill: 'rgba(148, 163, 184, 0.4)', stroke: '#94a3b8' };
        return { fill: 'rgba(245, 158, 11, 0.3)', stroke: '#F59E0B' };
    };

    return (
        <div className="relative flex flex-col w-full max-w-[100vw] h-full bg-[#020617] bg-grid-pattern border border-white/5 font-mono overflow-hidden overflow-x-hidden select-none">
            <div className="scanline-overlay opacity-50"></div>
            
            {/* TACTICAL HEADER */}
            <div className="flex items-center justify-between p-5 bg-slate-950/40 backdrop-blur-xl border-b border-white/10 z-20">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30">
                        <Cpu size={22} className="text-cyan-400 animate-pulse text-glow-cyan" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.25em] text-white italic text-glow-cyan">
                            Spatial_Neural_Grid <span className="text-cyan-500">::</span> LVL_0{activeFloor}
                        </h3>
                        <div className="flex items-center gap-2.5 mt-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-ping" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Quantum_Link_Synchronized</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="hidden lg:flex gap-6 border-r border-white/10 pr-8">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Active_Nodes</span>
                            <span className="text-sm font-black text-cyan-400 tabular-nums">{rooms.length}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Hazard_Index</span>
                            <span className={`text-sm font-black tabular-nums ${floorIncidents.length > 0 ? 'text-danger text-glow-red' : 'text-emerald'}`}>
                                {floorIncidents.length}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsScanning(!isScanning)}
                        className={`p-2.5 transition-all active:scale-90 ${isScanning ? 'text-cyan-400 text-glow-cyan' : 'text-slate-600'}`}
                    >
                        <Eye size={20} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 relative">
                {/* Z-AXIS CONTROLLER */}
                <div className="w-24 border-r border-white/10 flex flex-col items-center py-8 gap-6 bg-slate-950/40 backdrop-blur-xl z-10">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] vertical-text mb-2">Elevation</span>
                    {(floors || []).map(f => (
                        <div key={f} className="relative group w-full px-4">
                            <button
                                onClick={() => setActiveFloor(f)}
                                className={`w-full h-12 flex flex-col items-center justify-center transition-all duration-500 relative ${
                                    activeFloor === f 
                                    ? 'text-cyan-400 scale-110' 
                                    : 'text-slate-600 hover:text-slate-400'
                                }`}
                            >
                                <span className={`text-[11px] font-black tracking-tighter ${activeFloor === f ? 'text-glow-cyan' : ''}`}>L_{f}</span>
                                <div className={`w-full h-0.5 mt-2 transition-all duration-500 ${activeFloor === f ? 'bg-cyan-500 shadow-neon-cyan' : 'bg-white/5'}`} />
                            </button>
                            {activeFloor === f && (
                                <motion.div layoutId="floor-glow" className="absolute -inset-2 bg-cyan-500/5 blur-2xl rounded-full -z-10" />
                            )}
                        </div>
                    ))}
                </div>

                {/* MAIN SVG GRID */}
                <div className="flex-1 relative p-12 bg-[#020617] flex items-center justify-center perspective-[1200px]">
                    {/* Scanner Effect */}
                    {isScanning && (
                        <motion.div 
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-[2px] bg-cyan-500/20 shadow-neon-cyan z-10 pointer-events-none"
                        />
                    )}

                    <div className="w-full h-full max-w-5xl relative">
                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="1.2" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                                <linearGradient id="roomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </linearGradient>
                            </defs>

                            {/* Perimeter */}
                            <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.3" />
                            
                            {/* Hallway Infrastructure */}
                            <path d="M 35 10 L 35 90 M 65 10 L 65 90" stroke="rgba(34, 211, 238, 0.1)" strokeWidth="0.4" strokeDasharray="1 3" />
                            <rect x="35" y="10" width="30" height="80" fill="rgba(255, 255, 255, 0.02)" />

                            {/* Safe Route Projection */}
                            <motion.path
                                d={calculateSafePath}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                filter="url(#glow)"
                            />

                            {/* Rooms Implementation */}
                            {(rooms || []).map(room => {
                                const roomNumber = `${activeFloor}${room.id}`;
                                const incident = (floorIncidents || []).find(i => i.roomNumber === roomNumber);
                                const isHovered = hoveredRoom === room.id;
                                const style = getRoomStyle(roomNumber);

                                return (
                                    <g 
                                        key={room.id} 
                                        className="cursor-pointer transition-all duration-500"
                                        onMouseEnter={() => setHoveredRoom(room.id)}
                                        onMouseLeave={() => setHoveredRoom(null)}
                                        onClick={() => setSelectedRoom(incident || { roomNumber, empty: true })}
                                    >
                                        <motion.rect
                                            x={room.x} y={room.y} width={room.w} height={room.h}
                                            animate={{ 
                                                fill: isHovered ? 'rgba(34, 211, 238, 0.1)' : (style?.fill || 'rgba(15,23,42,0.2)'),
                                                stroke: isHovered ? '#22d3ee' : (style?.stroke || 'rgba(51,65,85,0.5)'),
                                                strokeWidth: isHovered ? 0.8 : 0.4
                                            }}
                                        />
                                        <rect x={room.x} y={room.y} width={room.w} height={room.h} fill="url(#roomGrad)" pointerEvents="none" />
                                        
                                        {/* Room Label */}
                                        <text 
                                            x={room.x + room.w/2} y={room.y + room.h/2} 
                                            textAnchor="middle" fontSize="2.2" fill={isHovered ? '#fff' : '#475569'}
                                            className="font-black pointer-events-none uppercase tracking-widest opacity-60"
                                        >
                                            SEC_{room.id}
                                        </text>

                                        {/* Telemetry Overlay */}
                                        {incident && (
                                            <g>
                                                <motion.circle 
                                                    cx={room.x + 3} cy={room.y + 3} r="1.2" fill={style.stroke}
                                                    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                />
                                                {incident.sensorMetadata?.temperature && (
                                                    <text x={room.x + 2} y={room.y + room.h - 3} fontSize="2" fill="#FF3366" className="font-black italic">
                                                        {incident.sensorMetadata.temperature}°C
                                                    </text>
                                                )}
                                            </g>
                                        )}
                                    </g>
                                );
                            })}

                            {/* Exit Signage */}
                            {(exits || []).map(exit => (
                                <g key={exit.id}>
                                    <motion.path 
                                        d={`M ${exit.x-2} ${exit.y} L ${exit.x+2} ${exit.y} M ${exit.x} ${exit.y-2} L ${exit.x} ${exit.y+2}`}
                                        stroke="#10b981" strokeWidth="0.6"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    />
                                    <text x={exit.x} y={exit.y + (exit.y < 50 ? -5 : 7)} textAnchor="middle" fontSize="2.5" fill="#10b981" className="font-black tracking-[0.2em]">
                                        {exit.label}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>

                {/* RIGHT TELEMETRY FEED */}
                <div className="w-80 border-l border-white/10 bg-slate-950/40 backdrop-blur-xl p-6 overflow-y-auto z-10">
                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                        <Zap size={16} className="text-cyan-500 animate-pulse" /> Sensor_Telemetry
                    </h4>

                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {floorIncidents.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="py-20 glass-panel border-dashed border-white/10 flex flex-col items-center justify-center text-center opacity-30"
                                >
                                    <Shield size={40} className="text-slate-700 mb-5" />
                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.3em] leading-loose">
                                        Perimeter_Secure<br/>System_Nominal
                                    </p>
                                </motion.div>
                            ) : (
                                (floorIncidents || []).map(inc => (
                                    <motion.div
                                        layout
                                        key={inc.id}
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className={`group p-5 border rounded-none transition-all duration-500 ${
                                            inc.severity >= 4 
                                            ? 'bg-danger/5 border-danger/30' 
                                            : 'glass-panel border-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-none ${inc.severity >= 4 ? 'bg-danger shadow-neon-red animate-pulse' : 'bg-cyan-500'}`} />
                                                <span className="text-[11px] font-black text-white tabular-nums tracking-widest">UNIT_{inc.roomNumber}</span>
                                            </div>
                                            <Badge variant={inc.severity >= 4 ? 'danger' : 'amber'} className="text-[8px] font-black py-0.5 px-2 rounded-none">
                                                SEV_0{inc.severity}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-5">
                                            {inc.sensorMetadata?.temperature && (
                                                <div className="bg-[#020617]/60 p-3 border border-white/5 group-hover:border-danger/20 transition-colors">
                                                    <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                                                        <Thermometer size={12} />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Temp</span>
                                                    </div>
                                                    <span className="text-sm font-black text-danger/80 tabular-nums">{inc.sensorMetadata.temperature}°C</span>
                                                </div>
                                            )}
                                            {inc.sensorMetadata?.smoke_density && (
                                                <div className="bg-[#020617]/60 p-3 border border-white/5 group-hover:border-slate-400/20 transition-colors">
                                                    <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                                                        <Wind size={12} />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Toxic</span>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-300 tabular-nums">{inc.sensorMetadata.smoke_density}</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-bold tracking-tight italic line-clamp-3">
                                            {inc.description}
                                        </p>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* MODAL: ROOM DEEP DIVE */}
            <AnimatePresence>
                {selectedRoom && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-2xl"
                        onClick={() => setSelectedRoom(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                            className="w-full max-w-xl glass-tactical p-10 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                                <Target size={300} className="text-cyan-500" />
                            </div>
                            
                            <div className="flex justify-between items-start mb-12 relative z-10">
                                <div>
                                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter text-glow-cyan">
                                        Node_Alpha_{selectedRoom.roomNumber}
                                    </h3>
                                    <p className="text-[11px] text-cyan-500 font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3">
                                        <div className={`w-2 h-2 ${selectedRoom.empty ? 'bg-emerald' : 'bg-danger animate-pulse shadow-neon-red'}`} />
                                        System_Status: {selectedRoom.empty ? 'NOMINAL' : 'BREACH_DETECTED'}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedRoom(null)} className="text-slate-600 hover:text-white transition-colors p-2 glass-panel border-white/5">
                                    <Zap size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-8">
                                    <div className="p-5 glass-panel border-white/5">
                                        <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest">Internal_Atmosphere</p>
                                        <div className="flex items-end gap-2.5">
                                            <span className="text-3xl font-black text-white tabular-nums">
                                                {selectedRoom.sensorMetadata?.temperature || 24.2}
                                            </span>
                                            <span className="text-xs font-black text-slate-600 mb-1.5 uppercase">Celsius</span>
                                        </div>
                                    </div>
                                    <div className="p-5 glass-panel border-white/5">
                                        <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest">Biometric_Detection</p>
                                        <div className="flex items-end gap-2.5">
                                            <span className="text-3xl font-black text-white tabular-nums">0.00</span>
                                            <span className="text-xs font-black text-slate-600 mb-1.5 uppercase">Count</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 border border-white/5 bg-slate-900/40 flex flex-col justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-6 text-center tracking-[0.3em]">Neural_Vision_Link</p>
                                    <div className="aspect-video bg-slate-950 border border-white/10 relative flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent" />
                                        <Wind size={28} className="text-cyan-500/10 animate-spin-slow" />
                                        <div className="absolute top-3 left-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
                                            <span className="text-[7px] text-danger font-black uppercase tracking-widest">LIVE_FEED</span>
                                        </div>
                                        <div className="absolute inset-0 scanline-overlay opacity-20" />
                                    </div>
                                </div>
                            </div>

                            {!selectedRoom.empty && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-10 pt-10 border-t border-white/10 relative z-10"
                                >
                                    <p className="text-[11px] font-black text-danger uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                        <ShieldAlert size={16} /> Intelligence_Briefing
                                    </p>
                                    <p className="text-[13px] text-slate-400 font-bold leading-relaxed uppercase tracking-wide">
                                        {selectedRoom.description}
                                    </p>
                                    <button className="w-full mt-10 py-5 bg-danger text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-neon-red hover:bg-danger/80 active:scale-[0.98] transition-all border-none">
                                        Execute_Tactical_Response
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* STATUS FOOTER */}
            <div className="p-4 bg-slate-950/60 backdrop-blur-xl border-t border-white/10 flex items-center justify-between z-20">
                <div className="flex items-center gap-8 ml-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald rounded-full shadow-neon-emerald" />
                        <span className="text-[10px] font-black text-slate-100 uppercase tracking-[0.3em]">Grid_Link_Operational</span>
                    </div>
                    <div className="h-5 w-px bg-white/10 hidden md:block" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black hidden md:block italic">
                        Processing_Throughput: 14.2 GFLOPS
                    </span>
                </div>
                <div className="flex items-center gap-5 mr-4">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">
                        RCR_Z-AXIS_V2.5_PRO
                    </span>
                </div>
            </div>
        </div>
    );
};

export default IndoorHeatmap;
