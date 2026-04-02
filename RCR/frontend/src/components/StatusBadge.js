import React from 'react';

const COLORS = {
    OPEN: 'bg-blue-200 text-blue-800',
    IN_PROGRESS: 'bg-yellow-200 text-yellow-800',
    RESOLVED: 'bg-green-200 text-green-800',
    CLOSED: 'bg-gray-200 text-gray-800',
};

function StatusBadge({ status }) {
    const className = COLORS[status] || 'bg-gray-200 text-gray-800';
    return ( <
        span className = { `${className} px-2 py-1 rounded text-xs font-medium` } >
        { status } <
        /span>
    );
}

export default StatusBadge;