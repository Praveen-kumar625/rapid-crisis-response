import React from 'react';
import CrisisMap from '../components/CrisisMap';
import { Section } from '../components/layout/Section';
import { Container } from '../components/layout/Container';

/**
 * 🚨 ARCHITECTURAL FIX: 
 * Using 'h-[calc(100vh-120px)]' ensures the map has a fixed, visible height
 * relative to the viewport minus the navbar/footer.
 */

function MapPage() {
    return (
        <Section className="py-8 bg-[#0B0F19] flex-1 flex flex-col">
            <Container className="flex-1 flex flex-col h-full">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
                            Tactical <span className="text-cyan-400">Map</span>
                        </h2>
                        <p className="text-slate-500 font-mono text-[10px] tracking-[0.3em] uppercase">
                            Real-time visualization of all active signal nodes.
                        </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 px-4 py-2 hidden md:block">
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest animate-pulse">Live_Feed_Active</span>
                    </div>
                </header>

                {/* 🚨 CRITICAL: The map component must be inside a container with 'flex-1' or 'h-[VALUE]' */}
                <div className="flex-1 w-full min-h-[600px] h-[70vh] rounded-none overflow-hidden border border-slate-800 shadow-tactical">
                    <CrisisMap />
                </div>
            </Container>
        </Section>
    );
}

export default MapPage;
