import React, { useEffect, useRef, useState } from 'react';
import { GravityNode } from '../types';
import { Sliders, Zap, RefreshCw, Eye } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  id: string;
  label: string;
  nodeAffinity: 'structural' | 'visual' | 'business';
  color: string;
}

interface HubGravedadProps {
  structuralPull: number;
  setStructuralPull: (p: number) => void;
  visualPull: number;
  setVisualPull: (p: number) => void;
  businessPull: number;
  setBusinessPull: (p: number) => void;
  fibrationFreq: number;
  setFibrationFreq: (f: number) => void;
  fibrationAmp: number;
  setFibrationAmp: (a: number) => void;
  neuralPath?: string;
}

export default function HubGravedad({
  structuralPull, setStructuralPull,
  visualPull, setVisualPull,
  businessPull, setBusinessPull,
  fibrationFreq, setFibrationFreq,
  fibrationAmp, setFibrationAmp,
  neuralPath = 'balanced-equilibrium'
}: HubGravedadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [particleCount, setParticleCount] = useState(25);
  const [hoveredParticle, setHoveredParticle] = useState<Particle | null>(null);

  // Core gravity node coordinates
  const [nodes, setNodes] = useState<GravityNode[]>([
    {
      id: 'structural',
      name: 'Structural Core',
      color: '#1A3A4B', // Petrol blue
      x: 180, y: 150, baseX: 180, baseY: 150,
      mass: 0.85,
      active: true,
      description: 'AISC Steel specs & AWS joints',
      parameters: { Code: 'AISC-E3', Material: 'A36 Steel' }
    },
    {
      id: 'visual',
      name: 'Visual Engine',
      color: '#E5C158', // Matte Yellow
      x: 480, y: 130, baseX: 480, baseY: 130,
      mass: 0.75,
      active: true,
      description: 'Generative Branding & Fibrations',
      parameters: { Grid: '1.618 ratio', Oscillation: '0.05Hz' }
    },
    {
      id: 'business',
      name: 'Business Core',
      color: '#7FFF00', // Chartreuse
      x: 320, y: 280, baseX: 320, baseY: 280,
      mass: 0.70,
      active: true,
      description: 'Parametric Costs & Margins',
      parameters: { Margin: '35% floor', DynamicRate: '$120/hr' }
    }
  ]);

  // Particle list reference
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const labels = [
      'A36 Wide Flange Columns', 'Fillet Weld 6mm Plate', 'E70XX Welding Electrodes',
      'Vilanova Space Ratio 1.618', 'Background Grid 0.05Hz Sway', 'Matte Yellow Margin Buffer',
      'Dynamic Token pricing rule', '35% margin floor constraint', 'AISC Sec J compliance unit',
      'Capa 5 Contextual text block', 'Gravitational coordinate force', 'Return on Emotion ratio'
    ];

    const generateParticles = () => {
      const arr: Particle[] = [];
      const nodeTypes: ('structural' | 'visual' | 'business')[] = ['structural', 'visual', 'business'];
      // Use the user's precise palette colors for dots
      const colors = { structural: '#1A3A4B', visual: '#E5C158', business: '#7FFF00' };

      for (let i = 0; i < particleCount; i++) {
        const type = nodeTypes[i % 3];
        arr.push({
          x: Math.random() * 500 + 50,
          y: Math.random() * 250 + 50,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          size: Math.random() * 3.5 + 2,
          id: `p-${i}`,
          label: labels[i % labels.length],
          nodeAffinity: type,
          color: colors[type]
        });
      }
      particlesRef.current = arr;
    };

    generateParticles();
  }, [particleCount]);

  // Handle Seismic shockwave
  const handleSeismicPulse = () => {
    particlesRef.current.forEach(p => {
      const angle = Math.random() * Math.PI * 2;
      const force = Math.random() * 6 + 3;
      p.vx = Math.cos(angle) * force;
      p.vy = Math.sin(angle) * force;
    });
  };

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const updatedNodes = [...nodes];
    updatedNodes[0].mass = structuralPull;
    updatedNodes[1].mass = visualPull;
    updatedNodes[2].mass = businessPull;

    const render = () => {
      // Clear with a transparent/solid white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      // 1. Draw "Chromatic Fibration" wavy background grid lines (Brutal, modern, and alive)
      ctx.strokeStyle = 'rgba(45, 45, 45, 0.04)';
      ctx.lineWidth = 1;
      
      const gridSpacing = 24;
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        for (let y = 0; y < canvas.height; y += 4) {
          const waveWarp = Math.sin(y * 0.007 + time * fibrationFreq * Math.PI * 2) * fibrationAmp;
          ctx.lineTo(x + waveWarp, y);
        }
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 4) {
          const waveWarp = Math.cos(x * 0.007 + time * fibrationFreq * Math.PI * 2) * fibrationAmp;
          ctx.lineTo(x, y + waveWarp);
        }
        ctx.stroke();
      }

      // 2. Draw Gravitational Nodes (The structural orbits)
      updatedNodes.forEach(node => {
        // Orbital circles
        ctx.strokeStyle = `${node.color}1c`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 65 * node.mass + 30, 0, Math.PI * 2);
        ctx.stroke();

        // Glow gradient (adapted for white background)
        const glowGrad = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, 25 * node.mass + 15);
        glowGrad.addColorStop(0, `${node.color}50`);
        glowGrad.addColorStop(0.4, `${node.color}15`);
        glowGrad.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 25 * node.mass + 15, 0, Math.PI * 2);
        ctx.fill();

        // Node absolute center vector dot
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Node title text
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.toUpperCase(), node.x, node.y - (25 * node.mass + 8));

        ctx.fillStyle = '#555555';
        ctx.font = '8px JetBrains Mono';
        ctx.fillText(`Mass: ${node.mass.toFixed(2)}`, node.x, node.y - (25 * node.mass - 4));
      });

      // 3. Move and Draw floating particles
      // First, update coordinates
      particlesRef.current.forEach(p => {
        const targetNode = updatedNodes.find(n => n.id === p.nodeAffinity);
        if (targetNode) {
          const dx = targetNode.x - p.x;
          const dy = targetNode.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 10) {
            const force = (0.16 * targetNode.mass) / Math.max(dist * 0.08, 1);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }

          p.vx *= 0.95;
          p.vy *= 0.95;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Bounce boundaries
        if (p.x < 10) { p.x = 10; p.vx *= -0.4; }
        if (p.x > canvas.width - 10) { p.x = canvas.width - 10; p.vx *= -0.4; }
        if (p.y < 10) { p.y = 10; p.vy *= -0.4; }
        if (p.y > canvas.height - 10) { p.y = canvas.height - 10; p.vy *= -0.4; }
      });

      // 3.5 Draw neural mesh network lines (Malla/Red Neuronal Triangular)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p1 = particlesRef.current[i];
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const alpha = (1 - dist / 80) * 0.25;
            // Palette matches requested lines
            ctx.strokeStyle = `rgba(45, 45, 45, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes
      particlesRef.current.forEach(p => {
        // Draw particle dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow tail
        ctx.fillStyle = `${p.color}35`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Connect hover line
        if (hoveredParticle && hoveredParticle.id === p.id) {
          const targetNode = updatedNodes.find(n => n.id === p.nodeAffinity);
          ctx.strokeStyle = `${p.color}90`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(targetNode?.x || p.x, targetNode?.y || p.y);
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [nodes, structuralPull, visualPull, businessPull, fibrationFreq, fibrationAmp, hoveredParticle]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const found = particlesRef.current.find(p => {
      const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
      return dist < 12;
    });

    setHoveredParticle(found || null);
  };

  return (
    <div className="bg-[#FFFFFF] border-2 border-[#2D2D2D] p-6 rounded-none relative overflow-hidden" id="hub-gravity">
      {/* Dynamic Zone Delimitation */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#E5C158]" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="industry-ultra-italic-mono text-xs text-[#1A3A4B] block">PHASE 03 / ORBITAL ATTRACTORS</span>
          <h2 className="industry-ultra-italic text-3xl text-black leading-none mt-1">
            [ HUB 03 : RED_NEURONAL_GRAVEDAD ]
          </h2>
          <p className="text-xs text-gray-600 font-mono italic mt-1">
            Semantic coordinates are mathematically attracted to primary seeds. Calibrate ratios in real-time.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSeismicPulse}
            className="bg-[#2D2D2D] hover:bg-black text-[#7FFF00] font-mono font-bold text-xs px-4 py-2 uppercase flex items-center gap-1.5 transition"
          >
            <Zap className="h-3.5 w-3.5 fill-current" /> SEISMIC PULSE
          </button>
          <button
            onClick={() => {
              setStructuralPull(0.85);
              setVisualPull(0.75);
              setBusinessPull(0.70);
              setFibrationFreq(0.05);
              setFibrationAmp(15);
            }}
            className="border-2 border-[#2D2D2D] text-black hover:bg-gray-50 font-mono font-bold text-xs px-4 py-1.5 uppercase flex items-center gap-1.5 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> RESET ORBIT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GRAVITY PARAMETER CALIBRATION */}
        <div className="lg:col-span-4 border border-[#2D2D2D] p-4 bg-white space-y-5">
          <h3 className="industry-ultra-italic text-sm text-[#1A3A4B] border-b border-[#2D2D2D]/10 pb-2 flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-[#E5C158]" /> Gravitational Coefficients
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-600">Structural Core Mass (AISC)</span>
                <span className="text-black font-extrabold">{structuralPull.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={structuralPull}
                onChange={(e) => setStructuralPull(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7FFF00]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-600">Visual Engine Mass (STV)</span>
                <span className="text-black font-extrabold">{visualPull.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={visualPull}
                onChange={(e) => setVisualPull(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7FFF00]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-600">Business Core Mass (Costs)</span>
                <span className="text-black font-extrabold">{businessPull.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={businessPull}
                onChange={(e) => setBusinessPull(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7FFF00]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#2D2D2D]/10 space-y-4">
            <span className="text-[10px] font-mono uppercase text-[#B2902C] font-extrabold block">
              Chromatic Grid Fibration (Visual Music)
            </span>

            <div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-600">Grid Frequency (Hz)</span>
                <span className="text-black font-extrabold">{fibrationFreq.toFixed(3)} Hz</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.25"
                step="0.01"
                value={fibrationFreq}
                onChange={(e) => setFibrationFreq(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7FFF00]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-600">Wave Amplitude (px)</span>
                <span className="text-black font-extrabold">{fibrationAmp} px</span>
              </div>
              <input
                type="range"
                min="2"
                max="45"
                step="1"
                value={fibrationAmp}
                onChange={(e) => setFibrationAmp(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7FFF00]"
              />
            </div>
          </div>
        </div>

        {/* GRAVITY MAPPING CANVAS */}
        <div className="lg:col-span-8 border-2 border-[#2D2D2D] bg-[#FFFFFF] rounded-none overflow-hidden relative min-h-[340px] flex flex-col justify-between">
          <canvas
            ref={canvasRef}
            width={600}
            height={320}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredParticle(null)}
            className="w-full h-full block cursor-crosshair"
          />

          {/* Hover metadata readout */}
          <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
            {hoveredParticle ? (
              <div className="p-3 border border-[#2D2D2D] bg-white/95 text-black animate-fadeIn space-y-1 shadow-lg">
                <span className="text-[9px] font-mono text-[#B2902C] uppercase font-bold block">
                  Detected Coordinate Node (Capa 5 Vector)
                </span>
                <h4 className="font-mono text-xs font-extrabold text-[#1A3A4B]">"{hoveredParticle.label}"</h4>
                <p className="text-[9px] text-gray-500 font-mono">
                  Domain Alignment: {hoveredParticle.nodeAffinity.toUpperCase()} | Gravitational lock stable.
                </p>
              </div>
            ) : (
              <div className="p-2 border border-[#2D2D2D] bg-white/90 text-gray-500 text-[10px] text-center font-mono flex items-center justify-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-cyan-500" />
                Hover cursor over active vectors to audit localized RAG indices.
              </div>
            )}
          </div>

          {/* Statistics overlay */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none text-[9px] font-mono text-gray-500 bg-white/90 p-2 border border-gray-200 rounded space-y-0.5">
            <div>VECTORS MAP: <span className="text-black font-bold">{particleCount} ACTIVE</span></div>
            <div>SWAY PERIODIC: <span className="text-cyan-600 font-bold">{fibrationFreq.toFixed(2)} Hz</span></div>
            <div>PATHWAY: <span className="text-cyan-500 font-bold">{neuralPath.replace('-', ' ').toUpperCase()}</span></div>
            <div>ROE SIGNAL: <span className="text-[#7FFF00] font-bold">STABLE</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}
