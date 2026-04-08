import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Activity, Thermometer, Wind, AlertTriangle } from 'lucide-react';

/**
 * IndoorHeatmap Component
 * Renders a Z-axis building floor plan with real-time IoT heat zones.
 */
const IndoorHeatmap = ({ incidents = [] }) => {
    const [activeFloor, setActiveFloor] = useState(1);
    const floors = [5, 4, 3, 2, 1];

    // Filter incidents for the current floor
    const floorIncidents = useMemo(() => {
        return incidents.filter(inc => inc.floorLevel === activeFloor);
    }, [incidents, activeFloor]);

    // Define room layouts for a generic wing (normalized 0-100 coordinates)
    const rooms = [
        { id: '01', x: 10, y: 10, width: 25, height: 20 },
        { id: '02', x: 40, y: 10, width: 20, height: 20 },
        { id: '03', x: 65, y: 10, width: 25, height: 20 },
        { id: '04', x: 10, y: 40, width: 20, height: 40 },
        { id: '05', x: 70, y: 40, width: 20, height: 40 },
        { id: '06', x: 35, y: 70, width: 30, height: 20 },
    ];

    const getHeatColor = (incident) => {
        if (!incident) return 'rgba(30, 41, 59, 0.5)'; // Default slate
        const { category, severity, sensorMetadata } = incident;
        
        if (category === 'FIRE') {
            const temp = sensorMetadata?.temperature || 0;
            if (temp > 80) return 'rgba(239, 68, 68, 0.8)'; // Red
            return 'rgba(249, 115, 22, 0.7)'; // Orange
        }
        if (category === 'SMOKE') return 'rgba(168, 162, 158, 0.8)'; // Stone/Smoke
        if (sensorMetadata?.co2_level > 2000) return 'rgba(16, 185, 129, 0.6)'; // Green/Teal for CO2
        
        return severity >= 4 ? 'rgba(220, 38, 38, 0.6)' : 'rgba(234, 179, 8, 0.6)';
    };

    return (
        <div className="relative flex flex-col w-full h-full bg-[#0B0F19] border border-slate-800 font-mono overflow-hidden">
            {/* Header / Stats */}
            <div className="flex items-center justify-between p-4 bg-[#111827] border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Layers size={18} className="text-cyan-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white italic">
                        Z-AXIS_INDOOR_GRID [LVL_0{activeFloor}]
                    </h3>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-none"></div>
                        <span className="text-[10px] text-slate-400 uppercase">Thermal</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-stone-400 rounded-none"></div>
                        <span className="text-[10px] text-slate-400 uppercase">Smoke</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 relative">
                {/* Floor Selector (Sidebar) */}
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
                    <div className="w-full h-full max-w-2xl max-height-full">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Hallway/Base */}
                            <rect x="5" y="5" width="90" height="90" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
                            <path d="M 35 10 L 35 90 M 65 10 L 65 90" stroke="#1e293b" strokeWidth="0.5" />

                            {/* Rooms */}
                            {rooms.map(room => {
                                const roomNumber = `${activeFloor}${room.id}`;
                                const incident = floorIncidents.find(i => i.roomNumber === roomNumber);
                                const isCritical = incident?.severity >= 4;

                                return (
                                    <g key={room.id}>
                                        <motion.rect
                                            x={room.x}
                                            y={room.y}
                                            width={room.width}
                                            height={room.height}
                                            initial={{ fill: 'rgba(30, 41, 59, 0.3)' }}
                                            animate={{ 
                                                fill: getHeatColor(incident),
                                                stroke: incident ? '#fff' : '#334155',
                                                strokeWidth: incident ? 0.8 : 0.2
                                            }}
                                            className="cursor-crosshair"
                                        />
                                        <text 
                                            x={room.x + room.width/2} 
                                            y={room.y + room.height/2} 
                                            textAnchor="middle" 
                                            fontSize="3" 
                                            fill="#94a3b8" 
                                            className="pointer-events-none font-bold"
                                        >
                                            {roomNumber}
                                        </text>
                                        {incident && (
                                            <motion.circle
                                                cx={room.x + 2}
                                                cy={room.y + 2}
                                                r="1.5"
                                                fill={isCritical ? '#ef4444' : '#eab308'}
                                                animate={{ opacity: [1, 0.4, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                            />
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* Right Panel: Live Sensor Data */}
                <div className="w-64 border-l border-slate-800 bg-[#111827]/80 p-4 overflow-y-auto">
                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Activity size={12} /> Sensor_Readings
                    </h4>
                    
                    <div className="space-y-3">
                        {floorIncidents.length === 0 ? (
                            <div className="p-4 border border-dashed border-slate-800 text-center">
                                <span className="text-[10px] text-slate-600 uppercase">No active alerts on this level</span>
                            </div>
                        ) : (
                            floorIncidents.map(inc => (
                                <div key={inc.id} className="p-3 bg-[#0B0F19] border border-slate-700 shadow-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-white italic">RM_{inc.roomNumber}</span>
                                        <Badge variant={inc.severity >= 4 ? 'danger' : 'amber'} className="text-[8px]">
                                            LVL_{inc.severity}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {inc.sensorMetadata?.temperature && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Thermometer size={10} />
                                                    <span className="text-[9px] uppercase">Temp</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-red-400">{inc.sensorMetadata.temperature}°C</span>
                                            </div>
                                        )}
                                        {inc.sensorMetadata?.smoke_density && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Wind size={10} />
                                                    <span className="text-[9px] uppercase">Smoke</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-stone-300">{inc.sensorMetadata.smoke_density} obs/m</span>
                                            </div>
                                        )}
                                        {inc.sensorMetadata?.co2_level && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Wind size={10} />
                                                    <span className="text-[9px] uppercase">CO2</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-teal-400">{inc.sensorMetadata.co2_level} ppm</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-slate-800">
                                        <p className="text-[9px] text-slate-500 leading-tight line-clamp-2 uppercase">
                                            {inc.description}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Offline / Resilience Footer */}
            <div className="p-2 bg-[#0B0F19] border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4 ml-2">
                    <span className="flex items-center gap-1 text-[8px] text-slate-500 uppercase tracking-tighter">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div> PWA_OFFLINE_SYNC_READY
                    </span>
                    <span className="flex items-center gap-1 text-[8px] text-slate-500 uppercase tracking-tighter">
                        <div className="w-1 h-1 bg-cyan-500 rounded-full"></div> VECTOR_TILE_LOADED
                    </span>
                </div>
                <div className="text-[8px] text-slate-600 font-bold uppercase mr-2">
                    RCR_TACTICAL_V2.0
                </div>
            </div>
        </div>
    );
};

export default IndoorHeatmap;
