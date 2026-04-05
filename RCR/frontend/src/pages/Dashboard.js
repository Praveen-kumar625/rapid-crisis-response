import React, { useEffect, useState } from 'react';
import api from '../api';
import { getSocket } from '../socket';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { ShieldAlert, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

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
        severityData: Object.entries(severityCounts).map(([severity, value]) => ({ name: `Level ${severity}`, value })),
        timelineData: Object.entries(timelineData).map(([date, count]) => ({ date, count }))
    };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#ff3366'];

function CustomTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-navy-800/90 backdrop-blur-md border border-surfaceBorder p-4 rounded-xl shadow-2xl">
                <p className="text-slate-200 text-xs font-bold mb-1">{payload[0].name || payload[0].payload.category}</p>
                <p className="text-electric font-mono font-bold text-lg">{payload[0].value} <span className="text-slate-400 text-xs font-sans font-medium uppercase tracking-wider">Reports</span></p>
            </div>
        );
    }
    return null;
}

function Dashboard() {
    const [incidents, setIncidents] = useState([]);
    const [stats, setStats] = useState({ categoryData: [], severityData: [], timelineData: [] });
    const [pulses, setPulses] = useState({});

    useEffect(() => {
        api.get('/incidents').then(({ data }) => {
            setIncidents(data);
            setStats(computeAggregates(data));
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

    const totalIncidents = incidents.length;
    const criticalCount = incidents.filter(i => i.severity === 5).length;
    const activeCount = incidents.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;

    return (
        <div className="flex-1 w-full p-6 lg:p-10 max-w-[1600px] mx-auto relative z-10">
            {/* Header Stats */}
            <header className="mb-10 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
                <div>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase text-slate-100 flex items-center gap-3">
                        <Activity className="text-electric" size={36} strokeWidth={2.5} />
                        Intelligence <span className="text-electric">Command</span>
                    </h2>
                    <p className="text-slate-400 font-mono tracking-[0.15em] uppercase text-[11px] mt-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald animate-pulse"></span>
                        Real-time Analytics & Resolution Sync
                    </p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="glass-card p-5 min-w-[140px] flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 w-full h-1 bg-electric"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Reports</p>
                        <p className="text-3xl font-black text-slate-100 font-mono">{totalIncidents}</p>
                    </div>
                    <div className="glass-card p-5 min-w-[140px] flex flex-col items-center justify-center relative overflow-hidden bg-danger/5 border-danger/20">
                        <div className="absolute top-0 w-full h-1 bg-danger"></div>
                        <p className="text-[10px] font-bold text-danger uppercase tracking-widest mb-2">Critical (L5)</p>
                        <p className="text-3xl font-black text-danger font-mono">{criticalCount}</p>
                    </div>
                    <div className="glass-card p-5 min-w-[140px] flex flex-col items-center justify-center relative overflow-hidden bg-amber/5 border-amber/20">
                        <div className="absolute top-0 w-full h-1 bg-amber"></div>
                        <p className="text-[10px] font-bold text-amber uppercase tracking-widest mb-2">Active</p>
                        <p className="text-3xl font-black text-amber font-mono">{activeCount}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
                {/* Safety Pulse Tracker */}
                <div className="glass-card p-6 lg:p-8 relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald" />
                            Guest Accountability
                        </h3>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald"></span>
                        </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-3">
                        {Object.values(pulses).length > 0 ? Object.values(pulses).map(p => (
                            <div key={p.userId} className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold text-white transition-all transform hover:scale-110 shadow-lg border ${
                                p.status === 'SAFE' ? 'bg-emerald/20 border-emerald shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-danger/20 border-danger shadow-[0_0_15px_rgba(255,51,102,0.4)] animate-pulse'
                            }`} title={p.name}>
                                {p.name[0]?.toUpperCase()}
                            </div>
                        )) : (
                            <div className="col-span-full py-10 flex flex-col items-center justify-center text-center opacity-50">
                                <Activity size={32} className="text-slate-500 mb-3" />
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Waiting for guest <br/>pulse signals...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Severity Pie */}
                <div className="glass-card p-6 lg:p-8">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300 mb-6 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber" />
                        Severity Distribution
                    </h3>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.severityData} innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                    {stats.severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Bar */}
                <div className="glass-card p-6 lg:p-8">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300 mb-6 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-cyan" />
                        Incident Categories
                    </h3>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <XAxis dataKey="category" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(0, 3)} />
                                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)', radius: 8}} />
                                <Bar dataKey="count" fill="#00f0ff" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Latest Incidents Table */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-surfaceBorder flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-200 flex items-center gap-2">
                        <Clock size={18} className="text-slate-400" />
                        Live Incident Feed
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald/10 border border-emerald/30 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald">System Active</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-navy-900/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">Location</th>
                                <th className="px-6 py-4 font-medium">Triage AI</th>
                                <th className="px-6 py-4 font-medium text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surfaceBorder">
                            {incidents.slice(0, 10).map((inc) => (
                                <tr key={inc.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                            inc.status === 'OPEN' ? 'bg-danger/10 text-danger border-danger/30 shadow-[0_0_10px_rgba(255,51,102,0.2)]' : 
                                            inc.status === 'IN_PROGRESS' ? 'bg-amber/10 text-amber border-amber/30' :
                                            'bg-emerald/10 text-emerald border-emerald/30'
                                        }`}>
                                            {inc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-slate-200 font-medium group-hover:text-electric transition-colors uppercase tracking-wide text-sm">{inc.title}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest bg-navy-900 px-2 py-0.5 rounded">{inc.category}</span>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${inc.severity >= 4 ? 'text-danger' : 'text-amber'}`}>Level {inc.severity}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-300 text-xs font-mono">Wing {inc.wingId}</span>
                                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Fl {inc.floorLevel} • Rm {inc.roomNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-[9px] font-black text-cyan border border-cyan/20 px-2 py-1 rounded bg-cyan/5 uppercase tracking-widest">{inc.triageMethod || 'Cloud Gemini'}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right text-slate-400 text-[11px] font-mono">
                                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                            {incidents.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-sm font-medium italic">
                                        No active incidents reported.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
