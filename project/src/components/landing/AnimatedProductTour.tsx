import { useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Code2,
  GraduationCap,
  HeartPulse,
  LineChart,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { playTourMusic, stopTourMusic } from '../../lib/voiceInput';
import './tourStyles.css';

type Scene = {
  key: string;
  icon: LucideIcon;
  chipLabel: string;
  punch: string;
  punchAccent: string;
  eyebrow: string;
  detail: string;
  accent: string;
  orbitAngle: number;
};

const LOOP_MS = 9800;

const scenes: Scene[] = [
  {
    key: 'ai',
    icon: Bot,
    chipLabel: 'دردشة',
    punch: 'توقف عن التنقل',
    punchAccent: 'بين تبويبات AI',
    eyebrow: 'دردشة SG16',
    detail: 'اسأل، حلّل، وتابع — كل دروع SG16 في مكان واحد.',
    accent: '#7cfc00',
    orbitAngle: 0,
  },
  {
    key: 'student',
    icon: GraduationCap,
    chipLabel: 'طالب',
    punch: 'حياة الطالب',
    punchAccent: 'منظمة',
    eyebrow: 'درع الطالب',
    detail: 'الحضور، الواجبات، الجدول، والنتائج.',
    accent: '#fbbf24',
    orbitAngle: 72,
  },
  {
    key: 'coding',
    icon: Code2,
    chipLabel: 'برمجة',
    punch: 'ابنِ وصحّح',
    punchAccent: 'أسرع',
    eyebrow: 'مركز البرمجة',
    detail: 'ولّد، راجع، وحسّن الكود دون مغادرة المحرّك.',
    accent: '#38bdf8',
    orbitAngle: 144,
  },
  {
    key: 'health',
    icon: HeartPulse,
    chipLabel: 'صحة',
    punch: 'إرشاد صحي',
    punchAccent: 'واضح',
    eyebrow: 'درع الصحة',
    detail: 'معلومات أسهل للفهم عندما تحتاجها.',
    accent: '#2dd4bf',
    orbitAngle: 216,
  },
  {
    key: 'market',
    icon: LineChart,
    chipLabel: 'سوق',
    punch: 'إشارات السوق',
    punchAccent: 'في حركة',
    eyebrow: 'درع السوق',
    detail: 'راقب وافهم السوق — بدون تداول آلي.',
    accent: '#a78bfa',
    orbitAngle: 288,
  },
];

const stats = [
  { value: '5', label: 'دروع نشطة' },
  { value: '1', label: 'محرك آمن' },
  { value: '24/7', label: 'متاح دائماً' },
  { value: 'Google', label: 'تسجيل جاهز' },
];

export function AnimatedProductTour() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [musicOn, setMusicOn] = useState(true);
  const [musicReady, setMusicReady] = useState(false);
  const scene = scenes[sceneIndex];

  const unlockMusic = () => {
    if (musicReady) return;
    setMusicReady(true);
    if (musicOn) playTourMusic();
  };

  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !musicOn;
    setMusicOn(next);
    setMusicReady(true);
    if (next) playTourMusic();
    else stopTourMusic();
  };

  useEffect(() => {
    const id = window.setInterval(
      () => setSceneIndex((i) => (i + 1) % scenes.length),
      LOOP_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => stopTourMusic(), []);

  return (
    <div className="landing-tour" lang="ar" aria-label="جولة SG16">
      <div className="landing-tour-stage" onPointerDown={unlockMusic}>
        <div className="landing-tour-bg" aria-hidden>
          <div className="landing-tour-stars" />
        </div>

        <button
          type="button"
          className={`landing-tour-voice${musicOn ? ' is-on' : ''}`}
          onClick={toggleMusic}
          aria-pressed={musicOn}
        >
          {musicOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>{musicOn ? 'الموسيقى' : 'بدون موسيقى'}</span>
        </button>

        <div className="landing-tour-grid">
          <div className="landing-tour-visual">
            <div className="landing-tour-orbit-hub">
              <motion.div
                className="landing-tour-orbit-spin"
                animate={{ rotate: 360 }}
                transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
              >
                <div className="landing-tour-orbit-ring" />
                {scenes.map(({ key, icon: Icon, accent, orbitAngle, chipLabel }) => (
                  <div
                    key={key}
                    className={`landing-tour-orbit-pill${key === scene.key ? ' is-active' : ''}`}
                    style={
                      {
                        '--orbit-angle': `${orbitAngle}deg`,
                        '--scene-accent': accent,
                      } as CSSProperties
                    }
                  >
                    <span>{chipLabel}</span>
                    <Icon size={12} aria-hidden />
                  </div>
                ))}
              </motion.div>

              <div className="landing-tour-earth-orb">
                <img
                  src="/assets/sg16-earth-dna-bg.webp"
                  alt=""
                  className="landing-tour-earth-img"
                  draggable={false}
                />
                <div className="landing-tour-earth-glow" />
                <div className="landing-tour-ai-core" aria-hidden>
                  <Sparkles size={12} />
                  <span>AI</span>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-tour-copy">
            <AnimatePresence mode="wait">
              <motion.div
                key={scene.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.45 }}
              >
                <p className="landing-tour-eyebrow">{scene.eyebrow}</p>
                <h2 className="landing-tour-punch">
                  {scene.punch}
                  <span style={{ color: scene.accent }}> {scene.punchAccent}</span>
                </h2>
                <p className="landing-tour-lead">{scene.detail}</p>
              </motion.div>
            </AnimatePresence>

            <div className="landing-tour-stats">
              {stats.map(({ value, label }) => (
                <div key={label} className="landing-tour-stat">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="landing-tour-footer">
          <div className="landing-tour-dots" aria-hidden>
            {scenes.map(({ key }, i) => (
              <span key={key} className={i === sceneIndex ? 'is-active' : ''} />
            ))}
          </div>
          <div className="landing-tour-caption">
            <Sparkles size={14} aria-hidden />
            <span>جولة SG16 المباشرة</span>
            <span>·</span>
            <span>محرك واحد · كل درع</span>
          </div>
        </div>
      </div>
    </div>
  );
}
