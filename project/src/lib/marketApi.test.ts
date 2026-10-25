import { describe, expect, it } from 'vitest';

import {
  formatPrice,
  parseBinance,
  parseCoingecko,
  parseRates,
  parseYahooSpark,
  priceMap,
  type MarketOverview,
} from './marketApi';

describe('parseCoingecko', () => {
  it('maps the simple/price payload onto the tracked coins', () => {
    const items = parseCoingecko({
      bitcoin: { usd: 67000.5, usd_24h_change: -1.25 },
      ethereum: { usd: 3500 },
    });
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ symbol: 'BTC', name: 'Bitcoin', price: 67000.5, changePct: -1.25 });
    expect(items[1]).toEqual({ symbol: 'ETH', name: 'Ethereum', price: 3500, changePct: null });
  });

  it('ignores untracked or missing coins and empty input', () => {
    expect(parseCoingecko({ dogecoin: { usd: 0.1 } })[0]?.symbol).toBe('DOGE');
    expect(parseCoingecko(null)).toEqual([]);
    expect(parseCoingecko({})).toEqual([]);
  });
});

describe('parseBinance', () => {
  it('maps 24hr ticker rows onto the tracked pairs', () => {
    const items = parseBinance([
      { symbol: 'BTCUSDT', lastPrice: '67001.10', priceChangePercent: '-1.5' },
      { symbol: 'SOLUSDT', lastPrice: '170.25', priceChangePercent: '3.4' },
      { symbol: 'XRPUSDT', lastPrice: '0.5' },
      { symbol: 'DOGEUSDT', lastPrice: '0.12', priceChangePercent: '2.1' },
    ]);
    expect(items.map((i) => i.symbol)).toEqual(['BTC', 'SOL', 'XRP', 'DOGE']);
    expect(items[0]).toEqual({ symbol: 'BTC', name: 'Bitcoin', price: 67001.1, changePct: -1.5 });
    expect(items[2]).toEqual({ symbol: 'XRP', name: 'XRP', price: 0.5, changePct: NaN });
  });

  it('returns empty for non-array input', () => {
    expect(parseBinance(null)).toEqual([]);
    expect(parseBinance({})).toEqual([]);
  });
});

describe('parseYahooSpark', () => {
  it('uses the last close and computes the change from the previous close', () => {
    const items = parseYahooSpark({
      '^GSPC': { close: [7600, 7650.25], chartPreviousClose: 7663.43 },
      'GC=F': { fulldayPrice: 2350.1, fulldayChangePercent: 0.42 },
    });
    const sp = items.find((i) => i.symbol === '^GSPC');
    const gold = items.find((i) => i.symbol === 'GC=F');
    expect(sp).toEqual({ symbol: '^GSPC', name: 'S&P 500', price: 7650.25, changePct: expect.any(Number) });
    expect(sp!.changePct!).toBeCloseTo(((7650.25 - 7663.43) / 7663.43) * 100, 5);
    expect(gold).toEqual({ symbol: 'GC=F', name: 'Gold (oz)', price: 2350.1, changePct: 0.42 });
  });

  it('drops symbols without a finite price', () => {
    const items = parseYahooSpark({ '^DJI': { close: [] } });
    expect(items).toEqual([]);
  });
});

describe('parseRates', () => {
  it('maps rates onto USD pairs for the tracked currencies', () => {
    const items = parseRates({ rates: { EUR: 0.92, JPY: 149.5, MYR: 4.7 } });
    expect(items).toEqual([
      { pair: 'USD/EUR', rate: 0.92 },
      { pair: 'USD/JPY', rate: 149.5 },
      { pair: 'USD/MYR', rate: 4.7 },
    ]);
  });

  it('returns empty without rates', () => {
    expect(parseRates(null)).toEqual([]);
    expect(parseRates({})).toEqual([]);
  });
});

describe('formatPrice + priceMap', () => {
  it('formats with sensible precision per magnitude', () => {
    expect(formatPrice(67000.5)).toBe('67,001');
    expect(formatPrice(3.14159)).toBe('3.14');
    expect(formatPrice(0.123456)).toBe('0.1235');
  });

  it('merges crypto and quotes by symbol', () => {
    const overview: MarketOverview = {
      crypto: {
        items: [{ symbol: 'BTC', name: 'Bitcoin', price: 67000, changePct: 1 }],
        source: 'CoinGecko',
        updatedAt: null,
        stale: false,
      },
      quotes: {
        items: [{ symbol: '^GSPC', name: 'S&P 500', price: 7650, changePct: -0.2 }],
        source: 'Yahoo Finance',
        updatedAt: null,
        stale: false,
      },
      fx: { items: [], source: null, updatedAt: null, stale: false },
    };
    const map = priceMap(overview);
    expect(map.get('BTC')?.price).toBe(67000);
    expect(map.get('^GSPC')?.name).toBe('S&P 500');
    expect(priceMap(null)).toBeInstanceOf(Map);
  });
});
