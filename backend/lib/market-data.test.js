import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMarketOverview,
  parseBinance,
  parseCoingecko,
  parseRates,
  parseYahooSpark,
  setFetchForTests,
} from './marketData.js';
import { cleanResult, formatDirectAnswer } from './webFetcher.js';

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

test('parsers read each source format', () => {
  assert.deepEqual(parseCoingecko({ bitcoin: { usd: 82000, usd_24h_change: -1.5 } }), [
    { symbol: 'BTC', name: 'Bitcoin', price: 82000, changePct: -1.5 },
  ]);
  assert.deepEqual(parseBinance([{ symbol: 'ETHUSDT', lastPrice: '2400.5', priceChangePercent: '0.8' }]), [
    { symbol: 'ETH', name: 'Ethereum', price: 2400.5, changePct: 0.8 },
  ]);
  assert.deepEqual(
    parseYahooSpark({ '^GSPC': { close: [7757.17], chartPreviousClose: 7712.57 } }).map((q) => [
      q.name,
      q.price,
      Number(q.changePct.toFixed(2)),
    ]),
    [['S&P 500', 7757.17, 0.58]],
  );
  assert.deepEqual(parseRates({ rates: { EUR: 0.89, XYZ: 1 } }), [{ pair: 'USD/EUR', rate: 0.89 }]);
});

test('crypto falls back to the next source when the first one fails', async () => {
  setFetchForTests(async (url) => {
    if (url.includes('coingecko')) return json({}, 429);
    if (url.includes('binance')) return json([{ symbol: 'BTCUSDT', lastPrice: '81000', priceChangePercent: '-2' }]);
    return json({}, 500);
  });
  const { crypto, quotes } = await getMarketOverview();
  assert.equal(crypto.source, 'Binance');
  assert.equal(crypto.items[0].price, 81000);
  // No source answered for quotes: empty list with an error, never invented numbers.
  assert.deepEqual(quotes.items, []);
  assert.ok(quotes.error);
  setFetchForTests(null);
});

test('news results: escaped HTML removed, publisher split, junk dropped', () => {
  assert.equal(cleanResult({ title: '****', url: 'https://x.com' }), null);
  const item = cleanResult({
    title: 'Bitcoin slips below $82K - CoinDesk',
    url: 'https://news.example/a',
    snippet: 'Bitcoin slips below $82K CoinDesk',
  });
  assert.equal(item.title, 'Bitcoin slips below $82K');
  assert.equal(item.publisher, 'CoinDesk');
  assert.equal(item.snippet, '');
  assert.equal(cleanResult({ title: 'https://www.cnn.com/', url: 'https://www.cnn.com/' }).title, 'cnn.com');

  const text = formatDirectAnswer(
    [{ title: 'Markets rally - Reuters', url: 'https://r.example/1', date: 'Thu, 22 Oct 2026 06:00:00 GMT' }],
    'market news',
  );
  assert.match(text, /^1\. \[Markets rally\]\(https:\/\/r\.example\/1\) — Reuters · 22 Oct$/m);
  assert.doesNotMatch(text, /<a|href=|\[Source\]/);
});
