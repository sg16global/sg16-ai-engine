import { useEffect, useState } from 'react';
import { Check, Copy, Download, Maximize2, Play, Save, ShieldCheck, X } from 'lucide-react';
import { readLocal, writeLocal } from '../../lib/localStore';
import { uid } from '../../lib/utils';

/**
 * Code from the AI: Copy / Download / Save to My Snippets / Scan, and for web code a live
 * Preview. The preview runs in a sandboxed iframe without allow-same-origin, so the code
 * cannot read SG16's storage, chats or login, and cannot change the SG16 page.
 */

const WEB_LANGS = new Set(['html', 'htm', 'xhtml', 'svg']);
const JS_LANGS = new Set(['js', 'javascript', 'mjs']);

const EXTENSIONS: Record<string, string> = {
  html: 'html', htm: 'html', svg: 'svg', css: 'css', js: 'js', javascript: 'js', mjs: 'js', jsx: 'jsx',
  ts: 'ts', typescript: 'ts', tsx: 'tsx', python: 'py', py: 'py', java: 'java', c: 'c', cpp: 'cpp',
  'c++': 'cpp', cs: 'cs', csharp: 'cs', go: 'go', php: 'php', sql: 'sql', json: 'json', bash: 'sh',
  sh: 'sh', ruby: 'rb', rust: 'rs', kotlin: 'kt', swift: 'swift', dart: 'dart',
};

const SNIPPET_LANGUAGES: Record<string, string> = {
  js: 'JavaScript', javascript: 'JavaScript', mjs: 'JavaScript', jsx: 'JavaScript', ts: 'TypeScript',
  typescript: 'TypeScript', tsx: 'TypeScript', python: 'Python', py: 'Python', java: 'Java', c: 'C / C++',
  cpp: 'C / C++', 'c++': 'C / C++', cs: 'C#', csharp: 'C#', go: 'Go', php: 'PHP', sql: 'SQL',
  html: 'HTML / CSS', htm: 'HTML / CSS', css: 'HTML / CSS',
};

/** Code that only works under Node.js (modules, files, servers) is not run in the browser. */
const NODE_ONLY = /\brequire\s*\(|^\s*import\s.+\sfrom\s|^\s*export\s|\bprocess\.|\b__dirname\b|\bmodule\.exports\b/m;

export interface PreviewParts {
  css: string[];
  js: string[];
}

function guessLang(lang: string, code: string) {
  const l = lang.toLowerCase();
  if (l) return l;
  const head = code.trimStart().slice(0, 200).toLowerCase();
  if (head.startsWith('<!doctype html') || head.startsWith('<html')) return 'html';
  if (head.startsWith('<svg')) return 'svg';
  return '';
}

const escapeScript = (s: string) => s.replace(/<\/script/gi, '<\\/script');

/** A whole web page from an HTML block, plus any CSS / JS blocks in the same reply. */
export function buildWebDocument(html: string, parts: PreviewParts) {
  const style = parts.css.length ? `<style>\n${parts.css.join('\n')}\n</style>` : '';
  const script = parts.js.length ? `<script>\n${escapeScript(parts.js.join('\n;\n'))}\n</script>` : '';
  let doc = /<html[\s>]/i.test(html)
    ? html
    : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${html}</body></html>`;
  if (style) doc = /<\/head>/i.test(doc) ? doc.replace(/<\/head>/i, `${style}</head>`) : style + doc;
  if (script) doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${script}</body>`) : doc + script;
  return doc;
}

/** A small console page that shows what plain JavaScript prints. */
export function buildConsoleDocument(js: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:10px 12px;background:#0b0a10;color:#e9e7f2;font:13px/1.5 ui-monospace,Consolas,monospace}
div{white-space:pre-wrap;word-break:break-word;border-bottom:1px solid #1d1a26;padding:3px 0}
.e{color:#ff6b8b}.w{color:#ffb547}.m{color:#7a7690}
</style></head><body><div class="m">Console output</div><script>
(function(){
  function show(cls, args){
    var d=document.createElement('div'); d.className=cls;
    d.textContent=Array.prototype.map.call(args,function(a){
      if(typeof a==='string') return a;
      try{return JSON.stringify(a,null,2)}catch(e){return String(a)}
    }).join(' ');
    document.body.appendChild(d);
  }
  ['log','info','debug','table'].forEach(function(k){console[k]=function(){show('',arguments)}});
  console.warn=function(){show('w',arguments)};
  console.error=function(){show('e',arguments)};
  window.onerror=function(m,s,l){show('e',['Error: '+m+(l?' (line '+l+')':'')]);};
  window.addEventListener('unhandledrejection',function(e){show('e',['Unhandled: '+(e.reason&&e.reason.message||e.reason)])});
})();
</script><script>
${escapeScript(js)}
</script></body></html>`;
}

export function previewFor(lang: string, code: string, parts: PreviewParts): { kind: 'web' | 'console'; doc: string } | null {
  const l = guessLang(lang, code);
  if (WEB_LANGS.has(l)) return { kind: 'web', doc: buildWebDocument(code, parts) };
  if (JS_LANGS.has(l) && !NODE_ONLY.test(code)) return { kind: 'console', doc: buildConsoleDocument(code) };
  return null;
}

function PreviewFrame({ doc, className }: { doc: string; className: string }) {
  return (
    <iframe
      title="Code preview"
      srcDoc={doc}
      // No allow-same-origin: the preview cannot reach SG16's storage, cookies or page.
      sandbox="allow-scripts allow-modals allow-forms allow-pointer-lock"
      referrerPolicy="no-referrer"
      className={`w-full bg-white border-0 ${className}`}
    />
  );
}

function FullScreen({ doc, onClose }: { doc: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex flex-col p-3 sm:p-6" role="dialog" aria-label="Preview full screen">
      <div className="flex items-center justify-between mb-2 text-sm text-white/80">
        <span>Preview — runs sealed off from SG16</span>
        <button type="button" onClick={onClose} className="sg16-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
          <X className="w-3.5 h-3.5" /> Close
        </button>
      </div>
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/15">
        <PreviewFrame doc={doc} className="h-full" />
      </div>
    </div>
  );
}

function saveSnippet(code: string, lang: string) {
  const list = readLocal<Record<string, unknown>[]>('coding_snippets', []);
  const firstLine = code.trim().split('\n')[0].replace(/^[/#<!*\-\s]+/, '').slice(0, 40);
  writeLocal('coding_snippets', [
    ...list,
    {
      id: uid(),
      createdAt: Date.now(),
      title: firstLine || 'AI code',
      language: SNIPPET_LANGUAGES[lang] ?? 'Other',
      code,
    },
  ]);
}

export function CodeBlock({
  code,
  lang,
  parts,
  onScan,
  noPreview = false,
}: {
  code: string;
  lang: string;
  parts: PreviewParts;
  onScan?: (code: string) => void;
  /** CSS / JS that belongs to an HTML block in the same reply runs inside that preview instead. */
  noPreview?: boolean;
}) {
  const l = guessLang(lang, code);
  const preview = noPreview ? null : previewFor(l, code, parts);
  const [tab, setTab] = useState<'code' | 'preview'>(preview?.kind === 'web' ? 'preview' : 'code');
  const [full, setFull] = useState(false);
  const [flash, setFlash] = useState('');

  const notice = (text: string) => {
    setFlash(text);
    window.setTimeout(() => setFlash(''), 1600);
  };
  const download = () => {
    const isWeb = preview?.kind === 'web';
    const body = isWeb ? preview.doc : code;
    const ext = isWeb ? 'html' : EXTENSIONS[l] ?? 'txt';
    const url = URL.createObjectURL(new Blob([body], { type: isWeb ? 'text/html' : 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `sg16-code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const btn = 'inline-flex items-center gap-1 normal-case tracking-normal text-white/60 hover:text-white';

  return (
    <div className="my-2 rounded-xl border border-white/10 bg-black/50 overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-white/45">
        {preview ? (
          <div className="flex items-center gap-1 normal-case tracking-normal text-[11px]">
            {(['code', 'preview'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-2 py-0.5 rounded-md ${tab === t ? 'bg-[#FF168D]/20 text-white' : 'text-white/55 hover:text-white'}`}
              >
                {t === 'code' ? 'Code' : preview.kind === 'web' ? 'Preview' : 'Run'}
              </button>
            ))}
          </div>
        ) : (
          <span>{l || 'code'}</span>
        )}
        <span className="flex-1" />
        {flash && <span className="normal-case tracking-normal text-emerald-400">{flash}</span>}
        {preview && (
          <button type="button" onClick={() => setFull(true)} className={btn}>
            <Maximize2 className="w-3 h-3" /> Full screen
          </button>
        )}
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(code).then(() => notice('Copied'))}
          className={btn}
        >
          {flash === 'Copied' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy
        </button>
        <button type="button" onClick={download} className={btn}>
          <Download className="w-3 h-3" /> Download
        </button>
        <button
          type="button"
          onClick={() => {
            saveSnippet(code, l);
            notice('Saved to My Snippets');
          }}
          className={btn}
        >
          <Save className="w-3 h-3" /> Save
        </button>
        {onScan && (
          <button type="button" onClick={() => onScan(code)} className={btn}>
            <ShieldCheck className="w-3 h-3" /> Scan
          </button>
        )}
      </div>
      {tab === 'preview' && preview ? (
        <div className="relative">
          <PreviewFrame doc={preview.doc} className={preview.kind === 'web' ? 'h-[22rem] resize-y' : 'h-56 resize-y'} />
          <span className="absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded bg-black/70 text-white/70 inline-flex items-center gap-1 pointer-events-none">
            <Play className="w-3 h-3" /> Running sealed off from SG16
          </span>
        </div>
      ) : (
        <pre className="p-3 overflow-x-auto text-xs leading-relaxed font-mono text-white/90 max-h-[28rem]">
          <code>{code}</code>
        </pre>
      )}
      {full && preview && <FullScreen doc={preview.doc} onClose={() => setFull(false)} />}
    </div>
  );
}
