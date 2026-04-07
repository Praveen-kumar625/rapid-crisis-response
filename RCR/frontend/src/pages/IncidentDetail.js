import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    ShieldAlert, 
    Clock, 
    Cpu, 
    AlertTriangle, 
    Zap, 
    CheckCircle2, 
    ChevronLeft,
    Navigation,
    User,
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
            if (socketInstance) {
                socketInstance.off('incident.status-updated', handleUpdate);
            }
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
        <div className="flex-1 w-full bg-navy-950 pb-24 pt-8 lg:pt-12">
            <Container>
                <div className="flex items-center gap-2 mb-10">
                    <Skeleton className="h-3 w-4" />
                    <Skeleton className="h-3 w-32" />
                </div>
                
                <Card className="p-8 lg:p-12 mb-8">
                    <div className="flex gap-3 mb-8">
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-12 lg:h-16 w-3/4 mb-8" />
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full opacity-50" />
                        <Skeleton className="h-4 w-5/6 opacity-30" />
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-[400px] w-full" />
                        <Skeleton className="h-[300px] w-full opacity-50" />
                    </div>
                    <div className="space-y-8">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-48 w-full opacity-50" />
                        <Skeleton className="h-40 w-full opacity-30" />
                    </div>
                </div>
            </Container>
        </div>
    );

    if (!incident) return (
        <div className="flex-1 flex items-center justify-center bg-navy-950">
            <div className="text-center">
                <ShieldAlert size={48} className="text-danger mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Intel Not Found</h2>
                <Link to="/dashboard">
                    <Button variant="secondary">Return to Command Center</Button>
                </Link>
            </div>
        </div>
    );

    const isCritical = incident.severity >= 4;

    return (
        <div className="flex-1 w-full relative pb-24 bg-slate-950">
            <Section className="pt-6 lg:pt-12">
                <Container>
                    
                    {/* Breadcrumbs / Back */}
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-500 transition-colors mb-8 lg:mb-10 group font-mono">
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        BACK_TO_OPERATIONAL_FEED
                    </Link>

                    {/* Incident Header Card */}
                    <Card className="p-6 lg:p-12 mb-8 border-t-4 border-t-red-600 bg-slate-900 rounded-none shadow-none border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none text-red-500">
                            <ShieldAlert size={300} strokeWidth={1} />
                        </div>

                        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 relative z-10">
                            <div className="w-full lg:max-w-3xl">
                                <div className="flex flex-wrap gap-2 lg:gap-3 mb-6">
                                    <div className={`px-3 py-1.5 text-[9px] lg:text-[10px] font-black font-mono border-2 flex items-center gap-2 ${isCritical ? 'bg-red-950 text-red-500 border-red-800' : 'bg-cyan-950 text-cyan-500 border-cyan-800'}`}>
                                        {isCritical && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                        PRIORITY_LVL_{incident.severity}
                                    </div>
                                    <div className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1.5 text-[9px] lg:text-[10px] font-black uppercase font-mono tracking-widest">
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
                                        <button 
                                            onClick={() => updateStatus('IN_PROGRESS')}
                                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-black py-3 text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            DEPLOY_RESPONSE
                                        </button>
                                    )}
                                    {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                                        <button 
                                            onClick={() => updateStatus('RESOLVED')}
                                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 py-3 text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            RESOLVE_SIGNAL
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => updateStatus('CLOSED')}
                                        className="w-full bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-500 py-3 text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        CLOSE_TICKET
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Column 1: AI Triage Intel */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* AI Analysis Result */}
                            <Card className="p-6 lg:p-10 bg-slate-900 border-slate-700 rounded-none shadow-none relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                                    <Cpu size={80} className="text-cyan-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-cyan-900/20 flex items-center justify-center border border-cyan-800 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                        <Zap size={20} className="text-cyan-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white font-mono">AI_Intelligence_Report</h3>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase mt-1 tracking-widest">Engine: {incident.triageMethod || 'CLOUD_GEMINI_V1'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div>
                                            <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2 font-mono">
                                                <Activity size={12} className="text-cyan-500" /> PREDICTED_CATEGORY
                                            </p>
                                            <p className="text-2xl font-black text-white uppercase tracking-tight font-mono italic">{incident.hospitality_category || incident.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2 font-mono">
                                                <AlertTriangle size={12} className="text-amber-500" /> RISK_ASSESSMENT
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-3xl font-black text-white font-mono">{incident.auto_severity || incident.severity}<span className="text-slate-600 text-sm">/5</span></span>
                                                <div className="flex-1 flex gap-1.5 h-1.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <div 
                                                            key={s} 
                                                            className={`flex-1 ${s <= (incident.auto_severity || incident.severity) ? (isCritical ? 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]') : 'bg-slate-800'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2 font-mono">
                                                <CheckCircle2 size={12} className="text-emerald-500" /> SPAM_PROBABILITY
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl font-black text-white font-mono">{((incident.spam_score || 0) * 100).toFixed(1)}%</span>
                                                <div className="flex-1 bg-slate-800 h-1 rounded-none overflow-hidden">
                                                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(incident.spam_score || 0) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 bg-black/30 p-6 lg:p-8 border border-slate-800">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-4 font-mono">Resolution_Plan</h4>
                                        <div className="space-y-4">
                                            {incident.ai_action_plan ? incident.ai_action_plan.split('\n').map((step, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <span className="text-cyan-500 font-mono font-bold text-xs">{String(i + 1).padStart(2, '0')}</span>
                                                    <p className="text-xs text-slate-300 leading-relaxed font-light">{step}</p>
                                                </div>
                                            )) : (
                                                <p className="text-xs text-slate-500 italic font-mono uppercase tracking-widest opacity-50">Waiting_For_Engine_Analysis...</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Evidence Display */}
                            {incident.media_url && (
                                <Card className="p-0 overflow-hidden relative group border-slate-700 bg-black rounded-none shadow-none">
                                    <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[9px] font-black uppercase tracking-widest text-cyan-500 font-mono">
                                        PRIMARY_SIGNAL_EVIDENCE
                                    </div>
                                    {incident.media_type?.startsWith('image/') ? (
                                        <img 
                                            src={incident.media_url} 
                                            alt="Incident Evidence" 
                                            loading="lazy"
                                            className="w-full h-auto max-h-[600px] object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-700" 
                                        />
                                    ) : (
                                        <video 
                                            controls 
                                            src={incident.media_url} 
                                            className="w-full bg-black max-h-[600px]" 
                                        />
                                    )}
                                </Card>
                            )}
                        </div>

                        {/* Column 2: Context & Metadata */}
                        <div className="space-y-8">
                            
                            {/* Indoor Context */}
                            <Card className="p-6 lg:p-8 bg-slate-900 border-slate-700 rounded-none shadow-none">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-2 font-mono">
                                    <Navigation size={16} className="text-cyan-500" /> INDOR_CONTEXT
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">SECTOR_WING</span>
                                        <span className="text-sm font-bold text-white uppercase font-mono tracking-tighter">{incident.wing_id}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">FLOOR_LEVEL</span>
                                        <span className="text-sm font-bold text-white uppercase font-mono">L_{incident.floor_level}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">AREA_ROOM</span>
                                        <span className="text-sm font-bold text-white uppercase font-mono">{incident.room_number}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">GPS_COORD</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{(incident.location.coordinates[1]).toFixed(4)}N, {(incident.location.coordinates[0]).toFixed(4)}E</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Incident Metadata */}
                            <Card className="p-6 lg:p-8 bg-slate-900/50 border-slate-700 rounded-none shadow-none">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-2 font-mono">
                                    <Clock size={16} className="text-slate-500" /> OPERATIONAL_LOGS
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 bg-cyan-500 mt-1.5 shrink-0"></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">REPORTED_BY</p>
                                            <p className="text-xs font-bold text-white mt-1 flex items-center gap-2 font-mono"><User size={12} className="text-slate-600" /> {incident.reported_by || 'ANONYMOUS_NODE'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 bg-slate-700 mt-1.5 shrink-0"></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">SIGNAL_RECEIVED</p>
                                            <p className="text-[10px] font-bold text-slate-300 mt-1 font-mono uppercase">{new Date(incident.created_at).toLocaleString([], { hour12: false })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 bg-slate-700 mt-1.5 shrink-0"></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">LAST_UPDATE</p>
                                            <p className="text-[10px] font-bold text-slate-300 mt-1 font-mono uppercase">{new Date(incident.updated_at).toLocaleString([], { hour12: false })}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Required Resources */}
                            <Card className="p-6 lg:p-8 bg-slate-900 border-slate-700 rounded-none shadow-none">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-2 font-mono">
                                    <ShieldAlert size={16} className="text-red-500" /> REQUIRED_UNITS
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        try {
                                            const resources = typeof incident.ai_required_resources === 'string' 
                                                ? JSON.parse(incident.ai_required_resources) 
                                                : incident.ai_required_resources;
                                            
                                            if (Array.isArray(resources) && resources.length > 0) {
                                                return resources.map((res, i) => (
                                                    <div key={i} className="bg-red-950/30 text-red-400 border border-red-900 px-2 py-1 text-[9px] font-black uppercase font-mono tracking-widest">{res}</div>
                                                ));
                                            }
                                            return <p className="text-[10px] text-slate-600 italic font-mono uppercase">NO_RESOURCES_REQUIRED</p>;
                                        } catch (e) {
                                            return <p className="text-[10px] text-red-900 italic font-mono uppercase">PARSING_ERROR</p>;
                                        }
                                    })()}
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
