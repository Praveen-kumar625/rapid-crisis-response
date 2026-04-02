import React from 'react';
import CrisisMap from '../components/CrisisMap';

function MapPage() {
    return ( <
        div style = {
            { height: 'calc(100vh - 70px)' } } >
        <
        CrisisMap / >
        <
        /div>
    );
}

export default MapPage;