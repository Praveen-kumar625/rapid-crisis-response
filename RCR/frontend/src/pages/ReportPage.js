import React from 'react';
import ReportForm from '../components/ReportForm';
import { Section } from '../components/layout/Section';
import { Container } from '../components/layout/Container';
import { ShieldAlert } from 'lucide-react';

function ReportPage() {
    return (
        <Section className="min-h-[calc(100vh-80px)] flex items-center justify-center pt-12 pb-24">
            <Container className="max-w-3xl">
                <header className="mb-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-danger/10 text-danger border border-danger/20 rounded-3xl flex items-center justify-center mb-8 shadow-danger animate-pulse">
                        <ShieldAlert size={40} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-4xl font-black tracking-tight uppercase">Emergency <span className="text-gradient-accent">Dispatch</span></h2>
                    <p className="text-slate-400 mt-4 text-lg font-light leading-relaxed max-w-md">
                        Encrypted transmission to local response nodes. Edge AI triage active.
                    </p>
                </header>
                
                <ReportForm />
            </Container>
        </Section>
    );
}

export default ReportPage;
