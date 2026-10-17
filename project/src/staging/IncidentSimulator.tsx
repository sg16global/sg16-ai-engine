import { useState } from 'react';
import { Play, ShieldCheck, CheckCircle2, RefreshCw, Activity, Zap } from 'lucide-react';
import { cyberAudio } from './cyberSound';

interface SimulationStep {
  step: number;
  label: string;
  ms: number;
  status: 'pending' | 'active' | 'completed';
}

const INCIDENT_PRESETS = [
  {
    title: 'sg16finance.com · Flash Spike Circuit Breaker',
    tag: 'FIN-GATEWAY',
    desc: 'Simulate high-frequency synthetic price anomaly triggering autonomous microsecond trading halt and liquidity rebalance.',
  },
  {
    title: 'sg16children.com · Infiltration Vector Blocker',
    tag: 'CHILD-SHIELD',
    desc: 'Simulate malformed data packet attempting to bypass student age-gate and trigger instant zero-knowledge quarantine.',
  },
  {
    title: 'sg16identifier.com · Sybil Attack Neutralizer',
    tag: 'ZK-IDENTITY',
    desc: 'Simulate 10,000 synthetic credential registration probes defused in 340ms with zero biometric leakage.',
  },
  {
    title: 'saiftechglobal.com · Cloud Proxy DDoS Mitigation',
    tag: 'CORP-ROUTER',
    desc: 'Simulate 80 Gbps multi-vector layer-7 floods absorbed through autonomous BGP edge rerouting.',
  },
  {
    title: 'Coding Shield · AST Memory Leak Hot-Patch',
    tag: 'CODE-SENTINEL',
    desc: 'Simulate recursive AST tree traversal leak isolated and patched dynamically with zero process restart.',
  },
];

export function IncidentSimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  const runSimulation = (scenarioName: string, _description: string) => {
    cyberAudio.scan();
    setIsRunning(true);
    setActiveScenario(scenarioName);
    setSummary(null);

    const initialSteps: SimulationStep[] = [
      { step: 1, label: `Incident Ingestion: "${scenarioName}" detected`, ms: 38, status: 'active' },
      { step: 2, label: 'Subsystem Isolation & Heuristic Diagnostic Triage', ms: 140, status: 'pending' },
      { step: 3, label: 'Autonomous AI Patch Formulation & Zero-Regression Verification', ms: 320, status: 'pending' },
      { step: 4, label: 'Dynamic Kernel Hot-Patch Deployment (Zero Downtime)', ms: 510, status: 'pending' },
      { step: 5, label: 'Baseline Telemetry Restored (100% Operational Health)', ms: 720, status: 'pending' },
    ];
    setSteps(initialSteps);

    setTimeout(() => {
      cyberAudio.blip(600, 0.05);
      setSteps((s) => s.map((item, idx) => (idx === 0 ? { ...item, status: 'completed' } : idx === 1 ? { ...item, status: 'active' } : item)));
    }, 110);

    setTimeout(() => {
      cyberAudio.blip(750, 0.05);
      setSteps((s) => s.map((item, idx) => (idx <= 1 ? { ...item, status: 'completed' } : idx === 2 ? { ...item, status: 'active' } : item)));
    }, 260);

    setTimeout(() => {
      cyberAudio.blip(920, 0.06);
      setSteps((s) => s.map((item, idx) => (idx <= 2 ? { ...item, status: 'completed' } : idx === 3 ? { ...item, status: 'active' } : item)));
    }, 450);

    setTimeout(() => {
      cyberAudio.blip(1100, 0.06);
      setSteps((s) => s.map((item, idx) => (idx <= 3 ? { ...item, status: 'completed' } : idx === 4 ? { ...item, status: 'active' } : item)));
    }, 620);

    setTimeout(() => {
      cyberAudio.healSuccess();
      setSteps((s) => s.map((item) => ({ ...item, status: 'completed' })));
      setIsRunning(false);
      setSummary(`Autonomous resolution completed in 720ms. Subsystem restored to baseline with zero packet loss or downtime.`);
    }, 780);
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0A0A12] to-[#050509] border-2 border-[#FF168D]/30 shadow-2xl text-white space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h4 className="text-base font-extrabold tracking-wide flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>24/7 AUTONOMOUS INCIDENT RESOLUTION LAB</span>
          </h4>
          <p className="text-xs text-white/50 mt-0.5">
            Simulate high-severity failures across your 4 corporate domains and watch the SG16 AI Engine isolate and repair them in &lt; 800ms.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          <Activity className="w-3.5 h-3.5" />
          <span>SLA Target: &lt; 800ms Auto-Remediation</span>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {INCIDENT_PRESETS.map((scenario) => (
          <button
            key={scenario.tag}
            type="button"
            disabled={isRunning}
            onClick={() => runSimulation(scenario.title, scenario.desc)}
            className="p-4 rounded-2xl bg-black/50 hover:bg-black/75 border border-white/10 hover:border-[#FF168D]/50 text-left transition disabled:opacity-50 group space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF168D]/20 text-[#FF5CB8] border border-[#FF168D]/30">
                  {scenario.tag}
                </span>
                <Play className="w-3.5 h-3.5 text-white/40 group-hover:text-[#FF168D] transition" />
              </div>
              <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                {scenario.title}
              </h5>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                {scenario.desc}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <Zap className="w-3 h-3" />
              <span>Simulate Incident Triage</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active Simulation Timeline */}
      {steps.length > 0 && (
        <div className="p-5 rounded-2xl bg-black/70 border border-white/15 text-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white/60 text-xs pb-3 border-b border-white/10">
            <span className="font-bold text-white flex items-center gap-2">
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#FF168D]" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              Active Scenario: {activeScenario}
            </span>
            <span className="font-mono text-emerald-400 text-[11px]">
              {isRunning ? 'AUTONOMOUS REPAIR ENGAGED' : 'SYSTEM HEALTH: 100%'}
            </span>
          </div>

          <div className="space-y-3 font-mono">
            {steps.map((st) => (
              <div key={st.step} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  {st.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {st.status === 'active' && <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />}
                  {st.status === 'pending' && <span className="w-4 h-4 rounded-full border border-white/20 inline-block" />}
                  <span
                    className={
                      st.status === 'completed'
                        ? 'text-white font-medium'
                        : st.status === 'active'
                        ? 'text-amber-300 font-bold'
                        : 'text-white/40'
                    }
                  >
                    {st.label}
                  </span>
                </div>
                <span className="text-[11px] text-white/40">{st.ms}ms</span>
              </div>
            ))}
          </div>

          {summary && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{summary}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
