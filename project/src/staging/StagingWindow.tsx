import { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Activity,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
  Code2,
  TrendingUp,
  GraduationCap,
  HeartPulse,
  MessageSquare,
  Building2,
  Lock,
  Zap,
  Maximize2,
  Minimize2,
  RotateCcw,
  Volume2,
  VolumeX,
  FileCheck2,
  Award,
  Globe2,
  Radio,
  Clock,
} from 'lucide-react';
import { SentinelSupportBot } from './SentinelSupportBot';
import { TelemetryMatrix } from './TelemetryMatrix';
import { IncidentSimulator } from './IncidentSimulator';
import { EcosystemTopologyCanvas } from './EcosystemTopologyCanvas';
import { SovereignLicenseVault } from './SovereignLicenseVault';
import { SG16_BRAND } from '../core/branding';
import { cyberAudio } from './cyberSound';

interface StagingWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StagingWindow({ isOpen, onClose }: StagingWindowProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'support' | 'topology' | 'vault' | 'telemetry' | 'simulator'
  >('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    cyberAudio.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTabChange = (
    tab: 'overview' | 'support' | 'topology' | 'vault' | 'telemetry' | 'simulator'
  ) => {
    cyberAudio.blip(900, 0.08);
    setActiveTab(tab);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-[#030611] text-white overflow-hidden animate-in fade-in duration-200 ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      {/* Background Holographic Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 z-0"
        style={{
          backgroundImage: `radial-gradient(rgba(255,22,141, 0.15) 1px, transparent 1px), radial-gradient(rgba(234, 179, 8, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px, 80px 80px',
        }}
      />

      {/* Top Cyber Command Header */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#08080F]/95 border-b border-[#FF168D]/30 backdrop-blur-xl shadow-[0_4px_30px_rgba(255,22,141,0.2)] select-none">
        {/* Brand & Staging Tag */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF168D] via-[#FF168D] to-[#B91669] p-[1.5px] flex items-center justify-center">
              <div className="w-full h-full bg-[#040713] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#FF168D] animate-pulse" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF3DA5] rounded-full border-2 border-[#08080F] animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-1.5 font-mono">
                <span>SG16 AI ENGINE</span>
                <span className="text-[#FF168D]">///</span>
                <span className="text-[#FF5CB8]">SOVEREIGN LAB</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#FF168D]/20 text-[#FF5CB8] border border-[#FF168D]/40 tracking-widest uppercase">
                STAGING ENVIRONMENT
              </span>
            </div>
            <p className="text-[11px] text-white/50 flex items-center gap-2 mt-0.5 font-mono">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" /> LIVE PROJECT UNTOUCHED
              </span>
              <span className="text-white/20">|</span>
              <span className="flex items-center gap-1 text-white/40">
                <Clock className="w-3 h-3" /> {currentTime || 'UTC SYNCHRONIZED'}
              </span>
              <span className="text-white/20 hidden md:inline">|</span>
              <span className="text-[#FF3DA5]/80 hidden md:inline">Saif Tech Global LLC (Entity #0007946146)</span>
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center bg-black/70 p-1.5 rounded-2xl border border-white/10 text-xs overflow-x-auto shadow-inner">
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-semibold ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-[#FF168D] to-[#B91669] text-white shadow-[0_0_16px_rgba(255,22,141,0.5)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#FF5CB8]" />
            <span>King Architecture</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('support')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-semibold ${
              activeTab === 'support'
                ? 'bg-gradient-to-r from-[#FF168D] to-[#B91669] text-white shadow-[0_0_16px_rgba(255,22,141,0.5)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#FF3DA5] animate-pulse" />
            <span>24/7 AI Support</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('topology')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-semibold ${
              activeTab === 'topology'
                ? 'bg-gradient-to-r from-[#FF168D] to-[#B91669] text-white shadow-[0_0_16px_rgba(255,22,141,0.5)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Domain Topology (4 Nodes)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('vault')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-semibold ${
              activeTab === 'vault'
                ? 'bg-gradient-to-r from-[#FF168D] to-[#B91669] text-white shadow-[0_0_16px_rgba(255,22,141,0.5)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#FF5CB8]" />
            <span>License & Seal Vault</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('telemetry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-semibold ${
              activeTab === 'telemetry'
                ? 'bg-gradient-to-r from-[#FF168D] to-[#B91669] text-white shadow-[0_0_16px_rgba(255,22,141,0.5)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telemetry</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-semibold ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-[#FF168D] to-[#B91669] text-white shadow-[0_0_16px_rgba(255,22,141,0.5)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Incident Sandbox</span>
          </button>
        </div>

        {/* Right HUD Controls */}
        <div className="flex items-center gap-2">
          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) cyberAudio.blip(800, 0.1);
            }}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-[#FF168D]/10 border-[#FF168D]/30 text-[#FF5CB8]'
                : 'bg-white/5 border-white/10 text-white/40'
            }`}
            title={soundEnabled ? 'Mute Cyber Audio FX' : 'Enable Cyber Audio FX'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => {
              cyberAudio.blip(1000, 0.05);
              setIsFullscreen(!isFullscreen);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition"
            title="Toggle Command Deck Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Button */}
          <button
            type="button"
            onClick={() => {
              cyberAudio.blip(600, 0.05);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-[#FF168D]/30 hover:to-[#B91669]/30 border border-white/15 text-white text-xs font-bold transition shadow-lg"
          >
            <X className="w-4 h-4 text-[#FF168D]" />
            <span className="hidden sm:inline">Exit Staging</span>
          </button>
        </div>
      </header>

      {/* Main Command Deck Canvas Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TAB 1: KING ARCHITECTURE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Holographic Master Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F0C16] via-[#0A0A12] to-[#050509] border-2 border-[#FF168D]/40 p-6 sm:p-10 shadow-[0_0_60px_rgba(255,22,141,0.2)]">
              {/* Glowing Cyber Accents */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#FF168D]/20 to-[#FF168D]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="max-w-3xl space-y-5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF168D]/20 to-[#FF168D]/20 border border-[#FF168D]/40 text-xs font-mono text-[#FF5CB8]">
                    <Sparkles className="w-4 h-4 text-[#FF3DA5]" />
                    <span>SOVEREIGN ARCHITECTURE SPECIFICATION · 2026 HIGH-LEVEL DESIGN</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight uppercase font-sans">
                    SG16 AI ENGINE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF168D] via-[#FF3DA5] to-[#FF3DA5]">///</span> 24/7 AUTONOMOUS REPAIR
                  </h1>

                  <p className="text-sm sm:text-base text-white/80 leading-relaxed font-sans">
                    A zero-downtime, self-healing sovereign AI architecture engineered for enterprise supremacy. Backed by <strong className="text-white">Saif Tech Global LLC</strong> (New Mexico Entity #0007946146), this high-level design continuously detects, isolates, and synthesizes hot-patches across <strong className="text-[#FF5CB8]">sg16finance.com</strong>, <strong className="text-cyan-300">sg16children.com</strong>, <strong className="text-emerald-300">sg16identifier.com</strong>, and all 5 Core Shields.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
                    <div className="px-3.5 py-2 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 shadow-inner">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>24/7 AUTONOMOUS ENGINE: ACTIVE</span>
                    </div>

                    <div className="px-3.5 py-2 rounded-xl bg-black/60 border border-[#FF168D]/40 text-[#FF5CB8] flex items-center gap-2 shadow-inner">
                      <Award className="w-4 h-4 text-[#FF3DA5]" />
                      <span>STATE SEAL: CERTIFIED #0007946146</span>
                    </div>

                    <div className="px-3.5 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 flex items-center gap-2 shadow-inner">
                      <Globe2 className="w-4 h-4 text-cyan-400" />
                      <span>4 DOMAINS LINKED</span>
                    </div>
                  </div>
                </div>

                {/* Right Tactical Telemetry Pod */}
                <div className="flex flex-col gap-4 min-w-[280px] bg-black/70 p-6 rounded-3xl border border-white/15 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-mono text-white/60 uppercase">Sentinel Engine</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                      AUTONOMOUS
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-white/50">Triage Speed:</span>
                      <span className="text-emerald-400 font-bold">&lt; 450ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Uptime Guarantee:</span>
                      <span className="text-white font-bold">100.00%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Jurisdiction:</span>
                      <span className="text-[#FF5CB8] font-bold">New Mexico, USA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Live Project State:</span>
                      <span className="text-emerald-400 font-bold">Untouched</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTabChange('support')}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF168D] via-[#B91669] to-[#FF168D] hover:from-[#FF168D] hover:to-[#FF168D] text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,22,141,0.4)]"
                  >
                    <span>Launch 24/7 AI Sentinel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 5-Shield Supreme Architecture Visualizer */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white tracking-wider flex items-center gap-2 font-mono uppercase">
                  <ShieldCheck className="w-6 h-6 text-[#FF168D]" />
                  <span>5-SHIELD NEXT-GEN MODULAR SPECIFICATION</span>
                </h3>
                <span className="text-xs text-white/40 font-mono">Autonomous Self-Healing Tethered</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Shield 1 */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0F0C16] to-[#07070D] border border-blue-500/30 hover:border-blue-400 transition group space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-black bg-blue-500/20 text-blue-300 font-mono">
                      SHIELD 01
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-blue-300 transition">
                      SG16 AI Chatting Shield
                    </h4>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      Zero-leak privacy enclave, real-time audio neural synthesis, multi-format technical document parser, and automated contextual retrieval.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 bg-black/50 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                    <span>Self-Healing Daemon:</span>
                    <span className="font-bold">ACTIVE (0ms LEAK)</span>
                  </div>
                </div>

                {/* Shield 2 */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0F0C16] to-[#07070D] border border-purple-500/30 hover:border-purple-400 transition group space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-black bg-purple-500/20 text-purple-300 font-mono">
                      SHIELD 02
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-purple-300 transition">
                      SG16 Coding Shield
                    </h4>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      High-throughput AST syntax validator, Semgrep security rule scanner, and automated vulnerability hot-patch synthesizer.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-purple-300 bg-black/50 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                    <span>AST Hot-Patching:</span>
                    <span className="font-bold">ENABLED</span>
                  </div>
                </div>

                {/* Shield 3 */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0F0C16] to-[#07070D] border border-[#FF168D]/30 hover:border-[#FF3DA5] transition group space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#FF168D]/10 border border-[#FF168D]/30 flex items-center justify-center text-[#FF3DA5]">
                      <HeartPulse className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-black bg-[#FF168D]/20 text-[#FF5CB8] font-mono">
                      SHIELD 03
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-[#FF5CB8] transition">
                      SG16 Health & Medical Shield
                    </h4>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      Clinical symptom verification, prescription drug cross-interaction validator, and HIPAA-grade biometric confidentiality vault.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-[#FF5CB8] bg-black/50 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                    <span>Biometric Enclave:</span>
                    <span className="font-bold">ENCRYPTED</span>
                  </div>
                </div>

                {/* Shield 4 */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0F0C16] to-[#07070D] border border-emerald-500/30 hover:border-emerald-400 transition group space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 font-mono">
                      SHIELD 04
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-emerald-300 transition">
                      SG16 Student & Children Shield
                    </h4>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      Tethered directly to <span className="text-emerald-400 font-mono">sg16children.com</span> and <span className="text-emerald-400 font-mono">sg16identifier.com</span> for academic credentials and predatory filter protection.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 bg-black/50 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                    <span>Child Sanctuary:</span>
                    <span className="font-bold">SYNCHRONIZED</span>
                  </div>
                </div>

                {/* Shield 5 */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0F0C16] to-[#07070D] border border-[#FF168D]/30 hover:border-[#FF3DA5] transition group space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#FF168D]/10 border border-[#FF168D]/30 flex items-center justify-center text-[#FF3DA5]">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-black bg-[#FF168D]/20 text-[#FF5CB8] font-mono">
                      SHIELD 05
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-[#FF5CB8] transition">
                      SG16 Market & Finance Shield
                    </h4>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      Tethered to <span className="text-[#FF3DA5] font-mono">sg16finance.com</span> for high-frequency liquidity telemetry, order book health, and sub-millisecond execution.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-[#FF5CB8] bg-black/50 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                    <span>Tick Gateway:</span>
                    <span className="font-bold">2.1ms LATENCY</span>
                  </div>
                </div>

                {/* Core Autonomous Hub */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#190918] via-[#210920] to-[#0c0512] border-2 border-[#FF168D]/50 hover:border-[#FF168D] transition group space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#FF168D]/20 border border-[#FF168D]/40 flex items-center justify-center text-[#FF5CB8]">
                      <Bot className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-black bg-[#FF168D]/20 text-[#FF5CB8] border border-[#FF168D]/40 font-mono">
                      CENTRAL CORE
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-[#FF5CB8] transition">
                      SG16 AI Engine Autonomous Core
                    </h4>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      Always-on self-healing brain providing users with instant root cause discovery and automated code patch synthesis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('support')}
                    className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-[#FF168D] text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>Open 24/7 Support Bot</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Review Disclaimer */}
            <div className="p-6 rounded-3xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Staging Review Protocol</h4>
                <p className="text-xs text-white/60 max-w-2xl">
                  This entire design is showcased in isolation. No changes are applied to your live project until you review, test, and provide your formal approval.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTabChange('topology')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2"
                >
                  <Globe2 className="w-4 h-4 text-cyan-400" />
                  <span>Inspect Domain Topology</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('vault')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF168D] to-[#B91669] hover:from-[#FF3DA5] hover:to-[#FF168D] text-black text-xs font-black uppercase transition flex items-center gap-2 shadow-lg shadow-[#FF168D]/20"
                >
                  <Award className="w-4 h-4" />
                  <span>View Sovereign License</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 24/7 AI-DRIVEN AUTONOMOUS SUPPORT BOT */}
        {activeTab === 'support' && (
          <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in duration-300">
            <SentinelSupportBot />
          </div>
        )}

        {/* TAB 3: SOVEREIGN ECOSYSTEM TOPOLOGY */}
        {activeTab === 'topology' && (
          <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-300">
            <EcosystemTopologyCanvas />
          </div>
        )}

        {/* TAB 4: ROYAL SOVEREIGN LICENSE VAULT */}
        {activeTab === 'vault' && (
          <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-300">
            <SovereignLicenseVault />
          </div>
        )}

        {/* TAB 5: TELEMETRY & HEALING MATRIX */}
        {activeTab === 'telemetry' && (
          <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-300">
            <TelemetryMatrix />
          </div>
        )}

        {/* TAB 6: INCIDENT REMEDIATION SANDBOX */}
        {activeTab === 'simulator' && (
          <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in duration-300">
            <IncidentSimulator />
          </div>
        )}
      </main>

      {/* Cyber Command Deck Footer */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-[#050509] border-t border-white/10 text-xs text-white/60 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-400 font-bold">
              SG16 AI ENGINE KERNEL: ONLINE
            </span>
          </div>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-[11px] text-white/50 hidden md:inline">
            Executive Staging Review Window · Zero Live Regressions
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
          >
            Return to Live App
          </button>
        </div>
      </footer>
    </div>
  );
}
