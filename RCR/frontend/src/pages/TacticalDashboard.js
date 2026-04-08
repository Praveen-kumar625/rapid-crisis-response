import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getSocket } from '../socket';
import { IntelFeed } from '../components/IntelFeed';
import { TacticalMap } from '../components/TacticalMap';
import { AICommand } from '../components/AICommand';
import IndoorHeatmap from '../components/IndoorHeatmap';

const TacticalDashboard = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [filter, setFilter] = useState('ALL_FEEDS');
    const [viewMode, setViewMode] = useState('MAP'); // 'MAP' | 'INDOOR'

    useEffect(() => {
        // Initial Fetch
        api.get('/incidents').then(({ data }) => {
            setIncidents(data);
        }).catch(console.error);

        let isMounted = true;
        let socketInstance = null;

        const handleIncidentCreated = (payload) => {
            if (isMounted) {
                setIncidents(prev => [payload.incident, ...prev]);
            }
        };

        const handleStatusUpdated = (payload) => {
            if (isMounted) {
                setIncidents(prev => prev.map(inc => 
                    inc.id === payload.incident.id ? payload.incident : inc
                ));
                if (selectedIncident?.id === payload.incident.id) {
                    setSelectedIncident(payload.incident);
                }
            }
        };

        (async() => {
            socketInstance = await getSocket();
            if (!isMounted) return;
            socketInstance.on('incident.created', handleIncidentCreated);
            socketInstance.on('incident.status-updated', handleStatusUpdated);
        })();

        return () => {
            isMounted = false;
            if (socketInstance) {
                socketInstance.off('incident.created', handleIncidentCreated);
                socketInstance.off('incident.status-updated', handleStatusUpdated);
            }
        };
    }, [selectedIncident]);

    const filteredIncidents = incidents.filter(inc => {
        if (filter === 'IOT_SENSORS') return inc.source === 'IOT' || inc.category === 'SENSOR';
        if (filter === 'CITIZEN_REPORTS') return inc.source === 'USER' || inc.category === 'REPORT';
        return true;
    });

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col lg:flex-row overflow-hidden bg-navy-950 min-h-0">
            {/* LEFT PANEL - Hidden or scrollable on mobile */}
            <div className="hidden lg:flex w-80 shrink-0 border-r border-white/10 overflow-hidden">
                <IntelFeed 
                    incidents={filteredIncidents} 
                    onSelectIncident={(inc) => setSelectedIncident(inc)} 
                />
            </div>

            {/* CENTER CANVAS - Priority on mobile */}
            <div className="flex-1 relative min-h-0">
                {viewMode === 'MAP' ? (
                    <TacticalMap 
                        incidents={filteredIncidents}
                        selectedIncident={selectedIncident}
                        onSelectIncident={(inc) => setSelectedIncident(inc)}
                        filter={filter}
                        setFilter={setFilter}
                        onCreateIncident={() => navigate('/report')}
                        onSwitchView={() => setViewMode('INDOOR')}
                    />
                ) : (
                    <div className="w-full h-full relative">
                        <IndoorHeatmap incidents={filteredIncidents} />
                        <button 
                            onClick={() => setViewMode('MAP')}
                            className="absolute top-6 right-6 z-50 bg-navy-900/90 border border-cyan-500/50 text-cyan-400 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-navy-950 transition-all shadow-neon-cyan"
                        >
                            Return to Tactical Map
                        </button>
                    </div>
                )}
            </div>

            {/* RIGHT PANEL - Tactical stats/AI - Hidden on small mobile */}
            <div className="hidden xl:flex w-80 shrink-0 border-l border-white/10 overflow-hidden">
                <AICommand 
                    selectedIncident={selectedIncident}
                    stats={{
                        total: incidents.length,
                        critical: incidents.filter(i => i.severity >= 4).length
                    }}
                />
            </div>
        </div>
    );
};

export default TacticalDashboard;
