import React from 'react';
import CrisisMap from '../components/CrisisMap';

function MapPage() {
    return (
        <div className="flex-1 w-full relative flex flex-col h-[calc(100vh-80px)]">
            <CrisisMap />
        </div>
    );
}

export default MapPage;
