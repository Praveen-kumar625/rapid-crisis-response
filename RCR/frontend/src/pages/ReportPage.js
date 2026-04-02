import React from 'react';
import ReportForm from '../components/ReportForm';

function ReportPage() {
    return ( <
        div className = "p-4" >
        <
        h2 className = "text-2xl mb-4" > Report a New Incident < /h2> <
        ReportForm / >
        <
        /div>
    );
}

export default ReportPage;