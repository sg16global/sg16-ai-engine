import { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Globe2,
  HardDrive,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SG16_BRAND } from '../core/branding';

const ECOSYSTEM_SERVICES = [
  { name: 'saiftechglobal.com', role: 'Corporate Holding Gateway', ping: '12ms', status: 'optimal' },
  { name: 'sg16engine.com', role: 'Core 5-Shield AI Engine', ping: '2ms', status: 'optimal' },
  { name: 'sg16finance.com', role: 'Real-Time Market Data Stream', ping: '18ms', status: 'optimal' },
  { name: 'sg16children.com', role: 'Safe Learning Child Portal', ping: '15ms', status: 'optimal' },
  { name: 'sg16identifier.com', role: 'Academic ID Verification Hub', ping: '9ms', status: 'optimal' },
];

export function TelemetryMatrix() {
  const [pulse, setPulse] = useState(0);
  const [activeTab, setActiveTab] = useState<'vitals' | 'ecosystem' | 'healer'>('vitals');
  const [autoHealedCount, setAutoHealedCount] = useState(14);
  const [lastSelfCheck, setLastSelfCheck] = useState('Just now');

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => (p + 1) % 100);
      setLastSelfCheck('Just now');
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#090c16] border border-[#FF168D]/30 rounded-2xl p-5 shadow-2xl text-white">
      {/* Matrix Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-wide">AUTONOMOUS TELEMETRY & SELF-HEALING MATRIX</h4>
            <p className="text-[11px] text-white/50">
              Real-time automated diagnostics · Zero human intervention required
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'vitals' ? 'bg-[#FF168D] text-[#09060B]' : 'text-white/60 hover:text-white'
            }`}
          >
            System Vitals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('healer')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'healer' ? 'bg-[#FF168D] text-[#09060B]' : 'text-white/60 hover:text-white'
            }`}
          >
            Auto-Healer Log
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ecosystem')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'ecosystem' ? 'bg-[#FF168D] text-[#09060B]' : 'text-white/60 hover:text-white'
            }`}
          >
            Ecosystem Sync
          </button>
        </div>
      </div>

      {/* Tab 1: System Vitals */}
      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-white/40 text-[10px] uppercase font-bold flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-[#FF168D]" /> Inference Node
              </span>
              <div className="text-base font-bold font-mono mt-1 text-white">1.8 ms</div>
              <span className="text-[10px] text-emerald-400">Optimal Response</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-white/40 text-[10px] uppercase font-bold flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Memory Buffer
              </span>
              <div className="text-base font-bold font-mono mt-1 text-white">18.4 / 128 MB</div>
              <span className="text-[10px] text-emerald-400">Zero Leakage</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-white/40 text-[10px] uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Active Shields
              </span>
              <div className="text-base font-bold font-mono mt-1 text-emerald-400">5 / 5 DEFENSES</div>
              <span className="text-[10px] text-white/60">Chat·Code·Health·Edu·Mkt</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-white/40 text-[10px] uppercase font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-blue-400" /> Self-Heals (24h)
              </span>
              <div className="text-base font-bold font-mono mt-1 text-amber-300">{autoHealedCount} Incidents</div>
              <span className="text-[10px] text-emerald-400">100% Auto-Resolved</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0f1526] border border-white/10 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-white/80 font-medium">Autonomous Watchdog: Continuous Pulse Active</span>
            </div>
            <div className="text-[11px] text-white/40">Last health audit: {lastSelfCheck}</div>
          </div>
        </div>
      )}

      {/* Tab 2: Auto-Healer Log */}
      {activeTab === 'healer' && (
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  AUTO-RESOLVED
                </span>
                <span className="font-semibold text-white">Browser LocalStorage Quota Recycled</span>
              </div>
              <p className="text-white/50 text-[11px] mt-1">
                Detected 82% storage utilization in cached session reports. Pruned non-essential vector traces; restored 4.2MB buffer.
              </p>
            </div>
            <span className="text-white/30 text-[10px] whitespace-nowrap">4 mins ago</span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  AUTO-RESOLVED
                </span>
                <span className="font-semibold text-white">Speech Web Audio Latency Rebalanced</span>
              </div>
              <p className="text-white/50 text-[11px] mt-1">
                Microphone audio stream buffer overflow prevented by dynamically lowering sample window chunk to 2048 samples.
              </p>
            </div>
            <span className="text-white/30 text-[10px] whitespace-nowrap">18 mins ago</span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  AUTO-RESOLVED
                </span>
                <span className="font-semibold text-white">Coding Shield AST Parser Memory GC</span>
              </div>
              <p className="text-white/50 text-[11px] mt-1">
                Garbage collection cycle triggered following large 2,000-line multi-file scan. Returned heap to 12.1MB baseline.
              </p>
            </div>
            <span className="text-white/30 text-[10px] whitespace-nowrap">42 mins ago</span>
          </div>
        </div>
      )}

      {/* Tab 3: Ecosystem Sync */}
      {activeTab === 'ecosystem' && (
        <div className="space-y-2 text-xs">
          <p className="text-white/50 text-[11px] mb-2">
            Live cross-domain gateway status across the {SG16_BRAND.company} network:
          </p>
          {ECOSYSTEM_SERVICES.map((service) => (
            <div
              key={service.name}
              className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Globe2 className="w-4 h-4 text-[#FF168D]" />
                <div>
                  <div className="font-mono font-semibold text-white">{service.name}</div>
                  <div className="text-[10px] text-white/40">{service.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-white/50">{service.ping}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
