import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    ShieldAlert, 
    Clock, 
    AlertTriangle, 
    Zap, 
    ChevronLeft,
    Navigation,
    Activity
} from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';
import { Container } from '../components/layout/Container';
import { Section } from '../components/layout/Section';
import { Card } from '../components/ui/Card';
import StatusBadge from '../components/StatusBadge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

function IncidentDetail() {
    const { id } = useParams();
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchIncident = async () => {
            try {
                const { data } = await api.get(`/incidents/${id}`);
                if (isMounted) {
                    setIncident(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to fetch incident intel', err);
                if (isMounted) {
                    toast.error('Failed to load intelligence data');
                    setLoading(false);
                }
            }
        };
        fetchIncident();

        let socketInstance = null;
        const handleUpdate = (payload) => {
            if (payload.incident.id === id && isMounted) {
                setIncident(payload.incident);
            }
        };

        (async() => {
            socketInstance = await getSocket();
            if (!isMounted) return;
            socketInstance.on('incident.status-updated', handleUpdate);
        })();

        return () => {
            isMounted = false;
            if (socketInstance) socketInstance.off('incident.status-updated', handleUpdate);
        };
    }, [id]);

    const updateStatus = async (newStatus) => {
        try {
            await api.patch(`/incidents/${id}/status`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return (
        <div className="flex-1 w-full bg-[#0B0F19] pb-24 pt-8 lg:pt-12">
            <Container>
                <Skeleton className="h-4 w-32 mb-10 bg-slate-800" />
                <Card className="p-8 lg:p-12 mb-8 bg-[#151B2B] border-slate-800">
                    <Skeleton className="h-12 w-3/4 mb-8 bg-slate-800" />
                    <Skeleton className="h-4 w-full bg-slate-800" />
                </Card>
            </Container>
        </div>
    );

    if (!incident) return (
        <div className="flex-1 flex items-center justify-center bg-[#0B0F19]">
            <div className="text-center">
                <ShieldAlert size={48} className="text-red-500 mx-auto mb-6 opacity-50 shadow-neon-red" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4 italic">Intel Not Found</h2>
                <Link to="/dashboard">
                    <Button variant="secondary">Return to Command Center</Button>
                </Link>
            </div>
        </div>
    );

    const isCritical = incident.severity >= 4;

    return (
        <div className="flex-1 w-full relative pb-24 bg-[#0B0F19]">
            <Section className="pt-6 lg:pt-12">
                <Container>
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors mb-8 lg:mb-10 font-mono">
                        <ChevronLeft size={14} /> BACK_TO_OPERATIONAL_FEED
                    </Link>

                    <Card className={`p-6 lg:p-12 mb-8 border-t-4 bg-[#151B2B] rounded-none shadow-tactical border-slate-800 relative overflow-hidden ${isCritical ? 'border-t-red-600' : 'border-t-cyan-600'}`}>
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none text-white">
                            <ShieldAlert size={300} strokeWidth={1} />
                        </div>

                        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 relative z-10">
                            <div className="w-full lg:max-w-3xl">
                                <div className="flex flex-wrap gap-2 lg:gap-3 mb-6">
                                    <div className={`px-3 py-1.5 text-[10px] font-black font-mono border flex items-center gap-2 ${isCritical ? 'bg-red-600 text-white border-red-400' : 'bg-slate-800 text-cyan-400 border-slate-700'}`}>
                                        {isCritical && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                                        PRIORITY_LVL_{incident.severity}
                                    </div>
                                    <div className="bg-[#0B0F19] text-slate-400 border border-slate-800 px-3 py-1.5 text-[10px] font-black uppercase font-mono tracking-widest">
                                        CAT_{incident.category}
                                    </div>
                                    <StatusBadge status={incident.status} />
                                </div>
                                <h1 className="text-3xl lg:text-6xl font-black tracking-tighter text-white uppercase leading-[1.1] mb-6 font-mono italic">
                                    {incident.title}
                                </h1>
                                <p className="text-base lg:text-xl text-slate-400 font-light leading-relaxed max-w-2xl">
                                    {incident.description}
                                </p>
                            </div>

                            <div className="w-full lg:w-64 flex flex-col gap-4 bg-black/20 p-6 border border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 font-mono">Command_Auth</p>
                                <div className="flex flex-col gap-3">
                                    {incident.status === 'OPEN' && (
                                        <button onClick={() => updateStatus('IN_PROGRESS')} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black py-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-neon-cyan">DEPLOY_RESPONSE</button>
                                    )}
                                    {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                                        <button onClick={() => updateStatus('RESOLVED')} className="w-full bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 py-3 text-[10px] font-black uppercase tracking-widest transition-all">RESOLVE_SIGNAL</button>
                                    )}
                                    <button onClick={() => updateStatus('CLOSED')} className="w-full bg-[#0B0F19] border border-slate-800 text-slate-500 hover:text-red-500 py-3 text-[10px] font-black uppercase tracking-widest transition-all">CLOSE_TICKET</button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="p-6 lg:p-10 bg-[#151B2B] border-slate-800 rounded-none shadow-tactical relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-cyan-600/10 flex items-center justify-center border border-cyan-500/30"><Zap size={20} className="text-cyan-400" /></div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white font-mono">AI_Intelligence_Report</h3>
                                        <p className="text-[9px] font-mono text-slate-500 uppercase mt-1 tracking-widest">Engine: {incident.triageMethod || 'CLOUD_GEMINI_V1'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div>
                                            <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2 font-mono"><Activity size={12} className="text-cyan-400" /> PREDICTED_CATEGORY</p>
                                            <p className="text-2xl font-black text-white uppercase tracking-tight font-mono italic tabular-nums">{incident.hospitality_category || incident.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2 font-mono"><AlertTriangle size={12} className="text-amber-500" /> RISK_ASSESSMENT</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-3xl font-black text-white font-mono tabular-nums">{incident.auto_severity || incident.severity}<span className="text-slate-600 text-sm">/5</span></span>
                                                <div className="flex-1 flex gap-1.5 h-1.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (<div key={s} className={`flex-1 ${s <= (incident.auto_severity || incident.severity) ? (isCritical ? 'bg-red-600 shadow-neon-red' : 'bg-cyan-500 shadow-neon-cyan') : 'bg-slate-800'}`} />))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6 bg-black/30 p-6 border border-slate-800">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-4 font-mono">Resolution_Plan</h4>
                                        <div className="space-y-4">
                                            {incident.ai_action_plan ? incident.ai_action_plan.split('\n').map((step, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <span className="text-cyan-500 font-mono font-bold text-xs">{String(i + 1).padStart(2, '0')}</span>
                                                    <p className="text-xs text-slate-300 leading-relaxed font-light">{step}</p>
                                                </div>
                                            )) : <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">Waiting_For_Engine_Analysis...</p>}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {incident.media_url && (
                                <Card className="p-0 overflow-hidden border-slate-800 bg-black rounded-none shadow-tactical">
                                    <div className="p-4 border-b border-slate-800 bg-[#151B2B] text-[9px] font-black uppercase tracking-widest text-cyan-400 font-mono">PRIMARY_SIGNAL_EVIDENCE</div>
                                    {incident.media_type?.startsWith('image/') ? <img src={incident.media_url} alt="Evidence" className="w-full h-auto max-h-[600px] object-contain opacity-90" /> : <video controls src={incident.media_url} className="w-full bg-black max-h-[600px]" />}
                                </Card>
                            )}
                        </div>

                        <div className="space-y-8">
                            <Card className="p-6 lg:p-8 bg-[#151B2B] border-slate-800 rounded-none shadow-tactical">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-2 font-mono"><Navigation size={16} className="text-cyan-400" /> INDOOR_CONTEXT</h3>
                                <div className="space-y-4">
                                    {[ ['SECTOR_WING', incident.wing_id], ['FLOOR_LEVEL', `L_${incident.floor_level}`], ['AREA_ROOM', incident.room_number] ].map(([label, val], idx) => (
                                        <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{label}</span><span className="text-sm font-bold text-white uppercase font-mono tracking-tighter">{val}</span></div>
                                    ))}
                                    <div className="flex justify-between items-center pt-3"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">GPS_COORD</span><span className="text-[10px] font-bold text-slate-400 uppercase font-mono tabular-nums">{(incident.location.coordinates[1]).toFixed(4)}N, {(incident.location.coordinates[0]).toFixed(4)}E</span></div>
                                </div>
                            </Card>

                            <Card className="p-6 lg:p-8 bg-black/20 border-slate-800 rounded-none shadow-none">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-2 font-mono"><Clock size={16} className="text-slate-500" /> OPERATIONAL_LOGS</h3>
                                <div className="space-y-6">
                                    {[ ['REPORTED_BY', incident.reported_by || 'ANONYMOUS_NODE'], ['SIGNAL_RECEIVED', new Date(incident.created_at).toLocaleString([], { hour12: false })], ['LAST_UPDATE', new Date(incident.updated_at).toLocaleString([], { hour12: false })] ].map(([label, val], idx) => (
                                        <div key={idx} className="flex items-start gap-4"><div className="w-1 h-1 bg-cyan-500 mt-1.5 rounded-none shadow-neon-cyan"></div><div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">{label}</p><p className="text-xs font-bold text-slate-200 mt-1 font-mono uppercase tabular-nums">{val}</p></div></div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </Container>
            </Section>
        </div>
    );
}

export default IncidentDetail;