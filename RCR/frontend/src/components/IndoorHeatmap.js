import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Activity, Thermometer, Wind, Navigation, ShieldAlert } from 'lucide-react';
import { Badge } from './ui/Badge';
import { getSocket } from '../socket';

/**
 * IndoorHeatmap Component
 * Renders a Z-axis building floor plan with real-time IoT heat zones
 * and dynamic evacuation routing.
 */
const IndoorHeatmap = ({ incidents = [] }) => {
    const [activeFloor, setActiveFloor] = useState(1);
    const [liveIotData, setLiveIotData] = useState([]);
    const [safeRoute, setSafeRoute] = useState(null);
    const floors = [5, 4, 3, 2, 1];

    // -----------------------------------------------------------------
    // PHASE 3: WebSocket Listener for IoT Data
    // -----------------------------------------------------------------
    useEffect(() => {
        let socket;
        const setupSocket = async () => {
            socket = await getSocket();
            
            socket.on('NEW_IOT_ALERT', (event) => {
                console.log('📡 [Heatmap] Live IoT Signal Received:', event);
                setLiveIotData(prev => {
                    // Keep only latest 20 events to prevent memory bloat
                    const filtered = prev.filter(e => e.external_id !== event.external_id);
                    return [event, ...filtered].slice(0, 20);
                });
            });
        };

        setupSocket();
        return () => {
            if (socket) socket.off('NEW_IOT_ALERT');
        };
    }, []);

    // Merge static incidents with live IoT alerts
    const allAlerts = useMemo(() => {
        const iotAsIncidents = liveIotData.map(iot => ({
            id: iot.id,
            roomNumber: iot.room_number,
            floorLevel: iot.floor_level,
            category: iot.category,
            severity: iot.severity,
            sensorMetadata: iot.sensor_metadata,
            description: iot.description
        }));
        
        return [...incidents, ...iotAsIncidents];
    }, [incidents, liveIotData]);

    const floorIncidents = useMemo(() => {
        return allAlerts.filter(inc => inc.floorLevel === activeFloor);
    }, [allAlerts, activeFloor]);

    // Define room layouts (normalized 0-100 coordinates)
    const rooms = [
        { id: '01', x: 10, y: 10, width: 25, height: 20, entry: { x: 35, y: 20 } },
        { id: '02', x: 40, y: 10, width: 20, height: 20, entry: { x: 40, y: 20 } },
        { id: '03', x: 65, y: 10, width: 25, height: 20, entry: { x: 65, y: 20 } },
        { id: '04', x: 10, y: 40, width: 20, height: 40, entry: { x: 35, y: 60 } },
        { id: '05', x: 70, y: 40, width: 20, height: 40, entry: { x: 65, y: 60 } },
        { id: '06', x: 35, y: 70, width: 30, height: 20, entry: { x: 50, y: 70 } },
    ];

    // Exits
    const exits = [
        { id: 'EXIT_NORTH', x: 50, y: 5, label: 'STAIRS_A' },
        { id: 'EXIT_SOUTH', x: 50, y: 95, label: 'STAIRS_B' }
    ];

    // -----------------------------------------------------------------
    // PHASE 3: Dynamic Pathfinding Logic
    // -----------------------------------------------------------------
    const calculateSafePath = useMemo(() => {
        // Find a safe exit by checking floor incidents
        const hazardZones = floorIncidents.filter(inc => {
            const temp = inc.sensorMetadata?.temperature || 0;
            const smoke = inc.sensorMetadata?.smoke_density || 0;
            return temp > 80 || smoke > 0.5 || inc.severity >= 5;
        });

        // Simple Manhattan-based dynamic routing
        // Starting from Room 04 (most common demo area) to safest exit
        const startPoint = { x: 35, y: 60 }; // Entry point of RM_04
        
        // Determine safest exit (one furthest from hazards)
        const selectedExit = exits.reduce((best, current) => {
            const distToHazards = hazardZones.reduce((minDist, hz) => {
                const room = rooms.find(r => `${activeFloor}${r.id}` === hz.roomNumber);
                if (!room) return minDist;
                const d = Math.sqrt(Math.pow(current.x - room.x, 2) + Math.pow(current.y - room.y, 2));
                return Math.min(minDist, d);
            }, Infinity);
            
            return distToHazards > (best.dist || 0) ? { exit: current, dist: distToHazards } : best;
        }, { exit: exits[0], dist: 0 }).exit;

        // Construct SVG Path (Hallway-only routing)
        // M start.x start.y -> L hallway.x start.y -> L hallway.x exit.y -> L exit.x exit.y
        const hallwayX = 50; 
        return `M ${startPoint.x} ${startPoint.y} L ${hallwayX} ${startPoint.y} L ${hallwayX} ${selectedExit.y} L ${selectedExit.x} ${selectedExit.y}`;
    }, [floorIncidents, activeFloor]);

    const getHeatColor = (incident) => {
        if (!incident) return 'rgba(30, 41, 59, 0.3)';
        const { category, sensorMetadata } = incident;
        
        if (category === 'FIRE') {
            const temp = sensorMetadata?.temperature || 0;
            if (temp > 80) return 'rgba(239, 68, 68, 0.8)';
            return 'rgba(249, 115, 22, 0.7)';
        }
        if (category === 'SMOKE') return 'rgba(168, 162, 158, 0.8)';
        if (sensorMetadata?.co2_level > 2000) return 'rgba(16, 185, 129, 0.6)';
        
        return incident.severity >= 4 ? 'rgba(220, 38, 38, 0.6)' : 'rgba(234, 179, 8, 0.6)';
    };

    return (
        <div className="relative flex flex-col w-full h-full bg-[#0B0F19] border border-slate-800 font-mono overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-[#111827] border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Layers size={18} className="text-cyan-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white italic">
                        Z-AXIS_INDOOR_GRID [LVL_0{activeFloor}]
                    </h3>
                </div>
                <div className="flex gap-4">
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[8px] animate-pulse">
                        LIVE_SYSTEM_POLLING
                    </Badge>
                </div>
            </div>

            <div className="flex flex-1 relative">
                {/* Floor Selector */}
                <div className="w-16 border-r border-slate-800 flex flex-col items-center py-4 gap-2 bg-[#0B0F19]/50">
                    {floors.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFloor(f)}
                            className={`w-10 h-10 flex items-center justify-center text-xs font-bold border transition-all duration-200 ${
                                activeFloor === f 
                                ? 'bg-cyan-500 border-cyan-400 text-black shadow-neon-cyan' 
                                : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'
                            }`}
                        >
                            F{f}
                        </button>
                    ))}
                </div>

                {/* SVG Floor Plan */}
                <div className="flex-1 relative p-8 flex items-center justify-center bg-grid-slate-900/[0.2]">
                    <div className="w-full h-full max-w-2xl">
                        <svg viewBox="0 0 100 100" className="w-full h-full shadow-2xl">
                            {/* Grids and Hallways */}
                            <rect x="5" y="5" width="90" height="90" fill="none" stroke="#1e293b" strokeWidth="0.2" strokeDasharray="1 1" />
                            <rect x="35" y="10" width="30" height="80" fill="rgba(15, 23, 42, 0.5)" stroke="#1e293b" strokeWidth="0.5" />

                            {/* Safe Route (PHASE 3) */}
                            <motion.path
                                d={calculateSafePath}
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                style={{ filter: 'drop-shadow(0 0 3px #22c55e)' }}
                            />

                            {/* Exits */}
                            {exits.map(exit => (
                                <g key={exit.id}>
                                    <circle cx={exit.x} cy={exit.y} r="3" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="0.5" />
                                    <text x={exit.x} y={exit.y + (exit.y < 50 ? -5 : 8)} textAnchor="middle" fontSize="3" fill="#22c55e" className="font-black">{exit.label}</text>
                                </g>
                            ))}

                            {/* Rooms */}
                            {rooms.map(room => {
                                const roomNumber = `${activeFloor}${room.id}`;
                                const incident = floorIncidents.find(i => i.roomNumber === roomNumber);
                                const isHazard = incident?.sensorMetadata?.temperature > 80 || incident?.category === 'SMOKE';

                                return (
                                    <g key={room.id}>
                                        <motion.rect
                                            x={room.x}
                                            y={room.y}
                                            width={room.width}
                                            height={room.height}
                                            animate={{ 
                                                fill: getHeatColor(incident),
                                                stroke: isHazard ? '#ef4444' : (incident ? '#fff' : '#334155'),
                                                strokeWidth: isHazard ? 1.5 : (incident ? 0.8 : 0.2)
                                            }}
                                            transition={{ duration: 0.5 }}
                                        />
                                        <text x={room.x + room.width/2} y={room.y + room.height/2} textAnchor="middle" fontSize="3" fill="#94a3b8" className="pointer-events-none font-bold">
                                            {roomNumber}
                                        </text>
                                        {isHazard && (
                                            <motion.g
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="pointer-events-none"
                                            >
                                                <path 
                                                    d={`M ${room.x + room.width/2} ${room.y + 5} L ${room.x + room.width/2 - 2} ${room.y + 9} L ${room.x + room.width/2 + 2} ${room.y + 9} Z`}
                                                    fill="#ef4444"
                                                />
                                            </motion.g>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-64 border-l border-slate-800 bg-[#111827]/80 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Navigation size={12} /> Route_Intel
                        </h4>
                    </div>

                    {floorIncidents.some(i => i.severity >= 4) && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-none animate-pulse">
                            <div className="flex items-center gap-2 text-red-500 mb-1">
                                <ShieldAlert size={14} />
                                <span className="text-[10px] font-black uppercase">Hazard_Detected</span>
                            </div>
                            <p className="text-[9px] text-red-400 leading-tight uppercase font-bold">
                                Dynamic routing active. Avoiding high-heat zones in F0{activeFloor}.
                            </p>
                        </div>
                    )}
                    
                    <div className="space-y-3">
                        <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-2 ml-1">Live_Sensor_Feed</p>
                        {floorIncidents.length === 0 ? (
                            <div className="p-4 border border-dashed border-slate-800 text-center">
                                <span className="text-[10px] text-slate-600 uppercase italic">Nominal_Conditions</span>
                            </div>
                        ) : (
                            floorIncidents.map(inc => (
                                <motion.div 
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    key={inc.id} 
                                    className="p-3 bg-[#0B0F19] border border-slate-700 shadow-lg"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-white">RM_{inc.roomNumber}</span>
                                        <div className="flex gap-1">
                                            {inc.sensorMetadata?.temperature > 80 && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
                                            <Badge variant={inc.severity >= 4 ? 'danger' : 'amber'} className="text-[7px] px-1 py-0 h-3">
                                                {inc.severity >= 4 ? 'CRIT' : 'WARN'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {inc.sensorMetadata?.temperature && (
                                            <div className="bg-black/40 p-1.5 border border-slate-800">
                                                <p className="text-[7px] text-slate-500 uppercase font-black mb-0.5">Temp</p>
                                                <p className="text-[10px] font-mono text-red-400">{inc.sensorMetadata.temperature}°C</p>
                                            </div>
                                        )}
                                        {inc.sensorMetadata?.smoke_density && (
                                            <div className="bg-black/40 p-1.5 border border-slate-800">
                                                <p className="text-[7px] text-slate-500 uppercase font-black mb-0.5">Smoke</p>
                                                <p className="text-[10px] font-mono text-stone-300">{inc.sensorMetadata.smoke_density}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Status Footer */}
            <div className="p-2 bg-[#0B0F19] border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4 ml-2">
                    <span className="flex items-center gap-1 text-[8px] text-green-500 uppercase font-bold animate-pulse">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div> SYSTEM_ONLINE
                    </span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-tighter">
                        LATENCY: 42MS
                    </span>
                </div>
                <div className="text-[8px] text-slate-600 font-bold uppercase mr-2">
                    EVAC_ENGINE_ALPHA_V1
                </div>
            </div>
        </div>
    );
};

export default IndoorHeatmap;
