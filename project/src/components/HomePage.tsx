import { useState, useRef } from 'react';
import { useAppStore } from '../core/appState';
import { detectIntent } from '../core/engine';
import { readImageFile } from '../lib/chatApi';
import { startVoiceCapture, voiceInputAvailable } from '../lib/voiceInput';
import { WorkspaceType } from '../core/types';
import { SG16_BRAND } from '../core/branding';
import { Sg16Logo } from './ui/Sg16Logo';
import { PricingPanel } from './panels/PricingPanel';
import {
  Mic,
  Image as ImageIcon,
  Send,
  Search,
  Calculator,
  Code2,
  Lightbulb,
  BookOpen,
  Calendar,
  MessageSquare,
  GraduationCap,
  CheckCircle2,
  Users,
  Shield,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
} from 'lucide-react';

const popularActions = [
  { label: 'Ask Anything', icon: MessageSquare },
  { label: 'Homework Help', icon: BookOpen },
  { label: 'Score My Project', icon: Code2 },
  { label: 'Health Question', icon: Lightbulb },
  { label: 'Study Plan', icon: Calendar },
  { label: 'Explain Topic', icon: Calculator },
];

const workspaces = [
  {
    id: 'coding',
    title: 'Coding Hub',
    desc: 'Code check, score & fix — built for real projects',
    icon: Code2,
    accent: 'border-[#1e3a5f] hover:border-blue-400/40',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    ring: 'bg-blue-500',
  },
  {
    id: 'student-shield',
    title: 'Student Shield',
    desc: 'Education-safe tutor for students worldwide',
    icon: GraduationCap,
    accent: 'border-[#14352a] hover:border-emerald-400/40',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    ring: 'bg-emerald-500',
  },
  {
    id: 'health',
    title: 'Health Guide',
    desc: 'Wellness questions, report explain & lifestyle tips',
    icon: Lightbulb,
    accent: 'border-[#0f3333] hover:border-teal-400/40',
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-400',
    ring: 'bg-teal-500',
  },
  {
    id: 'general',
    title: SG16_BRAND.chatName,
    desc: 'Worldwide general chat — news, facts, daily questions',
    icon: MessageSquare,
    accent: 'border-[#2a1218] hover:border-[#FF2E2E]/40',
    iconBg: 'bg-[#FF2E2E]/15',
    iconColor: 'text-[#FF8A8A]',
    ring: 'bg-[#FF2E2E]',
  },
];

const whyFeatures = [
  'All-in-One AI Platform',
  'Fast, Smart & Reliable',
  'Privacy-First Design',
  'Works on Any Device',
];

const builtFor = ['Students', 'Developers', 'Creators', 'Professionals', 'Researchers'];

const trusted = ['Advanced AI Security', 'Encrypted Conversations', 'No Data Selling', '99.9% Uptime'];

export const HomePage = () => {
  const setWorkspace = useAppStore((state) => state.setWorkspace);
  const navigateToWorkspace = useAppStore((state) => state.navigateToWorkspace);
  const requireAuth = useAppStore((state) => state.requireAuth);
  const openHelp = useAppStore((state) => state.openHelp);
  const [inputValue, setInputValue] = useState('');
  const [routing, setRouting] = useState(false);
  const [listening, setListening] = useState(false);
  const voiceSessionRef = useRef<ReturnType<typeof startVoiceCapture> | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const runAsk = async (query?: string) => {
    const text = (query ?? inputValue).trim();
    if (!text || routing) return;

    setRouting(true);
    try {
      const result = await detectIntent(text);

      if (result.confidence > 0.65) {
        navigateToWorkspace(result.targetWorkspace, result.cleanedPrompt);
      } else {
        navigateToWorkspace('general', result.cleanedPrompt);
      }

      setInputValue('');
    } finally {
      setRouting(false);
    }
  };

  const handleAsk = (query?: string) => {
    requireAuth(() => {
      void runAsk(query);
    });
  };

  const handleVoiceInput = () => {
    requireAuth(async () => {
      if (!voiceInputAvailable()) {
        useAppStore.getState().setError('Voice input is not supported on this device.');
        return;
      }

      if (listening && voiceSessionRef.current) {
        setListening(false);
        try {
          const transcript = await voiceSessionRef.current.stop();
          voiceSessionRef.current = null;
          setInputValue(transcript);
          await runAsk(transcript);
        } catch {
          voiceSessionRef.current = null;
        }
        return;
      }

      try {
        voiceSessionRef.current = startVoiceCapture('en-US');
        setListening(true);
      } catch {
        voiceSessionRef.current = null;
        setListening(false);
      }
    });
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    requireAuth(async () => {
      try {
        const imageUrl = await readImageFile(file);
        const prompt = inputValue.trim() || 'Analyze this image';
        navigateToWorkspace('image', prompt, imageUrl);
        setInputValue('');
      } catch {
        useAppStore.getState().setError('Image upload failed. Please try a smaller image.');
      }
      e.target.value = '';
    });
  };

  const openWorkspace = (id: WorkspaceType) => {
    requireAuth(() => setWorkspace(id));
  };

  const gateChatFocus = () => {
    requireAuth(() => {});
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8 lg:space-y-10">
      <section className="relative flex flex-col lg:grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-8 items-center min-h-[180px]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E2E]/10 via-transparent to-transparent rounded-[1.75rem] pointer-events-none" />

        <div className="relative z-10 order-2 lg:order-1 text-center lg:text-left w-full">
          <h1 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight mb-3 text-white">
            One platform. <span className="text-[#FF2E2E]">Four</span> powerful solutions.
          </h1>
          <p className="text-base sm:text-lg text-slate-400 font-medium">
            Coding · Student · Health · AI Chat
          </p>
          <p className="text-gray-500 mt-3 lg:mt-4 max-w-lg mx-auto lg:mx-0 text-sm leading-relaxed">
            Your intelligent companion for coding, learning, and everyday tasks — Saif Tech Global.
          </p>
        </div>

        <div className="relative z-10 order-1 lg:order-2 flex justify-center lg:justify-end w-full">
          <Sg16Logo
            glow
            className="w-28 h-28 sm:w-36 sm:h-36 lg:w-48 lg:h-48 drop-shadow-[0_0_40px_rgba(255,46,46,0.35)]"
          />
        </div>
      </section>

      <section>
        <div className="sg16-card p-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#050307] rounded-2xl px-4 py-3 border border-[#2a1218]">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-5 h-5 text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Ask anything..."
                value={inputValue}
                onFocus={gateChatFocus}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAsk();
                }}
                className="flex-1 bg-transparent text-base lg:text-lg outline-none placeholder-gray-500 text-white"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-2xl transition ${listening ? 'bg-[#FF2E2E]/20 text-[#FF8A8A]' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                title="Voice input"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2.5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition"
                title="Upload image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleAsk()}
                disabled={routing || !inputValue.trim()}
                className="bg-[#FF2E2E] hover:bg-[#FF5C5C] px-6 py-2.5 rounded-2xl font-semibold flex items-center gap-2 transition shadow-[0_0_20px_rgba(255,46,46,0.25)] disabled:opacity-50 text-white"
              >
                {routing ? 'Routing...' : 'Ask Engine'} <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Popular Things to Ask</h3>
        <div className="flex flex-wrap gap-2.5">
          {popularActions.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleAsk(label)}
              className="flex items-center gap-2 bg-[#0c0a0e] hover:bg-[#12080e] border border-[#2a1218] hover:border-[#FF2E2E]/35 px-4 py-2.5 rounded-2xl text-sm transition"
            >
              <Icon className="w-4 h-4 text-[#FF8A8A]" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-400 mb-5 uppercase tracking-wider">
          One platform · four solutions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workspaces.map((ws) => {
            const Icon = ws.icon;
            return (
              <WorkspaceCard
                key={ws.id}
                ws={ws}
                Icon={Icon}
                onOpen={() => openWorkspace(ws.id as WorkspaceType)}
              />
            );
          })}
        </div>
      </section>

      <section className="sg16-card p-4 sm:p-6 lg:p-8">
        <PricingPanel compact />
        <div className="text-center mt-4">
          <a href="/pricing" className="text-sm text-[#FF8A8A] hover:text-[#FF2E2E] font-medium inline-block">
            View full pricing & plans →
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 pt-4">
        <InfoColumn
          title="Why SG16 AI Engine?"
          items={whyFeatures}
          icon={CheckCircle2}
          iconClass="text-[#FF8A8A]"
        />
        <InfoColumn title="Built for Everyone" items={builtFor} icon={Users} iconClass="text-sky-400" />
        <div className="sg16-card p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-[#FF2E2E]" /> Trusted & Secure
          </h4>
          <ul className="space-y-2.5">
            {trusted.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-[#FF8A8A] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-[#2a1218] pt-8 pb-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <p className="text-xs text-gray-500 text-center lg:text-left">
            © SaifTech Global Limited • SG16 AI Engine • All Rights Reserved
          </p>
          <div className="flex items-center gap-4 text-gray-500">
            {[Facebook, Twitter, Linkedin, Youtube].map((Icon, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openHelp('contact')}
                className="hover:text-[#FF2E2E] transition"
                title="Contact SG16 AI"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <a href="/pricing" className="hover:text-white transition">
              Pricing
            </a>
            <a href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-white transition">
              Terms of Service
            </a>
            <a href="/contact" className="hover:text-white transition">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

function WorkspaceCard({
  ws,
  Icon,
  onOpen,
}: {
  ws: (typeof workspaces)[0];
  Icon: typeof Code2;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={`group sg16-card sg16-card-hover border ${ws.accent} p-6 cursor-pointer flex flex-col min-h-[200px]`}
    >
      <div className={`w-12 h-12 ${ws.iconBg} rounded-2xl flex items-center justify-center mb-5`}>
        <Icon className={`w-6 h-6 ${ws.iconColor}`} />
      </div>
      <h4 className="font-semibold text-lg mb-2 text-white tracking-tight">{ws.title}</h4>
      <p className="text-sm text-gray-400 line-clamp-3 mb-auto leading-relaxed flex-1">{ws.desc}</p>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 group-hover:text-white transition">Open</span>
        <span
          className={`w-9 h-9 rounded-full ${ws.ring} flex items-center justify-center text-white text-sm font-bold shadow-lg`}
        >
          →
        </span>
      </div>
    </div>
  );
}

function InfoColumn({
  title,
  items,
  icon: Icon,
  iconClass,
}: {
  title: string;
  items: string[];
  icon: typeof CheckCircle2;
  iconClass: string;
}) {
  return (
    <div className="sg16-card p-6">
      <h4 className="font-semibold mb-4 text-white">{title}</h4>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
            <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
