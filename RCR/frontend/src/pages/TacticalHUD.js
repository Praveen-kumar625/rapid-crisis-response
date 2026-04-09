import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Clock, MapPin, Navigation } from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const TacticalHUD = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [presence, setPresence] = useState({ status: 'AVAILABLE', floor: 1, wing: 'A' });

    const fetchTasks = async () => {
        try {
            const { data } = await api.get('/tasks/my-tasks');
            setTasks(data);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
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
                setTasks(prev => prev.map(t => t.id === payload.task.id ? payload.task : t));
            });
        })();

        return () => {
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
            toast.error('Sync failed');
        }
    };

    const handleSecure = async (taskId) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: 'SECURED' });
            // After securing, check if we should go back to AVAILABLE
            if (presence.status === 'BUSY') {
                updatePresence({ status: 'AVAILABLE' });
            }
            toast.success('Objective Secured');
        } catch (err) {
            toast.error('Sync failed');
        }
    };

    if (isLoading) return <div className="h-screen bg-navy-950 flex items-center justify-center font-mono text-electric animate-pulse">INITIALIZING TACTICAL LINK...</div>;

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-mono p-4 pb-24">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-electric/10 border border-electric/30 flex items-center justify-center">
                        <Shield size={20} className="text-electric" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-tighter">Tactical HUD</h1>
                        <p className="text-[10px] text-slate-500 uppercase">{profile?.role} UNIT // {profile?.email}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-[8px] text-slate-500 uppercase font-black">Network</span>
                    <span className="text-[10px] text-emerald font-bold uppercase">Signal Lock</span>
                </div>
            </header>

            {/* Presence Controls */}
            <div className="grid grid-cols-3 gap-3 mb-8 bg-white/[0.02] p-4 border border-white/5">
                <div className="flex flex-col gap-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Status</span>
                    <select 
                        value={presence.status}
                        onChange={(e) => updatePresence({ status: e.target.value })}
                        className="bg-slate-900 border border-white/10 text-[10px] p-2 focus:border-electric outline-none text-white appearance-none"
                    >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="BUSY">BUSY</option>
                        <option value="OFF_DUTY">OFF_DUTY</option>
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Floor</span>
                    <select 
                        value={presence.floor}
                        onChange={(e) => updatePresence({ floor: Number(e.target.value) })}
                        className="bg-slate-900 border border-white/10 text-[10px] p-2 focus:border-electric outline-none text-white appearance-none"
                    >
                        {[1,2,3,4,5].map(f => <option key={f} value={f}>FL_0{f}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Wing</span>
                    <select 
                        value={presence.wing}
                        onChange={(e) => updatePresence({ wing: e.target.value })}
                        className="bg-slate-900 border border-white/10 text-[10px] p-2 focus:border-electric outline-none text-white appearance-none"
                    >
                        {['A', 'B', 'C', 'NORTH', 'SOUTH'].map(w => <option key={w} value={w}>WING_{w}</option>)}
                    </select>
                </div>
            </div>

            {/* Task Feed */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 bg-electric animate-ping" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Directives</h2>
                </div>

                {tasks.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 opacity-30 rounded-xl">
                        <Clock size={32} className="mb-4 text-slate-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Standing By...</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <Card key={task.id} className={`p-0 overflow-hidden border-l-4 rounded-none ${
                            task.status === 'SECURED' ? 'border-l-emerald bg-emerald/5' : 
                            task.status === 'ACKNOWLEDGED' ? 'border-l-electric bg-electric/5' : 
                            'border-l-warning bg-warning/5 animate-pulse'
                        }`}>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Directive #{task.id.substring(0,8)}</span>
                                        <span className={`text-[8px] font-bold uppercase ${
                                            task.incident_severity >= 4 ? 'text-red-500' : 'text-amber-500'
                                        }`}>
                                            {task.incident_title} [LVL {task.incident_severity}]
                                        </span>
                                    </div>
                                    <Navigation size={14} className="text-electric" />
                                </div>

                                <p className="text-sm font-bold text-white mb-6 leading-relaxed uppercase">
                                    {task.instruction}
                                </p>

                                <div className="flex gap-3">
                                    {task.status === 'PENDING' || task.status === 'DISPATCHED' ? (
                                        <Button 
                                            variant="primary" 
                                            fullWidth
                                            className="bg-electric text-navy-950 font-black text-[10px] uppercase tracking-widest py-4 rounded-none border-none"
                                            onClick={() => handleAcknowledge(task.id)}
                                        >
                                            Confirm Receipt
                                        </Button>
                                    ) : task.status === 'ACKNOWLEDGED' ? (
                                        <Button 
                                            variant="primary" 
                                            fullWidth
                                            className="bg-emerald text-navy-950 font-black text-[10px] uppercase tracking-widest py-4 rounded-none border-none"
                                            onClick={() => handleSecure(task.id)}
                                        >
                                            Objective Secured
                                        </Button>
                                    ) : (
                                        <div className="w-full py-4 flex items-center justify-center gap-2 bg-emerald/20 border border-emerald/30 text-emerald font-black text-[10px] uppercase tracking-widest">
                                            <CheckCircle2 size={14} /> Completed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Tactical Footer Overlay */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0B0F19]/80 backdrop-blur-xl border-t border-white/10 flex justify-around z-50">
                <button onClick={() => window.location.reload()} className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                    <Clock size={18} />
                    <span className="text-[7px] font-black uppercase">Sync</span>
                </button>
                <div className="flex flex-col items-center gap-1 text-electric">
                    <Shield size={18} />
                    <span className="text-[7px] font-black uppercase">Tasks</span>
                </div>
                <button className="flex flex-col items-center gap-1 opacity-50">
                    <MapPin size={18} />
                    <span className="text-[7px] font-black uppercase">Zones</span>
                </button>
            </div>
        </div>
    );
};

export default TacticalHUD;
