import { useRef, useEffect, useState } from 'react';
import { cyberAudio } from './cyberSound';
import { ExternalLink, ShieldCheck, Zap, Activity, Cpu, Lock } from 'lucide-react';

interface NodeInfo {
  id: string;
  name: string;
  domain: string;
  role: string;
  color: string;
  glowColor: string;
  latency: string;
  uptime: string;
  cipher: string;
  xRatio: number;
  yRatio: number;
  description: string;
  features: string[];
}

const NODES: NodeInfo[] = [
  {
    id: 'parent',
    name: 'Saif Tech Global HQ',
    domain: 'saiftechglobal.com',
    role: 'Parent Sovereign Holding & Cloud Cybernetics',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    latency: '14ms',
    uptime: '99.999%',
    cipher: 'ChaCha20-Poly1305',
    xRatio: 0.22,
    yRatio: 0.28,
    description: 'Corporate parent jurisdiction in New Mexico (Entity #0007946146). Houses strategic command, legal sovereignty, and multi-tenant cloud orchestration.',
    features: ['Corporate Secretary Seal', 'Global Infrastructure Router', 'Zero-Trust Gatekeeper'],
  },
  {
    id: 'finance',
    name: 'SG16 Finance & Vault',
    domain: 'sg16finance.com',
    role: 'High-Frequency Sovereign Liquidity & Vaults',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    latency: '8ms',
    uptime: '100.00%',
    cipher: 'AES-256-GCM / Kyber-768',
    xRatio: 0.78,
    yRatio: 0.28,
    description: 'High-throughput algorithmic trading nexus and real-time financial telemetry engine with zero-drift synchronization.',
    features: ['Order Book Telemetry', 'Multi-Asset Tick Feeds', 'Automated Liquidity Guard'],
  },
  {
    id: 'children',
    name: 'SG16 Children World',
    domain: 'sg16children.com',
    role: 'Pediatric Safety & Safe-AI Learning Shield',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    latency: '19ms',
    uptime: '99.998%',
    cipher: 'Zero-Leak On-Device Filter',
    xRatio: 0.22,
    yRatio: 0.72,
    description: 'Autonomous safe-haven platform for younger minds, filtering predatory vectors and providing safe curriculum tutoring with strict privacy.',
    features: ['COPPA+ Shield Protocol', 'Pediatric Content Verification', 'Safe AI Guidance'],
  },
  {
    id: 'identifier',
    name: 'SG16 Identifier Sentinel',
    domain: 'sg16identifier.com',
    role: 'Zero-Knowledge Biometric & Academic Identity',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    latency: '11ms',
    uptime: '99.999%',
    cipher: 'zk-SNARKs + Dilithium-3',
    xRatio: 0.78,
    yRatio: 0.72,
    description: 'Cryptographic identity verification for students, researchers, and enterprise users without exposing private credentials.',
    features: ['Self-Sovereign Identity', 'Biometric ZK Proofs', 'Instant Academic Credentialing'],
  },
];

export function EcosystemTopologyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(NODES[0]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = 420);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 420;
    };
    window.addEventListener('resize', handleResize);

    // Dynamic particles traveling along links
    interface Packet {
      fromIndex: number; // 0..3 node index, -1 = center
      toCenter: boolean;
      progress: number;
      speed: number;
      color: string;
      size: number;
    }

    const packets: Packet[] = [];
    for (let i = 0; i < 28; i++) {
      const fromIdx = Math.floor(Math.random() * NODES.length);
      packets.push({
        fromIndex: fromIdx,
        toCenter: Math.random() > 0.5,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.006,
        color: NODES[fromIdx].color,
        size: 2 + Math.random() * 2.5,
      });
    }

    let t = 0;

    const render = () => {
      t += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Deep cybernetic grid background
      ctx.strokeStyle = 'rgba(255,22,141, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw linking conduits from Central AI Engine to all nodes
      NODES.forEach((node) => {
        const nx = node.xRatio * width;
        const ny = node.yRatio * height;

        // Curved energy conduit
        const grad = ctx.createLinearGradient(centerX, centerY, nx, ny);
        grad.addColorStop(0, 'rgba(255,22,141, 0.6)');
        grad.addColorStop(1, node.glowColor);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const cpx = (centerX + nx) / 2 + Math.sin(t) * 12;
        const cpy = (centerY + ny) / 2 + Math.cos(t) * 12;
        ctx.quadraticCurveTo(cpx, cpy, nx, ny);
        ctx.strokeStyle = grad;
        ctx.lineWidth = hoveredNode === node.id ? 2.5 : 1.5;
        ctx.stroke();

        // Pulsing glow aura around conduit
        ctx.strokeStyle = node.glowColor;
        ctx.lineWidth = 4;
        ctx.stroke();
      });

      // Render traveling data packets
      packets.forEach((p) => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.toCenter = !p.toCenter;
          p.fromIndex = Math.floor(Math.random() * NODES.length);
          p.color = NODES[p.fromIndex].color;
        }

        const node = NODES[p.fromIndex];
        const nx = node.xRatio * width;
        const ny = node.yRatio * height;

        let px: number, py: number;
        const cpx = (centerX + nx) / 2 + Math.sin(t) * 12;
        const cpy = (centerY + ny) / 2 + Math.cos(t) * 12;

        const u = p.toCenter ? p.progress : 1 - p.progress;
        // Quadratic bezier formula
        px = (1 - u) * (1 - u) * nx + 2 * (1 - u) * u * cpx + u * u * centerX;
        py = (1 - u) * (1 - u) * ny + 2 * (1 - u) * u * cpy + u * u * centerY;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Central Core: SG16 AI ENGINE
      const centralRadius = 46;

      // Rotating outer quantum ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(t * 0.4);
      ctx.strokeStyle = 'rgba(255,22,141, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 14]);
      ctx.beginPath();
      ctx.arc(0, 0, centralRadius + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Counter-rotating gold inner ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-t * 0.6);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, centralRadius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Central core orb glow
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, centralRadius);
      coreGrad.addColorStop(0, '#FF168D');
      coreGrad.addColorStop(0.6, '#B91669');
      coreGrad.addColorStop(1, '#070a14');

      ctx.beginPath();
      ctx.arc(centerX, centerY, centralRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = '#FF168D';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#FF5CB8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Central Core Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SG16 AI', centerX, centerY - 4);
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillStyle = '#eab308';
      ctx.fillText('ENGINE', centerX, centerY + 9);
      ctx.font = '7px monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText('24/7 AUTONOMOUS', centerX, centerY + 20);

      // Render the 4 Domain Nodes
      NODES.forEach((node) => {
        const nx = node.xRatio * width;
        const ny = node.yRatio * height;
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode?.id === node.id;
        const r = isHovered ? 28 : 24;

        // Outer pulse circle
        ctx.save();
        ctx.translate(nx, ny);
        ctx.rotate(t * 0.5);
        ctx.strokeStyle = node.glowColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Node circle
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#12121D' : '#0a0e1c';
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isSelected ? 20 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isSelected ? node.color : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Node inner dot
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Domain Label
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = isHovered || isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
        ctx.textAlign = 'center';
        ctx.fillText(node.domain, nx, ny + r + 16);

        ctx.font = '8px system-ui';
        ctx.fillStyle = node.color;
        ctx.fillText(`${node.latency} · ${node.uptime}`, nx, ny + r + 27);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [hoveredNode, selectedNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = canvas.width;
    const height = canvas.height;

    // Check hit against nodes
    for (const node of NODES) {
      const nx = node.xRatio * width;
      const ny = node.yRatio * height;
      const dist = Math.hypot(x - nx, y - ny);
      if (dist <= 35) {
        setSelectedNode(node);
        cyberAudio.blip(920, 0.1);
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = canvas.width;
    const height = canvas.height;

    let found = false;
    for (const node of NODES) {
      const nx = node.xRatio * width;
      const ny = node.yRatio * height;
      const dist = Math.hypot(x - nx, y - ny);
      if (dist <= 35) {
        if (hoveredNode !== node.id) {
          cyberAudio.blip(640, 0.05);
        }
        setHoveredNode(node.id);
        found = true;
        break;
      }
    }
    if (!found) setHoveredNode(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Audio Feedback Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-black/60 border border-[#FF168D]/20 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-emerald-300 font-bold">SOVEREIGN NETWORK TOPOLOGY: SYNCHRONIZED</span>
          <span className="text-white/40 hidden sm:inline">· Click any orbital node for live telemetry</span>
        </div>
        <div className="flex items-center gap-2 text-white/50 text-[11px] font-mono">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Central Core: SG16 AI ENGINE</span>
        </div>
      </div>

      {/* Holographic Canvas Box */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#050509] via-[#050509] to-[#020409] border border-[#FF168D]/30 shadow-[0_0_40px_rgba(255,22,141,0.15)] group">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="w-full h-[420px] cursor-pointer block"
        />

        {/* Ambient Corner HUD Markers */}
        <div className="absolute top-3 left-3 font-mono text-[9px] text-[#FF168D]/60 tracking-widest uppercase pointer-events-none">
          SYS.GEO.GRID // 35.0844° N, 106.6504° W (NEW MEXICO HQ)
        </div>
        <div className="absolute top-3 right-3 font-mono text-[9px] text-amber-400/60 tracking-widest uppercase pointer-events-none">
          AUTONOMOUS DISPATCH: ACTIVE (24/7/365)
        </div>
        <div className="absolute bottom-3 left-3 font-mono text-[9px] text-emerald-400/60 tracking-widest uppercase pointer-events-none">
          ZERO-TRUST ENCLAVE: ENFORCED
        </div>
        <div className="absolute bottom-3 right-3 font-mono text-[9px] text-cyan-400/60 tracking-widest uppercase pointer-events-none">
          SG16 AI ENGINE v4.2.0-SOVEREIGN
        </div>
      </div>

      {/* Interactive Selected Node Inspector */}
      {selectedNode && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c1224] to-[#07070D] border border-white/10 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: `${selectedNode.color}20`, border: `1px solid ${selectedNode.color}50`, color: selectedNode.color }}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-white text-base">{selectedNode.name}</h4>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${selectedNode.color}20`, color: selectedNode.color, border: `1px solid ${selectedNode.color}40` }}
                  >
                    {selectedNode.role}
                  </span>
                </div>
                <p className="text-xs text-white/50 font-mono mt-0.5">{selectedNode.domain}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://${selectedNode.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>Visit Domain</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <p className="text-xs text-white/70 leading-relaxed">{selectedNode.description}</p>

          {/* Vitals Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-white/40 text-[10px] uppercase font-mono">Edge Latency</span>
              <div className="text-emerald-400 font-mono font-bold text-sm flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>{selectedNode.latency} (Sub-Second)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-white/40 text-[10px] uppercase font-mono">Telemetry Uptime</span>
              <div className="text-cyan-400 font-mono font-bold text-sm flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>{selectedNode.uptime} Continuous</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-white/40 text-[10px] uppercase font-mono">Cryptographic Cipher</span>
              <div className="text-purple-400 font-mono font-bold text-xs flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span className="truncate">{selectedNode.cipher}</span>
              </div>
            </div>
          </div>

          {/* Core Feature Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-white/40 text-[11px] font-semibold">Autonomous Features:</span>
            {selectedNode.features.map((feat) => (
              <span
                key={feat}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 text-[11px] flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{feat}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
