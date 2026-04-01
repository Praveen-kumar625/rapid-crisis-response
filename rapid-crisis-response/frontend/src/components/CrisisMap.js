// frontend/src/components/CrisisMap.js
import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import api from '../api';
import { getSocket } from '../socket';

const RESPONDER_HQ = { lat: 28.6139, lng: 77.2090 }; // New Delhi Defaults

function CrisisMap() {
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [directionsRenderer, setDirectionsRenderer] = useState(null);

    useEffect(() => {
        api.get('/incidents').then((res) => setIncidents(res.data)).catch(console.error);

        let cancelled = false;
        (async() => {
            const socket = await getSocket();
            socket.on('incident.created', (payload) => {
                if (!cancelled) setIncidents((prev) => [...prev, payload.incident]);
            });
            socket.on('incident.status-updated', (payload) => {
                if (!cancelled) {
                    setIncidents((prev) => prev.map((i) => (i.id === payload.incident.id ? payload.incident : i)));
                }
            });
        })();
        return () => { cancelled = true; };
    }, []);

    const calculateRoute = async(lat, lng) => {
        if (!window.google) return;
        const directionsService = new window.google.maps.DirectionsService();
        try {
            const results = await directionsService.route({
                origin: RESPONDER_HQ,
                destination: { lat, lng },
                travelMode: window.google.maps.TravelMode.DRIVING,
            });
            setDirectionsResponse(results);
        } catch (error) {
            console.error("Directions request failed", error);
        }
    };

    return ( <
        div style = {
            { width: '100%', height: 'calc(100vh - 70px)' }
        } >
        <
        APIProvider apiKey = { process.env.REACT_APP_GOOGLE_MAPS_API_KEY } >
        <
        Map defaultCenter = { RESPONDER_HQ }
        defaultZoom = { 11 }
        mapId = "CRISIS_MAP_ID"
        onIdle = {
            (map) => {
                if (!directionsRenderer && map) {
                    const renderer = new window.google.maps.DirectionsRenderer();
                    renderer.setMap(map);
                    setDirectionsRenderer(renderer);
                }
            }
        } >
        <
        AdvancedMarker position = { RESPONDER_HQ } >
        <
        Pin background = { '#0f9d58' }
        borderColor = { '#000' }
        glyphColor = { '#fff' }
        /> < /
        AdvancedMarker >

        {
            incidents.map((inc) => ( <
                AdvancedMarker key = { inc.id }
                position = {
                    { lat: inc.location.coordinates[1], lng: inc.location.coordinates[0] }
                }
                onClick = {
                    () => {
                        calculateRoute(inc.location.coordinates[1], inc.location.coordinates[0]);
                        setSelectedIncident(inc);
                    }
                } >
                <
                Pin background = { '#db4437' }
                borderColor = { '#880000' }
                glyphColor = { '#fff' }
                /> < /
                AdvancedMarker >
            ))
        } <
        /Map>

        { directionsRenderer && directionsResponse && directionsRenderer.setDirections(directionsResponse) } <
        /APIProvider>

        {
            selectedIncident && ( <
                div style = {
                    { position: 'absolute', bottom: 12, left: 12, right: 12, background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } } >
                <
                h3 style = {
                    { margin: 0 } } > { selectedIncident.title } < /h3> <
                p style = {
                    { margin: '4px 0' } } > { selectedIncident.description } < /p> <
                p style = {
                    { margin: '4px 0' } } > < strong > Severity: < /strong> {selectedIncident.severity}</p >
                <
                p style = {
                    { margin: '4px 0' } } > < strong > Action plan: < /strong> {selectedIncident.actionPlan || 'N/A
                '}</p> <
                p style = {
                    { margin: '4px 0' } } > < strong > Resources: < /strong> {(selectedIncident.requiredResources || []).join(', ')}</p >
                <
                button onClick = {
                    () => setSelectedIncident(null) }
                style = {
                    { marginTop: 4, padding: '4px 8px' } } > Dismiss < /button> <
                /div>
            )
        }
        /div>
    );
}

export default CrisisMap;