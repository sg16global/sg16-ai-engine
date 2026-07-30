import {
  MessageSquare,
  Image as ImageIcon,
  Code2,
  FileText,
  Shield,
  Lock,
  Globe,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';
import { SG16_PUBLIC_URL } from '../../core/routes';
import { Sg16Logo } from '../ui/Sg16Logo';
import { useAppStore } from '../../core/appState';
import { LandingHeader } from './LandingHeader';
import { AnimatedProductTour } from './AnimatedProductTour';
import './landingStyles.css';


const features = [
  { icon: MessageSquare, title: 'دردشة AI', desc: 'محادثات سريعة وواضحة في كل مساحة عمل.' },
  { icon: Code2, title: 'مركز البرمجة', desc: 'ولّد، صحّح، وانشر الكود مع SG16.' },
  { icon: ImageIcon, title: 'استوديو الصور', desc: 'أنشئ وحرّر الصور في مكان واحد.' },
  { icon: FileText, title: 'مختبر المستندات', desc: 'لخّص، أعد الصياغة، واعمل على ملفاتك.' },
] as const;

const trustItems = [
  { icon: Shield, title: 'تقنية موثوقة', desc: 'موثوق. آمن. متقدّم.' },
  { icon: Star, title: 'منصة معتمدة', desc: 'رسمية. محمية. جاهزة.' },
  { icon: Globe, title: 'معيار عالمي', desc: 'مبني للمستخدمين حول العالم.' },
  { icon: Lock, title: 'خصوصية بالتصميم', desc: 'Google Sign-In — لا نطلب كلمة مرور.' },
] as const;

export function LandingPage() {
  const enterLocalPreview = useAppStore((s) => s.enterLocalPreview);

  return (
    <div className="landing-page relative min-h-[100dvh] overflow-x-hidden" lang="ar" dir="rtl">
      <LandingHeader />

      {/* Public hero — the page itself is the live animated product tour. */}
      <section className="landing-hero-section landing-hero-live">
        <div className="landing-shell landing-hero-copy">
          <div className="landing-hero-brand">
            <Sg16Logo className="landing-hero-brand-logo" glow />
            <p className="landing-kicker">{SG16_BRAND.company}</p>
          </div>
          <h1 className="landing-hero-title">
            أقوى
            <br />
            <span className="text-[#7CFC00]">محرّك AI</span>
          </h1>
          <p className="landing-hero-sub">
            تطبيق واحد. ذكاء بلا حدود — دردشة، برمجة، مستندات، وصور في مساحة عمل آمنة واحدة.
          </p>
          <div className="landing-hero-cta">
            <button type="button" onClick={() => enterLocalPreview()} className="landing-btn-primary">
              ادخل SG16
            </button>
            <a href="#features" className="landing-btn-ghost">
              استكشف الميزات
            </a>
          </div>
        </div>

        <AnimatedProductTour />
      </section>

      {/* Features */}
      <section id="features" className="landing-section">
        <div className="landing-shell landing-section-head">
          <h2 className="landing-section-title">كل شيء في محرّك واحد</h2>
          <p className="landing-section-sub">
            مساحات عمل نظيفة للعمل الحقيقي — لا مزيد من تبويبات AI المتفرقة.
          </p>
        </div>
        <div className="landing-shell landing-feature-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-feature-row">
              <div className="landing-feature-icon">
                <Icon className="h-5 w-5 text-[#7CFC00]" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-white">{title}</h3>
                <p className="mt-1 text-[14px] font-light leading-relaxed text-white/55">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security + proof */}
      <section className="landing-section landing-section-tight">
        <div className="landing-shell landing-section-head">
          <h2 className="landing-section-title">أمانك أولويتنا</h2>
          <p className="landing-section-sub">
            وصول موثوق. سجّل الدخول بـ Google — لا نطلب كلمة مرور أبداً.
          </p>
        </div>
        <div className="landing-shell landing-proof-grid">
          <div className="landing-proof">
            <div className="landing-proof-label">
              <Globe className="h-3.5 w-3.5 text-[#7CFC00]" />
              الموقع الرسمي
            </div>
            <div className="landing-proof-url">
              <Lock className="h-3.5 w-3.5 shrink-0 text-[#7CFC00]" />
              <span className="truncate">{SG16_PUBLIC_URL}</span>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7CFC00]" />
            </div>
          </div>
          <a
            href="https://x.com/SG16_AIEngine"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-proof landing-proof-link"
          >
            <div className="landing-proof-label">
              <span className="text-[#7CFC00]">𝕏</span>
              الحساب الرسمي
            </div>
            <div className="flex items-center gap-3">
              <Sg16Logo className="h-10 w-10 rounded-full" />
              <div className="min-w-0 text-start">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-semibold text-white">SG16_AIEngine</span>
                  <CheckCircle2 className="h-4 w-4 text-[#7CFC00]" />
                </div>
                <p className="text-[12px] text-white/45">@SG16_AIEngine</p>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Trust strip */}
      <section className="landing-section">
        <div className="landing-shell landing-trust-strip">
          {trustItems.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-trust-item">
              <Icon className="mb-2 h-4 w-4 text-[#7CFC00]" strokeWidth={1.75} />
              <p className="text-[13px] font-semibold text-white">{title}</p>
              <p className="mt-1 text-[12px] font-light text-white/50">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-shell">
          <div className="landing-footer-brand">
            <Sg16Logo className="landing-footer-brand-logo" />
            <div>
              <p className="landing-footer-brand-title">{SG16_BRAND.name}</p>
              <p className="landing-footer-brand-company">{SG16_BRAND.company}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-white/45">
            <a href="/privacy" className="hover:text-[#7CFC00] transition">
              الخصوصية
            </a>
            <a href="/terms" className="hover:text-[#7CFC00] transition">
              الشروط
            </a>
            <a href="/contact" className="hover:text-[#7CFC00] transition">
              تواصل
            </a>
            <a href={`mailto:${SG16_BRAND.contactEmail}`} className="hover:text-[#7CFC00] transition">
              {SG16_BRAND.contactEmail}
            </a>
          </div>
          <p className="mt-3 text-center text-[11px] text-white/35">
            © {new Date().getFullYear()} {SG16_BRAND.company}. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
