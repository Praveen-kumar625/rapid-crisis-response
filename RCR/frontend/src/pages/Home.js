import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Info, 
    Lock,
    Globe,
    Cpu,
    LogIn
} from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Section } from '../components/layout/Section';
import { Badge } from '../components/ui/Badge';
import { useUI } from '../context/UIContext';
import { TacticalButton } from '../components/ui/TacticalButton';

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
    const { openGuide } = useUI();
    
    return (
        <div className="flex-1 flex flex-col w-full relative bg-[#0B0F19]">
            
            {/* HERO SECTION */}
            <Section className="hero-min-height flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden border-b border-slate-800">
                <motion.div 
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="max-w-6xl mx-auto w-full flex flex-col items-center text-center"
                >
                    <motion.div variants={fadeInUp}>
                        <Badge variant="danger" className="mb-10 py-2 px-4 shadow-[0_0_20px_rgba(220,38,38,0.2)] rounded-none border border-red-500 text-red-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                            Emergency Orchestration v4.0
                        </Badge>
                    </motion.div>

                    <motion.h1 
                        variants={fadeInUp}
                        className="font-black tracking-tighter leading-[0.95] mb-8 lg:mb-12 text-responsive-h1 break-word"
                    >
                        <span className="block text-slate-100">THE GOLDEN</span>
                        <span className="block text-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.3)] text-balance">
                            HOUR RECLAIMED.
                        </span>
                    </motion.h1>

                    <motion.p 
                        variants={fadeInUp}
                        className="max-w-3xl mx-auto text-base md:text-xl lg:text-2xl text-slate-400 font-light leading-relaxed mb-12 lg:mb-16"
                    >
                        Rapid Crisis Response (RCR) leverages <span className="text-cyan-400 font-medium">Edge AI</span> to orchestrate safety in high-stakes hospitality. Zero-latency triage when seconds define outcomes.
                    </motion.p>

                    <motion.div 
                        variants={fadeInUp}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto"
                    >
                        <Link to="/report" className="w-full sm:w-auto">
                            <TacticalButton variant="danger" className="w-full sm:w-auto !py-6 !px-12 text-sm">
                                INITIATE_SOS_SIGNAL
                            </TacticalButton>
                        </Link>
                        
                        <Link to="/map" className="w-full sm:w-auto">
                            <TacticalButton variant="primary" className="w-full sm:w-auto !py-6 !px-12 text-sm">
                                COMMAND_CENTER
                            </TacticalButton>
                        </Link>

                        <Link to="/login" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto py-6 px-12 text-xs font-black uppercase tracking-widest border border-cyan-500/50 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-500 hover:text-[#060B13] transition-all flex items-center justify-center gap-2 group">
                                <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                                OPERATIVE_LOGIN
                            </button>
                        </Link>
                    </motion.div>

                    <motion.button
                        variants={fadeInUp}
                        onClick={openGuide}
                        className="mt-8 flex items-center gap-2 text-cyan-400 font-black uppercase text-[10px] tracking-[0.2em] p-4 border border-cyan-900/30 bg-cyan-950/20 hover:bg-cyan-900/10 transition-colors"
                    >
                        <Info size={16} /> Open Operational_Manual
                    </motion.button>

                    <motion.div 
                        variants={fadeInUp}
                        className="hidden lg:flex items-center gap-12 mt-24 opacity-60 font-mono text-[10px] tracking-[0.2em] uppercase text-slate-500"
                    >   
                        <div className="flex items-center gap-2"><Lock size={12} /> Encrypted P2P</div>
                        <div className="flex items-center gap-2"><Globe size={12} /> Global Sync</div>
                        <div className="flex items-center gap-2"><Cpu size={12} /> Gemini 1.5 Pro</div>
                    </motion.div>
                </motion.div>
            </Section>

            {/* FOOTER */}
            <footer className="relative z-10 border-t border-slate-800 py-12 bg-[#0B0F19] px-6">
                <Container className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-100">Rapid Crisis Response</span>
                    </div>
                    
                    <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors">Terminal</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors">Status</a>
                    </div>

                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 tabular-nums">
                        &copy; 2026 Emergency Systems
                    </p>
                </Container>
            </footer>
        </div>
    );
}

export default Home;