import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../api';
import { getSocket } from '../socket';

const TacticalContext = createContext();

const initialState = {
    incidents: [],
    responders: [],
    bottomSheetState: 'COLLAPSED', // 'COLLAPSED', 'HALF', 'FULL'
    commsStatus: navigator.onLine,
    userLocation: { lat: 28.6139, lng: 77.2090, floor: 1 },
    intelFeed: [],
    isLoading: true,
    selectedIncident: null,
    mapFilter: 'ALL_FEEDS'
};

function tacticalReducer(state, action) {
    switch (action.type) {
        case 'SET_INCIDENTS':
            return { ...state, incidents: action.payload, isLoading: false };
        case 'ADD_INCIDENT':
            if (state.incidents.some(i => i.id === action.payload.id)) return state;
            return { ...state, incidents: [action.payload, ...state.incidents] };
        case 'SET_RESPONDERS':
            return { ...state, responders: action.payload };
        case 'UPDATE_RESPONDER': {
            const filtered = state.responders.filter(r => r.id !== action.payload.id);
            return { ...state, responders: [...filtered, action.payload] };
        }
        case 'SET_BOTTOM_SHEET':
            return { ...state, bottomSheetState: action.payload };
        case 'SET_COMMS':
            return { ...state, commsStatus: action.payload };
        case 'UPDATE_LOCATION':
            return { ...state, userLocation: { ...state.userLocation, ...action.payload } };
        case 'ADD_INTEL':
            return { ...state, intelFeed: [action.payload, ...state.intelFeed].slice(0, 20) };
        case 'SET_SELECTED_INCIDENT':
            return { ...state, selectedIncident: action.payload };
        case 'SET_MAP_FILTER':
            return { ...state, mapFilter: action.payload };
        default:
            return state;
    }
}

export const TacticalProvider = ({ children }) => {
    const [state, dispatch] = useReducer(tacticalReducer, initialState);

    const fetchData = async () => {
        try {
            const [incidentsRes, respondersRes] = await Promise.all([
                api.get('/incidents'),
                api.get('/incidents/responders') // Assuming this endpoint exists or will be handled
            ]);
            dispatch({ type: 'SET_INCIDENTS', payload: incidentsRes.data });
            dispatch({ type: 'SET_RESPONDERS', payload: respondersRes.data || [] });
        } catch (err) {
            console.error('Initial fetch failed', err);
        }
    };

    useEffect(() => {
        fetchData();

        const handleOnline = () => dispatch({ type: 'SET_COMMS', payload: true });
        const handleOffline = () => dispatch({ type: 'SET_COMMS', payload: false });
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        let socket;
        (async () => {
            socket = await getSocket();
            socket.on('incident.created', (payload) => {
                if (payload?.incident) {
                    dispatch({ type: 'ADD_INCIDENT', payload: payload.incident });
                    dispatch({ type: 'ADD_INTEL', payload: `ALERT: ${payload.incident.title} reported at LVL_${payload.incident.floorLevel || '?'}` });
                }
            });
            socket.on('responder.presence-update', (payload) => {
                if (payload?.responder) {
                    dispatch({ type: 'UPDATE_RESPONDER', payload: payload.responder });
                }
            });
            socket.on('NEW_IOT_ALERT', (event) => {
                dispatch({ type: 'ADD_INTEL', payload: `IOT: ${event.category} detected in Room ${event.room_number}` });
            });
        })();

        if (navigator.geolocation) {
            navigator.geolocation.watchPosition((pos) => {
                dispatch({ type: 'UPDATE_LOCATION', payload: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
            });
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (socket) {
                socket.off('incident.created');
                socket.off('responder.presence-update');
                socket.off('NEW_IOT_ALERT');
            }
        };
    }, []);

    return (
        <TacticalContext.Provider value={{ state, dispatch }}>
            {children}
        </TacticalContext.Provider>
    );
};

export const useTactical = () => {
    const context = useContext(TacticalContext);
    if (!context) throw new Error('useTactical must be used within a TacticalProvider');
    return context;
};
