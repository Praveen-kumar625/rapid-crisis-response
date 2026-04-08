import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Activity, AlertTriangle, Clock, Zap } from 'lucide-react';
import api from '../api';
import { Section } from '../components/layout/Section';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';

const Analytics = () => {
    const [stats, setStats] = useState({
        totalIncidents: 0,
        severityTrend: [],
        categoryData: [],
        hourlyDistribution: [],
        activeResponders: 12,
        avgResponseTime: '4.2m'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: incidents } = await api.get('/incidents');
                
                // Process Data
                const total = incidents.length;
                
                // Category Data for Pie Chart
                const categories = {};
                incidents.forEach(inc => {
                    const cat = inc.category || 'GENERAL';
                    categories[cat] = (categories[cat] || 0) + 1;
                });
                const categoryData = Object.keys(categories).map(name => ({
                    name, value: categories[name]
                }));

                // Severity Trend (Mocking if not enough data)
                const severityTrend = incidents.slice(-10).map((inc, i) => ({
                    name: `Node ${i+1}`,
                    severity: inc.severity,
                    impact: inc.severity * 1.5
                }));

                // Hourly Distribution (Mock)
                const hourlyDistribution = Array.from({ length: 12 }, (_, i) => ({
                    hour: `${i*2}:00`,
                    reports: Math.floor(Math.random() * 20) + 5
                }));

                setStats({
                    totalIncidents: total,
                    severityTrend,
                    categoryData,
                    hourlyDistribution,
                    activeResponders: 12 + Math.floor(Math.random() * 5),
                    avgResponseTime: '3.8m'
                });
                setLoading(false);
            } catch (err) {
                console.error('[Analytics] Failed to fetch data', err);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0B0F19]">
                <div className="text-cyan-500 font-mono animate-pulse uppercase tracking-[0.3em]">Gathering_Intel...</div>
            </div>
        );
    }

    return (
        <Section className="py-8 bg-[#0B0F19] flex-1 flex flex-col">
            <Container>
                <header className="mb-10">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
                        System <span className="text-cyan-400">Analytics</span>
                    </h2>
                    <p className="text-slate-500 font-mono text-[10px] tracking-[0.3em] uppercase">
                        Comprehensive performance metrics and signal distribution.
                    </p>
                </header>

                {/* KPI GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <Card className="bg-slate-900 border-slate-800 p-6 rounded-none border-t-2 border-t-cyan-500">
                        <div className="flex justify-between items-start mb-4">
                            <Activity className="text-cyan-400" size={20} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live_Sync</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1 tabular-nums">{stats.totalIncidents}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Total Signal Nodes</p>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 p-6 rounded-none border-t-2 border-t-amber-500">
                        <div className="flex justify-between items-start mb-4">
                            <Zap className="text-amber-500" size={20} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active_Ops</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1 tabular-nums">{stats.activeResponders}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Field Units Deployed</p>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 p-6 rounded-none border-t-2 border-t-emerald-500">
                        <div className="flex justify-between items-start mb-4">
                            <Clock className="text-emerald-500" size={20} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Response_Metric</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1 tabular-nums">{stats.avgResponseTime}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Avg Response Latency</p>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 p-6 rounded-none border-t-2 border-t-red-500">
                        <div className="flex justify-between items-start mb-4">
                            <AlertTriangle className="text-red-500" size={20} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Critical_Load</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1 tabular-nums">
                            {stats.severityTrend.filter(s => s.severity >= 4).length}
                        </h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Level 4+ Alarms</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* SEVERITY TREND */}
                    <Card className="bg-slate-900 border-slate-800 p-6 rounded-none h-[400px] flex flex-col">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-100 mb-8 border-l-2 border-cyan-500 pl-3">
                            Impact Severity Matrix
                        </h4>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.severityTrend}>
                                    <defs>
                                        <linearGradient id="colorSev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0px' }}
                                        itemStyle={{ color: '#22d3ee', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="severity" stroke="#06b6d4" fillOpacity={1} fill="url(#colorSev)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* CATEGORY DISTRIBUTION */}
                    <Card className="bg-slate-900 border-slate-800 p-6 rounded-none h-[400px] flex flex-col">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-100 mb-8 border-l-2 border-amber-500 pl-3">
                            Category Distribution
                        </h4>
                        <div className="flex-1 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0px' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        align="center"
                                        iconType="rect"
                                        formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* SIGNAL DENSITY BY HOUR */}
                <Card className="bg-slate-900 border-slate-800 p-6 rounded-none h-[300px] flex flex-col mb-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-100 mb-8 border-l-2 border-emerald-500 pl-3">
                        Hourly Signal Density
                    </h4>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.hourlyDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="hour" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0px' }}
                                />
                                <Bar dataKey="reports" fill="#10b981" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </Container>
        </Section>
    );
};

export default Analytics;