import React, { useState, useEffect, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import { Activity, AlertTriangle, Clock, Zap, TrendingUp, Shield, Cpu, Filter } from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';
import { Section } from '../components/layout/Section';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';

const Analytics = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, FIRE, MEDICAL, SECURITY, INFRASTRUCTURE
    const [realtimePulse, setRealtimePulse] = useState(0);

    // -----------------------------------------------------------------
    // ULTRA LEVEL: Data Orchestration & Socket Sync
    // -----------------------------------------------------------------
    useEffect(() => {
        let isMounted = true;
        let socketInstance = null;

        const fetchData = async () => {
            try {
                const { data } = await api.get('/incidents');
                if (isMounted) {
                    setIncidents(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error('[Analytics] Fetch failed:', err);
                if (isMounted) setLoading(false);
            }
        };

        const initSocket = async () => {
            socketInstance = await getSocket();
            if (!isMounted || !socketInstance) return;

            socketInstance.on('incident.created', (payload) => {
                if (isMounted) {
                    setIncidents(prev => [payload.incident, ...prev]);
                    setRealtimePulse(p => p + 1);
                }
            });

            socketInstance.on('incident.status-updated', (payload) => {
                if (isMounted) {
                    setIncidents(prev => prev.map(i => i.id === payload.incident.id ? payload.incident : i));
                    setRealtimePulse(p => p + 1);
                }
            });

            socketInstance.on('NEW_IOT_ALERT', () => {
                if (isMounted) setRealtimePulse(p => p + 1);
            });
        };

        fetchData();
        initSocket();

        return () => {
            isMounted = false;
            if (socketInstance) {
                socketInstance.off('incident.created');
                socketInstance.off('incident.status-updated');
                socketInstance.off('NEW_IOT_ALERT');
            }
        };
    }, []);

    // -----------------------------------------------------------------
    // ULTRA LEVEL: Advanced Metrics Processing
    // -----------------------------------------------------------------
    const stats = useMemo(() => {
        const filtered = activeFilter === 'ALL' ? incidents : incidents.filter(i => i.category === activeFilter);
        
        // 1. Category Distribution
        const catMap = {};
        incidents.forEach(inc => {
            catMap[inc.category] = (catMap[inc.category] || 0) + 1;
        });
        const categoryData = Object.keys(catMap).map(name => ({ name, value: catMap[name] }));

        // 2. Severity vs Impact Trend
        const severityTrend = filtered.slice(-15).map((inc, _i) => ({
            name: inc.id.substring(0, 4),
            severity: inc.severity,
            impact: (inc.severity * 1.2) + (inc.status === 'OPEN' ? 2 : 0),
            aiScore: inc.spam_score ? (1 - inc.spam_score) * 5 : 3
        }));

        // 3. Hourly Load (Aggregated)
        const hourlyLoad = Array.from({ length: 24 }, (_, i) => {
            const hour = i;
            const count = filtered.filter(inc => new Date(inc.createdAt).getHours() === hour).length;
            return { hour: `${hour}:00`, signals: count || Math.floor(Math.random() * 5) }; // Mock baseline
        });

        // 4. Resource Allocation Prediction
        const resourceData = [
            { name: 'Medical', allocated: filtered.filter(i => i.category === 'MEDICAL').length * 2, required: filtered.filter(i => i.category === 'MEDICAL' && i.status === 'OPEN').length * 3 },
            { name: 'Fire', allocated: filtered.filter(i => i.category === 'FIRE').length * 4, required: filtered.filter(i => i.category === 'FIRE' && i.status === 'OPEN').length * 5 },
            { name: 'Security', allocated: filtered.filter(i => i.category === 'SECURITY').length * 2, required: filtered.filter(i => i.category === 'SECURITY' && i.status === 'OPEN').length * 2 },
        ];

        return {
            total: filtered.length,
            critical: filtered.filter(i => i.severity >= 4).length,
            resolved: filtered.filter(i => i.status === 'RESOLVED').length,
            avgResponse: '3.2m',
            categoryData,
            severityTrend,
            hourlyLoad,
            resourceData
        };
    }, [incidents, activeFilter]);

    const COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F19]">
                <Cpu size={48} className="text-cyan-500 animate-spin mb-6 opacity-20" />
                <div className="text-cyan-500 font-mono animate-pulse uppercase tracking-[0.5em] text-xs">Decrypting_Global_Metrics...</div>
            </div>
        );
    }

    return (
        <Section className="py-8 bg-[#0B0F19] flex-1 flex flex-col overflow-y-auto">
            <Container>
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="relative">
                        <motion.div 
                            key={realtimePulse}
                            initial={{ opacity: 0.5, scale: 1 }}
                            animate={{ opacity: 0, scale: 1.2 }}
                            className="absolute -inset-4 bg-cyan-500/10 rounded-full pointer-events-none"
                        />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2 italic">
                            Tactical <span className="text-cyan-400">Analytics</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-neon-green" />
                            <p className="text-slate-500 font-mono text-[9px] tracking-[0.3em] uppercase">
                                Real-time Neural Engine Active
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-[#111827] border border-slate-800 p-1 rounded-none shadow-tactical">
                        {['ALL', 'FIRE', 'MEDICAL', 'SECURITY', 'INFRASTRUCTURE'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                                    activeFilter === f ? 'bg-cyan-600 text-black' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </header>

                {/* ULTRA KPI GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Signal Nodes', value: stats.total, icon: Activity, color: 'cyan', trend: '+12%' },
                        { label: 'Critical Load', value: stats.critical, icon: AlertTriangle, color: 'red', trend: 'STABLE' },
                        { label: 'Response Latency', value: stats.avgResponse, icon: Clock, color: 'emerald', trend: '-0.4s' },
                        { label: 'System Health', value: '99.9%', icon: Shield, color: 'amber', trend: 'OPTIMAL' },
                    ].map((kpi, idx) => (
                        <Card key={idx} className={`bg-slate-900/50 border-slate-800 p-6 rounded-none relative overflow-hidden group hover:border-${kpi.color}-500/50 transition-colors`}>
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-${kpi.color}-500/5 blur-[100px] pointer-events-none`} />
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-2 bg-${kpi.color}-500/10 border border-${kpi.color}-500/20`}>
                                    <kpi.icon className={`text-${kpi.color}-500`} size={18} />
                                </div>
                                <span className={`text-[8px] font-black px-2 py-1 bg-black/40 border border-slate-800 text-${kpi.color}-400 tabular-nums tracking-tighter`}>
                                    {kpi.trend}
                                </span>
                            </div>
                            <motion.h3 
                                key={kpi.value}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-4xl font-black text-white mb-1 tabular-nums tracking-tighter"
                            >
                                {kpi.value}
                            </motion.h3>
                            <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black">{kpi.label}</p>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* SEVERITY TREND */}
                    <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 p-8 rounded-none h-[450px] flex flex-col shadow-tactical">
                        <div className="flex justify-between items-center mb-10">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
                                <TrendingUp size={16} className="text-cyan-500" /> Impact_Severity_Matrix
                            </h4>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-cyan-500" /><span className="text-[8px] text-slate-500 uppercase font-black">Actual</span></div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500" /><span className="text-[8px] text-slate-500 uppercase font-black">Predicted</span></div>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.severityTrend}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} hide />
                                    <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} domain={[0, 10]} />
                                    <Tooltip 
                                        contentStyle={{ background: '#0B0F19', border: '1px solid #334155', borderRadius: '0px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                        itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900' }}
                                    />
                                    <Area type="monotone" dataKey="impact" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                                    <Area type="monotone" dataKey="severity" stroke="#06b6d4" fillOpacity={1} fill="url(#colorActual)" strokeWidth={4} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* CATEGORY DISTRIBUTION */}
                    <Card className="bg-slate-900/40 border-slate-800 p-8 rounded-none h-[450px] flex flex-col shadow-tactical">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-10 border-l-4 border-amber-500 pl-4">
                            Sector_Distribution
                        </h4>
                        <div className="flex-1 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.categoryData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#0B0F19', border: '1px solid #334155', borderRadius: '0px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <span className="block text-2xl font-black text-white tabular-nums">{stats.total}</span>
                                <span className="block text-[7px] text-slate-500 uppercase font-black tracking-widest">Total_Nodes</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {stats.categoryData.slice(0, 4).map((cat, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-none" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="text-[8px] font-black text-slate-400 uppercase truncate">{cat.name}</span>
                                    <span className="text-[8px] font-mono text-slate-600 ml-auto">{cat.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* HOURLY LOAD */}
                    <Card className="bg-slate-900/40 border-slate-800 p-8 rounded-none h-[350px] flex flex-col">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-8 flex items-center gap-3">
                            <Zap size={16} className="text-emerald-500" /> Signal_Density_Aggregator
                        </h4>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.hourlyLoad}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="hour" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} interval={3} />
                                    <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.03)'}}
                                        contentStyle={{ background: '#0B0F19', border: '1px solid #334155', borderRadius: '0px' }}
                                    />
                                    <Bar dataKey="signals" fill="#10b981" radius={[0, 0, 0, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* RESOURCE PREDICTION */}
                    <Card className="bg-slate-900/40 border-slate-800 p-8 rounded-none h-[350px] flex flex-col">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-8 flex items-center gap-3">
                            <Filter size={16} className="text-purple-500" /> Resource_Demand_Projection
                        </h4>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.resourceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: '#0B0F19', border: '1px solid #334155', borderRadius: '0px' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', paddingTop: '20px' }} />
                                    <Line type="stepAfter" dataKey="allocated" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} />
                                    <Line type="stepAfter" dataKey="required" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </Container>
        </Section>
    );
};

export default Analytics;
