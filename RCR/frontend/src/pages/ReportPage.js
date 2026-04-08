import React from 'react';
import ReportForm from '../components/ReportForm';
import { Section } from '../components/layout/Section';
import { Container } from '../components/layout/Container';
import { ShieldAlert } from 'lucide-react';

function ReportPage() {
    return (
        <Section className="min-h-[calc(100vh-80px)] flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center pt-12 pb-24 bg-[#0B0F19]">
            <Container className="max-w-3xl">
                <header className="mb-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-red-600/10 text-red-500 border border-red-500/30 rounded-none flex items-center justify-center mb-8 shadow-neon-red animate-pulse">
                        <ShieldAlert size={40} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-4xl font-black tracking-tight uppercase text-slate-100">Emergency <span className="text-red-500">Dispatch</span></h2>
                    <p className="text-slate-500 mt-4 text-sm font-mono uppercase tracking-widest max-w-md">
                        Encrypted transmission to local response nodes. Edge AI triage active.
                    </p>
                </header>
                
                <ReportForm />
            </Container>
        </Section>
    );
}

export default ReportPage;
