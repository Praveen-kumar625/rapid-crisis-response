import React from 'react';
import CrisisMap from '../components/CrisisMap';
import { Section } from '../components/layout/Section';
import { Container } from '../components/layout/Container';

function MapPage() {
    return (
        <Section className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0B0F19]">
            <Container className="flex-1 flex flex-col h-full min-h-0 px-4 md:px-8 py-4">
                <header className="mb-4 flex justify-between items-end shrink-0">
                    <div>
                        <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight text-white">
                            Tactical <span className="text-cyan-400">Map</span>
                        </h2>
                        <p className="text-slate-500 font-mono text-[8px] md:text-[10px] tracking-widest uppercase">
                            Real-time signal node visualization
                        </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 px-4 py-2 hidden md:block">
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest animate-pulse">Live_Feed_Active</span>
                    </div>
                </header>

                <div className="flex-1 w-full min-h-0 relative rounded-none overflow-hidden border border-slate-800 shadow-tactical">
                    <CrisisMap />
                </div>
            </Container>
        </Section>
    );
}

export default MapPage;
