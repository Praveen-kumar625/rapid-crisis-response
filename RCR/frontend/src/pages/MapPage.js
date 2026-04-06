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
        <Section className="py-8 bg-navy-950 flex-1 flex flex-col">
            <Container className="flex-1 flex flex-col h-full">
                <header className="mb-8">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
                        Tactical <span className="text-gradient-accent">Map</span>
                    </h2>
                    <p className="text-slate-500 font-mono text-[10px] tracking-[0.3em] uppercase">
                        Real-time visualization of all active signal nodes.
                    </p>
                </header>
                
                {/* 🚨 CRITICAL: The map component must be inside a container with 'flex-1' or 'h-[VALUE]' */}
                <div className="flex-1 w-full min-h-[600px] h-[70vh] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                    <CrisisMap />
                </div>
            </Container>
        </Section>
    );
}

export default MapPage;
