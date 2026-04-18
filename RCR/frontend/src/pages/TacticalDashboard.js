import React, { Suspense } from 'react';
import { useTactical } from '../context/TacticalContext';

// Existing UI Components - Using Named Imports for Robustness
import { MapPanel } from '../components/MapPanel';
import { TacticalMap } from '../components/TacticalMap';
import { IntelFeed } from '../components/IntelFeed';
import { ActionPanel } from '../components/ActionPanel';
import { AICommand } from '../components/AICommand';

const LoadingState = ({ label }) => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900/50 border border-white/5 animate-pulse">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
);

const TacticalDashboard = () => {
    const { state, dispatch } = useTactical();

    return (
        <div className="h-full w-full p-4 lg:p-6 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 h-full max-h-[calc(100vh-120px)]">
                
                {/* 
                   COLUMN 1-8: PRIMARY TACTICAL GRID (MAP)
                   Occupies 66% of the screen for maximum spatial awareness.
                */}
                <section className="col-span-12 lg:col-span-8 flex flex-col h-full overflow-hidden">
                    <Suspense fallback={<LoadingState label="CALIBRATING_GRID" />}>
                        <MapPanel title="LIVE_SECTOR_MAP">
                            <TacticalMap 
                                incidents={state.incidents} 
                                responders={state.responders}
                                selectedIncident={state.selectedIncident}
                                onSelectIncident={(inc) => dispatch({ type: 'SET_SELECTED_INCIDENT', payload: inc })}
                                filter={state.mapFilter}
                                setFilter={(f) => dispatch({ type: 'SET_MAP_FILTER', payload: f })}
                            />
                        </MapPanel>
                    </Suspense>
                </section>

                {/* 
                   COLUMN 9-12: INTEL & ACTION STACK
                   Right-side sidebar for feeds and input.
                */}
                <section className="col-span-12 lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
                    
                    {/* TOP: Intel Feed & Active Alerts */}
                    <div className="flex-[3] min-h-0 bg-[#0B0F19] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Signal_Relay_Feed</h3>
                            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 text-[8px] font-black uppercase">Active</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            <IntelFeed incidents={state.incidents} />
                        </div>
                    </div>

                    {/* BOTTOM: Operator Action Panel & AI Command */}
                    <div className="flex-[2] min-h-0 bg-[#0B0F19] border border-white/5 flex flex-col overflow-hidden shadow-2xl border-t-2 border-t-cyan-500/50">
                        <ActionPanel>
                            <div className="p-1 h-full">
                                <AICommand />
                            </div>
                        </ActionPanel>
                    </div>

                </section>
            </div>
        </div>
    );
};

export default TacticalDashboard;
