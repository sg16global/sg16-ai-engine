import { useState, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * Renders AI replies: paragraphs, headings, bullet / numbered lists, **bold**, _italic_,
 * `code`, fenced code blocks, [links](https://…) and bare URLs. Builds React elements only
 * (no innerHTML), so a reply can never inject markup. Long words and links wrap.
 */

const SAFE_URL = /^(https?:\/\/|mailto:)/i;
const INLINE =
  /(\[([^\]\n]+)\]\(([^)\s]+)\))|(`([^`\n]+)`)|(\*\*([^*\n]+)\*\*)|(__([^_\n]+)__)|(\*([^*\n]+)\*)|(\b_([^_\n]+)_\b)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;

function linkLabel(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 1 ? u.pathname.slice(0, 24) + (u.pathname.length > 24 ? '…' : '') : '';
    return u.hostname.replace(/^www\./, '') + path;
  } catch {
    return url;
  }
}

function Link({ href, children }: { href: string; children: ReactNode }) {
  if (!SAFE_URL.test(href)) return <>{children}</>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#FF5CB8] underline decoration-[#FF5CB8]/40 underline-offset-2 hover:decoration-[#FF5CB8] [overflow-wrap:anywhere]">
      {children}
    </a>
  );
}

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyBase}-${i++}`;
    if (m[1]) out.push(<Link key={key} href={m[3]}>{inline(m[2], key)}</Link>);
    else if (m[4]) out.push(<code key={key} className="px-1.5 py-0.5 rounded bg-white/[0.08] font-mono text-[0.85em] [overflow-wrap:anywhere]">{m[5]}</code>);
    else if (m[6]) out.push(<strong key={key} className="font-semibold text-white">{inline(m[7], key)}</strong>);
    else if (m[8]) out.push(<strong key={key} className="font-semibold text-white">{inline(m[9], key)}</strong>);
    else if (m[10]) out.push(<em key={key}>{inline(m[11], key)}</em>);
    else if (m[12]) out.push(<em key={key}>{inline(m[13], key)}</em>);
    else if (m[14]) out.push(<Link key={key} href={m[14]}>{linkLabel(m[14])}</Link>);
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-2 rounded-xl border border-white/10 bg-black/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-white/45">
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="inline-flex items-center gap-1 normal-case tracking-normal text-white/60 hover:text-white"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs leading-relaxed font-mono text-white/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

type Block =
  | { kind: 'code'; lang: string; text: string }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'list'; ordered: boolean; items: { text: string; extra: string[] }[] }
  | { kind: 'para'; lines: string[] }
  | { kind: 'rule' };

function parse(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^\s*```\s*([\w+-]*)/);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
      i++;
      blocks.push({ kind: 'code', lang: fence[1], text: body.join('\n') });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ kind: 'rule' });
      i++;
      continue;
    }
    const item = line.match(/^\s*([-*•]|\d+[.)])\s+(.*)$/);
    if (item) {
      const ordered = /\d/.test(item[1]);
      const items: { text: string; extra: string[] }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^\s*([-*•]|\d+[.)])\s+(.*)$/);
        if (m && /\d/.test(m[1]) === ordered) {
          items.push({ text: m[2], extra: [] });
          i++;
        } else if (items.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*```/.test(lines[i])) {
          items[items.length - 1].extra.push(lines[i].trim());
          i++;
        } else break;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*```/.test(lines[i]) &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])
    ) {
      para.push(lines[i++]);
    }
    blocks.push({ kind: 'para', lines: para });
  }
  return blocks;
}

/** Reply text without formatting marks, for one-line previews (History, lists). */
export function plainText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, '$1')
    .replace(/(\*\*|__|`)/g, '')
    .replace(/(^|\s)[*_]([^*_\n]+)[*_](?=\s|$|[.,!?])/g, '$1$2')
    .replace(/^\s*(#{1,4}|[-*•]|\d+[.)])\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function MessageContent({ text, monospace = false }: { text: string; monospace?: boolean }) {
  const blocks = parse(text);
  return (
    <div className={`space-y-2 min-w-0 [overflow-wrap:anywhere] ${monospace ? 'text-[13px]' : ''}`}>
      {blocks.map((b, bi) => {
        const key = `b${bi}`;
        switch (b.kind) {
          case 'code':
            return <CodeBlock key={key} code={b.text} lang={b.lang} />;
          case 'heading':
            return (
              <p key={key} className={`font-semibold text-white ${b.level <= 2 ? 'text-base' : 'text-sm'}`}>
                {inline(b.text, key)}
              </p>
            );
          case 'rule':
            return <hr key={key} className="border-white/10" />;
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul';
            return (
              <Tag key={key} className={`${b.ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1.5 marker:text-[#FF5CB8]`}>
                {b.items.map((it, ii) => (
                  <li key={ii}>
                    {inline(it.text, `${key}-${ii}`)}
                    {it.extra.map((x, xi) => (
                      <div key={xi} className="text-white/60 text-[0.92em] mt-0.5">
                        {inline(x, `${key}-${ii}-${xi}`)}
                      </div>
                    ))}
                  </li>
                ))}
              </Tag>
            );
          }
          default:
            return (
              <p key={key} className="whitespace-pre-wrap">
                {b.lines.map((l, li) => (
                  <span key={li}>
                    {li > 0 && '\n'}
                    {inline(l, `${key}-${li}`)}
                  </span>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
