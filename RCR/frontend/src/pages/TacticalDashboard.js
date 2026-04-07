import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getSocket } from '../socket';
import { IntelFeed } from '../components/IntelFeed';
import { TacticalMap } from '../components/TacticalMap';
import { AICommand } from '../components/AICommand';

const TacticalDashboard = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [filter, setFilter] = useState('ALL_FEEDS');

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
        <div className="h-[calc(100vh-64px)] w-full flex overflow-hidden bg-navy-950">
            {/* LEFT PANEL */}
            <IntelFeed 
                incidents={filteredIncidents} 
                onSelectIncident={(inc) => setSelectedIncident(inc)} 
            />

            {/* CENTER CANVAS */}
            <TacticalMap 
                incidents={filteredIncidents}
                selectedIncident={selectedIncident}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                filter={filter}
                setFilter={setFilter}
                onCreateIncident={() => navigate('/report')}
            />

            {/* RIGHT PANEL */}
            <AICommand 
                selectedIncident={selectedIncident}
                stats={{
                    total: incidents.length,
                    critical: incidents.filter(i => i.severity >= 4).length
                }}
            />
        </div>
    );
};

export default TacticalDashboard;
