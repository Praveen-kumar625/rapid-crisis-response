// frontend/src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import api from '../api';
import { getSocket } from '../socket';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, 
    ResponsiveContainer
} from 'recharts';

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

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1'];

function Dashboard() {
    const [incidents, setIncidents] = useState([]);
    const [stats, setStats] = useState({ categoryData: [], severityData: [], timelineData: [] });
    const [pulses, setPulses] = useState({});

    useEffect(() => {
        api.get('/incidents').then(({ data }) => {
            setIncidents(data);
            setStats(computeAggregates(data));
        }).catch(console.error);

        let socketRef = null;
        const handlePulse = (data) => {
            setPulses(prev => ({ ...prev, [data.userId]: data }));
        };

        const handleIncidentCreated = (payload) => {
            setIncidents(prev => [payload.incident, ...prev]);
        };

        (async() => {
            socketRef = await getSocket();
            socketRef.on('user.safety-pulse', handlePulse);
            socketRef.on('incident.created', handleIncidentCreated);
        })();

        return () => {
            if (socketRef) {
                socketRef.off('user.safety-pulse', handlePulse);
                socketRef.off('incident.created', handleIncidentCreated);
            }
        };
    }, []);

    return (
        <div className="p-8 bg-[#f8fafc] min-h-screen font-sans">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black tracking-tight uppercase text-slate-900">Intelligence <span className="text-red-600">Command</span></h2>
                    <p className="text-slate-500 font-medium tracking-widest uppercase text-[10px] mt-2">Real-time Crisis Analytics & Resolution Tracking</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[120px]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Reports</p>
                        <p className="text-2xl font-black text-slate-900">{incidents.length}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100 text-center min-w-[120px]">
                        <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Critical (L5)</p>
                        <p className="text-2xl font-black text-red-600">{incidents.filter(i => i.severity === 5).length}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Safety Pulse Tracker */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4">
                        <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Guest Accountability</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {Object.values(pulses).length > 0 ? Object.values(pulses).map(p => (
                            <div key={p.userId} className={`h-12 rounded-xl flex items-center justify-center text-[10px] font-black text-white transition-all transform hover:scale-110 shadow-lg ${
                                p.status === 'SAFE' ? 'bg-green-500' : 'bg-red-600 animate-pulse'
                            }`} title={p.name}>
                                {p.name[0]}
                            </div>
                        )) : (
                            <div className="col-span-4 py-12 text-center">
                                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Waiting for guest <br/>pulse signals...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Severity Pie */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Severity Distribution</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.severityData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {stats.severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Bar */}
                <div className="bg-[#0f172a] p-8 rounded-[2rem] shadow-xl text-white">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6">Incident Categories</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.categoryData}>
                                <XAxis dataKey="category" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px'}} />
                                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Latest Incidents Table */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center text-white bg-[#0f172a]">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Live Incident Feed</h3>
                    <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]">● ACTIVE SYSTEM</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Incident Details</th>
                                <th className="px-8 py-4">Indoor Location</th>
                                <th className="px-8 py-4">Triage Engine</th>
                                <th className="px-8 py-4">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {incidents.slice(0, 10).map((inc) => (
                                <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors group border-l-4 border-transparent hover:border-red-500">
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                                            inc.status === 'OPEN' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                                        }`}>{inc.status}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-slate-900 font-bold group-hover:text-red-600 transition-colors uppercase tracking-tight">{inc.title}</p>
                                        <p className="text-slate-400 text-[10px] font-black uppercase mt-1 tracking-widest">{inc.category} • SEVERITY {inc.severity}</p>
                                    </td>
                                    <td className="px-8 py-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                        WING {inc.wingId} • FL {inc.floorLevel} • RM {inc.roomNumber}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[9px] font-black text-slate-400 border border-slate-200 px-3 py-1 rounded-lg uppercase tracking-tighter bg-white group-hover:border-slate-900 transition-all">{inc.triageMethod || 'CLOUD AI'}</span>
                                    </td>
                                    <td className="px-8 py-6 text-slate-400 text-[10px] font-mono">
                                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
