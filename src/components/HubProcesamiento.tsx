import React, { useState, useEffect } from 'react';
import { Capa, ParsingStepLog } from '../types';
import { Sliders, Layers, Info, CheckCircle2, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

interface HubProcesamientoProps {
  steps: ParsingStepLog[] | null;
  isProcessing: boolean;
  chunkSize: number;
  setChunkSize: (size: number) => void;
  overlap: number;
  setOverlap: (overlap: number) => void;
  totalTokensCalculated?: number;
  neuralPath?: string;
}

export default function HubProcesamiento({
  steps,
  isProcessing,
  chunkSize,
  setChunkSize,
  overlap,
  setOverlap,
  totalTokensCalculated,
  neuralPath = 'balanced-equilibrium'
}: HubProcesamientoProps) {
  const [selectedCapa, setSelectedCapa] = useState<number>(5);

  useEffect(() => {
    if (neuralPath === 'steel-overload') {
      setSelectedCapa(9); // Oráculo Rule Audit
    } else if (neuralPath === 'brand-expression') {
      setSelectedCapa(6); // Gravitational Tagging
    } else if (neuralPath === 'profit-maximization') {
      setSelectedCapa(4); // Table Extraction & Alignment
    } else {
      setSelectedCapa(5); // Semantic Chunking
    }
  }, [neuralPath]);

  const capas: Capa[] = [
    { number: 1, name: "Raw Ingestion & Ingestion Index", description: "Registers raw bytes, formats, size, and source metadata into Brain DB.", purpose: "Validate input authenticity", inputDescription: "Raw file binaries", outputDescription: "Ingested registration index" },
    { number: 2, name: "Spatial Segmentation", description: "Performs OCR and page-boundary coordinate mapping, creating visual bounding boxes.", purpose: "Detect layout elements", inputDescription: "Indexed bytes", outputDescription: "Bounding box coordinates" },
    { number: 3, name: "Structural Parsing", description: "Builds a parent-child hierarchical tree mapping headers, body copy, and tables.", purpose: "Establish text relationships", inputDescription: "Visual coordinate blocks", outputDescription: "Structured document tree" },
    { number: 4, name: "Table Extraction & Matrix Alignment", description: "Processes layout cells to extract nested data matrices and assigns logical weights.", purpose: "Isolate structured specs", inputDescription: "Tree layout markers", outputDescription: "Aligned cell data tables" },
    { number: 5, name: "Semantic Chunking", description: "Splits text blocks into custom contextual chunks adjusted by sliding boundary sizes.", purpose: "Context-optimized slicing", inputDescription: "Structured text sheets", outputDescription: "Sized contextual text chunks" },
    { number: 6, name: "Gravitational Tagging", description: "Scores chunks on semantic affinity, mapping them to the three primary Gravitational Nodes.", purpose: "Map domain relevance", inputDescription: "Context chunks", outputDescription: "Affinity coefficients" },
    { number: 7, name: "Neural Vectorization", description: "Generates multidimensional embeddings for exact cosine semantic searches.", purpose: "Map to neural space", inputDescription: "Classified chunks", outputDescription: "1536-dim vector arrays" },
    { number: 8, name: "Relational Gravitational Indexing", description: "Links vectors directly with parametric reference codes inside the Master Matrix.", purpose: "Lock context coordinates", inputDescription: "Vector arrays", outputDescription: "Matrix index links" },
    { number: 9, name: "Oráculo Rule Audit & Anomaly Resolution", description: "Applies rule audits (AISC, AWS, IMCA) and flags compliance anomalies to Human-in-the-Loop.", purpose: "Prevent code violations", inputDescription: "Matrix linked coordinates", outputDescription: "Audit compliance pass/fail" }
  ];

  const activeCapaData = capas.find(c => c.number === selectedCapa) || capas[4];

  // Helper to determine step status
  const getStepStatus = (capaNum: number) => {
    if (steps) {
      const log = steps.find(s => s.capaNumber === capaNum);
      return log ? log.status : 'pending';
    }
    if (isProcessing) {
      // Simulate sequential progress if processing but steps aren't ready yet
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="bg-[#FFFFFF] border-2 border-[#2D2D2D] p-6 rounded-none relative overflow-hidden" id="hub-procesamiento">
      {/* Dynamic Zone Delimitation */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#E5C158]" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="industry-ultra-italic-mono text-xs text-[#1A3A4B] block">PHASE 02 / ANALYSIS CHUNKING</span>
          <h2 className="industry-ultra-italic text-3xl text-black leading-none mt-1">
            [ HUB 02 : PROCESAMIENTO_MULTICAPA ]
          </h2>
          <p className="text-xs text-gray-600 font-mono italic mt-1">
            The 9-Layer Tectonic Pipeline splits, indexes, vectorizes, and audits your ingested document.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 border border-[#2D2D2D] bg-[#FDF9ED] px-4 py-1.5 text-xs font-mono font-bold">
          {isProcessing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#E5C158]" />
              <span className="text-[#B2902C]">PARSING SYSTEM CYCLING...</span>
            </>
          ) : steps ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#7FFF00] shadow-[0_0_6px_#7FFF00]" />
              <span className="text-black">AUDIT RUN LOGGED</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-gray-500">IDLE PIPELINE READY</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SLIDERS & PARAMETERS PANEL */}
        <div className="lg:col-span-4 border border-[#2D2D2D] p-4 bg-white flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="industry-ultra-italic text-sm text-[#1A3A4B] border-b border-[#2D2D2D]/10 pb-2 flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-cyan-500" /> Chunking Parameters
            </h3>

            {/* Slider 1: Chunk Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-600">Context Unit Size (Capa 5)</span>
                <span className="text-black font-extrabold">{chunkSize} characters</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="50"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7FFF00]"
              />
              <span className="text-[9px] font-mono text-gray-400 block">
                Adjusts character bounds for each independent cognitive chunk.
              </span>
            </div>

            {/* Slider 2: Overlap */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-600">Sliding Boundary Overlap</span>
                <span className="text-black font-extrabold">{overlap} characters</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="10"
                value={overlap}
                onChange={(e) => setOverlap(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7FFF00]"
              />
              <span className="text-[9px] font-mono text-gray-400 block">
                Preserves context across chunk boundaries to avoid semantic clipping.
              </span>
            </div>
          </div>

          {/* Token summation formula display */}
          <div className="bg-[#EAF2F5] border border-cyan-200 p-4 font-mono text-[10px] text-[#0F2D3A] space-y-2">
            <span className="font-bold text-cyan-600 uppercase block">Gravity Token Summation Equation:</span>
            <p className="leading-relaxed">
              Tokens are calculated dynamically across layers to determine document mass:
            </p>
            <div className="bg-white/80 p-2 border border-cyan-100 font-mono text-center text-xs text-black font-bold tracking-tight">
              T_total = Chunks(W_1.0) + Matrix(W_1.618) + Rules(W_1.25)
            </div>
            {totalTokensCalculated && (
              <div className="flex justify-between items-center pt-1 border-t border-cyan-100 font-bold">
                <span>Ingestion Mass calculated:</span>
                <span className="text-cyan-600">{totalTokensCalculated} tokens</span>
              </div>
            )}
          </div>
        </div>

        {/* 9-CAPA SEISMIC TIMELINE */}
        <div className="lg:col-span-5 border border-[#2D2D2D] p-4 bg-white">
          <h3 className="industry-ultra-italic text-sm text-[#1A3A4B] border-b border-[#2D2D2D]/10 pb-2 flex items-center gap-1.5 mb-3">
            <Layers className="h-4 w-4 text-[#E5C158]" /> 9 Ingestion Layers (Capa 1 - 9)
          </h3>

          <div className="relative pl-6 space-y-1">
            {/* Thread line connecting steps */}
            <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 border-l-2 border-dashed border-[#2D2D2D]/20" />

            {capas.map((capa) => {
              const status = getStepStatus(capa.number);
              const isSelected = selectedCapa === capa.number;
              
              let statusDot = <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-white" />;
              let textStyle = "text-gray-500";

              if (status === 'active') {
                statusDot = <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white animate-pulse" />;
                textStyle = "text-cyan-600 font-bold";
              } else if (status === 'success') {
                statusDot = <div className="w-2.5 h-2.5 rounded-full bg-[#7FFF00] border border-white" />;
                textStyle = "text-black font-bold";
              } else if (status === 'error') {
                statusDot = <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />;
                textStyle = "text-red-600 font-bold";
              }

              return (
                <button
                  key={capa.number}
                  onClick={() => setSelectedCapa(capa.number)}
                  className={`w-full text-left pl-4 py-1.5 flex items-center gap-3 hover:bg-gray-50 transition relative ${
                    isSelected ? 'bg-[#FDF9ED]' : ''
                  }`}
                >
                  <div className="absolute left-[-21px] flex items-center justify-center">
                    {statusDot}
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-400">C{capa.number}</span>
                  <span className={`text-[11px] truncate font-mono ${textStyle}`}>{capa.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DETAILED INSIGHT OVERLAY */}
        <div className="lg:col-span-3 border border-[#2D2D2D] p-4 bg-[#FDF9ED] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D2D2D]/10 pb-2">
              <h4 className="industry-ultra-italic text-xs text-[#B2902C]">Capa {activeCapaData.number} Detail</h4>
              <span className="font-mono text-[9px] bg-[#E5C158]/20 px-2 py-0.5 text-[#B2902C] font-bold">
                AUDIT ENGINE
              </span>
            </div>

            <div className="space-y-3">
              <div className="font-mono text-xs text-black font-extrabold uppercase leading-tight">
                {activeCapaData.name}
              </div>
              <p className="text-[10px] font-mono text-gray-600 leading-relaxed">
                {activeCapaData.description}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#2D2D2D]/5 text-[10px] font-mono">
              <div>
                <span className="text-gray-400 uppercase font-bold block">Engine Goal:</span>
                <span className="text-[#1A3A4B]">{activeCapaData.purpose}</span>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold block">Layer Input:</span>
                <span className="text-[#1A3A4B] italic break-all">{activeCapaData.inputDescription}</span>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold block">Layer Output:</span>
                <span className="text-cyan-600 italic break-all">{activeCapaData.outputDescription}</span>
              </div>
            </div>
          </div>

          {/* Live parsed outputs if available */}
          {steps && steps.find(s => s.capaNumber === selectedCapa) && (
            <div className="mt-4 pt-3 border-t border-[#2D2D2D]/10">
              <span className="text-[9px] font-mono text-gray-500 uppercase font-bold block mb-1">
                Extracted Data Stream (Capa {selectedCapa})
              </span>
              <pre className="text-[8px] font-mono bg-white p-2 border border-gray-200 overflow-x-auto text-[#1A3A4B] max-h-[100px] select-all">
                {steps.find(s => s.capaNumber === selectedCapa)?.output}
              </pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
