import React, { useState, useEffect, useRef } from 'react';
import { SentinelLog, MatrixRow } from '../types';
import { 
  Play, Activity, Database, Flame, FileText, CheckCircle2, RefreshCw,
  Sliders, Award, ShieldAlert, Layers, Compass, Eye, MapPin, Share2,
  SlidersHorizontal, Check, ExternalLink, Sparkles, Network, HelpCircle,
  FileCode, Cpu, Layout, Image as ImageIcon, BookOpen, Presentation, 
  Linkedin, Palette, FileSpreadsheet, Briefcase, ChevronRight, Globe,
  Radio, Volume2, VolumeX
} from 'lucide-react';

interface DashboardProps {
  logs: SentinelLog[];
  matrix: MatrixRow[];
  onTriggerParseDemo: () => void;
  isLoadingLogs: boolean;
  onRefreshAll: () => void;
  isSonicActive: boolean;
  toggleSonicFibration: () => void;
}

type SetType = 'structural' | 'perceptual' | 'commercial' | 'editorial' | 'executive';

export default function Dashboard({ 
  logs, 
  matrix, 
  onTriggerParseDemo, 
  isLoadingLogs, 
  onRefreshAll,
  isSonicActive,
  toggleSonicFibration
}: DashboardProps) {
  // Navigation & Interactive States
  const [selectedSet, setSelectedSet] = useState<SetType>('executive');
  const [activeDnaParam, setActiveDnaParam] = useState<number | null>(null);
  const [activeMatrixRow, setActiveMatrixRow] = useState<number | null>(0);
  const [commercialAlignment, setCommercialAlignment] = useState<number>(94);
  const [hoveredOrbitNode, setHoveredOrbitNode] = useState<string | null>(null);
  const [activeAsset, setActiveAsset] = useState<string | null>(null);
  const [heatmapCoords, setHeatmapCoords] = useState({ x: 50, y: 55 });
  const [isHoveringHeatmap, setIsHoveringHeatmap] = useState(false);
  const [sentinelPulse, setSentinelPulse] = useState(false);

  // Sonic Fibration visualizer canvas
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render tiny sonic visualizer wave inside the dashboard
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let waveTime = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      waveTime += 0.05;

      ctx.strokeStyle = isSonicActive ? '#7FFF00' : 'rgba(17,17,17,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let i = 0; i < canvas.width; i++) {
        // Compound sine waves representing harmonic vibrations
        const y = isSonicActive 
          ? (canvas.height / 2) + 
            Math.sin(i * 0.12 - waveTime) * 6 + 
            Math.sin(i * 0.03 + waveTime * 0.5) * 4
          : (canvas.height / 2) + Math.sin(i * 0.1) * 0.5; // flatline
        
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animId);
  }, [isSonicActive]);

  // Stats Animation Counter
  const [animatedTokens, setAnimatedTokens] = useState(0);
  const sumTokens = logs.reduce((acc, curr) => acc + curr.tokens, 0) || 124500;

  useEffect(() => {
    let start = 0;
    const end = sumTokens;
    const duration = 1500;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setAnimatedTokens(Math.floor(start + (end - start) * ease));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [sumTokens]);

  const handleHeatmapMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHeatmapCoords({ x, y });
  };

  const handleTriggerSentinel = () => {
    setSentinelPulse(true);
    onTriggerParseDemo();
    setTimeout(() => setSentinelPulse(false), 2000);
  };

  // Dynamically calculate indices based on the commercial alignment slider
  const getIndex = (base: number, weight: number) => {
    const factor = (commercialAlignment - 50) / 44; // normalize around 94%
    return Math.min(100, Math.max(10, Math.round(base + (factor * weight))));
  };

  const indexSAI = getIndex(92, 4);
  const indexCCV = getIndex(88, 6);
  const indexAES = getIndex(87, 5);
  const indexCPI = getIndex(91, 7);
  const indexSMS = getIndex(89, 4);

  // Definition lists matching image
  const dnaParameters = [
    { label: "GEOMETRÍA DOMINANTE", value: "Voladizo Extremo", desc: "Cantilever projecting outward without structural columns to challenge gravitational constraints." },
    { label: "EJE ESTRUCTURAL", value: "Eje Longitudinal", desc: "Primary horizontal coordinate running lengthwise acting as structural baseline." },
    { label: "JERARQUÍA", value: "Vertical + Volumen Suspendido", desc: "Juxtaposition of monolithic concrete core and floating glass/steel compartments." },
    { label: "RITMO", value: "Sistema Modular Progresivo", desc: "Algorithmic layout where structural bays expand proportionally along the elevation path." },
    { label: "COMPRESIÓN", value: "Alta en Base / Liberación en Vuelo", desc: "Maximum structural load condensed in ground footprint to allow airy spans above." },
    { label: "TENSIÓN", value: "Máxima en Extremo Libre", desc: "Tension vectors concentrated at the edge of the cantilever to prevent structural sway." },
    { label: "SINGULARIDAD", value: "Voladizo de 18.7m", desc: "Defying traditional limitations through an aggressive 18.7-meter unsupported overhang." },
    { label: "ATRACTORES VISUALES", value: "Esquina en Suspensión", desc: "Aesthetic focal points designed around floating corners to stimulate eye saccades." },
    { label: "ANOMALÍAS ESTRUCTURALES", value: "Improbabilidad Resuelta", desc: "Algorithmic compensation parameters loaded through Sentinel's physical engine." }
  ];

  const translationMatrix = [
    { est: "Voladizo Extremo", per: "Improbabilidad", emo: "Asombro", com: "Memorabilidad" },
    { est: "Verticalidad Monolítica", per: "Dominio", emo: "Respeto", com: "Autoridad" },
    { est: "Precisión Constructiva", per: "Inteligencia", emo: "Confianza", com: "Credibilidad" },
    { est: "Transparencia Controlada", per: "Ligereza", emo: "Deseo", com: "Exclusividad" },
    { est: "Escala Soberbia", per: "Grandeza", emo: "Admiración", com: "Prestigio" }
  ];

  // Colors based on selected representation strategy
  const getThemePalette = () => {
    switch(selectedSet) {
      case 'structural':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-600',
          text: 'text-blue-600',
          accent: 'bg-blue-600',
          accentBorder: 'border-blue-600',
          textAccent: 'text-blue-100',
          glow: 'shadow-[2px_2px_0px_rgba(59,130,246,1)]',
          label: 'STV STRUCTURAL COMPONENT SET'
        };
      case 'perceptual':
        return {
          bg: 'bg-cyan-50',
          border: 'border-cyan-600',
          text: 'text-cyan-600',
          accent: 'bg-cyan-600',
          accentBorder: 'border-cyan-600',
          textAccent: 'text-cyan-100',
          glow: 'shadow-[2px_2px_0px_rgba(6,182,212,1)]',
          label: 'STV PERCEPTUAL ATMOSPHERIC SET'
        };
      case 'commercial':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-600',
          text: 'text-emerald-600',
          accent: 'bg-emerald-600',
          accentBorder: 'border-emerald-600',
          textAccent: 'text-emerald-100',
          glow: 'shadow-[2px_2px_0px_rgba(16,185,129,1)]',
          label: 'STV COMMERCIAL VALUE SET'
        };
      case 'editorial':
        return {
          bg: 'bg-gray-100',
          border: 'border-[#111111]',
          text: 'text-[#111111]',
          accent: 'bg-[#111111]',
          accentBorder: 'border-[#111111]',
          textAccent: 'text-white',
          glow: 'shadow-[2px_2px_0px_rgba(17,17,17,1)]',
          label: 'STV SWISS EDITORIAL GRID SET'
        };
      case 'executive':
      default:
        return {
          bg: 'bg-[#7FFF00]/10',
          border: 'border-[#111111]',
          text: 'text-[#111111]',
          accent: 'bg-[#7FFF00]',
          accentBorder: 'border-[#111111]',
          textAccent: 'text-black',
          glow: 'shadow-[2px_2px_0px_#111111]',
          label: 'STV EXECUTIVE MASTER RECORD SET'
        };
    }
  };

  const palette = getThemePalette();

  return (
    <div className="space-y-6 text-[#111111] select-none animate-fadeIn" id="stv-master-dossier-dashboard">
      
      {/* BRAND HEADER & METADATA SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-6 rounded-none border-2 border-[#111111] bg-[#FFFFFF] gap-4 relative overflow-hidden shadow-[4px_4px_0px_#111111]">
        <div className="absolute right-0 top-0 w-80 h-32 bg-[#7FFF00]/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-[0.25em] bg-[#111111] text-[#7FFF00] px-2 py-0.5 uppercase">STV DESIGN STUDIO</span>
            <span className="text-gray-400 text-xs">/</span>
            <span className="text-[10px] font-mono text-[#555555] tracking-wider">COGNITIVE PUBLISHING ENGINE™</span>
          </div>
          <h1 className="font-display text-2xl xl:text-3xl font-black tracking-tight text-[#111111] uppercase flex items-center gap-3">
            MASTER DOSSIER <span className="text-xs font-mono font-bold text-[#555555] bg-[#F5F5F7] px-2.5 py-1 border border-[#111111]/20">EXPEDIENTE MAESTRO DE INTELIGENCIA ESTRUCTURAL</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-[#555555] pt-1">
            <span className="flex items-center gap-1 font-bold"><Cpu className="h-3 w-3 text-[#111111]" /> HASH ID: <strong className="text-[#111111]">STV-2024-11-17-A1F7</strong></span>
            <span className="text-gray-300 font-normal">|</span>
            <span>FECHA: <strong className="text-[#111111]">17 / NOV / 2024</strong></span>
            <span className="text-gray-300 font-normal">|</span>
            <span>VERSIÓN: <strong className="text-[#111111]">1.0</strong></span>
            <span className="text-gray-300 font-normal">|</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">● ESTADO: <strong className="uppercase">VALIDADO</strong></span>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] self-stretch xl:self-auto justify-between xl:justify-end">
          
          {/* Integrated Sonic Hum Hub */}
          <div className="flex items-center gap-2 bg-[#F5F5F7] px-3 py-1.5 border border-[#111111] min-h-[34px]">
            <span className="text-[9px] font-mono text-[#555555] uppercase tracking-wider flex items-center gap-1 font-bold">
              <Radio className={`h-3 w-3 ${isSonicActive ? 'text-[#111111] animate-pulse' : ''}`} /> Sonic Hum
            </span>
            
            <button
              onClick={toggleSonicFibration}
              className="p-1 bg-[#FFFFFF] border border-[#111111] text-[#111111] hover:bg-[#7FFF00] transition shrink-0 cursor-pointer"
              title={isSonicActive ? "Mute Sonic Hum" : "Activate Sonic Fibration"}
            >
              {isSonicActive ? <Volume2 className="h-3 w-3 text-[#111111]" /> : <VolumeX className="h-3 w-3" />}
            </button>

            {/* Miniature visualizer wave */}
            <div className="h-5 bg-[#FFFFFF] border border-[#111111]/30 overflow-hidden flex items-center p-0.5 w-20">
              <canvas ref={waveCanvasRef} width={80} height={16} className="w-full h-full block" />
            </div>

            <span className="text-[8px] font-mono text-[#555555] hidden sm:inline font-bold">0.05Hz FIBR</span>
          </div>

          <div className="flex items-center gap-2 bg-[#F5F5F7] px-3 py-1.5 border border-[#111111] min-h-[34px]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[#555555] font-bold">GRAVITY SYNC:</span>
            <span className="text-[#111111] font-black">ACTIVE</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTriggerSentinel}
              className={`px-3 py-1.5 bg-[#111111] text-[#7FFF00] hover:bg-[#7FFF00] hover:text-[#111111] font-bold uppercase rounded-none border border-[#111111] transition flex items-center gap-1.5 shadow-[2px_2px_0px_#111111] min-h-[34px] cursor-pointer ${sentinelPulse ? 'scale-95 animate-ping' : ''}`}
            >
              <Play className="h-3 w-3 fill-current" /> SCAN DRIVE
            </button>
            <button
              onClick={onRefreshAll}
              className="p-1.5 bg-[#FFFFFF] hover:bg-[#F5F5F7] text-[#111111] border border-[#111111] transition min-h-[34px] cursor-pointer"
              title="Refresh Sheets Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* CORE 3-COLUMN INTERACTIVE HUD GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* ================= COLUMN 1: HUB 01 STRUCTURAL DNA ================= */}
        <div className="xl:col-span-4 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 space-y-4 relative group hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111]">
          <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
            <div className="space-y-0.5">
              <span className="text-[#111111] text-[10px] font-mono tracking-widest block font-black">01 STRUCTURAL DNA™</span>
              <h2 className="text-xs font-bold text-[#555555] font-display uppercase">FIRMA ESTRUCTURAL EXTRAÍDA</h2>
            </div>
            <FileCode className="h-4 w-4 text-[#111111]" />
          </div>

          {/* Interactive Wireframe SVG & Parameters Overlay */}
          <div className="relative aspect-[4/3] bg-[#F5F5F7] rounded-none overflow-hidden border border-[#111111]/30 flex items-center justify-center p-3">
            {/* Architectural Building Wireframe Drawing */}
            <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full opacity-80 pointer-events-none text-[#111111]/20">
              {/* Ground Grid */}
              <path d="M 50 250 L 350 250 M 50 250 L 150 180 M 350 250 L 250 180 M 150 180 L 250 180" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
              {/* Building Columns Base */}
              <rect x="120" y="160" width="100" height="90" fill="none" stroke="currentColor" strokeWidth="1" />
              <line x1="120" y1="200" x2="220" y2="200" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="170" y1="160" x2="170" y2="250" stroke="currentColor" strokeWidth="1" />
              
              {/* Massive Cantilever (Voladizo Extremo) */}
              <polygon points="120,160 290,120 290,160 220,160" fill="none" stroke="#7FFF00" strokeWidth="2" className="animate-pulse" />
              <line x1="220" y1="160" x2="290" y2="120" stroke="#7FFF00" strokeWidth="1" />
              <line x1="120" y1="160" x2="290" y2="160" stroke="#7FFF00" strokeWidth="1" strokeDasharray="1 1" />
              
              {/* Floating glass partitions */}
              <rect x="230" y="125" width="50" height="30" fill="rgba(127,255,0,0.08)" stroke="#7FFF00" strokeWidth="1" />
              
              {/* Vector Tension Lines (Active when hovering param) */}
              {activeDnaParam !== null && (
                <>
                  {/* Tension vectors */}
                  <line x1="290" y1="120" x2="350" y2="80" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 2" />
                  <circle cx="290" cy="120" r="4" fill="#EF4444" className="animate-ping" />
                  <text x="300" y="100" fill="#EF4444" fontSize="8" fontFamily="monospace" fontWeight="bold">MAX_TENSIÓN: EXTREMO_LIBRE</text>
                  
                  {/* Anchor Point vector */}
                  <line x1="120" y1="160" x2="80" y2="120" stroke="#3B82F6" strokeWidth="1.5" />
                  <circle cx="120" cy="160" r="4" fill="#3B82F6" />
                  <text x="50" y="140" fill="#3B82F6" fontSize="8" fontFamily="monospace" fontWeight="bold">COMPRESIÓN_BASE</text>
                </>
              )}
            </svg>

            {/* Glowing Focal Node */}
            <div className="absolute top-[43%] right-[27%] w-3 h-3 bg-[#7FFF00] rounded-full shadow-[0_0_10px_#7FFF00] animate-ping pointer-events-none"></div>
            <div className="absolute top-[43%] right-[27%] w-1.5 h-1.5 bg-[#111111] rounded-full pointer-events-none"></div>

            {/* Param hover information overlay */}
            <div className="absolute bottom-2 left-2 right-2 bg-[#FFFFFF]/95 border border-[#111111] p-2 rounded-none text-[10px] font-mono space-y-1 backdrop-blur shadow-[2px_2px_0px_#111111]">
              <div className="flex justify-between text-[#111111] font-bold">
                <span>COORD: STV-X92-Y05</span>
                <span className="text-emerald-600">SYSTEM: ACTIVE</span>
              </div>
              <p className="text-[#555555] text-[9px] leading-relaxed">
                {activeDnaParam !== null 
                  ? dnaParameters[activeDnaParam].desc 
                  : "Pasa el cursor sobre los parámetros de abajo para activar análisis vectoriales."}
              </p>
            </div>
          </div>

          {/* Parameters Interactive List */}
          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
            {dnaParameters.map((param, index) => (
              <div 
                key={index}
                onMouseEnter={() => setActiveDnaParam(index)}
                onMouseLeave={() => setActiveDnaParam(null)}
                className={`p-2 rounded-none font-mono text-[10px] flex items-center justify-between border transition-all cursor-pointer ${
                  activeDnaParam === index 
                    ? 'bg-[#7FFF00]/15 border-[#111111] text-[#111111] font-bold' 
                    : 'bg-[#F5F5F7] border-[#111111]/10 text-[#555555] hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[#111111] font-bold bg-[#7FFF00] px-1 text-[8px]">{(index+1).toString().padStart(2, '0')}</span>
                  <span className="font-bold text-[#333333]">{param.label}</span>
                </div>
                <span className="text-[10px] font-black text-[#111111] uppercase">{param.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= COLUMN 2: HUB 03 TRANSLATION MATRIX ================= */}
        <div className="xl:col-span-4 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
              <div className="space-y-0.5">
                <span className="text-[#111111] text-[10px] font-mono tracking-widest block font-black">03 STV TRANSLATION MATRIX™</span>
                <h2 className="text-xs font-bold text-[#555555] font-display uppercase">TRADUCCIÓN COGNITIVA DE VALOR</h2>
              </div>
              <Sliders className="h-4 w-4 text-[#111111]" />
            </div>

            {/* Explanatory introduction */}
            <p className="text-[10px] text-[#555555] leading-relaxed font-mono">
              Alineación de geometría estructural a la emoción percibida del usuario, traduciendo cargas estáticas en recordación de marca.
            </p>

            {/* Translation Matrix Dynamic Table */}
            <div className="border border-[#111111]/30 rounded-none overflow-hidden bg-[#F5F5F7] font-mono text-[9px]">
              <div className="grid grid-cols-4 bg-[#111111] p-2 border-b border-[#111111] text-[#7FFF00] font-bold uppercase tracking-wider text-center text-[8px]">
                <div>ESTRUCTURA</div>
                <div>PERCEPCIÓN</div>
                <div>EMOCIÓN</div>
                <div>VALOR</div>
              </div>
              <div className="divide-y divide-[#111111]/15">
                {translationMatrix.map((row, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveMatrixRow(idx)}
                    className={`grid grid-cols-4 p-2.5 text-center cursor-pointer transition ${
                      activeMatrixRow === idx 
                        ? 'bg-[#7FFF00]/15 text-[#111111] font-bold border-l-2 border-[#111111]' 
                        : 'text-[#555555] hover:bg-[#111111]/5 hover:text-[#111111]'
                    }`}
                  >
                    <div className={activeMatrixRow === idx ? 'text-[#111111] font-bold' : 'text-[#555555]'}>{row.est}</div>
                    <div className="text-cyan-700 flex items-center justify-center gap-0.5 font-semibold">
                      <span className="text-[7px] text-gray-400">➔</span> {row.per}
                    </div>
                    <div className="text-amber-700 flex items-center justify-center gap-0.5 font-semibold">
                      <span className="text-[7px] text-gray-400">➔</span> {row.emo}
                    </div>
                    <div className="text-emerald-700 flex items-center justify-center gap-0.5 font-bold">
                      <span className="text-[7px] text-gray-400">➔</span> {row.com}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Translation Engine Log Output */}
          <div className="p-3 rounded-none bg-[#F5F5F7] border border-[#111111] font-mono text-[10px] space-y-2 mt-4">
            <div className="flex items-center justify-between text-[9px] text-[#555555] border-b border-[#111111]/15 pb-1">
              <span>ACTIVE COGNITIVE PATHWAY</span>
              <span className="text-[#111111] font-bold animate-pulse">● PROCESSING NODE</span>
            </div>
            {activeMatrixRow !== null ? (
              <div className="space-y-1">
                <p className="text-[#111111]">
                  Al construir una estructura de <strong className="text-black font-black">"{translationMatrix[activeMatrixRow].est}"</strong>, se evoca la percepción de <strong className="text-cyan-700 font-bold">"{translationMatrix[activeMatrixRow].per}"</strong>.
                </p>
                <p className="text-[#555555] text-[9px] leading-relaxed">
                  Este estímulo genera la emoción de <strong className="text-amber-700 font-bold">"{translationMatrix[activeMatrixRow].emo}"</strong> en el observador, consolidando autoridad de <strong className="text-black font-black bg-[#7FFF00] px-1">"{translationMatrix[activeMatrixRow].com}"</strong>.
                </p>
              </div>
            ) : (
              <p className="text-[#777777] text-center py-2">Selecciona una fila para enfocar el análisis cognitivo.</p>
            )}
          </div>
        </div>

        {/* ================= COLUMN 3: HUB 05 ATTENTION AUTOPSY ================= */}
        <div className="xl:col-span-4 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
            <div className="space-y-0.5">
              <span className="text-[#111111] text-[10px] font-mono tracking-widest block font-black">05 ATTENTION AUTOPSY™</span>
              <h2 className="text-xs font-bold text-[#555555] font-display uppercase">ANÁLISIS DE COMPORTAMIENTO VISUAL</h2>
            </div>
            <Eye className="h-4 w-4 text-[#111111]" />
          </div>

          {/* Heatmap Overlay Area */}
          <div 
            className="relative aspect-[4/3] bg-[#F5F5F7] rounded-none overflow-hidden border border-[#111111]/30 cursor-crosshair"
            onMouseMove={handleHeatmapMove}
            onMouseEnter={() => setIsHoveringHeatmap(true)}
            onMouseLeave={() => setIsHoveringHeatmap(false)}
          >
            {/* Architectural structural lines */}
            <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full opacity-50 pointer-events-none text-[#111111]/20">
              <rect x="80" y="80" width="240" height="150" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <line x1="80" y1="150" x2="320" y2="150" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
              {/* Eye path route line vectors */}
              <path d="M 120 220 L 250 140 L 300 110 L 150 110" fill="none" stroke="#7FFF00" strokeWidth="2" strokeDasharray="5 3" />
            </svg>

            {/* Glowing Static Saccadic Hotspots representing image */}
            {/* Hotspot 1: High focus */}
            <div className="absolute top-[35%] left-[60%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-red-500/10 blur-xl animate-pulse"></div>
              <div className="w-10 h-10 rounded-full bg-yellow-400/25 blur-lg -mt-13 ml-3"></div>
              <div className="w-4 h-4 rounded-full bg-red-600/60 blur-xs -mt-7 ml-6"></div>
              <span className="absolute top-1 left-7 bg-[#111111] border border-[#7FFF00] text-[#7FFF00] text-[8px] font-mono px-1 rounded-none">1</span>
            </div>

            {/* Hotspot 2 */}
            <div className="absolute top-[48%] left-[30%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 blur-lg"></div>
              <div className="w-6 h-6 rounded-full bg-green-400/20 blur-md -mt-9 ml-3"></div>
              <span className="absolute top-0 left-5 bg-[#111111] border border-[#00FFFF] text-[#00FFFF] text-[8px] font-mono px-1 rounded-none">2</span>
            </div>

            {/* Hotspot 3 */}
            <div className="absolute top-[25%] left-[75%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-red-500/10 blur-xl"></div>
              <div className="w-8 h-8 rounded-full bg-yellow-400/20 blur-md -mt-11 ml-3"></div>
              <span className="absolute top-0 left-5 bg-[#111111] border border-gray-600 text-gray-400 text-[8px] font-mono px-1 rounded-none">3</span>
            </div>

            {/* Dynamic mouse interactive heatmap pointer */}
            {isHoveringHeatmap && (
              <div 
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen"
                style={{ left: `${heatmapCoords.x}%`, top: `${heatmapCoords.y}%` }}
              >
                <div className="w-16 h-16 rounded-full bg-red-500/30 blur-md animate-ping"></div>
                <div className="w-10 h-10 rounded-full bg-yellow-400/50 blur-sm -mt-13 ml-3"></div>
                <div className="w-3 h-3 rounded-full bg-white -mt-6.5 ml-6.5"></div>
              </div>
            )}

            <div className="absolute top-2 left-2 bg-[#111111] px-2 py-1 rounded-none text-[8px] font-mono text-white uppercase tracking-wider border border-[#111111]">
              MAPA DE CALOR: VIVO
            </div>
            
            <div className="absolute bottom-2 right-2 bg-[#111111] px-2 py-1 rounded-none text-[8px] font-mono text-[#7FFF00] uppercase tracking-wider border border-[#7FFF00]">
              {isHoveringHeatmap ? `X: ${Math.round(heatmapCoords.x)}% Y: ${Math.round(heatmapCoords.y)}%` : "TRACKING IDLE"}
            </div>
          </div>

          {/* Saccadic path indexes */}
          <div className="grid grid-cols-4 gap-2 font-mono text-[9px] bg-[#F5F5F7] p-2 rounded-none border border-[#111111]/30">
            <div className="space-y-0.5">
              <span className="text-[#555555] block">1ª FIJACIÓN</span>
              <span className="text-[#111111] font-bold">Esquina Suspendida</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#555555] block">2ª FIJACIÓN</span>
              <span className="text-[#111111] font-bold">Voladizo Libre</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#555555] block">3ª FIJACIÓN</span>
              <span className="text-[#111111] font-bold">Transparencia</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#555555] block">ANCLAJE FINAL</span>
              <span className="text-[#111111] font-bold">Escala / Contexto</span>
            </div>
          </div>

          {/* Attention Efficiency Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 rounded-none bg-[#F5F5F7] border border-[#111111]/30 space-y-1">
              <span className="text-[8px] font-mono text-[#555555] uppercase tracking-widest block">BASELINE ORIGINAL</span>
              <span className="text-lg font-display font-bold text-[#555555]">42%</span>
            </div>
            <div className="p-2.5 rounded-none bg-[#7FFF00]/15 border border-[#111111] space-y-1 relative overflow-hidden shadow-[2px_2px_0px_#111111]">
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#7FFF00]/10 rounded-full blur"></div>
              <span className="text-[8px] font-mono text-[#111111] uppercase tracking-widest block font-black">STV OPTIMIZADO</span>
              <span className="text-xl font-display font-black text-[#111111]">87%</span>
            </div>
            <div className="p-2.5 rounded-none bg-emerald-50 border border-emerald-600 space-y-1">
              <span className="text-[8px] font-mono text-emerald-700 uppercase tracking-widest block font-bold">MEJORA</span>
              <span className="text-lg font-display font-bold text-emerald-700">+107%</span>
            </div>
          </div>
        </div>

      </div>

      {/* SECOND HUD ROW: SET SELECTOR + COMMISSION SLIDER + ORBITAL COGNITIVE LINK + ASSETS SELECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* ================= HUB 07: STV SET ENGINE ================= */}
        <div className="xl:col-span-3 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111]">
          <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
            <div className="space-y-0.5">
              <span className="text-[#111111] text-[10px] font-mono tracking-widest block font-black">07 STV SET ENGINE™</span>
              <h2 className="text-xs font-bold text-[#555555] font-display uppercase">ESTRATEGIA DE REPRESENTACIÓN</h2>
            </div>
            <Palette className="h-4 w-4 text-[#111111]" />
          </div>

          <p className="text-[10px] text-[#555555] font-mono leading-relaxed">
            Selecciona un motor de representación estética para aplicar de forma automática coordenadas de marca, armonía y alineaciones tipográficas.
          </p>

          {/* 5 representation sets selector */}
          <div className="space-y-1.5">
            {[
              { id: 'structural', name: '01 Structural Set', goal: '¿POR QUÉ FUNCIONA?', spec: 'INGENIERÍA / PRECISIÓN / CREDIBILIDAD' },
              { id: 'perceptual', name: '02 Perceptual Set', goal: '¿POR QUÉ CAPTURA?', spec: 'ATENCIÓN / ASOMBRO / DOMINANCIA' },
              { id: 'commercial', name: '03 Commercial Set', goal: '¿POR QUÉ VALE MÁS?', spec: 'VALOR / DESEO / DIFERENCIACIÓN' },
              { id: 'editorial', name: '04 Editorial Set', goal: '¿QUÉ HISTORIA CUENTA?', spec: 'NARRATIVA / CULTURA / PRESTIGIO' },
              { id: 'executive', name: '05 Executive Set', goal: '¿POR QUÉ APROBARLO?', spec: 'DECISIÓN / INVERSIÓN / ESTRATEGIA' }
            ].map((set) => (
              <button
                key={set.id}
                onClick={() => setSelectedSet(set.id as SetType)}
                className={`w-full text-left p-2 rounded-none border font-mono text-[9px] flex flex-col transition-all relative cursor-pointer ${
                  selectedSet === set.id 
                    ? 'bg-[#7FFF00]/15 border-2 border-[#111111] text-[#111111] font-bold shadow-sm shadow-[#111111]/30' 
                    : 'bg-[#F5F5F7] border border-[#111111]/10 text-[#555555] hover:text-[#111111] hover:border-[#111111]'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`font-black ${selectedSet === set.id ? 'text-[#111111]' : 'text-[#555555]'}`}>{set.name}</span>
                  <span className="text-[7px] text-[#777777] font-bold">{set.goal}</span>
                </div>
                <span className="text-[8px] text-[#555555] mt-1 uppercase tracking-wider truncate font-semibold">{set.spec}</span>
                {selectedSet === set.id && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#111111] font-bold">➔</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ================= HUB 06: COMMERCIAL VALIDATION ================= */}
        <div className="xl:col-span-3 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
              <div className="space-y-0.5">
                <span className="text-[#111111] text-[10px] font-mono tracking-widest block font-black">06 COMMERCIAL VALIDATION™</span>
                <h2 className="text-xs font-bold text-[#555555] font-display uppercase">VALIDACIÓN DE ALINEACIÓN</h2>
              </div>
              <SlidersHorizontal className="h-4 w-4 text-[#111111]" />
            </div>

            {/* Interactive Alignment Radial Progress and Slider */}
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* SVG Ring background and active */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="rgba(17,17,17,0.05)" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="48" 
                    stroke="#111111" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - commercialAlignment / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-display font-black text-[#111111] leading-none">{commercialAlignment}%</span>
                  <span className="text-[7px] font-mono text-[#555555] mt-1 uppercase tracking-widest font-bold">ALINEACIÓN</span>
                </div>
              </div>

              {/* Slider Controller */}
              <div className="w-full space-y-1 px-4">
                <div className="flex justify-between text-[9px] font-mono text-[#555555]">
                  <span>TOLERANCIA COGNITIVA</span>
                  <span className="font-bold text-[#111111]">{commercialAlignment >= 90 ? "ALTA ALINEACIÓN" : "MODERADA"}</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  value={commercialAlignment} 
                  onChange={(e) => setCommercialAlignment(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#F5F5F7] rounded-none appearance-none cursor-pointer accent-[#111111] border border-[#111111]/30"
                />
              </div>
            </div>
          </div>

          {/* Proprietary STV Indices with progress bars */}
          <div className="space-y-2 font-mono text-[9px] bg-[#F5F5F7] p-2.5 rounded-none border border-[#111111]/15">
            <div className="flex justify-between text-[8px] text-[#555555] uppercase tracking-widest font-black border-b border-[#111111]/10 pb-1">
              <span>ÍNDICES PROPIETARIOS STV</span>
              <span className="text-[#111111] font-bold">COEFICIENTES</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[#333333] font-bold text-[8px]">
                <span>SAI <strong className="text-gray-400 text-[7px] font-normal">(STRUCTURAL AUTHORITY INDEX)</strong></span>
                <span className="font-black text-[#111111]">{indexSAI}</span>
              </div>
              <div className="w-full bg-[#E5E5E7] h-1.5 rounded-none overflow-hidden">
                <div className="bg-[#111111] h-full transition-all duration-300" style={{ width: `${indexSAI}%` }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[#333333] font-bold text-[8px]">
                <span>CCV <strong className="text-gray-400 text-[7px] font-normal">(COGNITIVE CAPTURE VELOCITY)</strong></span>
                <span className="font-black text-[#111111]">{indexCCV}</span>
              </div>
              <div className="w-full bg-[#E5E5E7] h-1.5 rounded-none overflow-hidden">
                <div className="bg-[#111111] h-full transition-all duration-300" style={{ width: `${indexCCV}%` }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[#333333] font-bold text-[8px]">
                <span>AES <strong className="text-gray-400 text-[7px] font-normal">(ATTENTION EFFICIENCY SCORE)</strong></span>
                <span className="font-black text-[#111111]">{indexAES}</span>
              </div>
              <div className="w-full bg-[#E5E5E7] h-1.5 rounded-none overflow-hidden">
                <div className="bg-[#111111] h-full transition-all duration-300" style={{ width: `${indexAES}%` }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[#333333] font-bold text-[8px]">
                <span>CPI <strong className="text-gray-400 text-[7px] font-normal">(COMMERCIAL PERCEPTION INDEX)</strong></span>
                <span className="font-black text-[#111111]">{indexCPI}</span>
              </div>
              <div className="w-full bg-[#E5E5E7] h-1.5 rounded-none overflow-hidden">
                <div className="bg-[#111111] h-full transition-all duration-300" style={{ width: `${indexCPI}%` }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[#333333] font-bold text-[8px]">
                <span>SMS <strong className="text-gray-400 text-[7px] font-normal">(STRUCTURAL MEMORY SCORE)</strong></span>
                <span className="font-black text-[#111111]">{indexSMS}</span>
              </div>
              <div className="w-full bg-[#E5E5E7] h-1.5 rounded-none overflow-hidden">
                <div className="bg-[#111111] h-full transition-all duration-300" style={{ width: `${indexSMS}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= HUB 08: STV PUBLISHING ENGINE ================= */}
        <div className="xl:col-span-3 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
              <div className="space-y-0.5">
                <span className="text-[#111111] text-[10px] font-mono tracking-widest block font-black">08 PUBLISHING ENGINE™</span>
                <h2 className="text-xs font-bold text-[#555555] font-display uppercase">ECOSISTEMA DE PUBLICACIÓN</h2>
              </div>
              <Layout className="h-4 w-4 text-[#111111]" />
            </div>

            <p className="text-[10px] text-[#555555] font-mono leading-relaxed mb-3">
              Selecciona cualquier tarjeta para previsualizar planos, retículas suizas, combinaciones tipográficas y maquetas de marca.
            </p>

            {/* Generated Assets Grid list */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "01 EXECUTIVE POSTER", label: "Poster 11x17", icon: FileText },
                { name: "02 HERO BANNER", label: "Web Landing", icon: ImageIcon },
                { name: "03 WEB COVER", label: "Desktop/Tablet", icon: Globe },
                { name: "04 DOSSIER COVER", label: "Documentación", icon: BookOpen },
                { name: "05 EDITORIAL SIG", label: "Sistema Visual", icon: Palette },
                { name: "06 PRES BOARD", label: "Competencia", icon: Presentation },
                { name: "07 LINKEDIN HEADER", label: "Posicionamiento", icon: Linkedin },
                { name: "08 PROPOSAL COV", label: "Propuestas", icon: FileSpreadsheet },
                { name: "09 BUSINESS ASSETS", label: "Corporativo", icon: Briefcase }
              ].map((asset, index) => {
                const IconComponent = asset.icon;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveAsset(asset.name)}
                    className={`p-1.5 rounded-none border text-center flex flex-col items-center justify-center gap-1 hover:border-[#111111] cursor-pointer transition-all ${
                      activeAsset === asset.name ? 'border-2 border-[#111111] bg-[#7FFF00]/15' : 'border-[#111111]/15 bg-[#F5F5F7]'
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 ${activeAsset === asset.name ? 'text-[#111111]' : 'text-gray-400'}`} />
                    <span className="text-[7px] font-mono font-bold text-[#333333] tracking-wider truncate w-full">{asset.name}</span>
                    <span className="text-[6px] font-mono text-[#777777] truncate w-full">{asset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#F5F5F7] border border-[#111111]/30 p-2.5 rounded-none font-mono text-[9px] text-[#555555] leading-normal mt-3">
            {activeAsset ? (
              <p>
                <strong className="text-[#111111] text-[10px] block mb-1 font-black">➔ LOADED: {activeAsset}</strong>
                Coordenadas cargadas exitosamente. Retícula de alta fidelidad alineada con precisión.
              </p>
            ) : (
              <p className="text-center text-gray-400 py-1">Selecciona una tarjeta para cargar sus capas esquemáticas.</p>
            )}
          </div>
        </div>

        {/* ================= HUB 09: MASTER INTELLIGENCE RECORD ================= */}
        <div className="xl:col-span-3 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
              <div className="space-y-0.5">
                <span className="text-[#111111] text-[10px] font-mono tracking-widest block font-black">09 MASTER RECORD™</span>
                <h2 className="text-xs font-bold text-[#555555] font-display uppercase">EXPEDIENTE DE INTELIGENCIA</h2>
              </div>
              <Network className="h-4 w-4 text-[#111111]" />
            </div>

            {/* Interactive Orbital concentric spinner */}
            <div className="relative aspect-square max-w-[170px] mx-auto flex items-center justify-center my-2">
              {/* Spinning Concentric SVG Rings */}
              <svg className="absolute w-full h-full text-[#111111]/15 pointer-events-none" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" className="animate-[spin_40s_linear_infinite]" />
                <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="6 6" className="animate-[spin_25s_linear_infinite_reverse]" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-[spin_10s_linear_infinite]" />
                
                {/* Connecting lines to orbit nodes */}
                <line x1="50" y1="50" x2="15" y2="25" stroke="rgba(17,17,17,0.15)" strokeWidth="0.5" />
                <line x1="50" y1="50" x2="85" y2="35" stroke="rgba(17,17,17,0.15)" strokeWidth="0.5" />
                <line x1="50" y1="50" x2="50" y2="85" stroke="rgba(17,17,17,0.15)" strokeWidth="0.5" />
              </svg>

              {/* Center STV Nucleus */}
              <div className="absolute w-12 h-12 bg-[#111111] border-2 border-[#7FFF00] rounded-full flex flex-col items-center justify-center shadow-[0_0_15px_rgba(127,255,0,0.25)]">
                <span className="text-[10px] font-mono font-black text-white leading-none">STV</span>
                <span className="text-[5px] font-mono text-gray-400 leading-none mt-0.5 font-bold">NUCLEUS</span>
              </div>

              {/* Orbital Nodes - Hoverable */}
              {[
                { name: "DNA", style: "top-4 left-6", label: "Structural DNA Nodes", info: "Geometries, tension, compression limits." },
                { name: "MATRIX", style: "top-10 right-2", label: "Translation Matrix", info: "Aesthetic to commercial valuation maps." },
                { name: "AUTOPSY", style: "bottom-12 right-1", label: "Attention Autopsy", info: "Heatmaps, saccadic paths, visual efficiency." },
                { name: "ASSETS", style: "bottom-4 left-10", label: "Generated Assets", icon: "Aa", info: "Mockup layouts and print coordinates." }
              ].map((node) => (
                <button
                  key={node.name}
                  onMouseEnter={() => setHoveredOrbitNode(node.name)}
                  onMouseLeave={() => setHoveredOrbitNode(null)}
                  className={`absolute p-1 bg-[#FFFFFF] border rounded-none font-mono text-[8px] font-bold transition-all cursor-pointer ${
                    hoveredOrbitNode === node.name 
                      ? 'border-2 border-[#111111] bg-[#7FFF00] text-[#111111] shadow-[2px_2px_0px_#111111] scale-110' 
                      : 'border-[#111111]/20 text-gray-500 bg-[#F5F5F7]'
                  } ${node.style}`}
                >
                  {node.name}
                </button>
              ))}
            </div>
          </div>

          {/* Master Record Dynamic Logs */}
          <div className="bg-[#F5F5F7] p-2.5 rounded-none border border-[#111111]/15 font-mono text-[9px] text-[#555555]">
            {hoveredOrbitNode ? (
              <div className="space-y-1">
                <span className="text-[#111111] block font-black">➔ {hoveredOrbitNode}: ACTIVE FEED</span>
                <p className="text-[#555555] text-[8px] leading-relaxed">
                  Cruzando coordenadas de Drive con la hoja de cálculo del Master Index de Gravity para conformidad STV.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#555555] text-[8px] border-b border-[#111111]/10 pb-1 font-bold">
                  <span>PIPELINE EN TIEMPO REAL</span>
                  <span>ONLINE</span>
                </div>
                <div className="space-y-1 text-[#555555] text-[8px]">
                  <div className="flex justify-between"><span>• INGEST_FILES:</span> <span className="text-emerald-700 font-bold">OK ({logs.length})</span></div>
                  <div className="flex justify-between"><span>• BRAIN_DB_NODES:</span> <span className="text-emerald-700 font-bold">ACTIVE ({matrix.length})</span></div>
                  <div className="flex justify-between"><span>• HARMONIC_FIBR:</span> <span className="text-[#111111] font-bold">0.05 Hz</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* ================= FULL HIGH-FIDELITY ASSETS PRESENTATION ================= */}
      {/* ==================================================================== */}
      <div className="rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-5 space-y-6 shadow-[4px_4px_0px_#111111]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b-2 border-[#111111] pb-3 gap-2">
          <div className="space-y-1">
            <span className="text-[#111111] text-[10px] font-mono tracking-widest block font-black">GENERATED PUBLISHING ASSETS</span>
            <h2 className="text-sm font-black text-[#111111] font-display uppercase flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#111111]" /> VISTA DE MAQUETACIÓN DE ALTA FIDELIDAD ({palette.label})
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
            <span className="bg-[#F5F5F7] border border-[#111111]/30 px-2.5 py-1 text-[#555555] font-bold rounded-none">SISTEMA MÉTRICO SUIZO</span>
            <span className="bg-[#F5F5F7] border border-[#111111]/30 px-2.5 py-1 text-[#555555] font-bold rounded-none">ALINEACIÓN DE FIBRA 0.05Hz</span>
          </div>
        </div>

        {/* 3x3 GRID REPRESENTING COMPLETED HIGH-FIDELITY LAYOUTS FROM IMAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* 1. EXECUTIVE POSTER (11x17) */}
          <div className="lg:col-span-3 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1 bg-[#7FFF00]/15 text-[#111111] font-mono text-[6px] tracking-widest uppercase font-black border-l-2 border-b-2 border-[#111111]">POSTER 11x17</div>
            <div className="space-y-1 font-mono text-[8px] text-[#555555]">
              <span className="text-[#111111] font-black tracking-wider block text-[9px]">01 EXECUTIVE POSTER</span>
              <span>11x17 VERTICAL / PORTFOLIO SPEC</span>
            </div>

            {/* Poster design layout mockup */}
            <div className="border border-[#111111]/30 bg-[#F5F5F7] p-3.5 rounded-none space-y-3 relative group-hover:scale-[1.01] transition-transform">
              <div className="flex justify-between items-center text-[7px] font-mono text-[#555555] border-b border-[#111111]/15 pb-1">
                <span>REQUISITOS DEL SISTEMA STV</span>
                <span>VOL: 18.7M</span>
              </div>

              {/* Mini vector blueprint of modern building */}
              <div className="h-28 bg-[#FFFFFF] border border-[#111111]/30 rounded-none flex items-center justify-center p-1 relative overflow-hidden">
                <svg viewBox="0 0 100 80" className="w-full h-full text-[#111111]/20 opacity-80">
                  <rect x="15" y="10" width="70" height="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <path d="M 25 50 L 75 40 L 75 60 L 25 60 Z" fill="rgba(17,17,17,0.02)" stroke="#111111" strokeWidth="1" />
                  <circle cx="75" cy="40" r="2" fill="#7FFF00" />
                </svg>
                {/* Serif text superimposed */}
                <div className="absolute inset-0 flex flex-col justify-end p-2 bg-gradient-to-t from-[#FFFFFF]/90 via-transparent to-transparent">
                  <span className="font-serif italic text-[11px] leading-none text-[#111111] font-black">La imposible</span>
                  <span className="font-serif italic text-[11px] leading-none text-[#111111] font-black">hecha estructura.</span>
                </div>
              </div>

              <div className="flex justify-between text-[7px] font-mono text-[#555555]">
                <span>COORD: EXTREME_CANTILEVER</span>
                <span>STV COGNITIVE</span>
              </div>
            </div>

            <p className="text-[9px] text-[#555555] leading-normal font-mono">
              Render editorial de alto contraste que resalta las esquinas suspendidas. Cuenta con titulares elegantes combinados con barras de metadatos.
            </p>
          </div>

          {/* 2. HERO BANNER (WEB LANDING) */}
          <div className="lg:col-span-5 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1 bg-[#7FFF00]/15 text-[#111111] font-mono text-[6px] tracking-widest uppercase font-black border-l-2 border-b-2 border-[#111111]">HERO BANNER</div>
            <div className="space-y-1 font-mono text-[8px] text-[#555555]">
              <span className="text-[#111111] font-black tracking-wider block text-[9px]">02 HERO BANNER</span>
              <span>WEB / LANDING INTEGRIDAD DE MARCA</span>
            </div>

            {/* Banner mockup */}
            <div className="border border-[#111111]/30 bg-[#F5F5F7] rounded-none overflow-hidden relative group-hover:scale-[1.01] transition-transform flex flex-col">
              {/* Header wireframe */}
              <div className="bg-[#FFFFFF] px-3 py-1.5 border-b border-[#111111]/15 flex justify-between items-center">
                <span className="font-mono text-[7px] text-[#111111] font-black">STV DESIGN</span>
                <div className="flex gap-2 text-[6px] text-gray-400 font-mono">
                  <span>STUDIO</span>
                  <span>FILOSOFÍA</span>
                  <span>MOTOR</span>
                </div>
              </div>
              
              {/* Massive rendering layout placeholder */}
              <div className="h-28 bg-[#FFFFFF] p-3 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFFFFF]/95 to-transparent z-10 pointer-events-none"></div>
                {/* Schematic lines in background */}
                <svg viewBox="0 0 200 80" className="absolute right-2 top-2 w-1/2 h-full text-[#111111]/10 opacity-30 pointer-events-none">
                  <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="100" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </svg>

                <div className="z-20 space-y-1 max-w-[65%]">
                  <h3 className="font-display font-black text-[10px] text-[#111111] leading-tight uppercase tracking-wider">
                    EL ESTÁNDAR DE MEMORABILIDAD INDUSTRIAL.
                  </h3>
                  <p className="text-[6px] text-[#555555] font-mono leading-normal">
                    Descubre cómo los algoritmos de gravedad física reconfiguran la percepción corporativa de la marca.
                  </p>
                  <div className="pt-1">
                    <span className="px-1.5 py-0.5 bg-[#111111] text-[#7FFF00] font-mono font-black text-[5px] rounded-none">VER PROYECTO</span>
                  </div>
                </div>

                <div className="z-20 flex justify-between items-center text-[5px] font-mono text-gray-400">
                  <span>STV DESIGN STUDIO © 2026</span>
                  <span>STV PUBLISHING ENGINE™</span>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-[#555555] leading-normal font-mono">
              Contenedor digital panorámico que resalta volúmenes geométricos puros, tipografías sólidas y micro-narrativas secundarias.
            </p>
          </div>

          {/* 3. WEB COVER */}
          <div className="lg:col-span-4 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1 bg-[#7FFF00]/15 text-[#111111] font-mono text-[6px] tracking-widest uppercase font-black border-l-2 border-b-2 border-[#111111]">WEB COVER</div>
            <div className="space-y-1 font-mono text-[8px] text-[#555555]">
              <span className="text-[#111111] font-black tracking-wider block text-[9px]">03 WEB COVER</span>
              <span>GRID WEB RESPONSIVA PARA DISPOSITIVOS</span>
            </div>

            {/* Web Cover layout */}
            <div className="border border-[#111111]/30 bg-[#F5F5F7] rounded-none p-3 relative group-hover:scale-[1.01] transition-transform space-y-3">
              <div className="h-28 bg-[#FFFFFF] border border-[#111111]/15 rounded-none flex flex-col justify-between p-2.5">
                <div className="flex justify-between font-mono text-[6px] text-gray-400">
                  <span>STV DESIGN</span>
                  <span>RETÍCULA RESPONSIVA</span>
                </div>
                
                <div className="space-y-1 text-center">
                  <h4 className="text-[9px] font-serif italic text-[#111111] font-black">El estándar de memorabilidad industrial.</h4>
                  <div className="w-16 h-0.5 bg-[#111111] mx-auto"></div>
                </div>

                <div className="flex justify-between items-center font-mono text-[6px] text-[#555555]">
                  <span className="px-1 py-0.5 bg-[#111111] text-[#7FFF00] rounded-none font-bold">WEB VIEW</span>
                  <span>STV PUBLISHING ENGINE™</span>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-[#555555] leading-normal font-mono">
              Estructura flexible que adapta márgenes, densidades de fuente y diseños de columna para un escalado elegante.
            </p>
          </div>

        </div>

        {/* BOTTOM HALF ROW DEPICTING SPECIFIC PHRASES FROM IMAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-2">
          
          {/* 4. DOSSIER COVER */}
          <div className="lg:col-span-3 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1 bg-[#7FFF00]/15 text-[#111111] font-mono text-[6px] tracking-widest uppercase font-black border-l-2 border-b-2 border-[#111111]">DOSSIER COVER</div>
            <div className="space-y-1 font-mono text-[8px] text-[#555555]">
              <span className="text-[#111111] font-black tracking-wider block text-[9px]">04 DOSSIER COVER</span>
              <span>DOCUMENTACIÓN EJECUTIVA</span>
            </div>

            <div className="border border-[#111111]/30 bg-[#F5F5F7] rounded-none p-4 relative group-hover:scale-[1.01] transition-transform flex flex-col justify-between h-40">
              <span className="text-[6px] font-mono text-gray-400 font-bold">PORTFOLIO DE SISTEMA STV</span>
              
              <div className="space-y-1 text-center">
                <h4 className="text-[9px] font-mono font-black tracking-widest text-[#111111] uppercase">EXPEDIENTE MAESTRO</h4>
                <p className="text-[7px] font-mono text-[#555555] uppercase tracking-wider font-bold">DE INTELIGENCIA ESTRUCTURAL</p>
              </div>

              <div className="flex justify-between items-center text-[6px] font-mono text-gray-400 border-t border-[#111111]/15 pt-1.5 font-bold">
                <span>STV COGNITIVE ENGINE</span>
                <span className="font-black text-[#111111]">STV</span>
              </div>
            </div>

            <p className="text-[9px] text-[#555555] leading-normal font-mono">
              Diseño de dossier corporativo con tipografía central, amplios márgenes negativos y bordes estructurados limpios.
            </p>
          </div>

          {/* 5. EDITORIAL SIGNATURE */}
          <div className="lg:col-span-3 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1 bg-[#7FFF00]/15 text-[#111111] font-mono text-[6px] tracking-widest uppercase font-black border-l-2 border-b-2 border-[#111111]">EDITORIAL SIG</div>
            <div className="space-y-1 font-mono text-[8px] text-[#555555]">
              <span className="text-[#111111] font-black tracking-wider block text-[9px]">05 EDITORIAL SIGNATURE</span>
              <span>SISTEMA VISUAL / TIPOGRAFÍA</span>
            </div>

            <div className="border border-[#111111]/30 bg-[#F5F5F7] rounded-none p-3 relative group-hover:scale-[1.01] transition-transform space-y-4 h-40 flex flex-col justify-between">
              <div className="flex justify-between items-center font-mono text-[6px] text-gray-400 font-bold">
                <span>SISTEMA DE FUENTES</span>
                <span>ALINEACIÓN SUIZA</span>
              </div>

              {/* Large "Aa" Display font pairing */}
              <div className="flex items-end justify-between">
                <div className="space-y-0.5">
                  <span className="text-4xl font-display font-black text-[#111111] block leading-none">Aa</span>
                  <span className="text-[8px] font-mono text-[#111111] tracking-widest font-black">STV DISPLAY</span>
                </div>
                <div className="space-y-0.5 text-right font-mono text-[7px] text-[#555555]">
                  <span className="block text-[#111111] font-black">STV TEXT</span>
                  <span>Syne / Inter</span>
                  <span>Space Grotesk</span>
                </div>
              </div>

              {/* Color swatches */}
              <div className="grid grid-cols-5 gap-1 pt-1.5 border-t border-[#111111]/15">
                <div className="h-2 bg-[#FFFFFF] border border-[#111111]/30 rounded-none" title="#FFFFFF"></div>
                <div className="h-2 bg-[#F5F5F7] border border-[#111111]/10 rounded-none" title="#F5F5F7"></div>
                <div className="h-2 bg-[#7FFF00] border border-[#111111]/10 rounded-none" title="#7FFF00"></div>
                <div className="h-2 bg-[#00FFFF] border border-[#111111]/10 rounded-none" title="#00FFFF"></div>
                <div className="h-2 bg-[#111111] border border-[#111111]/10 rounded-none" title="#111111"></div>
              </div>
            </div>

            <p className="text-[9px] text-[#555555] leading-normal font-mono">
              Muestra las reglas de jerarquía tipográfica, proporciones de interlineado y paletas cromáticas corporativas certificadas.
            </p>
          </div>

          {/* 6. PRESENTATION BOARD */}
          <div className="lg:col-span-3 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1 bg-[#7FFF00]/15 text-[#111111] font-mono text-[6px] tracking-widest uppercase font-black border-l-2 border-b-2 border-[#111111]">PRESENTATION</div>
            <div className="space-y-1 font-mono text-[8px] text-[#555555]">
              <span className="text-[#111111] font-black tracking-wider block text-[9px]">06 PRESENTATION BOARD</span>
              <span>COMPETENCIA / ANÁLISIS</span>
            </div>

            <div className="border border-[#111111]/30 bg-[#F5F5F7] rounded-none p-3 relative group-hover:scale-[1.01] transition-transform flex flex-col justify-between h-40">
              <div className="flex justify-between items-center text-[6px] font-mono text-gray-400 font-bold">
                <span>MODELO DE CASO STV</span>
                <span>TABLERO 01</span>
              </div>

              {/* Blueprint overlap style */}
              <div className="flex-1 bg-[#FFFFFF] border border-[#111111]/15 rounded-none my-2 p-1 relative flex items-center justify-center">
                <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full text-[#111111]/10 opacity-50">
                  <path d="M 10 30 L 90 30 M 50 10 L 50 50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                  <rect x="25" y="15" width="50" height="30" fill="none" stroke="#111111" strokeWidth="1" />
                </svg>
                <div className="absolute bottom-2 left-2 right-2 text-[7px] font-mono leading-none bg-[#111111] p-1.5 rounded-none text-white flex flex-col">
                  <span className="text-gray-400 font-bold text-[5px]">LA IMPOSIBLE</span>
                  <span className="text-[#7FFF00] font-black text-[7px]">ESTRUCTURA VOLADIZA.</span>
                </div>
              </div>

              <span className="text-[5px] font-mono text-gray-400 text-center font-bold">STV DESIGN STUDY / ESQUEMÁTICAS</span>
            </div>

            <p className="text-[9px] text-[#555555] leading-normal font-mono">
              Maqueta de análisis estructural continuo combinando diagramación matemática y planos vectoriales de alta precisión.
            </p>
          </div>

          {/* 7. PROPOSAL COVER */}
          <div className="lg:col-span-3 rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1 bg-[#7FFF00]/15 text-[#111111] font-mono text-[6px] tracking-widest uppercase font-black border-l-2 border-b-2 border-[#111111]">PROPOSAL COVER</div>
            <div className="space-y-1 font-mono text-[8px] text-[#555555]">
              <span className="text-[#111111] font-black tracking-wider block text-[9px]">08 PROPOSAL COVER</span>
              <span>PROYECTOS / LICITACIONES</span>
            </div>

            <div className="border border-[#111111]/30 bg-[#F5F5F7] rounded-none p-3 relative group-hover:scale-[1.01] transition-transform flex flex-col justify-between h-40">
              <span className="text-[6px] font-mono text-gray-400 font-bold">EXPEDIENTE FORMAL STV</span>
              
              <div className="space-y-1 py-1.5">
                <span className="text-[6px] font-mono text-[#111111] block uppercase font-black tracking-widest">PROPUESTA DE VALOR</span>
                <h4 className="text-[10px] font-display font-black uppercase text-[#111111] leading-tight">PROPUESTA TÉCNICA Y COMERCIAL</h4>
              </div>

              <div className="flex justify-between items-center text-[6px] font-mono text-gray-400 border-t border-[#111111]/15 pt-1.5 font-bold">
                <span>LICITACIÓN COGNITIVA</span>
                <span className="font-black text-[#111111]">STV</span>
              </div>
            </div>

            <p className="text-[9px] text-[#555555] leading-normal font-mono">
              Diseño sofisticado de carpeta técnica de propuesta corporativa con barra de metadatos de validación suiza.
            </p>
          </div>

        </div>

        {/* 8. LINKEDIN HEADER & BUSINESS ASSETS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          
          {/* LinkedIn Header */}
          <div className="rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1 bg-[#7FFF00]/15 text-[#111111] font-mono text-[6px] tracking-widest uppercase font-black border-l-2 border-b-2 border-[#111111]">LINKEDIN HEADER</div>
            <div className="space-y-1 font-mono text-[8px] text-[#555555]">
              <span className="text-[#111111] font-black tracking-wider block text-[9px]">07 LINKEDIN HEADER</span>
              <span>POSICIONAMIENTO PROFESIONAL</span>
            </div>

            <div className="border border-[#111111]/30 bg-[#F5F5F7] rounded-none overflow-hidden relative group-hover:scale-[1.01] transition-transform flex flex-col justify-between h-28">
              <div className="bg-[#FFFFFF] px-3 py-1 border-b border-[#111111]/15 flex justify-between items-center text-[6px] font-mono text-gray-400 font-bold">
                <span>VISTA DE BANNER DE LINKEDIN</span>
                <span>1584 x 396 px</span>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[6px] font-mono text-[#111111] font-black uppercase tracking-widest">STV DESIGN</span>
                  <h4 className="text-[10px] font-display font-black uppercase tracking-wider text-[#111111]">
                    INTELIGENCIA ESTRUCTURAL.<br />AUTORIDAD COMERCIAL.
                  </h4>
                </div>
                
                {/* Visual architectural rendering mockup block */}
                <div className="w-20 h-12 bg-[#FFFFFF] border border-[#111111]/30 rounded-none flex items-center justify-center p-1">
                  <svg viewBox="0 0 50 30" className="w-full h-full text-[#111111]/20">
                    <line x1="0" y1="15" x2="50" y2="15" stroke="currentColor" strokeWidth="0.5" />
                    <rect x="15" y="5" width="20" height="20" fill="none" stroke="#111111" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              <div className="bg-[#FFFFFF] px-3 py-1 flex justify-between items-center text-[5px] font-mono text-gray-400 font-bold">
                <span>ARQUITECTOS DE LA RED STV</span>
                <span>ESTADO VALIDADO</span>
              </div>
            </div>

            <p className="text-[9px] text-[#555555] leading-normal font-mono">
              Diseñado para establecer un liderazgo de marca claro y autoritario en plataformas de networking profesional.
            </p>
          </div>

          {/* Business Assets */}
          <div className="rounded-none border-2 border-[#111111] bg-[#FFFFFF] p-4 flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#111111] transition-all shadow-[2px_2px_0px_#111111] group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1 bg-[#7FFF00]/15 text-[#111111] font-mono text-[6px] tracking-widest uppercase font-black border-l-2 border-b-2 border-[#111111]">BUSINESS ASSETS</div>
            <div className="space-y-1 font-mono text-[8px] text-[#555555]">
              <span className="text-[#111111] font-black tracking-wider block text-[9px]">09 BUSINESS ASSETS</span>
              <span>COMUNICACIÓN CORPORATIVA</span>
            </div>

            <div className="border border-[#111111]/30 bg-[#F5F5F7] rounded-none p-4 relative group-hover:scale-[1.01] transition-transform flex items-center justify-between h-28 font-mono text-[8px]">
              <div className="space-y-1.5 flex-1">
                <span className="text-[#111111] font-black uppercase text-[7px] tracking-wider block">SISTEMA STV</span>
                <p className="text-[#111111] text-[8px] font-bold leading-relaxed">
                  "INTELIGENCIA QUE CONSTRUYE VALOR."
                </p>
                <div className="flex gap-2 pt-1">
                  <span className="h-3.5 px-1.5 bg-[#FFFFFF] border border-[#111111]/30 text-[#111111] text-[6px] font-black flex items-center justify-center rounded-none shadow-[1px_1px_0px_#111111]">STV FOLDERS</span>
                  <span className="h-3.5 px-1.5 bg-[#FFFFFF] border border-[#111111]/30 text-[#111111] text-[6px] font-black flex items-center justify-center rounded-none shadow-[1px_1px_0px_#111111]">STV CARDS</span>
                </div>
              </div>
              
              {/* Corporate Identity files mockup stack */}
              <div className="w-24 h-16 bg-[#FFFFFF] border border-[#111111]/30 rounded-none flex flex-col justify-between p-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-[#7FFF00]/5 blur-sm rounded-full"></div>
                <span className="text-[6px] text-gray-400 font-bold">STV CORP</span>
                <div className="w-full h-0.5 bg-[#111111]"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[5px] text-[#555555] font-semibold">PROPUESTA.PDF</span>
                  <span className="text-[5px] text-[#111111] font-black">➔</span>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-[#555555] leading-normal font-mono">
              Dossiers impresos, carpetas de presentación y tarjetas personales alineados meticulosamente a proporciones áureas.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
