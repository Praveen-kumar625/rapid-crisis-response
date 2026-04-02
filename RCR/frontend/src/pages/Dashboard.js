// frontend/src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import api from '../api';
import IncidentCard from '../components/IncidentCard';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';

/**
 * Helper – compute aggregated data for the charts.
 */
function computeAggregates(incidents) {
    const categoryCounts = {};
    const severityCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    incidents.forEach((inc) => {
        const cat = inc.category || 'UNKNOWN';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        const sev = inc.severity || 1;
        severityCounts[sev] = (severityCounts[sev] || 0) + 1;
    });

    const categoryData = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
    }));

    const severityData = Object.entries(severityCounts).map(([severity, count]) => ({
        name: `Severity ${severity}`,
        value: count,
    }));

    return { categoryData, severityData };
}

// Colors for the pie slices (5 severity levels)
const PIE_COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0'];

function Dashboard() {
    const [incidents, setIncidents] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [severityData, setSeverityData] = useState([]);

    // -----------------------------------------------------------------
    // Load incidents once (on mount)
    // -----------------------------------------------------------------
    useEffect(() => {
        async function load() {
            try {
                const { data } = await api.get('/incidents');
                setIncidents(data);
                const { categoryData, severityData } = computeAggregates(data);
                setCategoryData(categoryData);
                setSeverityData(severityData);
            } catch (err) {
                console.error('[Dashboard] Failed to fetch incidents:', err);
            }
        }
        load();
    }, []);

    // -----------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------
    return ( <
        div className = "p-4" >
        <
        h2 className = "text-2xl font-bold mb-6" > Analytics Dashboard < /h2>

        { /* -------------------- Bar Chart (Category Count) -------------------- */ } <
        div className = "mb-8"
        style = {
            { height: '300px' } } >
        <
        ResponsiveContainer width = "100%"
        height = "100%" >
        <
        BarChart data = { categoryData }
        margin = {
            { top: 20, right: 30, left: 0, bottom: 5 } } >
        <
        CartesianGrid strokeDasharray = "3 3" / >
        <
        XAxis dataKey = "category" / >
        <
        YAxis allowDecimals = { false }
        /> <
        Tooltip / >
        <
        Legend / >
        <
        Bar dataKey = "count"
        name = "Incidents"
        fill = "#ff7300" / >
        <
        /BarChart> <
        /ResponsiveContainer> <
        /div>

        { /* -------------------- Pie Chart (Severity Distribution) -------------------- */ } <
        div className = "mb-8"
        style = {
            { height: '300px' } } >
        <
        ResponsiveContainer width = "100%"
        height = "100%" >
        <
        PieChart >
        <
        Tooltip / >
        <
        Legend layout = "vertical"
        verticalAlign = "middle"
        align = "right" / >
        <
        Pie data = { severityData }
        dataKey = "value"
        nameKey = "name"
        cx = "50%"
        cy = "50%"
        outerRadius = { 100 }
        label >
        {
            severityData.map((entry, index) => ( <
                Cell key = { `cell-${index}` }
                fill = { PIE_COLORS[index % PIE_COLORS.length] }
                />
            ))
        } <
        /Pie> <
        /PieChart> <
        /ResponsiveContainer> <
        /div>

        { /* -------------------- Latest 5 incidents (table) -------------------- */ } <
        h3 className = "text-xl font-semibold mb-4" > Latest 5 Incidents < /h3> <
        div className = "overflow-x-auto" >
        <
        table className = "min-w-full bg-white border" >
        <
        thead >
        <
        tr className = "bg-gray-200" >
        <
        th className = "p-2 text-left" > Title < /th> <
        th className = "p-2 text-left" > Category < /th> <
        th className = "p-2 text-left" > Severity < /th> <
        th className = "p-2 text-left" > Status < /th> <
        /tr> <
        /thead> <
        tbody > {
            incidents
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map((inc) => ( <
                tr key = { inc.id }
                className = "border-t" >
                <
                td className = "p-2" > { inc.title } < /td> <
                td className = "p-2" > { inc.category } < /td> <
                td className = "p-2" > { inc.severity } < /td> <
                td className = "p-2" > { inc.status } < /td> <
                /tr>
            ))
        } <
        /tbody> <
        /table> <
        /div> <
        /div>
    );
}

export default Dashboard;