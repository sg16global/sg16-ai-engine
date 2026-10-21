import { Fragment, type ReactNode } from 'react';

/**
 * Small Markdown renderer for AI replies: headings, lists, code blocks, bold/italic, inline code
 * and links. Builds React nodes (never raw HTML), and only http(s) links become anchors.
 */

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\[[^\]\n]+\]\((https?:\/\/[^)\s]+)\))|(https?:\/\/[^\s<)]+)|(\*[^*\n]+\*|_[^_\n]+_)/g;

function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyBase}-${i++}`;
    const [token] = m;
    if (m[1]) {
      out.push(
        <code key={key} className="px-1.5 py-0.5 rounded bg-white/[0.08] text-[#FFB3DA] font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (m[2]) {
      out.push(<strong key={key} className="font-semibold text-white">{renderInline(token.slice(2, -2), key)}</strong>);
    } else if (m[3]) {
      const label = token.slice(1, token.indexOf(']('));
      out.push(
        <a key={key} href={m[4]} target="_blank" rel="noopener noreferrer" className="text-[#FF5CB8] underline underline-offset-2 hover:text-[#FF168D]">
          {label}
        </a>,
      );
    } else if (m[5]) {
      out.push(
        <a key={key} href={token} target="_blank" rel="noopener noreferrer" className="text-[#FF5CB8] underline underline-offset-2 break-all hover:text-[#FF168D]">
          {token}
        </a>,
      );
    } else if (m[6]) {
      out.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = start + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: 'code'; lang: string; text: string }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'rule' }
  | { kind: 'para'; text: string };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: 'para', text: para.join('\n') });
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^\s*```(\S*)/);
    if (fence) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
      blocks.push({ kind: 'code', lang: fence[1], text: body.join('\n') });
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flush();
      blocks.push({ kind: 'rule' });
      continue;
    }
    const item = line.match(/^\s*(?:([-*•])|(\d+)[.)])\s+(.*)$/);
    if (item) {
      flush();
      const ordered = !!item[2];
      const prev = blocks[blocks.length - 1];
      if (prev?.kind === 'list' && prev.ordered === ordered) prev.items.push(item[3]);
      else blocks.push({ kind: 'list', ordered, items: [item[3]] });
      continue;
    }
    // Indented continuation of the previous list item.
    const prev = blocks[blocks.length - 1];
    if (!para.length && prev?.kind === 'list' && /^\s{2,}\S/.test(line)) {
      prev.items[prev.items.length - 1] += `\n${line.trim()}`;
      continue;
    }
    if (line.startsWith('>')) {
      flush();
      blocks.push({ kind: 'quote', text: line.replace(/^>\s?/, '') });
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

function withBreaks(text: string, key: string): ReactNode[] {
  return text.split('\n').map((part, i) => (
    <Fragment key={`${key}-l${i}`}>
      {i > 0 && <br />}
      {renderInline(part, `${key}-l${i}`)}
    </Fragment>
  ));
}

export function Markdown({ text, mono = false }: { text: string; mono?: boolean }) {
  const blocks = parseBlocks(text);
  return (
    <div className={`space-y-2.5 break-words ${mono ? 'text-[13px]' : ''}`}>
      {blocks.map((b, i) => {
        const key = `b${i}`;
        switch (b.kind) {
          case 'code':
            return (
              <pre key={key} className="rounded-lg bg-black/50 border border-white/[0.08] p-3 overflow-x-auto text-xs leading-relaxed font-mono text-white/90">
                {b.lang && <div className="text-[10px] uppercase tracking-wider text-white/35 mb-1.5">{b.lang}</div>}
                <code>{b.text}</code>
              </pre>
            );
          case 'heading':
            return (
              <p key={key} className={`font-semibold text-white ${b.level <= 2 ? 'text-base' : 'text-sm'}`}>
                {renderInline(b.text, key)}
              </p>
            );
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul';
            return (
              <Tag key={key} className={`${b.ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1.5 marker:text-[#FF5CB8]/70`}>
                {b.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{withBreaks(it, `${key}-${j}`)}</li>
                ))}
              </Tag>
            );
          }
          case 'quote':
            return (
              <blockquote key={key} className="border-l-2 border-[#FF168D]/50 pl-3 text-white/70">
                {renderInline(b.text, key)}
              </blockquote>
            );
          case 'rule':
            return <hr key={key} className="border-white/10" />;
          default:
            return <p key={key}>{withBreaks(b.text, key)}</p>;
        }
      })}
    </div>
  );
}
