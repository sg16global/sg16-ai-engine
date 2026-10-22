/**
 * Homepage rails (owner request 2026-10-22): "AI Pioneers" photo rail under the flags and a
 * "World's AI" name rail above the footer. Both loop continuously, pause on hover, and show as a
 * still, wrapped list for people who turn off motion. Same pioneers and names as mistralbrain.com.
 */

type Pioneer = {
  id: string;
  name: string;
  role: string;
  credit: { author: string; license: string; source: string | null };
};

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

const PIONEERS: Pioneer[] = [
  { id: 'alan-turing', name: 'Alan Turing', role: 'Computing & Machine Intelligence Pioneer', credit: { author: 'Elliott & Fry', license: 'Public domain', source: commons('Alan_turing_header.jpg') } },
  { id: 'john-mccarthy', name: 'John McCarthy', role: 'AI Pioneer · Lisp Creator', credit: { author: 'null0 (Flickr)', license: 'CC BY-SA 2.0', source: commons('John_McCarthy_Stanford.jpg') } },
  { id: 'marvin-minsky', name: 'Marvin Minsky', role: 'Early AI Pioneer', credit: { author: 'Sethwoodworth (OLPC)', license: 'CC BY 3.0', source: commons('Marvin_Minsky_at_OLPCb_(3x4_cropped).jpg') } },
  { id: 'geoffrey-hinton', name: 'Geoffrey Hinton', role: 'Deep Learning Pioneer', credit: { author: 'Cmichel67', license: 'CC BY-SA 4.0', source: commons('Geoffrey_Hinton_in_2026.jpg') } },
  // Rights for this photo still need confirming (no free licence was found).
  { id: 'arthur-samuel', name: 'Arthur Samuel', role: 'Machine Learning Pioneer', credit: { author: 'Historical photograph', license: 'rights to be confirmed', source: null } },
  { id: 'claude-shannon', name: 'Claude Shannon', role: 'Information Theory Pioneer', credit: { author: 'Tekniska museet', license: 'CC BY 2.0', source: commons('C.E._Shannon._Tekniska_museet_43069_(2x3_crop).jpg') } },
  { id: 'norbert-wiener', name: 'Norbert Wiener', role: 'Cybernetics Pioneer', credit: { author: 'Garry Olsh', license: 'CC0', source: commons('Norbert_Wiener.png') } },
  { id: 'herbert-simon', name: 'Herbert A. Simon', role: 'AI & Cognitive Science Pioneer', credit: { author: 'Rochester Institute of Technology', license: 'Public domain', source: commons('Herbert_Simon,_RIT_NandE_Vol13Num11_1981_Mar19_Complete.jpg') } },
  { id: 'allen-newell', name: 'Allen Newell', role: 'Symbolic AI Pioneer', credit: { author: 'Paolo Massa', license: 'Public domain', source: commons('Herbert_A._Simon_and_Allen_Newell_Chess_Match.jpg') } },
  { id: 'frank-rosenblatt', name: 'Frank Rosenblatt', role: 'Perceptron & Neural Network Pioneer', credit: { author: 'Unknown', license: 'CC BY-SA 4.0', source: commons('Frank_Rosenblatt.jpg') } },
];

/** Names as plain text (no company logos), with a not-affiliated note. */
const WORLD_AI: [string, string][] = [
  ['Claude', 'Anthropic'],
  ['ChatGPT', 'OpenAI'],
  ['Gemini', 'Google'],
  ['Mistral', 'Mistral AI'],
  ['DeepSeek', 'DeepSeek'],
  ['Llama', 'Meta'],
  ['Grok', 'xAI'],
  ['Copilot', 'Microsoft'],
  ['Qwen', 'Alibaba'],
  ['Command', 'Cohere'],
  ['Perplexity', 'Perplexity AI'],
];

export function PioneersRail() {
  // The list twice, so the loop has no seam (-50% = one full list).
  const loop = [...PIONEERS, ...PIONEERS];
  return (
    <section className="lp-rail-section" aria-labelledby="lp-pioneers-title">
      <h2 id="lp-pioneers-title" className="lp-rail-title">
        AI Pioneers
      </h2>
      <p className="lp-rail-sub">Intelligence heritage</p>
      <div className="lp-rail">
        <div className="lp-rail__track lp-rail__track--pioneers">
          {loop.map((p, i) => (
            <figure key={`${p.id}-${i}`} className="lp-pioneer" aria-hidden={i >= PIONEERS.length || undefined}>
              <img src={`/landing/pioneers/${p.id}.jpg`} alt={i < PIONEERS.length ? p.name : ''} width={180} height={180} loading="lazy" decoding="async" draggable={false} />
              <figcaption>
                <strong>{p.name}</strong>
                <span>{p.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <details className="lp-rail-credits">
        <summary>Photo credits</summary>
        <ul>
          {PIONEERS.map((p) => (
            <li key={p.id}>
              {p.name}: {p.credit.author}, {p.credit.license}
              {p.credit.source && (
                <>
                  {' · '}
                  <a href={p.credit.source} target="_blank" rel="noopener noreferrer">
                    source
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

export function WorldAiRail() {
  const loop = [...WORLD_AI, ...WORLD_AI];
  return (
    <section className="lp-rail-section lp-rail-section--world" aria-labelledby="lp-worldai-title">
      <h2 id="lp-worldai-title" className="lp-rail-title">
        World’s AI
      </h2>
      <p className="lp-rail-sub">The minds of today’s AI</p>
      <div className="lp-rail lp-rail--names">
        <div className="lp-rail__track lp-rail__track--names">
          {loop.map(([name, maker], i) => (
            <div key={`${name}-${i}`} className="lp-ai-name" aria-hidden={i >= WORLD_AI.length || undefined}>
              <strong>{name}</strong>
              <span>{maker}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="lp-rail-note">Independent. Not affiliated with these companies.</p>
    </section>
  );
}
