import React from 'react';
import ReportForm from '../components/ReportForm';
import { ShieldAlert } from 'lucide-react';

function ReportPage() {
    return (
        <div className="flex-1 w-full px-4 py-8 md:p-12 relative flex justify-center items-center">
            {/* Dark Premium Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-danger/10 rounded-full blur-[150px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-electric/5 rounded-full blur-[150px] pointer-events-none"></div>
            
            <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
                <header className="mb-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-danger/10 text-danger border border-danger/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,51,102,0.2)]">
                        <ShieldAlert size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-100 uppercase">
                        Emergency <span className="text-danger">Dispatch</span>
                    </h2>
                    <p className="text-slate-400 mt-3 text-sm font-light leading-relaxed max-w-md">
                        Your report will be triaged by Edge AI and immediately synced to the Command Center network.
                    </p>
                </header>
                
                <div className="w-full">
                    <ReportForm />
                </div>
            </div>
        </div>
    );
}

export default ReportPage;
