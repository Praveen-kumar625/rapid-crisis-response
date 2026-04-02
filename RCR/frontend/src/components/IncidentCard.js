import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

function IncidentCard({ incident }) {
    const { id, title, severity, category, status, location } = incident;
    const [lng, lat] = location.coordinates;
    return ( <
        div className = "border rounded p-3 mb-2" >
        <
        Link to = { `/incidents/${id}` }
        className = "text-xl font-bold" > { title } <
        /Link> <
        p className = "text-sm text-gray-600" > { category }–
        Severity { severity } <
        /p> <
        p className = "text-sm" > 📍{ lat.toFixed(3) }, { lng.toFixed(3) } <
        /p> <
        StatusBadge status = { status }
        /> <
        /div>
    );
}

export default IncidentCard;