import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return ( <
        div className = "p-4" >
        <
        h2 className = "text-2xl mb-4" > Welcome to Rapid Crisis Response < /h2> <
        p className = "mb-4" >
        Real‑ time incident map, citizen reporting, and responder coordination. <
        /p> <
        ul >
        <
        li >
        <
        Link to = "/map" > Live Map < /Link> <
        /li> <
        li >
        <
        Link to = "/report" > Report an Incident < /Link> <
        /li> <
        li >
        <
        Link to = "/dashboard" > Admin Dashboard < /Link> <
        /li> <
        /ul> <
        /div>
    );
}

export default Home;