import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Activity, Wind } from 'lucide-react';

export const TickerTape = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const fetchExternalAlerts = async () => {
            const newAlerts = [];
            
            // 1. Fetch Earthquakes
            try {
                const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
                const data = await res.json();
                data.features?.slice(0, 3).forEach(f => {
                    newAlerts.push({
                        id: f.id,
                        text: `EARTHQUAKE DETECTED: MAG ${f.properties.mag} - ${f.properties.place.toUpperCase()}`,
                        type: 'quake'
                    });
                });
            } catch (e) { console.error('Ticker: USGS Fail'); }

            // 2. Mock Weather Alerts
            newAlerts.push({ id: 'w1', text: 'EXTERNAL ADVISORY: HIGH WINDS EXPECTED IN SECTOR_NORTH', type: 'weather' });
            
            setAlerts(newAlerts);
        };

        fetchExternalAlerts();
        const interval = setInterval(fetchExternalAlerts, 300000); 
        return () => clearInterval(interval);
    }, []);

    if (alerts.length === 0) return null;

    return (
        <div className="flex flex-1 overflow-hidden relative items-center h-full">
            <div className="flex items-center gap-4 bg-red-600 px-3 h-full shrink-0 z-10 shadow-neon-red">
                <AlertTriangle size={12} className="text-white animate-pulse" />
                <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Live_Threat_Stream</span>
            </div>
            
            <div className="flex flex-1 overflow-hidden relative h-full items-center">
                <motion.div 
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="flex items-center gap-20 whitespace-nowrap px-10 h-full"
                >
                    {[...alerts, ...alerts].map((alert, i) => (
                        <div key={`${alert.id}-${i}`} className="flex items-center gap-3">
                            {alert.type === 'quake' ? <Activity size={12} className="text-orange-500" /> : <Wind size={12} className="text-cyan-400" />}
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                                {alert.text}
                            </span>
                            <span className="text-slate-700 font-black tracking-widest">{" /// "}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default TickerTape;
