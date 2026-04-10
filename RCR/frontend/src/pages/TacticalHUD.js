import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Clock, MapPin, Navigation, Wifi, WifiOff, Layers } from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cacheTasks, getCachedTasks } from '../idb';

const TacticalHUD = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [profile, setProfile] = useState(null);
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

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        api.get('/incidents/me').then(({ data }) => {
            setProfile(data);
            if (data.responderStatus) {
                setPresence({
                    status: data.responderStatus,
                    floor: data.currentFloor || 1,
                    wing: data.currentWing || 'A'
                });
            }
        }).catch(console.error);
        fetchTasks();

        let socketInstance = null;
        (async () => {
            socketInstance = await getSocket();
            socketInstance.on('task.tasks-created', (payload) => {
                const forMe = payload.tasks.some(t => t.assigned_role === profile?.role);
                if (forMe) fetchTasks();
            });
            socketInstance.on('task.task-updated', (payload) => {
                setTasks(prev => {
                    const updated = prev.map(t => t.id === payload.task.id ? payload.task : t);
                    cacheTasks(updated);
                    return updated;
                });
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
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: 'ACKNOWLEDGED' });
            toast.success('Task Acknowledged');
        } catch (err) {
            toast.error('Sync failed - retry when online');
        }
    };

    const handleSecure = async (taskId) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: 'SECURED' });
            if (presence.status === 'BUSY') {
                updatePresence({ status: 'AVAILABLE' });
            }
            toast.success('Objective Secured');
        } catch (err) {
            toast.error('Sync failed - retry when online');
        }
    };

    if (isLoading) return <div className="h-screen bg-navy-950 flex items-center justify-center font-mono text-electric animate-pulse">INITIALIZING TACTICAL LINK...</div>;

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-mono p-4 pb-32 relative overflow-hidden">
            {/* HUD Scanline Overlay */}
            <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%]"></div>

            {/* Header */}
            <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-electric/10 border border-electric/30 flex items-center justify-center shrink-0">
                        <Shield size={24} className="text-electric" />
                    </div>
                    <div className="overflow-hidden">
                        <h1 className="text-sm font-black uppercase tracking-tighter truncate">Tactical HUD</h1>
                        <p className="text-[10px] text-slate-500 uppercase truncate">{profile?.role} UNIT // {profile?.email}</p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <span className="block text-[8px] sm:text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Network Status</span>
                    {isOnline ? (
                        <div className="flex items-center justify-end gap-1.5 text-emerald">
                            <Wifi size={12} strokeWidth={3} />
                            <span className="text-[10px] sm:text-xs font-bold uppercase">Signal Lock</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-end gap-1.5 text-danger animate-pulse">
                            <WifiOff size={12} strokeWidth={3} />
                            <span className="text-[10px] sm:text-xs font-bold uppercase">Signal Lost</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Presence Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-white/[0.02] p-4 border border-white/5 relative z-10">
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Status</span>
                    <select 
                        value={presence.status}
                        onChange={(e) => updatePresence({ status: e.target.value })}
                        className="bg-slate-900 border border-white/10 text-xs p-3 focus:border-electric outline-none text-white appearance-none h-[44px]"
                    >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="BUSY">BUSY</option>
                        <option value="OFF_DUTY">OFF_DUTY</option>
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Floor</span>
                    <select 
                        value={presence.floor}
                        onChange={(e) => updatePresence({ floor: Number(e.target.value) })}
                        className="bg-slate-900 border border-white/10 text-xs p-3 focus:border-electric outline-none text-white appearance-none h-[44px]"
                    >
                        {[1,2,3,4,5].map(f => <option key={f} value={f}>FL_0{f}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Wing</span>
                    <select 
                        value={presence.wing}
                        onChange={(e) => updatePresence({ wing: e.target.value })}
                        className="bg-slate-900 border border-white/10 text-xs p-3 focus:border-electric outline-none text-white appearance-none h-[44px]"
                    >
                        {['A', 'B', 'C', 'NORTH', 'SOUTH'].map(w => <option key={w} value={w}>WING_{w}</option>)}
                    </select>
                </div>
            </div>

            {/* Task Feed */}
            <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 ${isOnline ? 'bg-electric animate-ping' : 'bg-slate-600'}`} />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Active Directives</h2>
                </div>

                {tasks.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 opacity-30 rounded-xl">
                        <Clock size={48} className="mb-4 text-slate-500" />
                        <p className="text-xs font-black uppercase tracking-widest">Standing By...</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <Card key={task.id} className={`p-0 overflow-hidden border-l-4 rounded-none ${
                            task.status === 'SECURED' ? 'border-l-emerald bg-emerald/5' : 
                            task.status === 'ACKNOWLEDGED' ? 'border-l-electric bg-electric/5' : 
                            'border-l-warning bg-warning/5 animate-pulse'
                        }`}>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4 gap-4">
                                    <div className="flex flex-col gap-1.5 overflow-hidden">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Directive #{task.id.substring(0,8)}</span>
                                            {task.floor_level && (
                                                <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 font-bold border border-white/10 flex items-center gap-1">
                                                    <Layers size={10} /> FL_{task.floor_level}
                                                </span>
                                            )}
                                            {task.wing_id && (
                                                <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 font-bold border border-white/10">
                                                    {task.wing_id}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] sm:text-xs font-black uppercase ${
                                            task.incident_severity >= 4 ? 'text-red-500' : 'text-amber-500'
                                        }`}>
                                            {task.incident_title} [LVL {task.incident_severity}]
                                        </span>
                                    </div>
                                    <Navigation size={18} className="text-electric shrink-0" />
                                </div>

                                <p className="text-sm font-bold text-white mb-6 leading-relaxed uppercase">
                                    {task.instruction}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    {task.status === 'PENDING' || task.status === 'DISPATCHED' ? (
                                        <Button 
                                            variant="primary" 
                                            className="w-full bg-electric text-navy-950 font-black text-[11px] sm:text-xs uppercase tracking-widest py-5 rounded-none border-none min-h-[56px]"
                                            onClick={() => handleAcknowledge(task.id)}
                                            disabled={!isOnline}
                                        >
                                            {isOnline ? 'Confirm Receipt' : 'Waiting for Signal'}
                                        </Button>
                                    ) : task.status === 'ACKNOWLEDGED' ? (
                                        <Button 
                                            variant="primary" 
                                            className="w-full bg-emerald text-navy-950 font-black text-[11px] sm:text-xs uppercase tracking-widest py-5 rounded-none border-none min-h-[56px]"
                                            onClick={() => handleSecure(task.id)}
                                            disabled={!isOnline}
                                        >
                                            {isOnline ? 'Objective Secured' : 'Waiting for Signal'}
                                        </Button>
                                    ) : (
                                        <div className="w-full py-5 flex items-center justify-center gap-2 bg-emerald/20 border border-emerald/30 text-emerald font-black text-[11px] sm:text-xs uppercase tracking-widest min-h-[56px]">
                                            <CheckCircle2 size={18} /> Completed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Tactical Footer Overlay */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#0B0F19]/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center z-50 px-4">
                <button onClick={() => window.location.reload()} className="flex-1 flex flex-col items-center justify-center gap-1.5 min-h-[60px] opacity-50 hover:opacity-100 transition-opacity">
                    <Clock size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Sync</span>
                </button>
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5 min-h-[60px] text-electric">
                    <Shield size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Tasks</span>
                </div>
                <button className="flex-1 flex flex-col items-center justify-center gap-1.5 min-h-[60px] opacity-50">
                    <MapPin size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Zones</span>
                </button>
            </div>
        </div>
    );
};

export default TacticalHUD;

