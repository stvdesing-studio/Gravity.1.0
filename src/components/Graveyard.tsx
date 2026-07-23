import React, { useState } from 'react';
import { Anomaly } from '../types';
import { ShieldAlert, RefreshCw, CheckCircle2, ChevronRight, Play, Flame } from 'lucide-react';

interface GraveyardProps {
  anomalies: Anomaly[];
  onSolveAnomaly: (id: string) => Promise<void>;
  isLoading: boolean;
}

export default function Graveyard({ anomalies, onSolveAnomaly, isLoading }: GraveyardProps) {
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(anomalies[0] || null);
  const [reinforcingId, setReinforcingId] = useState<string | null>(null);
  const [reinforceConsoleLogs, setReinforceConsoleLogs] = useState<string[]>([]);

  const handleReinforce = async (anomaly: Anomaly) => {
    setReinforcingId(anomaly.id);
    setReinforceConsoleLogs([]);

    // Simulating technical reinforcement logs
    const lines = [
      `[GRID] Launching dynamic calibration for error index ${anomaly.code}...`,
      `[CAPA ${anomaly.layer}] Isolating parsed coordinate cells from source: ${anomaly.fileSource}...`,
      `[GRAVEYARD] Retrieving negative prompt buffer: "${anomaly.negativePrompt}"`,
      `[ORACULO] Injecting negative embedding bounds into the relational model pipeline...`,
      `[MODEL] Context window calibrated successfully. Alignment factor set to 1.618.`,
      `[SYS] Synced database vectors updated. Overlap rules active.`
    ];

    for (let i = 0; i < lines.length; i++) {
      setReinforceConsoleLogs(prev => [...prev, lines[i]]);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    try {
      await onSolveAnomaly(anomaly.id);
      // Update selected anomaly locally to show Solved state
      if (selectedAnomaly && selectedAnomaly.id === anomaly.id) {
        setSelectedAnomaly({ ...selectedAnomaly, solved: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReinforcingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="graveyard-tab">
      
      {/* Column 1: Anomaly Grid List */}
      <div className="col-span-1 space-y-4">
        <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" /> Memory Archive (Graveyard)
            </h3>
            <span className="text-[10px] font-mono text-gray-400">Failure learning logs</span>
          </div>
          
          <p className="text-xs text-gray-400 leading-relaxed">
            Santi Vilanova's custom alignment archive. Any classification discrepancy is captured here and used to calibrate the Oráculo's negative prompts.
          </p>

          <div className="space-y-2">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 font-mono text-xs animate-pulse">
                Accessing archived anomaly matrices...
              </div>
            ) : anomalies.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-mono text-xs">
                No active anomalies captured in this pipeline run.
              </div>
            ) : (
              anomalies.map((anom) => {
                const isSelected = selectedAnomaly?.id === anom.id;

                return (
                  <button
                    key={anom.id}
                    onClick={() => setSelectedAnomaly(anom)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition ${
                      isSelected
                        ? 'bg-red-950/15 border-red-500'
                        : 'bg-brand-slate-dark border-brand-slate-light hover:border-gray-600'
                    }`}
                  >
                    <div className="space-y-1 pr-2 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${anom.solved ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                        <span className="text-xs font-semibold text-white truncate">{anom.title}</span>
                      </div>
                      <div className="flex gap-2 font-mono text-[9px] text-gray-400">
                        <span>{anom.code}</span>
                        <span>•</span>
                        <span>Capa {anom.layer}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Column 2 & 3: Detailed Audit & Reinforcement Interface */}
      <div className="lg:col-span-2 space-y-6">
        {selectedAnomaly ? (
          <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 space-y-6">
            
            {/* Header detail */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-slate-light pb-4">
              <div>
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block">
                  Capa {selectedAnomaly.layer} Exception Report
                </span>
                <h3 className="font-display text-lg font-semibold text-white mt-1">
                  {selectedAnomaly.title}
                </h3>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium ${
                  selectedAnomaly.solved
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800'
                    : 'bg-red-950/40 text-red-400 border border-red-800'
                }`}>
                  {selectedAnomaly.solved ? <CheckCircle2 className="h-3.5 w-3.5" /> : 'Uncalibrated'}
                  {selectedAnomaly.solved ? 'Solved & Aligned' : 'Awaiting Alignment'}
                </span>
              </div>
            </div>

            {/* Error specifics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-brand-slate-dark border border-brand-slate-light space-y-2">
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Discrepancy Details</span>
                <p className="text-xs text-white leading-relaxed font-sans">{selectedAnomaly.error}</p>
                <div className="pt-2 font-mono text-[9px] text-gray-400 border-t border-brand-slate-light/60">
                  Source: <span className="text-brand-gold">{selectedAnomaly.fileSource}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-brand-slate-dark border border-brand-slate-light space-y-2">
                <span className="text-[10px] font-mono text-gray-400 uppercase block flex items-center gap-1">
                  <Flame className="h-3 w-3 text-red-500" /> Negative Prompt Alignment Target
                </span>
                <p className="text-xs text-red-300 italic font-mono leading-relaxed">
                  "{selectedAnomaly.negativePrompt}"
                </p>
                <p className="text-[9px] text-gray-500 font-sans">
                  *This context block acts as a permanent model override filter, preventing matching alignment failures.
                </p>
              </div>
            </div>

            {/* Calibration & Reinforcement Panel */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono text-gray-400 uppercase">Reinforcement Engine Console</h4>
                {!selectedAnomaly.solved && (
                  <button
                    onClick={() => handleReinforce(selectedAnomaly)}
                    disabled={reinforcingId !== null}
                    className="py-2 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider bg-brand-gold text-brand-slate-dark hover:bg-yellow-400 transition flex items-center gap-1.5"
                  >
                    <Play className="h-3 w-3 fill-current" /> Reinforce RAG System
                  </button>
                )}
              </div>

              <div className="h-44 rounded-lg bg-brand-slate-dark border border-brand-slate-light p-3.5 font-mono text-[10px] text-emerald-400 overflow-y-auto space-y-1">
                {reinforceConsoleLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-center">
                    <span>{selectedAnomaly.solved ? 'Alignment calibration complete. Vector constraints locked.' : 'Awaiting reinforcement calibration.'}</span>
                  </div>
                ) : (
                  reinforceConsoleLogs.map((log, idx) => (
                    <div key={idx} className="animate-fadeIn">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-8 text-center text-gray-400 font-mono text-xs">
            Select an anomaly file to audit pipeline calibration vectors.
          </div>
        )}
      </div>

    </div>
  );
}
