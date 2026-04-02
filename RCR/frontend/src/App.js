// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Dashboard from './pages/Dashboard';
import ReportPage from './pages/ReportPage';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const login = async() => {
        try { await signInWithPopup(auth, googleProvider); } catch (err) { console.error('Login Failed', err); }
    };

    return ( <
        Router >
        <
        header style = {
            { background: '#0066cc', color: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } } >
        <
        h1 > Rapid Crisis Response < /h1> <
        nav >
        <
        Link to = "/"
        style = {
            { marginRight: '1rem', color: '#fff' } } > Home < /Link> <
        Link to = "/map"
        style = {
            { marginRight: '1rem', color: '#fff' } } > Map < /Link> <
        Link to = "/dashboard"
        style = {
            { marginRight: '1rem', color: '#fff' } } > Dashboard < /Link> <
        Link to = "/report"
        style = {
            { marginRight: '1rem', color: '#fff' } } > Report < /Link> {
            user ? ( <
                button onClick = {
                    () => signOut(auth) }
                style = {
                    { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' } } > Logout < /button>
            ) : ( <
                button onClick = { login }
                style = {
                    { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' } } > Login < /button>
            )
        } <
        /nav> <
        /header> <
        Routes >
        <
        Route path = "/"
        element = { < Home / > }
        /> <
        Route path = "/map"
        element = { < MapPage / > }
        /> <
        Route path = "/dashboard"
        element = { < Dashboard / > }
        /> <
        Route path = "/report"
        element = { < ReportPage / > }
        /> <
        /Routes> <
        /Router>
    );
}

export default App;