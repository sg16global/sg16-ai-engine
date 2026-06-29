import { useState, useRef } from 'react';
import { useAppStore } from '../core/appState';
import { detectIntent } from '../core/engine';
import { readImageFile } from '../lib/chatApi';
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
  Wand2,
  FileText,
  Languages,
  Mic2,
  MessageSquare,
  Globe,
  Brain,
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
  { label: 'Solve Math Problem', icon: Calculator },
  { label: 'Write Python Code', icon: Code2 },
  { label: 'Explain Any Topic', icon: Lightbulb },
  { label: 'Homework Help', icon: BookOpen },
  { label: 'Study Plan', icon: Calendar },
  { label: 'Edit Image', icon: Wand2 },
  { label: 'Analyze Document', icon: FileText },
  { label: 'Translate Language', icon: Languages },
  { label: 'Voice Assistant', icon: Mic2 },
];

const workspaces = [
  {
    id: 'coding',
    title: 'Coding Hub',
    desc: 'Code generation, editing & advanced debugging',
    icon: Code2,
    accent: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
  },
  {
    id: 'image',
    title: 'Image Studio',
    desc: 'AI image generation, photo editing & enhancement',
    icon: ImageIcon,
    accent: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'document',
    title: 'Document Lab',
    desc: 'Smart document analysis & PDF tools',
    icon: FileText,
    accent: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
  },
  {
    id: 'general',
    title: SG16_BRAND.chatName,
    desc: 'Ask anything — live news, facts & daily questions',
    icon: MessageSquare,
    accent: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
  },
  {
    id: 'voice',
    title: 'Voice AI',
    desc: 'Speech to text & voice assistant',
    icon: Mic,
    accent: 'from-pink-500/20 to-pink-600/5 border-pink-500/30 text-pink-400',
    iconBg: 'bg-pink-500/15',
    iconColor: 'text-pink-400',
  },
  {
    id: 'translate',
    title: 'Translate',
    desc: 'Real-time language translation',
    icon: Globe,
    accent: 'from-sky-500/20 to-sky-600/5 border-sky-500/30 text-sky-400',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    wide: true,
  },
  {
    id: 'memory',
    title: 'Memory Vault',
    desc: 'Store & recall information instantly',
    icon: Brain,
    accent: 'from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400',
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    wide: true,
  },
  {
    id: 'student-shield',
    title: 'Student Shield',
    desc: 'Safe learning assistant for students',
    icon: GraduationCap,
    accent: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    wide: true,
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
  const openPricing = useAppStore((state) => state.openPricing);
  const [inputValue, setInputValue] = useState('');
  const [routing, setRouting] = useState(false);
  const [listening, setListening] = useState(false);
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
    requireAuth(() => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      if (listening) {
        setListening(false);
        return;
      }
      const rec = new SR();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.onresult = (e: SpeechRecognitionEvent) => {
        const transcript = e.results[0][0].transcript;
        setInputValue(transcript);
        setListening(false);
        void runAsk(transcript);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      rec.start();
      setListening(true);
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

  const topWorkspaces = workspaces.filter((w) => !w.wide);
  const bottomWorkspaces = workspaces.filter((w) => w.wide);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8 lg:space-y-10">
      {/* Hero */}
      <section className="relative flex flex-col lg:grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-8 items-center min-h-[200px]">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 rounded-3xl pointer-events-none" />

        <div className="relative z-10 order-2 lg:order-1 text-center lg:text-left w-full">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">Welcome to SG16 AI Engine</h1>
          <p className="text-base sm:text-xl lg:text-2xl font-medium">
            <span className="text-emerald-400">Most Powerful AI Platform</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-pink-400">
              All-in-One
            </span>
          </p>
          <p className="text-gray-500 mt-3 lg:mt-4 max-w-lg mx-auto lg:mx-0 text-sm leading-relaxed">
            Your intelligent companion for coding, learning, creativity, and everyday tasks — built by SaifTech Global.
          </p>
        </div>

        <div className="relative z-10 order-1 lg:order-2 flex justify-center lg:justify-end w-full">
          <Sg16Logo
            glow
            className="w-32 h-32 sm:w-40 sm:h-40 lg:w-56 lg:h-56 drop-shadow-[0_0_40px_rgba(16,185,129,0.35)]"
          />
        </div>
      </section>

      {/* Ask Box */}
      <section>
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-2 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-zinc-950 rounded-xl px-4 py-3">
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
                className="flex-1 bg-transparent text-base lg:text-lg outline-none placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-xl transition ${listening ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                title="Voice input"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition"
                title="Upload image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleAsk()}
                disabled={routing || !inputValue.trim()}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {routing ? 'Routing...' : 'Ask Engine'} <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Things to Ask */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Popular Things to Ask</h3>
        <div className="flex flex-wrap gap-2.5">
          {popularActions.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleAsk(label)}
              className="flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-emerald-500/30 px-4 py-2.5 rounded-xl text-sm transition"
            >
              <Icon className="w-4 h-4 text-emerald-400" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Workspaces */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 mb-5 uppercase tracking-wider">Workspaces</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {topWorkspaces.map((ws) => {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bottomWorkspaces.map((ws) => {
            const Icon = ws.icon;
            return (
              <WorkspaceCard
                key={ws.id}
                ws={ws}
                Icon={Icon}
                wide
                onOpen={() => openWorkspace(ws.id as WorkspaceType)}
              />
            );
          })}
        </div>
      </section>

      {/* Pricing on Home */}
      <section className="bg-zinc-900/50 border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-8">
        <PricingPanel compact />
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={openPricing}
            className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
          >
            View full pricing & plans →
          </button>
        </div>
      </section>

      {/* Info Footer */}
      <section className="grid md:grid-cols-3 gap-6 pt-4">
        <InfoColumn
          title="Why SG16 AI Engine?"
          items={whyFeatures}
          icon={CheckCircle2}
          iconClass="text-emerald-400"
        />
        <InfoColumn title="Built for Everyone" items={builtFor} icon={Users} iconClass="text-sky-400" />
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" /> Trusted & Secure
          </h4>
          <ul className="space-y-2.5">
            {trusted.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bottom Footer */}
      <footer className="border-t border-white/10 pt-8 pb-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <p className="text-xs text-gray-500 text-center lg:text-left">
            © SaifTech Global Limited • SG16 AI Engine • All Rights Reserved
          </p>
          <div className="flex items-center gap-4 text-gray-500">
            {[Facebook, Twitter, Linkedin, Youtube].map((Icon, i) => (
              <button key={i} type="button" onClick={() => openHelp('contact')} className="hover:text-emerald-400 transition" title="Contact SG16 AI">
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <button type="button" onClick={() => openHelp('privacy')} className="hover:text-white transition">Privacy Policy</button>
            <button type="button" onClick={() => openHelp('terms')} className="hover:text-white transition">Terms of Service</button>
            <button type="button" onClick={() => openHelp('contact')} className="hover:text-white transition">Contact Us</button>
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
  wide = false,
}: {
  ws: (typeof workspaces)[0];
  Icon: typeof Code2;
  onOpen: () => void;
  wide?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={`group bg-gradient-to-br ${ws.accent} border rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        wide ? 'md:p-6' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${ws.iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${ws.iconColor}`} />
        </div>
      </div>
      <h4 className="font-semibold mb-1.5">{ws.title}</h4>
      <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">{ws.desc}</p>
      <span className="text-xs font-medium text-emerald-400 group-hover:underline">Open Workspace →</span>
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
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
      <h4 className="font-semibold mb-4">{title}</h4>
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
