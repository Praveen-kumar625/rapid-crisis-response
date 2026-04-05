import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Shield, 
    Map as MapIcon, 
    Activity, 
    WifiOff, 
    Fingerprint, 
    Zap, 
    ChevronRight, 
    Lock,
    Globe,
    Cpu
} from 'lucide-react';

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

function Home() {
    return (
        <div className="flex-1 flex flex-col w-full relative bg-navy-950 overflow-x-hidden selection:bg-electric/30 selection:text-white">
            
            {/* --- ATMOSPHERIC BACKGROUND LAYERS --- */}
            
            {/* Layer 1: Base Mesh Gradient */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-electric/10 rounded-full blur-[140px] animate-slow-drift"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-danger/10 rounded-full blur-[140px] animate-slow-drift" style={{ animationDirection: 'reverse', animationDuration: '25s' }}></div>
                <div className="absolute top-[20%] right-[15%] w-[40%] h-[40%] bg-amber/5 rounded-full blur-[120px] animate-pulse-glow"></div>
            </div>

            {/* Layer 2: Subtle Noise/Texture Overlay */}
            <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"></div>

            {/* Layer 3: Technical Grid Pattern */}
            <div className="absolute inset-0 z-[2] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTU5LjUgMEw1OS41IDYwTTAgNTkuNUw2MCA1OS41IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] pointer-events-none opacity-40"></div>

            {/* Layer 4: Vertical & Horizontal "Scan Lines" or Accent Glows */}
            <div className="absolute left-[10%] top-0 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent z-[2]"></div>
            <div className="absolute right-[10%] top-0 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent z-[2]"></div>

            {/* --- HERO SECTION --- */}
            <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
                <motion.div 
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="max-w-6xl mx-auto w-full flex flex-col items-center text-center"
                >
                    {/* Status Badge */}
                    <motion.div 
                        variants={fadeInUp}
                        className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-10 shadow-2xl"
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                            Enterprise Security Protocol <span className="text-danger">v4.0.2</span>
                        </span>
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1 
                        variants={fadeInUp}
                        className="text-5xl sm:text-7xl lg:text-9xl font-black tracking-tighter leading-[0.95] mb-8 lg:mb-12"
                    >
                        <span className="block text-white">THE GOLDEN</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-danger via-red-500 to-amber-500 drop-shadow-[0_0_40px_rgba(255,51,102,0.4)]">
                            HOUR RECLAIMED.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p 
                        variants={fadeInUp}
                        className="max-w-3xl mx-auto text-lg md:text-2xl text-slate-400 font-light leading-relaxed mb-12 lg:mb-16 px-4"
                    >
                        Rapid Crisis Response (RCR) leverages <span className="text-electric font-medium">Edge Intelligence</span> to orchestrate safety in high-stakes hospitality environments. Zero-latency triage when seconds define outcomes.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div 
                        variants={fadeInUp}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto px-4"
                    >
                        <Link 
                            to="/report" 
                            className="group relative w-full sm:w-auto overflow-hidden bg-danger text-white px-12 py-6 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(255,51,102,0.4)] hover:shadow-[0_0_60px_rgba(255,51,102,0.6)] transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <ShieldAlert size={20} />
                            Initiate SOS Report
                        </Link>
                        
                        <Link 
                            to="/map" 
                            className="w-full sm:w-auto flex items-center justify-center gap-3 glass-card bg-white/5 hover:bg-white/10 px-12 py-6 rounded-2xl text-sm font-black uppercase tracking-[0.2em] text-slate-200 transition-all border border-white/10 hover:border-white/20 transform hover:-translate-y-1 active:scale-95 group shadow-2xl"
                        >
                            <MapIcon size={20} className="group-hover:text-electric transition-colors" />
                            Command Map
                            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </motion.div>

                    {/* Technical Readouts (Decorative) */}
                    <motion.div 
                        variants={fadeInUp}
                        className="hidden lg:flex items-center gap-12 mt-24 opacity-40 font-mono text-[10px] tracking-[0.2em] uppercase text-slate-500"
                    >
                        <div className="flex items-center gap-2">
                            <Lock size={12} /> Encrypted P2P
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe size={12} /> Global Sync
                        </div>
                        <div className="flex items-center gap-2">
                            <Cpu size={12} /> Gemini 1.5 Flash
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* --- CORE CAPABILITIES SECTION --- */}
            <section className="relative z-10 w-full px-6 py-24 lg:py-32 bg-navy-900/30 border-y border-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 lg:mb-24 gap-8">
                        <div className="max-w-2xl">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-electric mb-4 flex items-center gap-3">
                                <span className="w-8 h-px bg-electric"></span> Intelligence Core
                            </h2>
                            <h3 className="text-4xl lg:text-6xl font-black tracking-tight text-white leading-tight uppercase">
                                Redefining the <br />
                                <span className="text-slate-500">Security Stack.</span>
                            </h3>
                        </div>
                        <p className="max-w-sm text-slate-400 font-light leading-relaxed border-l border-white/10 pl-6">
                            Modern hospitality requires more than reactive reporting. It requires proactive AI orchestration.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="group relative overflow-hidden glass-card p-10 lg:p-12 hover:bg-white/[0.07] transition-all duration-700 border-t-2 border-t-electric/30 hover:border-t-electric shadow-2xl">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity size={120} strokeWidth={1} />
                            </div>
                            <div className="w-16 h-16 bg-electric/10 text-electric rounded-2xl flex items-center justify-center mb-10 border border-electric/20 shadow-[0_0_20px_rgba(0,240,255,0.15)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <Fingerprint size={32} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-2xl font-bold mb-4 text-white tracking-wide uppercase">Multimodal Triage</h4>
                            <p className="text-slate-400 font-light leading-relaxed">
                                Our engine deciphers voice, vision, and sensory data in real-time, calculating impact severity with sub-second latency using distributed AI models.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-electric uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                Learn More <ChevronRight size={12} />
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="group relative overflow-hidden glass-card p-10 lg:p-12 hover:bg-white/[0.07] transition-all duration-700 border-t-2 border-t-emerald/30 hover:border-t-emerald shadow-2xl">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <MapIcon size={120} strokeWidth={1} />
                            </div>
                            <div className="w-16 h-16 bg-emerald/10 text-emerald rounded-2xl flex items-center justify-center mb-10 border border-emerald/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <Activity size={32} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-2xl font-bold mb-4 text-white tracking-wide uppercase">Indoor PostGIS</h4>
                            <p className="text-slate-400 font-light leading-relaxed">
                                Legacy maps fail indoors. RCR provides centimeter-perfect room and floor level tracking, ensuring responders are deployed with surgical precision.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-emerald uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                View Capabilities <ChevronRight size={12} />
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="group relative overflow-hidden glass-card p-10 lg:p-12 hover:bg-white/[0.07] transition-all duration-700 border-t-2 border-t-amber/30 hover:border-t-amber shadow-2xl">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <WifiOff size={120} strokeWidth={1} />
                            </div>
                            <div className="w-16 h-16 bg-amber/10 text-amber rounded-2xl flex items-center justify-center mb-10 border border-amber/20 shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <WifiOff size={32} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-2xl font-bold mb-4 text-white tracking-wide uppercase">Offline Resiliency</h4>
                            <p className="text-slate-400 font-light leading-relaxed">
                                Network failure is a critical threat. Our Edge AI continues to function in complete isolation, syncing data the moment connectivity is restored.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-amber uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                Edge Specs <ChevronRight size={12} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TRUST / LOGO SECTION --- */}
            <section className="relative z-10 py-20 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500 mb-12">Developed for the 2026 Global Solution Challenge</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                        <div className="text-2xl font-black text-white flex items-center gap-2">
                            <Shield className="text-danger" size={32} /> RCR PROTECT
                        </div>
                        <div className="text-2xl font-black text-white flex items-center gap-2 italic">
                            <Cpu className="text-electric" size={32} /> GEN AI CORE
                        </div>
                        <div className="text-2xl font-black text-white flex items-center gap-2">
                            <Zap className="text-amber" size={32} /> ULTRA SYNC
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="relative z-10 mt-auto border-t border-white/5 py-12 bg-navy-950 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-danger to-red-900 rounded-lg flex items-center justify-center shadow-lg">
                            <Shield className="text-white w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-200">Rapid Crisis Response</span>
                    </div>
                    
                    <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <a href="#" className="hover:text-electric transition-colors">Privacy Protocol</a>
                        <a href="#" className="hover:text-electric transition-colors">Terminal Terms</a>
                        <a href="#" className="hover:text-electric transition-colors">System Status</a>
                    </div>

                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                        &copy; 2026 Emergency Orchestration Systems
                    </p>
                </div>
            </footer>

            {/* Floating Decorative Elements */}
            <div className="fixed top-[20%] right-[-5%] w-px h-[40%] bg-gradient-to-b from-transparent via-electric/20 to-transparent z-[1] hidden xl:block"></div>
            <div className="fixed bottom-[20%] left-[-5%] w-px h-[40%] bg-gradient-to-b from-transparent via-danger/20 to-transparent z-[1] hidden xl:block"></div>
        </div>
    );
}

export default Home;
