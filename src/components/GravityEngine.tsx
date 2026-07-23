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

export default function GravityEngine() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Simulation State
  const [structuralPull, setStructuralPull] = useState(0.8);
  const [visualPull, setVisualPull] = useState(0.6);
  const [businessPull, setBusinessPull] = useState(0.5);
  
  const [fibrationFreq, setFibrationFreq] = useState(0.05); // Hz
  const [fibrationAmp, setFibrationAmp] = useState(25); // Pixels
  
  const [particleCount, setParticleCount] = useState(30);
  const [hoveredParticle, setHoveredParticle] = useState<Particle | null>(null);

  // Core gravity node states
  const [nodes, setNodes] = useState<GravityNode[]>([
    {
      id: 'structural',
      name: 'Structural Core',
      color: '#4F46E5', // Indigo
      x: 200, y: 180, baseX: 200, baseY: 180,
      mass: 0.8,
      active: true,
      description: 'AISC Steel Specs & AWS Welds',
      parameters: { Code: 'AISC-E3', Material: 'A36 Steel' }
    },
    {
      id: 'visual',
      name: 'Visual Engine',
      color: '#E2FF44', // Neon Accent
      x: 500, y: 150, baseX: 500, baseY: 150,
      mass: 0.6,
      active: true,
      description: 'Generative Branding & Fibrations',
      parameters: { Grid: '1.618 ratio', Oscillation: '0.05Hz' }
    },
    {
      id: 'business',
      name: 'Business Core',
      color: '#10B981', // Emerald
      x: 350, y: 320, baseX: 350, baseY: 320,
      mass: 0.5,
      active: true,
      description: 'Parametric Costs & Margins',
      parameters: { Margin: '35% floor', DynamicRate: '$120/hr' }
    }
  ]);

  // Particle generation
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const labels = [
      'Fillet Weld Spec', 'Wide Flange Columns', 'E70XX Electrodes', 'Lateral Wind Loads',
      'Neuro-Slate Accent', '1.618 Proportions', 'Logo Clearance Buffer', 'Fibration Sine Wave',
      'Margining Rules', 'Fabrication Multiplier', 'Dynamic Token Pricing', 'A36 Structural Steel'
    ];

    const generateParticles = () => {
      const arr: Particle[] = [];
      const nodeTypes: ('structural' | 'visual' | 'business')[] = ['structural', 'visual', 'business'];
      const colors = { structural: '#818CF8', visual: '#E2FF44', business: '#34D399' };

      for (let i = 0; i < particleCount; i++) {
        const type = nodeTypes[i % 3];
        arr.push({
          x: Math.random() * 600 + 50,
          y: Math.random() * 350 + 50,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
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

  // Handle Seismic Pulse (Shockwave)
  const handleSeismicPulse = () => {
    particlesRef.current.forEach(p => {
      const angle = Math.random() * Math.PI * 2;
      const force = Math.random() * 5 + 3;
      p.vx = Math.cos(angle) * force;
      p.vy = Math.sin(angle) * force;
    });
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Adjust pulls in our node parameters
    const updatedNodes = [...nodes];
    updatedNodes[0].mass = structuralPull;
    updatedNodes[1].mass = visualPull;
    updatedNodes[2].mass = businessPull;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016; // approx 60fps frame increment

      // 1. Draw "Fibration" wave grids (Santi Vilanova's visual music backgrounds)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      
      const gridSpacing = 25;
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        for (let y = 0; y < canvas.height; y += 4) {
          // Calculate fibration warp based on sine/cosine frequency and amplitude
          const waveWarp = Math.sin(y * 0.006 + time * fibrationFreq * Math.PI * 2) * fibrationAmp;
          ctx.lineTo(x + waveWarp, y);
        }
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 4) {
          const waveWarp = Math.cos(x * 0.006 + time * fibrationFreq * Math.PI * 2) * fibrationAmp;
          ctx.lineTo(x, y + waveWarp);
        }
        ctx.stroke();
      }

      // 2. Draw Gravitational Nodes (The structural orbits)
      updatedNodes.forEach(node => {
        // Subtle orbital orbit circles around nodes
        ctx.strokeStyle = `${node.color}20`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 60 * node.mass + 30, 0, Math.PI * 2);
        ctx.stroke();

        // Node center core glow
        const glowGrad = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, 24 * node.mass + 15);
        glowGrad.addColorStop(0, `${node.color}90`);
        glowGrad.addColorStop(0.3, `${node.color}35`);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 24 * node.mass + 15, 0, Math.PI * 2);
        ctx.fill();

        // Node absolute center vector dot
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '500 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y - (30 * node.mass + 5));

        ctx.fillStyle = '#9CA3AF';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`Pull: ${node.mass.toFixed(2)}`, node.x, node.y - (30 * node.mass - 7));
      });

      // 3. Move and Draw floating particles (Knowledge Chunks)
      particlesRef.current.forEach(p => {
        // Locate matching affinity node
        const targetNode = updatedNodes.find(n => n.id === p.nodeAffinity);
        if (targetNode) {
          // Compute gravity forces
          const dx = targetNode.x - p.x;
          const dy = targetNode.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 10) {
            // F = G * (m1 * m2) / r^2
            const force = (0.15 * targetNode.mass) / Math.max(dist * 0.08, 1);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }

          // Apply slight drag to keep particles stable
          p.vx *= 0.96;
          p.vy *= 0.96;
        }

        // Apply velocities
        p.x += p.vx;
        p.y += p.vy;

        // Keep inside boundaries
        if (p.x < 10) { p.x = 10; p.vx *= -0.5; }
        if (p.x > canvas.width - 10) { p.x = canvas.width - 10; p.vx *= -0.5; }
        if (p.y < 10) { p.y = 10; p.vy *= -0.5; }
        if (p.y > canvas.height - 10) { p.y = canvas.height - 10; p.vy *= -0.5; }

        // Draw particle dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow tail
        ctx.fillStyle = `${p.color}30`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Simple text coordinate lines for active hovered labels
        if (hoveredParticle && hoveredParticle.id === p.id) {
          ctx.strokeStyle = `${p.color}50`;
          ctx.lineWidth = 0.5;
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

  // Handle Canvas mouse hovering over particles
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if near any particle
    const found = particlesRef.current.find(p => {
      const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
      return dist < 12; // Radius match threshold
    });

    setHoveredParticle(found || null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="gravity-engine-tab">
      
      {/* Simulation Controls Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 space-y-5">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-brand-gold" /> Gravitational Coefficients
          </h3>

          {/* SSliders for Gravity Pull */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-400">Structural Core Mass (AISC)</span>
                <span className="text-white font-semibold">{structuralPull.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={structuralPull}
                onChange={(e) => setStructuralPull(Number(e.target.value))}
                className="w-full h-1 bg-brand-slate-dark rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-400">Visual Engine Mass (Branding)</span>
                <span className="text-white font-semibold">{visualPull.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={visualPull}
                onChange={(e) => setVisualPull(Number(e.target.value))}
                className="w-full h-1 bg-brand-slate-dark rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-400">Business Core Mass (Costs)</span>
                <span className="text-white font-semibold">{businessPull.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={businessPull}
                onChange={(e) => setBusinessPull(Number(e.target.value))}
                className="w-full h-1 bg-brand-slate-dark rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>
          </div>

          {/* Fibration Configuration */}
          <div className="space-y-4 pt-3 border-t border-brand-slate-light/60">
            <span className="text-[10px] font-mono uppercase text-brand-gold block">Chromatic Fibration Config</span>
            
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-400">Oscillation Freq (Hz)</span>
                <span className="text-white font-semibold">{fibrationFreq.toFixed(3)} Hz</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={fibrationFreq}
                onChange={(e) => setFibrationFreq(Number(e.target.value))}
                className="w-full h-1 bg-brand-slate-dark rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-400">Wave Amplitude</span>
                <span className="text-white font-semibold">{fibrationAmp} px</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={fibrationAmp}
                onChange={(e) => setFibrationAmp(Number(e.target.value))}
                className="w-full h-1 bg-brand-slate-dark rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleSeismicPulse}
              className="py-2.5 px-3 rounded-lg text-xs font-semibold bg-brand-gold text-brand-slate-dark hover:bg-yellow-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-gold/10"
            >
              <Zap className="h-3.5 w-3.5 fill-current" /> Seismic Pulse
            </button>
            <button
              onClick={() => {
                setStructuralPull(0.8);
                setVisualPull(0.6);
                setBusinessPull(0.5);
                setFibrationFreq(0.05);
                setFibrationAmp(25);
              }}
              className="py-2.5 px-3 rounded-lg text-xs font-semibold border border-gray-700 bg-brand-slate-dark text-gray-300 hover:text-white hover:border-gray-600 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset Orbit
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Simulation Space Column */}
      <div className="lg:col-span-2 rounded-xl border border-brand-slate-light bg-brand-slate-dark overflow-hidden flex flex-col justify-between relative group min-h-[400px]">
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={600}
          height={380}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredParticle(null)}
          className="w-full h-full block cursor-crosshair scanline"
        />

        {/* Hover details overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          {hoveredParticle ? (
            <div className="p-3 rounded-lg border border-brand-gold bg-brand-slate-medium/95 text-white shadow-xl animate-fadeIn space-y-1">
              <span className="text-[9px] font-mono text-brand-gold uppercase tracking-wider block">
                Detected RAG Chunk (Capa 5 Vector)
              </span>
              <h4 className="font-display font-medium text-xs">"{hoveredParticle.label}"</h4>
              <p className="text-[10px] text-gray-400 font-mono">
                Affinity: {hoveredParticle.nodeAffinity.toUpperCase()} | Gravitational alignment locked.
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg border border-brand-slate-light bg-brand-slate-medium/90 text-gray-400 text-xs text-center font-mono">
              <Eye className="h-3.5 w-3.5 inline mr-1 text-brand-gold" />
              Hover over float dots to inspect semantic node parameters.
            </div>
          )}
        </div>

        {/* Dynamic Canvas statistics overlay */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none text-[10px] font-mono text-gray-500 bg-brand-slate-medium/85 px-3 py-1.5 rounded border border-brand-slate-light/50 space-y-1">
          <div>Particles Active: <span className="text-white">{particleCount}</span></div>
          <div>Harmonic Fibration: <span className="text-brand-gold">0.05 Hz</span></div>
          <div>ROE Signal: <span className="text-emerald-400">Stable</span></div>
        </div>

      </div>

    </div>
  );
}
