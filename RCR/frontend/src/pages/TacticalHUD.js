import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SwipeDispatch from "../components/SwipeDispatch";

const TacticalHUD = () => {
<<<<<<< HEAD
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [profile, setProfile] = useState(null);
    const [isActionPending, setIsActionPending] = useState(false);
    const [presence, setPresence] = useState({ status: 'AVAILABLE', floor: 1, wing: 'A' });

    const fetchTasks = async () => {
        try {
            const { data } = await api.get('/tasks/my-tasks');
            setTasks(data);
            await cacheTasks(data);
        } catch (err) {
            console.error('Failed to fetch tasks, loading from cache:', err);
            const cached = await getCachedTasks();
            if (cached.length > 0) {
                setTasks(cached);
                toast('Offline Mode: Using cached data', { icon: '⚠️' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updatePresence = async (updates) => {
        const newPresence = { ...presence, ...updates };
        setPresence(newPresence);
        try {
            await api.post('/tasks/presence', {
                status: newPresence.status,
                floorLevel: newPresence.floor,
                wingId: newPresence.wing
            });
        } catch (err) {
            console.error('Presence sync failed');
        }
    };
=======
    const [count, setCount] = useState(0);
    const [threat, setThreat] = useState("LOW");
>>>>>>> 5c219bc (Update)

    // fake incidents counter
    useEffect(() => {
        const interval = setInterval(() => {
            setCount((prev) => prev + Math.floor(Math.random() * 2));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // fake threat level changer
    useEffect(() => {
        const levels = ["LOW", "MEDIUM", "CRITICAL"];
        const interval = setInterval(() => {
            const random = levels[Math.floor(Math.random() * levels.length)];
            setThreat(random);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

<<<<<<< HEAD
        let socketInstance = null;
        (async () => {
            socketInstance = await getSocket();
            socketInstance.on('task.tasks-created', (payload) => {
                try {
                    if (!payload || !payload.tasks) return;
                    const forMe = payload.tasks.some(t => t.assigned_role === profile?.role);
                    if (forMe) fetchTasks();
                } catch (err) {
                    console.error('[Socket] Dispatch failed for task.tasks-created', err);
                }
            });
            socketInstance.on('task.task-updated', (payload) => {
                try {
                    if (!payload || !payload.task) return;
                    setTasks(prev => {
                        const updated = prev.map(t => t.id === payload.task.id ? payload.task : t);
                        cacheTasks(updated);
                        return updated;
                    });
                } catch (err) {
                    console.error('[Socket] Dispatch failed for task.task-updated', err);
                }
            });
        })();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (socketInstance) {
                socketInstance.off('task.tasks-created');
                socketInstance.off('task.task-updated');
            }
        };
    }, [profile?.role]);

    const handleAcknowledge = async (taskId) => {
        setIsActionPending(true);
        const toastId = toast.loading('Acknowledging Directive...');
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: 'ACKNOWLEDGED' });
            toast.success('Task Acknowledged', { id: toastId });
            fetchTasks();
        } catch (err) {
            toast.error('Sync failed - retry when online', { id: toastId });
        } finally {
            setIsActionPending(false);
        }
    };

    const handleSecure = async (taskId) => {
        setIsActionPending(true);
        const toastId = toast.loading('Securing Objective...');
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: 'SECURED' });
            if (presence.status === 'BUSY') {
                updatePresence({ status: 'AVAILABLE' });
            }
            toast.success('Objective Secured', { id: toastId });
            fetchTasks();
        } catch (err) {
            toast.error('Sync failed - retry when online', { id: toastId });
        } finally {
            setIsActionPending(false);
        }
    };

    if (isLoading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617] font-mono text-electric space-y-4">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
                <Zap size={48} className="text-electric shadow-neon-cyan" />
            </motion.div>
            <div className="text-sm font-black tracking-[0.3em] animate-pulse uppercase">Initializing Tactical Link...</div>
        </div>
    );

    return (
        <div className="h-full w-full max-w-[100vw] overflow-hidden bg-[#020617] bg-grid-pattern text-slate-100 font-mono flex flex-col relative">
            {/* Scanline Overlay */}
            <div className="scanline-overlay"></div>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pointer-events-none absolute inset-0 z-0 bg-gradient-radial from-electric/5 via-transparent to-transparent"
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-32 relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 glass-tactical flex items-center justify-center shrink-0 border-electric/30">
                            <Shield size={28} className="text-electric text-glow-cyan" />
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="text-lg font-black uppercase tracking-tighter text-glow-cyan">Tactical HUD</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-widest">{profile?.role} UNIT // {profile?.email}</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="block text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Comms Status</span>
                        {isOnline ? (
                            <div className="flex items-center justify-end gap-2 text-emerald">
                                <Wifi size={14} strokeWidth={3} />
                                <span className="text-xs font-black uppercase tracking-tighter">Signal Lock</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-end gap-2 text-danger">
                                <WifiOff size={14} strokeWidth={3} className="animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-tighter">Link Severed</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Presence Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="flex flex-col gap-2 glass-panel p-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                        <select 
                            value={presence.status}
                            onChange={(e) => updatePresence({ status: e.target.value })}
                            className="bg-transparent border-none text-sm font-bold focus:ring-0 outline-none text-white appearance-none cursor-pointer"
                        >
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="BUSY">BUSY</option>
                            <option value="OFF_DUTY">OFF_DUTY</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2 glass-panel p-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Floor</span>
                        <select 
                            value={presence.floor}
                            onChange={(e) => updatePresence({ floor: Number(e.target.value) })}
                            className="bg-transparent border-none text-sm font-bold focus:ring-0 outline-none text-white appearance-none cursor-pointer"
                        >
                            {[1,2,3,4,5].map(f => <option key={f} value={f}>LEVEL_{f}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2 glass-panel p-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sector</span>
                        <select 
                            value={presence.wing}
                            onChange={(e) => updatePresence({ wing: e.target.value })}
                            className="bg-transparent border-none text-sm font-bold focus:ring-0 outline-none text-white appearance-none cursor-pointer"
                        >
                            {['A', 'B', 'C', 'NORTH', 'SOUTH'].map(w => <option key={w} value={w}>WING_{w}</option>)}
                        </select>
                    </div>
                </div>

                {/* Task Feed */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-electric animate-pulse shadow-neon-cyan' : 'bg-slate-600'}`} />
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Directives</h2>
                        </div>
                        {!isOnline && (
                            <div className="text-[10px] font-black text-danger uppercase flex items-center gap-1.5 border border-danger/30 px-2 py-1 bg-danger/10">
                                <AlertTriangle size={12} /> Sync Pending
                            </div>
                        )}
                    </div>

                    <AnimatePresence mode="popLayout">
                        {tasks.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="py-32 flex flex-col items-center justify-center border border-white/5 bg-white/[0.02] rounded-none opacity-40"
                            >
                                <Clock size={48} className="mb-4 text-slate-500" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Standing By...</p>
                            </motion.div>
                        ) : (
                            tasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`relative overflow-hidden border-l-4 group ${
                                        task.status === 'SECURED' ? 'border-l-emerald glass-panel bg-emerald/5' : 
                                        task.status === 'ACKNOWLEDGED' ? 'border-l-electric glass-panel bg-electric/5' : 
                                        'border-l-danger glass-tactical bg-danger/5'
                                    }`}
                                >
                                    {task.status === 'PENDING' && (
                                        <motion.div 
                                            layoutId={`glow-${task.id}`}
                                            className="absolute inset-0 bg-danger/5 animate-pulse pointer-events-none"
                                        />
                                    )}
                                    
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-5 gap-4">
                                            <div className="flex flex-col gap-2 overflow-hidden">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DRTV_{task.id.substring(0,8)}</span>
                                                    {task.floor_level && (
                                                        <span className="bg-slate-800 text-white text-[9px] px-2 py-0.5 font-black border border-white/10 flex items-center gap-1">
                                                            <Layers size={10} /> LVL_{task.floor_level}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-sm font-black uppercase tracking-tight ${
                                                    task.incident_severity >= 4 ? 'text-glow-red text-danger' : 'text-warning'
                                                }`}>
                                                    {task.incident_title} {" // "} [SEV_{task.incident_severity}]
                                                </span>
                                            </div>
                                            <Navigation size={20} className="text-electric shrink-0 text-glow-cyan" />
                                        </div>

                                        <p className="text-xs font-bold text-slate-300 mb-8 leading-relaxed uppercase tracking-wide">
                                            {task.instruction}
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {task.status === 'PENDING' || task.status === 'DISPATCHED' ? (
                                                <Button 
                                                    variant="primary" 
                                                    className="w-full bg-danger text-white font-black text-xs uppercase tracking-widest py-5 rounded-none border-none shadow-neon-red active:scale-[0.98] transition-transform"
                                                    onClick={() => handleAcknowledge(task.id)}
                                                    disabled={!isOnline || isActionPending}
                                                >
                                                    {isOnline ? 'Confirm Receipt' : 'Awaiting Link'}
                                                </Button>
                                            ) : task.status === 'ACKNOWLEDGED' ? (
                                                <Button 
                                                    variant="primary" 
                                                    className="w-full bg-electric text-navy-950 font-black text-xs uppercase tracking-widest py-5 rounded-none border-none shadow-neon-cyan active:scale-[0.98] transition-transform"
                                                    onClick={() => handleSecure(task.id)}
                                                    disabled={!isOnline || isActionPending}
                                                >
                                                    {isOnline ? 'Objective Secured' : 'Awaiting Link'}
                                                </Button>
                                            ) : (
                                                <div className="w-full py-5 flex items-center justify-center gap-2 bg-emerald/20 border border-emerald/30 text-emerald font-black text-xs uppercase tracking-widest">
                                                    <CheckCircle2 size={18} /> Objective Logged
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
=======
    // ✅ NEW: Dispatch handler
    const handleDispatch = () => {
        console.log("🚀 Dispatch Triggered");

        const speech = new SpeechSynthesisUtterance("Dispatch executed");
        speech.rate = 1;
        speech.pitch = 0.8;
        window.speechSynthesis.speak(speech);
    };

    const threatColor =
        threat === "CRITICAL"
            ? "text-red-500"
            : threat === "MEDIUM"
            ? "text-yellow-400"
            : "text-green-400";

    const threatBg =
        threat === "CRITICAL"
            ? "bg-red-500/20 border-red-500/40"
            : threat === "MEDIUM"
            ? "bg-yellow-400/20 border-yellow-400/40"
            : "bg-green-400/20 border-green-400/40";

    return (
        <div className="w-full min-h-screen bg-[#020617] text-white relative overflow-hidden flex flex-col items-center justify-center px-4">

            {/* SCANLINES */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_3px]" />

            {/* 🚨 THREAT ALERT BAR */}
            <AnimatePresence>
                {threat === "CRITICAL" && (
                    <motion.div
                        initial={{ y: -80 }}
                        animate={{ y: 0 }}
                        exit={{ y: -80 }}
                        className="absolute top-0 left-0 w-full bg-red-600 text-center py-3 font-bold tracking-widest text-sm z-50 shadow-lg"
                    >
                        🚨 CRITICAL THREAT DETECTED 🚨
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN GRID */}
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    
                {/* LEFT PANEL */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-slate-900/40 border border-cyan-500/20 backdrop-blur-xl p-5 rounded-lg w-full"
                >
                    <h3 className="text-xs text-cyan-400 mb-4 uppercase tracking-widest">
                        System Logs
                    </h3>

                    {["Node 1 Synced", "Node 2 Synced", "Node 3 Synced", "Node 4 Synced"].map((log, i) => (
                        <p key={i} className="text-xs text-green-400 mb-2">
                            ✔ {log}
                        </p>
                    ))}
                </motion.div>

                {/* CENTER RADAR */}
                <div className="relative flex items-center justify-center">

                    <div className="w-[260px] h-[260px] md:w-[400px] md:h-[400px] rounded-full border border-cyan-500/20 flex items-center justify-center">

                        {/* ROTATING SWEEP */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                            className="absolute w-full h-full"
                        >
                            <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-xl" />
                        </motion.div>

                        {/* RINGS */}
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="absolute rounded-full border border-cyan-500/10"
                                style={{
                                    width: `${i * 30}%`,
                                    height: `${i * 30}%`
                                }}
                            />
                        ))}

                        {/* CENTER PANEL */}
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="bg-slate-900/60 border border-cyan-500/30 backdrop-blur-xl p-6 rounded-lg text-center"
                        >
                            <h1 className="text-lg md:text-xl font-bold text-cyan-400 tracking-widest">
                                TACTICAL HUD
                            </h1>

                            <div className="mt-4 text-[11px] font-mono space-y-2">
                                <div className="flex justify-between gap-6">
                                    <span>Incidents</span>
                                    <span className="text-red-400">{count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Latency</span>
                                    <span className="text-cyan-400">18ms</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Status</span>
                                    <span className="text-green-400">OK</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Threat</span>
                                    <span className={`${threatColor} font-bold`}>
                                        {threat}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>

                {/* RIGHT PANEL */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`backdrop-blur-xl p-5 rounded-lg w-full border ${threatBg}`}
                >
                    <h3 className="text-xs text-cyan-400 mb-4 uppercase tracking-widest">
                        Alerts Feed
                    </h3>

                    {["Fire detected", "Medical emergency", "Security breach"].map((alert, i) => (
                        <motion.p
                            key={i}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            className="text-xs text-red-400 mb-2"
                        >
                            ● {alert}
                        </motion.p>
                    ))}

                    <div className="mt-4 text-center text-xs font-bold uppercase tracking-widest">
                        Threat Level:
                        <span className={`ml-2 ${threatColor}`}>
                            {threat}
                        </span>
                    </div>
                </motion.div>

>>>>>>> 5c219bc (Update)
            </div>

            {/* ✅ NEW: Swipe Dispatch (BOTTOM) */}
            <SwipeDispatch onDispatch={handleDispatch} />

        </div>
    );
};

export default TacticalHUD;