import React, { useState, useEffect } from 'react';
import { GravityIndexRow, Anomaly } from '../types';
import { 
  Database, ShieldAlert, CheckCircle2, ChevronRight, HelpCircle, 
  Trash2, Flame, Loader2, Sparkles, Filter, Search, Check, FileCode
} from 'lucide-react';

interface HubArchivoProps {
  gravityIndexRows: GravityIndexRow[];
  onResolveLimbo: (idGlobal: string, overrideNode: 'Structural Core' | 'Visual Engine' | 'Business Core', feedback: string, restriction: string) => Promise<void>;
  anomalies: Anomaly[];
  onSolveAnomaly: (id: string) => Promise<void>;
  isSyncingSheets?: boolean;
  onSyncSheets?: () => void;
  neuralPath?: string;
}

export default function HubArchivo({
  gravityIndexRows,
  onResolveLimbo,
  anomalies,
  onSolveAnomaly,
  isSyncingSheets = false,
  onSyncSheets,
  neuralPath = 'balanced-equilibrium'
}: HubArchivoProps) {
  // Local filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTheme, setFilterTheme] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Sync index filter with descending pathway
  useEffect(() => {
    if (neuralPath === 'steel-overload') {
      setFilterTheme('Structural Core');
    } else if (neuralPath === 'brand-expression') {
      setFilterTheme('Visual Engine');
    } else if (neuralPath === 'profit-maximization') {
      setFilterTheme('Business Core');
    } else {
      setFilterTheme('All');
    }
  }, [neuralPath]);

  // Human-in-the-Loop Operator Intervention
  const [resolvingRow, setResolvingRow] = useState<GravityIndexRow | null>(null);
  const [operatorPrimary, setOperatorPrimary] = useState<'Structural Core' | 'Visual Engine' | 'Business Core'>('Structural Core');
  const [operatorFeedback, setOperatorFeedback] = useState('');
  const [operatorRestriction, setOperatorRestriction] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Reinforcement simulated states for anomalies
  const [reinforcingId, setReinforcingId] = useState<string | null>(null);
  const [reinforceConsoleLogs, setReinforceConsoleLogs] = useState<string[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(anomalies[0] || null);

  const handleOperatorIntervene = (row: GravityIndexRow) => {
    setResolvingRow(row);
    setOperatorFeedback(`Operator alignment manually calibrated. Document is overriding gravitational coordinates to ${operatorPrimary} to lock structural integrity.`);
    setOperatorRestriction("Restrict overlapping visuals within critical welded joint spatial boundaries.");
  };

  const handleSaveResolution = async () => {
    if (!resolvingRow) return;
    setIsResolving(true);
    try {
      await onResolveLimbo(
        resolvingRow.idGlobal,
        operatorPrimary,
        operatorFeedback,
        operatorRestriction
      );
      setResolvingRow(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleReinforceAnomaly = async (anomaly: Anomaly) => {
    setReinforcingId(anomaly.id);
    setReinforceConsoleLogs([]);

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
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    try {
      await onSolveAnomaly(anomaly.id);
      if (selectedAnomaly && selectedAnomaly.id === anomaly.id) {
        setSelectedAnomaly({ ...selectedAnomaly, solved: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReinforcingId(null);
    }
  };

  // Filter gravity index rows
  const filteredRows = gravityIndexRows.filter(row => {
    const matchesSearch = row.nombreArchivo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          row.idGlobal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTheme = filterTheme === 'All' || row.gravedadPrimaria === filterTheme;
    const matchesStatus = filterStatus === 'All' || row.estadoOperativo === filterStatus;
    return matchesSearch && matchesTheme && matchesStatus;
  });

  return (
    <div className="bg-[#FFFFFF] border-2 border-[#2D2D2D] p-6 rounded-none relative overflow-hidden" id="hub-archivo">
      {/* Dynamic Zone Delimitation */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#E5C158]" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="industry-ultra-italic-mono text-xs text-[#1A3A4B] block">PHASE 05 / STORAGE & ANOMALIES</span>
          <h2 className="industry-ultra-italic text-3xl text-black leading-none mt-1">
            [ HUB 05 : ARCHIVO_Y_LIMBO_ANOMALIAS ]
          </h2>
          <p className="text-xs text-gray-600 font-mono italic mt-1">
            Browse the master index, resolve gravitational ties (Human-in-the-Loop), and exorcise structural/visual anomalies.
          </p>
        </div>

        {onSyncSheets && (
          <button
            onClick={onSyncSheets}
            disabled={isSyncingSheets}
            className="bg-[#2D2D2D] hover:bg-black text-[#7FFF00] disabled:bg-gray-300 disabled:text-gray-500 font-mono font-bold text-xs px-4 py-2 uppercase flex items-center gap-1.5 transition"
          >
            {isSyncingSheets ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> SYNCING...
              </>
            ) : (
              <>
                <Database className="h-3.5 w-3.5" /> SYNC MATRIX TO GOOGLE SHEETS
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MASTER GRAVITY INDEX */}
        <div className="lg:col-span-8 border border-[#2D2D2D] p-4 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2D2D2D]/10 pb-3">
            <h3 className="industry-ultra-italic text-sm text-[#1A3A4B] flex items-center gap-1.5">
              <Database className="h-4 w-4 text-cyan-500" /> Master Gravity Index
            </h3>

            {/* In-place Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search index..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white border border-gray-300 text-xs font-mono focus:outline-none focus:border-[#7FFF00] w-[140px]"
                />
              </div>

              <select
                value={filterTheme}
                onChange={(e) => setFilterTheme(e.target.value)}
                className="bg-white border border-gray-300 text-xs font-mono py-1 px-1 focus:outline-none"
              >
                <option value="All">All Themes</option>
                <option value="Structural Core">Structural</option>
                <option value="Visual Engine">Visual</option>
                <option value="Business Core">Business</option>
                <option value="Unassigned">Unassigned</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-gray-300 text-xs font-mono py-1 px-1 focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Activo">Active</option>
                <option value="LimboAnomalía">Limbo</option>
              </select>
            </div>
          </div>

          {/* Index table */}
          <div className="overflow-x-auto border border-gray-200">
            <table className="w-full text-left text-[11px] font-mono divide-y divide-gray-200">
              <thead className="bg-[#F5F5F7]">
                <tr>
                  <th className="p-2.5 text-black font-bold uppercase">ID</th>
                  <th className="p-2.5 text-black font-bold uppercase">Filename</th>
                  <th className="p-2.5 text-black font-bold uppercase">Level</th>
                  <th className="p-2.5 text-black font-bold uppercase">Assigned Attractor</th>
                  <th className="p-2.5 text-black font-bold uppercase">Attraction %</th>
                  <th className="p-2.5 text-black font-bold uppercase">Status</th>
                  <th className="p-2.5 text-black font-bold uppercase text-right">Intervene</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 italic">
                      No records found in the Gravity memory matrix.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isLimbo = row.estadoOperativo === 'LimboAnomalía';
                    return (
                      <tr key={row.idGlobal} className={isLimbo ? 'bg-red-50/20' : 'hover:bg-gray-50'}>
                        <td className="p-2.5 font-bold text-gray-800">{row.idGlobal}</td>
                        <td className="p-2.5 font-bold text-black max-w-[160px] truncate" title={row.nombreArchivo}>
                          {row.nombreArchivo}
                        </td>
                        <td className="p-2.5">
                          <span className="bg-[#F5F5F7] px-1.5 py-0.5 border border-gray-300">
                            N{row.nivelSistema}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`font-bold ${
                            row.gravedadPrimaria === 'Structural Core' ? 'text-cyan-600' :
                            row.gravedadPrimaria === 'Visual Engine' ? 'text-[#B2902C]' :
                            row.gravedadPrimaria === 'Business Core' ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {row.gravedadPrimaria}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-black">{row.fuerzaAtraccion}%</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                            isLimbo ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {row.estadoOperativo === 'LimboAnomalía' ? 'LIMBO TIE' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {isLimbo ? (
                            <button
                              onClick={() => handleOperatorIntervene(row)}
                              className="bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-[9px] px-2 py-1 uppercase"
                            >
                              RESOLVE
                            </button>
                          ) : (
                            <span className="text-gray-300 text-[10px] italic">Calibrated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Operator Limbo Resolver Form */}
          {resolvingRow && (
            <div className="border-2 border-red-500 bg-red-50/10 p-4 space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-red-500/20 pb-2">
                <span className="text-xs font-bold text-red-700 uppercase font-mono">
                  ⚠️ HUMAN-IN-THE-LOOP INTERVENTION COORD: {resolvingRow.idGlobal}
                </span>
                <button 
                  onClick={() => setResolvingRow(null)}
                  className="text-gray-500 hover:text-black font-mono font-bold text-xs"
                >
                  CANCEL
                </button>
              </div>

              <p className="text-[10px] text-gray-600 font-mono">
                <strong>Limbo Gravity Conflict:</strong> "{resolvingRow.nombreArchivo}" has equal visual and structural weights. Override spatial mapping coordinates manually to prevent AI system alignment drifts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[9px] font-mono font-bold text-gray-500 uppercase block mb-1">Target Attractor Node</label>
                  <select
                    value={operatorPrimary}
                    onChange={(e) => setOperatorPrimary(e.target.value as any)}
                    className="w-full bg-white border border-gray-300 text-xs font-mono p-1.5 focus:outline-none"
                  >
                    <option value="Structural Core">Structural Core (Physics/AISC)</option>
                    <option value="Visual Engine">Visual Engine (Vilanova Branding)</option>
                    <option value="Business Core">Business Core (Pricing/Margining)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[9px] font-mono font-bold text-gray-500 uppercase block mb-1">Override Audit Feedback</label>
                  <input
                    type="text"
                    value={operatorFeedback}
                    onChange={(e) => setOperatorFeedback(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-xs font-mono p-1.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-gray-500 uppercase block mb-1">Restrictive Negative Prompt Buffer</label>
                <input
                  type="text"
                  value={operatorRestriction}
                  onChange={(e) => setOperatorRestriction(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-xs font-mono p-1.5 focus:outline-none"
                  placeholder="e.g. Do not group structural steel elements within logo clear zones..."
                />
              </div>

              <div className="text-right">
                <button
                  onClick={handleSaveResolution}
                  disabled={isResolving}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-mono font-bold text-xs px-4 py-2 uppercase"
                >
                  {isResolving ? 'OVERRIDING COORDS...' : '[ CONFIRM OPERATOR CALIBRATION ]'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GRAVEYARD ANOMALIES & NEGATIVE PROMPTS */}
        <div className="lg:col-span-4 border border-[#2D2D2D] p-4 bg-[#FDF9ED] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="industry-ultra-italic text-sm text-[#B2902C] border-b border-[#2D2D2D]/10 pb-2 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-red-500" /> Active Anomalies Archive
            </h3>

            <p className="text-[10px] font-mono text-gray-600 leading-relaxed">
              When documents trigger safety violations (e.g., minimum fillet weld sizes, margins under 35%), they generate anomalies in the Graveyard, triggering negative corrective buffers.
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {anomalies.length === 0 ? (
                <div className="p-6 text-center text-[10px] font-mono text-gray-500 bg-white border border-gray-200">
                  Zero active anomalies mapped in local vector space.
                </div>
              ) : (
                anomalies.map((anom) => {
                  const isSelected = selectedAnomaly?.id === anom.id;
                  return (
                    <button
                      key={anom.id}
                      onClick={() => setSelectedAnomaly(anom)}
                      className={`w-full text-left p-2.5 border text-xs font-mono transition flex justify-between items-center ${
                        isSelected 
                          ? 'bg-red-50 border-red-500' 
                          : 'bg-white border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-black block truncate">{anom.title}</span>
                        <span className="text-[9px] text-gray-400 font-mono uppercase">{anom.code} • Layer {anom.layer}</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {selectedAnomaly && (
            <div className="mt-4 pt-3 border-t border-[#2D2D2D]/10 space-y-3 animate-fadeIn">
              <div className="bg-white p-3 border border-red-200 space-y-2">
                <span className="text-[9px] font-mono uppercase font-bold text-red-600 block">Anomaly Detail Log</span>
                <h4 className="text-xs font-bold text-black">{selectedAnomaly.title}</h4>
                <p className="text-[10px] text-gray-600 font-mono leading-normal select-all">
                  "{selectedAnomaly.error}"
                </p>
                <div className="text-[9px] font-mono text-[#1A3A4B] bg-[#EAF2F5] p-2 border border-cyan-100">
                  <strong>Retrieved corrective negative buffer:</strong><br />
                  "{selectedAnomaly.negativePrompt}"
                </div>

                {!selectedAnomaly.solved ? (
                  <button
                    onClick={() => handleReinforceAnomaly(selectedAnomaly)}
                    disabled={reinforcingId !== null}
                    className="w-full bg-[#2D2D2D] hover:bg-black text-[#7FFF00] disabled:bg-gray-300 disabled:text-gray-500 font-mono font-bold text-[10px] py-2 uppercase flex items-center justify-center gap-1.5"
                  >
                    <Flame className="h-3 w-3 text-red-500" />
                    {reinforcingId === selectedAnomaly.id ? 'CALIBRATING...' : 'REINFORCE & RESOLVE'}
                  </button>
                ) : (
                  <div className="p-2 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold text-center border border-emerald-200">
                    ✓ ANOMALY EXORCISED SUCCESSFULLY
                  </div>
                )}
              </div>

              {/* Console log reinforcement output */}
              {reinforcingId === selectedAnomaly.id && reinforceConsoleLogs.length > 0 && (
                <div className="bg-black text-xs font-mono p-3 border-2 border-[#2D2D2D] text-emerald-400 h-[100px] overflow-y-auto space-y-1 rounded">
                  {reinforceConsoleLogs.map((log, idx) => (
                    <div key={idx} className="text-[9px] leading-tight font-mono select-all">{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
