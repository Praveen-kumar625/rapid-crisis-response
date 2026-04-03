import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans selection:bg-red-100 selección:text-red-600">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-20 pb-32 bg-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-5 pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/></pattern></defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest mb-8 animate-bounce">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Enterprise Grade Safety
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                        THE GOLDEN HOUR <br/>
                        <span className="text-red-600">RECLAIMED.</span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-xl text-slate-500 font-light leading-relaxed mb-12">
                        Advanced Crisis Triage & Indoor Coordination. Powered by Gemini 1.5 Flash. 
                        Designed for the World&apos;s Most Resilient Hospitality Brands.
                    </p>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link to="/report" className="w-full md:w-auto bg-red-600 text-white px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-2xl hover:shadow-red-500/20 transform hover:-translate-y-1">
                            Initiate SOS Report
                        </Link>
                        <Link to="/map" className="w-full md:w-auto bg-[#0f172a] text-white px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl transform hover:-translate-y-1">
                            Live Command Map
                        </Link>
                    </div>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 border-b-4 border-b-red-500">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 uppercase tracking-tighter">Multimodal Triage</h3>
                        <p className="text-slate-500 font-light leading-relaxed">Voice and Vision AI instantly categorizes disasters and calculates severity with precision accuracy.</p>
                    </div>

                    <div className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 border-b-4 border-b-amber-500">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 uppercase tracking-tighter">Indoor PostGIS</h3>
                        <p className="text-slate-500 font-light leading-relaxed">Precision floor and room mapping ensures first responders know exactly where to deploy resources.</p>
                    </div>

                    <div className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 border-b-4 border-b-slate-800">
                        <div className="w-16 h-16 bg-slate-50 text-slate-800 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 uppercase tracking-tighter">Offline Edge AI</h3>
                        <p className="text-slate-500 font-light leading-relaxed">System failure is not an option. On-device heuristics provide triage even when the network burns down.</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#0f172a] py-12 text-center border-t border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.5em]">Rapid Crisis Response &copy; 2026</p>
            </footer>
        </div>
    );
}

export default Home;
