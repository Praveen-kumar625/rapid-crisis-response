import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { getSocket } from '../socket';
import {
    PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle2, Zap, Target, TrendingUp, Info, ArrowRight } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Section } from '../components/layout/Section';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

function computeAggregates(incidents) {
    const categoryCounts = {};
    const severityCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const timelineData = {};

    incidents.forEach((inc) => {
        const cat = inc.category || 'UNKNOWN';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        const sev = inc.severity || 1;
        severityCounts[sev] = (severityCounts[sev] || 0) + 1;

        const date = new Date(inc.createdAt).toLocaleDateString();
        timelineData[date] = (timelineData[date] || 0) + 1;
    });

    return {
        categoryData: Object.entries(categoryCounts).map(([category, count]) => ({ category, count })),
        severityData: Object.entries(severityCounts).map(([severity, value]) => ({ name: `Lvl ${severity}`, value })),
        timelineData: Object.entries(timelineData).map(([date, count]) => ({ date, count }))
    };
}

const COLORS = ['#0D9488', '#00f0ff', '#F59E0B', '#f97316', '#ff3366'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-navy-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{payload[0].name || payload[0].payload.category || payload[0].payload.date}</p>
                <p className="text-white font-black text-lg">{payload[0].value} <span className="text-[10px] opacity-50 uppercase tracking-tighter">Reports</span></p>
            </div>
        );
    }
    return null;
};

function Dashboard() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const stats = useMemo(() => computeAggregates(incidents), [incidents]);
    const [pulses, setPulses] = useState({});
    const [selectedGuest, setSelectedGuest] = useState(null);

    useEffect(() => {
        api.get('/incidents').then(({ data }) => {
            setIncidents(data);
        }).catch(console.error);

        let isMounted = true;
        let socketInstance = null;

        const handlePulse = (data) => {
            setPulses(prev => ({ ...prev, [data.userId]: data }));
        };

        const handleIncidentCreated = (payload) => {
            setIncidents(prev => [payload.incident, ...prev]);
        };

        (async() => {
            socketInstance = await getSocket();
            if (!isMounted) return;
            socketInstance.on('user.safety-pulse', handlePulse);
            socketInstance.on('incident.created', handleIncidentCreated);
        })();

        return () => {
            isMounted = false;
            if (socketInstance) {
                socketInstance.off('user.safety-pulse', handlePulse);
                socketInstance.off('incident.created', handleIncidentCreated);
            }
        };
    }, []);

    const criticalCount = incidents.filter(i => i.severity >= 4).length;
    const activeCount = incidents.filter(i => i.status !== 'CLOSED' && i.status !== 'RESOLVED').length;

    return (
        <div className="flex-1 w-full relative">
            <Section className="pt-12 pb-24">
                <Container>
                    {/* DASHBOARD HEADER */}
                    <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Badge variant="secondary" className="px-3 py-1.5 border-secondary/30 text-secondary bg-secondary/10">
                                    <Zap size={12} className="animate-pulse" /> Live Operational View
                                </Badge>
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tight">Intelligence <span className="text-gradient-accent">Terminal</span></h2>
                            <p className="text-slate-500 font-mono text-[10px] tracking-[0.3em] uppercase mt-3">Node: DC-EAST-01 {'//'} Auth: Administrator</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Signal', val: incidents.length, color: 'text-white', link: '/map' },
                                { label: 'Active Crisis', val: activeCount, color: 'text-accent', link: '/map' },
                                { label: 'L5 Critical', val: criticalCount, color: 'text-danger', link: '/map' },
                                { label: 'Uptime', val: '99.9%', color: 'text-secondary', link: null },
                            ].map((s, i) => (
                                <Card 
                                    key={i} 
                                    variant="panel" 
                                    className={`px-6 py-4 flex flex-col items-center justify-center min-w-[120px] border-white/5 transition-all duration-300 ${s.link ? 'hover:bg-white/5 hover:scale-105 cursor-pointer active:scale-95' : ''}`}
                                    onClick={() => s.link && navigate(s.link)}
                                    role={s.link ? "button" : "presentation"}
                                    aria-label={s.link ? `View ${s.label}` : undefined}
                                >
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</span>
                                    <span className={`text-xl font-black font-mono ${s.color}`}>{s.val}</span>
                                </Card>
                            ))}
                        </div>
                    </header>

                    {/* TOP GRID: PULSE + ANALYTICS */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                        
                        {/* Guest Accountability Pulse */}
                        <Card className="lg:col-span-4 p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Target size={80} className="text-emerald" />
                            </div>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald" /> Guest Accountability
                                </h3>
                                <span className="text-[10px] font-mono text-emerald animate-pulse">SYNCING...</span>
                            </div>
                            
                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-4">
                                {Object.values(pulses).length > 0 ? Object.values(pulses).map(p => (
                                    <button 
                                        key={p.userId} 
                                        className={`aspect-square rounded-2xl flex items-center justify-center text-xs font-black text-white transition-all transform hover:scale-110 hover:-translate-y-1 shadow-lg border-2 outline-none focus:ring-2 focus:ring-electric ${
                                            p.status === 'SAFE' ? 'bg-emerald/10 border-emerald shadow-emerald/20' : 'bg-danger/20 border-danger animate-pulse shadow-danger/40'
                                        }`} 
                                        title={`${p.name}: ${p.status}`}
                                        onClick={() => setSelectedGuest(p)}
                                    >
                                        {p.name[0].toUpperCase()}
                                    </button>
                                )) : (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed border-white/5 rounded-3xl">
                                        <Activity size={32} className="text-slate-500 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-loose">Awaiting Guest <br />Pulse Signals</p>
                                    </div>
                                )}
                            </div>

                            {/* Mini Pulse Detail Overlay */}
                            {selectedGuest && (
                                <div className="absolute inset-0 bg-navy-900/95 backdrop-blur-md p-8 flex flex-col justify-center animate-in fade-in duration-300 z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant={selectedGuest.status === 'SAFE' ? 'emerald' : 'danger'}>{selectedGuest.status}</Badge>
                                        <button onClick={() => setSelectedGuest(null)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                                    </div>
                                    <h4 className="text-xl font-black text-white uppercase tracking-tight mb-1">{selectedGuest.name}</h4>
                                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6">User ID: {selectedGuest.userId.substring(0,8)}...</p>
                                    <Button size="sm" variant="secondary" className="w-full text-[10px] py-3" onClick={() => setSelectedGuest(null)}>Dismiss Info</Button>
                                </div>
                            )}
                        </Card>

                        {/* Severity Distribution */}
                        <Card className="lg:col-span-4 p-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-amber" /> Severity Matrix
                            </h3>
                            <div className="h-[280px] lg:h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={stats.severityData} 
                                            innerRadius={70} 
                                            outerRadius={95} 
                                            paddingAngle={5} 
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {stats.severityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Trend Analysis */}
                        <Card className="lg:col-span-4 p-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-2">
                                <TrendingUp size={16} className="text-electric" /> Incident Velocity
                            </h3>
                            <div className="h-[280px] lg:h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.timelineData}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="count" stroke="#00f0ff" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* LIVE INCIDENT FEED */}
                    <Card className="overflow-hidden border-t-2 border-t-white/10 shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                    <Activity size={20} className="text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Live Incident Stream</h3>
                                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Real-time asynchronous updates enabled</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald/10 border border-emerald/20 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-emerald animate-pulse"></span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald">System Secure {'//'} All Nodes Active</span>
                            </div>
                        </div>

                        {/* DESKTOP TABLE VIEW */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-navy-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                        <th className="px-8 py-5 border-b border-white/5">Signal Status</th>
                                        <th className="px-8 py-5 border-b border-white/5">Identifier & Category</th>
                                        <th className="px-8 py-5 border-b border-white/5">Indoor Coordinates</th>
                                        <th className="px-8 py-5 border-b border-white/5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {incidents.slice(0, 15).map((inc) => (
                                        <tr 
                                            key={inc.id} 
                                            className="hover:bg-white/[0.03] transition-all group cursor-pointer"
                                            onClick={() => navigate(`/incidents/${inc.id}`)}
                                        >
                                            <td className="px-8 py-6">
                                                <Badge 
                                                    variant={inc.status === 'OPEN' ? 'danger' : inc.status === 'IN_PROGRESS' ? 'amber' : 'emerald'}
                                                    className="group-hover:scale-105 transition-transform"
                                                >
                                                    {inc.status}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-slate-100 font-bold uppercase tracking-tight text-sm group-hover:text-electric transition-colors">{inc.title}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">{inc.category}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${inc.severity >= 4 ? 'text-danger' : 'text-slate-400'}`}>Lvl {inc.severity} Assessment</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-slate-200 text-xs font-mono font-bold uppercase">Wing {inc.wingId} {'//'} LVL {inc.floorLevel}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">ROOM_ID: {inc.roomNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 text-slate-500 group-hover:text-electric transition-all text-[10px] font-black uppercase tracking-widest">
                                                    View Intel <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARD VIEW */}
                        <div className="md:hidden divide-y divide-white/5">
                            {incidents.slice(0, 15).map((inc) => (
                                <Link 
                                    key={inc.id} 
                                    to={`/incidents/${inc.id}`}
                                    className="block p-6 hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant={inc.status === 'OPEN' ? 'danger' : inc.status === 'IN_PROGRESS' ? 'amber' : 'emerald'}>
                                            {inc.status}
                                        </Badge>
                                        <span className="text-[10px] font-mono text-slate-500">
                                            {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-tight mb-2 group-hover:text-electric transition-colors">{inc.title}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Wing {inc.wingId} {'//'} L{inc.floorLevel}</span>
                                        <div className="flex items-center gap-1 text-electric text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                            Open <ArrowRight size={10} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {incidents.length === 0 && (
                            <div className="px-8 py-20 text-center text-slate-600 italic text-sm font-light">
                                No incident signals currently detected in this hotel sector.
                            </div>
                        )}
                    </Card>
                </Container>
            </Section>
        </div>
    );
}

const X = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default Dashboard;
