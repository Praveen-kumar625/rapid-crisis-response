import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    ShieldAlert, 
    MapPin, 
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
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
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
                toast.error('Failed to load intelligence data');
                setLoading(false);
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
        <div className="flex-1 flex items-center justify-center bg-navy-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-electric/20 border-t-electric rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Decrypting Intel...</p>
            </div>
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
        <div className="flex-1 w-full relative pb-24">
            <Section className="pt-8 lg:pt-12">
                <Container>
                    
                    {/* Breadcrumbs / Back */}
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-electric transition-colors mb-10 group">
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Operational Feed
                    </Link>

                    {/* Incident Header Card */}
                    <Card className="p-8 lg:p-12 mb-8 border-t-4 border-t-danger relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <ShieldAlert size={200} strokeWidth={1} />
                        </div>

                        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 relative z-10">
                            <div className="max-w-3xl">
                                <div className="flex flex-wrap gap-3 mb-6">
                                    <Badge variant={isCritical ? 'danger' : 'amber'} className="py-1.5 px-3">
                                        {isCritical && <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>}
                                        Priority Level {incident.severity}
                                    </Badge>
                                    <Badge variant="neutral" className="py-1.5 px-3">{incident.category}</Badge>
                                    <Badge variant={incident.status === 'OPEN' ? 'danger' : 'emerald'} className="py-1.5 px-3">Status: {incident.status}</Badge>
                                </div>
                                <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.1] mb-6">
                                    {incident.title}
                                </h1>
                                <p className="text-xl text-slate-400 font-light leading-relaxed">
                                    {incident.description}
                                </p>
                            </div>

                            <div className="w-full lg:w-auto flex flex-col gap-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Command Authorization</p>
                                <div className="grid grid-cols-2 lg:flex lg:flex-col gap-3">
                                    {incident.status === 'OPEN' && (
                                        <Button variant="primary" onClick={() => updateStatus('IN_PROGRESS')}>Deploy Response</Button>
                                    )}
                                    {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                                        <Button variant="secondary" onClick={() => updateStatus('RESOLVED')}>Resolve Signal</Button>
                                    )}
                                    <Button variant="secondary" className="opacity-50 hover:opacity-100" onClick={() => updateStatus('CLOSED')}>Close Ticket</Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Column 1: AI Triage Intel */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* AI Analysis Result */}
                            <Card className="p-8 lg:p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Cpu size={60} className="text-electric" />
                                </div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center border border-electric/20 shadow-electric">
                                        <Zap size={20} className="text-electric" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Edge AI Intelligence Report</h3>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Engine: {incident.triageMethod || 'Distributed Cloud Gemini'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div>
                                            <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2">
                                                <Activity size={12} className="text-electric" /> Predicted Category
                                            </p>
                                            <p className="text-2xl font-black text-white uppercase tracking-tight">{incident.hospitalityCategory || incident.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2">
                                                <AlertTriangle size={12} className="text-amber" /> Risk Assessment
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-3xl font-black text-white font-mono">{incident.auto_severity || incident.severity}<span className="text-slate-600 text-sm">/5</span></span>
                                                <div className="flex-1 flex gap-1.5 h-2">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <div 
                                                            key={s} 
                                                            className={`flex-1 rounded-full ${s <= (incident.auto_severity || incident.severity) ? (isCritical ? 'bg-danger shadow-danger' : 'bg-electric shadow-electric') : 'bg-white/5'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2">
                                                <CheckCircle2 size={12} className="text-emerald" /> Spam Probability
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl font-black text-white font-mono">{((incident.spam_score || 0) * 100).toFixed(1)}%</span>
                                                <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-emerald h-full transition-all duration-1000" style={{ width: `${(incident.spam_score || 0) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8 bg-white/[0.02] p-8 rounded-3xl border border-white/5 shadow-inner">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-electric mb-4">Automated Resolution Plan</h4>
                                        <div className="space-y-4">
                                            {incident.actionPlan ? incident.actionPlan.split('\n').map((step, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <span className="text-electric font-mono font-bold text-xs">{String(i + 1).padStart(2, '0')}</span>
                                                    <p className="text-xs text-slate-300 leading-relaxed font-light">{step}</p>
                                                </div>
                                            )) : (
                                                <p className="text-xs text-slate-500 italic">No automated plan generated for this signal level.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Evidence Display */}
                            {incident.mediaUrl && (
                                <Card className="p-0 overflow-hidden relative group">
                                    <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-navy-950/80 backdrop-blur-md rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-electric">
                                        Primary Signal Evidence
                                    </div>
                                    {incident.mediaType?.startsWith('image/') ? (
                                        <img 
                                            src={incident.mediaUrl} 
                                            alt="Incident Evidence" 
                                            className="w-full h-auto max-h-[600px] object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" 
                                        />
                                    ) : (
                                        <video 
                                            controls 
                                            src={incident.mediaUrl} 
                                            className="w-full bg-black max-h-[600px]" 
                                        />
                                    )}
                                </Card>
                            )}
                        </div>

                        {/* Column 2: Context & Metadata */}
                        <div className="space-y-8">
                            
                            {/* Indoor Context */}
                            <Card className="p-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-2">
                                    <Navigation size={16} className="text-electric" /> Indoor Context
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hotel Wing</span>
                                        <span className="text-sm font-bold text-white uppercase font-mono">{incident.wingId}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Floor Level</span>
                                        <span className="text-sm font-bold text-white uppercase font-mono">L{incident.floorLevel}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Room / Area</span>
                                        <span className="text-sm font-bold text-white uppercase font-mono">{incident.roomNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GPS Coordinates</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase font-mono">{incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Incident Metadata */}
                            <Card className="p-8 bg-white/[0.02]">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-2">
                                    <Clock size={16} className="text-slate-500" /> Operational Logs
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-electric mt-1.5"></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reported By</p>
                                            <p className="text-xs font-bold text-white mt-1 flex items-center gap-2"><User size={12} className="text-slate-600" /> {incident.reportedBy || 'ANONYMOUS_NODE'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5"></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Received</p>
                                            <p className="text-xs font-bold text-white mt-1 font-mono">{new Date(incident.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5"></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Update</p>
                                            <p className="text-xs font-bold text-white mt-1 font-mono">{new Date(incident.updatedAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Required Resources */}
                            <Card className="p-8 border border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-2">
                                    <ShieldAlert size={16} className="text-danger" /> Required Units
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {incident.requiredResources ? (
                                        typeof incident.requiredResources === 'string' 
                                            ? JSON.parse(incident.requiredResources).map((res, i) => (
                                                <Badge key={i} variant="neutral" className="bg-danger/5 border-danger/20 text-danger/80">{res}</Badge>
                                            ))
                                            : incident.requiredResources.map((res, i) => (
                                                <Badge key={i} variant="neutral" className="bg-danger/5 border-danger/20 text-danger/80">{res}</Badge>
                                            ))
                                    ) : (
                                        <p className="text-xs text-slate-500 italic">No resource requirements generated.</p>
                                    )}
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
