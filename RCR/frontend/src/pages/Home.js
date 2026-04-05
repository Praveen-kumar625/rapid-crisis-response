import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Map as MapIcon, Activity, WifiOff, Fingerprint, Zap } from 'lucide-react';

function Home() {
    return (
        <div className="flex-1 flex flex-col w-full relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-electric/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-danger/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTU5LjUgMEw1OS41IDYwTTAgNTkuNUw2MCA1OS41IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] pointer-events-none opacity-50 z-0"></div>

            {/* Hero Section */}
            <div className="relative z-10 flex flex-col items-center justify-center pt-32 pb-24 px-6 text-center max-w-5xl mx-auto flex-1">
                
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-danger/10 border border-danger/30 text-danger text-[10px] font-bold uppercase tracking-[0.2em] mb-10 shadow-[0_0_20px_rgba(255,51,102,0.15)]">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
                    </span>
                    Live Incident Dispatch Active
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500">
                    THE GOLDEN HOUR <br/>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-danger to-red-600 drop-shadow-[0_0_30px_rgba(255,51,102,0.3)]">RECLAIMED.</span>
                </h1>
                
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-light leading-relaxed mb-12">
                    Advanced Crisis Triage & Indoor Coordination. Powered by Edge AI. 
                    Designed for the World&apos;s Most Resilient Hospitality Brands.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
                    <Link to="/report" className="w-full sm:w-auto flex items-center justify-center gap-3 bg-danger text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.15em] hover:bg-red-600 transition-all shadow-[0_0_30px_rgba(255,51,102,0.4)] hover:shadow-[0_0_40px_rgba(255,51,102,0.6)] transform hover:-translate-y-1">
                        <Shield size={20} />
                        Initiate SOS
                    </Link>
                    <Link to="/map" className="w-full sm:w-auto flex items-center justify-center gap-3 glass-card bg-surface hover:bg-white/10 px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.15em] text-slate-200 transition-all hover:border-white/20 transform hover:-translate-y-1">
                        <MapIcon size={20} />
                        Command Map
                    </Link>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="group glass-card p-10 border-t-2 border-t-electric/50 hover:border-t-electric transition-all duration-500 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-electric/10 text-electric rounded-xl flex items-center justify-center mb-8 border border-electric/20 shadow-[0_0_15px_rgba(0,240,255,0.15)] group-hover:scale-110 transition-transform duration-500">
                            <Fingerprint size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-100 tracking-wide">Multimodal Triage</h3>
                        <p className="text-slate-400 text-sm font-light leading-relaxed">Voice and Vision AI instantly categorizes disasters and calculates severity with precision accuracy using Gemini models.</p>
                    </div>

                    <div className="group glass-card p-10 border-t-2 border-t-emerald/50 hover:border-t-emerald transition-all duration-500 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-emerald/10 text-emerald rounded-xl flex items-center justify-center mb-8 border border-emerald/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform duration-500">
                            <MapIcon size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-100 tracking-wide">Indoor PostGIS</h3>
                        <p className="text-slate-400 text-sm font-light leading-relaxed">Precision floor, wing, and room mapping ensures first responders know exactly where to deploy resources in vast hotels.</p>
                    </div>

                    <div className="group glass-card p-10 border-t-2 border-t-amber/50 hover:border-t-amber transition-all duration-500 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-amber/10 text-amber rounded-xl flex items-center justify-center mb-8 border border-amber/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:scale-110 transition-transform duration-500">
                            <WifiOff size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-100 tracking-wide">Offline Edge AI</h3>
                        <p className="text-slate-400 text-sm font-light leading-relaxed">System failure is not an option. On-device heuristics provide immediate triage even when the facility network burns down.</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto border-t border-surfaceBorder py-8 bg-navy-900/50 backdrop-blur-md relative z-10 text-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                    <Zap size={12} className="text-electric" />
                    Rapid Crisis Response Platform &copy; 2026
                </p>
            </footer>
        </div>
    );
}

export default Home;
