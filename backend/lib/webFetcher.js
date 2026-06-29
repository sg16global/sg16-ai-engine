function decodeHtml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function stripTags(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

async function fetchText(url, timeoutMs = 15000) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'SG16-AI-Engine/1.0 (SaifTech Global; +https://saiftech.global)',
      Accept: 'text/html,application/xml,application/json,text/plain,*/*',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return res.text();
}

function parseRssItems(xml, limit = 8) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks.slice(0, limit)) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1];
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1];
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1];
    if (!title) continue;
    items.push({
      title: stripTags(title),
      url: stripTags(link || ''),
      date: stripTags(pubDate || ''),
      snippet: stripTags(desc || '').slice(0, 280),
      source: 'news',
    });
  }
  return items;
}

function isNewsQuery(query) {
  return /\b(news|headlines|breaking|happening|top stories)\b/i.test(query);
}

function isWeatherQuery(query) {
  return /\b(weather|forecast|temperature|rain|sunny)\b/i.test(query);
}

function extractLocation(query) {
  const m = query.match(/\b(?:in|for|at)\s+([A-Za-z][A-Za-z\s,.-]{2,40})/i);
  if (m) return m[1].replace(/\?.*$/, '').trim();
  const m2 = query.match(/\bweather\s+(?:in\s+)?([A-Za-z][A-Za-z\s,.-]{2,40})/i);
  if (m2) return m2[1].replace(/\?.*$/, '').trim();
  return '';
}

export async function fetchNewsResults(query) {
  const encoded = encodeURIComponent(query.replace(/\?/g, '').trim() || 'world news today');
  const feeds = [
    `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`,
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://feeds.bbci.co.uk/news/rss.xml',
  ];

  const all = [];
  for (const url of feeds) {
    try {
      const xml = await fetchText(url);
      all.push(...parseRssItems(xml, 6));
      if (all.length >= 10) break;
    } catch {
      /* try next feed */
    }
  }

  const seen = new Set();
  return all.filter((item) => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

export async function fetchWeatherResult(query) {
  const location = extractLocation(query) || 'London';
  const loc = encodeURIComponent(location);
  try {
    const oneLine = await fetchText(`https://wttr.in/${loc}?format=3`, 12000);
    const json = await fetchText(`https://wttr.in/${loc}?format=j1`, 12000);
    const data = JSON.parse(json);
    const cur = data.current_condition?.[0];
    const area = data.nearest_area?.[0]?.areaName?.[0]?.value || location;
    return [{
      title: `Weather for ${area}`,
      snippet: oneLine.trim(),
      url: `https://wttr.in/${loc}`,
      date: new Date().toUTCString(),
      source: 'weather',
      detail: cur
        ? `Feels like ${cur.FeelsLikeC}°C · Humidity ${cur.humidity}% · Wind ${cur.windspeedKmph} km/h`
        : '',
    }];
  } catch {
    return [];
  }
}

export async function fetchDuckDuckGoResults(query, limit = 8) {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  const html = await fetchText(url, 15000);
  const results = [];

  const rows = html.split(/<tr>/i);
  for (const row of rows) {
    if (!row.includes('result-link') && !row.includes('uddg=')) continue;
    const linkMatch = row.match(/href="([^"]*uddg=[^"]+)"/i) || row.match(/href="(https?:\/\/[^"]+)"/i);
    const titleMatch = row.match(/class="result-link"[^>]*>([\s\S]*?)<\/a>/i);
    const snippetMatch = row.match(/class="result-snippet"[^>]*>([\s\S]*?)<\/td>/i);
    if (!linkMatch) continue;

    let href = decodeHtml(linkMatch[1]);
    if (href.includes('uddg=')) {
      const uddg = href.match(/uddg=([^&"]+)/);
      if (uddg) href = decodeURIComponent(uddg[1]);
    }

    results.push({
      title: stripTags(titleMatch?.[1] || href),
      url: href,
      snippet: stripTags(snippetMatch?.[1] || '').slice(0, 280),
      source: 'web',
    });
    if (results.length >= limit) break;
  }

  return results;
}

export async function fetchWebContext(query) {
  const tasks = [];

  if (isNewsQuery(query) || /\btoday\b/i.test(query)) {
    tasks.push(fetchNewsResults(query));
  }
  if (isWeatherQuery(query)) {
    tasks.push(fetchWeatherResult(query));
  }
  tasks.push(fetchDuckDuckGoResults(query));

  const batches = await Promise.allSettled(tasks);
  const merged = [];
  const seen = new Set();

  for (const batch of batches) {
    if (batch.status !== 'fulfilled') continue;
    for (const item of batch.value) {
      const key = (item.title + item.url).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return merged.slice(0, 12);
}

export function formatContextBlock(results) {
  if (!results.length) return '';
  return results
    .map((r, i) => {
      const parts = [`[${i + 1}] ${r.title}`];
      if (r.snippet) parts.push(r.snippet);
      if (r.detail) parts.push(r.detail);
      if (r.date) parts.push(`Date: ${r.date}`);
      if (r.url) parts.push(`URL: ${r.url}`);
      return parts.join('\n');
    })
    .join('\n\n');
}

export function formatDirectAnswer(results, query) {
  if (!results.length) {
    return null;
  }

  const lines = [`**SG16 AI — Live results for:** ${query}\n`];
  for (const r of results.slice(0, 8)) {
    lines.push(`• **${r.title}**`);
    if (r.snippet) lines.push(`  ${r.snippet}`);
    if (r.detail) lines.push(`  ${r.detail}`);
    if (r.url) lines.push(`  [Source](${r.url})`);
    lines.push('');
  }
  lines.push('_Answer assembled from live public web sources by SG16 AI._');
  return lines.join('\n');
}
