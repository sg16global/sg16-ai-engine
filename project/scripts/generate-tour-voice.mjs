/**
 * Tour voice — ref-video SaaS tone (smooth single narrator).
 * Arabic script + Gulf neural voice matching Pinterest ad pacing.
 * Run: node scripts/generate-tour-voice.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/assets/tour-voice');
mkdirSync(outDir, { recursive: true });

/** Ref-ad style: calm, cinematic, one clear narrator (like ZeuZ / SaaS pin). */
const REF_VOICE = {
  voice: 'ar-AE-FatimaNeural',
  rate: '-10%',
  pitch: '-1Hz',
};

const clips = {
  intro:
    'محرك SG16 للذكاء الاصطناعي. منصة واحدة لكل شيء — دردشة، برمجة، صحة، طالب، وسوق. مساحة عمل آمنة واحدة. أهلاً بك في SG16.',
  ai: 'توقف عن التنقل بين تبويبات الذكاء الاصطناعي. SG16 يجمع كل درع في مساحة عمل ذكية واحدة.',
  student:
    'درع الطالب. الحضور، الواجبات، والنتائج — منظمة في مكان واحد. التعلم يبقى واضحاً.',
  coding: 'مركز البرمجة. ابنِ، صحّح، وانشر أسرع — دون مغادرة SG16.',
  health: 'درع الصحة. إرشاد واضح ومنظم عندما تحتاجه. آمن وجاهز للمساعدة.',
  market:
    'درع السوق. راقب الإشارات وافهم السوق — بدون تداول آلي. ذكاء مع تحكم.',
};

const edgeTts =
  process.env.EDGE_TTS_BIN ||
  join(process.env.APPDATA || '', 'Python/Python314/Scripts/edge-tts.exe');

for (const [key, text] of Object.entries(clips)) {
  const out = join(outDir, `${key}.mp3`);
  console.log(`[tour-voice] ${key}.mp3 — ${REF_VOICE.voice}`);
  execFileSync(
    edgeTts,
    [
      '--voice',
      REF_VOICE.voice,
      '--rate',
      REF_VOICE.rate,
      '--pitch',
      REF_VOICE.pitch,
      '--text',
      text,
      '--write-media',
      out,
    ],
    { stdio: 'inherit' },
  );
}

console.log('[tour-voice] ref-style narrator done —', outDir);
