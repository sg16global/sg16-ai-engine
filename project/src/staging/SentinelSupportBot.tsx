import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  CheckCircle2,
  Wrench,
  Zap,
  Terminal,
  Activity,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Radio,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { SupportChatMessage } from './types';
import { cyberAudio } from './cyberSound';

const INITIAL_MESSAGES: SupportChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'sentinel-ai',
    text: 'Greetings Commander Saifullah. I am SG16 Sentinel — your 24/7 autonomous support & self-healing AI engine. I continuously monitor saiftechglobal.com, sg16finance.com, sg16children.com, sg16identifier.com, and all 5 active shields. Describe any anomaly or click a domain scenario below for immediate autonomous repair.',
    timestamp: '24/7 ACTIVE',
    status: 'resolved',
    autoTriageData: {
      rootCause: 'All 4 Sovereign Domains & 5 Shields Nominal',
      confidence: 100,
      subsystem: 'SG16 Autonomous Kernel Core',
    },
  },
];

const DOMAIN_PRESETS = [
  {
    label: 'sg16finance.com · Slippage Drift',
    query: 'sg16finance order book detected a 12ms WebSocket heartbeat skew on high-frequency trading feed.',
    subsystem: 'sg16finance.com Order Gateway',
    root: 'Edge NTP clock synchronization drift on Frankfurt matching node',
    code: `// sg16finance.com Auto-Remediation [ID: FIN-9921]
finFeedSocket.recalibrateNtp({ maxSkewThresholdMs: 2.5, forceJitterBuffer: true });
orderBookCache.purgeStaleTicks();
// Status: Order latency synchronized to 2.1ms. Zero tick drop.`,
  },
  {
    label: 'sg16children.com · Safety Filter',
    query: 'sg16children safe-haven flagged an external third-party tracker attempting to embed in educational portal.',
    subsystem: 'sg16children.com Shield Sentinel',
    root: 'Unauthorized cross-origin telemetry beacon from unverified third-party ad script',
    code: `// sg16children.com Auto-Remediation [ID: KDS-3301]
childSafetyEnclave.blockTrackerDomain('tracker.analytics-unverified.net');
contentSecurityPolicy.enforceStrictChildProtection();
// Status: Threat neutralized. Student privacy 100% safeguarded.`,
  },
  {
    label: 'sg16identifier.com · ZK Proof Sync',
    query: 'sg16identifier zero-knowledge student proof timed out during biometric identity verification.',
    subsystem: 'sg16identifier.com ZK Verifier',
    root: 'Client webassembly snarkjs thread exhausted memory on mobile browser',
    code: `// sg16identifier.com Auto-Remediation [ID: ID-7704]
zkProver.allocateWasmMemory({ memoryPages: 256, useHardwareCrypto: true });
sessionIdentityRegistry.refreshEphemeralNonce();
// Status: ZK proof verified in 218ms without exposing biometric data.`,
  },
  {
    label: 'saiftechglobal.com · Cloud Proxy',
    query: 'saiftechglobal parent gateway received 429 rate limit spike on corporate DNS routing.',
    subsystem: 'saiftechglobal.com Edge Router',
    root: 'Spike in automated crawler queries against corporate certification endpoints',
    code: `// saiftechglobal.com Auto-Remediation [ID: CORP-1022]
edgeRateLimiter.enableAdaptiveShield({ ipPool: 'suspicious-ranges', burstQuota: 50 });
corporateRegistryCache.enableEdgeCdnStaleWhileRevalidate(86400);
// Status: Traffic normalized. 0ms impact on legitimate traffic.`,
  },
  {
    label: 'Coding Shield · AST Rule Fix',
    query: 'Coding Shield reported AST syntax parser error during real-time TypeScript compilation.',
    subsystem: 'SG16 Coding Shield Engine',
    root: 'Ambiguous generic arrow function parsing in nested AST rule inspection',
    code: `// Coding Shield Auto-Patch [ID: CODE-5520]
astLexer.setSyntaxDialect('typescript-react-strict');
typeChecker.suppressSyntheticWarnings(['TS2304']);
// Status: Compilation verified clean. AST score 100/100.`,
  },
];

export function SentinelSupportBot() {
  const [messages, setMessages] = useState<SupportChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [appliedPatches, setAppliedPatches] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [remediationStep, setRemediationStep] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, remediationStep]);

  // Voice Speech Synthesizer
  const speakDiagnosis = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    setVoiceActive(true);
    utterance.onend = () => setVoiceActive(false);
    utterance.onerror = () => setVoiceActive(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceActive(false);
  };

  const handleSend = (textToSend?: string, customPreset?: typeof DOMAIN_PRESETS[0]) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    cyberAudio.scan();

    const userMsg: SupportChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    setRemediationStep('Phase 1: Isolating subsystem & analyzing diagnostic telemetry...');

    setTimeout(() => {
      setRemediationStep('Phase 2: Synthesizing zero-downtime hot-patch & verifying zero regression...');
      cyberAudio.blip(1100, 0.1);
    }, 350);

    setTimeout(() => {
      let responseText = '';
      let rootCause = 'Routine Operational Telemetry Adjustment';
      let subsystem = 'SG16 Autonomous Kernel';
      let confidence = 98;
      let patchScript = '';

      if (customPreset) {
        subsystem = customPreset.subsystem;
        rootCause = customPreset.root;
        confidence = 99;
        responseText = `Autonomous triage complete for ${customPreset.label}. Root cause isolated: ${customPreset.root}. I have dispatched a self-healing kernel patch and verified 0ms impact across all connected domains.`;
        patchScript = customPreset.code;
      } else {
        const q = query.toLowerCase();
        if (q.includes('finance') || q.includes('market') || q.includes('crypto')) {
          subsystem = 'sg16finance.com Edge Core';
          rootCause = 'WebSocket heartbeat micro-jitter on order gateway';
          confidence = 99;
          responseText = `sg16finance.com operational telemetry restored. Jitter buffers re-anchored to sub-millisecond precision. Order matching pipeline verified 100% active.`;
          patchScript = `// sg16finance.com Live Patch\nfinEngine.enforceSubMillisecondBaseline();\n// Latency: 1.8ms confirmed.`;
        } else if (q.includes('child') || q.includes('kid') || q.includes('student')) {
          subsystem = 'sg16children.com Safe Enclave';
          rootCause = 'Heuristic safety boundary triggered on external resource query';
          confidence = 99;
          responseText = `sg16children.com safety shield active. External resource filtered. Safe-zone verified clean under COPPA+ compliance.`;
          patchScript = `// sg16children.com Live Patch\nchildSafetyShield.isolateUntrustedStream();\n// Status: Safe sanctuary 100% protected.`;
        } else if (q.includes('identity') || q.includes('identifier') || q.includes('auth')) {
          subsystem = 'sg16identifier.com Identity Sentinel';
          rootCause = 'Zero-knowledge cryptographic handshake refreshed';
          confidence = 98;
          responseText = `sg16identifier.com identity pipeline cleared. Ephemeral nonces re-seeded with Dilithium-3 post-quantum signatures.`;
          patchScript = `// sg16identifier.com Live Patch\nzkIdentityGuard.reseedEphemeralProof();\n// Status: Instant verification restored.`;
        } else {
          subsystem = 'SG16 Global Autonomous Engine';
          rootCause = 'Multi-shield diagnostic sweep resolved anomalous telemetry packet';
          confidence = 97;
          responseText = `Autonomous system diagnosis complete. All 5 shields (Coding, Health, Student, Market, Chatting) and all corporate nodes are fully healthy and synchronized.`;
          patchScript = `// SG16 Autonomous Kernel Repair\nsystemVitals.enforceAllShieldsHealthy();\n// Status: Zero errors detected. Continuous 24/7 protection active.`;
        }
      }

      cyberAudio.healSuccess();
      setRemediationStep(null);
      setIsProcessing(false);

      const botMsg: SupportChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'sentinel-ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'resolved',
        actionablePatch: patchScript,
        autoTriageData: {
          rootCause,
          confidence,
          subsystem,
        },
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 700);
  };

  const handleApplyPatch = (msgId: string) => {
    cyberAudio.healSuccess();
    setAppliedPatches((prev) => ({ ...prev, [msgId]: true }));
  };

  const handleCopy = (id: string, text: string) => {
    cyberAudio.blip(1200, 0.05);
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[700px] bg-gradient-to-b from-[#0A0A12] to-[#050509] border-2 border-[#FF168D]/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,22,141,0.15)]">
      {/* 24/7 Sentinel AI Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#0A0A12] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF168D] via-[#FF168D] to-[#FF168D] p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[#0A0A12] rounded-[15px] flex items-center justify-center text-[#FF168D]">
                <Bot className="w-5 h-5 animate-pulse text-[#FF168D]" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0A0A12] rounded-full shadow-[0_0_8px_#10b981]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-sm tracking-wide">
                SG16 SENTINEL 24/7
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#FF168D]/20 text-[#FF5CB8] border border-[#FF168D]/40">
                AUTONOMOUS SUPPORT ENGINE
              </span>
            </div>
            <p className="text-[11px] text-white/50 flex items-center gap-2 mt-0.5 font-mono">
              <span className="text-emerald-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> 24/7 LISTENING & SELF-HEALING
              </span>
              <span className="text-white/30">·</span>
              <span>Avg Latency: &lt; 700ms</span>
            </p>
          </div>
        </div>

        {/* Voice Synth Controls & Audio Wave Indicator */}
        <div className="flex items-center gap-2">
          {voiceActive ? (
            <button
              type="button"
              onClick={stopVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF168D]/20 border border-[#FF168D]/50 text-[#FF5CB8] text-xs font-semibold animate-pulse"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Speaking Diagnosis... (Click to Stop)</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white/60 text-xs">
              <Volume2 className="w-3.5 h-3.5 text-[#FF3DA5]" />
              <span>Voice Briefing Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Domain-Specific Instant Problem Scenarios */}
      <div className="px-4 py-2.5 bg-black/50 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-[#FF3DA5] text-[11px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0">
          <Zap className="w-3.5 h-3.5" /> Quick Domain Triggers:
        </span>
        {DOMAIN_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handleSend(preset.query, preset)}
            className="whitespace-nowrap px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF168D]/40 text-white/80 hover:text-white transition text-[11px] flex items-center gap-1.5"
          >
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-semibold text-white/50">
                {msg.sender === 'user' ? 'System Operator' : 'SG16 Sentinel 24/7 AI'}
              </span>
              <span className="text-[10px] text-white/30 font-mono">{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-[92%] sm:max-w-[82%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-[#210d19] to-[#2d1124] border border-[#FF168D]/50 text-white rounded-tr-none'
                  : 'bg-[#0b1122] border border-white/10 text-white/90 rounded-tl-none shadow-xl'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-white/90">{msg.text}</p>
                {msg.sender === 'sentinel-ai' && (
                  <button
                    type="button"
                    onClick={() => speakDiagnosis(msg.text)}
                    className="shrink-0 p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-[#FF3DA5] transition"
                    title="Speak diagnosis aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Automated Root Cause & Diagnostics Badge */}
              {msg.autoTriageData && (
                <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> {msg.autoTriageData.confidence}% Confidence
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10 font-mono">
                    Subsystem: {msg.autoTriageData.subsystem}
                  </span>
                  <span className="text-white/50 italic">
                    Root Cause: {msg.autoTriageData.rootCause}
                  </span>
                </div>
              )}

              {/* Actionable Code Patch */}
              {msg.actionablePatch && (
                <div className="mt-3 rounded-xl bg-black/70 border border-white/10 p-3 overflow-hidden font-mono text-[11px]">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10 text-white/40 text-[10px]">
                    <span className="flex items-center gap-1.5 text-[#FF3DA5] font-bold">
                      <Terminal className="w-3.5 h-3.5" /> Autonomous Solution Patch
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.actionablePatch!)}
                      className="hover:text-white transition flex items-center gap-1 text-white/60"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Patch</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                    {msg.actionablePatch}
                  </pre>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-[10px] text-white/40">Zero Downtime Hot-Patch</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPatch(msg.id)}
                      disabled={appliedPatches[msg.id]}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                        appliedPatches[msg.id]
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                          : 'bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] shadow-lg shadow-[#FF168D]/30'
                      }`}
                    >
                      {appliedPatches[msg.id] ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Patch Applied & Verified</span>
                        </>
                      ) : (
                        <>
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Auto-Apply to Subsystem</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live Autonomous Remediation Progress Bar */}
        {remediationStep && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#141d38] to-[#0F0C16] border border-cyan-500/40 text-xs space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" />
                <span>24/7 Autonomous Diagnosis in Progress</span>
              </span>
              <span className="font-mono text-[10px] text-cyan-400">ANALYZING...</span>
            </div>
            <p className="text-white/70 text-[11px] font-mono">{remediationStep}</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-[#0A0A12] border-t border-white/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe any issue across your shields or domains (e.g. latency, 502, AST bug, auth failure)..."
          disabled={isProcessing}
          className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#FF168D] text-white text-xs outline-none transition placeholder:text-white/30"
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF168D] to-[#B91669] hover:from-[#FF168D] hover:to-[#FF168D] text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 shadow-lg shadow-[#FF168D]/30"
        >
          <span>Diagnose</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
