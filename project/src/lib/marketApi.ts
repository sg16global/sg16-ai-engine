import { API_V1, apiRequest } from './apiClient';

export interface PriceItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number | null;
}

export interface FxItem {
  pair: string;
  rate: number;
}

export interface Feed<T> {
  items: T[];
  source: string | null;
  updatedAt: string | null;
  stale: boolean;
  error?: string;
}

export interface MarketOverview {
  crypto: Feed<PriceItem>;
  quotes: Feed<PriceItem>;
  fx: Feed<FxItem>;
}

export interface NewsItem {
  title: string;
  url: string;
  publisher: string;
  date: string;
}

export type NewsTopic = 'markets' | 'crypto' | 'ai';

export function fetchMarketOverview() {
  return apiRequest<MarketOverview>(`${API_V1}/market/overview`, { timeoutMs: 30_000 });
}

export function fetchMarketNews(topic: NewsTopic) {
  return apiRequest<Feed<NewsItem>>(`${API_V1}/market/news?topic=${topic}`, { timeoutMs: 30_000 });
}

/** All priced items by symbol (crypto + indices / commodities). */
export function priceMap(o: MarketOverview | null) {
  const map = new Map<string, PriceItem>();
  o?.crypto.items.forEach((i) => map.set(i.symbol, i));
  o?.quotes.items.forEach((i) => map.set(i.symbol, i));
  return map;
}

export function formatPrice(n: number) {
  const digits = n >= 1000 ? 0 : n >= 1 ? 2 : 4;
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
