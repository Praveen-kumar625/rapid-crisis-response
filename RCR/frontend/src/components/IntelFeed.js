import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Activity, Radio, CloudRain, Sun, Wind, CloudLightning, Thermometer, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from './ui/Badge';
import IncidentCard from './IncidentCard';
import { getCachedExternalData, cacheExternalData } from '../idb';

const WeatherIcon = ({ condition }) => {
    if (condition?.includes('rain')) return <CloudRain className="text-cyan-400" size={16} />;
    if (condition?.includes('storm')) return <CloudLightning className="text-warning" size={16} />;
    if (condition?.includes('clear')) return <Sun className="text-warning" size={16} />;
    return <Wind className="text-slate-400" size={16} />;
};

export const IntelFeed = ({ incidents, onSelectIncident, onAcknowledge }) => {
    const [weather, setWeather] = useState(null);
    const [weatherError, setWeatherError] = useState(false);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || process.env.REACT_APP_OPENWEATHER_API_KEY;
                if (!API_KEY) {
                    setWeatherError(true);
                    return;
                }
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=28.6139&lon=77.2090&appid=${API_KEY}&units=metric`);
                if (!res.ok) throw new Error('Weather API Error');
                const data = await res.json();
                setWeather(data);
                await cacheExternalData('openweather', data);
            } catch (e) {
                const cached = await getCachedExternalData('openweather');
                if (cached) setWeather(cached);
                else setWeatherError(true);
            }
        };
        fetchWeather();
    }, []);

    return (
        <div className="w-full h-full flex flex-col bg-slate-950/40 backdrop-blur-xl overflow-hidden font-mono">
            {/* TACTICAL HEADER */}
            <header className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-2 h-2 bg-danger rounded-full animate-ping absolute inset-0"></div>
                        <div className="w-2 h-2 bg-danger rounded-full relative z-10 shadow-neon-red"></div>
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Grid_Intel_Feed</h3>
                </div>
                <Activity size={14} className="text-cyan-500 animate-pulse text-glow-cyan" />
            </header>

            {/* WEATHER MODULE */}
            <section className="p-5 border-b border-white/5 bg-cyan-500/[0.02]">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Atmospheric_Threat_Index</span>
                    <Badge variant="neutral" className="text-[7px] border-none bg-white/5">Local_Sensor_77.2E</Badge>
                </div>

                {weather ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-3 border-white/5">
                            <div className="flex items-center gap-2 mb-1.5 opacity-60">
                                <WeatherIcon condition={weather.weather[0].main.toLowerCase()} />
                                <span className="text-[8px] font-black uppercase">Condition</span>
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">{weather.weather[0].description}</span>
                        </div>
                        <div className="glass-panel p-3 border-white/5">
                            <div className="flex items-center gap-2 mb-1.5 opacity-60">
                                <Thermometer className="text-danger" size={14} />
                                <span className="text-[8px] font-black uppercase">Temp</span>
                            </div>
                            <span className="text-sm font-black text-white tabular-nums">{weather.main.temp}°C</span>
                        </div>
                    </div>
                ) : weatherError ? (
                    <div className="flex items-center gap-2 text-danger/60 p-3 border border-danger/20 bg-danger/5">
                        <AlertCircle size={14} />
                        <span className="text-[9px] font-black uppercase">Feed_Unavailable</span>
                    </div>
                ) : (
                    <div className="h-14 flex items-center justify-center opacity-20">
                        <Loader2 className="animate-spin" size={20} />
                    </div>
                )}
            </section>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                <AnimatePresence mode="popLayout">
                    {/* RULE 2: Defensive component rendering with strict array check */}
                    {Array.isArray(incidents) ? incidents.map((inc) => (
                        <IncidentCard 
                            key={inc.id} 
                            incident={inc} 
                            onAcknowledge={onAcknowledge}
                            onClick={() => onSelectIncident?.(inc)}
                        />
                    )) : (
                        /* RULE 4: Fallback UI for non-array payload */
                        <div className="py-10 text-center opacity-50">
                            <AlertCircle size={32} className="mx-auto mb-4 text-warning" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Feed_Corrupted / No Data</p>
                        </div>
                    )}
                </AnimatePresence>

                {Array.isArray(incidents) && incidents.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center opacity-20 text-center">
                        <Radio size={40} className="mb-4 animate-pulse" />
                        <p className="text-[9px] font-black uppercase tracking-[0.4em]">Node_Scanning...</p>
                    </div>
                )}
            </div>

            <footer className="p-4 border-t border-white/10 bg-white/5 shrink-0">
                <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <span>Nodes_Active: {Array.isArray(incidents) ? incidents.length : 0}</span>
                    <span className="text-cyan-500/60">Secure_Link: established</span>
                </div>
            </footer>
        </div>
    );
};

export default IntelFeed;
