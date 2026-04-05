import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Shield, 
    ShieldAlert,
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
import { Container } from '../components/layout/Container';
import { Section } from '../components/layout/Section';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

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
        <div className="flex-1 flex flex-col w-full relative overflow-hidden">
            
            {/* HERO SECTION */}
            <Section className="hero-min-height flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden border-b border-white/5">
                <motion.div 
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="max-w-6xl mx-auto w-full flex flex-col items-center text-center"
                >
                    <motion.div variants={fadeInUp}>
                        <Badge variant="danger" className="mb-10 py-2 px-4 shadow-[0_0_30px_rgba(255,51,102,0.2)]">
                            <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
                            Emergency Orchestration v4.0
                        </Badge>
                    </motion.div>

                    <motion.h1 
                        variants={fadeInUp}
                        className="text-4xl sm:text-7xl lg:text-9xl font-black tracking-tighter leading-[0.95] mb-8 lg:mb-12"
                    >
                        <span className="block text-white">THE GOLDEN</span>
                        <span className="block text-gradient-accent drop-shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                            HOUR RECLAIMED.
                        </span>
                    </motion.h1>

                    <motion.p 
                        variants={fadeInUp}
                        className="max-w-3xl mx-auto text-lg md:text-2xl text-slate-300 font-light leading-relaxed mb-12 lg:mb-16"
                    >
                        Rapid Crisis Response (RCR) leverages <span className="text-secondary-light font-medium">Edge AI</span> to orchestrate safety in high-stakes hospitality. Zero-latency triage when seconds define outcomes.
                    </motion.p>

                    <motion.div 
                        variants={fadeInUp}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto"
                    >
                        <Link to="/report" className="w-full sm:w-auto">
                            <Button variant="primary" className="btn-accent w-full sm:w-auto px-12 py-6 text-base" aria-label="Initiate SOS Report">
                                <ShieldAlert size={20} />
                                Initiate SOS Report
                            </Button>
                        </Link>
                        
                        <Link to="/map" className="w-full sm:w-auto">
                            <Button variant="secondary" className="w-full sm:w-auto px-12 py-6 text-base group" aria-label="View Live Command Map">
                                <MapIcon size={20} className="group-hover:text-secondary-light transition-colors" />
                                Command Map
                                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div 
                        variants={fadeInUp}
                        className="hidden lg:flex items-center gap-12 mt-24 opacity-40 font-mono text-[10px] tracking-[0.2em] uppercase text-slate-500"
                    >
                        <div className="flex items-center gap-2"><Lock size={12} /> Encrypted P2P</div>
                        <div className="flex items-center gap-2"><Globe size={12} /> Global Sync</div>
                        <div className="flex items-center gap-2"><Cpu size={12} /> Gemini 1.5 Pro</div>
                    </motion.div>
                </motion.div>
            </Section>

            {/* FEATURES SECTION */}
            <Section className="bg-navy-900/20">
                <Container>
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 lg:mb-24 gap-8">
                        <div className="max-w-2xl">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary-light mb-4 flex items-center gap-3">
                                <span className="w-8 h-px bg-secondary"></span> Intelligence Core
                            </h2>
                            <h3 className="text-4xl lg:text-6xl font-black tracking-tight text-white leading-tight uppercase">
                                Redefining the <br />
                                <span className="text-slate-500 text-gradient">Security Stack.</span>
                            </h3>
                        </div>
                        <p className="max-w-sm text-slate-300 font-light leading-relaxed border-l border-white/10 pl-6">
                            Modern hospitality requires more than reactive reporting. It requires proactive AI orchestration.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="group p-10 lg:p-12 hover:bg-white/[0.07] border-t-2 border-t-secondary/30 hover:border-t-secondary">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity size={120} strokeWidth={1} />
                            </div>
                            <div className="w-16 h-16 bg-secondary/10 text-secondary-light rounded-2xl flex items-center justify-center mb-10 border border-secondary/20 group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(13,148,136,0.3)]">
                                <Fingerprint size={32} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-2xl font-bold mb-4 text-white tracking-wide uppercase">Multimodal Triage</h4>
                            <p className="text-slate-400 font-light leading-relaxed text-sm">
                                Our engine deciphers voice, vision, and sensory data in real-time, calculating impact severity with sub-second latency using distributed AI models.
                            </p>
                        </Card>

                        <Card className="group p-10 lg:p-12 hover:bg-white/[0.07] border-t-2 border-t-accent/30 hover:border-t-accent">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <MapIcon size={120} strokeWidth={1} />
                            </div>
                            <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-10 border border-accent/20 group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                <Activity size={32} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-2xl font-bold mb-4 text-white tracking-wide uppercase">Indoor PostGIS</h4>
                            <p className="text-slate-400 font-light leading-relaxed text-sm">
                                Legacy maps fail indoors. RCR provides centimeter-perfect room and floor level tracking, ensuring responders are deployed with surgical precision.
                            </p>
                        </Card>

                        <Card className="group p-10 lg:p-12 hover:bg-white/[0.07] border-t-2 border-t-electric/30 hover:border-t-electric">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <WifiOff size={120} strokeWidth={1} />
                            </div>
                            <div className="w-16 h-16 bg-electric/10 text-electric rounded-2xl flex items-center justify-center mb-10 border border-electric/20 group-hover:scale-110 transition-all duration-500 shadow-electric">
                                <WifiOff size={32} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-2xl font-bold mb-4 text-white tracking-wide uppercase">Offline Edge</h4>
                            <p className="text-slate-400 font-light leading-relaxed text-sm">
                                Network failure is a critical threat. Our Edge AI continues to function in complete isolation, syncing data the moment connectivity is restored.
                            </p>
                        </Card>
                    </div>
                </Container>
            </Section>

            {/* CHALLENGE LOGOS */}
            <Section className="py-20 border-t border-white/5">
                <Container className="flex flex-col items-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500 mb-12">Developed for the 2026 Solution Challenge</p>
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
                </Container>
            </Section>

            {/* FOOTER */}
            <footer className="relative z-10 border-t border-white/5 py-12 bg-navy-950/50 backdrop-blur-md px-6">
                <Container className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-danger to-red-900 rounded-lg flex items-center justify-center shadow-lg">
                            <Shield className="text-white w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-200">Rapid Crisis Response</span>
                    </div>
                    
                    <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <a href="#" className="hover:text-electric transition-colors">Privacy</a>
                        <a href="#" className="hover:text-electric transition-colors">Terminal</a>
                        <a href="#" className="hover:text-electric transition-colors">Status</a>
                    </div>

                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                        &copy; 2026 Emergency Systems
                    </p>
                </Container>
            </footer>
        </div>
    );
}

export default Home;
