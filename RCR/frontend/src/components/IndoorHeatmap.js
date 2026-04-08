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
                setLiveIotData(prev => {
                    const filtered = prev.filter(e => e.room_number !== event.room_number);
                    return [event, ...filtered].slice(0, 15);
                });
            });
        };
        setupSocket();
        return () => { if (socket) socket.off('NEW_IOT_ALERT'); };
    }, []);

    // Merge static and live data
    const allAlerts = useMemo(() => {
        const iotAsIncidents = liveIotData.map(iot => ({
            id: iot.id,
            roomNumber: iot.room_number,
            floorLevel: iot.floor_level,
            category: iot.category,
            severity: iot.severity,
            sensorMetadata: iot.sensor_metadata,
            description: iot.description,
            isLive: true
        }));
        return [...incidents, ...iotAsIncidents];
    }, [incidents, liveIotData]);

    const floorIncidents = useMemo(() => {
        return allAlerts.filter(inc => inc.floorLevel === activeFloor);
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
        if (!incident) return { fill: 'rgba(15, 23, 42, 0.4)', stroke: '#1e293b' };
        
        if (incident.category === 'FIRE') return { fill: 'rgba(239, 68, 68, 0.6)', stroke: '#ef4444' };
        if (incident.category === 'SMOKE') return { fill: 'rgba(168, 162, 158, 0.6)', stroke: '#a8a29e' };
        return { fill: 'rgba(234, 179, 8, 0.4)', stroke: '#eab308' };
    };

    return (
        <div className="relative flex flex-col w-full h-full bg-[#0B0F19] border border-slate-800 font-mono overflow-hidden select-none">
            {/* TACTICAL HEADER */}
            <div className="flex items-center justify-between p-5 bg-[#0B0F19] border-b border-slate-800 z-20">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-cyan-500/10 border border-cyan-500/30">
                        <Cpu size={20} className="text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">
                            Spatial_Neural_Grid <span className="text-cyan-500">{"//"}</span> LVL_0{activeFloor}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Quantum_Sync_Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex gap-4 border-r border-slate-800 pr-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-slate-500 font-black uppercase">Nodes</span>
                            <span className="text-xs font-bold text-cyan-400">{rooms.length}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-slate-500 font-black uppercase">Active_Hazards</span>
                            <span className="text-xs font-bold text-red-500">{floorIncidents.length}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsScanning(!isScanning)}
                        className={`p-2 transition-colors ${isScanning ? 'text-cyan-400' : 'text-slate-600'}`}
                    >
                        <Eye size={18} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 relative">
                {/* Z-AXIS CONTROLLER */}
                <div className="w-20 border-r border-slate-800 flex flex-col items-center py-6 gap-4 bg-[#0B0F19]/80 z-10">
                    {floors.map(f => (
                        <div key={f} className="relative group">
                            <button
                                onClick={() => setActiveFloor(f)}
                                className={`w-12 h-12 flex flex-col items-center justify-center transition-all duration-300 relative ${
                                    activeFloor === f 
                                    ? 'text-cyan-400 scale-110' 
                                    : 'text-slate-600 hover:text-slate-400'
                                }`}
                            >
                                <span className={`text-[10px] font-black ${activeFloor === f ? 'text-cyan-400' : ''}`}>F0{f}</span>
                                <div className={`w-full h-0.5 mt-1 transition-all ${activeFloor === f ? 'bg-cyan-500 shadow-neon-cyan' : 'bg-transparent'}`} />
                            </button>
                            {activeFloor === f && (
                                <motion.div layoutId="floor-glow" className="absolute -inset-2 bg-cyan-500/5 blur-xl rounded-full -z-10" />
                            )}
                        </div>
                    ))}
                </div>

                {/* MAIN SVG GRID */}
                <div className="flex-1 relative p-12 bg-grid-slate-900/[0.4] flex items-center justify-center perspective-[1000px]">
                    {/* Scanner Effect */}
                    {isScanning && (
                        <motion.div 
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-px bg-cyan-500/30 shadow-neon-cyan z-10 pointer-events-none"
                        />
                    )}

                    <div className="w-full h-full max-w-4xl relative">
                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                                <linearGradient id="roomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </linearGradient>
                            </defs>

                            {/* Perimeter */}
                            <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(34, 211, 238, 0.1)" strokeWidth="0.5" />
                            
                            {/* Hallway Infrastructure */}
                            <path d="M 35 10 L 35 90 M 65 10 L 65 90" stroke="rgba(34, 211, 238, 0.2)" strokeWidth="0.5" strokeDasharray="2 2" />
                            <rect x="35" y="10" width="30" height="80" fill="rgba(15, 23, 42, 0.3)" />

                            {/* Safe Route Projection */}
                            <motion.path
                                d={calculateSafePath}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                filter="url(#glow)"
                            />

                            {/* Rooms Implementation */}
                            {rooms.map(room => {
                                const roomNumber = `${activeFloor}${room.id}`;
                                const incident = floorIncidents.find(i => i.roomNumber === roomNumber);
                                const isHovered = hoveredRoom === room.id;
                                const style = getRoomStyle(roomNumber);

                                return (
                                    <g 
                                        key={room.id} 
                                        className="cursor-pointer transition-all duration-300"
                                        onMouseEnter={() => setHoveredRoom(room.id)}
                                        onMouseLeave={() => setHoveredRoom(null)}
                                        onClick={() => setSelectedRoom(incident || { roomNumber, empty: true })}
                                    >
                                        <motion.rect
                                            x={room.x} y={room.y} width={room.w} height={room.h}
                                            animate={{ 
                                                fill: isHovered ? 'rgba(34, 211, 238, 0.15)' : style.fill,
                                                stroke: isHovered ? '#22d3ee' : style.stroke,
                                                strokeWidth: isHovered ? 1 : 0.5
                                            }}
                                            className="transition-colors"
                                        />
                                        <rect x={room.x} y={room.y} width={room.w} height={room.h} fill="url(#roomGrad)" pointerEvents="none" />
                                        
                                        {/* Room Label */}
                                        <text 
                                            x={room.x + room.w/2} y={room.y + room.h/2} 
                                            textAnchor="middle" fontSize="2.5" fill={isHovered ? '#fff' : '#475569'}
                                            className="font-black pointer-events-none uppercase tracking-tighter"
                                        >
                                            {roomNumber}
                                        </text>

                                        {/* Telemetry Overlay */}
                                        {incident && (
                                            <g>
                                                <motion.circle 
                                                    cx={room.x + 3} cy={room.y + 3} r="1.5" fill={style.stroke}
                                                    animate={{ opacity: [1, 0.2, 1] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                />
                                                {incident.sensorMetadata?.temperature && (
                                                    <text x={room.x + 2} y={room.y + room.h - 3} fontSize="2" fill="#ef4444" className="font-bold">
                                                        {incident.sensorMetadata.temperature}°C
                                                    </text>
                                                )}
                                            </g>
                                        )}
                                    </g>
                                );
                            })}

                            {/* Exit Signage */}
                            {exits.map(exit => (
                                <g key={exit.id}>
                                    <motion.path 
                                        d={`M ${exit.x-2} ${exit.y} L ${exit.x+2} ${exit.y} M ${exit.x} ${exit.y-2} L ${exit.x} ${exit.y+2}`}
                                        stroke="#10b981" strokeWidth="0.5"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    />
                                    <text x={exit.x} y={exit.y + (exit.y < 50 ? -4 : 6)} textAnchor="middle" fontSize="2" fill="#10b981" className="font-black">
                                        {exit.label}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>

                {/* RIGHT TELEMETRY FEED */}
                <div className="w-80 border-l border-slate-800 bg-[#0B0F19]/90 p-6 overflow-y-auto z-10 backdrop-blur-md">
                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                        <Zap size={14} className="text-cyan-500" /> Live_Sensor_Arrays
                    </h4>

                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {floorIncidents.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="p-10 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center opacity-40"
                                >
                                    <Shield size={32} className="text-slate-700 mb-4" />
                                    <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest leading-relaxed">
                                        Level_Monitoring_Optimal<br/>No_Anomalies_Detected
                                    </p>
                                </motion.div>
                            ) : (
                                floorIncidents.map(inc => (
                                    <motion.div
                                        layout
                                        key={inc.id}
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className={`group p-4 border rounded-none transition-all ${
                                            inc.severity >= 4 
                                            ? 'bg-red-500/5 border-red-500/30' 
                                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-none ${inc.severity >= 4 ? 'bg-red-500 shadow-neon-red' : 'bg-cyan-500'}`} />
                                                <span className="text-[10px] font-black text-white tabular-nums">RM_{inc.roomNumber}</span>
                                            </div>
                                            <Badge variant={inc.severity >= 4 ? 'danger' : 'amber'} className="text-[7px] py-0 px-1.5">
                                                LVL_{inc.severity}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            {inc.sensorMetadata?.temperature && (
                                                <div className="bg-black/40 p-2 border border-slate-800 group-hover:border-red-500/20 transition-colors">
                                                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                                        <Thermometer size={10} />
                                                        <span className="text-[7px] font-black uppercase">Temp</span>
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-red-400">{inc.sensorMetadata.temperature}°C</span>
                                                </div>
                                            )}
                                            {inc.sensorMetadata?.smoke_density && (
                                                <div className="bg-black/40 p-2 border border-slate-800 group-hover:border-stone-500/20 transition-colors">
                                                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                                        <Wind size={10} />
                                                        <span className="text-[7px] font-black uppercase">Smoke</span>
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-stone-300">{inc.sensorMetadata.smoke_density}</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-[9px] text-slate-500 leading-relaxed uppercase italic line-clamp-2">
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
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0B0F19]/90 backdrop-blur-xl"
                        onClick={() => setSelectedRoom(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-[#151B2B] border border-slate-800 p-8 shadow-tactical relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                <Target size={200} className="text-cyan-500" />
                            </div>
                            
                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                        Node_{selectedRoom.roomNumber}
                                    </h3>
                                    <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.3em] mt-2">
                                        Location_Status: {selectedRoom.empty ? 'SECURE' : 'ANOMALY_DETECTED'}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedRoom(null)} className="text-slate-500 hover:text-white transition-colors">
                                    <Target size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                <div className="space-y-6">
                                    <div className="p-4 bg-black/40 border border-slate-800">
                                        <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Internal_Atmosphere</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-2xl font-black text-white tabular-nums">
                                                {selectedRoom.sensorMetadata?.temperature || 24}
                                            </span>
                                            <span className="text-xs text-slate-500 mb-1">°C</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-black/40 border border-slate-800">
                                        <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Oxygen_Saturation</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-2xl font-black text-white tabular-nums">98.2</span>
                                            <span className="text-xs text-slate-500 mb-1">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border border-slate-800 bg-black/40 flex flex-col justify-center">
                                    <p className="text-[8px] font-black text-slate-500 uppercase mb-4 text-center">Neural_Vision_Feed</p>
                                    <div className="aspect-video bg-slate-900 border border-slate-800 relative flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent" />
                                        <Wind size={24} className="text-cyan-500/20 animate-spin-slow" />
                                        <div className="absolute top-2 left-2 flex gap-1">
                                            <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                                            <span className="text-[6px] text-red-500 font-bold uppercase">REC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!selectedRoom.empty && (
                                <div className="mt-8 pt-8 border-t border-slate-800 relative z-10">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <ShieldAlert size={14} /> Critical_Intelligence
                                    </p>
                                    <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase">
                                        {selectedRoom.description}
                                    </p>
                                    <button className="w-full mt-8 py-4 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all">
                                        Dispatch_Tactical_Team
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* STATUS FOOTER */}
            <div className="p-3 bg-[#0B0F19] border-t border-slate-800 flex items-center justify-between z-20">
                <div className="flex items-center gap-6 ml-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-neon-green" />
                        <span className="text-[9px] font-black text-slate-100 uppercase tracking-widest">Core_Link_Established</span>
                    </div>
                    <div className="h-4 w-px bg-slate-800 hidden md:block" />
                    <span className="text-[9px] text-slate-500 uppercase tracking-tighter hidden md:block italic">
                        Processing_Latency: 14.2ms
                    </span>
                </div>
                <div className="flex items-center gap-4 mr-3">
                    <span className="text-[10px] font-black text-slate-600 uppercase">
                        RCR_Z-AXIS_V2.0_ULTRA
                    </span>
                </div>
            </div>
        </div>
    );
};

export default IndoorHeatmap;
