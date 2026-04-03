import React from 'react';
import ReportForm from '../components/ReportForm';

function ReportPage() {
    return (
        <div className="p-8 md:p-20 bg-[#f8fafc] min-h-screen relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -ml-64 -mb-64"></div>
            
            <div className="relative z-10">
                <header className="max-w-2xl mx-auto mb-12 text-center">
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Emergency <span className="text-red-600">Dispatch</span></h2>
                    <p className="text-slate-500 mt-4 font-light leading-relaxed">Your report will be triaged by Edge AI and immediately synced to the Command Center.</p>
                </header>
                <ReportForm />
            </div>
        </div>
    );
}

export default ReportPage;
