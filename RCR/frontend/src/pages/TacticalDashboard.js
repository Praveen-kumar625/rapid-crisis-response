import React, { useEffect, useState } from 'react';
import api from '../api';
import { getSocket, emitWithTimeout } from '../socket';
import { IntelFeed } from '../components/IntelFeed';
import { TacticalMap } from '../components/TacticalMap';
import { AICommand } from '../components/AICommand';
import { ShieldAlert, Activity, Cpu, Map as MapIcon, List } from 'lucide-react';
import toast from 'react-hot-toast';

const TacticalDashboard = () => {
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [isDispatching, setIsDispatching] = useState(false);
    const [activeTab, setActiveTab] = useState('MAP'); // 'MAP' | 'FEED' | 'COMMAND'

    useEffect(() => {
        let isMounted = true;
        let socket;

        const init = async () => {
            try {
                const { data } = await api.get('/incidents');
                if (isMounted) setIncidents(data);
                
                socket = await getSocket();
                
                socket.on('incident.created', (payload) => {
                    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
                    try {
                        if (isMounted && payload.incident) {
                            setIncidents(prev => [payload.incident, ...prev]);
                            toast.error(`NEW ALERT: ${payload.incident.title}`, { 
                                icon: '🚨',
                                style: { background: '#1e293b', color: '#fff', border: '1px solid #ef4444' }
                            });
                        }
                    } catch (err) {
                        console.error('[RCR Critical] Dispatch Fail Error:', err);
                    }
                });

                socket.on('incident.status-updated', (payload) => {
                    if (!payload || typeof payload !== 'object') return;
                    try {
                        if (isMounted && payload.incident) {
                            setIncidents(prev => prev.map(inc => 
                                inc.id === payload.incident.id ? payload.incident : inc
                            ));
                            if (selectedIncident?.id === payload.incident.id) {
                                setSelectedIncident(payload.incident);
                            }
                        }
                    } catch (err) {
                        console.error('[RCR Critical] Dispatch Fail Error:', err);
                    }
                });
            } catch (err) {
                console.error('Tactical Dashboard Init Failed', err);
            }
        };

        init();
        return () => {
            isMounted = false;
            socket?.off('incident.created');
            socket?.off('incident.status-updated');
        };
    }, [selectedIncident?.id]);

    const emitEmergencySignal = async (data) => {
        setIsDispatching(true);
        const toastId = toast.loading('Initiating Emergency Protocol...');

        try {
            await emitWithTimeout('emergency_signal', data, 5000);
            toast.success('Signal Acknowledged', { id: toastId });
        } catch (err) {
            console.error('[RCR Critical] Dispatch Timeout/Error:', err.message);
            toast.error(err.message.includes('TIMEOUT') ? 'Network Timeout: Response Pending' : 'Dispatch Failure', { id: toastId });
        } finally {
            setIsDispatching(false);
        }
    };

    return (
        <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 relative">
            <div className="scanline-overlay"></div>
            
            {/* Header / HUD Bar - Hidden on mobile for native feel */}
            <header className="hidden md:flex h-16 border-b border-white/10 bg-black/40 backdrop-blur-lg items-center px-6 justify-between shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-500/10 border border-red-500/30">
                        <ShieldAlert className="text-red-500 animate-pulse" size={20} />
                    </div>
                    <h1 className="text-xl font-black tracking-tighter uppercase italic text-glow-red">RCR :: Command_Center</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Grid_Uptime: 99.9%</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 bg-white/5 px-3 py-1 border border-white/10 uppercase tracking-widest">
                        Status: {isDispatching ? 'UPLINKING...' : 'READY'}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 lg:grid lg:grid-cols-12 lg:gap-0 overflow-hidden relative">
                
                {/* Tactical Map Container */}
                <main className={`lg:col-span-9 h-full bg-slate-900 relative overflow-hidden transition-all duration-500 ${activeTab !== 'MAP' ? 'hidden lg:block' : 'block'}`}>
                    <TacticalMap 
                        incidents={incidents} 
                        selectedIncident={selectedIncident}
                        onSelectIncident={setSelectedIncident}
                    />
                    
                    {/* Floating Tactical Overlay (Mobile + Desktop) */}
                    <div className="absolute top-6 left-6 p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-none pointer-events-none z-20">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Live_Grid_Alpha</span>
                        </div>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Telemetry: active_sync</p>
                    </div>

                    {/* SOS FAB - Visible only in MAP mode on mobile, always in center on desktop */}
                    <div className="absolute bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-20 w-[90%] lg:w-auto px-4">
                        <button 
                            onClick={() => emitEmergencySignal({ type: 'SOS_BROADCAST' })}
                            disabled={isDispatching}
                            className="w-full lg:w-auto min-h-[64px] lg:min-h-[56px] bg-red-600 hover:bg-red-500 disabled:bg-slate-800 transition-all font-black uppercase text-sm lg:text-xs tracking-[0.3em] px-12 shadow-neon-red active:scale-[0.98] border-none flex items-center justify-center gap-4 group rounded-none lg:rounded-none"
                        >
                            <ShieldAlert size={24} className="animate-pulse" />
                            {isDispatching ? 'EXECUTING...' : 'EXECUTE_SOS_PROTOCOL'}
                        </button>
                    </div>
                </main>

                {/* Sidebar Container (Feed & AI Command) */}
                <aside className={`lg:col-span-3 flex flex-col bg-slate-950 lg:bg-slate-950/60 backdrop-blur-2xl lg:border-l border-white/10 overflow-hidden h-full transition-all duration-500 ${activeTab === 'MAP' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-0">
                        {activeTab === 'FEED' || window.innerWidth >= 1024 ? (
                            <IntelFeed 
                                incidents={incidents} 
                                onSelectIncident={(inc) => {
                                    setSelectedIncident(inc);
                                    if (window.innerWidth < 1024) setActiveTab('COMMAND');
                                }} 
                            />
                        ) : null}
                        
                        {(activeTab === 'COMMAND' || window.innerWidth >= 1024) && (
                            <div className="mt-4 lg:mt-0">
                                <div className="h-px bg-white/10 w-full my-4 hidden lg:block" />
                                <AICommand selectedIncident={selectedIncident} />
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Mobile Bottom Navigation (Glassmorphism) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center z-[60] px-6">
                <button 
                    onClick={() => setActiveTab('MAP')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'MAP' ? 'text-cyan-400' : 'text-slate-500'}`}
                >
                    <MapIcon size={24} className={activeTab === 'MAP' ? 'text-glow-cyan' : ''} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Tactical_Map</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('FEED')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'FEED' ? 'text-cyan-400' : 'text-slate-500'}`}
                >
                    <div className="relative">
                        <List size={24} />
                        {incidents.filter(i => i.status === 'REPORTED').length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-neon-red" />
                        )}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Intel_Feed</span>
                </button>

                <button 
                    onClick={() => setActiveTab('COMMAND')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'COMMAND' ? 'text-cyan-400' : 'text-slate-500'}`}
                >
                    <Cpu size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">AI_Command</span>
                </button>
            </nav>
        </div>
    );
};

export default TacticalDashboard;
