import React, { useState, useEffect, useRef } from 'react';
import { SentinelLog, MatrixRow, Anomaly, GravityIndexRow } from './types';
import HubIngesta from './components/HubIngesta';
import HubProcesamiento from './components/HubProcesamiento';
import HubGravedad from './components/HubGravedad';
import HubOraculo from './components/HubOraculo';
import HubArchivo from './components/HubArchivo';
import { User } from 'firebase/auth';

import { 
  Volume2, VolumeX, Activity, Compass, Database, ShieldAlert, Cpu, Sparkles 
} from 'lucide-react';

import { findSTVFolder, listFolderFiles, createSTVFolder } from './lib/drive';
import { 
  createMatrixSpreadsheet, listSpreadsheetsInFolder, writeSpreadsheetValues 
} from './lib/sheets';

export default function App() {
  // Shared application data state
  const [logs, setLogs] = useState<SentinelLog[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [gravityIndexRows, setGravityIndexRows] = useState<GravityIndexRow[]>([]);

  // Interactive slider parameters passed down to respective hubs
  const [chunkSize, setChunkSize] = useState(500);
  const [overlap, setOverlap] = useState(50);
  
  const [structuralPull, setStructuralPull] = useState(0.85);
  const [visualPull, setVisualPull] = useState(0.75);
  const [businessPull, setBusinessPull] = useState(0.70);
  const [fibrationFreq, setFibrationFreq] = useState(0.05);
  const [fibrationAmp, setFibrationAmp] = useState(15);

  // Descending Dynamic Neural Pathway Routing state
  const [neuralPath, setNeuralPath] = useState<string>('balanced-equilibrium');

  const handleNeuralPathChange = (path: string) => {
    setNeuralPath(path);
    if (path === 'steel-overload') {
      setStructuralPull(1.45);
      setVisualPull(0.20);
      setBusinessPull(0.30);
      setFibrationFreq(0.01);
      setFibrationAmp(5);
      setChunkSize(400);
      setOverlap(40);
    } else if (path === 'brand-expression') {
      setStructuralPull(0.15);
      setVisualPull(1.35);
      setBusinessPull(0.40);
      setFibrationFreq(0.18);
      setFibrationAmp(35);
      setChunkSize(750);
      setOverlap(100);
    } else if (path === 'profit-maximization') {
      setStructuralPull(0.25);
      setVisualPull(0.35);
      setBusinessPull(1.50);
      setFibrationFreq(0.09);
      setFibrationAmp(20);
      setChunkSize(300);
      setOverlap(20);
    } else {
      // Balanced Equilibrium
      setStructuralPull(0.85);
      setVisualPull(0.75);
      setBusinessPull(0.70);
      setFibrationFreq(0.05);
      setFibrationAmp(15);
      setChunkSize(500);
      setOverlap(50);
    }
  };

  // loading metrics
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(false);

  // Ingestion parsing flow states
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsingSteps, setParsingSteps] = useState<any[] | null>(null);
  const [totalTokensCalculated, setTotalTokensCalculated] = useState<number | undefined>(undefined);

  // Google OAuth credentials passed down to ingestion & sheets sync
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  // Audio Synthetic Fibration State
  const [isSonicActive, setIsSonicActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  // Fetch initial data
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/gravity/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchMatrix = async () => {
    setIsLoadingMatrix(true);
    try {
      const res = await fetch('/api/gravity/matrix');
      if (res.ok) {
        const data = await res.json();
        setMatrix(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  const fetchAnomalies = async () => {
    setIsLoadingAnomalies(true);
    try {
      const res = await fetch('/api/gravity/anomalies');
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnomalies(false);
    }
  };

  const fetchGravityIndex = async () => {
    try {
      const res = await fetch('/api/gravity/index');
      if (res.ok) {
        const data = await res.json();
        setGravityIndexRows(data);
      }
    } catch (err) {
      console.error("Failed to read master gravity index:", err);
    }
  };

  const refreshAllData = () => {
    fetchLogs();
    fetchMatrix();
    fetchAnomalies();
    fetchGravityIndex();
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Sync added log
  const handleAddLog = (newLog: SentinelLog) => {
    setLogs(prev => [newLog, ...prev]);
    fetchAnomalies();
    fetchGravityIndex();
  };

  // Google Sheets Direct Sync
  const handleSyncToSheets = async () => {
    if (!accessToken || needsAuth) {
      alert("Please authenticate with Google first via Hub 01 Ingesta.");
      return;
    }
    setIsSyncingSheets(true);
    try {
      // 1. Locate STV folder in operator Drive
      let activeFolderId = folderId;
      if (!activeFolderId) {
        activeFolderId = await findSTVFolder(accessToken);
        if (!activeFolderId) {
          activeFolderId = await createSTVFolder(accessToken);
        }
        setFolderId(activeFolderId);
      }

      // 2. Locate or create spreadsheet
      const sheetsList = await listSpreadsheetsInFolder(activeFolderId, accessToken);
      let targetSheetId = "";
      
      const existing = sheetsList.find((f: any) => f.name === 'STV Brain DB Matrix Sync');
      if (existing) {
        targetSheetId = existing.id;
      } else {
        targetSheetId = await createMatrixSpreadsheet(activeFolderId, accessToken);
      }

      // 3. Prepare rows for write payload
      const sheetRows = matrix.map(m => ({
        theme: m.theme,
        code: m.code,
        name: m.name,
        description: m.description,
        weight: m.weight,
        parameters: m.parameters
      }));

      // 4. Synchronize values
      await writeSpreadsheetValues(targetSheetId, sheetRows, accessToken);
      alert(`✓ Synchronisation complete! Successfully synced ${matrix.length} records to Google Spreadsheet: "STV Brain DB Matrix Sync" in your connected Drive directory.`);
    } catch (err: any) {
      console.error(err);
      alert(`Synchronisation failed: ${err.message || err}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Handle document parsing trigger from Hub 01
  const handleIngestText = async (title: string, text: string) => {
    setIsProcessing(true);
    setParsingSteps(null);
    setTotalTokensCalculated(undefined);
    try {
      // 1. Trigger core tectonic parsing (9 capas)
      const parseRes = await fetch('/api/gravity/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: title,
          documentText: text,
          chunkSize,
          overlap
        })
      });

      if (!parseRes.ok) throw new Error("Tectonic parser failed to process stream.");
      const parseData = await parseRes.json();
      
      setParsingSteps(parseData.steps);
      setTotalTokensCalculated(parseData.totalTokens);
      handleAddLog(parseData.logCreated);

      // 2. Trigger auto-classification into the Master Gravity Index
      const indexRes = await fetch('/api/gravity/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreArchivo: title,
          pathDrive: folderId || "1VQDo1WYR7nZ779BpLNnTjz0WOPQmLqf6",
          nivelSistema: 5,
          nodoPadre: title.includes("AISC") || title.includes("Weld") ? "07. Conexiones" : "21. Motor Visual",
          documentText: text
        })
      });

      if (indexRes.ok) {
        await fetchGravityIndex();
      }

      // Scroll smoothly down to tectonic processing hub so they see the result immediately!
      const procHub = document.getElementById('hub-procesamiento');
      procHub?.scrollIntoView({ behavior: 'smooth' });

    } catch (err: any) {
      console.error(err);
      alert(`Ingestion parsing error: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Solve anomaly in graveyard
  const handleSolveAnomaly = async (id: string) => {
    try {
      const res = await fetch('/api/gravity/anomalies/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setAnomalies(prev => prev.map(a => a.id === id ? { ...a, solved: true } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve gravity limbo tie (Human-in-the-Loop)
  const handleResolveLimbo = async (
    idGlobal: string, 
    overrideNode: 'Structural Core' | 'Visual Engine' | 'Business Core', 
    feedback: string, 
    restriction: string
  ) => {
    try {
      const res = await fetch('/api/gravity/index/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idGlobal,
          gravedadPrimaria: overrideNode,
          feedbackOperador: feedback,
          restriccionStv: restriction,
          adnSuccessCase: 'S'
        })
      });
      if (res.ok) {
        await fetchGravityIndex();
        
        // Push a matrix record if resolving a limbo creates a new guideline reference!
        const matchedIndex = gravityIndexRows.find(r => r.idGlobal === idGlobal);
        if (matchedIndex) {
          const mRes = await fetch('/api/gravity/matrix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              theme: overrideNode,
              code: `OVR-${idGlobal}`,
              name: `Calibration: ${matchedIndex.nombreArchivo.substring(0, 24)}`,
              description: feedback,
              weight: 0.9,
              parameters: `restriction: ${restriction.substring(0, 35)}`
            })
          });
          if (mRes.ok) {
            await fetchMatrix();
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Audio Synthetic Pulse Fibration
  const toggleSonicFibration = () => {
    if (isSonicActive) {
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch (e) {}
        oscRef.current.disconnect();
      }
      if (lfoRef.current) {
        try { lfoRef.current.stop(); } catch (e) {}
        lfoRef.current.disconnect();
      }
      setIsSonicActive(false);
    } else {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, ctx.currentTime); 

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime); 

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.05, ctx.currentTime); 
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(0);
        lfo.start(0);

        oscRef.current = osc;
        lfoRef.current = lfo;
        gainRef.current = gainNode;
        setIsSonicActive(true);
      } catch (err) {
        console.error("Audio block:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#111113] text-[#F8F7F4] font-sans tactical-italic selection:bg-[#00E5FF] selection:text-black relative flex flex-col md:h-screen md:overflow-hidden p-2">
      
      {/* Structural viewport border */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr_300px] grid-rows-[auto_1fr] border border-[rgba(248,247,244,0.15)] overflow-hidden h-full">
        
        {/* HEADER */}
        <header className="col-span-1 md:col-span-3 border-b border-[rgba(248,247,244,0.15)] px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 bg-[#111113]">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-[#F8F7F4] font-display">
              GRAVITY_CORE
            </h1>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#00E5FF]">
              Audit Control v3.5.0
            </span>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={toggleSonicFibration}
              className={`border border-[rgba(248,247,244,0.15)] px-3 py-1.5 font-mono text-[10px] uppercase font-bold flex items-center gap-2 transition cursor-pointer ${
                isSonicActive ? 'bg-[#7FFF00] text-black animate-pulse border-[#7FFF00]' : 'hover:bg-white/5 text-[#F8F7F4]'
              }`}
              title={isSonicActive ? "Mute Sonic Hum" : "Activate Sonic Fibration"}
            >
              {isSonicActive ? (
                <>
                  <Volume2 className="h-3 w-3 text-black" /> HUM: ON (0.05Hz)
                </>
              ) : (
                <>
                  <VolumeX className="h-3 w-3 text-gray-400" /> HUM: OFF
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
              <span className="text-[#00E5FF] font-bold">SYNC: CONNECTED</span>
              <span className="text-[#E5C158] font-bold ml-2">HUM_ENGINE: ACTIVE</span>
            </div>
          </div>
        </header>

        {/* LEFT PANE: NAVIGATION & CONTROLS */}
        <div className="border-r border-[rgba(248,247,244,0.15)] p-5 overflow-y-auto space-y-8 bg-[#111113] relative z-10 md:max-h-full">
          <div className="space-y-2">
            <p className="font-mono text-[9px] text-[#00E5FF] uppercase tracking-widest font-extrabold">System Routing</p>
            <label className="block text-[10px] font-mono text-[rgba(248,247,244,0.6)] mb-1">
              Ruta Activa del Recorrido:
            </label>
            <select
              value={neuralPath}
              onChange={(e) => handleNeuralPathChange(e.target.value)}
              className="w-full bg-[#111113] border border-[#00E5FF] px-2.5 py-2 text-xs font-mono font-bold text-[#00E5FF] uppercase focus:outline-none focus:ring-1 focus:ring-[#7FFF00] cursor-pointer"
            >
              <option value="balanced-equilibrium">⚖️ BALANCED_EQUILIBRIUM</option>
              <option value="steel-overload">🏗️ STEEL_OVERLOAD_AISC</option>
              <option value="brand-expression">🎨 BRAND_VISUAL_ENGINE</option>
              <option value="profit-maximization">💵 PROFIT_MAXIMIZATION</option>
            </select>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-[9px] text-[#00E5FF] uppercase tracking-widest font-extrabold">Phase Directory</p>
            <nav className="flex flex-col gap-1 font-mono text-[11px]">
              <a href="#hub-ingestion" className="block py-1.5 px-2 border-b border-[rgba(248,247,244,0.08)] text-[rgba(248,247,244,0.6)] hover:text-[#00E5FF] hover:border-[#00E5FF] transition">
                01_INGESTA
              </a>
              <a href="#hub-procesamiento" className="block py-1.5 px-2 border-b border-[rgba(248,247,244,0.08)] text-[rgba(248,247,244,0.6)] hover:text-[#00E5FF] hover:border-[#00E5FF] transition">
                02_ANALISIS
              </a>
              <a href="#hub-gravity" className="block py-1.5 px-2 border-b border-[rgba(248,247,244,0.08)] text-[rgba(248,247,244,0.6)] hover:text-[#00E5FF] hover:border-[#00E5FF] transition">
                03_COORDINATES
              </a>
              <a href="#hub-oraculo" className="block py-1.5 px-2 border-b border-[rgba(248,247,244,0.08)] text-[rgba(248,247,244,0.6)] hover:text-[#00E5FF] hover:border-[#00E5FF] transition">
                04_EL_ORACULO
              </a>
              <a href="#hub-archivo" className="block py-1.5 px-2 border-b border-[rgba(248,247,244,0.08)] text-[rgba(248,247,244,0.6)] hover:text-[#00E5FF] hover:border-[#00E5FF] transition">
                05_ARCHIVE_LIMBO
              </a>
            </nav>
          </div>

          {/* Sliders in Left Pane */}
          <div className="space-y-4 pt-4 border-t border-[rgba(248,247,244,0.08)]">
            <p className="font-mono text-[9px] text-[#00E5FF] uppercase tracking-widest font-extrabold">Gravitational Coefficients</p>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-[rgba(248,247,244,0.6)]">
                <span>Structural Mass</span>
                <span className="text-[#00E5FF] font-bold">{structuralPull.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="2.00"
                step="0.05"
                value={structuralPull}
                onChange={(e) => setStructuralPull(parseFloat(e.target.value))}
                className="w-full accent-[#00E5FF] h-1 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-[rgba(248,247,244,0.6)]">
                <span>Visual Fibration</span>
                <span className="text-[#00E5FF] font-bold">{visualPull.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="2.00"
                step="0.05"
                value={visualPull}
                onChange={(e) => setVisualPull(parseFloat(e.target.value))}
                className="w-full accent-[#00E5FF] h-1 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-[rgba(248,247,244,0.6)]">
                <span>Business Attractor</span>
                <span className="text-[#00E5FF] font-bold">{businessPull.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="2.00"
                step="0.05"
                value={businessPull}
                onChange={(e) => setBusinessPull(parseFloat(e.target.value))}
                className="w-full accent-[#00E5FF] h-1 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-[rgba(248,247,244,0.6)]">
                <span>Fibration Freq</span>
                <span className="text-[#00E5FF] font-bold">{fibrationFreq.toFixed(2)} Hz</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.30"
                step="0.01"
                value={fibrationFreq}
                onChange={(e) => setFibrationFreq(parseFloat(e.target.value))}
                className="w-full accent-[#00E5FF] h-1 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-[rgba(248,247,244,0.6)]">
                <span>Fibration Amp</span>
                <span className="text-[#00E5FF] font-bold">{fibrationAmp.toFixed(0)} px</span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                step="1"
                value={fibrationAmp}
                onChange={(e) => setFibrationAmp(parseInt(e.target.value))}
                className="w-full accent-[#00E5FF] h-1 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* CENTER PANE: MAIN FEED */}
        <div className="overflow-y-auto p-5 relative bg-[#111113] md:max-h-full">
          <div className="matrix-bg absolute inset-0 opacity-40 pointer-events-none" />
          
          <div className="relative z-10 space-y-8">
            {/* System Briefing Card */}
            <div className="bg-white/5 border-l-2 border-[#E5C158] p-4 relative rounded-sm">
              <span className="font-mono text-[8px] text-[#E5C158] uppercase tracking-widest block mb-1">
                System Briefing
              </span>
              <h2 className="text-lg font-bold font-display text-[#F8F7F4]">
                THE SOUL OF THE SYSTEM
              </h2>
              <p className="text-[11px] font-mono text-[rgba(248,247,244,0.7)] mt-1.5 leading-relaxed">
                Welcome to Santi Vilanova's unified operative terminal. By placing everything on a single, continuous, descending page, you can see and interact with each sequential phase of the Gravity engine. Documents flow from Ingestion down through 9-Layer Parsing, align dynamically in the Gravity Field, can be audited in the AI Oracle, and are archived in the Operational Index.
              </p>
            </div>

            {/* Hub 01: Ingestion */}
            <div id="hub-ingestion" className="scroll-mt-6 border border-[rgba(248,247,244,0.1)] bg-black/40 p-4 rounded-sm relative">
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-mono text-[9px] text-[#00E5FF] tracking-widest font-bold uppercase">Neural Ingest</span>
                <span className="font-mono text-xs text-[rgba(248,247,244,0.3)]">HUB 01</span>
              </div>
              <HubIngesta
                onIngestText={handleIngestText}
                isProcessing={isProcessing}
                accessToken={accessToken}
                user={user}
                needsAuth={needsAuth}
                setAccessToken={setAccessToken}
                setUser={setUser}
                setNeedsAuth={setNeedsAuth}
                neuralPath={neuralPath}
              />
            </div>

            {/* Hub 02: Tectonic Parsing */}
            <div id="hub-procesamiento" className="scroll-mt-6 border border-[rgba(248,247,244,0.1)] bg-black/40 p-4 rounded-sm relative">
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-mono text-[9px] text-[#00E5FF] tracking-widest font-bold uppercase">Chunking Engine</span>
                <span className="font-mono text-xs text-[rgba(248,247,244,0.3)]">HUB 02</span>
              </div>
              <HubProcesamiento
                steps={parsingSteps}
                isProcessing={isProcessing}
                chunkSize={chunkSize}
                setChunkSize={setChunkSize}
                overlap={overlap}
                setOverlap={setOverlap}
                totalTokensCalculated={totalTokensCalculated}
                neuralPath={neuralPath}
              />
            </div>

            {/* Hub 03: Gravitational Mapping */}
            <div id="hub-gravity" className="scroll-mt-6 border border-[rgba(248,247,244,0.1)] bg-black/40 p-4 rounded-sm relative">
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-mono text-[9px] text-[#00E5FF] tracking-widest font-bold uppercase">Orbital Dynamics</span>
                <span className="font-mono text-xs text-[rgba(248,247,244,0.3)]">HUB 03</span>
              </div>
              <HubGravedad
                structuralPull={structuralPull}
                setStructuralPull={setStructuralPull}
                visualPull={visualPull}
                setVisualPull={setVisualPull}
                businessPull={businessPull}
                setBusinessPull={setBusinessPull}
                fibrationFreq={fibrationFreq}
                setFibrationFreq={setFibrationFreq}
                fibrationAmp={fibrationAmp}
                setFibrationAmp={setFibrationAmp}
                neuralPath={neuralPath}
              />
            </div>

            {/* Hub 05: Master Operational Index */}
            <div id="hub-archivo" className="scroll-mt-6 border border-[rgba(248,247,244,0.1)] bg-black/40 p-4 rounded-sm relative">
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-mono text-[9px] text-[#00E5FF] tracking-widest font-bold uppercase">Master Archive Index</span>
                <span className="font-mono text-xs text-[rgba(248,247,244,0.3)]">HUB 05</span>
              </div>
              <HubArchivo
                gravityIndexRows={gravityIndexRows}
                onResolveLimbo={handleResolveLimbo}
                anomalies={anomalies}
                onSolveAnomaly={handleSolveAnomaly}
                isSyncingSheets={isSyncingSheets}
                onSyncSheets={handleSyncToSheets}
                neuralPath={neuralPath}
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANE: ORACLE AI & ANOMALIES */}
        <div className="border-l border-[rgba(248,247,244,0.15)] p-4 overflow-y-auto space-y-6 bg-[#111113] flex flex-col justify-between md:max-h-full">
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex justify-between items-baseline border-b border-[rgba(248,247,244,0.1)] pb-2">
              <span className="font-mono text-[9px] text-[#00E5FF] tracking-widest font-bold uppercase">Terminal: Oracle AI</span>
              <span className="font-mono text-xs text-[rgba(248,247,244,0.3)]">HUB 04</span>
            </div>
            
            <div className="flex-1 flex flex-col bg-black/20 border border-[rgba(248,247,244,0.1)] rounded-sm overflow-hidden">
              <HubOraculo onAddLog={handleAddLog} neuralPath={neuralPath} />
            </div>
          </div>

          <div className="pt-4 border-t border-[rgba(248,247,244,0.1)]">
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-mono text-[9px] text-[#FF3E3E] tracking-widest font-bold uppercase">Anomaly Monitor</span>
              <span className="font-mono text-[10px] text-gray-500">{anomalies.filter(a => !a.solved).length} UNRESOLVED</span>
            </div>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {anomalies.length === 0 ? (
                <p className="text-[10px] font-mono text-gray-500 italic">No structural infractions or clearspace violations detected.</p>
              ) : (
                anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    className={`p-2 border font-mono text-[9px] rounded-sm transition flex flex-col justify-between gap-1 ${
                      anom.solved 
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400' 
                        : 'bg-red-950/30 border-[#FF3E3E]/40 text-[#FF3E3E]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold truncate">{anom.tipo}</span>
                      <span className="font-bold">{anom.nivelGravitacional}G</span>
                    </div>
                    <p className="text-[8px] opacity-80 leading-tight">{anom.descripcion}</p>
                    {!anom.solved && (
                      <button
                        onClick={() => handleSolveAnomaly(anom.id)}
                        className="mt-1 bg-[#FF3E3E] text-black text-[8px] font-bold px-1.5 py-0.5 hover:bg-[#FF3E3E]/85 transition text-center uppercase cursor-pointer block"
                      >
                        [ SOLVE INFRACTION ]
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
