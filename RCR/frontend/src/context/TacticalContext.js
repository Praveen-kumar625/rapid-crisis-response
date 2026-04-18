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
            // RULE 1: Strictly validate incoming data before setting state
            return { ...state, incidents: Array.isArray(action.payload) ? action.payload : [], isLoading: false };
        case 'ADD_INCIDENT':
            if (!action.payload || !action.payload.id) return state;
            const currentIncidents = Array.isArray(state.incidents) ? state.incidents : [];
            if (currentIncidents.some(i => i.id === action.payload.id)) return state;
            return { ...state, incidents: [action.payload, ...currentIncidents] };
        case 'SET_RESPONDERS':
            // RULE 1: Strictly validate incoming data before setting state
            return { ...state, responders: Array.isArray(action.payload) ? action.payload : [] };
        case 'UPDATE_RESPONDER': {
            if (!action.payload || !action.payload.id) return state;
            const currentResponders = Array.isArray(state.responders) ? state.responders : [];
            const filtered = currentResponders.filter(r => r.id !== action.payload.id);
            return { ...state, responders: [...filtered, action.payload] };
        }
        case 'SET_BOTTOM_SHEET':
            return { ...state, bottomSheetState: action.payload };
        case 'SET_COMMS':
            return { ...state, commsStatus: action.payload };
        case 'UPDATE_LOCATION':
            return { ...state, userLocation: { ...state.userLocation, ...action.payload } };
        case 'ADD_INTEL':
            const currentIntel = Array.isArray(state.intelFeed) ? state.intelFeed : [];
            return { ...state, intelFeed: [action.payload, ...currentIntel].slice(0, 20) };
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
                api.get('/api/incidents'),
                api.get('/api/incidents/responders') 
            ]);
            // RULE 1: Strictly validate API payloads
            dispatch({ type: 'SET_INCIDENTS', payload: Array.isArray(incidentsRes.data) ? incidentsRes.data : [] });
            dispatch({ type: 'SET_RESPONDERS', payload: Array.isArray(respondersRes.data) ? respondersRes.data : [] });
        } catch (err) {
            console.error('Initial fetch failed', err);
            dispatch({ type: 'SET_INCIDENTS', payload: [] });
            dispatch({ type: 'SET_RESPONDERS', payload: [] });
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
            if (!socket) return;
            
            // RULE 1: Validate socket event payloads
            socket.on('incident.created', (payload) => {
                if (payload?.incident && payload.incident.id) {
                    dispatch({ type: 'ADD_INCIDENT', payload: payload.incident });
                    dispatch({ type: 'ADD_INTEL', payload: `ALERT: ${payload.incident.title} reported` });
                }
            });

            socket.on('responder.presence-update', (payload) => {
                if (payload?.responder && payload.responder.id) {
                    dispatch({ type: 'UPDATE_RESPONDER', payload: payload.responder });
                }
            });
        })();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            socket?.off('incident.created');
            socket?.off('responder.presence-update');
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
