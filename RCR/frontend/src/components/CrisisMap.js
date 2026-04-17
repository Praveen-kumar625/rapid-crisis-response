import React from "react";

const CrisisMap = ({ incidents = [], onMarkerClick, _activeFilter }) => {
    return (
        <div className="w-full h-full relative flex items-center justify-center text-slate-500">

            {/* RADIAL GLOW BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,255,255,0.08),_transparent_70%)]" />

            {/* GRID OVERLAY */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* INCIDENT MARKERS */}
            {incidents.map((inc) => (
                <div
                    key={inc.id}
                    onClick={() => onMarkerClick && onMarkerClick(inc)}
                    className="absolute cursor-pointer group"
                    style={{
                        top: `${Math.random() * 80 + 10}%`,
                        left: `${Math.random() * 80 + 10}%`,
                    }}
                >
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                    <div className="w-3 h-3 bg-red-500 rounded-full relative" />

                    <div className="opacity-0 group-hover:opacity-100 transition absolute top-5 left-1/2 -translate-x-1/2 text-[10px] bg-black/80 px-2 py-1 rounded text-white whitespace-nowrap">
                        {inc.title}
                    </div>
                </div>
            ))}

            {/* EMPTY STATE */}
            {incidents.length === 0 && (
                <p className="text-xs uppercase tracking-widest opacity-40">
                    No Active Signals
                </p>
            )}
        </div>
    );
};

<<<<<<< HEAD
function CrisisMap({ incidents: externalIncidents, onMarkerClick, activeFilter }) {
    const navigate = useNavigate();
    const [internalIncidents, setInternalIncidents] = useState([]);
    const [responders, setResponders] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [liveIotAlerts, setLiveIotAlerts] = useState([]);
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

        const handleIotAlert = (iotEvent) => {
            try {
                if (!iotEvent || !iotEvent.id) return;
                if (isMounted) {
                    setLiveIotAlerts(prev => {
                        const filtered = prev.filter(e => e.id !== iotEvent.id);
                        return [iotEvent, ...filtered].slice(0, 10);
                    });
                }
            } catch (err) {
                console.error('[Map] NEW_IOT_ALERT failed', err);
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
                socketInstance.on('NEW_IOT_ALERT', handleIotAlert);
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
                socketInstance.off('NEW_IOT_ALERT', handleIotAlert);
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
                                    <span className="text-white font-black text-[8px]">${quake.properties.mag.toFixed(1)}</span>
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

=======
>>>>>>> 5c219bc (Update)
export default CrisisMap;